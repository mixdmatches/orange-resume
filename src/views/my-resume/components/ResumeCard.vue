<script setup lang="ts">
import { DeleteOutlined, EditOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import TemplateThumb from '@/components/TemplateThumb.vue'
import type { Resume } from '@/types/resume'

defineProps<{
  resume: Resume
  /** 多选模式 */
  selectMode: boolean
  /** 多选模式下是否被选中 */
  selected: boolean
}>()

const emit = defineEmits<{
  /** 卡片点击（多选切换选中 / 非多选进入编辑，由父级决定） */
  click: []
  edit: [id: string]
  delete: [id: string]
}>()

/** 格式化时间 */
const formatTime = (t?: number) => {
  if (!t) return '未更新'
  return dayjs(t).format('YYYY-MM-DD HH:mm')
}
</script>

<template>
  <article
    class="resume-card"
    :class="{ selected: selectMode && selected }"
    @click="emit('click')"
  >
    <!-- 缩略图：实时渲染该简历对应模板（fit="width" 自适应卡片宽度）-->
    <div class="card-thumb">
      <TemplateThumb
        :template-id="resume.templateId"
        :resume="resume"
        fit="width"
      />
    </div>

    <div class="card-body">
      <h3 class="card-title">{{ resume.title }}</h3>
      <p class="card-meta">创建于 {{ formatTime(resume.createdAt) }}</p>
      <p class="card-meta">更新于 {{ formatTime(resume.updatedAt || 0) }}</p>
    </div>

    <div class="card-actions">
      <button
        class="card-action-btn"
        title="编辑"
        @click.stop="emit('edit', resume.id)"
      >
        <edit-outlined />
      </button>
      <button
        class="card-action-btn danger"
        title="删除"
        @click.stop="emit('delete', resume.id)"
      >
        <delete-outlined />
      </button>
    </div>

    <!-- 多选模式下的复选框 -->
    <div v-if="selectMode" class="card-check">
      <a-checkbox :checked="selected" />
    </div>
  </article>
</template>

<style scoped lang="scss">
.resume-card {
  position: relative;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  // Grid 子项 min-width:auto 会被内容撑开，设 0 让 grid 控制列宽
  min-width: 0;
  // flex column 让卡片内容纵向排列，card-body 可 flex:1 填满
  display: flex;
  flex-direction: column;
  transition:
    border-color var(--duration-base) var(--ease-out),
    box-shadow var(--duration-base) var(--ease-out);
  animation: fade-up var(--duration-slow) var(--ease-out) both;

  &:hover {
    border-color: var(--color-primary-border);
    box-shadow: var(--shadow-md);

    .card-actions {
      opacity: 1;
      transform: translateY(0);
    }
  }

  &.selected {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary);
  }
}

.card-thumb {
  width: 100%;
  // 高度自适应：scale 0.3 时 TemplateThumb 完整高度约 337px，不写死避免裁切
  display: flex;
  justify-content: center;
  padding: var(--space-4);
  background: var(--color-bg-muted);
  overflow: hidden;
  border-bottom: 1px solid var(--color-border);
}

.card-body {
  padding: var(--space-3) var(--space-4);
  // flex:1 填满卡片剩余空间，让同行卡片内 body 等高
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.card-actions {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  display: flex;
  gap: var(--space-1);
  opacity: 0;
  transform: translateY(-4px);
  transition:
    opacity var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-out);

  // 多选模式下隐藏操作按钮
  .resume-card.selected & {
    display: none;
  }
}

.card-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 16px;
  transition: all var(--duration-base) var(--ease-out);

  &:hover {
    color: var(--color-text);
    border-color: var(--color-border-strong);
  }

  &.danger:hover {
    color: var(--color-danger);
    border-color: var(--color-danger);
    background: var(--color-danger-bg);
  }
}

.card-check {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
}
</style>
