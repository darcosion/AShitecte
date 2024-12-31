// axios lib loaded before 
const { createApp } = Vue;

const app = Vue.createApp({
  mounted() {
    //lancement de la fonction de création du graph lorsque l'app se crée
    this.CreateCytoGraph();
    console.log(this);
  },
	data() {
	  return {
        ASresolving: false,
        ASDataMenu: false,
        ASdata : {
            'ASnumber' : "174", 
            'ASname' : "",
            'data' : {}
        },
        cyto : {},
	  }
	},
	methods: {
    // fonction d'obtention des données de l'AS sur l'API ARIN
    ASresolve() {
      console.log(this);
      // verif AS format
      if(this.ASdata.ASname.startsWith('AS')) {
        this.ASdata.ASname = this.ASdata.ASname.slice(2);
      }
      axios.get('https://rdap.arin.net/registry/autnum/' + this.ASdata.ASnumber ,{
        headers: {'Content-Type': 'application/rdap+json'},
      }).then(response => {
        // handle success
        this.ASresolving = true;
        this.ASdata.ASname = response.data.name;
        this.ASdata.data.info = response.data.entities;
        this.getASneighbours(this.ASdata.ASnumber);
				this.getCIDRbyASN();
      })
      .catch(error => {
        // handle error
        console.log(error);
      })
      .finally(function () {
        // always executed
      });
    }, 
    // fonction de récupération de voisins d'AS
    getASneighbours(asNumber) {
      // on récupère les info d'AS
      axios.get('https://stat.ripe.net/data/asn-neighbours/data.json?resource=AS' + asNumber ,{
        headers: {'Content-Type': 'application/json'},
      }).then(response => {
        // handle success
        this.ASdata.data.neighbours = response.data.data;
      })
      .catch(error => {
        // handle error
        console.log(error);
      })
      .finally(function () {
        // always executed
      });
    },
    // fonction de récupération d'une liste de CIDR appartenant à un AS par son ASN
    getCIDRbyASN() {
      // on crée une requête
      axios.get('/api/json/AS_to_CIDR/' + this.ASdata.ASnumber ,{
        headers: {'Content-Type': 'application/json'},
      }).then(response => {
        // handle success
        this.ASdata.data.cidr = response.data.cidr_list;
      })
      .catch(error => {
        // handle error
        console.log(error);
      })
      .finally(function () {
        // always executed
      });
    },
    // fonction de récupération des traceroutes d'un AS à partir de ses CIDR
    scanDirectAsCIDR() {
      if(!"cidr" in this.ASdata.data) {
        console.log("Le scan ne peut être lancé : pas de liste de CIDR");
      }else {
        // on parcours la liste des CIDR pour obtenir pour chaque CIDR un chemin intéressant
        this.ASdata.data.cidr.forEach(function(cidr, index) {
          let vueThis = this;
          let interval = 25000; // 25 secondes entre chaque scan
          setTimeout(function () {
            axios.post('/api/json/traceroute' , {'asnumber' : vueThis.ASdata.ASnumber, 'cidr' : cidr} ,{
              headers: {'Content-Type': 'application/rdap+json'},
            }).then(response => {
              // handle success
              console.log(response.data);
              if('traces' in response.data){
                response.data.traces.trace_list.forEach(function(trace) {
                  if(trace != null) {
                    vueThis.createGraphByTraces(trace);
                  }
                });
              }
            })
            .catch(error => {
              // handle error
              console.log(error);
            })
            .finally(function () {
              // always executed
            });
          }, index * interval, vueThis);
        }, this);
      }
    },
    // fonction de création de l'objet graph
    CreateCytoGraph() {
      // partie gestion du graph
      this.cyto = cytoscape({
        container: document.getElementById('mynetwork')
      });

      this.options = {
        name: 'fcose', // cose est quand même pas mal...
        fit: true,  // Whether to fit the network view after when done
        padding: 30,
        animate: true, // TODO : l'animation est constante, mais la force n'est pas recalculé, trouvé un moyen pour que ça soit le cas
        animationDuration: 1000,
        animationEasing: 'ease-out',
        //infinite: 'end', // OW SHI__
        nodeDimensionsIncludeLabels: true, // OUUUIIIIII
        randomize: true, // ça semble mettre les noeud dans leur ordre d'arrivée, ça me plait.
        packComponents: true,
      };

      this.styles = [
        {
          selector: 'node',
          css: {
            'color' : '#e27b13',
            'background-color' : '#000000', // --fond-color-tres-noir-bleue
            'background-opacity' : 0.4,
            'border-width': 2,
            'border-color': '#d69c3f', // vicious border
            'content': 'data(id)',
            'font-weight' : 'bolder',
            'text-valign': 'center',
            'text-halign': 'center'
          },
        },
        {
          selector: "node[type = 'AS']",
          css: {
            'background-color' : '#dcf4f3', // ground square
            'border-width': 2,
            'border-color': '#d69c3f', // vicious border
            'background-opacity' : 0.1,
          },
        },
        {
          selector: ':parent',
          css: {
            'text-valign': 'top',
            'text-halign': 'center',
          },
        },
        {
          selector: 'edge',
          css: {
            'line-color' : '#bde4e7',
            'line-opacity' : 0.8,
            'target-arrow-color' : '#d69c3f',
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle'
          },
        },
      ];
      this.cyto.style(this.styles);

      this.runLayout = function() {
        this.layout = this.cyto.layout(this.options);
        this.layout.run();
      };

      this.createGraphByTraces = function(trace) {
        // on commence la création de la vue graphe
        let nodes = [];
        let edges = [];
        let previousNode = null;
        // on crée chaque noeud
        trace.forEach(function(ipnode) {
          // noeud
          nodes.push(
            {
            group:'nodes',
            data: {
                id : ipnode[0],
                label : ipnode[0],
                type : 'IP',
                data : ipnode,
                data_ip : ipnode[0],
                parent : ipnode[1],
              },
            }
          );
          // lien avec le noeud précédent
          if(previousNode != null) {
            edges.push(
              {
                group: 'edges',
                data: {
                  id : previousNode[0] + ' - ' +  ipnode[0],
                  source: ipnode[0],
                  target: previousNode[0],
                }
              }
            )
          }
          previousNode = ipnode;
        });
        // on crée les parents AS number
        // en commencant par une liste d'AS
        let as = []; 
        trace.forEach(function(elem) {
          if(elem[1] != null) {
            as.push(elem[1]);
          }
        });
        // on crée une liste d'AS unique
        as = [... new Set(as)];
        console.log(as);
        // on crée chaque noeud parent d'AS : 
        as.forEach(function(asnode){
          nodes.push(
            {
            group:'nodes',
            data: {
                id : asnode,
                label : asnode,
                type : 'AS',
                data : asnode,
              },
            }
          );
        });
        // on ajoute l'ensemble des ip & as au graph
        this.cyto.add(nodes);
        // on ajoute l'ensemble des lien au graph
        this.cyto.add(edges);
        // on actualise la vue
        this.runLayout();
      };

      // évènement en cas de clic sur un noeud :
      this.cyto.on('tap', 'node', function(evt){
        // on envoie dans la console le noeud pour debug
        console.log(evt.target);
      });
    },
    // fonction de test de trigger
    funcTestTrigger() {
      console.log("trigger !!!");
    },
  },
});

app.use(Quasar);
Quasar.lang.set(Quasar.lang.fr);
Quasar.IconSet.set(Quasar.IconSet.lineAwesome);
app.mount('#ASHApp');