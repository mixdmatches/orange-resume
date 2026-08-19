<script setup lang="ts">
import {
  computed,
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
import AiInterview from '@/views/edit-resume/components/AiInterview.vue'
import dayjs from 'dayjs'
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

const route = useRoute()
const resumeHistory = useResumeHistory()
const isApplyingHistory = ref(false)
const hasInitializedHistory = ref(false)
let historyTimer: ReturnType<typeof setTimeout> | null = null
let lastSavedHistorySnapshot = ''

const resume = reactive<Resume>({
  id: '',
  title: '',
  templateId: '',
  createdAt: dayjs().unix(),
  updatedAt: null,
  basic: {
    name: '',
    position: '',
    age: 0,
    phone: '',
    address: '',
    email: '',
    photo: '',
    photoConfig: {
      aspectRatio: 'square',
      width: 0,
      height: 0,
      borderRadius: 0,
      customBorderRadius: 0,
      visible: true,
    },
  },
  educations: [],
  internships: [],
  projects: [],
  skills: '',
  customData: {},
  menuSections: [],
  globalConfiguration: {
    baseFontSize: 16,
    basePagePadding: 20,
    baseLineHeight: 1.5,
    baseModuleSpacing: 20,
    paragraphSpacing: 20,
    titleFontSize: 24,
    subTitleFontSize: 20,
    themeColor: '#007bff',
    fontFamily: 'sans-serif',
    autoOnePage: false,
  },
})

/**
 * 加载简历：走 Repository 调度层
 * 优先读本地（毫秒级），本地没有再走云端，后台静默拉云端更新
 */
const getResume = async () => {
  const id = route.params.id as string
  const resumeData = await getResumeById(id)
  if (resumeData) {
    Object.assign(resume, resumeData)
  }
  resumeHistory.initialize(id, resume)
  lastSavedHistorySnapshot = JSON.stringify(resume)
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

    const plainResume = JSON.parse(JSON.stringify(newValue))
    // 走 Repository：先写本地 IDB，再入同步队列异步上云
    await updateResume(plainResume)
  },
  { deep: true },
)

const canUndo = resumeHistory.canUndo
const canRedo = resumeHistory.canRedo

provide('resume', resume)

const resumeMode = ref('edit')

const splitterContainer = ref<HTMLElement | null>(null)
const leftWidth = ref(50)
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
  leftWidth.value = Math.min(50, Math.max(30, newWidth))
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
      @undo="handleUndo"
      @redo="handleRedo"
    ></tool-head>
    <div ref="splitterContainer" class="edit-resume">
      <edit-content
        v-if="resumeMode === 'edit'"
        :style="{ width: `${leftWidth}%` }"
      />
      <ai-interview v-else :style="{ width: `${leftWidth}%` }" />
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
.edit-container {
  @include themify(
    (
      background-color: $layout-bg-color,
    )
  );
}
.edit-resume {
  margin-top: 1rem;
  width: 100%;
  height: calc(100vh - $site-header-height - 1rem);
  display: flex;

  .line {
    width: 8px;
    height: 100%;
    margin: 0 0.2rem;
    border-radius: 4px;
    cursor: col-resize;
    background-color: transparent;
    position: relative;
  }
  .line::before {
    content: '';
    position: absolute;
    inset: 0;
    margin: auto;
    width: 2px;
    height: 100%;
    background-color: var(--border-color-mode, #d9d9d9);
    border-radius: 2px;
  }
}

/* 云端同步状态指示器 */
.sync-indicator {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 16px;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  user-select: none;
  pointer-events: none;

  .sync-text {
    line-height: 1;
  }

  /* 各状态对应配色 */
  &.status-synced {
    background-color: rgba(82, 196, 26, 0.85);
  }

  &.status-syncing {
    background-color: rgba(24, 144, 255, 0.85);
  }

  &.status-pending {
    background-color: rgba(250, 173, 20, 0.85);
  }

  &.status-offline {
    background-color: rgba(114, 114, 114, 0.85);
  }

  &.status-error {
    background-color: rgba(245, 34, 45, 0.85);
  }
}
</style>
