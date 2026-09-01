/**
 * Axios 实例与拦截器封装
 * 用于前后端联调，统一处理 baseURL、JWT Token 注入、
 * 后端统一响应格式解析、错误提示与 401 鉴权失效。
 */
import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { message } from 'ant-design-vue'
import { storage } from './storage'
import { ErrorCode } from '@/types/code'

/** Token 在本地存储中的键名 */
export const TOKEN_KEY = 'token'

/** 后端统一响应体格式（与 NestJS 后端约定一致） */
export interface ApiResult<T = unknown> {
  /** 业务状态码：200/0 表示成功，其他为失败 */
  code: number
  /** 提示信息 */
  message: string
  /** 业务数据 */
  data: T
}

/**
 * 跳转到登录页
 * 用于 401 鉴权失效场景。通过修改 hash 跳转，
 * 避免在 utils 层引入 router 造成循环依赖。
 */
function redirectToLogin() {
  // 已在登录页时不再重复跳转
  if (!window.location.hash.startsWith('#/login')) {
    window.location.hash = '#/login'
  }
}

/** 普通业务接口默认超时时间（毫秒） */
export const DEFAULT_TIMEOUT = 15000

/** AI 类接口超时时间（毫秒）*/
export const AI_TIMEOUT = 120000

/**
 * 创建 axios 实例
 * - baseURL 读取环境变量 VITE_API_BASE_URL_PREFIX，未配置时回退到 /api（配合 vite 代理）
 * - timeout 使用默认 15s 兜底；AI 等长耗时接口可在调用处单独覆盖
 */
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
})

/**
 * 请求拦截器
 * 自动从本地存储读取 Token，并以 Bearer 形式注入到请求头
 */
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.get<string>(TOKEN_KEY)
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error),
)

/**
 * 响应拦截器 —— 成功分支
 * 解析后端统一响应体，业务成功时直接返回 data 部分；
 * 业务失败时弹出错误提示并 reject。
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
      return res
    }

    // 业务失败：统一提示
    message.error(res.message || '请求失败')

    // 401：Token 失效，清除本地 Token 并跳转登录页
    if (res.code === ErrorCode.UNAUTHORIZED) {
      storage.remove(TOKEN_KEY)
      redirectToLogin()
    }

    return Promise.reject(new Error(res.message || 'Error'))
  },
  /**
   * 响应拦截器 —— 失败分支
   * 处理 HTTP 层错误（超时、断网、4xx/5xx 等），统一提示
   */
  error => {
    const status = error?.response?.status
    let tip = '网络异常，请稍后重试'

    if (error.code === 'ECONNABORTED') {
      // 请求超时
      tip = '请求超时，请稍后重试'
    } else if (status === ErrorCode.UNAUTHORIZED) {
      // 未授权：清 Token 并跳转登录页
      tip = '登录已过期，请重新登录'
      storage.remove(TOKEN_KEY)
      redirectToLogin()
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

    message.error(tip)
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
