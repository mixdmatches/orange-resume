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
