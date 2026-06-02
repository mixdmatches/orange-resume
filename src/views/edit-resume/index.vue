<script setup lang="ts">
import { onMounted, provide, reactive, ref, watch, onUnmounted } from 'vue'
import type { Resume } from '@/types/resume'
import ToolHead from './components/ToolHead.vue'
import EditContent from '@/views/edit-resume/components/EditContent.vue'
import ResumePreview from '@/views/edit-resume/components/ResumePreview.vue'
import AiInterview from '@/views/edit-resume/components/AiInterview.vue'
import dayjs from 'dayjs'
import { useRoute } from 'vue-router'
import { getResumeByIdIDB, updateResumeIDB } from '@/service/resumeIDB'

const route = useRoute()

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
    autoOnePage: false,
  },
})

const getResume = async () => {
  const id = route.params.id as string
  const resumeData = await getResumeByIdIDB(id)
  if (resumeData) {
    Object.assign(resume, resumeData)
  }
}
onMounted(() => {
  getResume()
})

watch(
  () => resume,
  async (newValue: Resume) => {
    const plainResume = JSON.parse(JSON.stringify(newValue))

    // const plainResume = toRaw(newValue)
    await updateResumeIDB(newValue.id, plainResume)
  },
  { deep: true },
)

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

onUnmounted(() => {
  window.removeEventListener('mousemove', handleDividerMouseMove)
  window.removeEventListener('mouseup', handleDividerMouseUp)
})
</script>

<template>
  <div class="edit-container">
    <tool-head v-model:resume-mode="resumeMode"></tool-head>
    <div ref="splitterContainer" class="edit-resume">
      <edit-content
        v-if="resumeMode === 'edit'"
        :style="{ width: `${leftWidth}%` }"
      />
      <ai-interview v-else :style="{ width: `${leftWidth}%` }" />
      <span class="line" @mousedown="handleDividerMouseDown"></span>
      <resume-preview :style="{ width: `${100 - leftWidth}%` }" />
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
</style>
