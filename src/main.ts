import { createApp } from 'vue'
import App from './App.vue'
import '@/assets/styles/index.scss'
import router from '@/router/index'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
const app = createApp(App)

app.use(router)
app.use(Antd)
app.mount('#app')
