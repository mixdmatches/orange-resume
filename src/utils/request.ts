import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { message } from 'ant-design-vue'
import { storage } from './storage'
import { ErrorCode } from '@/types/code'
import type { LoginResult } from '@/types/user'
import router from '@/router'

export const ACCESS_TOKEN_KEY = 'accessToken'
export const REFRESH_TOKEN_KEY = 'refreshToken'

export interface ApiResult<T = unknown> {
  code: number
  message: string
  data: T
}

/**
 * 统一错误提示：相同内容共用同一个 key，并发请求失败时只弹一条
 */
function showError(tip: string) {
  message.error({ content: tip, key: tip })
}

/**
 * 跳转到登录页
 * 用于刷新失败、鉴权彻底失效场景。直接使用 router 单例跳转。
 */
export function redirectToLogin() {
  // 已在登录页时不再重复跳转
  if (!window.location.hash.startsWith('#/login')) {
    router.push('/login')
  }
}

/**
 * 强制登出清理
 */
function forceLogout() {
  storage.remove(ACCESS_TOKEN_KEY)
  storage.remove(REFRESH_TOKEN_KEY)
  redirectToLogin()
}

export const DEFAULT_TIMEOUT = 15000
export const AI_TIMEOUT = 120000

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
})

/**
 * 请求拦截器
 */
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.get<string>(ACCESS_TOKEN_KEY)
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error),
)

/**
 * 进行中的刷新 Promise（单飞/合并并发标记）
 */
let refreshingPromise: Promise<boolean> | null = null

/**
 * 使用 refreshToken 静默换取新令牌对
 * @returns 刷新是否成功；成功后新令牌已写入 storage
 */
function refreshTokens(): Promise<boolean> {
  // 合并并发：已有进行中的刷新则共享同一个 Promise
  if (refreshingPromise) {
    return refreshingPromise
  }

  refreshingPromise = (async () => {
    const refreshToken = storage.get<string>(REFRESH_TOKEN_KEY)
    // 无 refreshToken 可用（旧版单 token 登录态 / 已清理），直接判定失效
    if (!refreshToken) {
      return false
    }
    try {
      const res = await axios.post<ApiResult<LoginResult>>(
        `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
        { refreshToken },
        { timeout: DEFAULT_TIMEOUT },
      )
      // 刷新成功：整体覆盖保存新令牌对（refresh 轮换，旧令牌已作废）
      if (res.data?.code === ErrorCode.SUCCESS && res.data?.data) {
        const { accessToken, refreshToken: newRefreshToken } = res.data.data
        storage.set(ACCESS_TOKEN_KEY, accessToken)
        storage.set(REFRESH_TOKEN_KEY, newRefreshToken)
        return true
      }
      return false
    } catch {
      // refreshToken 无效/过期/类型错误（后端返回 code=40101），判定失效
      return false
    } finally {
      // 刷新结束，允许下一轮 401 再次触发（此时令牌已更新或已登出）
      refreshingPromise = null
    }
  })()

  return refreshingPromise
}

/**
 * 401 统一处理：静默刷新后重放原请求
 * @param config - 原请求配置（业务分支取 response.config，HTTP 错误分支取 error.config）
 * @returns 重放请求的响应 Promise；刷新失败时 reject 并强制登出
 */
async function handleUnauthorized(
  config: InternalAxiosRequestConfig,
): Promise<AxiosResponse> {
  // 已重放过一次仍 401，或刷新接口自身 401：不再刷新，直接强制登出，
  // 避免持续 401 的接口触发「刷新→重放→再 401」的无限循环
  if ((config as any)._retry || config.url?.includes('/auth/refresh')) {
    showError('登录已过期，请重新登录')
    forceLogout()
    throw new Error('登录已过期，请重新登录')
  }
  // 标记重放，防止二次 401 时再次进入刷新流程
  ;(config as any)._retry = true

  const ok = await refreshTokens()
  if (!ok) {
    showError('登录已过期，请重新登录')
    forceLogout()
    throw new Error('登录已过期，请重新登录')
  }

  // 刷新成功：用新 accessToken 重放原请求
  config.headers.Authorization = `Bearer ${storage.get<string>(ACCESS_TOKEN_KEY)}`
  return service(config)
}

/**
 * 响应拦截器
 */
service.interceptors.response.use(
  (response: AxiosResponse<ApiResult>) => {
    // 文件流等非 JSON 响应直接返回原始 response，交由调用方处理
    if (
      response.config.responseType === 'blob' ||
      response.config.responseType === 'arraybuffer'
    ) {
      return response
    }

    const res = response.data
    // 业务成功：code 为 200 或 0 均视为成功
    if (res.code === ErrorCode.SUCCESS) {
      return res as unknown as AxiosResponse
    }

    // 401：accessToken 失效，静默刷新令牌对并重放原请求（不弹错误提示）
    if (res.code === ErrorCode.UNAUTHORIZED) {
      return handleUnauthorized(response.config)
    }

    // 其他业务失败：统一提示
    showError(res.message || '请求失败')
    return Promise.reject(new Error(res.message || 'Error'))
  },
  async error => {
    const status = error?.response?.status

    // HTTP 401：accessToken 失效，静默刷新并重放。
    if (status === 401 && error?.config) {
      return handleUnauthorized(error.config)
    }

    let tip = '网络异常，请稍后重试'

    if (error.code === 'ECONNABORTED') {
      // 请求超时
      tip = '请求超时，请稍后重试'
    } else if (status === ErrorCode.FORBIDDEN) {
      tip = '没有权限访问'
    } else if (status === ErrorCode.NOT_FOUND) {
      tip = '请求的资源不存在'
    } else if (status && status >= ErrorCode.INTERNAL_ERROR) {
      tip = '服务器开小差了，请稍后重试'
    } else if (error?.response?.data?.message) {
      // 后端返回了具体错误信息
      tip = error.response.data.message
    }

    showError(tip)
    return Promise.reject(error)
  },
)

/**
 * 通用请求方法
 * 返回业务数据 data 部分，调用方无需再手动解包
 * @param config - axios 请求配置
 */
export function request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  return service(config)
    .then(res => (res as unknown as ApiResult<T>).data)
    .catch(err => {
      console.error(
        `[request] 请求失败: ${config.method?.toUpperCase()} ${config.url}, 错误:`,
        err?.message || err,
      )
      throw err
    })
}

/** GET 请求快捷方法 */
export function get<T = unknown>(
  url: string,
  params?: object,
  config?: AxiosRequestConfig,
): Promise<T> {
  return request<T>({ url, method: 'get', params, ...config })
}

/** POST 请求快捷方法 */
export function post<T = unknown>(
  url: string,
  data?: object,
  config?: AxiosRequestConfig,
): Promise<T> {
  return request<T>({ url, method: 'post', data, ...config })
}

/** PUT 请求快捷方法 */
export function put<T = unknown>(
  url: string,
  data?: object,
  config?: AxiosRequestConfig,
): Promise<T> {
  return request<T>({ url, method: 'put', data, ...config })
}

/** DELETE 请求快捷方法 */
export function del<T = unknown>(
  url: string,
  params?: object,
  config?: AxiosRequestConfig,
): Promise<T> {
  return request<T>({ url, method: 'delete', params, ...config })
}

export default service
