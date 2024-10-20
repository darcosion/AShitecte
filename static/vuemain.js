
const app = Vue.createApp({
	data() {
	  return {
        ASresolving: false,
        ASDataMenu: false,
        ASActionMenu: false,
        ASdata : {
            'ASnumber' : undefined, 
            'ASname' : undefined,
            'data' : {}
        },
	  }
	},
	methods: {

	},
  });

app.use(Quasar);
Quasar.lang.set(Quasar.lang.fr);
Quasar.iconSet.set(Quasar.iconSet.svgMaterialIcons);
app.mount('#ASHApp');

