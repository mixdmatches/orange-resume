<script setup lang="ts">
import LineMdChatRoundDots from '~icons/line-md/chat-round-dots'
import LineMdPlusCircle from '~icons/line-md/plus-circle'
import {
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  MinusOutlined,
  RobotOutlined,
} from '@ant-design/icons-vue'
import type { AiSession } from '@/types/ai-sesstion'

defineProps<{
  /** 是否最小化 */
  minimized: boolean
  sessionList: AiSession[]
  sessionId: string | null
  dropdownOpen: boolean
}>()

const emit = defineEmits<{
  /** 标题栏按下（开始拖拽） */
  (e: 'header-mousedown', ev: MouseEvent): void
  (e: 'new-chat'): void
  (e: 'refresh-sessions'): void
  (e: 'select-session', id: string): void
  (e: 'delete-session', id: string): void
  (e: 'toggle-minimize'): void
  (e: 'close'): void
  (e: 'update:dropdownOpen', value: boolean): void
}>()

/** 标题栏按下：透传给父组件启动拖拽 */
const onMouseDown = (e: MouseEvent) => {
  emit('header-mousedown', e)
}
</script>

<template>
  <div class="panel-header" @mousedown="onMouseDown">
    <div class="panel-title">
      <RobotOutlined style="margin-right: 0.4rem" />
      智能助手
    </div>
    <div class="header-actions">
      <a-button
        type="text"
        size="small"
        class="header-action"
        @click="$emit('new-chat')"
      >
        <LineMdPlusCircle />
      </a-button>
      <a-dropdown
        :open="dropdownOpen"
        :trigger="['click']"
        @update:open="(v: boolean) => $emit('update:dropdownOpen', v)"
      >
        <a-button
          type="text"
          size="small"
          class="header-action"
          @click="$emit('refresh-sessions')"
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
                @click="$emit('select-session', session.id)"
              >
                <span class="session-title">{{ session.title }}</span>
              </a-menu-item>
              <template #overlay>
                <div class="session-menu">
                  <div
                    class="session-item"
                    danger
                    @click="$emit('delete-session', session.id)"
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
        @click="$emit('toggle-minimize')"
      >
        <MinusOutlined />
      </a-button>
      <a-button
        type="text"
        size="small"
        class="header-action close-btn"
        @click="$emit('close')"
      >
        <CloseOutlined />
      </a-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 0.8rem 0 1.2rem;
  background: var(--color-surface);
  color: var(--color-text);
  cursor: move;

  .panel-title {
    font-size: var(--text-base);
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
    color: var(--color-text);
    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

/* 历史会话下拉列表（teleport 到 body） */
.session-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 100px;
  max-width: 120px;
  padding: 0.4rem;
  border-radius: 0.5rem;
  background-color: var(--color-surface);
  box-shadow: 0 12px 40px var(--shadow-xs);

  .session-empty {
    padding: 0.8rem;
    text-align: center;
    color: var(--color-text);
  }

  .session-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
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
      font-size: var(--text-xs);
      white-space: nowrap;
      text-overflow: ellipsis;
      color: var(--color-text);
    }
  }
}
</style>
