import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue'

/** 面板默认尺寸常量 */
const DEFAULT_WIDTH = 450
const DEFAULT_HEIGHT = 760
const HEADER_HEIGHT = 52
/** 拉伸尺寸限制 */
const MIN_WIDTH = 320
const MIN_HEIGHT = 360
const MAX_WIDTH_RATIO = 0.9
const MAX_HEIGHT_RATIO = 0.95

/** 拉伸方向类型 */
type ResizeDir = 'e' | 's' | 'se'

/**
 * 可拖拽与拉伸面板逻辑：管理位置、尺寸、边界限制、窗口resize修正与最小化
 * @param open 面板显示状态的 ref，用于打开时初始化位置
 */
export function usePanelDraggable(open: Ref<boolean>) {
  /** 面板位置 */
  const posX = ref(0)
  const posY = ref(0)
  /** 面板尺寸（最小化时 height 由 CSS 控制） */
  const width = ref(DEFAULT_WIDTH)
  const height = ref(DEFAULT_HEIGHT)

  /** 是否最小化（折叠成标题栏） */
  const minimized = ref(false)

  /** 拖拽过程中的临时状态（非响应式） */
  let isDragging = false
  let startX = 0
  let startY = 0
  let startLeft = 0
  let startTop = 0

  /** 拉伸过程中的临时状态（非响应式） */
  let isResizing = false
  let resizeDir: ResizeDir | '' = ''
  let resizeStartX = 0
  let resizeStartY = 0
  let resizeStartW = 0
  let resizeStartH = 0

  /** 将尺寸限制在最小值与视口比例上限之间 */
  const clampSize = (w: number, h: number) => {
    const maxW = window.innerWidth * MAX_WIDTH_RATIO
    const maxH = window.innerHeight * MAX_HEIGHT_RATIO
    return {
      w: Math.max(MIN_WIDTH, Math.min(maxW, w)),
      h: Math.max(MIN_HEIGHT, Math.min(maxH, h)),
    }
  }

  /** 打开时初始化到屏幕中央偏右，并按视口约束尺寸 */
  const initPosition = () => {
    const clamped = clampSize(width.value, height.value)
    width.value = clamped.w
    height.value = clamped.h
    posX.value = (window.innerWidth - width.value) / 2 + 120
    posY.value = Math.max(20, (window.innerHeight - height.value) / 2)
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
    window.addEventListener('mousemove', handleDragMove)
    window.addEventListener('mouseup', handleDragUp)
  }

  /** 拖拽移动：更新位置并做边界限制 */
  const handleDragMove = (e: MouseEvent) => {
    if (!isDragging) return
    const deltaX = e.clientX - startX
    const deltaY = e.clientY - startY

    const newLeft = Math.max(
      0,
      Math.min(window.innerWidth - width.value, startLeft + deltaX),
    )
    let newTop = Math.max(0, startTop + deltaY)
    newTop = Math.min(window.innerHeight - HEADER_HEIGHT, newTop)

    posX.value = newLeft
    posY.value = newTop
  }

  /** 释放鼠标：结束拖拽 */
  const handleDragUp = () => {
    isDragging = false
    window.removeEventListener('mousemove', handleDragMove)
    window.removeEventListener('mouseup', handleDragUp)
  }

  /**
   * 拉伸把手按下：记录起点并注册全局监听
   * @param dir 拉伸方向：e=右、s=下、se=右下
   */
  const handleResizeMouseDown = (e: MouseEvent, dir: ResizeDir) => {
    if (minimized.value) return
    e.preventDefault()
    e.stopPropagation()

    isResizing = true
    resizeDir = dir
    resizeStartX = e.clientX
    resizeStartY = e.clientY
    resizeStartW = width.value
    resizeStartH = height.value
    document.body.style.cursor =
      dir === 'e' ? 'ew-resize' : dir === 's' ? 'ns-resize' : 'nwse-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', handleResizeMove)
    window.addEventListener('mouseup', handleResizeUp)
  }

  /** 拉伸移动：根据方向计算新尺寸并约束 */
  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing) return
    const dx = e.clientX - resizeStartX
    const dy = e.clientY - resizeStartY

    let newW = resizeStartW
    let newH = resizeStartH
    if (resizeDir.includes('e')) newW = resizeStartW + dx
    if (resizeDir.includes('s')) newH = resizeStartH + dy

    const clamped = clampSize(newW, newH)
    width.value = clamped.w
    height.value = clamped.h
    /** 拉伸后同步修正位置避免面板溢出视口右侧 */
    posX.value = Math.min(posX.value, window.innerWidth - width.value)
    posY.value = Math.min(posY.value, window.innerHeight - HEADER_HEIGHT)
  }

  /** 释放鼠标：结束拉伸并恢复光标 */
  const handleResizeUp = () => {
    isResizing = false
    resizeDir = ''
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    window.removeEventListener('mousemove', handleResizeMove)
    window.removeEventListener('mouseup', handleResizeUp)
  }

  /** 窗口 resize 时按当前尺寸约束位置与尺寸 */
  const handleResize = () => {
    const clamped = clampSize(width.value, height.value)
    width.value = clamped.w
    height.value = clamped.h
    posX.value = Math.max(
      0,
      Math.min(window.innerWidth - width.value, posX.value),
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
    window.removeEventListener('mousemove', handleDragMove)
    window.removeEventListener('mouseup', handleDragUp)
    window.removeEventListener('mousemove', handleResizeMove)
    window.removeEventListener('mouseup', handleResizeUp)
    window.removeEventListener('resize', handleResize)
  })

  return {
    posX,
    posY,
    width,
    height,
    minimized,
    initPosition,
    handleHeaderMouseDown,
    handleResizeMouseDown,
    toggleMinimize,
  }
}
