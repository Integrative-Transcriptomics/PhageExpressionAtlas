from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from os import path

# Init. database interface.
db = SQLAlchemy()
# Init. application interface.
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + path.join(path.dirname(path.abspath(__file__)), 'instance/db.sqlite3')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JSON_SORT_KEYS'] = False
db.init_app(app)

from phageexpressionatlas import api

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)