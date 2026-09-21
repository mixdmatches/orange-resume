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

/**
 * 登录 / 注册 / 刷新令牌的统一响应数据（双 Token 方案）
 * - accessToken：短寿命（默认 2h），业务请求放 Authorization: Bearer <accessToken>
 * - refreshToken：长寿命（默认 7d），仅用于 POST /auth/refresh 静默换新令牌对
 * - 后端为轮换策略：refresh 一次一换，旧 refreshToken 立即作废，前端需整体覆盖保存
 */
export interface LoginResult {
  /** 访问令牌：业务接口鉴权用 */
  accessToken: string
  /** 刷新令牌：静默续期用 */
  refreshToken: string
  /** 当前登录用户信息 */
  userInfo: UserInfo
}
