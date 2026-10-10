import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  deleteAccountApi,
  getProfileApi,
  loginApi,
  logoutApi,
  registerApi,
} from '@/api/auth'
import type { LoginParams, RegisterParams, UserInfo } from '@/types/user'
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/utils/request'
import { storage } from '@/utils/storage'
import { clearQueue } from '@/service/syncQueue'
import { clearAllResumesIDB } from '@/service/resumeIDB'

export const useAuthStore = defineStore(
  'auth',
  () => {
    /**
     * accessToken 的响应式引用
     * 初始值从 storage 读取；login/register 时更新；logout/clearAuth 时清空。
     * 不作为 store state 暴露（不 return），因此不会被 persist 持久化，
     * 避免与 storage 中的 token 产生双份数据。令牌对的持久化由 storage 负责
     * （accessToken 与 refreshToken 均在 storage 中，refreshToken 无需进入 store）。
     */
    const token = ref<string | null>(
      storage.get<string>(ACCESS_TOKEN_KEY) || null,
    )

    /** 当前登录用户信息（未登录时为 null） */
    const userInfo = ref<UserInfo | null>(null)

    /** 是否已登录：基于响应式 token ref 判断，login/logout 时会自动更新 */
    const isLoggedIn = computed(() => !!token.value)

    /**
     * 登录
     * 调用接口成功后双令牌已由 API 层写入 storage，这里同步更新响应式 token 与 userInfo
     * @param params - 登录参数（用户名、密码）
     */
    async function login(params: LoginParams) {
      const res = await loginApi(params)
      token.value = res.accessToken
      userInfo.value = res.userInfo
      return res
    }

    /**
     * 注册
     * 注册成功后后端返回双令牌与用户信息，同步更新响应式 token 与 userInfo
     * @param params - 注册参数（用户名、密码、邮箱）
     */
    async function register(params: RegisterParams) {
      const res = await registerApi(params)
      token.value = res.accessToken
      userInfo.value = res.userInfo
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
     * 2. 清除本地双令牌（storage）
     * 3. 响应式状态、离线队列、本地简历缓存统一由 clearAuth 清理
     */
    async function logout() {
      try {
        await logoutApi()
      } catch (err) {
        console.warn('[auth] 后端登出接口异常，仍继续清理本地状态:', err)
      }
      storage.remove(ACCESS_TOKEN_KEY)
      storage.remove(REFRESH_TOKEN_KEY)
      await clearAuth()
    }

    /**
     * 注销账号：删除云端账号数据，本地清理逻辑与退出登录一致（clearAuth）
     */
    async function deleteAccount() {
      await deleteAccountApi()
      storage.remove(ACCESS_TOKEN_KEY)
      storage.remove(REFRESH_TOKEN_KEY)
      await clearAuth()
    }

    /**
     * 清空本地鉴权与用户数据（换号前必须执行，防止数据串号）
     */
    async function clearAuth() {
      token.value = null
      userInfo.value = null
      try {
        await clearQueue()
      } catch (err) {
        console.warn('[auth] 清空同步队列失败:', err)
      }
      try {
        await clearAllResumesIDB()
      } catch (err) {
        console.warn('[auth] 清空本地简历缓存失败:', err)
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
      deleteAccount,
    }
  },
  {
    persist: true,
  },
)
