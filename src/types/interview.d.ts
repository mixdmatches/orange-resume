/** 面试难度 */
export type InterviewDifficulty = 'easy' | 'medium' | 'hard'

/** 面试题目类型：技术 / 行为 / 项目深挖；null 表示混合出题 */
export type InterviewCategory =
  | 'technical'
  | 'behavioral'
  | 'project_deep_dive'
  | null

/** 面试状态机状态：待开始 → 进行中 → 已结束（stopped=用户中途中止，可恢复） */
export type InterviewStatus =
  | 'pending_questions'
  | 'in_progress'
  | 'stopped'
  | 'finished'

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
  /** 面试当前步骤 */
  step: InterviewStep
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

export class CreateInterviewDto {
  resumeId?: string
  resumeText: string
  jobTitle?: string
  difficulty?: InterviewDifficulty
  questionCount?: number
  category?: string
  providerId?: string
  modelId?: string
}

export class InterviewStreamDto {
  content?: string
  finishOnly?: boolean
}

export interface InterviewListParams {
  /** 页码，默认 1 */
  page?: number
  /** 每页条数，默认 20 */
  pageSize?: number
}

export interface InterviewListResult {
  /** 面试会话列表 */
  items: InterviewSession[]
  /** 总条数 */
  total: number
  page: number
  pageSize: number
}

export interface InterviewDetail {
  id: string
  userId: number
  resumeId: string
  jobTitle: string | null
  difficulty: string
  category: string | null
  currentStep: InterviewStep
  totalRounds: number
  answeredRounds: number
  totalScore: number | null
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
  createdAt: string
  updatedAt: string
}

/** 面试统一 SSE 事件 */
export type InterviewSseEvent =
  | { event: 'question_start'; round: number; totalRounds: number }
  | { event: 'question'; content: string }
  | { event: 'question_done'; round: number; totalRounds: number }
  | { event: 'evaluation_start'; round: number; totalRounds: number }
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
  | { event: 'summary_start' }
  | { event: 'summary'; content: string }
  | {
      event: 'done'
      totalScore: number
      summary: string
      scoreDetail: InterviewScoreDetail
      interviewSession: Record<string, unknown>
    }
  | { event: 'error'; message: string }

/** 面试步骤标识 */
export type InterviewStep =
  | 'created'
  | 'asking_question'
  | 'waiting_answer'
  | 'stopped'
  | 'finished'
