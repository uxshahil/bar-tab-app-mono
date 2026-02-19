import { createApp } from 'vue'

import { createPinia } from 'pinia'
import { createMetaManager } from 'vue-meta'

import App from './App.vue'
import router from './router'

import './assets/main.css'
import 'iconify-icon'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(createMetaManager())


app.mount('#app')
