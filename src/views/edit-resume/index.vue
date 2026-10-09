<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  provide,
  reactive,
  ref,
  watch,
} from 'vue'
import type { Resume } from '@/types/resume'
import ToolHead from './components/ToolHead.vue'
import EditContent from '@/views/edit-resume/components/EditContent.vue'
import ResumePreview from '@/views/edit-resume/components/ResumePreview.vue'
import { useRoute } from 'vue-router'
import { getResumeById, updateResume } from '@/service/resumeRepository'
import { useResumeHistory } from '@/hooks/useResumeHistory'
import { useSyncStore } from '@/stores/sync'
import {
  CloudServerOutlined,
  CloudSyncOutlined,
  CloudUploadOutlined,
  DisconnectOutlined,
} from '@ant-design/icons-vue'
import { DEFAULT_RESUME } from '@/config/init-resume-data.ts'

const route = useRoute()
const resumeHistory = useResumeHistory()
const isApplyingHistory = ref(false)
const hasInitializedHistory = ref(false)
let historyTimer: ReturnType<typeof setTimeout> | null = null
let lastSavedHistorySnapshot = ''

/** 最后保存时间戳（毫秒），用于在工具栏显示保存状态 */
const lastSaveTime = ref<number | null>(null)

const resume = reactive<Resume>({ ...DEFAULT_RESUME, id: '' })

/**
 * 加载简历：走 Repository 调度层
 * 优先读本地（毫秒级），本地没有再走云端，后台静默拉云端更新
 */
const getResume = async () => {
  const id = route.params.id as string
  const resumeData = await getResumeById(id)
  if (resumeData) {
    Object.assign(resume, resumeData)
    // 用已有更新时间初始化显示（优先 updatedAt，没有则用 createdAt）
    lastSaveTime.value = resumeData.updatedAt ?? resumeData.createdAt
  }
  resumeHistory.initialize(id, resume)
  lastSavedHistorySnapshot = JSON.stringify(resume)

  // 等待初始赋值触发的 watcher 执行完毕，再允许后续用户编辑进入保存流程
  await nextTick()
  hasInitializedHistory.value = true
}
onMounted(() => {
  getResume()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (historyTimer) {
    clearTimeout(historyTimer)
    historyTimer = null
  }
})

const pushHistoryState = (newValue: Resume) => {
  if (!hasInitializedHistory.value || isApplyingHistory.value) return
  const nextSnapshot = JSON.stringify(newValue)
  if (nextSnapshot === lastSavedHistorySnapshot) {
    return
  }

  resumeHistory.pushState(newValue)
  lastSavedHistorySnapshot = nextSnapshot
}

const scheduleHistoryPush = () => {
  if (historyTimer) {
    window.clearTimeout(historyTimer)
  }
  historyTimer = window.setTimeout(() => {
    pushHistoryState(resume)
  }, 300)
}

const applyHistorySnapshot = (snapshot: Resume | null) => {
  if (!snapshot) return
  isApplyingHistory.value = true
  Object.assign(resume, JSON.parse(JSON.stringify(snapshot)))
  lastSavedHistorySnapshot = JSON.stringify(resume)
  isApplyingHistory.value = false
}

const handleUndo = () => {
  const snapshot = resumeHistory.undo()
  if (snapshot) {
    applyHistorySnapshot(snapshot)
  }
}

