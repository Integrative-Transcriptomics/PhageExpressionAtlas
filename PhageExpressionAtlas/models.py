"""
Herein, all models used in the database are defined.
Import models into your app to be able to work with the existing database.
"""

from init import db
import pickle
import pandas as pd
import json
import numpy as np
from scipy.cluster.hierarchy import linkage, leaves_list, dendrogram, cophenet
from scipy.spatial.distance import pdist
from scipy.stats import zscore
import plotly.figure_factory as ff 
import plotly.express as px 

# Define the Phage model
class Phage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))
    ncbi_id = db.Column(db.String, nullable=False)
    phage_type = db.Column(db.String)

    # Relationships
    datasets = db.relationship('Dataset', backref='phage')
    gff_files = db.relationship('PhageGenome', backref='phage')
    
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

    # Relationships
    datasets = db.relationship('Dataset', backref='host')
    gff_files = db.relationship('HostGenome', backref='host')
    
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
    
    def get_unpickled(self):
        
        phage_name = Phage.query.get(self.phage_id).name # get the phage name
        host_name = Host.query.get(self.host_id).name    # get host name
        host_group = Host.query.get(self.host_id).group  # get host name

        # unpickle matrix data
        unpickled_data = pickle.loads(self.matrix_data)
        
        matrix_data = unpickled_data.reset_index().replace({np.nan: None})
        
        # print(matrix_data)
        
        # get column names (time points), exclude non-time points
        non_time_cols = {"Geneid", "Entity", "Symbol", "ClassThreshold", "ClassMax", "Variance"}
        time_points = matrix_data.drop(columns=non_time_cols).columns.tolist()
        
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
    
    def compute_heatmap(self):

        # unpickle matrix data
        unpickled_data = pickle.loads(self.matrix_data)
        
        df = unpickled_data.reset_index().replace({np.nan: None})
        
        # get column names (time points), exclude non-time points
        non_time_cols = {"Geneid", "Entity", "Symbol", "ClassThreshold", "ClassMax", "Variance"}
        time_points = df.drop(columns=non_time_cols).columns.tolist()
        
        # seperate df into phage and host data
        df_phages = df[df['Entity'] == 'phage']
        df_hosts = df[df['Entity'] == 'host']
        
        # reduce the size of hosts by variance
        top_genes = int(len(df_phages))
        df_hosts = df_hosts.nlargest(top_genes, "Variance")
        
        # extract phage and host symbols
        phage_symbols = df_phages['Symbol'].tolist()
        host_symbols = df_hosts['Symbol'].tolist()
        
        # drop all non-numeric columns 
        df_phages_filtered = df_phages.drop(columns=non_time_cols)
        df_hosts_filtered = df_hosts.drop(columns=non_time_cols)
        
        # z-score normalization along the rows
        df_phages_normalized = df_phages_filtered.apply(zscore, axis=1)
        df_hosts_normalized = df_hosts_filtered.apply(zscore, axis=1)
        
        # set index 
        df_phages_normalized.index = phage_symbols
        df_hosts_normalized.index = host_symbols
        
        
        # convert values to numpy array for clustering
        matrix_phage_numpy =df_phages_normalized.values
        matrix_host_numpy =df_hosts_normalized.values
        
        # compute clustering
        linkage_matrix_phage = linkage(matrix_phage_numpy,method='ward')
        ordered_gene_indices_phage = leaves_list(linkage_matrix_phage)
        
        linkage_matrix_host = linkage(matrix_host_numpy,method='ward')
        ordered_gene_indices_host = leaves_list(linkage_matrix_host)
        
        # reorder dataframe rows based on the ordered gene indices
        df_phages_normalized_clustered = df_phages_normalized.iloc[ordered_gene_indices_phage, :]
        df_hosts_normalized_clustered = df_hosts_normalized.iloc[ordered_gene_indices_host, :]
        
        # check cophenetic correlation coefficient, the closer c is to one, the better the clustering
        c_phage, coph_dist = cophenet(linkage_matrix_phage, pdist(matrix_phage_numpy))
        print(c_phage)
        c_host, coph_dist = cophenet(linkage_matrix_host, pdist(matrix_host_numpy))
        print(c_host)
        
        
        fig_dendro = ff.create_dendrogram(matrix_phage_numpy, orientation='right', labels=phage_symbols,
        linkagefun=lambda x: linkage_matrix_phage)


        heatmap_data_phages = {
            'z': df_phages_normalized_clustered.values.tolist(),
            'x': time_points,
            'y': df_phages_normalized_clustered.index.tolist(),
            'dendrogram': fig_dendro.to_json()
        }
        
        heatmap_data_hosts = {
            'x': time_points,
            'y': df_hosts_normalized_clustered.index.tolist(),
            'z': df_hosts_normalized_clustered.values.tolist()
        }
        

        heatmap_data = {
            'phage_data': heatmap_data_phages,
            'host_data': heatmap_data_hosts
        }
        
        
        return heatmap_data if (heatmap_data_phages and heatmap_data_hosts) else None
    
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
        
        df_phages.dropna(inplace = True)
        
        # print(df_phages.isnull())
        # print(df_phages)
        

        
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
        
    
        # pd.set_option('display.max_rows', 300) 
        
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
        
        
        
    
  
class PhageGenome(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable = False)
    phage_id = db.Column(db.Integer, db.ForeignKey('phage.id'))
    gff_data = db.Column(db.LargeBinary, nullable=False) # store pickled gff file
    
    def to_dict(self):
        gff_data_df = pickle.loads(self.gff_data)        # unpickle gff file
        
        csv = gff_data_df.to_csv(index=False)
        
        return {
            'name': self.name,
            'id': self.id,
            'phage_id': self.phage_id,
            'gff_data': csv
        }
    

class HostGenome(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable = False)
    host_id = db.Column(db.Integer, db.ForeignKey('host.id'))
    gff_data = db.Column(db.LargeBinary, nullable=False) # store pickled gff file