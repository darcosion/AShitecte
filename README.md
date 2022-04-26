# Objectif

Lorsque l'on découvre un AS, on peut se demander quels sont ses règles de peering avec ses voisins. 

On peut découvrir ces choses là sans accès privilégie de deux façons : 
 - tracerouter tout son réseau interne en espérant voir des IP publiques ou des équipements ne lui appartenant pas
 - tracerouter ses voisons en espérant le voir passer comme intermédiaire

Outre cela, il est également possible d'obtenir ces informations via les grandes bases de donnée de routage de l'internet comme peeringdb, le RIPE NCC ou encore l'IETF. On peut notament relever que les peering officiels peuvent être trouvé sur peeringdb, et les as "voisins" sont obtenables sur l'API stat.ripe.net.

Le présent code vise à résoudre cette problématique.
