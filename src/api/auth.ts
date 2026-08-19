import type {
  LoginParams,
  LoginResult,
  RegisterParams,
  UserInfo,
} from '@/types/user'
import { get, post, TOKEN_KEY } from '@/utils/request'
import { storage } from '@/utils/storage'

/**
 * 用户注册
 * @param params - 注册参数（用户名、密码、邮箱）
 * @returns 登录响应（含 token 与用户信息），注册成功后自动写入本地 token
 */
export function registerApi(params: RegisterParams): Promise<LoginResult> {
  return post<LoginResult>('/auth/register', params).then(res => {
    storage.set(TOKEN_KEY, res.token)
    return res
  })
}

/**
 * 用户登录
 * @param params - 登录参数（用户名、密码）
 * @returns 登录响应（含 token 与用户信息），登录成功后自动写入本地 token
 */
export function loginApi(params: LoginParams): Promise<LoginResult> {
  return post<LoginResult>('/auth/login', params).then(res => {
    storage.set(TOKEN_KEY, res.token)
    return res
  })
}

/**
 * 退出登录
 * 清除本地 token（后端若为无状态 JWT，无需调用接口）
 */
export function logoutApi(): Promise<void> {
  storage.remove(TOKEN_KEY)
  return post('/auth/logout')
}

/**
 * 获取当前登录用户信息
 * 需要携带 token，由请求拦截器自动注入
 */
export function getProfileApi(): Promise<UserInfo> {
  return get<UserInfo>('/auth/profile')
}

export default { registerApi, loginApi, logoutApi, getProfileApi }
