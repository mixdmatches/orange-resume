<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { h } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { SettingOutlined, FileTextOutlined } from '@ant-design/icons-vue'
import ResumeSelectCard from './components/ResumeSelectCard.vue'
import ResumePreviewCard from './components/ResumePreviewCard.vue'
import InterviewQuestionPanel from './components/InterviewQuestionPanel.vue'
import CustomQuestionPanel from './components/CustomQuestionPanel.vue'
import { getAllResumesIDB } from '@/service/resumeIDB'
import type { Resume } from '@/types/resume'

const router = useRouter()
const resumes = ref<Resume[]>([])
const selectedResumeId = ref('')
const resumePreviewVisible = ref(false)
const activeTab = ref('ai')

const selectedResume = computed(
  () => resumes.value.find(item => item.id === selectedResumeId.value) ?? null,
)

watch(selectedResume, val => {
  if (val) activeTab.value = 'ai'
  else activeTab.value = ''
})

const loadResumes = async () => {
  try {
    const list = await getAllResumesIDB()
    list.sort((a, b) => b.createdAt - a.createdAt)
    resumes.value = list
    if (!selectedResumeId.value && list.length) {
      selectedResumeId.value = list[0].id
    }
  } catch {
    message.error('读取简历列表失败，请刷新重试')
  }
}

const handleManageResume = () => {
  router.push('/my-resume')
}

const handleOpenSetting = () => {
  router.push('/setting')
}

const handleOpenPreview = () => {
  if (!selectedResume.value) {
    message.warning('请先选择一份简历')
    return
  }
  resumePreviewVisible.value = true
}

onMounted(() => {
  loadResumes()
})
</script>

<template>
  <div class="ai-interview-page">
    <div class="page-header">
      <div>
        <h2>AI 模拟面试</h2>
        <p>
          基于简历内容智能生成面试题与参考回答，支持自定义提问、快速复制与实践演练。
        </p>
      </div>
      <a-space>
        <a-button
          type="default"
          :icon="h(FileTextOutlined)"
          @click="handleManageResume"
          >我的简历</a-button
        >
        <a-button
          type="primary"
          :icon="h(SettingOutlined)"
          @click="handleOpenSetting"
          >AI 设置</a-button
        >
      </a-space>
    </div>

    <div class="selection-panel">
      <resume-select-card
        v-model:model-value="selectedResumeId"
        :resumes="resumes"
        @manage="handleManageResume"
        @preview="handleOpenPreview"
      />
    </div>

    <a-modal
      v-model:open="resumePreviewVisible"
      title="简历预览"
      width="860"
      :footer="null"
      centered
    >
      <resume-preview-card :resume="selectedResume" />
    </a-modal>

    <a-card>
      <a-tabs v-model:active-key="activeTab" destroy-on-close type="card">
        <a-tab-pane key="ai" tab="AI 模拟面试">
          <interview-question-panel :resume="selectedResume" />
        </a-tab-pane>
        <a-tab-pane key="custom" tab="自定义问答">
          <custom-question-panel :resume-title="selectedResume?.title || ''" />
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<style scoped lang="scss">
.ai-interview-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1.2rem 1.4rem;
  border-radius: 1rem;
  background: #fff;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.04);
  @include themify(
    (
      background: (
        light: #fff,
        dark: #111827,
      ),
      box-shadow: (
        light: 0 12px 30px rgba(15, 23, 42, 0.04),
        dark: 0 12px 30px rgba(0, 0, 0, 0.3),
      ),
    )
  );
}

.page-header h2 {
  margin: 0;
  font-size: 1.9rem;
}

.page-header p {
  margin: 0.45rem 0 0;
  color: rgba(0, 0, 0, 0.65);
  max-width: 620px;
  @include themify(
    (
      color: (
        light: rgba(0, 0, 0, 0.65),
        dark: rgba(255, 255, 255, 0.65),
      ),
    )
  );
}

.selection-panel {
  display: grid;
  gap: 1rem;
  align-items: start;
}

.tab-panel {
  display: grid;
  gap: 1rem;
}

.action-footer {
  display: flex;
  justify-content: flex-end;
}

.tab-panel .ant-tabs-content-holder {
  min-height: 420px;
}

.action-card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.action-card {
  min-height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.card-title {
  font-size: 1.2rem;
  font-weight: 600;
}

@media screen and (max-width: 900px) {
  .page-header,
  .selection-panel,
  .action-card-grid {
    flex-direction: column;
  }

  .action-card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
