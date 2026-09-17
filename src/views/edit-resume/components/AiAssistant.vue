<script setup lang="ts">
import {
  computed,
  inject,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue'
import {
  RobotOutlined,
  CloseOutlined,
  MinusOutlined,
  SendOutlined,
} from '@ant-design/icons-vue'
import MarkdownIt from 'markdown-it'
import type { Resume } from '@/types/resume'
import { resumeToText } from '@/utils/resumeToText'
import { chatStreamApi } from '@/api'
import type { ChatMessage } from '@/types/ai'

/** 控制对话框显示/隐藏 */
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'update:open', value: boolean): void }>()

/** 简历数据 */
const resume = inject<Resume>('resume') as Resume

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

/** 是否正在等待 AI 回复 */
const loading = ref(false)

/** 消息列表容器的 ref，用于自动滚动到底部 */
const messageListRef = ref<HTMLElement | null>(null)

/**
 * 渲染 Markdown 为 HTML
 */
const renderMd = (text: string) => md.render(text)

const MAX_HISTORY_ROUNDS = 6

/**
 * 构造智能助手对话的消息列表
 * - 注入简历上下文作为 system 消息
 * - 截断历史对话，只保留最近 MAX_HISTORY_ROUNDS 轮
 * @param resumeText - 简历纯文本
 * @param history - 历史对话（不含当前这条）
 * @param userInput - 当前用户输入
 * @returns 可直接传给 chatWithStream 的消息列表
 */
const buildAssistantMessages = (
  resumeText: string,
  history: ChatMessage[],
  userInput: string,
): ChatMessage[] => {
  const systemPrompt = `你是一位资深简历顾问和职业规划师，正在协助用户优化简历。
以下是用户的简历内容，请基于此上下文回答问题：

${resumeText}

回答要求：
1. 具体可执行，避免空话套话
2. 如果用户问的是简历外的问题也可以回答，但要尽量结合简历情况
3. 回答用 Markdown 格式，重点加粗，用空行分段`

  // 只保留最近 MAX_HISTORY_ROUNDS 轮（每轮 2 条消息）
  const maxHistoryMessages = MAX_HISTORY_ROUNDS * 2
  const trimmedHistory =
    history.length > maxHistoryMessages
      ? history.slice(-maxHistoryMessages)
      : history

  return [
    { role: 'system', content: systemPrompt },
    ...trimmedHistory,
    { role: 'user', content: userInput },
  ]
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
  userInput.value = ''
  scrollToBottom()

  // 2. 先 push 一条空的 assistant 消息，用于流式填充
  messages.value.push({ role: 'assistant', content: '' })
  loading.value = true
  scrollToBottom()

  try {
    // 3. 构造消息列表（不含最后那条空 assistant）
    const history = messages.value.slice(0, -2)
    const resumeText = resumeToText(resume)
    const builtMessages = buildAssistantMessages(resumeText, history, input)

    // 4. 流式接收并填充到最后一条 assistant 消息
    for await (const delta of chatStreamApi({ messages: builtMessages })) {
      messages.value[messages.value.length - 1].content += delta
      scrollToBottom()
    }
  } catch (error) {
    // 出错时把空 assistant 消息替换为错误提示
    messages.value[messages.value.length - 1].content =
      `> ⚠️ ${(error as Error).message || '请求失败，请重试'}`
  } finally {
    loading.value = false
  }
}

/**
 * 输入框回车发送（Shift+Enter 换行）
 */
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

/** 是否有消息 */
const hasMessages = computed(() => messages.value.length > 0)
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

        <!-- 输入区 -->
        <div class="input-area">
          <div class="input-row">
            <a-textarea
              v-model:value="userInput"
              :auto-size="{ minRows: 1, maxRows: 6 }"
              :disabled="loading"
              placeholder="输入问题，Enter 发送，Shift+Enter 换行"
              class="input-textarea"
              @keydown="handleKeydown"
            />
            <a-button
              type="primary"
              :loading="loading"
              :disabled="!userInput.trim() || loading"
              class="send-btn"
              @click="handleSend"
            >
              <SendOutlined v-if="!loading" />
            </a-button>
          </div>
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
  z-index: 1100;
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
  border-top: 1px solid;
  padding: 0.6rem 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  @include themify(
    (
      border-color: $border-color-mode,
    )
  );

  .input-toolbar {
    display: flex;
    justify-content: flex-end;
  }

  .input-row {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;

    .input-textarea {
      flex: 1;
      min-width: 0;
      font-size: 1.3rem;
      resize: none;
      /* 超过 maxRows 后内部滚动 */
      overflow-y: auto;

      :deep(textarea) {
        font-size: 1.3rem;
      }
    }

    .send-btn {
      flex-shrink: 0;
    }
  }
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
