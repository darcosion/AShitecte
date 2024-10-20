
const app = Vue.createApp({
	data() {
	  return {
		UrlToScan: "http://example.com",
		resultUrlWAFScan: "",
		resultUrlEmailGatewayScan: "",
		resultHostingScan: "",
		loadWAFAresult : false,
		loadEmailGatewayresult: false,
		loadHostingresult : false,
	  }
	},
	methods: {
	  getScans(UrlToScan) {
		console.log(UrlToScan);

		// fonction de récupération de scan WAF d'un domaine
		this.loadWAFAresult = true;
		fetch('/api/json/identify_waf', {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({
					'url' : UrlToScan,
				})
			}).then( response => response.json()
			).then(data => {
				this.resultUrlWAFScan = data;
				console.log(data);
				this.loadWAFAresult = false;
				}
			).catch(error => {
				console.log(error);
			});

		// fonction de récupération de scan Gateway d'un domaine
		this.loadEmailGatewayresult = true;
		fetch('/api/json/identify_email_gateway', {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({
					'url' : UrlToScan,
				})
			}).then( response => response.json()
			).then(data => {
				console.log(data);
				this.resultUrlEmailGatewayScan = data;
				this.loadEmailGatewayresult = false;
				}
			).catch(error => {
				console.log(error);
			});

		// fonction de récupération de scan de hosting d'un domaine
		this.loadHostingresult = true;
		fetch('/api/json/identify_hosting', {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({
					'url' : UrlToScan,
				})
			}).then( response => response.json()
			).then(data => {
				console.log(data);
				this.resultHostingScan = data;
				this.loadHostingresult = false;
				}
			).catch(error => {
				console.log(error);
			});
	  }
	},
  });

app.use(Quasar);
Quasar.lang.set(Quasar.lang.fr);
Quasar.iconSet.set(Quasar.iconSet.svgMaterialIcons);
app.mount('#ScantouApp');