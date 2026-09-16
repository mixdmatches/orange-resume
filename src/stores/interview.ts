import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/** 一次面试会话的配置信息 */
export interface InterviewConfig {
  /** 本次面试使用的简历 ID */
  resumeId: string
  /** 目标岗位方向（选填） */
  jobType: string
  /** 目标岗位 JD 原文（选填） */
  jd: string
  /** 面试题目数量 */
  questionCount: number
}

/** 默认面试题目数量 */
export const DEFAULT_QUESTION_COUNT = 5

/**
 * 面试会话 store
 * 保存"进入面试间"前的配置（简历 + 岗位方向 + JD），供面试间页面读取。
 * 使用 sessionStorage 持久化：刷新页面不丢失，关闭标签页自动清理。
 */
export const useInterviewStore = defineStore(
  'interview',
  () => {
    /** 本次面试使用的简历 ID（空字符串表示当前没有进行中的面试会话） */
    const resumeId = ref('')
    /** 目标岗位方向（选填） */
    const jobType = ref('')
    /** 目标岗位 JD 原文（选填） */
    const jd = ref('')
    /** 面试题目数量 */
    const questionCount = ref(DEFAULT_QUESTION_COUNT)

    /** 是否存在进行中的面试会话 */
    const hasSession = computed(() => !!resumeId.value)

    /**
     * 发起一场面试：写入会话配置
     * @param config 面试配置（简历 ID + 选填的岗位方向/JD + 题目数量）
     */
    function startInterview(config: InterviewConfig) {
      resumeId.value = config.resumeId
      jobType.value = config.jobType
      jd.value = config.jd
      questionCount.value = config.questionCount
    }

    /** 结束并清空面试会话 */
    function resetInterview() {
      resumeId.value = ''
      jobType.value = ''
      jd.value = ''
    }

    return {
      resumeId,
      jobType,
      jd,
      questionCount,
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
