<script setup lang="ts">
import type { Resume } from '@/types/resume'
import TemplateThumb from '@/components/TemplateThumb.vue'

defineProps({
  resume: {
    type: Object as () => Resume | null,
    required: true,
  },
})
</script>

<template>
  <a-card class="resume-preview-card" bordered>
    <div class="preview-header">
      <div>
        <h3>简历预览</h3>
        <p>快速查看当前选中简历的核心信息，方便你基于内容提问 AI。</p>
      </div>
      <a-tag color="blue">当前简历</a-tag>
    </div>

    <div v-if="!resume" class="empty-state">
      <a-empty description="请先选择一份简历" />
    </div>

    <div class="preview-content">
      <!-- 用 TemplateThumb 统一缩略图渲染：自带 padding 页面边距 + 居中缩放 -->
      <TemplateThumb
        v-if="resume?.templateId"
        :template-id="resume.templateId"
        :resume="resume"
        :scale="0.54"
      />
    </div>
  </a-card>
</template>

<style scoped lang="scss">
.resume-preview-card {
  background: #fff;
  border-radius: 1rem;
  min-width: 360px;
  min-height: 320px;
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

.preview-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.preview-header h3 {
  margin: 0;
  font-size: 1.55rem;
}

.preview-header p {
  margin: 0.6rem 0 0;
  color: rgba(0, 0, 0, 0.65);
  @include themify(
    (
      color: (
        light: rgba(0, 0, 0, 0.65),
        dark: rgba(255, 255, 255, 0.65),
      ),
    )
  );
}

.preview-content {
  // 灰底衬托白纸，避免卡片白底与模板白纸融为一体
  padding: var(--space-4);
  background: var(--color-bg-muted);
  border-radius: var(--radius-lg);
  display: flex;
  justify-content: center;

  // A4 白纸加投影，呈现层次感
  :deep(.thumb-viewport) {
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-md);
  }
}
</style>
