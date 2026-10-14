<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { RobotOutlined, StopOutlined } from '@ant-design/icons-vue'
import type { ChatMessage } from '@/types/ai'
import ToolCallCard from './ToolCallCard.vue'

defineProps<{
  messages: ChatMessage[]
  loading: boolean
  renderMd: (text: string) => string
  getToolDisplayName: (name: string) => string
}>()

/** 滚动容器 DOM 引用 */
const listRef = ref<HTMLElement | null>(null)

/** 滚动到底部：nextTick 确保 DOM 更新后再操作 */
const scrollToBottom = () => {
  nextTick(() => {
    if (listRef.value) {
      listRef.value.scrollTop = listRef.value.scrollHeight
    }
  })
}

/** 暴露给父组件调用，用于主动触发滚动 */
defineExpose({ scrollToBottom })
</script>

<template>
  <div ref="listRef" class="message-list">
    <!-- 空状态欢迎 -->
    <div v-if="messages.length === 0" class="welcome">
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
      <div class="msg-main" :class="msg.role">
        <div class="bubble">
          <!-- AI 回复：工具调用卡片 + 打字动画 + Markdown 内容 -->
          <div
            v-if="msg.role === 'assistant'"
            class="bubble-content markdown-body"
          >
            <div
              v-if="msg.toolCalls && msg.toolCalls.length > 0"
              class="tool-call-list"
            >
              <ToolCallCard
                v-for="(tc, tcIdx) in msg.toolCalls"
                :key="tcIdx"
                :tool-call="tc"
                :display-name="getToolDisplayName(tc.name)"
              />
            </div>

            <!-- 打字动画：loading 中且无内容/无工具调用时显示 -->
            <div
              v-if="
                loading &&
                idx === messages.length - 1 &&
                !msg.content &&
                (!msg.toolCalls || msg.toolCalls.length === 0)
              "
              class="typing-indicator"
            >
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
            <div v-if="msg.content" v-html="renderMd(msg.content)"></div>
          </div>
          <!-- 用户消息：纯文本 -->
          <template v-else>{{ msg.content }}</template>
        </div>
        <!-- 手动停止生成提示 -->
        <div v-if="msg.role === 'assistant' && msg.stopped" class="stop-tip">
          <stop-outlined />
          <span>已手动停止生成</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
  gap: 0.6rem;

  .welcome-icon {
    font-size: var(--text-4xl);
    color: var(--color-primary);
  }

  .welcome-title {
    font-size: var(--text-base);
    font-weight: 600;
    margin: 0;
    color: var(--color-text);
  }

  .welcome-desc {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
    line-height: 1.6;
    max-width: 280px;
  }
}

.message-item {
  display: flex;

  &.user {
    justify-content: flex-end;
  }

  &.assistant {
    justify-content: flex-start;
  }

  .bubble {
    max-width: 100%;
    padding: 0.7rem 1rem;
    border-radius: 0.8rem;
    font-size: var(--text-xs);
    line-height: 1.7;
    word-break: break-word;
  }

  &.user .bubble {
    background: var(--color-primary);
    color: var(--color-text);
    border-bottom-right-radius: 0.2rem;
  }

  &.assistant .bubble {
    background: var(--color-bg-muted);
    color: var(--color-text);
    border-bottom-left-radius: 0.2rem;
  }

  /* 气泡 + 提示行纵向容器，宽度上限 85% 放这里确保百分比正确解析 */
  .msg-main {
    display: flex;
    flex-direction: column;
    max-width: 85%;

    &.user {
      align-items: flex-end;
    }

    &.assistant {
      align-items: flex-start;
    }
  }

  .stop-tip {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    margin-top: 0.4rem;
    font-size: var(--text-xs);
    color: var(--color-text);
  }
}

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
    font-size: var(--text-xs);
    background: rgba(0, 0, 0, 0.08);
  }
  :deep(blockquote) {
    margin: 0.4rem 0;
    padding: 0.4rem 0.8rem;
    border-left: 3px solid var(--color-primary);
    background: rgba(22, 119, 255, 0.08);
    border-radius: 0 0.4rem 0.4rem 0;
  }
}

.tool-call-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 0.6rem;
}

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

@media (prefers-reduced-motion: reduce) {
  .typing-indicator .dot {
    animation: none;
  }
}
</style>
