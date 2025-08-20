from flask import Flask, render_template, jsonify, request, logging, send_file
from init import db
from models import *

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite3'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JSON_SORT_KEYS'] = False


db.init_app(app)

# -- subpage routes --
@app.route("/")
def index():
    return render_template("home.html")

@app.route("/data-overview")
def overview():  
    return render_template("dataOverview.html")

@app.route("/dataset-exploration")
def exploration():
    return render_template("/datasetExploration.html")

@app.route("/genome-viewer")
def viewer():
    return render_template("/genomeViewer.html")

@app.route("/help")
def help(): 
    return render_template("/help.html")


# -- API's': database routes to fetch data -- 

# .. Route to fetch all phages as a dictionary ..
@app.route("/fetch_phages_dict")
def fetch_phages_dict():
    try:
        # query all phages
        phages = Phage.query.all()
        
        # create dictionary
        phages_dict = [row.to_dict() for row in phages]
    
        if not phages:
            return jsonify({"error": "No phages found"}), 404
        return jsonify(phages_dict), 200
    
    except Exception as e:
        app.logger.error("Error in /fetch_phages_dict", exc_info=True)
        return jsonify({"error": str(e)}), 500

# .. Route to fetch a specific dictionary based on the selected study and normalization ..
@app.route("/fetch_specific_unpickled_dataset")
def fetch_specific_unpickled_dataset():
    try: 
        # get parameters
        selected_study = request.args.get('study')
        normalization = request.args.get('normalization')
        
        # query data
        dataset = Dataset.query.filter(Dataset.name == selected_study, Dataset.normalization == normalization).all()
        
        # process data
        for row in dataset:
            dataset_dict = row.get_unpickled() # get_unpickled defined in models.py
        
        if not dataset_dict:
            return jsonify({"error": "Could not fetch specific Dataset"}), 404
        
        return dataset_dict,200

    except Exception as e:
        app.logger.error("Error in /fetch_specific_unpickled_dataset", exc_info=True)
        return jsonify({"error": str(e)}), 500       


# .. Route for fetching the datasets overview, without the matrix data
@app.route("/fetch_datasets_overview")
def fetch_datasets_overview():
    try:
        # query all datasets with only TPM_means normalization, to avoid duplicate infos and reduce size
        datasets = Dataset.query.filter(Dataset.normalization == "TPM_means").all()
        
        # convert it into dictionary
        datasets_dict = [row.to_dict() for row in datasets]
        
        if not datasets_dict:
            return jsonify({"error": "No working"}), 404
        
        
        return datasets_dict,200
    
    except Exception as e:
        app.logger.error("Error in /fetch_datasets_overview", exc_info=True)
        return jsonify({"error": str(e)}), 500    

# .. Route for fetching the host heatmap data .. 
@app.route("/fetch_host_heatmap_data")
def fetch_host_heatmap_data():
    try:
        # get parameters
        selected_study = request.args.get('study')
        vals = request.args.getlist('vals[]')
        gene_list = request.args.getlist('gene_list[]')
        
        # query dataset
        dataset_TPM_mean = Dataset.query.filter(Dataset.name == selected_study, Dataset.normalization == 'TPM_means').all()
    
        # process fetched data
        if dataset_TPM_mean:
            row = dataset_TPM_mean[0]
            heatmap_host = row.compute_host_heatmap(vals=vals, gene_list=gene_list)
                
        if not heatmap_host:
            return jsonify({"error": "Fetching Host Heatmap Data failed, due to at least one being empty"}), 404
        
        
        return heatmap_host,200
    
    except Exception as e:
        app.logger.error("Error in /fetch_host_heatmap_data", exc_info=True)
        return jsonify({"error": str(e)}), 500     

# .. Route for fetching the phage heatmap data .. 
@app.route("/fetch_phage_heatmap_data")
def fetch_phage_heatmap_data():
    try:
        # get parameters
        selected_study = request.args.get('study')
        vals = request.args.getlist('vals[]')
        gene_list = request.args.getlist('gene_list[]')
        
        # query dataset
        dataset_TPM_mean = Dataset.query.filter(Dataset.name == selected_study, Dataset.normalization == 'TPM_means').all()
    
        # process fetched data
        if dataset_TPM_mean:
            row = dataset_TPM_mean[0]
            heatmap_phage = row.compute_phage_heatmap(vals=vals, gene_list=gene_list)
                
        if not heatmap_phage:
            return jsonify({"error": "Fetching Phage Heatmap Data failed, due to at least one being empty"}), 404
        
        
        return heatmap_phage,200
    
    except Exception as e:
        app.logger.error("Error in /fetch_phage_heatmap_data", exc_info=True)
        return jsonify({"error": str(e)}), 500       

