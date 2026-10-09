<script setup lang="ts">
import {
  computed,
  onMounted,
  onBeforeUnmount,
  provide,
  ref,
  watchEffect,
} from 'vue'
import { templates } from '@/template/index'
import type { Resume } from '@/types/resume'

const props = withDefaults(
  defineProps<{
    /** 模板 ID（在 templates 数组中查找对应组件）*/
    templateId: string
    /** 渲染用简历数据 */
    resume: Resume
    /** 显式缩放比例（优先于 fit）。0.3=卡片缩略图，1=1:1 真实尺寸 */
    scale?: number
    /** 自适应模式：'width' 根据父容器宽度自动计算 scale（与 scale 互斥，scale 优先）*/
    fit?: 'width' | null
    /** 模板原始页宽（A4 @96dpi = 794px）*/
    pageWidth?: number
    /** 视窗固定高度（px）。若不传，按 pageWidth × 比例自动算 */
    viewHeight?: number
  }>(),
  {
    scale: undefined,
    fit: null,
    pageWidth: 794,
    viewHeight: undefined,
  },
)

// 通过 provide 把 resume 数据传给内部挂载的模板组件
provide('resume', props.resume)

// 模板原始页高（A4 @96dpi = 1123px）
const PAGE_HEIGHT = 1123

// 从 resume 取页面边距，兜底 20px
const pagePadding = computed(
  () => props.resume?.globalConfiguration?.basePagePadding ?? 20,
)

// 查找模板组件
const templateComponent = computed(() => {
  const found = templates.find(t => t.id === props.templateId)
  return found?.component
})

/** 父容器 DOM 引用（用于 ResizeObserver 测宽）*/
const parentRef = ref<HTMLElement | null>(null)

/** 父容器实际可用宽度（px），由 ResizeObserver 更新 */
const parentWidth = ref(0)

/** ResizeObserver 实例 */
let observer: ResizeObserver | null = null

onMounted(() => {
  // 找最近的有宽度约束的祖先元素（TemplateThumb 自身是 content，
  // 宽度由外层容器决定，需要测量外层的实际渲染宽度）
  const el = parentRef.value?.parentElement
  if (el) {
    parentWidth.value = el.clientWidth
    observer = new ResizeObserver(entries => {
      parentWidth.value = entries[0].contentRect.width
    })
    observer.observe(el)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
})

/** 最终使用的 scale：显式 prop 优先，其次 fit 自适应，兜底 0.3 */
const finalScale = computed(() => {
  if (props.scale != null) return props.scale
  if (props.fit === 'width' && parentWidth.value > 0) {
    return parentWidth.value / props.pageWidth
  }
  return 0.3 // 兜底
})

// 视窗尺寸（缩放后的最终展示尺寸）
const viewWidth = computed(() => Math.round(props.pageWidth * finalScale.value))
const viewHeight = computed(
  () => props.viewHeight ?? Math.round(PAGE_HEIGHT * finalScale.value),
)

// 监听 resume 引用变化，确保响应性
watchEffect(() => {
  void props.resume
})
</script>

<template>
  <div
    ref="parentRef"
    class="thumb-viewport"
    :style="{
      width: viewWidth + 'px',
      height: viewHeight + 'px',
    }"
  >
    <div
      class="thumb-stage"
      :style="{
        transform: `translateX(-50%) scale(${finalScale})`,
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
  pointer-events: none;
  user-select: none;
  // 让 ResizeObserver 能正确测量父容器宽度
  display: block;
}

.thumb-stage {
  position: absolute;
  top: 0;
  left: 50%;
  transform-origin: top center;
  background: #fff; // A4 白纸底板
  box-shadow: none;
  will-change: transform;
}

// A4 纸内部的页面边距区域
// 极淡内边框勾勒模板内容边界，避免模板根元素白底与 A4 纸底板融为一体
.thumb-content {
  width: 100%;
  height: 100%;
  background: #fff;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  // 内边框勾勒模板内容边界（极淡，不影响 A4 纸的纯白感）
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
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
