<script setup lang="ts">
import { DeleteOutlined } from '@ant-design/icons-vue'

defineProps<{
  allSelected: boolean
  indeterminate: boolean
  selectedCount: number
  totalCount: number
}>()

const emit = defineEmits<{
  checkAll: [checked: boolean]
  delete: []
}>()

const onCheckAllChange = (e: Event) => {
  emit('checkAll', (e.target as HTMLInputElement).checked)
}
</script>

<template>
  <section class="batch-bar">
    <div class="batch-left">
      <a-checkbox
        :checked="allSelected"
        :indeterminate="indeterminate"
        @change="onCheckAllChange"
      >
        全选
      </a-checkbox>
      <span class="selected-count">
        已选 <a-tag color="blue">{{ selectedCount }}</a-tag> / 共
        {{ totalCount }} 份
      </span>
    </div>
    <a-button danger :disabled="selectedCount === 0" @click="emit('delete')">
      <template #icon><DeleteOutlined /></template>
      删除选中
    </a-button>
  </section>
</template>

<style scoped lang="scss">
.batch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);

  .batch-left {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .selected-count {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);

    :deep(.ant-tag) {
      margin-inline-end: 4px;
    }
  }
}
</style>
