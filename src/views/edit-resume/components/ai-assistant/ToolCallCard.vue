<script setup lang="ts">
import type { ToolCallInfo } from '@/types/ai'
defineProps<{ toolCall: ToolCallInfo; displayName: string }>()
</script>

<template>
  <div class="tool-call-item" :class="toolCall.status">
    <span class="tool-icon">
      <template v-if="toolCall.status === 'calling'">⏳</template>
      <template v-else-if="toolCall.status === 'done'">✅</template>
      <template v-else>❌</template>
    </span>
    <span class="tool-name">{{ displayName }}</span>
    <span class="tool-status-text">
      <template v-if="toolCall.status === 'calling'">分析中…</template>
      <template v-else-if="toolCall.status === 'done'">已完成</template>
      <template v-else>失败</template>
    </span>
  </div>
</template>

<style scoped lang="scss">
.tool-call-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.7rem;
  border-radius: 0.5rem;
  font-size: var(--text-xs);
  background: rgba(22, 119, 255, 0.06);
  border: 1px solid rgba(22, 119, 255, 0.12);

  .tool-icon {
    font-size: var(--text-sm);
    flex-shrink: 0;
  }

  .tool-name {
    font-weight: 600;
    color: var(--color-text);
  }

  .tool-status-text {
    margin-left: auto;
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  &.done {
    background: rgba(82, 196, 26, 0.08);
    border-color: rgba(82, 196, 26, 0.2);
  }

  &.error {
    background: rgba(255, 77, 79, 0.08);
    border-color: rgba(255, 77, 79, 0.2);
  }
}
</style>
