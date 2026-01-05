import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.decomposition import PCA


# Adding annotation to metadata, matching samples in raw counts table

def annotateData(df, sampleDict):
    dfOut = df.copy()
 
    dfOut['SampleID'] = dfOut['Run'].astype(str) + '_sorted.bam'

    dfOut.index = dfOut['Sample Name']

    dfOut['SampleNames'] = pd.Series(sampleDict)
    dfOut.index = dfOut['SampleID']

    return dfOut

# Changing column names based on annotated metadata

def changeColnames(df, meta):
    newCols = meta.loc[df.columns]['SampleNames']
    df.columns = newCols
    df = df.reindex(sorted(df.columns), axis =1)

    return df

# Add pharokka annotation

def add_pharokka(gff_df, pharokka_path):
    
    """
    Input: curated gff_df
    Path to pharokka output tsv file
    Output: three pharokka columns merged to gff data
    """   
    
    pharokka_df = pd.read_csv(pharokka_path, sep='\t')

    # Keep only required Pharokka columns
    pharokka_sub = pharokka_df[["ID", "annot", "phrog", "category"]].copy()
    pharokka_sub = pharokka_sub.rename(columns={"phrog": "PHROG"})
    
    # Left join (preserve all GFF rows)
    merged = gff_df.merge(
        pharokka_sub,
        on="ID",
        how="left"
    )
    
    # Fill missing values according to instructions
    merged["annot"] = merged["annot"].fillna(merged["product"])
    merged["category"] = merged["category"].fillna(merged["gene_biotype"])
    merged["PHROG"] = merged["PHROG"].fillna("No_PHROG")
    
    return merged

# Add pharokka annotation for 2 phages

def add_pharokka_dual(gff_df, pharokka_path1, pharokka_path2):
    
    """
    Input: curated gff_df
    Path to pharokka output tsv file
    Output: three pharokka columns merged to gff data
    """   
    
    pharokka_df1 = pd.read_csv(pharokka_path1, sep='\t')
    pharokka_df2 = pd.read_csv(pharokka_path2, sep='\t')
    pharokka_df = pd.concat([pharokka_df1, pharokka_df2], axis=0)

    # Keep only required Pharokka columns
    pharokka_sub = pharokka_df[["ID", "annot", "phrog", "category"]].copy()
    pharokka_sub = pharokka_sub.rename(columns={"phrog": "PHROG"})
    
    # Left join (preserve all GFF rows)
    merged = gff_df.merge(
        pharokka_sub,
        on="ID",
        how="left"
    )
    
    # Fill missing values according to instructions
    merged["annot"] = merged["annot"].fillna(merged["product"])
    merged["category"] = merged["category"].fillna(merged["gene_biotype"])
    merged["PHROG"] = merged["PHROG"].fillna("No_PHROG")
    
    return merged

# Perform in silico rRNA depletion

def rRNAdepletion(df, rRNAs):
    genes = list(set(df.index) - set(rRNAs))
    df = df.loc[genes,:]
    return df

# Function for conversion to TPM and addition of pseudocount

def TPM(df, meta, pse):
    """
    df: rRNA depleted input table
    meta: original dataframe including 'Length' column
    pse: pseudocount
    """
    
    lengths = meta.loc[df.index,'Length']
    tpmData = df.copy()

    for i in range(0,tpmData.shape[1]):
        rpk = (tpmData.iloc[:,i]+pse)/lengths
        scalingfactor = np.sum(rpk)/1000000
        tpm = rpk/scalingfactor

        tpmData.iloc[:,i] = tpm
    
    return tpmData

# Function for conversion to log2(x+1)

def logNorm(df):
    """
    df: rRNA depleted input table
    """
    
    logData = df.copy()
    logData = np.log2(np.array(logData)+1) # add 1 to have at least always positive values
    logData = pd.DataFrame(logData, index = df.index, columns = df.columns)
    
    return logData

# Function for PCA and visualization

def txPCA(df):
    Df = df.transpose().to_numpy()
    pca = PCA(n_components=2)
    components = pca.fit_transform(Df)
    X = pd.DataFrame(pd.concat([pd.DataFrame(components, index=df.columns), pd.DataFrame(df.columns.tolist(), index=df.columns)], axis = 1, ignore_index=False))
    X.columns = ["Dim1", "Dim2", "Sample"]
    X['TimePoint'] = X['Sample'].str.split('_', expand=True).iloc[:,0]
    X['Replicate'] = X['Sample'].str.split('_', expand=True).iloc[:,1]
    ax = sns.scatterplot(x = "Dim1", y = "Dim2", data = X, hue = "TimePoint", style = "Replicate")
    sns.move_legend(ax, "upper left", bbox_to_anchor=(1, 1))
    ax.set_xlabel("Dim 1 (explained variance " + str(round(pca.explained_variance_ratio_[0] *100, ndigits=2)) + " %)")
    ax.set_ylabel("Dim 2 (explained variance " + str(round(pca.explained_variance_ratio_[1] *100, ndigits=2)) + " %)")

# Getting mean and sd for samples of same time points

def getMeanSD(df):
    # Get samples
    sampleBase = set([x[:-1] for x in df.columns])
    samples = [x[:-1] for x in df.columns]
    
    # Define a new dataframe to store mean and sd
    newCols = [x[:-2] for x in sampleBase]
    means = df.iloc[:,:len(newCols)]
    means.columns = newCols

    newCols = [x[:-2] for x in sampleBase]
    sds = df.iloc[:,:len(newCols)]
    sds.columns = newCols

    # Loop over sample base
    for base in sampleBase:
        
        indices = [i for i in range(0,len(samples)) if base == samples[i]]
        mean = base[:-2]
        sd = base[:-2]

        means[mean] = np.mean(df.iloc[:,indices], axis = 1)
        sds[sd] = np.std(df.iloc[:,indices], axis = 1)

    return pd.DataFrame(means), pd.DataFrame(sds)

# Use TPM-normalized means to scale to highest expression per gene across time points

def proportionalExp(df):
    normExp = df.copy()
    for i in range(normExp.shape[0]):
        maxValue = np.max(np.array(normExp.iloc[i,:]))
        normExp.iloc[i,:] = normExp.iloc[i,:]/maxValue

    return normExp

# Make gene symbols unique using index (gene IDs)

def make_unique_with_index(df):
    count_dict = {}
    unique_list = []
    
    lst = df['Symbol'].tolist()
    index = df.index.tolist()

    for i in range(0, len(lst)):
        item = lst[i]
        if item in count_dict:
            count_dict[item] += 1
            new_item = f"{index[i]}_gene_{item}"
        else:
            count_dict[item] = 0
            new_item = item
        
        unique_list.append(new_item)
    
    df_new = df
    df_new['Symbol'] = unique_list
    
    return df_new

# Make gene symbols unique

def make_unique(lst):
    count_dict = {}
    unique_list = []
    
    for item in lst:
        if item in count_dict:
            count_dict[item] += 1
            new_item = f"{item}_{count_dict[item]}"
        else:
            count_dict[item] = 0
            new_item = item
        
        unique_list.append(new_item)
    
    return unique_list