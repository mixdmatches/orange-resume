export enum ErrorCode {
  /** 成功 */
  SUCCESS = 0,
  /** 参数校验失败（class-validator、DTO 校验不通过、缺少必填 Header 等） */
  BAD_REQUEST = 40001,
  /** 用户不存在 或 密码错误（登录类失败） */
  INVALID_CREDENTIALS = 40002,
  /** 用户名已存在 或 邮箱已注册（注册冲突） */
  USER_ALREADY_EXISTS = 40003,
  /** 未登录 / Token 无效 / Token 过期 */
  UNAUTHORIZED = 40101,
  /** 无权限操作（访问他人资源、角色不足等） */
  FORBIDDEN = 40301,
  /** 资源不存在（如根据 ID 找不到记录） */
  NOT_FOUND = 40401,
  /** 服务器内部未知错误 */
  INTERNAL_ERROR = 50001,
}
