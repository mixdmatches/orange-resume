<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { h } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { SettingOutlined, FileTextOutlined } from '@ant-design/icons-vue'
import ResumeSelectCard from './components/ResumeSelectCard.vue'
import ResumePreviewCard from './components/ResumePreviewCard.vue'
import InterviewHistoryList from './components/InterviewHistoryList.vue'
import InterviewDetailDrawer from './components/InterviewDetailDrawer.vue'
import { getAllResumesIDB } from '@/service/resumeIDB'
import { useInterviewStore } from '@/stores/interview'
import {
  DEFAULT_CATEGORY,
  DEFAULT_QUESTION_COUNT,
  QUESTION_COUNT_MAX,
  QUESTION_COUNT_MIN,
} from '@/stores/interview'
import type {
  InterviewCategory,
  InterviewDifficulty,
  InterviewDetail,
  InterviewSession,
} from '@/types/interview'
import {
  deleteInterviewApi,
  getInterviewDetailApi,
  listInterviewsApi,
} from '@/api/interview'
import type { Resume } from '@/types/resume'

const router = useRouter()
const interviewStore = useInterviewStore()
const resumes = ref<Resume[]>([])
const selectedResumeId = ref('')
const resumePreviewVisible = ref(false)

/** 目标岗位方向（选填，可从常用岗位中选择或自行输入） */
const jobType = ref('')
/** 目标岗位 JD 原文（选填，仅前端展示） */
const jd = ref('')
/** 面试难度 */
const difficulty = ref<InterviewDifficulty>('medium')
/** 面试题目数量（5-20） */
const questionCount = ref<number>(DEFAULT_QUESTION_COUNT)
/** 面试题目类型（null=混合出题） */
const category = ref<InterviewCategory>(DEFAULT_CATEGORY)

/** 题目类型选项（混合出题 / 技术 / 行为 / 项目深挖） */
const categoryOptions: Array<{ label: string; value: InterviewCategory }> = [
  { label: '混合出题', value: null },
  { label: '技术类', value: 'technical' },
  { label: '行为面试题', value: 'behavioral' },
  { label: '项目深挖', value: 'project_deep_dive' },
]

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

// ========= 历史面试列表 =========

/** 历史面试列表 */
const historyList = ref<InterviewSession[]>([])
/** 历史列表加载中 */
const historyLoading = ref(false)
/** 详情抽屉是否打开 */
const detailVisible = ref(false)
/** 详情抽屉的面试详情数据 */
const detailData = ref<InterviewDetail | null>(null)
/** 详情抽屉加载中 */
const detailLoading = ref(false)

/**
 * 加载历史面试列表
 */
const loadHistory = async () => {
  historyLoading.value = true
  try {
    const res = await listInterviewsApi({ page: 1, pageSize: 20 })
    historyList.value = res.list
  } catch {
    message.error('加载历史面试失败')
  } finally {
    historyLoading.value = false
  }
}

/**
 * 打开面试详情抽屉
 * @param id 面试会话 ID
 */
const handleOpenDetail = async (id: string) => {
  detailVisible.value = true
  detailData.value = null
  detailLoading.value = true
  try {
    detailData.value = await getInterviewDetailApi(id)
  } catch {
    message.error('加载面试详情失败')
  } finally {
    detailLoading.value = false
  }
}

/**
 * 删除面试会话（二次确认）
 * @param session 面试会话对象
 */
const handleDeleteInterview = (session: InterviewSession) => {
  Modal.confirm({
    title: '删除该面试记录？',
    content: `将删除「${session.title}」，此操作不可恢复。`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        await deleteInterviewApi(session.id)
        message.success('已删除')
        await loadHistory()
      } catch {
        message.error('删除失败')
      }
    },
  })
}

// ========= 简历加载 =========

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
 * 校验已选简历后，将简历 ID 与选填的岗位方向/JD/难度/题量/题型写入面试会话 store，
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
    difficulty: difficulty.value,
    questionCount: questionCount.value,
    category: category.value,
  })
  router.push('/interview-room')
}

onMounted(() => {
  loadResumes()
  loadHistory()
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
            <span class="form-hint"
              >共 {{ QUESTION_COUNT_MIN }}-{{
                QUESTION_COUNT_MAX
              }}
              题，实际数量可能因答题情况略有浮动</span
            >
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

    <!-- 历史面试列表 -->
    <interview-history-list
      :list="historyList"
      :loading="historyLoading"
      @open-detail="handleOpenDetail"
      @delete="handleDeleteInterview"
      @refresh="loadHistory"
    />

    <!-- 面试详情抽屉 -->
    <interview-detail-drawer
      v-model:open="detailVisible"
      :detail="detailData"
      :loading="detailLoading"
    />
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

.question-count-row,
.difficulty-row {
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
