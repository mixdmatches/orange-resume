import { storage } from './storage'
import type { APIManufacturer, APIState } from '@/types/APISetting'
import OpenAI from 'openai'

/**
 * 获取 API 配置
 */
const getApiConfig = (): APIManufacturer | null => {
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
 * 检查 API Key 是否配置
 */
export const hasApiKey = (): boolean => {
  const apiConfig = getApiConfig()
  return !!apiConfig?.apiKey
}
