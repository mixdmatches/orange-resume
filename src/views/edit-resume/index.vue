<script setup lang="ts">
import { onMounted, provide, reactive, watch } from 'vue'
import type { Resume } from '@/types/userInfo'
import ToolHead from './components/ToolHead.vue'
import EditContent from '@/views/edit-resume/components/EditContent.vue'
import ResumePreview from '@/views/edit-resume/components/ResumePreview.vue'
import dayjs from 'dayjs'
import { useRoute } from 'vue-router'
import { getResumeByIdIDB, updateResumeIDB } from '@/service/indexDB'

const route = useRoute()

const resume = reactive<Resume>({
  id: '',
  title: '',
  createdAt: dayjs().unix(),
  updatedAt: dayjs().unix(),
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
  globalConfiguration: {
    baseFontSize: 16,
    basePagePadding: 20,
    baseLineHeight: 1.5,
    baseModuleSpacing: 20,
    paragraphSpacing: 20,
    titleFontSize: 24,
    subTitleFontSize: 20,
    themeColor: '#007bff',
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
</script>

<template>
  <div class="edit-container">
    <tool-head></tool-head>
    <div class="edit-resume">
      <edit-content> </edit-content>
      <span class="line"></span>
      <div class="view-content">
        <resume-preview />
      </div>
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
    width: 2px;
    height: 100%;
    margin: 0 0.2rem;
    @include themify(
      (
        background-color: $border-color-mode,
      )
    );
  }
  .view-content {
    width: 50%;
    height: 100%;
    border-radius: 0.5rem;
    padding: 1rem;
    @include themify(
      (
        color: $text-color,
        background-color: $bg-color,
      )
    );
  }
}
</style>
