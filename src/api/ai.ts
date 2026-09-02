/**
 * AI 模块 API
 *
 * 说明：
 * - 非流式接口使用 request 封装（axios）
 * - 流式对话（chatStream）使用 fetch + ReadableStream，因为 axios 不支持 SSE 流式读取
 */
import type {
  ChatParams,
  GrammarCheckParams,
  GrammarCheckResult,
  JobMatchDto,
  JobMatchResult,
  ResumeScoreResult,
  ScoreParams,
  SelfIntroDto,
} from '@/types/ai'
import type { APIManufacturer } from '@/types/APISetting'
import type { Resume } from '@/types/resume'
import { getApiConfig } from '@/utils/aiAPIConnect'
import { AI_TIMEOUT, post, TOKEN_KEY } from '@/utils/request'
import { storage } from '@/utils/storage'

const HEADER_API_KEY = 'x-user-api-key'
const HEADER_BASE_URL = 'x-user-base-url'
const HEADER_MODEL_ID = 'x-user-model-id'
const AI_API_CONFIG = {
  timeout: AI_TIMEOUT,
  headers: {
    [HEADER_API_KEY]: getApiConfig()?.apiKey || '',
    [HEADER_BASE_URL]: getApiConfig()?.apiEndpoint || '',
    [HEADER_MODEL_ID]: getApiConfig()?.modelId || '',
  },
}

/**
 * 获取请求基础地址与鉴权头（供 fetch 流式请求使用）
 */
function getRequestBase(): { url: string; headers: Record<string, string> } {
  const baseURL = import.meta.env.VITE_API_BASE_URL
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
 * SSE 流式请求共享逻辑
 *
 * 后端两个流式接口（chat/stream、self-intro/stream）的事件格式已统一为：
 * - 增量：{"content":"..."}
 * - 结束：{"done":true}
 * - 出错：{"error":"..."}
 *
 * 本函数封装 fetch 请求、鉴权头注入、HTTP 错误详情读取、ReadableStream 读取、
 * TCP 粘包/半包处理与事件 JSON 解析，各业务接口只需传入路径与 body 即可复用。
 *
 * @param path - 接口路径（如 /ai/chat/stream）
 * @param body - 请求体，内部会 JSON.stringify
 * @yields 文本增量片段
 */
async function* streamSse(
  path: string,
  body: unknown,
): AsyncGenerator<string, void, unknown> {
  const { url, headers } = getRequestBase()

  const response = await fetch(`${url}${path}`, {
    method: 'POST',
    headers: {
      ...headers,
      [HEADER_API_KEY]: getApiConfig()?.apiKey || '',
      [HEADER_BASE_URL]: getApiConfig()?.apiEndpoint || '',
      [HEADER_MODEL_ID]: getApiConfig()?.modelId || '',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    // 尝试读取后端返回的错误详情（如 API Key 未配置的具体原因）
    let errMsg = `AI 流式请求失败（${response.status}）`
    try {
      const err = await response.json()
      errMsg = err?.message || errMsg
    } catch {
      // 响应体非 JSON 时保留默认错误信息
    }
    throw new Error(errMsg)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('浏览器不支持流式读取')
  }

  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  // 逐块读取并解析 SSE 数据（后端统一包装事件格式）
  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // SSE 以 \n 分隔事件帧，按行切分；最后一段可能不完整，留回 buffer
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data:')) continue

      const data = trimmed.slice(5).trim()

      let parsed: { content?: string; done?: boolean; error?: string }

      try {
        parsed = JSON.parse(data)
      } catch {
        // 非 JSON 数据（如心跳/注释），跳过
        continue
      }

      // 后端中途出错（以 200 响应写入 error 事件）
      if (parsed.error) throw new Error(parsed.error)
      // 结束事件 {"done":true}
      if (parsed.done) return
      // 增量事件 {"content":"..."}
      if (parsed.content) yield parsed.content
    }
  }
}

/**
 * AI 流式对话（SSE）
 * 逐字返回 AI 回复，适用于实时交互的聊天场景。
 *
 * @param params - 对话消息列表与模型参数
 * @yields 文本增量片段
 */
export async function* chatStreamApi(
  params: ChatParams,
): AsyncGenerator<string, void, unknown> {
  yield* streamSse('/ai/chat/stream', params)
}

/**
 * AI 自我介绍流式生成
 * @param params - 简历纯文本与生成选项（场景/时长/语气）
 * @yields 文本增量片段
 */
export async function* selfIntroStreamApi(
  params: SelfIntroDto,
): AsyncGenerator<string, void, unknown> {
  yield* streamSse('/ai/self-intro/stream', params)
}

/**
 * 语法检查
 * @param params - 待检查的文本
 * @returns 语法问题列表，每项包含原文、建议与说明
 */
export function grammarCheckApi(
  params: GrammarCheckParams,
): Promise<GrammarCheckResult> {
  return post<GrammarCheckResult>('/ai/grammar-check', params, AI_API_CONFIG)
}

/**
 * 简历评分
 * @param params - 完整简历数据
 * @returns 总分、分维度评分与优化建议
 */
export function scoreResumeApi(
  params: ScoreParams,
): Promise<ResumeScoreResult> {
  return post<ResumeScoreResult>('/ai/resume-score', params, AI_API_CONFIG)
}

/**
 * 岗位匹配分析
 * @param params
 * @returns
 */
export function jobMatchApi(params: JobMatchDto): Promise<JobMatchResult> {
  return post<JobMatchResult>('/ai/job-match', params, AI_API_CONFIG)
}

/**
 * pdf转json（AI转）
 * @param params
 * @returns
 */
export function pdfToJsonApi(params: { pdfText: string }): Promise<Resume> {
  return post<Resume>('/ai/pdf-to-json', params, AI_API_CONFIG)
}

/**
 * 测试连接
 * @returns
 */
export function testConnectionApi(params: APIManufacturer) {
  return post('/ai/test-connection', params, {
    timeout: AI_TIMEOUT,
    headers: {
      [HEADER_API_KEY]: params.apiKey,
      [HEADER_BASE_URL]: params.apiEndpoint,
      [HEADER_MODEL_ID]: params.modelId || '',
    },
  })
}

export default {
  chatStreamApi,
  grammarCheckApi,
  scoreResumeApi,
  jobMatchApi,
  selfIntroStreamApi,
  pdfToJsonApi,
}
