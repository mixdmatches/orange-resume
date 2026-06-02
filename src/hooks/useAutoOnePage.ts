/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, type ComputedRef } from 'vue'

const MM_TO_PX = 3.78
const A4_HEIGHT_PX = 297 * MM_TO_PX
// 最多只允许缩小到 90%，保证文字可读性和美观
const MIN_SCALE = 0.9

interface UseAutoOnePageOptions {
  contentHeight: ComputedRef<number> | number
  pagePadding: ComputedRef<number> | number
  enabled: ComputedRef<boolean> | boolean
}

interface UseAutoOnePageResult {
  scaleFactor: ComputedRef<number> | number
  isScaled: ComputedRef<boolean> | boolean
  /** 内容过多，即使缩放到下限也无法完美一页 */
  cannotFit: ComputedRef<boolean> | boolean
}

export const useAutoOnePage = ({
  contentHeight,
  pagePadding,
  enabled,
}: UseAutoOnePageOptions): UseAutoOnePageResult => {
  const get = (v: any) =>
    typeof v === 'function' || v?.value !== undefined
      ? ((v as any).value ?? (v as any)())
      : v

  const result = computed(() => {
    const ch = get(contentHeight)
    const pp = get(pagePadding)
    const en = get(enabled)

    if (!en || ch <= 0) {
      return { scaleFactor: 1, isScaled: false, cannotFit: false }
    }
    // A4 可用内容高度 = A4 总高度 - 上下页边距
    const availableHeight = A4_HEIGHT_PX - 2 * pp
    // 实际内容高度为总高度减去上下页边距
    const actualContentHeight = ch - 2 * pp

    if (actualContentHeight <= availableHeight) {
      return { scaleFactor: 1, isScaled: false, cannotFit: false }
    }

    const idealScale = availableHeight / actualContentHeight

    if (idealScale >= MIN_SCALE) {
      return { scaleFactor: idealScale, isScaled: true, cannotFit: false }
    }

    return { scaleFactor: MIN_SCALE, isScaled: true, cannotFit: true }
  })

  return {
    scaleFactor: computed(() => result.value.scaleFactor),
    isScaled: computed(() => result.value.isScaled),
    cannotFit: computed(() => result.value.cannotFit),
  }
}
