<script setup lang="ts">
import type { Resume } from '@/types/resume'
import { computed, inject, ref, onMounted, watch, onUnmounted } from 'vue'
import { getTemplateById } from '@/template'

const resume: Resume = inject('resume') as Resume

const styles = computed(() => resume.globalConfiguration)

const previewCardRef = ref<HTMLElement | null>(null) // 引用预览卡片元素
const contentHeight = ref(0) // 实际内容高度

// 计算页面高度（A4 高度减去上下边距）
const pageHeight = computed(() => {
  const a4Height = 297 // A4 高度（mm）
  return a4Height
})

// 计算分页位置
const pageBreakPositions = computed(() => {
  const positions: number[] = []
  if (contentHeight.value <= 0) return positions

  // 计算需要的页数
  const pageCount = Math.ceil(contentHeight.value / pageHeight.value)

  // 生成分页位置
  for (let i = 1; i < pageCount; i++) {
    positions.push(pageHeight.value * i)
  }

  return positions
})

// 计算实际内容高度
const updateContentHeight = () => {
  if (previewCardRef.value) {
    // 获取实际内容高度（转换为mm）
    const rect = previewCardRef.value.getBoundingClientRect()
    // 假设 1px = 0.2645833333 mm
    contentHeight.value = rect.height * 0.2645833333
  }
}

// 监听内容变化
watch(
  () => [
    resume.educations,
    resume.internships,
    resume.projects,
    resume.skills,
    resume.customData,
  ],
  () => {
    // 延迟更新，确保DOM已更新
    setTimeout(updateContentHeight, 100)
  },
  { deep: true },
)

// 监听样式变化
watch(
  () => styles.value,
  () => {
    setTimeout(updateContentHeight, 100)
  },
  { deep: true },
)

// 组件挂载后计算高度
onMounted(() => {
  updateContentHeight()
  window.addEventListener('resize', updateContentHeight)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateContentHeight)
})

const currentTemplate = computed(() => {
  const template = getTemplateById(resume.templateId)
  return template?.component || getTemplateById('classic')?.component
})
</script>

<template>
  <div class="view-content">
    <div class="preview-wrapper">
      <div
        ref="previewCardRef"
        class="preview-card"
        :style="{
          gap: `${styles.baseModuleSpacing}px`,
          padding: `${styles.basePagePadding}px`,
        }"
      >
        <!-- 分页标识 -->
        <div
          v-for="(position, index) in pageBreakPositions"
          :key="index"
          class="page-break"
          :style="{ top: `${position}mm` }"
        >
          <div class="page-break-line"></div>
          <div class="page-break-text">第 {{ index + 1 }} 页 截止</div>
        </div>

        <component :is="currentTemplate" :resume="resume"></component>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.view-content {
  height: 100%;
  border-radius: 0.5rem;
  padding: 1rem;
  @include themify(
    (
      color: $text-color,
    )
  );
}

.preview-wrapper {
  display: flex;
  justify-content: center;
  height: 100%;
  overflow-y: auto;
  position: relative;
}

.preview-card {
  width: 210mm;
  min-height: 297mm; /* A4 高度 */
  color: #111827;
  padding: 24px;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  cursor: pointer;
  position: relative;
}

/* 分页标识 */
.page-break {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.page-break-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #ff6b6b, transparent);
  opacity: 0.7;
}

.page-break-text {
  background: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  color: #ff6b6b;
  font-weight: 500;
  z-index: 11;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.preview-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e6eb;
  margin-bottom: 10px;
  .profile {
    h1 {
      font-size: 32px;
      margin: 0;
      color: #111827;
    }
    p {
      margin-top: 4px;
      color: #4b5563;
    }
  }

  .contact {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 14px;
    color: #4b5563;
    text-align: right;
  }
}
</style>
