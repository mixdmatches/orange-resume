/** 面试难度 */
export type InterviewDifficulty = 'easy' | 'medium' | 'hard'

/** 面试题目类型：技术 / 行为 / 项目深挖；null 表示混合出题 */
export type InterviewCategory =
  | 'technical'
  | 'behavioral'
  | 'project_deep_dive'
  | null

/** 面试状态机状态：待开始 → 进行中 → 已结束 */
export type InterviewStatus = 'pending_questions' | 'in_progress' | 'finished'

/** 分维度评分明细（总结阶段生成） */
export interface InterviewScoreDetail {
  /** 总分（0-100） */
  overallScore: number
  /** 分维度评分 */
  dimensions: Array<{
    /** 维度名称（如"前端框架原理"） */
    name: string
    /** 该维度得分（0-100） */
    score: number
    /** 该维度点评 */
    comment: string
  }>
  /** 整体亮点 */
  strengths: string[]
  /** 主要不足 */
  weaknesses: string[]
  /** 改进建议（3-5 条） */
  suggestions: string[]
  /** 最终面试结论（推荐程度） */
  finalVerdict: string
}

/** 面试会话（后端序列化后返回，BigInt 已转 string） */
export interface InterviewSession {
  /** 会话 ID（即 ai_session ID，后续答题/结束/详情均依赖它） */
  id: string
  /** 所属用户 ID */
  userId: number
  /** 会话类型（恒为 interview） */
  type: string
  /** 会话标题（由岗位或简历标题自动生成） */
  title: string
  /** 使用的厂商标识 */
  providerId?: string | null
  /** 使用的模型 ID */
  modelId?: string | null
  /** ai_session 通用状态 */
  status?: string
  /** 面试状态机状态 */
  interviewStatus: InterviewStatus
  /** 关联的简历 ID */
  resumeId: string
  /** 目标岗位 */
  jobTitle: string | null
  /** 面试难度 */
  difficulty: string
  /** 题目类型（技术 / 行为 / 项目深挖，混合出题为 null） */
  category: string | null
  /** 面试总评分（未评分时为 null） */
  totalScore: number | null
  /** 面试总结 */
  summary: string | null
  /** 分维度评分明细（未评分时为 null） */
  scoreDetail: InterviewScoreDetail | null
  /** 面试耗时（秒，未结束时为 null） */
  durationSec: number | null
  /** 开始时间 */
  startedAt?: string
  /** 创建时间 */
  createdAt?: string
  /** 更新时间 */
  updatedAt?: string
}

/** 创建面试会话 DTO */
export class CreateInterviewDto {
  /** 简历 ID（必须是当前用户拥有的简历） */
  resumeId!: string
  /** 目标岗位（如"前端工程师"，可选） */
  jobTitle?: string
  /** 面试难度（默认 medium） */
  difficulty?: InterviewDifficulty
  /** 面试题目数量（5-20 题） */
  questionCount?: number
  /** 题目类型（技术 / 行为 / 项目深挖，可空表示混合出题） */
  category?: string
  /** 指定厂商标识（可选，不传则用用户当前选中的服务商） */
  providerId?: string
  /** 指定模型 ID（可选） */
  modelId?: string
}

/**
 * 面试统一 SSE 流 DTO（开始 / 答题 / 提前结束共用一个入口）
 * 后端按 interview_session.status 自动路由行为：
 * - pending_questions → 开始面试（content 被忽略）
 * - in_progress + content → 答题
 * - in_progress + finishOnly=true → 提前结束（content 可省略）
 */
export class InterviewStreamDto {
  /** 回答内容：答题时必填；开始面试时忽略；提前结束时可省略 */
  content?: string
  /** 是否提前结束面试：true = 直接生成总结评分 */
  finishOnly?: boolean
}

/** 面试列表查询参数（offset 分页） */
export interface InterviewListParams {
  /** 页码，默认 1 */
  page?: number
  /** 每页条数，默认 20 */
  pageSize?: number
}

/** 面试列表响应（按最近活跃倒序） */
export interface InterviewListResult {
  /** 面试会话列表 */
  list: InterviewSession[]
  /** 总条数 */
  total: number
  page: number
  pageSize: number
}

/** 面试详情（含所有题目 / 回答 / 评价 + 总结评分） */
export interface InterviewDetail {
  /** 会话 ID */
  id: string
  /** 所属用户 ID */
  userId: number
  /** 关联的简历 ID */
  resumeId: string
  /** 目标岗位 */
  jobTitle: string | null
  /** 面试难度 */
  difficulty: string
  /** 题目类型 */
  category: string | null
  /** 面试状态机状态 */
  status: InterviewStatus
  /** 题库总题数 */
  totalRounds: number
  /** 已答题数 */
  answeredRounds: number
  /** 面试总评分（未评分时为 null） */
  totalScore: number | null
  /** 面试总结 */
  summary: string | null
  /** 分维度评分明细（未评分时为 null） */
  scoreDetail: InterviewScoreDetail | null
  /** 面试耗时（秒） */
  durationSec: number | null
  /** 所有题目（按 roundIndex 升序，动态出题无额外元信息） */
  questions: Array<{
    roundIndex: number
    question: string
  }>
  /** 所有回答（按 roundIndex 升序） */
  answers: Array<{
    roundIndex: number
    content: string
  }>
  /** 所有单题评价（按 roundIndex 升序） */
  evaluations: Array<{
    roundIndex: number
    score: number
    feedback: string
    strengths: string[]
    weaknesses: string[]
    suggestions: string[]
  }>
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

/* ============================================================
 * SSE 事件协议（与后端 interview.service.ts 冻结协议对齐）
 * 统一入口 POST /interviews/:id/stream
 * 评价统一在面试结束后批量推送，不在每题后评价：
 *
 * 开始面试：question_start → question*（流式增量）→ question_done
 * 答题（还有下一轮）：question_start → question* → question_done（直接下一题，无评价事件）
 * 答题（最后一轮）：question_done → evaluation_start → evaluation_done（逐题批量评价）
 *                  → summary_start → summary* → done
 * 提前结束：直接 evaluation_start → evaluation_done（逐题批量评价）→ summary_start → summary* → done
 * 异常：error
 * ============================================================ */

/** 面试统一 SSE 事件（联合类型，按 event 字段判别） */
export type InterviewSseEvent =
  /** 开始出第 round 题（前端显示"面试官正在提问…"） */
  | { event: 'question_start'; round: number; totalRounds: number }
  /** 题目文本流式增量（逐 token 推送，前端逐字追加到面试官气泡） */
  | { event: 'question'; content: string }
  /** 本题出完（完整文本已落库，前端可开始接收回答） */
  | { event: 'question_done'; round: number; totalRounds: number }
  /** 评价开始：通知前端显示 loading */
  | { event: 'evaluation_start'; round: number; totalRounds: number }
  /** 评价完成：含结构化评分 + 反馈 */
  | {
      event: 'evaluation_done'
      round: number
      totalRounds: number
      score: number
      feedback: string
      strengths: string[]
      weaknesses: string[]
      suggestions: string[]
      /** 是否还有下一题 */
      hasNext: boolean
    }
  /** 开始生成总结 */
  | { event: 'summary_start' }
  /** 总结文本流式增量 */
  | { event: 'summary'; content: string }
  /** 整个面试流程结束 */
  | {
      event: 'done'
      totalScore: number
      summary: string
      scoreDetail: InterviewScoreDetail
      interviewSession: Record<string, unknown>
    }
  /** 错误事件（后端中途失败时推送） */
  | { event: 'error'; message: string }
