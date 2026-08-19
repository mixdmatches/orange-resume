/**
 * AI 模块 API
 *
 * 说明：
 * - 非流式接口使用 request 封装（axios）
 * - 流式对话（chatStream）使用 fetch + ReadableStream，因为 axios 不支持 SSE 流式读取
 */
import type {
  ChatParams,
  ChatResult,
  GrammarCheckParams,
  GrammarCheckResult,
  ScoreParams,
  ScoreResult,
} from '@/types/ai'
import { post, TOKEN_KEY } from '@/utils/request'
import { storage } from '@/utils/storage'

/**
 * 获取请求基础地址与鉴权头（供 fetch 流式请求使用）
 */
function getRequestBase(): { url: string; headers: Record<string, string> } {
  const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
  const token = storage.get<string>(TOKEN_KEY)
  return {
    url: baseURL,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }
}

/**
 * AI 对话（非流式）
 * 适用于一次性返回结果的场景，如简历评分、数据分析等
 * @param params - 对话消息列表与模型参数
 * @returns AI 回复内容
 */
export function chat(params: ChatParams): Promise<ChatResult> {
  return post<ChatResult>('/ai/chat', params)
}

/**
 * AI 流式对话（SSE）
 * 逐字返回 AI 回复，适用于实时交互的聊天场景。
 *
 * 用法示例：
 * ```ts
 * for await (const chunk of chatStream({ messages })) {
 *   console.log(chunk) // 每个 chunk 是一段文本增量
 * }
 * ```
 *
 * @param params - 对话消息列表与模型参数
 * @yields 文本增量片段
 */
export async function* chatStream(
  params: ChatParams,
): AsyncGenerator<string, void, unknown> {
  const { url, headers } = getRequestBase()

  const response = await fetch(`${url}/ai/chat/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    throw new Error(`AI 流式请求失败：${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('浏览器不支持流式读取')
  }

  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  // 逐块读取并解析 SSE 数据
  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // SSE 以双换行分隔事件，按行解析
    const lines = buffer.split('\n')
    // 保留最后可能不完整的一行到 buffer
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data:')) continue

      const data = trimmed.slice(5).trim()
      // 结束标记
      if (data === '[DONE]') return

      try {
        const parsed = JSON.parse(data)
        // 兼容 OpenAI 格式：choices[0].delta.content
        const delta = parsed?.choices?.[0]?.delta?.content
        if (delta) {
          yield delta
        }
      } catch {
        // 非 JSON 数据（如心跳/注释），跳过
      }
    }
  }
}

/**
 * 语法检查
 * @param params - 待检查的文本
 * @returns 语法问题列表，每项包含原文、建议与说明
 */
export function grammarCheck(
  params: GrammarCheckParams,
): Promise<GrammarCheckResult> {
  return post<GrammarCheckResult>('/ai/grammar-check', params)
}

/**
 * 简历评分
 * @param params - 完整简历数据
 * @returns 总分、分维度评分与优化建议
 */
export function scoreResume(params: ScoreParams): Promise<ScoreResult> {
  return post<ScoreResult>('/ai/score', params)
}

export default {
  chat,
  chatStream,
  grammarCheck,
  scoreResume,
}
