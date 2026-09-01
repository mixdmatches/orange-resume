import {
  DEFAULT_RESUME,
  initialGlobalConfiguration,
} from '@/config/init-resume-data'
import { storage } from './storage'
import type { APIManufacturer, APIState } from '@/types/APISetting'
import OpenAI from 'openai'
import type { ResumeScoreResult } from '@/types/ai'

/**
 * 获取 API 配置
 */
export const getApiConfig = (): APIManufacturer | null => {
  const apiState = storage.get<APIState>('apiState')?.states || []
  const selectedModel = storage.get<APIState>('apiState')?.selectedModel || null
  if (!apiState.length) {
    return null
  } else {
    return apiState.find(item => item.id === selectedModel) || null
  }
}

/**
 * 创建 OpenAI 客户端实例
 */
const createOpenAIClient = (apiKey: string, baseURL: string): OpenAI => {
  return new OpenAI({
    apiKey,
    baseURL,
    dangerouslyAllowBrowser: true,
  })
}

/**
 * 格式化 API 错误信息
 */
function formatError(error: unknown) {
  const err = error as { message?: string; status?: number }
  if (err?.message) {
    return err.message
  }
  return '连接测试失败，请检查 API Key 和 API 端点是否正确。'
}

/**
 * 测试 API 连接
 */
export async function testApiConnection(apiConfig: APIManufacturer) {
  if (!apiConfig) {
    throw new Error('请先选择 API 提供商')
  }

  if (!apiConfig.apiKey) {
    throw new Error('请先填写 API Key')
  }

  if (!apiConfig.modelId) {
    throw new Error('请先填写模型 ID')
  }

  if (apiConfig.id === 'custom' && !apiConfig.apiEndpoint) {
    throw new Error('自定义提供商需要填写 API 端点')
  }

  const openai = createOpenAIClient(apiConfig.apiKey, apiConfig.apiEndpoint)

  try {
    const res = await openai.chat.completions.create({
      model: apiConfig.modelId,
      messages: [
        {
          role: 'system',
          content: '你正在进行连接测试，请忽略此内容。只需回复一个字',
        },
        { role: 'user', content: 'ping' },
      ],
      max_tokens: 1,
      temperature: 0,
    })
    console.log(res)
  } catch (error) {
    throw new Error(formatError(error))
  }
}

/**
 * 调用 API 生成面试问题
 * @param resumeContent - 简历内容（字符串格式）
 * @param questionCount - 生成的问题数量
 */
export const generateInterviewQuestions = async (
  resumeContent: string,
  questionCount: number = 5,
): Promise<string> => {
  const apiConfig = getApiConfig()
  if (!apiConfig || !apiConfig.apiKey) {
    throw new Error('未配置 API Key，请在设置中配置')
  }

  if (!apiConfig.modelId) {
    throw new Error('请先选择模型')
  }

  const openai = createOpenAIClient(apiConfig.apiKey, apiConfig.apiEndpoint)

  // 构建提示词
  const systemPrompt = `你是一个专业的技术面试官，擅长根据候选人的简历提出针对性的面试问题。
请根据提供的简历内容，生成${questionCount}个高质量的面试问题，涵盖以下方面：
1. 技术能力和技能验证
2. 项目经验和深度
3. 解决问题的能力

每个问题后请提供一个参考回答，用"回答："开头。
输出格式要求：
Q1: [问题1]
回答：[参考回答1]

Q2: [问题2]
回答：[参考回答2]

...以此类推`

  const completion = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `根据以下简历生成面试问题：\n\n${resumeContent}`,
      },
    ],
    model: apiConfig.modelId,
    reasoning_effort: 'high',
    temperature: 0.7,
    max_tokens: 2000,
    stream: false,
  })

  return completion.choices[0]?.message?.content || ''
}

/**
 * 调用 API 生成自定义回答
 * @param question - 用户问题
 */
export const generateAnswer = async (question: string): Promise<string> => {
  const apiConfig = getApiConfig()
  if (!apiConfig || !apiConfig.apiKey) {
    throw new Error('未配置 API Key，请在设置中配置')
  }

  if (!apiConfig.modelId) {
    throw new Error('请先选择模型')
  }

  const openai = createOpenAIClient(apiConfig.apiKey, apiConfig.apiEndpoint)

  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: '你是一个专业的AI助手，请提供详细、专业的回答。',
      },
      { role: 'user', content: question },
    ],
    model: apiConfig.modelId,
    reasoning_effort: 'high',
    temperature: 0.7,
    max_tokens: 1000,
    stream: false,
  })

  return completion.choices[0]?.message?.content || ''
}