# .. Route to fetching the graph data, including: heatmap phages, time series and chord .. 
@app.route("/fetch_time_series_data")
def fetch_time_series_data():
    try:
        # get parameter
        selected_study = request.args.get('study')
        
        # query fractional dataset based on selected study
        dataset_frac = Dataset.query.filter(Dataset.name == selected_study, Dataset.normalization == 'fractional').all()
        
        # process data
        for row in dataset_frac:
            time_series_data = row.compute_timeseries_data()
        
        
        if not time_series_data:
            return jsonify({"error": "Fetching Data for Phage Gene Expression Profiles failed, due to it being empty"}), 404
        
        
        return time_series_data,200
    
    except Exception as e:
        app.logger.error("Error in /fetch_time_series_data", exc_info=True)
        return jsonify({"error": str(e)}), 500  


# .. Route to fetching phage gene classification data based on a custom threshold .. 
@app.route("/get_class_custom_threshold_data")
def get_class_custom_threshold_data():
    try:
        # get parameters
        selected_study = request.args.get('study')
        early = request.args.get("early")
        middle = request.args.get("middle")
        late = request.args.get("late")
        threshold = request.args.get("threshold")
        
        # query fractional data 
        dataset_frac = Dataset.query.filter(Dataset.name == selected_study, Dataset.normalization == 'fractional').all()
        
        
        for row in dataset_frac:
            data = row.get_class_custom_threshold_data(early, middle, late, threshold)
        
        
        if not data:
            return jsonify({"error": "Fetching Custom Threshold Data failed, due to at it being empty"}), 404
        
        
        return data,200
    
    except Exception as e:
        app.logger.error("Error in /get_class_custom_threshold_data", exc_info=True)
        return jsonify({"error": str(e)}), 500


  
# .. Route to fetch a sunburst data ..
@app.route("/fetch_host_sunburst_data")
def fetch_host_sunburst_data():
    try:
        # query all hosts
        hosts = Host.query.all()
        
        # get all host names and their groups
        df = pd.DataFrame([{"name": h.name, "group": h.group } for h in hosts])
        
        labels = df['name'].unique().tolist() + df['group'].unique().tolist()
        values = df['name'].value_counts().values.tolist() + df['group'].value_counts().values.tolist()
        parents = df['group'].tolist() + (['']*len(df["group"].unique()))
            
        if not labels and values and parents:
            return jsonify({"error": "Could not fetch host sunburst data"}), 404
        
        return {
            'labels': labels, 
            'values': values,
            'parents': parents
        }  
        
    except Exception as e:
        app.logger.error("Error in /fetch_host_sunburst_data", exc_info=True)
        return jsonify({"error": str(e)}), 500  
    
# .. Route to fetch a specific genome via genome name ..
@app.route("/fetch_specific_genome/<name>/<dataset>/<type>")
def fetch_specific_phage_genome(name, dataset, type):
    try:
        
        if(type == 'phage'):
            genome = PhageGenome.query.filter(PhageGenome.name == name).all()
            
            genome_gff = None
            
            for row in genome:
                genome_gff = row.return_gff(dataset)
            
        if(type == 'host'):
            
            genome = HostGenome.query.filter(HostGenome.name == name).all()
            
            for row in genome:
                genome_gff = row.return_gff()
            
        
        if not genome_gff:
            return jsonify({"error": "Could not fetch specific Genome"}), 404
        
        return send_file(
            genome_gff,
            mimetype='text/csv',
            as_attachment=False,
            download_name=f'{name}_{dataset}.csv'
        )
        
    except Exception as e:
        app.logger.error("Error in /fetch_specific_genome/<name>/<dataset>/<type>", exc_info=True)
        return jsonify({"error": str(e)}), 500  

 # .. Route to fetch the genome name by the phage/host name ..
@app.route("/fetch_genome_name_with_organism_name")
def fetch_genome_name_with_organism_name():
    try:
        # get parameters
        organism_name = request.args.get('organism_name')
        type = request.args.get('type')
        
        if(type == 'phage'):
            phage = Phage.query.filter(Phage.name == organism_name).first()
            
            genome_name = phage.genome[0].name
        
        elif(type == 'host'):
            host = Host.query.filter(Host.name == organism_name).first()
            
            genome_name = host.genome[0].name
        
        
        if not genome_name:
            return jsonify({"error": "Could not fetch Phage Genome Name"}), 404
        
        return genome_name
        
    except Exception as e:
        app.logger.error("Error in /fetch_genome_name_with_organism_name", exc_info=True)
        return jsonify({"error": str(e)}), 500  

 
 
@app.route("/get_assembly_maxEnd")
def get_assembly_maxEnd():
    try:
        # get parameters
        selected_genome = request.args.get('genome')
        type = request.args.get('type')
        
        info = None
        
        # query phage genome or host genome
        if(type == "phage"):
            
            genome = PhageGenome.query.filter(PhageGenome.name == selected_genome).all()
                
            for row in genome:
                info = row.get_assembly_maxEnd()
        
        elif (type == "host"):
            genome = HostGenome.query.filter(HostGenome.name == selected_genome).all()
            
            for row in genome:
                info = row.get_assembly_maxEnd()
            
        if not info:
            return jsonify({"error": "Could not Assembly and Max End for Genome"}), 404
        
        return info
    except Exception as e:
        app.logger.error("Error in /get_assembly_maxEnd", exc_info=True)
        return jsonify({"error": str(e)}), 500  

    
