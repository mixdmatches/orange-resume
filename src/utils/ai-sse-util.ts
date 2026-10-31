import storage from '@/utils/storage.ts'
import { ACCESS_TOKEN_KEY } from '@/utils/request.ts'
import { ErrorCode } from '@/types/code.ts'

/* ============================================================
   常量配置
   ============================================================ */

/** 最大重试次数 */
const MAX_RETRIES = 3

/** 指数退避基础延迟（毫秒） */
const BASE_BACKOFF_MS = 1000

/** 指数退避最大延迟（毫秒） */
const MAX_BACKOFF_MS = 30000

/** 连接超时：多久连不上服务器算超时 */
const CONNECT_TIMEOUT_MS = 10000

/** 首包超时：连上后多久收不到第一个 SSE 事件算超时 */
const FIRST_BYTE_TIMEOUT_MS = 15000

/** 包间超时：两帧之间最长等待时间 */
const INTER_MESSAGE_TIMEOUT_MS = 30000

/* ============================================================
   类型定义
   ============================================================ */

export interface SseRetryInfo {
  retryCount: number
  nextDelayMs: number
  reason: string
}

export interface FetchSseOptions {
  errorPrefix?: string
  signal?: AbortSignal
  onRetry?: (info: SseRetryInfo) => void
}

/**
 * 计算指数退避延迟
 * 公式：min(base * 2^(retryCount-1), max)
 */
function calcBackoffDelay(retryCount: number): number {
  const delay = BASE_BACKOFF_MS * Math.pow(2, retryCount - 1)
  return Math.min(delay, MAX_BACKOFF_MS)
}

/**
 * 休眠指定毫秒
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 创建一个带超时的 Promise.race 包装器
 * @param promise 原始 Promise
 * @param ms 超时毫秒
 * @param errorMessage 超时错误信息
 */
function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  errorMessage: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), ms),
    ),
  ])
}

/**
 * 判断错误是否可重试
 * 以下情况不重试：
 * - 用户主动取消（AbortError）
 * - HTTP 4xx 客户端错误（401/403/404 等，除了 408 Request Timeout）
 * - HTTP 5xx 服务端错误可以重试
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // 用户主动取消
    if (error.name === 'AbortError') return false

    // 超时错误可以重试（可能是网络瞬时问题）
    if (error.message.includes('超时')) return true

    // HTTP 状态码判断
    const statusMatch = error.message.match(/\((\d{3})\)/)
    if (statusMatch) {
      const status = parseInt(statusMatch[1], 10)
      // 4xx 客户端错误不重试（除了 408）
      if (status >= 400 && status < 500 && status !== 408) return false
    }
  }
  return true
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
 * 带连接超时的 fetch 请求
 */
async function fetchWithConnectTimeout(
  url: string,
  init: RequestInit,
  errorPrefix: string,
): Promise<Response> {
  return withTimeout(
    fetch(url, init),
    CONNECT_TIMEOUT_MS,
    `${errorPrefix}（连接超时，请检查网络）`,
  )
}

/**
 * 读取 SSE 流的核心逻辑（单连接，无重试）
 * @returns 已接收的事件数量（用于判断是否需要重试）
 */
async function* readSseStream(
  path: string,
  body: unknown,
  opts: FetchSseOptions & { retryCount?: number },
): AsyncGenerator<Record<string, unknown>, number, unknown> {
  const { url, headers } = getRequestBase()
  const errorPrefix = opts.errorPrefix ?? '流式请求失败'

  // 创建独立的 AbortController，用于内部超时控制
  const internalController = new AbortController()

  // 如果外部传了 signal，监听其 abort 事件
  if (opts.signal) {
    opts.signal.addEventListener('abort', () => internalController.abort())
  }

  let response: Response
  try {
    response = await fetchWithConnectTimeout(
      `${url}${path}`,
      {
        method: 'POST',
        body: JSON.stringify(body),
        headers,
        signal: internalController.signal,
      },
      errorPrefix,
    )
  } catch (error) {
    // 连接阶段出错，向上抛出让重试逻辑处理
    throw error
  }

  if (!response.ok) {
    throw await parseStreamError(
      response,
      `${errorPrefix}（${response.status}）`,
    )
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('text/event-stream')) {
    throw await parseStreamError(response, `${errorPrefix}（响应格式异常）`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('浏览器不支持流式读取')
  }

  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let eventCount = 0
  let firstByteReceived = false

  // 首包超时定时器
  let firstByteTimer: ReturnType<typeof setTimeout> | null = null
  if (FIRST_BYTE_TIMEOUT_MS > 0) {
    firstByteTimer = setTimeout(() => {
      internalController.abort()
    }, FIRST_BYTE_TIMEOUT_MS)
  }

  // 包间超时定时器
  let interMessageTimer: ReturnType<typeof setTimeout> | null = null
  const resetInterMessageTimer = () => {
    if (interMessageTimer) clearTimeout(interMessageTimer)
    if (INTER_MESSAGE_TIMEOUT_MS > 0) {
      interMessageTimer = setTimeout(() => {
        internalController.abort()
      }, INTER_MESSAGE_TIMEOUT_MS)
    }
  }

  try {
    while (true) {
      let result: ReadableStreamReadResult<Uint8Array>
      try {
        result = await reader.read()
      } catch (error) {
        // 读取过程中出错（可能是超时 abort 或网络断开）
        throw error
      }

      const { done, value } = result
      if (done) break

      // 收到数据，清除首包超时定时器
      if (!firstByteReceived) {
        firstByteReceived = true
        if (firstByteTimer) {
          clearTimeout(firstByteTimer)
          firstByteTimer = null
        }
      }

      // 重置包间超时定时器
      resetInterMessageTimer()

      buffer += decoder.decode(value, { stream: true })

      // SSE 以 \n 分隔事件帧，按行切分；最后一段可能不完整，留回 buffer
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data:')) continue

        try {
          yield JSON.parse(trimmed.slice(5).trim())
          eventCount++
        } catch {
          continue
        }
      }
    }
  } finally {
    // 清理定时器
    if (firstByteTimer) clearTimeout(firstByteTimer)
    if (interMessageTimer) clearTimeout(interMessageTimer)
    reader.releaseLock()
  }

  return eventCount
}

