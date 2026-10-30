import type {
  AiSession,
  CreateSessionDto,
  SessionListParams,
  SessionListResult,
  SessionMessagesParams,
  SessionMessagesResult,
} from '@/types/ai-sesstion'
import { del, get, post } from '@/utils/request'
import { fetchSseEvents, type SseRetryInfo } from '@/utils/ai-sse-util.ts'

/** Agent SSE 事件类型 */
export type AgentSseEvent =
  | { type: 'start' }
  | { type: 'content'; content: string }
  | { type: 'reasoning'; content: string }
  | { type: 'tool_call'; name: string; args: Record<string, unknown> }
  | { type: 'tool_result'; name: string; output: string }
  | {
      type: 'done'
      messageId?: string
      promptTokens?: number
      completionTokens?: number
    }
  | { type: 'error'; error: string }

/** Agent 对话请求参数 */
export interface AgentChatParams {
  content: string
  resumeText: string
  providerId?: string
}

/**
 * Agent 流式对话（SSE）
 * @param sessionId 会话 ID
 * @param params 对话参数（content + 可选 resumeText）
 * @param signal 可选中止信号
 * @param onRetry 可选重试回调
 * @yields AgentSseEvent 类型化事件
 */
export async function* agentChatStreamApi(
  sessionId: string,
  params: AgentChatParams,
  signal?: AbortSignal,
  onRetry?: (_info: SseRetryInfo) => void,
): AsyncGenerator<AgentSseEvent, void, unknown> {
  for await (const event of fetchSseEvents(
    `/ai-sessions/${sessionId}/send-message`,
    params,
    {
      errorPrefix: 'Agent 对话失败',
      signal,
      onRetry,
    },
  )) {
    // 后端 SSE 帧结构就是 AgentSseEvent，直接透传
    yield event as AgentSseEvent
  }
}

/**
 * 创建会话
 * 打开助手时先不创建，首次发送消息时才调用，之后复用同一会话。
 * @param data 创建会话 DTO
 * @returns 会话对象（含会话 ID）
 */
export function createAiSessionApi(data: CreateSessionDto) {
  return post<AiSession>('/ai-sessions', data)
}

/**
 * 会话列表（offset 分页，按最近活跃倒序，排除已删除）
 * @param params 类型筛选 + 页码/页大小
 * @returns 会话列表与分页信息
 */
export function listAiSessionsApi(params: SessionListParams) {
  return get<SessionListResult>('/ai-sessions', params)
}

/**
 * 对话会话列表(不分页)
 * @returns 对话会话列表
 */
export function listChatSesstionsApi(resumeId: string) {
  return get<AiSession[]>(`/ai-sessions/chat/${resumeId}`)
}

/**
 * 删除会话（软删除，仅标记不物理清除）
 * @param sessionId 会话 ID
 * @returns 删除结果
 */
export function deleteAiSessionApi(sessionId: string) {
  return del<{ success: true }>(`/ai-sessions/${sessionId}`)
}

/**
 * 会话消息列表（游标分页，id 倒序，最新在前；前端展示时需反转）
 * @param sessionId 会话 ID
 * @param params 游标 + 每页条数
 * @returns 消息列表与翻页信息
 */
export function listSessionMessagesApi(
  sessionId: string,
  params?: SessionMessagesParams,
) {
  return get<SessionMessagesResult>(
    `/ai-sessions/${sessionId}/messages`,
    params,
  )
}

export default {
  createAiSessionApi,
  listAiSessionsApi,
  listChatSesstionsApi,
  deleteAiSessionApi,
  listSessionMessagesApi,
}
