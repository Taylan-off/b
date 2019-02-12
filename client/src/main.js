import 'normalize.css'
import Vue from 'vue'
import './plugins'

import App from './App.vue'
import router from './router'
import store from './store'
import './registerServiceWorker'

import './main.css'

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App),
}).$mount('#app')