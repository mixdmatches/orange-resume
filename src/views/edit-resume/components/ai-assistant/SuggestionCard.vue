<script setup lang="ts">
import { CheckOutlined, EditOutlined } from '@ant-design/icons-vue'
import type { SuggestionItem } from '@/types/ai'

const props = defineProps<{
  item: SuggestionItem
}>()

const emit = defineEmits<{
  (e: 'apply', item: SuggestionItem): void
}>()

const MODULE_NAME_MAP: Record<string, string> = {
  basic: '基本信息',
  education: '教育经历',
  work: '工作经历',
  internship: '实习经历',
  project: '项目经历',
  skill: '技能特长',
  custom: '自定义',
}

const getModuleLabel = (module: string) => MODULE_NAME_MAP[module] || module

const FIELD_NAME_MAP: Record<string, string> = {
  description: '描述',
  highlights: '亮点',
  position: '职位',
  name: '名称',
  companyName: '公司',
  school: '学校',
  major: '专业',
  role: '角色',
  skills: '技能',
}

const getFieldLabel = (field: string) => FIELD_NAME_MAP[field] || field
</script>

<template>
  <div class="suggestion-card">
    <div class="card-header">
      <div class="module-tag">
        <EditOutlined />
        <span>{{ getModuleLabel(props.item.module) }}</span>
        <span v-if="props.item.field" class="field-label"
          >· {{ getFieldLabel(props.item.field) }}</span
        >
      </div>
    </div>

    <div class="diff-body">
      <div v-if="props.item.original" class="diff-row original">
        <span class="diff-label del">原文</span>
        <span class="diff-text del">{{ props.item.original }}</span>
      </div>
      <div v-else class="diff-row original empty">
        <span class="diff-label del">原文</span>
        <span class="diff-text placeholder">（新增内容）</span>
      </div>

      <div class="diff-arrow">→</div>

      <div class="diff-row rewritten">
        <span class="diff-label add">改写</span>
        <span class="diff-text add">{{ props.item.rewritten }}</span>
      </div>
    </div>

    <div v-if="props.item.reason" class="reason-row">
      <span class="reason-label">理由：</span>
      <span class="reason-text">{{ props.item.reason }}</span>
    </div>

    <div class="card-footer">
      <a-button
        size="small"
        type="primary"
        class="apply-btn"
        @click="emit('apply', props.item)"
      >
        <template #icon><CheckOutlined /></template>
        应用到简历
      </a-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.suggestion-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  font-size: var(--text-xs);
  line-height: 1.6;
}

.card-header {
  padding: 0.5rem 0.8rem;
  background: rgba(22, 119, 255, 0.04);
  border-bottom: 1px solid var(--color-border);
}

.module-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-primary);

  .field-label {
    font-weight: 400;
    color: var(--color-text-secondary);
  }
}

.diff-body {
  padding: 0.6rem 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.diff-row {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;

  &.empty .diff-text.placeholder {
    color: var(--color-text-secondary);
    font-style: italic;
  }
}

.diff-label {
  flex-shrink: 0;
  width: 2.2rem;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.1rem 0.25rem;
  border-radius: 0.25rem;
  text-align: center;

  &.del {
    color: #cf1322;
    background: rgba(255, 77, 79, 0.1);
  }

  &.add {
    color: #389e0d;
    background: rgba(82, 196, 26, 0.1);
  }
}

.diff-text {
  flex: 1;
  word-break: break-word;

  &.del {
    color: var(--color-text-secondary);
    text-decoration: line-through;
    text-decoration-color: #ff4d4f;
    text-decoration-thickness: 1.5px;
  }

  &.add {
    color: var(--color-text);
    font-weight: 500;
  }
}

.diff-arrow {
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: 1;
  padding: 0.1rem 0;
}

.reason-row {
  padding: 0 0.8rem 0.5rem;
  font-size: var(--text-xs);
  color: var(--color-text-secondary);

  .reason-label {
    font-weight: 600;
    color: var(--color-text);
  }
}

.card-footer {
  padding: 0.4rem 0.8rem 0.6rem;
  display: flex;
  justify-content: flex-end;
}

.apply-btn {
  font-size: var(--text-xs);
}
</style>
