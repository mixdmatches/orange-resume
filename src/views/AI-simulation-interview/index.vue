<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { h } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { SettingOutlined, FileTextOutlined } from '@ant-design/icons-vue'
import ResumeSelectCard from './components/ResumeSelectCard.vue'
import ResumePreviewCard from './components/ResumePreviewCard.vue'
import { getAllResumesIDB } from '@/service/resumeIDB'
import { useInterviewStore, DEFAULT_QUESTION_COUNT } from '@/stores/interview'
import type { Resume } from '@/types/resume'

const router = useRouter()
const interviewStore = useInterviewStore()
const resumes = ref<Resume[]>([])
const selectedResumeId = ref('')
const resumePreviewVisible = ref(false)

/** 目标岗位方向（选填，可从常用岗位中选择或自行输入） */
const jobType = ref('')
/** 目标岗位 JD 原文（选填） */
const jd = ref('')
/** 面试题目数量（1-10 题） */
const questionCount = ref(DEFAULT_QUESTION_COUNT)

/** 常用岗位方向预置项，也支持用户自由输入 */
const jobTypeOptions = [
  '前端开发工程师',
  '后端开发工程师',
  '全栈工程师',
  '测试工程师',
  '算法工程师',
  '数据分析师',
  '产品经理',
  '项目经理',
  'UI 设计师',
  '运维工程师',
].map(value => ({ value }))

const selectedResume = computed(
  () => resumes.value.find(item => item.id === selectedResumeId.value) ?? null,
)

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

/**
 * 进入面试间
 * 校验已选简历后，将简历 ID 与选填的岗位方向/JD 写入面试会话 store，
 * 再跳转到独立的面试间页面。
 */
const handleEnterRoom = () => {
  if (!selectedResume.value) {
    message.warning('请先选择一份简历')
    return
  }
  interviewStore.startInterview({
    resumeId: selectedResume.value.id,
    jobType: jobType.value.trim(),
    jd: jd.value.trim(),
    questionCount: questionCount.value,
  })
  router.push('/interview-room')
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

    <a-card class="interview-config-card">
      <div class="config-header">
        <h3>面试配置</h3>
        <p>
          选择目标岗位或粘贴岗位 JD（均为选填），AI
          将结合简历内容让面试更贴近真实求职场景。
        </p>
      </div>

      <div class="config-form">
        <div class="form-item">
          <label class="form-label">题目数量</label>
          <div class="question-count-row">
            <a-input-number
              v-model:value="questionCount"
              :min="5"
              :max="20"
              :precision="0"
            />
            <span class="form-hint">本次面试的提问数量（1-10 题）</span>
          </div>
        </div>

        <div class="form-item">
          <label class="form-label">目标岗位</label>
          <a-auto-complete
            v-model:value="jobType"
            :options="jobTypeOptions"
            allow-clear
            placeholder="选择或输入岗位方向，如：前端开发工程师（选填）"
          />
        </div>

        <div class="form-item">
          <label class="form-label">岗位 JD</label>
          <a-textarea
            v-model:value="jd"
            :rows="6"
            :maxlength="5000"
            show-count
            allow-clear
            placeholder="粘贴招聘 JD（岗位职责、任职要求等），AI 将结合简历与 JD 定制面试内容（选填）"
          />
        </div>
      </div>

      <div class="config-footer">
        <a-button
          type="primary"
          size="large"
          :disabled="!selectedResume"
          @click="handleEnterRoom"
          >进入面试间</a-button
        >
        <span v-if="!selectedResume" class="footer-hint"
          >请先在上方选择一份简历</span
        >
      </div>
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

.interview-config-card {
  border-radius: 1rem;
  @include themify(
    (
      background: (
        light: #fff,
        dark: #111827,
      ),
      border-color: (
        light: #f0f0f0,
        dark: rgba(255, 255, 255, 0.12),
      ),
    )
  );
}

.config-header h3 {
  margin: 0;
  font-size: 1.6rem;
}

.config-header p {
  margin: 0.5rem 0 0;
  color: rgba(0, 0, 0, 0.65);
  @include themify(
    (
      color: (
        light: rgba(0, 0, 0, 0.65),
        dark: rgba(255, 255, 255, 0.65),
      ),
    )
  );
}

.config-form {
  display: grid;
  gap: 1.2rem;
  margin-top: 1.4rem;
}

.form-item {
  display: grid;
  gap: 0.5rem;
}

.form-label {
  font-weight: 600;
}

.question-count-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.question-count-row .ant-input-number {
  width: 120px;
}

.form-hint {
  font-size: 0.85rem;
  color: rgba(0, 0, 0, 0.45);
  @include themify(
    (
      color: (
        light: rgba(0, 0, 0, 0.45),
        dark: rgba(255, 255, 255, 0.45),
      ),
    )
  );
}

.config-footer {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1.6rem;
}

.footer-hint {
  color: rgba(0, 0, 0, 0.45);
  @include themify(
    (
      color: (
        light: rgba(0, 0, 0, 0.45),
        dark: rgba(255, 255, 255, 0.45),
      ),
    )
  );
}

@media screen and (max-width: 900px) {
  .page-header,
  .selection-panel {
    flex-direction: column;
  }
}
</style>
