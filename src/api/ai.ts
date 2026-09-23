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
import { ErrorCode } from '@/types/code'
import type { Resume } from '@/types/resume'
import { AI_TIMEOUT, post, ACCESS_TOKEN_KEY } from '@/utils/request'
import { storage } from '@/utils/storage'

const AI_API_CONFIG = {
  timeout: AI_TIMEOUT,
}

/**
 * 获取请求基础地址与鉴权头（供 fetch 流式请求使用）
 */
export function getRequestBase(): {
  url: string
  headers: Record<string, string>
} {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const token = storage.get<string>(ACCESS_TOKEN_KEY)
  return {
    url: baseURL,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }
}

/**
 * 处理 fetch 流式请求的鉴权失效（原生 fetch 不走 axios 拦截器，需自行兜底）
 * 与 axios 拦截器行为对齐：清空 accessToken 并跳转登录页
 * @param status HTTP 状态码
 * @param code 后端统一响应体中的业务码
 */
function handleUnauthorized(status: number, code?: number) {
  if (status === 401 || code === ErrorCode.UNAUTHORIZED) {
    storage.remove(ACCESS_TOKEN_KEY)
    // 项目使用 hash 路由，直接改 hash 触发跳转
    if (!window.location.hash.startsWith('#/login')) {
      window.location.hash = '#/login'
    }
  }
}

/**
 * 解析流式请求的非 2xx 响应为 Error
 * 后端异常过滤器返回统一格式 { code, message, data }，优先取 message 展示给用户；
 * 鉴权失效时同步触发清 Token + 跳转登录
 * @param response fetch 响应对象
 * @param defaultMessage 响应体解析失败时的默认错误文案
 */
async function parseStreamError(
  response: Response,
  defaultMessage: string,
): Promise<Error> {
  let message = defaultMessage
  let code: number | undefined
  try {
    const body = await response.json()
    message = body?.message || message
    code = body?.code
  } catch {
    // 响应体非 JSON 时保留默认错误信息
  }
  handleUnauthorized(response.status, code)
  return new Error(message)
}

/**
 * SSE 通用传输层
 *
 * 封装 fetch 请求、鉴权头注入、HTTP 错误与 401 兜底、ReadableStream 读取、
 * TCP 粘包/半包处理与事件帧 JSON 解析，不关心具体业务协议，
 * 各流式接口（聊天 / 自我介绍 / 面试答题）基于它做协议适配即可复用。
 *
 * @param path - 接口路径（如 /ai/chat/stream）
 * @param body - 请求体，内部会 JSON.stringify
 * @param opts - 可选项：errorPrefix 用于拼接 HTTP 层默认错误文案
 * @yields 每帧解析后的 JSON 对象（具体结构由各业务协议定义）
 */
export async function* fetchSseEvents(
  path: string,
  body: unknown,
  opts?: { errorPrefix?: string },
): AsyncGenerator<Record<string, unknown>, void, unknown> {
  const { url, headers } = getRequestBase()

  const response = await fetch(`${url}${path}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers,
  })

  if (!response.ok) {
    // 尝试读取后端返回的错误详情（如 API Key 未配置的具体原因）
    throw await parseStreamError(
      response,
      `${opts?.errorPrefix ?? '流式请求失败'}（${response.status}）`,
    )
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('浏览器不支持流式读取')
  }

  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  // 逐块读取并解析 SSE 数据帧
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

      try {
        yield JSON.parse(trimmed.slice(5).trim())
      } catch {
        // 非 JSON 数据（如心跳/注释），跳过
        continue
      }
    }
  }
}

/**
 * 聊天协议适配（SSE 流式请求共享逻辑）
 *
 * 后端流式接口（chat/stream、self-intro/stream）的事件格式统一为：
 * - 增量：{"content":"..."}
 * - 结束：{"done":true}
 * - 出错：{"error":"..."}
 *
 * 在通用传输层 fetchSseEvents 之上做协议映射，对外 yield 文本增量片段。
 *
 * @param path - 接口路径（如 /ai/chat/stream）
 * @param body - 请求体，内部会 JSON.stringify
 * @yields 文本增量片段
 */
export async function* streamSse(
  path: string,
  body: unknown,
): AsyncGenerator<string, void, unknown> {
  for await (const event of fetchSseEvents(path, body, {
    errorPrefix: 'AI 流式请求失败',
  })) {
    const parsed = event as { content?: string; done?: boolean; error?: string }
    // 后端中途出错（以 200 响应写入 error 事件）
    if (parsed.error) throw new Error(parsed.error)
    // 结束事件 {"done":true}
    if (parsed.done) return
    // 增量事件 {"content":"..."}
    if (parsed.content) yield parsed.content
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
export function testConnectionApi(providerId: string) {
  return post(
    '/ai/test-connection',
    { providerId },
    {
      timeout: AI_TIMEOUT,
    },
  )
}

export default {
  chatStreamApi,
  grammarCheckApi,
  scoreResumeApi,
  jobMatchApi,
  selfIntroStreamApi,
  pdfToJsonApi,
}