/**
 * 调用 API 将 PDF 文本解析为结构化 JSON 数据
 */
export const pdfToJsonWithAI = async (pdfText: string) => {
  const apiConfig = getApiConfig()

  if (!apiConfig || !apiConfig.apiKey) {
    throw new Error('未配置 API Key，请在设置中配置')
  }

  if (!apiConfig.modelId) {
    throw new Error('请先选择模型')
  }

  const prompt = `
    请将以下简历内容解析为JSON格式，包含以下字段：
    - templateId:'classic'
    - createdAt: 此时此刻的时间Date.now()格式,
    - updatedAt: null,
    - basic: { name, phone, email, address, position, photo ,photoConfig:{aspectRatio: string
      width: number
      height: number
      visible: false
      borderRadius: number
      customBorderRadius: number} }
    - educations: [{id, school, major, degree, dateRange, description,visible:true }]
    - internships: [{id, companyName, position, dateRange, description,visible:true }]
    - projects: [{id, name, role, gitAddress, dateRange, description,visible:true }]
    - skills: string
    - initialGlobalConfiguration：{}
    id必须给一个唯一的字符串
    整体JSON格式如下：
  ${DEFAULT_RESUME}
  其中的initialGlobalConfiguration字段设置为：${initialGlobalConfiguration}
    简历内容：
    ${pdfText}
  `

  const openai = createOpenAIClient(apiConfig.apiKey, apiConfig.apiEndpoint)

  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: prompt,
      },
      { role: 'user', content: pdfText },
    ],
    model: apiConfig.modelId,
    reasoning_effort: 'medium',
    response_format: { type: 'json_object' },
    temperature: 0.7,
    stream: false,
  })

  const resume = JSON.parse(completion.choices[0]?.message?.content || '{}')
  resume.id = crypto.randomUUID().substring(0, 5)
  resume.title = `PDF导入的简历${resume.id}`
  resume.globalConfiguration = DEFAULT_RESUME.globalConfiguration
  resume.menuSections = DEFAULT_RESUME.menuSections
  resume.customData = {}

  return resume
}

/**
 * 检查 API Key 是否配置
 */
export const hasApiKey = (): boolean => {
  const apiConfig = getApiConfig()
  return !!apiConfig?.apiKey
}

/** 对话消息类型（system/assistant/user 三种角色） */
export type ChatMessage = {
  role: 'system' | 'assistant' | 'user'
  content: string
}

/**
 * 流式调用 API，逐字返回内容
 * 用于智能助手、自我介绍等需要打字机效果的场景
 * @param messages - 对话消息列表
 * @yields 每次返回一个文本片段
 */
export const chatWithStream = async function* (
  messages: ChatMessage[],
): AsyncGenerator<string> {
  const apiConfig = getApiConfig()
  if (!apiConfig || !apiConfig.apiKey) {
    throw new Error('未配置 API Key，请在设置中配置')
  }
  if (!apiConfig.modelId) {
    throw new Error('请先选择模型')
  }

  const openai = createOpenAIClient(apiConfig.apiKey, apiConfig.apiEndpoint)

  const stream = await openai.chat.completions.create({
    messages,
    model: apiConfig.modelId,
    temperature: 0.7,
    stream: true,
  })

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || ''
    if (delta) yield delta
  }
}

/** 语法纠错问题等级 */
export type GrammarSeverity = 'error' | 'warning'

/** 单条语法纠错结果 */
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

/**
 * 调用 AI 检查简历文本的语法、错别字、标点等问题
 * @param resumeText - 简历纯文本内容
 * @returns 纠错问题列表
 */
export const checkResumeGrammar = async (
  resumeText: string,
): Promise<GrammarIssue[]> => {
  const apiConfig = getApiConfig()
  if (!apiConfig || !apiConfig.apiKey) {
    throw new Error('未配置 API Key，请在设置中配置')
  }
  if (!apiConfig.modelId) {
    throw new Error('请先选择模型')
  }

  const systemPrompt = `你是专业的中文文案校对专家。请检查简历文本中的：错别字、语病、标点错误、中英文混用问题、冗余表达。

严格输出以下 JSON 格式（不要输出任何其他内容）：
{
  "issues": [
    {
      "section": "项目经历-XX项目",
      "original": "原句片段",
      "suggestion": "修改后的句子",
      "reason": "错别字：'在'应为'再'",
      "severity": "error"
    }
  ]
}

要求：
1. 如果没有任何问题，返回 {"issues": []}
2. severity 只能是 "error"（错别字、语病）或 "warning"（标点、冗余）
3. original 必须是简历中真实存在的原文片段
4. reason 要简短说明问题原因`

  const openai = createOpenAIClient(apiConfig.apiKey, apiConfig.apiEndpoint)

  const completion = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: resumeText },
    ],
    model: apiConfig.modelId,
    response_format: { type: 'json_object' },
    temperature: 0.2,
    stream: false,
  })

  const raw = completion.choices[0]?.message?.content || '{"issues":[]}'
  const parsed = JSON.parse(raw)
  return parsed.issues || []
}

