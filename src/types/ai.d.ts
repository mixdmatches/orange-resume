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
}

/** 对话响应数据 */
export interface ChatResult {
  content: string
}

/** 语法检查请求参数 */
export interface GrammarCheckParams {
  text: string
}

/** 单个语法问题 */
export interface GrammarIssue {
  /** 原文片段 */
  original: string
  /** 修改建议 */
  suggestion: string
  /** 问题说明 */
  message: string
}

/** 语法检查响应数据 */
export interface GrammarCheckResult {
  issues: GrammarIssue[]
}

/** 简历评分请求参数 */
export interface ScoreParams {
  resume: Resume
}

/** 评分维度 */
export interface ScoreDimension {
  name: string
  score: number
  comment: string
}

/** 简历评分响应数据 */
export interface ScoreResult {
  /** 总分 */
  score: number
  /** 分维度评分 */
  dimensions: ScoreDimension[]
  /** 优化建议 */
  suggestions: string[]
}
