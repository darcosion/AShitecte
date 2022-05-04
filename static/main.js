let AShiApp = angular.module('AShiApp', ['ngAnimate']);

AShiApp.controller("ParentCtrl", function($scope, $http) {
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
				console.log(response.data);
				// on envoie les données pour traitement
			},
			// si la requête échoue :
			function(error) {
				console.log(error);
			}
		);
	};
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