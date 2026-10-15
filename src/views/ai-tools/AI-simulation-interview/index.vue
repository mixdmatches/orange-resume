<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { h } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { SettingOutlined, FileTextOutlined } from '@ant-design/icons-vue'
import ResumeSelectCard from './components/ResumeSelectCard.vue'
import ResumePreviewCard from './components/ResumePreviewCard.vue'
import { getAllResumesIDB } from '@/service/resumeIDB'
import { useInterviewStore } from '@/stores/interview'
import {
  DEFAULT_CATEGORY,
  DEFAULT_QUESTION_COUNT,
  QUESTION_COUNT_MAX,
  QUESTION_COUNT_MIN,
} from '@/stores/interview'
import type { InterviewCategory, InterviewDifficulty } from '@/types/interview'
import type { Resume } from '@/types/resume'

const router = useRouter()
const interviewStore = useInterviewStore()
const resumes = ref<Resume[]>([])
const selectedResumeId = ref('')
const resumePreviewVisible = ref(false)

const jobType = ref('')
const jd = ref('')
const difficulty = ref<InterviewDifficulty>('medium')
const questionCount = ref<number>(DEFAULT_QUESTION_COUNT)
const category = ref<InterviewCategory>(DEFAULT_CATEGORY)

const categoryOptions: Array<{ label: string; value: InterviewCategory }> = [
  { label: '混合出题', value: null },
  { label: '技术类', value: 'technical' },
  { label: '行为面试题', value: 'behavioral' },
  { label: '项目深挖', value: 'project_deep_dive' },
]

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
const resumeText = ref('')

// ========= 简历加载 =========
const loadResumes = async () => {
  try {
    const list = await getAllResumesIDB()
    list.sort((a, b) => b.createdAt - a.createdAt)
    resumes.value = list
  } catch {
    message.error('读取简历列表失败，请刷新重试')
  }
}

const handleManageResume = () => {
  router.push('/my-resume')
}

const handleOpenSetting = () => {
  router.push('/profile')
}

const handleOpenPreview = () => {
  if (!selectedResumeId.value) {
    message.warning('请先选择一份简历')
    return
  }
  resumePreviewVisible.value = true
}

const handleEnterRoom = () => {
  if (!resumeText.value) {
    message.warning('请先选择一份简历')
    return
  }
  interviewStore.startInterview({
    resumeText: resumeText.value,
    jobType: jobType.value.trim(),
    jd: jd.value.trim(),
    difficulty: difficulty.value,
    questionCount: questionCount.value,
    category: category.value,
  })
  router.push('/interview-room')
}

onMounted(() => {
  loadResumes()
})
</script>

<template>
  <div class="page page-ai-interview">
    <header class="page-header">
      <div>
        <h1 class="page-title">AI 模拟面试</h1>
        <p class="page-subtitle">
          基于简历内容智能生成面试题与参考回答，支持自定义提问、快速复制与实践演练
        </p>
      </div>
      <div class="page-actions">
        <a-button :icon="h(FileTextOutlined)" @click="handleManageResume">
          我的简历
        </a-button>
        <a-button
          type="primary"
          :icon="h(SettingOutlined)"
          @click="handleOpenSetting"
        >
          AI 设置
        </a-button>
      </div>
    </header>

    <!-- ============ 选择简历区块 ============ -->
    <section class="section-block">
      <h2 class="block-title">选择简历</h2>
      <resume-select-card
        v-model:selectedReusmeId="selectedResumeId"
        v-model:resumeText="resumeText"
        :resumes="resumes"
        @manage="handleManageResume"
        @preview="handleOpenPreview"
      />
    </section>

    <a-modal
      v-model:open="resumePreviewVisible"
      title="简历预览"
      width="860"
      :footer="null"
      centered
    >
      <resume-preview-card :resume="selectedResume" />
    </a-modal>

    <!-- ============ 面试配置区块 ============ -->
    <section class="section-block">
      <h2 class="block-title">面试配置</h2>
      <p class="block-desc">
        选择目标岗位或粘贴岗位 JD（均为选填），AI
        将结合简历内容让面试更贴近真实求职场景。
      </p>

      <div class="config-grid">
        <div class="form-item">
          <label class="form-label">面试难度</label>
          <div class="difficulty-row">
            <a-radio-group v-model:value="difficulty">
              <a-radio value="easy">简单</a-radio>
              <a-radio value="medium">中等</a-radio>
              <a-radio value="hard">困难</a-radio>
            </a-radio-group>
            <span class="form-hint">难度影响题目深度与追问强度</span>
          </div>
        </div>

        <div class="form-item">
          <label class="form-label">题目数量</label>
          <div class="question-count-row">
            <a-input-number
              v-model:value="questionCount"
              :min="QUESTION_COUNT_MIN"
              :max="QUESTION_COUNT_MAX"
              :step="1"
            />
            <span class="form-hint">
              共 {{ QUESTION_COUNT_MIN }}-{{ QUESTION_COUNT_MAX }}
              题，实际数量可能因答题情况略有浮动
            </span>
          </div>
        </div>

        <div class="form-item">
          <label class="form-label">题目类型</label>
          <a-radio-group v-model:value="category" button-style="solid">
            <a-radio-button
              v-for="opt in categoryOptions"
              :key="opt.value ?? 'mixed'"
              :value="opt.value"
              >{{ opt.label }}</a-radio-button
            >
          </a-radio-group>
          <span class="form-hint"
            >混合出题将综合考察技术、行为与项目深挖能力</span
          >
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

        <div class="form-item form-item-full">
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
          :disabled="!resumeText"
          @click="handleEnterRoom"
          >进入面试间</a-button
        >
        <span v-if="!resumeText" class="footer-hint"
          >请先在上方选择简历或上传简历文件</span
        >
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.page-ai-interview {
  // 继承 .page 基础 padding

  :deep(.section-block) {
    // 让 a-card 等子组件继承圆角
    .ant-card {
      border-radius: var(--radius-md);
    }
  }
}

/* ============ 配置网格 ============ */
.config-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-5);
  margin-top: var(--space-4);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);

  &.form-item-full {
    grid-column: 1 / -1;
  }
}

.form-label {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-text);
}

.form-hint {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin-top: var(--space-1);
}

.difficulty-row,
.question-count-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;

  .form-hint {
    margin-top: 0;
  }
}

.question-count-row {
  :deep(.ant-input-number) {
    width: 120px;
  }
}

.config-footer {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-6);
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-border);
}

.footer-hint {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }
}
</style>
