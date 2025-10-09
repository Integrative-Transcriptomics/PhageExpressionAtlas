# PhageExpressionAtlas

The PhageExpressionAtlas is a web application for interactive exploration of various bacteriophage infections on the transcriptional level based on publicly available dual RNA-seq data. 

The aim of the Atlas is to enable researchers to gain new insights into areas such as Gene Expression during Phage-Host interactions and Phage Gene Classification. 

## Access:
The PhageExpressionAtlas can be accessed online via https://phageexpressionatlas.cs.uni-tuebingen.de, or by running it locally on your machine. 

## How to run the Altas locally: 
After installing the requirements in the requirements.txt file, run the following command in your terminal:  (Note: before running, make sure you are inside the inner PhageExpressionAtlas folder which contains the app.py file) 


```bash
python app.py
```
or 

```bash
flask run
```

Subsequently, you will see something like this: 
```bash
* Serving Flask app 'app'
* Debug mode: on
WARNING: This is a development server. Do not use it in a production deployment.
* Running on http://127.0.0.1:5000
Press CTRL+C to quit
```
This means that the app is running locally on your machine at http://127.0.0.1:5000. 

To view the the Atlas, open your web browser and visit http://127.0.0.1:5000. 

## Implement a custom database

Replace the database file ```PhageExpressionAtlas/instance/db.sqlite3``` with your custom database(, which should be same identically!).
To create your custom database, adapt and use the script ```PhageExpressionAtlas/fill_db.py```, which details examples to successively fill the database. Make sure, when filling the database, that all data normalization types are added to the database, since they are required for functionality of the atlas.
In ```PhageExpressionAtlas/models.py``` the entire database classes are defined.

## Contact

Please contact [Maik Wolfram-Schauerte](maik.wolfram-schauerte@uni-tuebingen.de) for questions and feedback.