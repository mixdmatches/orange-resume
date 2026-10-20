import type {
  ChangePasswordDto,
  LoginParams,
  LoginResult,
  RegisterParams,
  ResetPasswordDto,
  UserInfo,
} from '@/types/user'
import { ACCESS_TOKEN_KEY, get, post, REFRESH_TOKEN_KEY } from '@/utils/request'
import { storage } from '@/utils/storage'

/**
 * 将登录/注册返回的双令牌对写入本地存储
 * @param res - 后端返回的 { accessToken, refreshToken, userInfo }
 */
function saveTokens(res: LoginResult) {
  storage.set(ACCESS_TOKEN_KEY, res.accessToken)
  storage.set(REFRESH_TOKEN_KEY, res.refreshToken)
}

/**
 * 用户注册
 * @param params - 注册参数（用户名、密码、邮箱）
 * @returns 登录响应（含双令牌与用户信息），注册成功后自动写入本地令牌对
 */
export function registerApi(params: RegisterParams): Promise<LoginResult> {
  return post<LoginResult>('/auth/register', params).then(res => {
    saveTokens(res)
    return res
  })
}

/**
 * 用户登录
 * @param params - 登录参数（用户名、密码）
 * @returns 登录响应（含双令牌与用户信息），登录成功后自动写入本地令牌对
 */
export function loginApi(params: LoginParams): Promise<LoginResult> {
  return post<LoginResult>('/auth/login', params).then(res => {
    saveTokens(res)
    return res
  })
}

/**
 * 获取重置密码验证码
 * @param email
 */
export function getVerifyCodeApi(email: string) {
  return post<void>('/auth/forget', { email })
}

/**
 * 重置密码（忘记密码流程）
 */
export function resetPasswordApi(data: ResetPasswordDto) {
  return post<void>('/auth/reset', data)
}

/**
 * 修改密码（已登录状态下）
 * @param data - 旧密码 + 新密码
 */
export function changePasswordApi(data: ChangePasswordDto) {
  return post<void>('/user/change-password', data)
}

/**
 * 退出登录
 * 清除本地双令牌（后端若为无状态 JWT，无需调用接口）
 */
export function logoutApi(): Promise<void> {
  return post('/auth/logout')
}

/**
 * 注销账号
 */
export function deleteAccountApi() {
  return post<Promise<void>>('/user/delete')
}

/**
 * 获取当前登录用户信息
 * 需要携带 accessToken，由请求拦截器自动注入
 */
export function getProfileApi() {
  return get<UserInfo>('/auth/profile')
}

export default {
  registerApi,
  loginApi,
  logoutApi,
  getProfileApi,
  getVerifyCodeApi,
}
