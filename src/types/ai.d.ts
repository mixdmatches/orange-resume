/** AI 对话消息（OpenAI 兼容格式） */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/** 对话请求参数 */
export interface ChatParams {
  messages: ChatMessage[]
  model?: string
  temperature?: number
  /** 单次回复最大 token 数（透传给后端，可选） */
  maxTokens?: number
}

/** 对话响应数据 */
export interface ChatResult {
  content: string
}

/** 语法检查请求参数 */
export interface GrammarCheckParams {
  resumeText: string
}

/** 语法纠错问题等级 */
export type GrammarSeverity = 'error' | 'warning'
/** 单个语法问题 */
export interface GrammarIssue {
  /** 所属模块，如「项目经历-XX项目」 */
  section: string
  /** 原文片段 */
  original: string
  /** 修改建议 */
  suggestion: string
  /** 问题原因 */
  reason: string
  /** 严重等级 */
  severity: GrammarSeverity
}

/** 语法检查响应数据 */
export interface GrammarCheckResult {
  issues: GrammarIssue[]
}

/** 简历评分请求参数 */
export interface ScoreParams {
  resumeText: string
}

/** 评分维度 */
export interface ScoreDimension {
  name: string
  score: number
  comment: string
}

/** 单个评分维度 */
export interface ResumeScoreDimension {
  /** 维度名称，如「内容详实度」 */
  name: string
  /** 分数 0-100 */
  score: number
  /** 该维度的一句话评语 */
  comment: string
}

/** 简历评分响应数据 */
/** AI 简历评分结果 */
export interface ResumeScoreResult {
  /** 总分 0-100 */
  totalScore: number
  /** 等级 S/A/B/C/D */
  grade: 'S' | 'A' | 'B' | 'C' | 'D'
  /** 各维度评分 */
  dimensions: ResumeScoreDimension[]
  /** 总体评价（较长的 Markdown 文本） */
  overallComment: string
  /** TOP3 最需要改进的问题 */
  top3Issues: string[]
  /** TOP3 亮点 */
  top3Highlights: string[]
}

/** 岗位匹配分析 DTO */
export class JobMatchDto {
  resumeText!: string
  jobDescription!: string
}

/** 岗位匹配分析结果 */
export interface JobMatchResult {
  /** 匹配度 0-100 */
  matchScore: number
  /** 已匹配的核心技能 */
  matchedSkills: string[]
  /** 缺失但岗位要求的技能 */
  missingSkills: string[]
  /** 简历中的亮点 */
  highlights: JobMatchPoint[]
  /** 简历中的薄弱点 */
  weaknesses: JobMatchPoint[]
  /** 具体改进建议 */
  suggestions: string[]
}

/** 自我介绍场景 */
export type SelfIntroScene = '校招' | '社招' | '实习'

/** 自我介绍语气 */
export type SelfIntroTone = '正式' | '轻松'

/** 自我介绍生成选项 */
export interface SelfIntroOptions {
  /** 求职场景 */
  scene: SelfIntroScene
  /** 时长（分钟），决定篇幅 */
  duration: 1 | 3 | 5
  /** 语气风格 */
  tone: SelfIntroTone
}
export class SelfIntroDto {
  /** 简历纯文本内容 */
  resumeText!: string

  /** 生成选项 */
  options!: SelfIntroOptions
}
