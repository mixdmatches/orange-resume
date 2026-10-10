import {
  createRouter,
  createWebHashHistory,
  type RouteRecordRaw,
} from 'vue-router'
import { h } from 'vue'
import {
  FileTextOutlined,
  ShopOutlined,
  HeatMapOutlined,
  UserOutlined,
  ToolOutlined,
  TranslationOutlined,
  EditOutlined,
  FundOutlined,
} from '@ant-design/icons-vue'
import { ACCESS_TOKEN_KEY } from '@/utils/request'
import { storage } from '@/utils/storage'

/** 导航项类型：普通按钮 or 下拉分组 */
export type NavItemType = 'item' | 'dropdown'

/** 统一的 header 导航配置（包含普通项和下拉分组）*/
export interface HeaderNavItem {
  /** 类型：普通按钮 或 下拉分组 */
  type: NavItemType
  /** 显示文字 */
  label: string
  /** 图标渲染函数 */
  icon: () => any
  /** 按钮类型的路由路径（type='item' 时使用）*/
  path?: string
  /** 下拉分组的子项（type='dropdown' 时使用）*/
  children?: NavDropdownChild[]
}

/** 下拉子项 */
export interface NavDropdownChild {
  path: string
  title: string
  icon: () => any
}

/** AI 工具子路由（下拉菜单）*/
export const ai_tools_routes: RouteRecordRaw[] = [
  {
    path: '/ai-tools/translate',
    name: 'ai-translate',
    meta: {
      title: 'AI 翻译简历',
      icon: () => h(TranslationOutlined),
      group: 'ai-tools',
    },
    component: () => import('@/views/ai-tools/translate/index.vue'),
  },
  {
    path: '/ai-tools/polish',
    name: 'ai-polish',
    meta: {
      title: 'AI 润色简历',
      icon: () => h(EditOutlined),
      group: 'ai-tools',
    },
    component: () => import('@/views/ai-tools/polish/index.vue'),
  },
  {
    path: '/ai-tools/analyze',
    name: 'ai-analyze',
    meta: {
      title: 'ATS 简历诊断',
      icon: () => h(FundOutlined),
      group: 'ai-tools',
    },
    component: () => import('@/views/ai-tools/analyze/index.vue'),
  },
  {
    path: '/ai-interview',
    name: 'ai-interview',
    meta: {
      title: 'AI 模拟面试',
      icon: () => h(HeatMapOutlined),
      group: 'ai-tools',
    },
    component: () => import('@/views/AI-simulation-interview/index.vue'),
  },
]

/** Header 导航统一数据源 */
export const header_nav_items: HeaderNavItem[] = [
  {
    type: 'item',
    label: '我的简历',
    icon: () => h(FileTextOutlined),
    path: '/my-resume',
  },
  {
    type: 'item',
    label: '模板中心',
    icon: () => h(ShopOutlined),
    path: '/template',
  },
  {
    type: 'dropdown',
    label: 'AI 工具',
    icon: () => h(ToolOutlined),
    children: ai_tools_routes.map(r => ({
      path: r.path,
      title: r.meta?.title as string,
      icon: (r.meta?.icon as () => any) ?? (() => h(ToolOutlined)),
    })),
  },
  {
    type: 'item',
    label: '个人中心',
    icon: () => h(UserOutlined),
    path: '/profile',
  },
]

/** 普通路由 */
export const header_routes: RouteRecordRaw[] = [
  {
    path: '/my-resume',
    name: 'my-resume',
    meta: { title: '我的简历', icon: () => h(FileTextOutlined) },
    component: () => import('@/views/my-resume/index.vue'),
  },
  {
    path: '/template',
    name: 'template',
    meta: { title: '模板中心', icon: () => h(ShopOutlined) },
    component: () => import('@/views/template/index.vue'),
  },
  {
    path: '/profile',
    name: 'profile',
    meta: { title: '个人中心', icon: () => h(UserOutlined) },
    component: () => import('@/views/profile/index.vue'),
  },
]

const routes: RouteRecordRaw[] = [
  // 营销主页（独立于 layout，不需要鉴权）
  {
    path: '/',
    name: 'landing',
    component: () => import('@/views/landing/index.vue'),
  },
  // 登录页（独立于 layout，不需要鉴权）
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/index.vue'),
  },
  {
    path: '/app',
    name: 'layout',
    component: () => import('@/layout/index.vue'),
    redirect: '/my-resume',
    meta: { requiresAuth: true },
    children: [...header_routes, ...ai_tools_routes],
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
    return '/app'
  }

  return true
})

export default router
