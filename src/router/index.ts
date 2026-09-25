import {
  createRouter,
  createWebHashHistory,
  type RouteRecordRaw,
} from 'vue-router'
import { h } from 'vue'
import {
  SettingOutlined,
  FileTextOutlined,
  ShopOutlined,
  HeatMapOutlined,
} from '@ant-design/icons-vue'
import { ACCESS_TOKEN_KEY } from '@/utils/request'
import { storage } from '@/utils/storage'

export const header_routes: RouteRecordRaw[] = [
  {
    path: '/my-resume',
    name: 'my-resume',
    meta: {
      title: '我的简历',
      icon: () => h(FileTextOutlined),
    },
    component: () => import('@/views/my-resume/index.vue'),
  },
  {
    path: '/template',
    name: 'template',
    meta: {
      title: '模板中心',
      icon: () => h(ShopOutlined),
    },
    component: () => import('@/views/template/index.vue'),
  },
  {
    path: '/ai-interview',
    name: 'ai-interview',
    meta: {
      title: '模拟面试',
      icon: () => h(HeatMapOutlined),
    },
    component: () => import('@/views/AI-simulation-interview/index.vue'),
  },
  {
    path: '/setting',
    name: 'setting',
    meta: {
      title: '通用设置',
      icon: () => h(SettingOutlined),
    },
    component: () => import('@/views/setting/index.vue'),
  },
]

const routes: RouteRecordRaw[] = [
  // 登录页（独立于 layout，不需要鉴权）
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/index.vue'),
  },
  {
    path: '/',
    name: 'layout',
    component: () => import('@/layout/index.vue'),
    redirect: '/my-resume',
    meta: { requiresAuth: true },
    children: header_routes,
  },
  {
    path: '/edit-resume/:id',
    name: 'edit-resume',
    meta: {
      title: '编辑简历',
      requiresAuth: true,
    },
    component: () => import('@/views/edit-resume/index.vue'),
    props: true,
  },
  {
    // 面试间：独立于 header 布局的专注式页面
    path: '/interview-room',
    name: 'interview-room',
    meta: {
      title: '面试间',
      requiresAuth: true,
    },
    component: () => import('@/views/interview-room/index.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

/**
 * 全局前置守卫
 * - 访问需鉴权路由但未登录 → 跳转登录页并携带 redirect
 * - 已登录访问登录页 → 跳首页
 */
router.beforeEach((to, _from) => {
  const token = storage.get<string>(ACCESS_TOKEN_KEY)
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (requiresAuth && !token) {
    return {
      path: '/login',
      query: { redirect: to.fullPath },
    }
  }

  if (to.path === '/login' && token) {
    return '/'
  }

  return true
})

export default router
