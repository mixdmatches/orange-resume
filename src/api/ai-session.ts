import { streamSse } from '@/api/ai'
import type {
  AiSession,
  CreateSessionDto,
  SendMessageDto,
  SessionListParams,
  SessionListResult,
  SessionMessagesParams,
  SessionMessagesResult,
} from '@/types/ai-sesstion'
import { del, get, post } from '@/utils/request'

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
export function listChatSesstionsApi() {
  return get<AiSession[]>('/ai-sessions/chat')
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

/**
 * AI 会话流式对话（SSE）
 * 逐字返回 AI 回复，适用于实时交互的聊天场景。
 * 简历上下文与历史消息的组装由后端根据会话自动完成，前端只需传本次用户输入。
 *
 * @param sessionId 会话 ID
 * @param data 会话聊天 DTO
 * @yields 文本增量片段
 */
export async function* chatAiSessionApi(
  sessionId: string,
  data: SendMessageDto,
): AsyncGenerator<string, void, unknown> {
  yield* streamSse(`/ai-sessions/${sessionId}/chat/stream`, data)
}
