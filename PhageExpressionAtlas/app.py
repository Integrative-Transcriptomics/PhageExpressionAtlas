from flask import Flask, render_template, jsonify, request
from init import db
from models import *

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite3'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JSON_SORT_KEYS'] = False


db.init_app(app)

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


@app.route("/fetch_pickled_datasets_TPM_only")
def fetch_pickled_datasets_TPM_only():
    try:
        datasets = Dataset.query.filter(Dataset.normalization == "TPM_means").all()
        
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
        normalization = request.args.get('normalization')
        
        dataset = Dataset.query.filter(Dataset.name == selected_study, Dataset.normalization == normalization).all()
        
        for row in dataset:
            heatmap = row.compute_heatmap()
            chord = row.compute_chord_data()
            class_time_series = row.compute_class_timeseries_data()
        
        graph_data = {
            'heatmap_data': heatmap,
            'chord_data': chord,
            'class_time_data': class_time_series
        }
        
        if not heatmap and not chord:
            return jsonify({"error": "Not working"}), 404
        
        
        return graph_data,200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500  
    
    


if __name__ == "__main__":
    app.run(debug=True)