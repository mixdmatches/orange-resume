<script setup lang="ts">
import LineMdChatRoundDots from '~icons/line-md/chat-round-dots'
import LineMdPlusCircle from '~icons/line-md/plus-circle'
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch,
} from 'vue'
import {
  DeleteOutlined,
  RobotOutlined,
  CloseOutlined,
  MinusOutlined,
} from '@ant-design/icons-vue'
import ChatInput from '@/components/ChatInput.vue'
import MarkdownIt from 'markdown-it'
import {
  chatAiSessionApi,
  createAiSessionApi,
  deleteAiSessionApi,
  listChatSesstionsApi,
  listSessionMessagesApi,
} from '@/api/ai-session'
import type { ChatMessage } from '@/types/ai'
import type { AiSession } from '@/types/ai-sesstion'

/** 控制对话框显示/隐藏 */
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'update:open', value: boolean): void }>()

/** markdown-it 实例 */
const md = new MarkdownIt({ breaks: true, linkify: true })

/** 面板尺寸常量 */
const PANEL_WIDTH = 420
const PANEL_HEIGHT = 560
const HEADER_HEIGHT = 52

/** 面板位置 */
const posX = ref(0)
const posY = ref(0)

/** 拖动状态 */
let isDragging = false
let startX = 0
let startY = 0
let startLeft = 0
let startTop = 0

/** 是否最小化（折叠成标题栏） */
const minimized = ref(false)

/**
 * 打开时初始化到屏幕中央偏右
 */
const initPosition = () => {
  posX.value = (window.innerWidth - PANEL_WIDTH) / 2 + 120
  posY.value = Math.max(20, (window.innerHeight - PANEL_HEIGHT) / 2)
}

watch(
  () => props.open,
  open => {
    if (open && posX.value === 0 && posY.value === 0) {
      initPosition()
    }
  },
)

/**
 * 标题栏按下：开始拖拽
 */
const handleHeaderMouseDown = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (target.closest('.header-action')) return

  isDragging = true
  startX = e.clientX
  startY = e.clientY
  startLeft = posX.value
  startTop = posY.value
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
}

/**
 * 拖拽移动：更新位置并做边界限制
 */
const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging) return
  const deltaX = e.clientX - startX
  const deltaY = e.clientY - startY

  let newLeft = startLeft + deltaX
  let newTop = startTop + deltaY

  newLeft = Math.max(0, Math.min(window.innerWidth - PANEL_WIDTH, newLeft))
  newTop = Math.max(0, newTop)
  newTop = Math.min(window.innerHeight - HEADER_HEIGHT, newTop)

  posX.value = newLeft
  posY.value = newTop
}

/**
 * 释放鼠标：结束拖拽
 */
const handleMouseUp = () => {
  isDragging = false
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
}

/**
 * 窗口 resize 时修正越界位置
 */
const handleResize = () => {
  posX.value = Math.max(
    0,
    Math.min(window.innerWidth - PANEL_WIDTH, posX.value),
  )
  posY.value = Math.max(
    0,
    Math.min(window.innerHeight - HEADER_HEIGHT, posY.value),
  )
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
  window.removeEventListener('resize', handleResize)
})

/** 关闭对话框 */
const handleClose = () => {
  emit('update:open', false)
}

/** 切换最小化 */
const toggleMinimize = () => {
  minimized.value = !minimized.value
}

/* ================== 对话逻辑 ================== */

/** 对话消息列表（不含 system） */
const messages = ref<ChatMessage[]>([])

/** 用户输入框内容 */
const userInput = ref('')

/** 当前会话 ID（空对话首次发消息时才创建，之后复用） */
const sessionId = ref<string | null>(null)

/**
 * 正在流式响应的会话 ID 列表
 * 切换会话后旧会话的流仍在后台继续，需按会话维度记录，
 * 避免 loading 状态跨会话串扰（切走后误清、切回后丢失）
 */
const streamingSessionIds = ref<string[]>([])

/**
 * 正在流式响应的 assistant 消息引用（按会话缓存）
 * 切换会话时 messages 会被重新拉取替换，这里保留原流式对象，
 * 便于切回后把它塞回列表，继续逐字实时渲染
 */
const streamingMessages = new Map<string, ChatMessage>()

