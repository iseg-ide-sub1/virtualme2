import './assets/main.css'
import "@vscode-elements/elements/dist/bundled.js"

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)

app.use(createPinia())

app.mount('#app')
