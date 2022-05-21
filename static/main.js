let AShiApp = angular.module('AShiApp', ['ngAnimate', 'ngMaterial', 'ngMessages']);

AShiApp.controller("ParentCtrl", function($scope, $http) {
	$scope.ASresolving = false;
	$scope.ASDataMenu = false;
	$scope.ASActionMenu = false;
	$scope.ASdata = {
		'ASnumber' : undefined, 
		'ASname' : undefined,
		'data' : {}
	};

	// fonction de récupération d'information basique sur AS
	$scope.getASdata = function(asNumber) {
		// on crée une requête
		let req = {
			method : 'GET',
			url : 'https://rdap.arin.net/registry/autnum/' + asNumber,
			headers: {'Content-Type': 'application/rdap+json'},
		};
		// on récupère les info d'AS
		$http(req).then(
			// si la requête passe :
			function(response) {
				$scope.ASresolving = true;
				$scope.ASdata.ASnumber = asNumber;
				$scope.ASdata.ASname = response.data.name;
				$scope.ASdata.data.info = response.data.entities;
				$scope.getASneighbours(asNumber);
				$scope.getCIDRbyASN();
			},
			// si la requête échoue :
			function(error) {
				console.log(error);
			}
		);
	};

	// fonction de récupération de voisins d'AS
	$scope.getASneighbours = function(asNumber) {
		// on crée une requête
		let req = {
			method : 'GET',
			url : 'https://stat.ripe.net/data/asn-neighbours/data.json?resource=AS' + asNumber,
			headers: {'Content-Type': 'application/json'},
		};
		// on récupère les info d'AS
		$http(req).then(
			// si la requête passe :
			function(response) {
				$scope.ASdata.data.neighbours = response.data.data;
				$scope.$apply();
			},
			// si la requête échoue :
			function(error) {
				console.log(error);
			}
		);
	};

	// fonction de récupération d'une liste de CIDR appartenant à un AS par son ASN
	$scope.getCIDRbyASN = function() {
		// on crée une requête
		let req = {
			method : 'GET',
			url : '/api/json/AS_to_CIDR/' + $scope.ASdata.ASnumber,
			headers: {'Content-Type': 'application/json'},
		};
		// on récupère la liste des CIDR
		$http(req).then(
			// si la requête passe :
			function(response) {
				console.log(response.data);
				$scope.ASdata.data.cidr = response.data.cidr_list;
				$scope.$apply();
			},
			// si la requête échoue :
			function(error) {
				console.log(error);
			}
		);
	};

	// fonction de récupération des traceroutes d'un AS à partir de ses CIDR
	$scope.scanDirectAsCIDR = function() {
		if(!"cidr" in $scope.ASdata.data) {
			console.log("Le scan ne peut être lancé : pas de liste de CIDR");
		}else {
			// on crée une requête
			let req = {
				method : 'POST',
				url : '/api/json/traceroute',
				headers: {'Content-Type': 'application/json'},
				data : {'asnumber' : $scope.ASdata.ASnumber, 'cidr' : null}
			};
			// on parcours la liste des CIDR pour obtenir pour chaque CIDR un chemin intéressant
			$scope.ASdata.data.cidr.forEach(function(cidr, index) {
				let interval = 25000; // 25 secondes entre chaque scan
      			setTimeout(function () {
					let reqUniq = req;
					reqUniq.data['cidr'] = cidr; // on ajout le CIDR qui est à chaque fois différent
					$http(reqUniq).then(
						// si la requête passe :
						function(response) {
							$scope.$broadcast('tracesEvent', {'traces' : response.data});
						},
						// si la requête échoue :
						function(error) {
							console.log(error);
						}
					);
				}, index * interval);
			});
		}
	}

	console.log($scope);
 });

AShiApp.controller("graphNetwork", function($scope, $rootScope, $http) {
	// partie gestion du graph
	$scope.cyto = cytoscape({
		container: document.getElementById('mynetwork')
	});

	$scope.options = {
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

	$scope.styles = [
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
	$scope.cyto.style($scope.styles);

	$scope.runLayout = function() {
		$scope.layout = $scope.cyto.layout($scope.options);
		$scope.layout.run();
	}

	$scope.$on('tracesEvent', function(event, args) {
		args.traces.trace_list.forEach(function(trace) {
			if(trace != null) {
				$scope.createGraphByTraces(trace);
			}
		});
	});

	$scope.createGraphByTraces = function(trace) {
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
		let as = trace.map(function(elem) {
			if(elem[1] != null) { return elem[1]; }
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
		$scope.cyto.add(nodes);
		// on ajoute l'ensemble des lien au graph
		$scope.cyto.add(edges);
		// on actualise la vue
		$scope.runLayout();
	};

	// évènement en cas de clic sur un noeud :
	$scope.cyto.on('tap', 'node', function(evt){
		// on envoie dans la console le noeud pour debug
		console.log(evt.target);
	});
});

angular.element(document).ready(function() {
	angular.bootstrap(document, [ 'AShiApp' ]);
});