/** 当前视图会话是否正在等待 AI 回复（按会话隔离，切走后自动为 false，切回自动恢复） */
const loading = computed(
  () =>
    sessionId.value !== null &&
    streamingSessionIds.value.includes(sessionId.value),
)

/** 消息列表容器的 ref，用于自动滚动到底部 */
const messageListRef = ref<HTMLElement | null>(null)

const dropdownVisible = ref(false)

/**
 * 渲染 Markdown 为 HTML
 */
const renderMd = (text: string) => md.render(text)

/**
 * 切换会话
 * 清空本地消息并重置会话，回到空对话状态
 * 并将当前会话 ID 更新为选中的会话 ID
 * @param sessionId 会话 ID
 */
const handleSession = async (id: string) => {
  sessionId.value = id
  const res = await listSessionMessagesApi(id)
  // 后端按 id 倒序返回（最新在前），反转为时间正序以匹配发送时的顺序
  const list: ChatMessage[] = (res.list || []).reverse()

  // 该会话若仍在流式响应中，用流式引用替换列表末尾的空 assistant 占位符，
  // 使切回后能继续逐字实时渲染，而非等到流结束才一次性刷新
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

const handleDeleteSession = async (id: string) => {
  await deleteAiSessionApi(id)
  await refreshSessionList()
}

/**
 * 确保会话已创建
 * 空对话首发消息时调用后端创建会话并记录 ID；已有会话则直接复用。
 * 简历上下文与历史消息的组装均由后端完成，前端无需关心。
 * @returns 会话 ID
 */
const ensureSession = async (): Promise<string> => {
  if (sessionId.value) return sessionId.value
  const session = await createAiSessionApi({ type: 'chat' })
  sessionId.value = session.id
  return session.id
}

/**
 * 自动滚动到消息列表底部
 */
const scrollToBottom = () => {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

/**
 * 发送消息
 */
const handleSend = async () => {
  const input = userInput.value.trim()
  if (!input || loading.value) return

  // 1. 追加用户消息
  messages.value.push({ role: 'user', content: input })
  // 立即清空输入：既作为 v-model 反馈，也天然防抖多次发送（input 为空则早退）
  userInput.value = ''
  // 2. 追加空的 assistant 消息（用 reactive 使其在切换会话后仍能触发视图更新）
  const assistantMsg = reactive<ChatMessage>({ role: 'assistant', content: '' })
  messages.value.push(assistantMsg)
  scrollToBottom()

  // 本次回复所属的会话 ID（提前声明，catch 块需据此判断是否还停留原会话）
  let sid: string | null = null

  try {
    // 3. 空对话首发消息时先创建会话，后续复用同一会话
    sid = await ensureSession()
    // 标记本会话进入流式响应状态（按会话隔离，切走后保留，不会误清其他会话）
    streamingSessionIds.value = [...streamingSessionIds.value, sid]
    // 缓存流式消息引用，供切回后塞回列表继续实时渲染
    streamingMessages.set(sid, assistantMsg)

    // 4. 会话流式对话：按「对象引用」写入本次回复，避免切换会话后
    //    messages 被替换，误把 AI 增量拼到其他消息上
    for await (const delta of chatAiSessionApi(sid, { content: input })) {
      // 仅停留在本会话时才实时写入 UI；切走后该引用仍在缓存中，
      // 切回时由 handleSession 塞回列表，即可继续逐字渲染
      if (sessionId.value === sid) {
        assistantMsg.content += delta
        scrollToBottom()
      }
    }
  } catch (error) {
    // 出错时仅在仍停留在原会话的情况下，把空 assistant 消息替换为错误提示
    if (sessionId.value === sid) {
      assistantMsg.content = `> ⚠️ ${(error as Error).message || '请求失败，请重试'}`
    }
  } finally {
    // 结束本会话的流式状态（仅移除自己，不影响其他并发中的会话）
    if (sid) streamingMessages.delete(sid)
    streamingSessionIds.value = streamingSessionIds.value.filter(v => v !== sid)
  }
}

/** 是否有消息 */
const hasMessages = computed(() => messages.value.length > 0)

/**
 * 新建对话：清空本地消息并重置会话，回到空对话状态
 */
const handleNewChat = () => {
  if (loading.value) return
  messages.value = []
  sessionId.value = null
}

// =========会话列表==========

const sessionList = ref<AiSession[]>([])

/**
 * 刷新会话列表
 */
const refreshSessionList = async () => {
  const res = await listChatSesstionsApi()
  sessionList.value = res || []
}
</script>

<template>
  <transition name="fade-scale">
    <div
      v-if="props.open"
      class="ai-assistant"
      :class="{ minimized }"
      :style="{ left: posX + 'px', top: posY + 'px' }"
    >
      <!-- 标题栏（可拖动） -->
      <div class="panel-header" @mousedown="handleHeaderMouseDown">
        <div class="panel-title">
          <RobotOutlined style="margin-right: 0.4rem" />
          智能助手
        </div>
        <div class="header-actions">
          <a-button
            type="text"
            size="small"
            class="header-action"
            @click="handleNewChat"
          >
            <LineMdPlusCircle />
          </a-button>
          <a-dropdown v-model:open="dropdownVisible" :trigger="['click']">
            <a-button
              type="text"
              size="small"
              class="header-action"
              @click="refreshSessionList"
            >
              <LineMdChatRoundDots />
            </a-button>
            <template #overlay>
              <a-menu>
                <div v-if="sessionList.length === 0" class="session-empty">
                  暂无历史会话
                </div>
                <a-dropdown
                  v-for="session in sessionList"
                  :key="session.id"
                  :trigger="['contextmenu']"
                >
                  <a-menu-item
                    :class="{ active: session.id === sessionId }"
                    @click="handleSession(session.id)"
                  >
                    <span class="session-title">{{ session.title }}</span>
                  </a-menu-item>
                  <template #overlay>
                    <div class="session-menu">
                      <div
                        class="session-item"
                        danger
                        @click="handleDeleteSession(session.id)"
                      >
                        <span class="session-title">
                          <DeleteOutlined /> 删除会话</span
                        >
                      </div>
                      <div class="session-item">
                        <span class="session-title">
                          <EditOutlined /> 编辑标题</span
                        >
                      </div>
                    </div>
                  </template>
                </a-dropdown>
              </a-menu>
            </template>
          </a-dropdown>

          <a-button
            type="text"
            size="small"
            class="header-action minimize-btn"
            @click="toggleMinimize"
          >
            <MinusOutlined />
          </a-button>
          <a-button
            type="text"
            size="small"
            class="header-action close-btn"
            @click="handleClose"
          >
            <CloseOutlined />
          </a-button>
        </div>
      </div>

      <!-- 对话内容区 -->
      <div v-show="!minimized" class="panel-body">
        <!-- 消息列表 -->
        <div ref="messageListRef" class="message-list">
          <!-- 空状态欢迎 -->
          <div v-if="!hasMessages" class="welcome">
            <RobotOutlined class="welcome-icon" />
            <p class="welcome-title">你好，我是简历助手</p>
            <p class="welcome-desc">
              可以问我简历优化建议、项目怎么写、技能怎么描述等问题
            </p>
          </div>

          <!-- 消息气泡 -->
          <div
            v-for="(msg, idx) in messages"
            :key="idx"
            class="message-item"
            :class="msg.role"
          >
            <div class="bubble">
              <!-- AI 回复：等待中显示打字动画，有内容显示 Markdown -->
              <div
                v-if="msg.role === 'assistant'"
                class="bubble-content markdown-body"
              >
                <div
                  v-if="loading && idx === messages.length - 1 && !msg.content"
                  class="typing-indicator"
                >
                  <span class="dot"></span>
                  <span class="dot"></span>
                  <span class="dot"></span>
                </div>
                <div v-else v-html="renderMd(msg.content)"></div>
              </div>
              <!-- 用户消息：纯文本 -->
              <template v-else>{{ msg.content }}</template>
            </div>
          </div>
        </div>

        <!-- 输入区（DeepSeek 风格输入卡片） -->
        <div class="input-area">
          <ChatInput
            v-model:value="userInput"
            :loading="loading"
            :disabled="loading"
            :min-rows="1"
            :max-rows="6"
            placeholder="给智能助手发送消息…"
            hint="内容由 AI 生成，请仔细甄别"
            @send="handleSend"
          />
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped lang="scss">
.ai-assistant {
  position: fixed;
  width: 450px;
  height: 760px;
  max-height: 80vh;
  border-radius: 0.8rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 100;
  user-select: none;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.22);
  border: 1px solid transparent;
  @include themify(
    (
      background-color: $bg-color,
      border-color: $border-color-mode,
    )
  );

  &.minimized {
    height: auto;
    max-height: none;
  }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 0.8rem 0 1.2rem;
  background: $primary-color;
  color: #fff;
  cursor: move;

  .panel-title {
    font-size: 1.5rem;
    font-weight: 600;
    display: flex;
    align-items: center;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.2rem;
  }

  .header-action {
    color: #fff;
    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

/* 历史会话下拉列表（dropdown overlay teleport 到 body） */
.session-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 100px;
  max-width: 120px;
  border-radius: 054rem;
  padding: 0.4rem;
  border-radius: 0.5rem;
  @include themify(
    (
      background-color: $bg-color,
    )
  );
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.22);

  .session-empty {
    padding: 0.8rem;
    text-align: center;
    color: #999;
  }

  .session-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.3rem;
    padding: 0.35rem 0.5re4;
    gap: 0.4rem;
    padding: 0.5rem 0.6rem;
    border-radius: 0.4rem;
    cursor: pointer;

    &:hover {
      background: rgba(22, 119, 255, 0.08);
    }

    &.active {
      background: rgba(22, 119, 255, 0.12);
    }

    .session-title {
      flex: 1;
      min-width: 0;
      font-size: 1.2rem;
      white-space: nowrap;
      text-overflow: ellipsis;
      @include themify(
        (
          color: $text-color,
        )
      );
    }

    .session-delete-btn {
      flex-shrink: 0;
      opacity: 0;
      transition: opacity 0.15s;
      color: #999;

      &:hover {
        color: #ff4d4f;
      }
    }

    &:hover .session-delete-btn {
      opacity: 1;
    }
  }
}

