from phageexpressionatlas import app
from phageexpressionatlas.models import *
from flask import render_template, jsonify, request

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


@app.route("/get_phages")
def get_phage_names():
    try:
        phages = Phage.query.all()
        
        phages_dict = [row.to_dict() for row in phages]
    
        if not phages:
            return jsonify({"error": "No phages found"}), 404
        return jsonify(phages_dict), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/get_dataset_table")
def get_dataset():
    try:
        dataset = Dataset.query.all()
        
        dataset_dict = [row.to_dataset_table() for row in dataset]
        
        
        if not dataset_dict:
            return jsonify({"error": "No working"}), 404
        
        
        return (dataset_dict),200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    
    
@app.route("/get_csv")
def get_csv():
    try:
        dataset = Dataset.query.all()
        
        dataset_csv = Dataset.to_csv(dataset)
        
        if not dataset_csv:
            return jsonify({"error": "No working"}), 404
        
        
        return dataset_csv,200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route("/get_unpickled_dataset")
def get_unpickled_dataset():
    try:
        dataset = Dataset.query.all()
        
        dataset_dict = [row.get_unpickled() for row in dataset]
    
    
        if not dataset_dict:
            return jsonify({"error": "No working"}), 404
        
        return dataset_dict,200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/fetch_pickled_datasets")
def fetch_pickled_datasets():
    try:
        datasets = Dataset.query.all()
        
        datasets_dict = [row.to_dict() for row in datasets]
        
        if not datasets_dict:
            return jsonify({"error": "No working"}), 404
        
        
        return datasets_dict,200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500    
    

@app.route("/fetch_unpickled_datasets")
def fetch_unpickled_datasets():
    try:
        datasets = Dataset.query.all()
        
        datasets_dict = [row.get_unpickled() for row in datasets]
    
        if not datasets_dict:
            return jsonify({"error": "Not working"}), 404
        
        return datasets_dict,200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500           


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

# Route for fetching the datasets overview, without the matrix data
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
    
@app.route("/fetch_graph_data")
def fetch_graph_data():
    try:
        selected_study = request.args.get('study')
        
        dataset_TPM_mean = Dataset.query.filter(Dataset.name == selected_study, Dataset.normalization == 'TPM_means').all()
        dataset_frac = Dataset.query.filter(Dataset.name == selected_study, Dataset.normalization == 'fractional').all()
        
        for row in dataset_TPM_mean:
            heatmap = row.compute_heatmap()
        
        for row in dataset_frac:
            time_series = row.compute_timeseries_data()
            chord = row.compute_chord_data()
        
        graph_data = {
            'heatmap_data': heatmap,
            'chord_data': chord,
            'class_time_data': time_series
        }
        
        if not (heatmap and chord and time_series):
            return jsonify({"error": "Fetching Graph Data failed, due to at least one being empty"}), 404
        
        
        return graph_data,200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500  
    
@app.route("/fetch_phage_genomes")
def fetch_phage_genomes():
    try:
        phage_genomes = PhageGenome.query.all()
        
        phage_genomes_dict = [row.to_dict() for row in phage_genomes]
        
        if not phage_genomes_dict:
            return jsonify({"error": "Could not fetch Phage Genomes"}), 404
        
        return phage_genomes_dict
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500  