<script setup lang="ts">
import type { Resume } from '@/types/resume'
import { computed, inject, ref, onMounted, watch, onUnmounted } from 'vue'
import { getTemplateById } from '@/template'
import { useAutoOnePage } from '@/hooks/useAutoOnePage'
import { message } from 'ant-design-vue'

const resume: Resume = inject('resume') as Resume

const styles = computed(() => resume.globalConfiguration)

const previewCardRef = ref<HTMLElement | null>(null) // 引用预览卡片元素
const contentHeight = ref(0) // 实际内容高度

const pagePadding = computed(() => resume.globalConfiguration.basePagePadding)
const autoOnePageEnabled = computed(
  () => resume.globalConfiguration.autoOnePage,
)

const { scaleFactor, isScaled, cannotFit } = useAutoOnePage({
  contentHeight,
  pagePadding,
  enabled: autoOnePageEnabled,
})

watch(
  () => cannotFit.value,
  newVal => {
    if (newVal) {
      message.warning('内容过多无法完美一页')
    }
  },
)

// 计算分页位置
const pageBreakPositions = computed(() => {
  const positions: number[] = []
  if (contentHeight.value <= 0) return positions
  // 仅在真正能成功缩放到一页时隐藏分页线
  if (isScaled.value && !cannotFit.value) return positions

  const MM_TO_PX = 3.78
  // 将内容高度从像素转换为毫米，然后计算页数
  const contentHeightMm = contentHeight.value / MM_TO_PX
  const pageCount = Math.ceil(contentHeightMm / 297)

  // 生成分页位置（毫米单位）
  for (let i = 1; i < pageCount; i++) {
    positions.push(297 * i)
  }

  return positions
})

// 计算实际内容高度
const updateContentHeight = () => {
  if (previewCardRef.value) {
    contentHeight.value = previewCardRef.value.offsetHeight
  }
}

// 监听内容/配置变化，确保高度随更新重新计算
watch(
  () => resume,
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
          ...(isScaled
            ? {
                transform: `scale(${scaleFactor})`,
                transformOrigin: 'top left',
                width: `${100 / scaleFactor}%`,
              }
            : {}),
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
  display: flex;
  justify-content: center;
  height: 100%;
  border-radius: 0.5rem;
  padding: 1rem;
  @include themify(
    (
      color: $text-color,
    )
  );
  overflow-y: auto;
}

.preview-wrapper {
  width: 210mm;
  min-height: 297mm; /* A4 高度 */
  position: relative;
  background-color: #fff;
}

.preview-card {
  padding: v-bind('styles.basePagePadding') + px;
  color: #111827;
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