.panel-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  user-select: text;
}

/* 消息列表 */
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

/* 欢迎页 */
.welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
  gap: 0.6rem;

  .welcome-icon {
    font-size: 3.5rem;
    color: $primary-color;
  }

  .welcome-title {
    font-size: 1.6rem;
    font-weight: 600;
    margin: 0;
    @include themify(
      (
        color: $text-color,
      )
    );
  }

  .welcome-desc {
    font-size: 1.3rem;
    color: #8c8c8c;
    margin: 0;
    line-height: 1.6;
    max-width: 280px;
  }
}

/* 消息气泡 */
.message-item {
  display: flex;

  &.user {
    justify-content: flex-end;
  }

  &.assistant {
    justify-content: flex-start;
  }

  .bubble {
    max-width: 85%;
    padding: 0.7rem 1rem;
    border-radius: 0.8rem;
    font-size: 1.3rem;
    line-height: 1.7;
    word-break: break-word;
  }

  &.user .bubble {
    background: $primary-color;
    color: #fff;
    border-bottom-right-radius: 0.2rem;
  }

  &.assistant .bubble {
    @include themify(
      (
        background-color: $layout-bg-color,
        color: $text-color,
      )
    );
    border-bottom-left-radius: 0.2rem;
  }
}

/* Markdown 渲染 */
.bubble-content {
  :deep(p) {
    margin: 0 0 0.6rem 0;
    &:last-child {
      margin-bottom: 0;
    }
  }
  :deep(strong) {
    font-weight: 600;
  }
  :deep(ul),
  :deep(ol) {
    margin: 0 0 0.6rem 0;
    padding-left: 1.6rem;
    &:last-child {
      margin-bottom: 0;
    }
  }
  :deep(li) {
    margin-bottom: 0.3rem;
  }
  :deep(code) {
    padding: 0.1rem 0.3rem;
    border-radius: 0.3rem;
    font-size: 1.2rem;
    background: rgba(0, 0, 0, 0.08);
  }
  :deep(blockquote) {
    margin: 0.4rem 0;
    padding: 0.4rem 0.8rem;
    border-left: 3px solid $primary-color;
    background: rgba(22, 119, 255, 0.08);
    border-radius: 0 0.4rem 0.4rem 0;
  }
}

/* 打字动画 */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0;

  .dot {
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    background: #999;
    animation: typing-bounce 1.4s infinite ease-in-out both;

    &:nth-child(2) {
      animation-delay: 0.16s;
    }
    &:nth-child(3) {
      animation-delay: 0.32s;
    }
  }
}

@keyframes typing-bounce {
  0%,
  80%,
  100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 输入区 */
.input-area {
  flex-shrink: 0;
  padding: 0.6rem 0.8rem 0.4rem;
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.92);
}
</style>
