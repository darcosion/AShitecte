#!/bin/bash

# on crée l'environnement python du projet
python3 -m venv ./venv
source venv/bin/activate

# on installe les dépendances
pip3 install -r requirements.txt
