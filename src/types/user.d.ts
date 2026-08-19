/** 登录请求参数 */
export interface LoginParams {
  username: string
  password: string
}

/** 注册请求参数 */
export interface RegisterParams {
  username: string
  password: string
  confirmPassword: string
  email?: string
}

/** 用户信息（对应后端 User 实体） */
export interface UserInfo {
  id: number
  username: string
  email: string | null
  createdAt: string
  updatedAt: string
}

/** 登录响应数据 */
export interface LoginResult {
  token: string
  user: UserInfo
}
