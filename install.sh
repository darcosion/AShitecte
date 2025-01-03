#!/bin/bash

# on crée l'environnement python du projet
python3 -m venv ./venv
source venv/bin/activate
echo "virtualenv créé"

# on installe les dépendances
pip3 install -r requirements.txt
echo "requirements python3 / projet récupérés"

#on met à jour la db des info d'AS
python3 asinfo/collectas.py
echo "DB de métadonnée d'AS mise à jour depuis source CAIDA"