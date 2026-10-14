<script setup lang="ts">
import { inject, ref, toRef } from 'vue'
import ChatInput from '@/components/ChatInput.vue'
import { usePanelDraggable } from '@/hooks/usePanelDraggable'
import { useAiChat } from '@/hooks/useAiChat'
import type { Resume } from '@/types/resume'
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
        />

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