/**
 * 根据总分映射到等级
 * @param score - 0-100 总分
 */
const scoreToGrade = (score: number): ResumeScoreResult['grade'] => {
  if (score >= 90) return 'S'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  return 'D'
}

/**
 * 调用 AI 对简历内容进行深度质量评分
 * @param resumeText - 简历纯文本内容
 * @returns 包含总分、维度分、评语、改进建议的完整结果
 */
export const scoreResumeWithAI = async (
  resumeText: string,
): Promise<ResumeScoreResult> => {
  const apiConfig = getApiConfig()
  if (!apiConfig || !apiConfig.apiKey) {
    throw new Error('未配置 API Key，请在设置中配置')
  }
  if (!apiConfig.modelId) {
    throw new Error('请先选择模型')
  }

  const systemPrompt = `你是资深 HR 简历审核官，请从以下 6 个维度给简历打分（每项 0-100）：
1. 内容详实度：是否有量化数据、具体成果、明确职责
2. 结构清晰度：模块顺序、逻辑、排版是否合理易读
3. 技能匹配度：技能描述是否准确、分类是否清晰、是否体现竞争力
4. 项目深度：项目描述是否体现技术难点、个人贡献、业务价值
5. 语言表达：是否简洁、专业、无冗余无语病
6. 差异化亮点：是否有脱颖而出的经历、成就或特色

严格输出以下 JSON 格式（不要输出任何其他内容）：
{
  "totalScore": 78,
  "dimensions": [
    { "name": "内容详实度", "score": 80, "comment": "..." },
    { "name": "结构清晰度", "score": 70, "comment": "..." },
    { "name": "技能匹配度", "score": 85, "comment": "..." },
    { "name": "项目深度", "score": 75, "comment": "..." },
    { "name": "语言表达", "score": 82, "comment": "..." },
    { "name": "差异化亮点", "score": 72, "comment": "..." }
  ],
  "overallComment": "总体评价，100-200字，用口语化但专业的语气。",
  "top3Issues": ["改进1", "改进2", "改进3"],
  "top3Highlights": ["亮点1", "亮点2", "亮点3"]
}`

  const openai = createOpenAIClient(apiConfig.apiKey, apiConfig.apiEndpoint)

  const completion = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: resumeText },
    ],
    model: apiConfig.modelId,
    response_format: { type: 'json_object' },
    temperature: 0.3,
    stream: false,
  })

  const raw = completion.choices[0]?.message?.content || '{}'
  const parsed = JSON.parse(raw) as ResumeScoreResult

  // 保证 grade 字段有值（兼容模型未返回的情况）
  parsed.grade = parsed.grade || scoreToGrade(parsed.totalScore || 0)
  parsed.dimensions = parsed.dimensions || []
  parsed.overallComment = parsed.overallComment || ''
  parsed.top3Issues = parsed.top3Issues || []
  parsed.top3Highlights = parsed.top3Highlights || []

  return parsed
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

/**
 * 流式生成自我介绍文案
 * @param resumeText - 简历纯文本内容
 * @param options - 生成选项（场景/时长/语气）
 * @yields 每次返回一个文本片段
 */
export const generateSelfIntro = async function* (
  resumeText: string,
  options: SelfIntroOptions,
): AsyncGenerator<string> {
  const { scene, duration, tone } = options
  // 按中文语速 220 字/分钟估算篇幅
  const wordCount = duration * 220

  const systemPrompt = `你是一位帮助求职者撰写自我介绍的专家。请根据简历生成一段自我介绍。

要求：
- 场景：${scene}
- 时长：${duration} 分钟（约 ${wordCount} 字）
- 语气：${tone}
- 结构：开场问候 → 个人亮点 → 核心项目/经历（用 STAR 法则） → 技能匹配岗位 → 结尾期待
- 用第一人称，口语化但专业，可以直接念出来
- 用 Markdown 输出，段落间用空行分隔，重点加粗
- 不要输出标题（如"自我介绍"），直接从问候语开始

简历内容：
${resumeText}`

  yield* chatWithStream([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: '请生成自我介绍' },
  ])
}

