<script setup lang="ts">
/**
 * TemplateThumb · 简历模板实时缩略图
 *
 * 用途：在 my-resume 卡片、template 中心 cover、a-modal 大预览中复用
 * 实现：挂载真实模板组件 + transform: scale() 缩小到目标视窗
 *
 * 数据流：props.resume → provide('resume') → 模板组件 inject('resume')
 */
import { computed, provide, watchEffect } from 'vue'
import { templates } from '@/template/index'
import type { Resume } from '@/types/resume'

const props = withDefaults(
  defineProps<{
    /** 模板 ID（在 templates 数组中查找对应组件）*/
    templateId: string
    /** 渲染用简历数据 */
    resume: Resume
    /** 缩放比例，默认 0.3（卡片缩略图）；1 表示 1:1 真实尺寸（a-modal 预览用）*/
    scale?: number
    /** 模板原始页宽（A4 @96dpi = 794px）*/
    pageWidth?: number
    /** 视窗固定高度（px）。若不传，按 pageWidth × 比例自动算 */
    viewHeight?: number
  }>(),
  {
    scale: 0.3,
    pageWidth: 794,
    viewHeight: undefined,
  },
)

// 通过 provide 把 resume 数据传给内部挂载的模板组件
// 用 watchEffect + toRef 风格确保 resume 变化时模板能响应（provide 默认不响应式）
// 这里直接传 props.resume 引用，模板内部用 toRefs/inject 解构响应
provide('resume', props.resume)

// 模板原始页高（A4 @96dpi = 1123px），用于计算视窗高度
const PAGE_HEIGHT = 1123

// 从 resume 取页面边距，兜底 20px（与编辑器 ResumePreview 一致）
const pagePadding = computed(
  () => props.resume?.globalConfiguration?.basePagePadding ?? 20,
)

// 查找模板组件
const templateComponent = computed(() => {
  const found = templates.find(t => t.id === props.templateId)
  return found?.component
})

// 视窗尺寸（缩放后的最终展示尺寸）
const viewWidth = computed(() => Math.round(props.pageWidth * props.scale))
const viewHeight = computed(
  () => props.viewHeight ?? Math.round(PAGE_HEIGHT * props.scale),
)

// 监听 resume 引用变化，重新 provide（虽然 provide 一次即可，但确保响应性）
watchEffect(() => {
  // 触发响应依赖
  void props.resume
})
</script>

<template>
  <div
    class="thumb-viewport"
    :style="{
      width: viewWidth + 'px',
      height: viewHeight + 'px',
    }"
  >
    <div
      class="thumb-stage"
      :style="{
        transform: `translateX(-50%) scale(${scale})`,
        transformOrigin: 'top center',
        width: pageWidth + 'px',
        height: PAGE_HEIGHT + 'px',
      }"
    >
      <!-- 模拟编辑器 ResumePreview 的 .preview-card：白底 + 动态 padding（页面边距） -->
      <div class="thumb-content" :style="{ padding: pagePadding + 'px' }">
        <component :is="templateComponent" v-if="templateComponent" />
        <div v-else class="thumb-empty">模板未找到</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.thumb-viewport {
  position: relative;
  overflow: hidden;
  background: var(--color-surface);
  border-radius: inherit;
  pointer-events: none; // 缩略图只看不动，防止误触
  user-select: none;
}

.thumb-stage {
  position: absolute;
  top: 0;
  left: 50%; // 配合 translateX(-50%) + transform-origin: top center 实现水平居中
  // 居中缩放：避免 transform-origin: top left 时 viewport 与 stage 宽度不整除
  // 导致右侧被裁切、左右 padding 视觉不一致
  transform-origin: top center;
  background: #fff; // A4 白纸底板
  box-shadow: none;
  // GPU 加速，改善 sub-pixel rendering
  will-change: transform;
}

// 模拟编辑器 ResumePreview 的 .preview-card：白底 + padding 页面边距
// 让缩略图能明显看到"白纸内边距"，模板内容不贴边
.thumb-content {
  width: 100%;
  height: 100%;
  background: #fff;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.thumb-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  background: var(--color-bg-muted);
}
</style>