/**
 * SSE 通用传输层（带指数退避重连 + 分层超时）
 *
 * 封装 fetch 请求、鉴权头注入、HTTP 错误与 401 兜底、ReadableStream 读取、
 * TCP 粘包/半包处理与事件帧 JSON 解析，不关心具体业务协议。
 *
 * 新增能力：
 * - 指数退避重连：网络断开时自动重试，最多 3 次，延迟 1s → 2s → 4s
 * - 分层超时：连接超时 10s / 首包超时 15s / 包间超时 30s
 * - 重试回调：通过 onRetry 通知上层展示"正在重试..."
 *
 * @param path - 接口路径（如 /ai/chat/stream）
 * @param body - 请求体，内部会 JSON.stringify
 * @param opts - 可选项配置
 * @yields 每帧解析后的 JSON 对象（具体结构由各业务协议定义）
 */
export async function* fetchSseEvents(
  path: string,
  body: unknown,
  opts?: FetchSseOptions,
): AsyncGenerator<Record<string, unknown>, void, unknown> {
  const errorPrefix = opts?.errorPrefix ?? '流式请求失败'
  let retryCount = 0

  while (true) {
    try {
      const eventCount = yield* readSseStream(path, body, {
        ...opts,
        errorPrefix,
        retryCount,
      })

      // 正常结束，检查是否收到了有效事件
      if (eventCount === 0 && retryCount < MAX_RETRIES) {
        // 没有收到任何事件，可能是网络问题，尝试重试
        throw new Error('响应未包含有效 SSE 事件')
      }

      // 成功完成
      return
    } catch (error) {
      // 超时导致的内部 abort 需要转换为普通错误，否则 isRetryableError 会因 AbortError 直接判定不可重试
      let retryableError: unknown = error

      // 用户主动取消，不再重试
      if (error instanceof Error && error.name === 'AbortError') {
        // 区分是用户主动取消还是超时导致的 abort
        if (opts?.signal?.aborted) {
          throw new Error('用户取消请求')
        }
        // 超时导致的 abort，转换为普通超时错误以进入重试流程
        retryableError = new Error(`${errorPrefix}（请求超时，请检查网络）`)
        if (retryCount >= MAX_RETRIES) {
          throw retryableError
        }
      }

      // 判断是否可重试
      if (!isRetryableError(retryableError)) {
        throw retryableError
      }

      retryCount++

      // 超过最大重试次数，抛出最后一次错误
      if (retryCount > MAX_RETRIES) {
        const lastError =
          retryableError instanceof Error
            ? retryableError
            : new Error(String(retryableError))
        throw new Error(
          `${errorPrefix}（已重试 ${MAX_RETRIES} 次仍失败：${lastError.message}）`,
        )
      }

      // 计算退避延迟
      const delayMs = calcBackoffDelay(retryCount)

      // 通知上层准备重试
      if (opts?.onRetry) {
        opts.onRetry({
          retryCount,
          nextDelayMs: delayMs,
          reason:
            retryableError instanceof Error
              ? retryableError.message
              : String(retryableError),
        })
      }

      // 等待后退避时间再重试
      await sleep(delayMs)
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
 * @param signal - 可选中止信号（"停止生成"时传入 AbortController.signal）
 * @param onRetry - 可选重试回调
 * @yields 文本增量片段
 */
export async function* streamSse(
  path: string,
  body: unknown,
  signal?: AbortSignal,
  onRetry?: (info: SseRetryInfo) => void,
): AsyncGenerator<string, void, unknown> {
  for await (const event of fetchSseEvents(path, body, {
    errorPrefix: 'AI 流式请求失败',
    signal,
    onRetry,
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