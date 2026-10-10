<script setup lang="ts">
import type { TemplateInfo } from '@/template/index'
import type { Resume } from '@/types/resume'
import TemplateThumb from '@/components/TemplateThumb.vue'

const props = defineProps<{
  template: TemplateInfo
  previewResume: Resume
}>()

const emit = defineEmits<{
  (e: 'preview', id: string): void
  (e: 'use', id: string): void
}>()
</script>

<template>
  <article class="tpl-card">
    <!-- 实时渲染真实模板预览（fit="width" 自适应卡片宽度）-->
    <div class="tpl-cover" @click="emit('preview', props.template.id)">
      <TemplateThumb
        :template-id="props.template.id"
        :resume="props.previewResume"
        fit="width"
      />
    </div>

    <div class="tpl-body">
      <div class="tpl-info">
        <h3 class="tpl-name">{{ props.template.name }}</h3>
        <p class="tpl-desc">{{ props.template.description }}</p>
      </div>

      <div class="tpl-actions">
        <a-button @click="emit('preview', props.template.id)"> 预览 </a-button>
        <a-button type="primary" @click="emit('use', props.template.id)">
          使用
        </a-button>
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
.tpl-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: default;
  // Grid 子项默认 min-width:auto，会被内容撑开超出列宽；设为 0 让 grid 控制宽度
  min-width: 0;
  // 让同行卡片等高（align-items:stretch 默认生效）
  display: flex;
  flex-direction: column;
  transition:
    border-color var(--duration-base) var(--ease-out),
    box-shadow var(--duration-base) var(--ease-out);

  &:hover {
    border-color: var(--color-primary-border);
    box-shadow: var(--shadow-md);
  }
}

.tpl-cover {
  width: 100%;
  // 高度自适应：TemplateThumb 按 scale 输出完整 A4 缩放高度（1123×0.32≈359px）
  // 不写死高度，避免 flex 居中导致上下裁切，保证简历预览完整可见
  display: flex;
  justify-content: center;
  padding: var(--space-4);
  background: var(--color-bg-muted);
  overflow: hidden;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  // cover 也不能被内容撑宽
  min-width: 0;
}

.tpl-body {
  padding: var(--space-4);
  // flex:1 填满 cover 下方剩余空间，配合 flex column 让操作按钮贴底对齐
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.tpl-info {
  margin-bottom: var(--space-3);
  min-width: 0;
}

.tpl-name {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  margin-bottom: var(--space-1);
  // 标题过长省略，不撑宽卡片
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tpl-desc {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  line-height: var(--leading-normal);
  // 用 min-height 锁定描述区高度，1 行和 2 行时卡片等高
  // text-xs(14px) × leading-normal(1.5) × 2行 = 60px
  min-height: calc(var(--text-xs) * var(--leading-normal) * 2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  // 长单词/URL 断行，避免撑宽
  overflow-wrap: break-word;
  word-break: break-word;
}

.tpl-actions {
  display: flex;
  gap: var(--space-2);
  // margin-top:auto 贴底，无论描述 1 行还是 2 行按钮位置一致
  margin-top: auto;
  :deep(.ant-btn) {
    flex: 1;
  }
}
</style>
