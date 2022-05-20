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
				let interval = 10000; // 5 secondes entre chaque scan
      			setTimeout(function () {
					let reqUniq = req;
					reqUniq.data['cidr'] = cidr; // on ajout le CIDR qui est à chaque fois différent
					$http(reqUniq).then(
						// si la requête passe :
						function(response) {
							console.log(response.data);
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
});

angular.element(document).ready(function() {
	angular.bootstrap(document, [ 'AShiApp' ]);
});