import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue'

/** 面板尺寸常量 */
const PANEL_WIDTH = 420
const PANEL_HEIGHT = 560
const HEADER_HEIGHT = 52

/**
 * 可拖拽面板逻辑：管理位置、边界限制、窗口 resize 修正与最小化
 * @param open 面板显示状态的 ref，用于打开时初始化位置
 */
export function usePanelDraggable(open: Ref<boolean>) {
  /** 面板位置 */
  const posX = ref(0)
  const posY = ref(0)

  /** 是否最小化（折叠成标题栏） */
  const minimized = ref(false)

  /** 拖拽过程中的临时状态（非响应式） */
  let isDragging = false
  let startX = 0
  let startY = 0
  let startLeft = 0
  let startTop = 0

  /** 打开时初始化到屏幕中央偏右 */
  const initPosition = () => {
    posX.value = (window.innerWidth - PANEL_WIDTH) / 2 + 120
    posY.value = Math.max(20, (window.innerHeight - PANEL_HEIGHT) / 2)
  }

  watch(
    () => open.value,
    val => {
      if (val && posX.value === 0 && posY.value === 0) {
        initPosition()
      }
    },
  )

  /** 标题栏按下：开始拖拽（点操作按钮时跳过） */
  const handleHeaderMouseDown = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('.header-action')) return

    isDragging = true
    startX = e.clientX
    startY = e.clientY
    startLeft = posX.value
    startTop = posY.value
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  /** 拖拽移动：更新位置并做边界限制 */
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    const deltaX = e.clientX - startX
    const deltaY = e.clientY - startY

    const newLeft = Math.max(
      0,
      Math.min(window.innerWidth - PANEL_WIDTH, startLeft + deltaX),
    )
    let newTop = Math.max(0, startTop + deltaY)
    newTop = Math.min(window.innerHeight - HEADER_HEIGHT, newTop)

    posX.value = newLeft
    posY.value = newTop
  }

  /** 释放鼠标：结束拖拽 */
  const handleMouseUp = () => {
    isDragging = false
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  }

  /** 窗口 resize 时修正越界位置 */
  const handleResize = () => {
    posX.value = Math.max(
      0,
      Math.min(window.innerWidth - PANEL_WIDTH, posX.value),
    )
    posY.value = Math.max(
      0,
      Math.min(window.innerHeight - HEADER_HEIGHT, posY.value),
    )
  }

  /** 切换最小化 */
  const toggleMinimize = () => {
    minimized.value = !minimized.value
  }

  onMounted(() => {
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
    window.removeEventListener('resize', handleResize)
  })

  return {
    posX,
    posY,
    minimized,
    initPosition,
    handleHeaderMouseDown,
    toggleMinimize,
  }
}