const handleRedo = () => {
  const snapshot = resumeHistory.redo()
  if (snapshot) {
    applyHistorySnapshot(snapshot)
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  const isMac = navigator.platform.toUpperCase().includes('MAC')
  const isMeta = isMac ? event.metaKey : event.ctrlKey
  if (!isMeta || event.key.toLowerCase() !== 'z') {
    return
  }

  event.preventDefault()
  if (event.shiftKey) {
    handleRedo()
  } else {
    handleUndo()
  }
}

watch(
  () => resume,
  async (newValue: Resume) => {
    if (!hasInitializedHistory.value || isApplyingHistory.value) return

    scheduleHistoryPush()

    // 保存前先记下旧时间戳，万一这次写入失败可以回滚
    const previousSaveTime = lastSaveTime.value
    const plainResume = JSON.parse(JSON.stringify(newValue))

    try {
      // 走 Repository：先写本地 IDB，再入同步队列异步上云
      await updateResume(plainResume)
      // 保存成功后更新时间戳，触发工具栏显示更新
      lastSaveTime.value = Date.now()
    } catch (err) {
      // 本地写入失败：回滚时间戳，保持"未保存"状态，避免误导用户
      lastSaveTime.value = previousSaveTime
      console.warn('[edit-resume] 本地保存失败', err)
    }
  },
  { deep: true },
)

const canUndo = resumeHistory.canUndo
const canRedo = resumeHistory.canRedo

provide('resume', resume)

const resumeMode = ref('edit')

const splitterContainer = ref<HTMLElement | null>(null)
const MAX_LEFT_WIDTH = 47
const leftWidth = ref(MAX_LEFT_WIDTH)
const isDragging = ref(false)
let startX = 0
let startWidth = 0

const handleDividerMouseDown = (event: MouseEvent) => {
  event.preventDefault()
  isDragging.value = true
  startX = event.clientX
  startWidth = leftWidth.value
  window.addEventListener('mousemove', handleDividerMouseMove)
  window.addEventListener('mouseup', handleDividerMouseUp)
}

const handleDividerMouseMove = (event: MouseEvent) => {
  if (!isDragging.value || !splitterContainer.value) return
  const rect = splitterContainer.value.getBoundingClientRect()
  const deltaX = event.clientX - startX
  const newWidth =
    (((startWidth / 100) * rect.width + deltaX) / rect.width) * 100
  leftWidth.value = Math.min(MAX_LEFT_WIDTH, Math.max(30, newWidth))
}

const handleDividerMouseUp = () => {
  if (!isDragging.value) return
  isDragging.value = false
  window.removeEventListener('mousemove', handleDividerMouseMove)
  window.removeEventListener('mouseup', handleDividerMouseUp)
}

// 云端同步状态
const syncStore = useSyncStore()

/**
 * 根据同步状态返回对应的图标组件
 */
const syncIcon = computed(() => {
  switch (syncStore.cloudStatus) {
    case 'syncing':
      return CloudUploadOutlined
    case 'pending':
      return CloudSyncOutlined
    case 'offline':
      return DisconnectOutlined
    case 'error':
      return DisconnectOutlined
    default:
      return CloudServerOutlined
  }
})

/**
 * 根据同步状态返回对应的提示文案
 */
const syncText = computed(() => {
  switch (syncStore.cloudStatus) {
    case 'syncing':
      return '正在同步到云端...'
    case 'pending':
      return `待同步 ${syncStore.cloudPending} 条`
    case 'offline':
      return '离线模式（已暂存本地）'
    case 'error':
      return '同步失败，将重试'
    default:
      return '已同步到云端'
  }
})
</script>

<template>
  <div class="edit-container">
    <tool-head
      v-model:resume-mode="resumeMode"
      :can-undo="canUndo"
      :can-redo="canRedo"
      :last-save-time="lastSaveTime"
      :cloud-status="syncStore.cloudStatus"
      @undo="handleUndo"
      @redo="handleRedo"
    ></tool-head>
    <div ref="splitterContainer" class="edit-resume">
      <edit-content :style="{ width: `${leftWidth}%` }" />
      <span class="line" @mousedown="handleDividerMouseDown"></span>
      <resume-preview :style="{ width: `${100 - leftWidth}%` }" />
    </div>

    <!-- 云端同步状态指示器（右下角悬浮，无干扰） -->
    <div
      class="sync-indicator"
      :class="`status-${syncStore.cloudStatus}`"
      :title="syncText"
    >
      <component :is="syncIcon" :spin="syncStore.cloudStatus === 'syncing'" />
      <span class="sync-text">{{ syncText }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* ============ 编辑容器 ============ */
.edit-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}

.edit-resume {
  flex: 1;
  width: 100%;
  display: flex;
  overflow: hidden;
}

/* ============ 拖拽分隔条 ============ */
.line {
  flex: none;
  width: 6px;
  cursor: col-resize;
  position: relative;
  background: transparent;
  transition: background-color var(--duration-fast) var(--ease-out);

  /* 中央 1px 竖线 */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 1px;
    height: 100%;
    background: var(--color-border);
    transition: background-color var(--duration-fast) var(--ease-out);
  }

  /* 中央三个小点装饰（增强可拖拽的视觉提示） */
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 4px;
    height: 4px;
    border-radius: var(--radius-full);
    background: var(--color-text-tertiary);
    box-shadow:
      0 -6px 0 var(--color-text-tertiary),
      0 6px 0 var(--color-text-tertiary);
    opacity: 0;
    transition: opacity var(--duration-fast) var(--ease-out);
  }

  /* hover 时显示主色与三个点提示 */
  &:hover::before,
  &:active::before {
    background: var(--color-primary);
  }

  &:hover::after,
  &:active::after {
    opacity: 1;
    background: var(--color-primary);
    box-shadow:
      0 -6px 0 var(--color-primary),
      0 6px 0 var(--color-primary);
  }
}

/* ============ 云端同步状态指示器 ============ */
.sync-indicator {
  position: fixed;
  right: var(--space-5);
  bottom: var(--space-5);
  z-index: var(--z-fixed);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
  border-radius: var(--radius-full);
  color: var(--color-text-inverse);
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  box-shadow: var(--shadow-md);
  transition: all var(--duration-base) var(--ease-out);
  user-select: none;
  pointer-events: none;

  .sync-text {
    line-height: 1;
  }

  /* 各状态对应配色 */
  &.status-synced {
    background: rgba(34, 197, 94, 0.9);
  }
  &.status-syncing {
    background: rgba(22, 119, 255, 0.9);
  }
  &.status-pending {
    background: rgba(245, 158, 11, 0.9);
  }
  &.status-offline {
    background: rgba(115, 115, 115, 0.9);
  }
  &.status-error {
    background: rgba(239, 68, 68, 0.9);
  }
}

@media (max-width: 768px) {
  .edit-resume {
    flex-direction: column;
  }

  .line {
    width: 100%;
    height: 6px;
    cursor: row-resize;

    &::before {
      width: 100%;
      height: 1px;
    }

    &::after {
      box-shadow:
        -6px 0 0 var(--color-text-tertiary),
        6px 0 0 var(--color-text-tertiary);
    }
  }

  /* 移动端 hover/active 时三点与横线变主色 */
  .line:hover::before,
  .line:active::before {
    background: var(--color-primary);
  }

  .line:hover::after,
  .line:active::after {
    background: var(--color-primary);
    box-shadow:
      -6px 0 0 var(--color-primary),
      6px 0 0 var(--color-primary);
  }
}
</style>
