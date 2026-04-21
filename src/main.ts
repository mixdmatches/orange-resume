import { createApp } from 'vue'
import App from './App.vue'
import '@/assets/styles/index.scss'
import router from '@/router/index'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { MotionPlugin } from 'motion-v'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(router)
app.use(Antd)
app.use(pinia)
app.use(MotionPlugin, {
  presets: {
    'fade-in': {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.5 },
    },
    'slide-up': {
      initial: { opacity: 0, y: 40 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.5 },
    },
    'scale-in': {
      initial: { opacity: 0, scale: 0.5 },
      animate: { opacity: 1, scale: 1 },
      transition: { type: 'spring', stiffness: 300, damping: 20 },
    },
  },
})
app.mount('#app')
