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
  {
    path: '/',
    name: 'layout',
    component: () => import('@/layout/index.vue'),
    redirect: '/my-resume',
    children: header_routes,
  },
  {
    path: '/edit-resume/:id',
    name: 'edit-resume',
    meta: {
      title: '编辑简历',
    },
    component: () => import('@/views/edit-resume/index.vue'),
    props: true,
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
