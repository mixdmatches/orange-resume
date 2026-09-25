/** 面试会话扩展信息（type 为 interview 时返回，chat 会话为 null） */
export interface AiInterviewSessionInfo {
  /** 关联的简历 ID */
  resumeId: string
  /** 目标岗位名称 */
  jobTitle: string
  /** 面试难度 */
  difficulty: string
  /** 面试分类 */
  category: string
  /** 面试总评分（未评分时为 null） */
  totalScore: number | null
  /** 面试总结 */
  summary: string
  /** 面试时长（秒） */
  durationSec: number
}

/** 会话信息（创建会话接口返回） */
export interface AiSession {
  /** 会话 ID（后续发送消息、查询历史均依赖它） */
  id: string
  /** 所属用户 ID */
  userId: string
  /** 会话类型：chat 对话 / interview 面试 */
  type: 'chat' | 'interview'
  /** 会话标题（首条用户消息发出后由后端自动截取覆盖） */
  title?: string
  /** 使用的厂商标识 */
  providerId?: string | null
  /** 使用的模型 ID */
  modelId?: string | null
  /** 会话状态 */
  status?: string
  /** 会话内消息数量（来自 _count.messages） */
  messageCount?: number
  /** 面试会话扩展信息（type 为 interview 时返回，chat 会话为 null） */
  interviewSession?: AiInterviewSessionInfo | null
  /** 创建时间 */
  createdAt?: string
  /** 更新时间 */
  updatedAt?: string
}

/** 创建会话 DTO */
export class CreateSessionDto {
  /** 会话类型：暂时只开放对话类型（面试会话由后续面试流程接口创建） */
  type!: 'chat'
  /** 会话标题（可选，不传默认"新对话"，首条用户消息发出后自动截取覆盖） */
  title?: string
  /** 指定使用的厂商标识（可选，不传则用用户当前选中的服务商） */
  providerId?: string
  /** 指定使用的模型 ID（可选，仅作记录展示，实际以厂商配置为准） */
  modelId?: string
}

/** 会话内发送消息 DTO（流式对话） */
export class SendMessageDto {
  /** 用户输入的消息内容 */
  content!: string
  /** 指定本次使用的厂商标识（可选，不传则用用户当前选中的服务商） */
  providerId?: string
}

/** 会话列表查询参数（offset 分页） */
export interface SessionListParams {
  /** 按类型筛选（可选：chat / interview，不传返回全部） */
  type?: 'chat' | 'interview'
  /** 页码，默认 1 */
  page?: number
  /** 每页条数，默认 20，最多 50 */
  pageSize?: number
}

/** 会话列表响应 */
export interface SessionListResult {
  /** 会话列表（按最近活跃倒序） */
  list: AiSession[]
  /** 总条数 */
  total: number
  page: number
  pageSize: number
}

/** 会话消息记录 */
export interface AiSessionMessage {
  /** 消息 ID（BigInt 序列化后的字符串） */
  id: string
  /** 所属会话 ID */
  sessionId: string
  /** 角色：user / assistant */
  role: 'user' | 'assistant'
  /** 消息种类：normal 普通 / 其他扩展类型 */
  kind: string
  /** 消息内容 */
  content: string
  /** 输入 token 用量 */
  promptTokens?: number | null
  /** 输出 token 用量 */
  completionTokens?: number | null
  /** 流式状态：streaming 进行中 / done 完成 / failed 失败 */
  streamStatus?: string | null
  /** 创建时间 */
  createdAt?: string
}

/** 会话消息列表查询参数（游标分页） */
export interface SessionMessagesParams {
  /** 游标：只返回 id 小于该值的消息（上一页最后一条的 id） */
  beforeId?: string
  /** 每页条数，默认 30，最多 100 */
  limit?: number
}

/** 会话消息列表响应（list 按 id 倒序，最新在前） */
export interface SessionMessagesResult {
  list: AiSessionMessage[]
  /** 是否还有更早的消息 */
  hasMore: boolean
  /** 下一页游标（本页最后一条的 id），没有更多时为 null */
  nextCursor: string | null
}
