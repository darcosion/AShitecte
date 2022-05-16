#! /usr/bin/env python3

from flask import Flask, jsonify, render_template, request
import json

app = Flask(__name__, template_folder='templates')
app.config["CACHE_TYPE"] = "null"


@app.route('/')
def index():
    return render_template("index.html")

@app.route('/api/json/AS_to_CIDR/<asnumber>')
def conversionAStoCIDR(asnumber):
    list_return_ipcidr = []
    with open('asinfo/routeviews-prefix2as-latest.json', 'r') as listcidr:
        listipcidras = [(i[0], i[1]) for i in json.loads(listcidr.read())]
        listcidr.close()
        for i in listipcidras: #on prend chaque couple IP/CIDR <-> ASN
            if(i[1] == asnumber):
                list_return_ipcidr.append(i[0])

    return jsonify({'cidr_list' : list_return_ipcidr})

if __name__ == "__main__":
    app.run(port=45456, debug=True)