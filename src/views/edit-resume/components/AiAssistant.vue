<script setup lang="ts">
import { inject, ref, toRef } from 'vue'
import { message } from 'ant-design-vue'
import ChatInput from '@/components/ChatInput.vue'
import { usePanelDraggable } from '@/hooks/usePanelDraggable'
import { useAiChat } from '@/hooks/useAiChat'
import type { Resume } from '@/types/resume'
import type { SuggestionItem } from '@/types/ai'
import AiAssistantHeader from './ai-assistant/AiAssistantHeader.vue'
import AiMessageList from './ai-assistant/AiMessageList.vue'

const resume: Resume = inject('resume') as Resume

/** 控制面板显示/隐藏 */
const props = defineProps<{ open: boolean; resumeText?: string }>()
const emit = defineEmits<{ (e: 'update:open', value: boolean): void }>()

const {
  posX,
  posY,
  width,
  height,
  minimized,
  handleHeaderMouseDown,
  handleResizeMouseDown,
  toggleMinimize,
} = usePanelDraggable(toRef(props, 'open'))

/** 消息列表组件实例引用，用于调用子组件暴露的 scrollToBottom */
const messageListRef = ref<InstanceType<typeof AiMessageList> | null>(null)

const scrollToBottom = () => {
  messageListRef.value?.scrollToBottom()
}

/** AI 对话核心逻辑 */
const {
  messages,
  userInput,
  sessionId,
  sessionList,
  dropdownVisible,
  loading,
  retryInfo,
  renderMd,
  getToolDisplayName,
  refreshSessionList,
  handleSession,
  handleDeleteSession,
  handleNewChat,
  handleSend,
  handleStopStream,
} = useAiChat(resume, toRef(props, 'resumeText'), scrollToBottom)

/** 关闭面板 */
const handleClose = () => emit('update:open', false)

/**
 * 应用单条 AI 建议到简历
 * 根据 module + field 定位，用 rewritten 替换 original
 */
const handleApplySuggestion = (item: SuggestionItem) => {
  const { module, original, rewritten } = item

  /** 在对象中递归查找并替换第一条匹配的字符串 */
  const traverseAndReplace = (obj: unknown): boolean => {
    if (obj === null || typeof obj !== 'object') return false

    for (const key of Object.keys(obj)) {
      const val = (obj as Record<string, unknown>)[key]

      if (typeof val === 'string') {
        // original 为空表示新增，暂不处理（需要知道具体插入位置）
        if (!original) continue
        if (val.includes(original)) {
          ;(obj as Record<string, unknown>)[key] = val.replace(
            original,
            rewritten,
          )
          return true
        }
      } else if (Array.isArray(val)) {
        for (const el of val) {
          if (traverseAndReplace(el)) return true
        }
      } else if (typeof val === 'object' && val !== null) {
        if (traverseAndReplace(val)) return true
      }
    }
    return false
  }

  // 优先在对应模块内查找
  const targetModule = (resume as unknown as Record<string, unknown>)[module]
  if (targetModule !== undefined) {
    if (traverseAndReplace(targetModule)) {
      message.success('已应用到简历')
      return
    }
  }

  // 回退：全简历查找
  if (traverseAndReplace(resume)) {
    message.success('已应用到简历')
  } else {
    message.warning('未能在简历中找到对应文本，可能已被修改')
  }
}
</script>

<template>
  <transition name="fade-scale">
    <div
      v-if="props.open"
      class="ai-assistant"
      :class="{ minimized }"
      :style="{
        left: posX + 'px',
        top: posY + 'px',
        width: width + 'px',
        height: minimized ? undefined : height + 'px',
      }"
    >
      <AiAssistantHeader
        v-model:dropdown-open="dropdownVisible"
        :minimized="minimized"
        :session-list="sessionList"
        :session-id="sessionId"
        @header-mousedown="handleHeaderMouseDown"
        @new-chat="handleNewChat"
        @refresh-sessions="refreshSessionList"
        @select-session="handleSession"
        @delete-session="handleDeleteSession"
        @toggle-minimize="toggleMinimize"
        @close="handleClose"
      />

      <div v-show="!minimized" class="panel-body">
        <AiMessageList
          ref="messageListRef"
          :messages="messages"
          :loading="loading"
          :render-md="renderMd"
          :get-tool-display-name="getToolDisplayName"
          @apply-suggestion="handleApplySuggestion"
        />

        <!-- 网络重试提示 -->
        <div v-if="retryInfo" class="retry-tip">
          <span class="retry-icon">🔄</span>
          <span class="retry-text">
            网络波动，正在第 {{ retryInfo.retryCount }} 次重试…
          </span>
        </div>

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
            @stop="handleStopStream"
          />
        </div>
      </div>

      <!-- 拉伸把手：最小化态隐藏 -->
      <div
        v-show="!minimized"
        class="resize-handle resize-e"
        @mousedown="handleResizeMouseDown($event, 'e')"
      />
      <div
        v-show="!minimized"
        class="resize-handle resize-s"
        @mousedown="handleResizeMouseDown($event, 's')"
      />
      <div
        v-show="!minimized"
        class="resize-handle resize-se"
        @mousedown="handleResizeMouseDown($event, 'se')"
      />
    </div>
  </transition>
</template>

<style scoped lang="scss">
.ai-assistant {
  position: fixed;
  border-radius: 0.8rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 100;
  user-select: none;
  box-shadow: 0 12px 40px var(--shadow-xs);
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);

  &.minimized {
    height: auto;
  }
}

.panel-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  user-select: text;
}

.input-area {
  flex-shrink: 0;
  padding: 0.6rem 0.8rem 0.4rem;
}

/** 拉伸把手：默认透明，hover 显示淡蓝边线提示 */
.resize-handle {
  position: absolute;
  z-index: 10;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: rgba(22, 119, 255, 0.5);
  }
}

/** 右侧纵向把手 */
.resize-e {
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  cursor: ew-resize;
}

/** 底部横向把手 */
.resize-s {
  bottom: 0;
  left: 0;
  width: 100%;
  height: 4px;
  cursor: ns-resize;
}

/** 右下角把手：略大便于抓取 */
.resize-se {
  right: 0;
  bottom: 0;
  width: 12px;
  height: 12px;
  cursor: nwse-resize;
  z-index: 11;
}

/** 网络重试提示条 */
.retry-tip {
  flex-shrink: 0;
  padding: 0.4rem 0.8rem;
  background-color: var(--color-warning-bg, #fffbe6);
  border-top: 1px solid var(--color-warning-border, #ffe58f);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: var(--color-warning-text, #d48806);
  animation: retry-fade-in 0.2s ease;
}

.retry-icon {
  display: inline-block;
  animation: retry-spin 1s linear infinite;
}

@keyframes retry-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes retry-fade-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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
