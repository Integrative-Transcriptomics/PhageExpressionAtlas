"""
Herein, all models used in the database are defined.
"""

from init import db
import pickle
import pandas as pd
import json
import numpy as np
from scipy.cluster.hierarchy import linkage, leaves_list, cophenet
from scipy.spatial.distance import pdist
from scipy.stats import zscore

# Define the Phage model
class Phage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))
    ncbi_id = db.Column(db.String, nullable=False)
    phage_type = db.Column(db.String)

    # -- Relationships --
    datasets = db.relationship('Dataset', backref='phage')
    gff_files = db.relationship('PhageGenome', backref='phage')
    
    # -- Functions --
    
    # Function that returns the Phage Model as dictionary
    def to_dict(self):

        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'ncbi_id': self.ncbi_id,
            'phage_type': self.phage_type
        }

# Define the Host model
class Host(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    group = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))
    ncbi_id = db.Column(db.String, nullable=False)

    # -- Relationships --
    datasets = db.relationship('Dataset', backref='host')
    gff_files = db.relationship('HostGenome', backref='host')
    
    # -- Functions --
    
    # Function that returns the Host Model as dictionary
    def to_dict(self):

        return {
            'id': self.id,
            'name': self.name,
            'group': self.group,
            'description': self.description,
            'ncbi_id': self.ncbi_id,
        }