/** 岗位匹配-亮点/薄弱点条目 */
export interface JobMatchPoint {
  /** 所属模块，如「项目经历」 */
  section: string
  /** 具体描述 */
  point: string
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

/**
 * 调用 AI 分析简历与岗位描述（JD）的匹配度
 * @param resumeText - 简历纯文本
 * @param jobDescription - 岗位描述（JD）
 * @returns 结构化匹配分析结果
 */
export const analyzeJobMatch = async (
  resumeText: string,
  jobDescription: string,
): Promise<JobMatchResult> => {
  const apiConfig = getApiConfig()
  if (!apiConfig || !apiConfig.apiKey) {
    throw new Error('未配置 API Key，请在设置中配置')
  }
  if (!apiConfig.modelId) {
    throw new Error('请先选择模型')
  }

  const systemPrompt = `你是一位资深技术招聘官，需要评估候选人简历与岗位描述（JD）的匹配度。

请严格按以下 JSON 格式输出（不要输出任何其他内容）：
{
  "matchScore": 78,
  "matchedSkills": ["React", "TypeScript"],
  "missingSkills": ["Webpack", "Node.js"],
  "highlights": [
    { "section": "项目经历", "point": "有完整的从0到1项目落地经验" }
  ],
  "weaknesses": [
    { "section": "技能", "point": "缺少岗位要求的后端经验" }
  ],
  "suggestions": [
    "建议在项目描述中补充性能优化数据",
    "建议增加一个体现团队协作的经历"
  ]
}

评估要求：
1. matchScore 为 0-100 的整数，综合反映匹配程度
2. matchedSkills / missingSkills 只放技能关键词，不要长句
3. highlights / weaknesses 的 section 要对应简历模块名
4. suggestions 要具体可执行，3-5 条

简历内容：
${resumeText}`

  const openai = createOpenAIClient(apiConfig.apiKey, apiConfig.apiEndpoint)

  const completion = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `岗位描述（JD）：\n${jobDescription}` },
    ],
    model: apiConfig.modelId,
    response_format: { type: 'json_object' },
    temperature: 0.3,
    stream: false,
  })

  const raw = completion.choices[0]?.message?.content || '{}'
  const parsed = JSON.parse(raw) as JobMatchResult

  // 空值兜底
  parsed.matchedSkills = parsed.matchedSkills || []
  parsed.missingSkills = parsed.missingSkills || []
  parsed.highlights = parsed.highlights || []
  parsed.weaknesses = parsed.weaknesses || []
  parsed.suggestions = parsed.suggestions || []

  return parsed
}

/**
 * 保留的最大历史轮数（1 轮 = 1 条 user + 1 条 assistant）
 * 超出则从最旧的开始丢弃，防止 token 超限
 */
const MAX_HISTORY_ROUNDS = 6

/**
 * 构造智能助手对话的消息列表
 * - 注入简历上下文作为 system 消息
 * - 截断历史对话，只保留最近 MAX_HISTORY_ROUNDS 轮
 * @param resumeText - 简历纯文本
 * @param history - 历史对话（不含当前这条）
 * @param userInput - 当前用户输入
 * @returns 可直接传给 chatWithStream 的消息列表
 */
export const buildAssistantMessages = (
  resumeText: string,
  history: ChatMessage[],
  userInput: string,
): ChatMessage[] => {
  const systemPrompt = `你是一位资深简历顾问和职业规划师，正在协助用户优化简历。
以下是用户的简历内容，请基于此上下文回答问题：

${resumeText}

回答要求：
1. 具体可执行，避免空话套话
2. 如果用户问的是简历外的问题也可以回答，但要尽量结合简历情况
3. 回答用 Markdown 格式，重点加粗，用空行分段`

  // 只保留最近 MAX_HISTORY_ROUNDS 轮（每轮 2 条消息）
  const maxHistoryMessages = MAX_HISTORY_ROUNDS * 2
  const trimmedHistory =
    history.length > maxHistoryMessages
      ? history.slice(-maxHistoryMessages)
      : history

  return [
    { role: 'system', content: systemPrompt },
    ...trimmedHistory,
    { role: 'user', content: userInput },
  ]
}
