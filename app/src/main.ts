import { createPinia } from 'pinia'
import { createMetaManager } from 'vue-meta'

import App from './App.vue'
import router from './router'

import 'iconify-icon'
import './assets/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(createMetaManager())

app.mount('#app')
