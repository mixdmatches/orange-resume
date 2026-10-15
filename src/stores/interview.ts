import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { InterviewCategory, InterviewDifficulty } from '@/types/interview'
export interface InterviewConfig {
  resumeText: string
  jobType: string
  jd: string
  difficulty: InterviewDifficulty
  questionCount: number
  category: InterviewCategory
}

export const DEFAULT_DIFFICULTY: InterviewDifficulty = 'medium'
export const DEFAULT_QUESTION_COUNT = 5
export const QUESTION_COUNT_MIN = 5
export const QUESTION_COUNT_MAX = 20
export const DEFAULT_CATEGORY: InterviewCategory = null
export const useInterviewStore = defineStore(
  'interview',
  () => {
    const resumeId = ref('')
    const resumeText = ref('')
    const jobType = ref('')
    const jd = ref('')
    const difficulty = ref<InterviewDifficulty>(DEFAULT_DIFFICULTY)
    const questionCount = ref<number>(DEFAULT_QUESTION_COUNT)
    const category = ref<InterviewCategory>(DEFAULT_CATEGORY)
    const interviewId = ref('')

    const hasSession = computed(() => !!resumeId.value)

    function startInterview(config: InterviewConfig) {
      resumeText.value = config.resumeText
      jobType.value = config.jobType
      jd.value = config.jd
      difficulty.value = config.difficulty
      questionCount.value = config.questionCount
      category.value = config.category
    }

    function resetInterview() {
      resumeId.value = ''
      resumeText.value = ''
      jobType.value = ''
      jd.value = ''
      interviewId.value = ''
    }

    return {
      resumeId,
      resumeText,
      jobType,
      jd,
      difficulty,
      questionCount,
      category,
      interviewId,
      hasSession,
      startInterview,
      resetInterview,
    }
  },
  {
    // 面试会话仅在本次浏览会话内有效：刷新可恢复，关闭标签页自动清除
    persist: { storage: sessionStorage },
  },
)
