from flask import Flask, render_template, jsonify, request
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


# -- database routes to fetch data -- 

# .. Route to fetch all phages as a dictionary ..
@app.route("/fetch_phages_dict")
def fetch_phages_dict():
    try:
        phages = Phage.query.all()
        
        phages_dict = [row.to_dict() for row in phages]
    
        if not phages:
            return jsonify({"error": "No phages found"}), 404
        return jsonify(phages_dict), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# .. Route to fetch a specific dictionary based on the selected study and normalization ..
@app.route("/fetch_specific_unpickled_dataset")
def fetch_specific_unpickled_dataset():
    try: 
        selected_study = request.args.get('study')
        normalization = request.args.get('normalization')
        
        dataset = Dataset.query.filter(Dataset.name == selected_study, Dataset.normalization == normalization).all()
        
        for row in dataset:
            dataset_dict = row.get_unpickled()
        
        if not dataset_dict:
            return jsonify({"error": "Could not fetch specific Dataset"}), 404
        
        return dataset_dict,200

    except Exception as e:
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
        return jsonify({"error": str(e)}), 500    

# .. Route for fetching the host heatmap data .. 
@app.route("/fetch_host_heatmap_data")
def fetch_host_heatmap_data():
    try:
        selected_study = request.args.get('study')
        vals = request.args.getlist('vals[]')
        gene_list = request.args.getlist('gene_list[]')
        
        dataset_TPM_mean = Dataset.query.filter(Dataset.name == selected_study, Dataset.normalization == 'TPM_means').all()
    
        if dataset_TPM_mean:
            row = dataset_TPM_mean[0]
            heatmap_host = row.compute_host_heatmap(vals=vals, gene_list=gene_list)
                
        if not heatmap_host:
            return jsonify({"error": "Fetching Graph Data failed, due to at least one being empty"}), 404
        
        
        return heatmap_host,200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500      

# .. Route to fetching the graph data, including: heatmap phages, time series and chord .. 
@app.route("/fetch_graph_data")
def fetch_graph_data():
    try:
        selected_study = request.args.get('study')
        
        dataset_TPM_mean = Dataset.query.filter(Dataset.name == selected_study, Dataset.normalization == 'TPM_means').all()
        dataset_frac = Dataset.query.filter(Dataset.name == selected_study, Dataset.normalization == 'fractional').all()
        
        for row in dataset_TPM_mean:
            heatmap_phages = row.compute_phage_heatmap()
        
        for row in dataset_frac:
            time_series = row.compute_timeseries_data()
            chord = row.compute_chord_data()
        
        graph_data = {
            'heatmap_data_phages': heatmap_phages,
            'chord_data': chord,
            'class_time_data': time_series
        }
        
        if not (heatmap_phages and chord and time_series):
            return jsonify({"error": "Fetching Graph Data failed, due to at least one being empty"}), 404
        
        
        return graph_data,200
    
    except Exception as e:
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
        return jsonify({"error": str(e)}), 500  
    
# .. Route to fetch a specific phage genome ..
@app.route("/fetch_specific_phage_genome")
def fetch_specific_phage_genome():
    try:
        selected_genome = request.args.get('genome')
        selected_dataset = request.args.get('dataset')
        
        phage_genome = PhageGenome.query.filter(PhageGenome.name == selected_genome).all()
        
        for row in phage_genome:
            genome_dict = row.to_dict(selected_dataset)
            
        
        if not genome_dict:
            return jsonify({"error": "Could not fetch Phage Genomes"}), 404
        
        return genome_dict
        
    except Exception as e:
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
        return jsonify({"error": str(e)}), 500  


# .. Route to fetch the host and phage gene size (for dataset exploration sliders) ..
@app.route("/get_host_phage_size")
def get_host_phage_size():
    selected_study = request.args.get('study')
        
    dataset_TPM_mean = Dataset.query.filter(Dataset.name == selected_study, Dataset.normalization == 'TPM_means').all()
    
    for row in dataset_TPM_mean:
        size_dict = row.get_host_phage_size()
        
    if not size_dict:
        return jsonify({"error": "Could not fetch host and phage gene size"}), 404
    
    return size_dict

# @app.route("/fetch_sankey_data")
# def fetch_sankey_data():
    
        
    
if __name__ == "__main__":
    app.run(debug=True)