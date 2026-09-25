import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { InterviewCategory, InterviewDifficulty } from '@/types/interview'

/** 一次面试会话的配置信息 */
export interface InterviewConfig {
  /** 本次面试使用的简历 ID */
  resumeId: string
  /** 目标岗位方向（选填） */
  jobType: string
  /** 目标岗位 JD 原文（选填，仅前端展示，不传给后端） */
  jd: string
  /** 面试难度 */
  difficulty: InterviewDifficulty
  /** 面试题目数量（5-20 题） */
  questionCount: number
  /** 面试题目类型（null=混合出题） */
  category: InterviewCategory
}

/** 默认面试难度 */
export const DEFAULT_DIFFICULTY: InterviewDifficulty = 'medium'

/** 默认题目数量 */
export const DEFAULT_QUESTION_COUNT = 5

/** 题目数量允许的最小值 */
export const QUESTION_COUNT_MIN = 5

/** 题目数量允许的最大值 */
export const QUESTION_COUNT_MAX = 20

/** 默认题目类型（null=混合出题） */
export const DEFAULT_CATEGORY: InterviewCategory = null

/**
 * 面试会话 store
 * 保存"进入面试间"前的配置（简历 + 岗位方向 + JD + 难度），供面试间页面读取。
 * 同时追踪当前进行中的面试会话 ID（创建后端面试会话后写入，结束后清空）。
 * 使用 sessionStorage 持久化：刷新页面不丢失，关闭标签页自动清理。
 */
export const useInterviewStore = defineStore(
  'interview',
  () => {
    /** 本次面试使用的简历 ID（空字符串表示当前没有进行中的面试会话） */
    const resumeId = ref('')
    /** 目标岗位方向（选填） */
    const jobType = ref('')
    /** 目标岗位 JD 原文（选填，仅前端展示） */
    const jd = ref('')
    /** 面试难度 */
    const difficulty = ref<InterviewDifficulty>(DEFAULT_DIFFICULTY)
    /** 面试题目数量（5-20） */
    const questionCount = ref<number>(DEFAULT_QUESTION_COUNT)
    /** 面试题目类型（null=混合出题） */
    const category = ref<InterviewCategory>(DEFAULT_CATEGORY)
    /** 当前进行中的面试会话 ID（后端创建后写入，结束后清空；空字符串表示无进行中的会话） */
    const interviewId = ref('')

    /** 是否存在进行中的面试会话 */
    const hasSession = computed(() => !!resumeId.value)

    /**
     * 发起一场面试：写入会话配置
     * @param config 面试配置（简历 ID + 选填的岗位方向/JD + 难度 + 题量 + 题型）
     */
    function startInterview(config: InterviewConfig) {
      resumeId.value = config.resumeId
      jobType.value = config.jobType
      jd.value = config.jd
      difficulty.value = config.difficulty
      questionCount.value = config.questionCount
      category.value = config.category
    }

    /** 结束并清空面试会话 */
    function resetInterview() {
      resumeId.value = ''
      jobType.value = ''
      jd.value = ''
      interviewId.value = ''
    }

    return {
      resumeId,
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