# .. Route to fetch a specific phage genome csv file via genome name with a custom gene classification threshold..
@app.route("/fetch_specific_phage_genome_with_custom_threshold/<genome>/<dataset>/<early>/<middle>/<late>/<threshold>")
def fetch_specific_phage_genome_with_custom_threshold(genome, dataset, early, middle, late, threshold):
    try:
        
        # query phage genmome of respective genome
        phage_genome = PhageGenome.query.filter(PhageGenome.name == genome).all()
        
        genome_gff = None
        for row in phage_genome:
            # process data
            genome_gff = row.to_dict_specific_threshold(dataset, early, middle, late, threshold )
            
        
        if not genome_gff:
            return jsonify({"error": "Could not fetch Phage Genomes"}), 404
        
        # send file 
        return send_file(
            genome_gff,
            mimetype='text/csv',
            as_attachment=False,
            download_name=f'{genome}_{dataset}_{early}_{middle}_{late}_{threshold}.csv'
        )
        
    except Exception as e:
        app.logger.error("Error in /fetch_specific_phage_genome_with_custom_threshold", exc_info=True)
        return jsonify({"error": str(e)}), 500  


# .. Route to fetch all phage genome names ..
@app.route("/fetch_phage_genome_names")
def fetch_phage_genome_names():
    try:
        phage_genomes = [name[0] for name in PhageGenome.query.with_entities(PhageGenome.name).distinct().all()]
        
        if not phage_genomes:
            return jsonify({"error": "Could not fetch Phage Genomes"}), 404
        
        return phage_genomes
        
    except Exception as e:
        app.logger.error("Error in /fetch_phage_genome_names", exc_info=True)
        return jsonify({"error": str(e)}), 500  

# .. Route to fetch all dataset names/studies based on the phage genome name..
@app.route("/fetch_datasets_based_on_genome")
def fetch_datasets_based_on_genome():
    try:
        genome_name = request.args.get('genome')
        
        # get phage genome based on the genome name
        phage_genome = PhageGenome.query.filter(PhageGenome.name == genome_name).all()
        
        # filter for datasets which have the same phage id as the genome
        datasets = Dataset.query.filter(Dataset.phage_id == phage_genome[0].phage_id).with_entities(Dataset.name).distinct().all()
        
        datasets_list = [dataset[0] for dataset in datasets]
            
        if not datasets_list:
            return jsonify({"error": "Could not fetch Phage Genomes"}), 404
        
        return datasets_list    
        
    except Exception as e:
        app.logger.error("Error in /fetch_datasets_based_on_genome", exc_info=True)
        return jsonify({"error": str(e)}), 500  


# .. Route that fetches the nr of unique studies in the database ..
@app.route("/fetch_nr_of_studies")
def fetch_nr_of_studies():
    try:

        # filter for datasets which have the same phage id as the genome
        datasets = Dataset.query.filter(Dataset.normalization == "TPM_means").with_entities(Dataset.name).distinct().all()
        
        datasets_list = [dataset[0] for dataset in datasets]
            
        if not datasets_list:
            return jsonify({"error": "Could not fetch nr of studies"}), 404
        
        return str(len(datasets_list))    
        
    except Exception as e:
        app.logger.error("Error in /fetch_nr_of_studies", exc_info=True)
        return jsonify({"error": str(e)}), 500  

# .. Route to fetch the timepoints of a specifc dataset (for custom threshold selects) ..
@app.route("/return_timepoints")
def return_timepoints():
    try:
        # get study parameter
        selected_study = request.args.get('study')
        
        # fetch dataset of selected study and mean TPM normalization
        dataset_TPM_mean = Dataset.query.filter(Dataset.name == selected_study, Dataset.normalization == 'TPM_means').all()
        
        for row in dataset_TPM_mean:
            timepoints = row.return_timepoints()
            
        if not timepoints:
            return jsonify({"error": "Could not fetch host and phage gene size"}), 404
        
        return timepoints
        
    except Exception as e:
        app.logger.error("Error in /return_timepoints", exc_info=True)
        return jsonify({"error": str(e)}), 500  
    

# .. Route to fetch the host and phage gene size (for dataset exploration sliders) ..
@app.route("/get_host_phage_size")
def get_host_phage_size():
    try:
        # get study parameter
        selected_study = request.args.get('study')
        
        # fetch dataset of selected study and mean TPM normalization
        dataset_TPM_mean = Dataset.query.filter(Dataset.name == selected_study, Dataset.normalization == 'TPM_means').all()

        for row in dataset_TPM_mean:
            size_dict = row.get_host_phage_size()
            
        if not size_dict:
            return jsonify({"error": "Could not fetch host and phage gene size"}), 404

        return size_dict
    
    except Exception as e:
        app.logger.error("Error in /get_host_phage_size", exc_info=True)
        return jsonify({"error": str(e)}), 500  
        
    
        
    
if __name__ == "__main__":
    app.run(debug=True)