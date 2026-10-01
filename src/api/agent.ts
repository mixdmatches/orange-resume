import { fetchSseEvents } from '@/api/ai'

/** Agent SSE 事件类型 */
export type AgentSseEvent =
  | { type: 'start' }
  | { type: 'content'; content: string }
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
  /** 用户输入内容 */
  content: string
  /** 当前简历纯文本（可选，注入 system prompt 供工具使用） */
  resumeText?: string
  /** 指定厂商 ID（可选） */
  providerId?: string
}

/**
 * Agent 流式对话（SSE）
 * @param sessionId 会话 ID
 * @param params 对话参数（content + 可选 resumeText）
 * @param signal 可选中止信号
 * @yields AgentSseEvent 类型化事件
 */
export async function* agentChatStreamApi(
  sessionId: string,
  params: AgentChatParams,
  signal?: AbortSignal,
): AsyncGenerator<AgentSseEvent, void, unknown> {
  for await (const event of fetchSseEvents(
    `/agent/${sessionId}/chat/stream`,
    params,
    {
      errorPrefix: 'Agent 对话失败',
      signal,
    },
  )) {
    // 后端 SSE 帧结构就是 AgentSseEvent，直接透传
    yield event as AgentSseEvent
  }
}
