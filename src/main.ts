import { createApp } from 'vue'
import App from './App.vue'
import '@/assets/styles/index.scss'
import router from '@/router/index'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(router)
app.use(Antd)
app.use(pinia)
app.mount('#app')
