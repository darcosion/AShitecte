#! /usr/bin/env python3

from flask import Flask, jsonify, render_template, request

app = Flask(__name__, template_folder='templates')
app.config["CACHE_TYPE"] = "null"


@app.route('/')
def index():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(port=45456, debug=True)