# Define the Dataset model
class Dataset(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    phage_id = db.Column(db.Integer, db.ForeignKey('phage.id'))
    host_id = db.Column(db.Integer, db.ForeignKey('host.id'))
    matrix_data = db.Column(db.LargeBinary, nullable=False) # store the dataset
    normalization = db.Column(db.String, nullable=False) # either TPM or fractional expression
    name = db.Column(db.String)
    journal = db.Column(db.String)
    year = db.Column(db.Integer)
    firstauthor = db.Column(db.String)
    pubmedID = db.Column(db.String)
    description = db.Column(db.String)
    doi = db.Column(db.String)
    
    
    # -- Functions --
    
    # Function that returns the Dataset Model as dictionary
    def to_dict(self):
        phage_name = Phage.query.get(self.phage_id).name # get the phage name
        
        host_name = Host.query.get(self.host_id).name # get host name
        host_group = Host.query.get(self.host_id).group # get host name
    
        return {
            'source': self.name,
            'id': self.id,
            'phage_id': self.phage_id,
            'phage_name': phage_name,
            'host_id': self.host_id,
            'host_name': host_name,
            'host_group': host_group,
            'matrix_data': 'BLOB',
            'normalization': self.normalization,
            'journal': self.journal,
            'year': self.year,
            'first_author': self.firstauthor,
            'pubmedID': self.pubmedID,
            'description': self.description,
            'doi': self.doi
        }
    
    # Function that returns the Dataset Model as dictionary, but with unpickled matrix data
    def get_unpickled(self):
        
        phage_name = Phage.query.get(self.phage_id).name # get the phage name
        host_name = Host.query.get(self.host_id).name    # get host name
        host_group = Host.query.get(self.host_id).group  # get host name

        # unpickle matrix data
        unpickled_data = pickle.loads(self.matrix_data)
        
        matrix_data = unpickled_data.reset_index().replace({np.nan: None})
        
        # get column names (time points), exclude non-time points
        non_time_cols = {"Geneid", "Entity", "Symbol", "ClassThreshold", "ClassMax", "Variance"}
        time_points = matrix_data.drop(columns=non_time_cols).columns.tolist()
        
        # save it in a dictionary
        json_matrix = {
            "columns": time_points, 
            "data": []
        }
        
        # extract all values
        genes = matrix_data["Geneid"].values
        symbols = matrix_data["Symbol"].values
        entities = matrix_data["Entity"].values
        values = matrix_data[time_points].values 
        thresholds = matrix_data["ClassThreshold"].values
        classMaxes = matrix_data["ClassMax"].values
        variances = matrix_data["Variance"].values


        # append to json matrix by creating a dictionary for each row 
        json_matrix["data"] = [
            {
                "geneID": gene,
                "symbol": symbol,
                "entity": entity,
                "classThresholds": threshold,
                "classMax": classMax,
                "variance": variance,
                "values": value_row.tolist()
            }
            for gene, symbol, entity, threshold, classMax, variance ,value_row in zip(genes, symbols, entities,thresholds, classMaxes, variances, values)
        ]
   
              
        # build the dictionary
        rows_dict = {
            'source': self.name,
            'id': self.id,
            'phage_id': self.phage_id,
            'phage_name': phage_name,
            'host_id': self.host_id,
            'host_name': host_name,
            'host_group': host_group,
            'matrix_data': json.dumps(json_matrix),
            'normalization': self.normalization,
            'journal': self.journal,
            'year': self.year,
            'first_author': self.firstauthor,
            'pubmedID': self.pubmedID,
            'description': self.description,
            'doi': self.doi
        }
        
        return rows_dict
    
    # Function that computes the heatmap data of phages as a dictionary, it z-score normalizes and clusters the data
    def compute_phage_heatmap(self, vals, gene_list):
        # unpickle matrix data
        unpickled_data = pickle.loads(self.matrix_data)
        
        df = unpickled_data.reset_index().replace({np.nan: None})
        
        # get column names (time points), exclude non-time points
        non_time_cols = {"Geneid", "Entity", "Symbol", "ClassThreshold", "ClassMax", "Variance"}
        time_points = df.drop(columns=non_time_cols).columns.tolist()
        
        # seperate df into phage data
        df_phages = df[df['Entity'] == 'phage']
        
        # check if min and max values were given (filtering of phage heatmap gene size via double range slider)
        if(vals):
            minVal = int(vals[0])
            maxVal = int(vals[1])
            
            # sort phages by variance
            df_phages = df_phages.sort_values(by='Variance')
            
            # select subset based on min and max value of double range slider
            df_phages = df_phages.iloc[minVal : maxVal + 1]
            
        
        # check if a gene_list was given (gene selection section, select element)
        if(gene_list):
            df_phages = df_phages[df_phages['Symbol'].isin(gene_list)]
        
        
        # extract phage symbols
        phage_symbols = df_phages['Symbol'].tolist()
        
        # drop all non-numeric columns 
        df_phages_filtered = df_phages.drop(columns=non_time_cols)
        
        
        # z-score normalization along the rows
        df_phages_normalized = df_phages_filtered.apply(zscore, axis=1, result_type='expand')
        
        # set index 
        df_phages_normalized.index = phage_symbols
        
        # compute clustering if min and max value are differnt
        if(vals and (minVal == maxVal)):
            heatmap_data_phages = {
                'z': df_phages_normalized.values.tolist(),
                'x': time_points,
                'y': df_phages_normalized.index.tolist(),
                # 'dendrogram': fig_dendro.to_json()
            }
            
        else:
            # convert values to numpy array for clustering
            matrix_phage_numpy =df_phages_normalized.values
        
            linkage_matrix_phage = linkage(matrix_phage_numpy,method='ward')
            ordered_gene_indices_phage = leaves_list(linkage_matrix_phage)
            
            # reorder dataframe rows based on the ordered gene indices
            df_phages_normalized_clustered = df_phages_normalized.iloc[ordered_gene_indices_phage, :]
            
            # check cophenetic correlation coefficient, the closer c is to one, the better the clustering
            c_phage, coph_dist = cophenet(linkage_matrix_phage, pdist(matrix_phage_numpy))

            # fig_dendro = ff.create_dendrogram(matrix_phage_numpy, orientation='right', labels=phage_symbols,
            # linkagefun=lambda x: linkage_matrix_phage)
            

            heatmap_data_phages = {
                'z': df_phages_normalized_clustered.values.tolist(),
                'x': time_points,
                'y': df_phages_normalized_clustered.index.tolist(),
                # 'dendrogram': fig_dendro.to_json()
            }
        
        return heatmap_data_phages if heatmap_data_phages else None
    
    # Function that computes the heatmap data of hosts as a dictionary, it takes a subset of selected host genes, z-score normalizes and clusters the data
    def compute_host_heatmap(self, vals, gene_list):
        # unpickle matrix data
        unpickled_data = pickle.loads(self.matrix_data)
        
        df = unpickled_data.reset_index().replace({np.nan: None})
        
        # get column names (time points), exclude non-time points
        non_time_cols = {"Geneid", "Entity", "Symbol", "ClassThreshold", "ClassMax", "Variance"}
        time_points = df.drop(columns=non_time_cols).columns.tolist()
        
        # seperate df into host data
        df_hosts = df[df['Entity'] == 'host']
        
        # check if min and max values were given (filtering of host heatmap gene size via double range slider)
        if(vals):
            minVal = int(vals[0])
            maxVal = int(vals[1])
            
            # sort hosts by variance
            df_hosts = df_hosts.sort_values(by='Variance')
            
            # select subset based on min and max value of double range slider
            df_hosts = df_hosts.iloc[minVal : maxVal + 1]
        
        # check if a gene_list was given (gene selection section, select element)
        if(gene_list):
            df_hosts = df_hosts[df_hosts['Symbol'].isin(gene_list)]
            
        # extract host symbols
        host_symbols = df_hosts['Symbol'].tolist()
        
        # drop all non-numeric columns 
        df_hosts_filtered = df_hosts.drop(columns=non_time_cols)
        
        # z-score normalization along the rows
        df_hosts_normalized = df_hosts_filtered.apply(zscore, axis=1, result_type='expand')
        
        # set index 
        df_hosts_normalized.index = host_symbols
        
        if(vals and (minVal == maxVal)):
            # create a dictionary 
            heatmap_data_hosts = {
                'x': time_points,
                'y': df_hosts_normalized.index.tolist(),
                'z': df_hosts_normalized.values.tolist(),
            }
        else:
               
            # convert values to numpy array for clustering
            matrix_host_numpy =df_hosts_normalized.values
            
            
            
            # compute clustering
            linkage_matrix_host = linkage(matrix_host_numpy,method='ward')
            ordered_gene_indices_host = leaves_list(linkage_matrix_host)
            
            # reorder dataframe rows based on the ordered gene indices
            df_hosts_normalized_clustered = df_hosts_normalized.iloc[ordered_gene_indices_host, :]
            
            # check cophenetic correlation coefficient, the closer c is to one, the better the clustering
            c_host, coph_dist = cophenet(linkage_matrix_host, pdist(matrix_host_numpy))

            # create a dictionary 
            heatmap_data_hosts = {
                'x': time_points,
                'y': df_hosts_normalized_clustered.index.tolist(),
                'z': df_hosts_normalized_clustered.values.tolist(),
            }
        
        
        return heatmap_data_hosts if heatmap_data_hosts else None
    
    # Function that computes the data for a chord diagram 
    # TODO: does not work yet 
    def compute_chord_data(self):
        # unpickle matrix data
        unpickled_data = pickle.loads(self.matrix_data)
        
        df = unpickled_data.reset_index().replace({np.nan: None})
        
        # filter the phage data
        df_phages = df[df['Entity'] == 'phage']
        
        # drop all non-numeric columns 
        non_time_cols = {"Geneid", "Entity", "Symbol", "ClassThreshold", "ClassMax", "Variance"}
        df_phages_filtered = df_phages.drop(columns=non_time_cols)
        
        # calculate the logFC value of the largest and smallest timepoint in the dataframe
        df_phages['logFC'] = np.log2(df_phages[df_phages_filtered.columns[-1]] / df_phages[df_phages_filtered.columns[1]] )
        
        df_phages = df_phages.dropna()
        
        # create an adjacency matrix 
        # adj_matrix = pd.crosstab(df_phages['Symbol'], df_phages['ClassMax'])
        
        genes = list(df_phages['Symbol'].unique())
        # classes = list(df_phages['ClassMax'].unique())
        classes = ['early', 'middle', 'late']


        class_colors = {'early': '#2CA02C', 
                        'middle': '#1F77B4',
                        'late': '#9467BD'}  
        
        nodes=[]
        for gene in genes:
            nodes.append({'id': gene, 'group': 'gene'})
        
        for cls in classes:
            nodes.append({'id': cls, 'group': 'class'})
            
        links_classmax = [{"source": row['Symbol'], 
                                "target": row['ClassMax'],
                                "value": 10} for _, row in df_phages.iterrows()]
        
        
        # create (adjacency) matrix 
        node_indices = {node['id']: i for i, node in enumerate(nodes)}
        
        matrix_size = len(nodes)
        matrix = [[0] * matrix_size for _ in range(matrix_size)]
        
        for link in links_classmax:
            source_idx = node_indices[link["source"]]
            target_idx = node_indices[link["target"]]
            matrix[source_idx][target_idx] = link["value"]
        
        
        chord_data = {
            "gene_list": genes,
            "class_list": classes,
            "genes_logFC": [{"name": gene, "logFC": df_phages[df_phages['Symbol'] == gene]['logFC'].values[0]} for gene in genes],
            "class_colors": [{"name": cls, "color": class_colors[cls]} for cls in classes],
            "links_classmax": links_classmax,
            "matrix": matrix
        }
        
        
        
        

        
        return chord_data if chord_data else None
    
    # Function that computes the data for time-series plots and returns it as a dictionary
    def compute_timeseries_data(self):
        # unpickle matrix data
        unpickled_data = pickle.loads(self.matrix_data)
        
        df = unpickled_data.reset_index().replace({np.nan: None})
        df.set_index('Symbol', inplace=True)
       
        # get column names (time points), exclude non-time points
        non_time_cols = {"Geneid", "Entity", "Symbol", "ClassThreshold", "ClassMax", "Variance"}
        
        # filter the phage and host data
        df_phages = df[df['Entity'] == 'phage']
        df_hosts = df[df['Entity'] == 'host']
        
        # drop all non-numeric columns 
        non_time_cols = {"Geneid", "Entity", "Variance"}
        df_phages_filtered = df_phages.drop(columns=non_time_cols)
        df_hosts_filtered = df_hosts.drop(columns=non_time_cols)
        
        # reshape dataframes from wide into long format
        df_phages_melted = df_phages_filtered.melt(id_vars=['ClassMax', 'ClassThreshold'], var_name='Time', value_name='Value', ignore_index=False)
        df_phages_melted.reset_index(inplace=True)
        
        df_hosts_melted = df_hosts_filtered.melt(id_vars=['ClassMax','ClassThreshold'], var_name='Time', value_name='Value', ignore_index=False)
        df_hosts_melted.reset_index(inplace=True)
        
        # convert dataframes into json
        data_dict_phages = df_phages_melted.to_json(orient='records')
        data_dict_hosts = df_hosts_melted.to_json(orient='records')
        
        data_dict = {
            'phages': data_dict_phages,
            'hosts': data_dict_hosts
        }
        
        return data_dict if (data_dict_phages and data_dict_hosts) else None
    
    # Function that returns the size of host and phage genes
    def get_host_phage_size(self):
        # unpickle matrix data
        df = pickle.loads(self.matrix_data)
    
        # filter the phage and host data
        df_phages = df[df['Entity'] == 'phage']
        df_hosts = df[df['Entity'] == 'host']
        
        
        size = {
            'phages': df_phages.shape[0],
            'hosts': df_hosts.shape[0]
        }
        
        return size
    
    def return_timepoints(self):
        # unpickle matrix data
        unpickled_data = pickle.loads(self.matrix_data)
        
        df = unpickled_data.reset_index().replace({np.nan: None})
        df.set_index('Symbol', inplace=True)
       
        # get column names (time points), exclude non-time points
        non_time_cols = {"Geneid", "Entity", "ClassThreshold", "ClassMax", "Variance"}
        
        # filter the phage and host data
        df_phages = df[df['Entity'] == 'phage']
        
        # drop all non-numeric columns 
        df_phages_filtered = df_phages.drop(columns=non_time_cols)
        
        return df_phages_filtered.columns.tolist()
        
    
    # Function that returns classification with custom threshold
    def get_class_custom_threshold_data(self, early, middle, late, threshold):
        """
        Input parameters:
        early: time point threshold for early phase
        middle: time point threshold for middle phase
        late: time point threshold for late phase
        threshold: value between 0 and 1; setting to 0: all classes will be None; setting to 1: all classes will be as in maxTPM

        For T4 phage (Wolfram-Schauerte, 2022) this function reproduces the classThreshold with parameters set to:
        early = 4
        middle = 7
        late = 20
        threshold = 0.2

        Output: Array with dictionaries, and each has a Symbol, Time, gene classification based on a custom threshold, and expression value.
        """


        # List for storing labels
        labels = list()

        # unpickle matrix data
        unpickled_data = pickle.loads(self.matrix_data)
        
        df = unpickled_data.reset_index().replace({np.nan: None})
        df.set_index('Symbol', inplace=True)
       
        # get column names (time points), exclude non-time points
        non_time_cols = {"Geneid", "Entity", "ClassThreshold", "ClassMax", "Variance"}
        
        # filter the phage and host data
        df_phages = df[df['Entity'] == 'phage']
        
        # drop all non-numeric columns 
        df_phages_filtered = df_phages.drop(columns=non_time_cols)
        

        i = 0
        while i < df_phages_filtered.shape[0]:

            # Get array of expression values at time points
            expressions = list(df_phages_filtered.iloc[i,0:df_phages_filtered.shape[1]])

            # Get maximal value for each gene across time points
            maxTPM = max(expressions)

            # Get the threshold value for the gene; threshold should be between 0 and 1
            thresHold = maxTPM*float(threshold)

            # Subset expressions based on threshold
            filteredExpressions = [x for x in expressions if x >= thresHold]

            # Get index of time point
            indices = [expressions.index(x) for x in filteredExpressions]
            timePoint = int(df_phages_filtered.columns.tolist()[min(indices)])

            # Determine early, middle and late time points based on given early, middle, late boundaries
            if timePoint == 0:
                labels.append('None')
            elif timePoint <= int(early):
                labels.append('early')
            elif timePoint <= int(middle):
                labels.append('middle')
            elif timePoint <= int(late):
                labels.append('late')
            elif timePoint > int(late): 
                labels.append('above late bound')
            

            i += 1

        customClasses = {df_phages_filtered.index.tolist()[i] : labels[i] for i in range(df_phages_filtered.shape[0])}
        
        # Add custom classes to the dataframe
        df_phages_filtered["CustomThreshold"] = df_phages_filtered.index.map(customClasses)
        
        # Reshape dataframe from wide into long format
        df_phages_melted = df_phages_filtered.melt(id_vars=["CustomThreshold"], var_name='Time', value_name='Value', ignore_index=False)
        df_phages_melted.reset_index(inplace=True)
        
        # Convert dataframe into json
        data_dict_phages = df_phages_melted.to_json(orient='records')

        return data_dict_phages
    

  
class PhageGenome(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable = False)
    phage_id = db.Column(db.Integer, db.ForeignKey('phage.id'))
    gff_data = db.Column(db.LargeBinary, nullable=False) # store pickled gff file
    
    # -- Functions --
    
    # Function that returns the PhageGenome Model as a dictionary 
    def to_dict(self, dataset):
        
        # .. Process the GFF file .. 
        gff_data_df = pickle.loads(self.gff_data)        # unpickle gff file
        gff_data_df.columns = ["seq_id", "source", "type", "start", "end", "phase", "strand", "score", "attributes"]
       
        # process attributes and split it into seperate cols 
        def seperateAttributes(value):
            result = {}
            pairs = value.strip(';').split(';')
            
            for pair in pairs: 
                key, value = pair.split('=')
                result[key.lower()] = value
            
            return result

        # apply it to the df 
        df_w_attributes= gff_data_df['attributes'].apply(seperateAttributes).apply(pd.Series)
        gff_data_df = pd.concat([gff_data_df, df_w_attributes], axis=1)
        gff_data_df = gff_data_df.drop(columns=['attributes'])
        
        # add columns for adjusted start and end positions for forward and reverse strand
        gff_data_df['adjusted_start'] = gff_data_df['start'] + 100
        gff_data_df['adjusted_end'] = gff_data_df['end'] - 100
        
        # replace empty gene rows with id's, for tiptool annotation of genes and mapping to gene classification
        gff_data_df.loc[gff_data_df['type'] == 'gene', 'gene'] = gff_data_df.loc[gff_data_df['type'] == 'gene', 'gene'].fillna(gff_data_df['id'])
        
        # .. add the gene classes: early, middle, late ..
        # query the dataset to get the matrix data
        matrix_pickled = Dataset.query.filter(Dataset.name == dataset, Dataset.normalization == 'fractional').all()[0].matrix_data
        
        df = pickle.loads(matrix_pickled)         # unpickle the matrix data
        df_phages = df[df['Entity'] == 'phage'].reset_index().rename(columns={"Geneid": "id"})   # filter the phage  data
        
        
        # merge the two dataframes to have the Class Threshold and Class Max inside the df
        gff_data_df = pd.merge(gff_data_df, df_phages[['id','ClassThreshold', 'ClassMax']], on="id", how="outer")
        
        # convert it into json
        json = gff_data_df.to_json(orient="records")
        
        return {
            'name': self.name,
            'id': self.id,
            'phage_id': self.phage_id,
            'gff_data': json,
        }
        
    def to_dict_specific_threshold(self, dataset, early, middle, late, threshold ):
        
        # .. Process the GFF file .. 
        gff_data_df = pickle.loads(self.gff_data)        # unpickle gff file
        gff_data_df.columns = ["seq_id", "source", "type", "start", "end", "phase", "strand", "score", "attributes"]
       
        # process attributes and split it into seperate cols 
        def seperateAttributes(value):
            result = {}
            pairs = value.strip(';').split(';')
            
            for pair in pairs: 
                key, value = pair.split('=')
                result[key.lower()] = value
            
            return result

        # apply it to the df 
        df_w_attributes= gff_data_df['attributes'].apply(seperateAttributes).apply(pd.Series)
        gff_data_df = pd.concat([gff_data_df, df_w_attributes], axis=1)
        gff_data_df = gff_data_df.drop(columns=['attributes'])
        
        # add columns for adjusted start and end positions for forward and reverse strand
        gff_data_df['adjusted_start'] = gff_data_df['start'] + 100
        gff_data_df['adjusted_end'] = gff_data_df['end'] - 100
        
        # replace empty gene rows with id's, for tiptool annotation of genes and mapping to gene classification
        gff_data_df.loc[gff_data_df['type'] == 'gene', 'gene'] = gff_data_df.loc[gff_data_df['type'] == 'gene', 'gene'].fillna(gff_data_df['id'])
        
        # .. add the gene classes: early, middle, late ..
        # query the dataset to get the matrix data
        matrix_pickled = Dataset.query.filter(Dataset.name == dataset, Dataset.normalization == 'fractional').all()[0].matrix_data
        
        df = pickle.loads(matrix_pickled)         # unpickle the matrix data
        df_phages = df[df['Entity'] == 'phage'].reset_index().rename(columns={"Geneid": "id"})   # filter the phage  data
        
        # list for storing labels
        labels = list()
        
        # get column names (time points), exclude non-time points
        non_time_cols = {"id", "Entity", "ClassThreshold", "ClassMax", "Variance", "Symbol"}
        # drop all non-numeric columns 
        df_phages_filtered = df_phages.drop(columns=non_time_cols)
        

        # get classification based on custom threshold
        i = 0
        
        while i < df_phages_filtered.shape[0]:

            # Get array of expression values at time points
            expressions = list(df_phages_filtered.iloc[i,0:df_phages_filtered.shape[1]])
            
            # Get maximal value for each gene across time points
            maxTPM = max(expressions)

            # Get the threshold value for the gene; threshold should be between 0 and 1
            thresHold = maxTPM*float(threshold)

            # Subset expressions based on threshold
            filteredExpressions = [x for x in expressions if x >= thresHold]

            # Get index of time point
            indices = [expressions.index(x) for x in filteredExpressions]
            timePoint = int(df_phages_filtered.columns.tolist()[min(indices)])

            # Determine early, middle and late time points based on given early, middle, late boundaries
            if timePoint == 0:
                labels.append('None')
            elif timePoint <= int(early):
                labels.append('early')
            elif timePoint <= int(middle):
                labels.append('middle')
            elif timePoint <= int(late):
                labels.append('late')
            elif timePoint > int(late): 
                labels.append('above late bound')
            

            i += 1

        customClasses = {df_phages_filtered.index.tolist()[i] : labels[i] for i in range(df_phages_filtered.shape[0])}

        
        # merge the two dataframes to have the Class Threshold and Class Max inside the df
        df_phages["CustomThreshold"] = df_phages.index.map(customClasses)
        gff_data_df = pd.merge(gff_data_df, df_phages[['id','CustomThreshold']], on="id", how="outer")
        # gff_data_df = pd.merge(gff_data_df, df_phages[['id','ClassThreshold', 'ClassMax']], on="id", how="outer")
        
        
        # convert it into json
        json = gff_data_df.to_json(orient="records")
        
        
        print(gff_data_df)
        
        return {
            'name': self.name,
            'id': self.id,
            'phage_id': self.phage_id,
            'gff_data': json,
        }
    
    
    

class HostGenome(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable = False)
    host_id = db.Column(db.Integer, db.ForeignKey('host.id'))
    gff_data = db.Column(db.LargeBinary, nullable=False) # store pickled gff file
    
    # -- Functions --
    
    # Function that returns the HostGenome Model as a dictionary 
    def to_dict(self):
        
        # .. Process the GFF file .. 
        gff_data_df = pickle.loads(self.gff_data)        # unpickle gff file
        gff_data_df.columns = ["seq_id", "source", "type", "start", "end", "phase", "strand", "score", "attributes"]
       
        # process attributes and split it into seperate cols 
        def seperateAttributes(value):
            result = {}
            pairs = value.strip(';').split(';')
            
            for pair in pairs: 
                key, value = pair.split('=')
                result[key.lower()] = value
            
            return result

        # apply it to the df 
        df_w_attributes= gff_data_df['attributes'].apply(seperateAttributes).apply(pd.Series)
        gff_data_df = pd.concat([gff_data_df, df_w_attributes], axis=1)
        gff_data_df = gff_data_df.drop(columns=['attributes'])
        
        # add columns for adjusted start and end positions for forward and reverse strand
        gff_data_df['adjusted_start'] = gff_data_df['start'] + 100
        gff_data_df['adjusted_end'] = gff_data_df['end'] - 100
        
        # replace empty gene rows with id's, for tiptool annotation of genes and mapping to gene classification
        # gff_data_df.loc[gff_data_df['type'] == 'gene', 'gene'] = gff_data_df.loc[gff_data_df['type'] == 'gene', 'gene'].fillna(gff_data_df['id'])
        
        gff_data_df.to_csv("/Users/caroline/Downloads/test")
        
        # convert it into json
        json = gff_data_df.to_json(orient="records")
        
        return {
            'name': self.name,
            'id': self.id,
            'host_id': self.host_id,
            'gff_data': json,
        }