<script setup lang="ts">
import { computed, provide } from 'vue'
import type { Resume } from '@/types/resume'
import templates from '@/template'

const props = defineProps({
  resume: {
    type: Object as () => Resume | null,
    required: true,
  },
})

provide('resume', props.resume)

// 当前选中的模板组件
const currentTemplate = computed(() => {
  const template = templates.find(t => t.id === props.resume?.templateId)
  return template?.component
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

    <div v-if="!props.resume" class="empty-state">
      <a-empty description="请先选择一份简历" />
    </div>

    <div class="preview-content">
      <div class="resume-preview-wrapper">
        <div class="preview-stage">
          <div class="preview-paper">
            <component :is="currentTemplate" v-if="currentTemplate" />
          </div>
        </div>
      </div>
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
  padding: 0;
  background: transparent;

  .resume-preview-wrapper {
    width: 100%;
    max-width: 860px;
    max-height: calc(100vh - 260px);
    overflow-y: auto;
    background: linear-gradient(180deg, #f7fbff 0%, #ffffff 100%);
    border: 1px solid rgba(24, 144, 255, 0.16);
    padding: 16px;
    border-radius: 18px;
    box-shadow: 0 18px 48px rgba(15, 23, 42, 0.12);
    margin: 0 auto;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    @include themify(
      (
        background: (
          light: linear-gradient(180deg, #f7fbff 0%, #ffffff 100%),
          dark: linear-gradient(180deg, #0f172a 0%, #111827 100%),
        ),
        border-color: (
          light: rgba(24, 144, 255, 0.16),
          dark: rgba(255, 255, 255, 0.08),
        ),
        box-shadow: (
          light: 0 18px 48px rgba(15, 23, 42, 0.12),
          dark: 0 18px 48px rgba(0, 0, 0, 0.45),
        ),
      )
    );

    .preview-stage {
      width: 100%;
      transform: scale(0.54);
      transform-origin: top center;
      border-radius: 18px;
      overflow: visible;
      background: transparent;
      box-shadow: none;
    }

    .preview-paper {
      width: 100%;
      aspect-ratio: 0.707 / 1;
      max-width: 720px;
      background: #ffffff;
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.08);
      box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }

    :deep(.resume-preview) {
      width: 100%;
      min-height: 100%;
    }
  }
}

.preview-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
