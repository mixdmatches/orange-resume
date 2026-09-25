import { createApp } from 'vue'
import App from './App.vue'
import '@/assets/styles/index.scss'
import router from '@/router/index'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { MotionPlugin } from 'motion-v'
import { useAuthStore } from './stores/auth'
import { ACCESS_TOKEN_KEY } from './utils/request'
import { storage } from './utils/storage'
import { initRepository } from './service/resumeRepository'

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
/**
 * 应用挂载前恢复用户信息
 * 若本地存在 token，异步拉取用户信息填充 store（不阻塞挂载）。
 * token 失效时由 request.ts 拦截器处理 401 跳转登录页。
 *
 * 同时启动 Local-First 同步引擎：注册 online/offline 监听，
 * 并回放上次未同步完的离线操作队列（如果有的话）。
 */
if (storage.get<string>(ACCESS_TOKEN_KEY)) {
  useAuthStore()
    .fetchProfile()
    .catch(() => {
      // 拦截器已统一处理 401 跳转，此处无需额外处理
    })
  // 启动 Repository：注册网络监听 + 回放离线队列
  initRepository()
}

app.mount('#app')
