import { computed, onUnmounted, reactive, ref, type Ref } from 'vue'
import MarkdownIt from 'markdown-it'
import {
  agentChatStreamApi,
  createAiSessionApi,
  deleteAiSessionApi,
  listChatSesstionsApi,
  listSessionMessagesApi,
} from '@/api'
import { ensureAiProviderReady } from '@/utils/ai-ready'
import type { ChatMessage, ToolCallInfo } from '@/types/ai'
import type { AiSession } from '@/types/ai-sesstion'
import type { Resume } from '@/types/resume'

/** 工具内部名 → 中文展示名映射 */
const TOOL_NAME_MAP: Record<string, string> = {
  resume_score: '简历质量评分',
  grammar_check: '语法检查',
  job_match: '岗位匹配分析',
}

/**
 * AI 对话核心逻辑：消息列表、会话管理、Agent 流式响应
 * @param resume 当前简历（用于创建会话、查询会话列表）
 * @param resumeText 简历纯文本（注入 Agent 上下文）
 * @param scrollToBottom 滚动到底部回调（由主组件注入，操作消息列表 DOM）
 */
export function useAiChat(
  resume: Resume,
  resumeText: Ref<string | undefined>,
  scrollToBottom: () => void,
) {
  const messages = ref<ChatMessage[]>([])
  const userInput = ref('')
  const sessionId = ref<string | null>(null)

  const streamingSessionIds = ref<string[]>([])
  /** 正在流式响应的 assistant 消息引用（按会话缓存，便于切回继续渲染） */
  const streamingMessages = new Map<string, ChatMessage>()
  const chatControllers = new Map<string, AbortController>()

  const sessionList = ref<AiSession[]>([])

  const dropdownVisible = ref(false)

  const md = new MarkdownIt({ breaks: true, linkify: true })

  /** 当前视图会话是否正在等待 AI 回复 */
  const loading = computed(
    () =>
      sessionId.value !== null &&
      streamingSessionIds.value.includes(sessionId.value),
  )

  /** 是否有消息 */
  const hasMessages = computed(() => messages.value.length > 0)

  /** 工具内部名转中文展示名 */
  const getToolDisplayName = (name: string): string =>
    TOOL_NAME_MAP[name] || name

  const renderMd = (text: string) => md.render(text)

  /** 刷新历史会话列表，同时清空当前消息 */
  const refreshSessionList = async () => {
    const res = await listChatSesstionsApi(resume.id)
    sessionList.value = res || []
    messages.value = []
  }

  /**
   * 切换到指定会话：拉取历史消息并还原工具调用状态
   * 流式中断的 calling 记录刷新后标记为 error，避免永久转圈
   */
  const handleSession = async (id: string) => {
    sessionId.value = id
    const res = await listSessionMessagesApi(id)
    const list: ChatMessage[] = (res.list || []).reverse().map(m => ({
      ...m,
      toolCalls: m.toolCalls?.map(tc => ({
        ...tc,
        status: tc.status === 'calling' ? ('error' as const) : tc.status,
      })),
    }))

    // 流式中断的会话切回时，用流式引用替换末尾空占位符继续渲染
    const streaming = streamingMessages.get(id)
    if (
      streaming &&
      list.length > 0 &&
      list[list.length - 1].role === 'assistant' &&
      !list[list.length - 1].content
    ) {
      list[list.length - 1] = streaming
    }

    messages.value = list
    userInput.value = ''
    scrollToBottom()
  }

  /** 删除指定会话并刷新列表 */
  const handleDeleteSession = async (id: string) => {
    await deleteAiSessionApi(id)
    await refreshSessionList()
  }

  /** 空对话首发消息时创建会话，之后复用 */
  const ensureSession = async (): Promise<string> => {
    if (sessionId.value) return sessionId.value
    const session = await createAiSessionApi({
      resumeId: resume.id,
      type: 'chat',
    })
    sessionId.value = session.id
    return session.id
  }

  /** 新建对话：清空本地消息并重置会话 */
  const handleNewChat = () => {
    if (loading.value) return
    messages.value = []
    sessionId.value = null
  }

  /** 发送消息 */
  const handleSend = async () => {
    const input = userInput.value.trim()
    if (!input || loading.value) return
    if (!(await ensureAiProviderReady())) return

    messages.value.push({ role: 'user', content: input })
    userInput.value = ''
    const assistantMsg = reactive<ChatMessage>({
      role: 'assistant',
      content: '',
    })
    messages.value.push(assistantMsg)
    scrollToBottom()

    let sid: string | null = null
    try {
      sid = await ensureSession()
      streamingSessionIds.value = [...streamingSessionIds.value, sid]
      streamingMessages.set(sid, assistantMsg)
      const controller = new AbortController()
      chatControllers.set(sid, controller)

      for await (const event of agentChatStreamApi(
        sid,
        { content: input, resumeText: resumeText.value },
        controller.signal,
      )) {
        if (!assistantMsg.toolCalls) assistantMsg.toolCalls = []

        if (event.type === 'content') {
          if (sessionId.value === sid) {
            assistantMsg.content += event.content
            scrollToBottom()
          }
        } else if (event.type === 'reasoning') {
          if (sessionId.value === sid) {
            assistantMsg.reasoning += event.content
            scrollToBottom()
          }
        } else if (event.type === 'tool_call') {
          const toolCall: ToolCallInfo = {
            name: event.name,
            args: event.args,
            status: 'calling',
          }
          assistantMsg.toolCalls.push(toolCall)
          scrollToBottom()
        } else if (event.type === 'tool_result') {
          const tc = assistantMsg.toolCalls.find(
            t => t.name === event.name && t.status === 'calling',
          )
          if (tc) {
            tc.status = 'done'
            tc.output = event.output
          }
          scrollToBottom()
        } else if (event.type === 'error') {
          const lastCalling = [...assistantMsg.toolCalls]
            .reverse()
            .find(t => t.status === 'calling')
          if (lastCalling) lastCalling.status = 'error'
          throw new Error(event.error)
        }
      }
    } catch (error) {
      // 用户主动停止：不算错误，标记 stopped 让 UI 显示提示
      if ((error as Error).name === 'AbortError') {
        assistantMsg.stopped = true
        return
      }
      if (sessionId.value === sid) {
        assistantMsg.errorMessage =
          (error as Error).message || '请求失败，请重试'
      }
    } finally {
      if (sid) {
        streamingMessages.delete(sid)
        chatControllers.delete(sid)
      }
      streamingSessionIds.value = streamingSessionIds.value.filter(
        v => v !== sid,
      )
    }
  }

  /** 停止当前视图会话的 AI 生成 */
  const handleStopStream = () => {
    const sid = sessionId.value
    if (sid) chatControllers.get(sid)?.abort()
  }

  onUnmounted(() => {
    chatControllers.forEach(controller => controller.abort())
  })

  return {
    messages,
    userInput,
    sessionId,
    sessionList,
    dropdownVisible,
    loading,
    hasMessages,
    renderMd,
    getToolDisplayName,
    refreshSessionList,
    handleSession,
    handleDeleteSession,
    handleNewChat,
    handleSend,
    handleStopStream,
  }
}
