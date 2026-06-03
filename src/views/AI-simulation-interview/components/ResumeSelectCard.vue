<script setup lang="ts">
import { computed } from 'vue'
import type { Resume } from '@/types/resume'

const props = defineProps({
  resumes: {
    type: Array as () => Resume[],
    default: () => [],
  },
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'manage'): void
  (e: 'preview'): void
}>()

const selectedResume = computed(
  () => props.resumes.find(item => item.id === props.modelValue) ?? null,
)

const options = computed(() =>
  props.resumes.map(item => ({
    label: item.title,
    value: item.id,
  })),
)

const currentValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
})
</script>

<template>
  <a-card class="resume-select-card" bordered>
    <div class="select-header">
      <div>
        <h3>选择简历</h3>
        <p>从已保存的简历中选择一份，AI 将基于该简历生成面试题目。</p>
      </div>
    </div>

    <div class="select-row">
      <a-select
        v-model:value="currentValue"
        :options="options"
        placeholder="请选择简历"
        style="min-width: 320px; width: 100%"
      />
      <a-space>
        <a-button
          type="default"
          :disabled="!selectedResume"
          @click="emit('preview')"
        >
          查看简历
        </a-button>
        <a-button type="default" @click="emit('manage')">我的简历</a-button>
      </a-space>
    </div>

    <div v-if="selectedResume" class="resume-summary">
      <a-space direction="vertical" size="middle">
        <a-tag color="blue">当前简历</a-tag>
        <div class="summary-line">
          <span class="label">标题：</span>
          <span>{{ selectedResume.title }}</span>
        </div>
        <div class="summary-line">
          <span class="label">姓名：</span>
          <span>{{ selectedResume.basic.name || '未填写' }}</span>
        </div>
        <div class="summary-line">
          <span class="label">求职方向：</span>
          <span>{{ selectedResume.basic.position || '未填写' }}</span>
        </div>
      </a-space>
    </div>

    <div v-else class="empty-hint">
      <a-empty description="暂无简历，请先创建或导入简历" />
    </div>
  </a-card>
</template>

<style scoped lang="scss">
.resume-select-card {
  min-width: 320px;
  border-radius: 1rem;
  background: #fff;
  @include themify(
    (
      background: (
        light: #fff,
        dark: #111827,
      ),
      border-color: (
        light: #f0f0f0,
        dark: rgba(255, 255, 255, 0.12),
      ),
    )
  );
}

.select-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.2rem;
}

.select-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.8rem;
  align-items: center;
  margin-bottom: 1.2rem;
}

.resume-summary {
  padding: 1rem 0;
  color: #333;
  @include themify(
    (
      color: (
        light: #333,
        dark: #f8faff,
      ),
    )
  );
}

.summary-line {
  display: flex;
  gap: 0.6rem;
  font-size: 1.3rem;
}

.label {
  color: rgba(0, 0, 0, 0.65);
  min-width: 70px;
  @include themify(
    (
      color: (
        light: rgba(0, 0, 0, 0.65),
        dark: rgba(255, 255, 255, 0.65),
      ),
    )
  );
}

.empty-hint {
  padding: 1rem 0;
  @include themify(
    (
      color: (
        light: #000,
        dark: #f8faff,
      ),
    )
  );
}
</style>
