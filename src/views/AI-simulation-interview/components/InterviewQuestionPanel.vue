<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { h } from 'vue'
import { message } from 'ant-design-vue'
import { generateInterviewQuestions, hasApiKey } from '@/utils/deepseek'
import { ReloadOutlined } from '@ant-design/icons-vue'
import type { Resume } from '@/types/resume'
import {
  createDefaultQuestionList,
  InterviewQuestion,
  parseQuestions,
  resumeToText,
} from '../composables/useAiInterview'

const props = defineProps({
  resume: {
    type: Object as () => Resume | null,
    default: null,
  },
})

const questions = ref<InterviewQuestion[]>([])
const isLoading = ref(false)
const activeKeys = ref<string[]>([])
const allExpanded = ref(false)

const hasQuestions = computed(() => questions.value.length > 0)
const panelTitle = computed(() =>
  props.resume ? 'AI 已为当前简历生成面试问题' : '请选择简历后开始生成',
)

const generateQuestions = async () => {
  if (!props.resume) {
    message.warning('请先选择一份简历')
    return
  }

  if (!hasApiKey()) {
    message.error('请先在“设置”页面配置 API Key')
    return
  }

  isLoading.value = true
  questions.value = []
  allExpanded.value = false
  activeKeys.value = []

  try {
    const content = resumeToText(props.resume)
    const rawResult = await generateInterviewQuestions(content, 5)
    const parsed = parseQuestions(rawResult)

    questions.value =
      parsed.length > 0 ? parsed : createDefaultQuestionList(props.resume)
  } catch (error) {
    message.error((error as Error).message || '生成面试问题失败，请稍后重试')
    questions.value = createDefaultQuestionList(props.resume)
  } finally {
    isLoading.value = false
  }
}

const togglePanel = (key: string[] | string) => {
  if (Array.isArray(key)) {
    activeKeys.value = key
  } else {
    activeKeys.value = key ? [key] : []
  }
  allExpanded.value = activeKeys.value.length === questions.value.length
}

const clearQuestions = () => {
  questions.value = []
  activeKeys.value = []
  allExpanded.value = false
}

watch(
  () => props.resume?.id,
  () => {
    clearQuestions()
  },
)
</script>

<template>
  <a-card class="question-panel" bordered>
    <div class="panel-header">
      <div>
        <h3>{{ panelTitle }}</h3>
        <p>基于你选中的简历，AI 将自动生成结构化面试问题与参考回答。</p>
      </div>
      <a-tag color="processing">智能出题</a-tag>
    </div>

    <div class="panel-actions">
      <a-space>
        <a-button
          type="primary"
          :loading="isLoading"
          :disabled="!props.resume"
          @click="generateQuestions"
        >
          {{ isLoading ? '正在生成' : '开始生成' }}
        </a-button>
        <a-button
          :icon="h(ReloadOutlined)"
          :disabled="!hasQuestions || isLoading"
          @click="generateQuestions"
          >重新生成</a-button
        >
      </a-space>
    </div>

    <a-divider />

    <div v-if="!props.resume" class="empty-state">
      <a-empty description="当前未选择简历" />
    </div>

    <div v-else>
      <a-spin :spinning="isLoading">
        <div v-if="hasQuestions" class="question-list">
          <a-collapse
            v-model:active-key="activeKeys"
            :accordion="false"
            @change="togglePanel"
          >
            <a-collapse-panel
              v-for="item in questions"
              :key="item.id"
              :name="item.id.toString()"
              :header="`Q${item.id} ${item.question}`"
            >
              <div class="answer-block">
                <p>{{ item.answer }}</p>
              </div>
            </a-collapse-panel>
          </a-collapse>
        </div>

        <div v-else class="empty-state">
          <a-empty description="还没有生成问题，点击上方按钮开始" />
        </div>
      </a-spin>
    </div>
  </a-card>
</template>

<style scoped lang="scss">
.question-panel {
  background: #fff;
  border-radius: 1rem;
  min-height: 380px;
}

.panel-header {
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.panel-header h3 {
  margin: 0;
  font-size: 1.6rem;
}

.panel-header p {
  margin: 0.6rem 0 0;
  color: rgba(0, 0, 0, 0.65);
}

.panel-actions {
  margin-bottom: 1rem;
}

.question-list {
  max-height: 520px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.answer-block {
  padding: 1rem 0;
  line-height: 1.8;
  color: rgba(0, 0, 0, 0.75);
}

.empty-state {
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
