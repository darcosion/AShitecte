// axios lib loaded before 
const { createApp } = Vue;

//Vue.use(VueMaterial.default);

const app = Vue.createApp({
	data() {
	  return {
        ASresolving: false,
        ASDataMenu: false,
        ASActionMenu: false,
        ASdata : {
            'ASnumber' : "179", 
            'ASname' : "",
            'data' : {}
        },
	  }
	},
	methods: {
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
          console.log(response.data);
          console.log(this);
        })
        .catch(error => {
          // handle error
          console.log(error);
        })
        .finally(function () {
          // always executed
        });
    }
  },
});

app.use(Quasar);
Quasar.lang.set(Quasar.lang.fr);
app.mount('#ASHApp');