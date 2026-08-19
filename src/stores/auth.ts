import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getProfileApi, loginApi, logoutApi, registerApi } from '@/api/auth'
import type { LoginParams, RegisterParams, UserInfo } from '@/types/user'
import { TOKEN_KEY } from '@/utils/request'
import { storage } from '@/utils/storage'
import { clearQueue } from '@/service/syncQueue'

export const useAuthStore = defineStore(
  'auth',
  () => {
    /**
     * token 的响应式引用
     * 初始值从 storage 读取；login/register 时更新；logout/clearAuth 时清空。
     * 不作为 store state 暴露（不 return），因此不会被 persist 持久化，
     * 避免与 storage 中的 token 产生双份数据。token 的持久化由 storage 负责。
     */
    const token = ref<string | null>(storage.get<string>(TOKEN_KEY) || null)

    /** 当前登录用户信息（未登录时为 null） */
    const userInfo = ref<UserInfo | null>(null)

    /** 是否已登录：基于响应式 token ref 判断，login/logout 时会自动更新 */
    const isLoggedIn = computed(() => !!token.value)

    /**
     * 登录
     * 调用接口成功后 token 已由 API 层写入 storage，这里同步更新响应式 token 与 userInfo
     * @param params - 登录参数（用户名、密码）
     */
    async function login(params: LoginParams) {
      const res = await loginApi(params)
      token.value = res.token
      userInfo.value = res.user
      return res
    }

    /**
     * 注册
     * 注册成功后后端返回 token 与用户信息，同步更新响应式 token 与 userInfo
     * @param params - 注册参数（用户名、密码、邮箱）
     */
    async function register(params: RegisterParams) {
      const res = await registerApi(params)
      token.value = res.token
      userInfo.value = res.user
      return res
    }

    /**
     * 获取当前用户信息
     * 用于刷新页面后从后端恢复 userInfo
     */
    async function fetchProfile() {
      userInfo.value = await getProfileApi()
    }

    /**
     * 退出登录
     * 1. 调用后端登出接口（即使失败也继续清理本地状态）
     * 2. 清除本地 token（storage）与响应式状态（token ref + userInfo）
     * 3. 清空离线同步队列，防止残留数据污染新账户
     */
    async function logout() {
      console.log('[auth] 开始退出登录')
      try {
        await logoutApi()
        console.log('[auth] 后端登出成功')
      } catch (err) {
        console.warn('[auth] 后端登出接口异常，仍继续清理本地状态:', err)
      }
      token.value = null
      userInfo.value = null
      storage.remove(TOKEN_KEY)
      try {
        await clearQueue()
      } catch (err) {
        console.warn('[auth] 清空同步队列失败:', err)
      }
      console.log('[auth] 退出登录完成')
    }

    /**
     * 清空鉴权状态（响应式 token ref + userInfo + 同步队列）
     * 用于 401 后登录页同步清理：request.ts 已清 storage 中的 token，
     * 此方法负责同步清空 store 内的响应式状态与离线队列，确保 isLoggedIn 变为 false。
     */
    async function clearAuth() {
      console.log('[auth] 清空鉴权状态（401 场景）')
      token.value = null
      userInfo.value = null
      try {
        await clearQueue()
      } catch (err) {
        console.warn('[auth] 清空同步队列失败:', err)
      }
    }

    return {
      userInfo,
      isLoggedIn,
      login,
      register,
      fetchProfile,
      logout,
      clearAuth,
    }
  },
  {
    persist: true,
  },
)
