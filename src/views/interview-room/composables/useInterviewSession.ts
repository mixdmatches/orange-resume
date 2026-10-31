import { computed, onUnmounted, ref, type Ref } from 'vue'
import type {
  InterviewCategory,
  InterviewDifficulty,
  InterviewSseEvent,
} from '@/types/interview'
import {
  createInterviewApi,
  interviewAskApi,
  interviewFinishApi,
  interviewStartApi,
  submitAnswerApi,
} from '@/api'
import { DEFAULT_QUESTION_COUNT } from '@/stores/interview'
import { ensureAiProviderReady } from '@/utils/ai-ready'
import type { SseRetryInfo } from '@/utils/ai-sse-util.ts'

export type InterviewPhase = 'idle' | 'interviewing' | 'finished'

/** 单题评价的结构化载荷 */
export interface EvaluationPayload {
  round: number
  totalRounds: number
  score: number
  /** 文字反馈 */
  feedback: string
  /** 亮点列表 */
  strengths: string[]
  /** 不足列表 */
  weaknesses: string[]
  /** 改进建议列表 */
  suggestions: string[]
  /** 是否还有下一题 */
  hasNext: boolean
}

/** 面试间聊天消息 */
export interface RoomMessage {
  id: number
  role: 'interviewer' | 'candidate' | 'summary' | 'evaluation'
  content: string
  streaming?: boolean
  stopped?: boolean
  /** 评价结构化数据 */
  evaluation?: EvaluationPayload
}

export const useInterviewSession = (options: {
  resumeText: string
  jobType: Ref<string>
  jd: Ref<string>
  difficulty: Ref<InterviewDifficulty>
  questionCount: Ref<number>
  category: Ref<InterviewCategory>
  interviewId: Ref<string>
}) => {
  const {
    resumeText,
    jobType,
    difficulty,
    questionCount,
    category,
    interviewId,
  } = options

  /** 当前面试阶段 */
  const phase = ref<InterviewPhase>('idle')
  const messages = ref<RoomMessage[]>([])
  /** AI 面试官是否正在回复 */
  const thinking = ref(false)
  /** 当前题号 */
  const currentRound = ref(0)
  /** 题库总题数 */
  const totalRounds = ref(DEFAULT_QUESTION_COUNT)
  /** 面试最终总分 */
  const finalScore = ref<number | null>(null)
  /** 面试已用秒数 */
  const elapsedSeconds = ref(0)
  /** 当前重试状态（网络波动时展示重试提示） */
  const retryInfo = ref<SseRetryInfo | null>(null)

  let timer: number | null = null
  /** 消息 id 自增器 */
  let messageId = 0
  let streamController: AbortController | null = null
  /** 当前进行中的流式消费任务（"结束面试"中断旧流前需等待其收尾，避免两个流并发写消息） */
  let activeRun: Promise<void> | null = null
  /** 是否正在执行"结束面试"流程（中断旧流 → 生成总结），用于防止重入与复位竞争 */
  let finishing = false

  /** 计时显示文本（mm:ss） */
  const elapsedText = computed(() => {
    const minutes = Math.floor(elapsedSeconds.value / 60)
    const seconds = elapsedSeconds.value % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  })

  /**
   * 追加一条聊天消息并返回它
   * @param role - 消息角色
   * @param content - 消息内容
   * @param evaluation - 可选的评价载荷（role='evaluation' 时填充）
   */
  const pushMessage = (
    role: RoomMessage['role'],
    content: string,
    evaluation?: EvaluationPayload,
  ) => {
    const msg: RoomMessage = { id: ++messageId, role, content, evaluation }
    messages.value.push(msg)
    return msg
  }

  /** 启动计时器 */
  const startTimer = () => {
    stopTimer()
    elapsedSeconds.value = 0
    timer = window.setInterval(() => {
      elapsedSeconds.value += 1
    }, 1000)
  }

  /** 停止计时器 */
  const stopTimer = () => {
    if (timer !== null) {
      window.clearInterval(timer)
      timer = null
    }
  }

  // 组件卸载时清理计时器并中止进行中的流式请求，防止内存泄漏
  onUnmounted(() => {
    stopTimer()
    streamController?.abort()
  })

  const stopStream = () => {
    streamController?.abort()
  }

  /**
   * 处理统一 SSE 流的事件，将事件适配为 RoomMessage
   */
  const consumeStream = async (
    stream: AsyncGenerator<InterviewSseEvent, void, unknown>,
  ): Promise<void> => {
    let interviewerMsg: RoomMessage | null = null
    let evalMsg: RoomMessage | null = null
    let summaryMsg: RoomMessage | null = null
    let stopped = false

    try {
      for await (const evt of stream) {
        switch (evt.event) {
          // ========== 流式出题 ==========
          case 'question_start':
            // 占位面试官消息，UI 显示"面试官正在提问…"
            interviewerMsg = pushMessage('interviewer', '')
            interviewerMsg.streaming = true
            totalRounds.value = evt.totalRounds
            currentRound.value = evt.round
            break

          case 'question':
            // 题目文本逐字追加
            if (interviewerMsg) interviewerMsg.content += evt.content
            break

          case 'question_done':
            // 出题完毕
            if (interviewerMsg) interviewerMsg.streaming = false
            interviewerMsg = null
            break

          // ========== 答题评价 ==========
          case 'evaluation_start':
            // 占位评价卡片，UI 显示 loading
            evalMsg = pushMessage('evaluation', '')
            evalMsg.streaming = true
            break

          case 'evaluation_done':
            // 回填评价结构化数据
            if (evalMsg) {
              evalMsg.evaluation = {
                round: evt.round,
                totalRounds: evt.totalRounds,
                score: evt.score,
                feedback: evt.feedback,
                strengths: evt.strengths,
                weaknesses: evt.weaknesses,
                suggestions: evt.suggestions,
                hasNext: evt.hasNext,
              }
              evalMsg.streaming = false
            }
            break

          // ========== 总结 ==========
          case 'summary_start':
            // 占位总结消息，准备流式追加
            summaryMsg = pushMessage('summary', '')
            summaryMsg.streaming = true
            break

          case 'summary':
            // 总结文本逐字增量
            if (summaryMsg) summaryMsg.content += evt.content
            break

          // ========== 流程结束 ==========
          case 'done':
            // 面试结束收尾
            if (summaryMsg) {
              summaryMsg.streaming = false
              if (!summaryMsg.content) summaryMsg.content = evt.summary
            }
            finalScore.value = evt.totalScore
            phase.value = 'finished'
            stopTimer()
            interviewId.value = ''
            break

          case 'error':
            throw new Error(evt.message)
        }
      }
    } catch (error) {
      // 仅当用户主动中止流（结束面试 / 组件卸载触发的 abort）时，才标记为"已手动停止"；
      // 超时、网络断开等非用户中止的错误应继续抛出，由上层展示错误提示，避免误导用户。
      if (streamController?.signal.aborted) {
        stopped = true
      } else {
        throw error
      }
    }

    // ========== 兜底：流结束后修正可能的半成品消息 ==========
    if (interviewerMsg?.streaming) {
      interviewerMsg.streaming = false
      if (stopped) {
        interviewerMsg.stopped = true
      } else if (!interviewerMsg.content) {
        interviewerMsg.content = '（题目生成失败，请稍后重试）'
      }
    }
    // 评价占位消息仍为 streaming 态（中途出错或被停止）
    if (evalMsg?.streaming) {
      evalMsg.streaming = false
      if (stopped) {
        evalMsg.stopped = true
      } else if (!evalMsg.evaluation) {
        evalMsg.evaluation = {
          round: currentRound.value,
          totalRounds: totalRounds.value,
          score: 0,
          feedback: '（评价生成失败，请稍后重试）',
          strengths: [],
          weaknesses: [],
          suggestions: [],
          hasNext: false,
        }
      }
    }
    // 总结占位消息仍为 streaming 态（中途出错或被停止）
    if (summaryMsg?.streaming) {
      summaryMsg.streaming = false
      if (stopped) {
        summaryMsg.stopped = true
      } else if (!summaryMsg.content) {
        summaryMsg.content = '未能生成面试总结，请稍后重试。'
      }
    }
  }

  /**
   * 开始面试：创建后端面试会话 → 统一 SSE 流（空对象触发首题流式）
   * @throws 简历缺失或后端创建/开始失败时抛出带友好文案的错误
   */
  const start = async () => {
    if (!resumeText) {
      throw new Error('简历数据缺失，请返回重新选择简历')
    }
    if (thinking.value) return
    // AI 服务就绪预检查：未选择服务商或未配置 Key 时提示并中止
    if (!(await ensureAiProviderReady())) return

    thinking.value = true
    phase.value = 'interviewing'
    messages.value = []
    currentRound.value = 0
    totalRounds.value = questionCount.value || DEFAULT_QUESTION_COUNT
    finalScore.value = null
    startTimer()

    try {
      // 1. 创建面试会话（后端双写 ai_session + interview_session）
      const session = await createInterviewApi({
        resumeText,
        jobTitle: jobType.value.trim() || undefined,
        questionCount: questionCount.value || undefined,
        category: category.value ?? undefined,
        difficulty: difficulty.value,
      })
      // 写回 store（通过 storeToRefs 的 ref 双向同步）
      interviewId.value = session.id

      // 2. 统一 SSE 流（空对象 → 后端根据 pending_questions 状态自动路由到"开始面试"路径）
      streamController = new AbortController()
      const handleRetry = (info: SseRetryInfo) => {
        retryInfo.value = info
      }
      const stream = interviewStartApi(
        session.id,
        {},
        streamController.signal,
        handleRetry,
      )
      activeRun = consumeStream(stream)
      await activeRun
    } catch (error) {
      // 启动失败则回退到欢迎页
      phase.value = 'idle'
      stopTimer()
      interviewId.value = ''
      throw error
    } finally {
      activeRun = null
      streamController = null
      retryInfo.value = null
      // "结束面试"中断本流后将接管 thinking（保持 true 直至总结流程结束），此处不能复位
      if (!finishing) thinking.value = false
    }
  }

  /**
   * 提交候选人的回答
   * 仅调用 answer 接口提交答案，返回是否最后一题；
   * 获取下一题需调用方显式调用 askNextQuestion，结束面试调用 finish。
   * @param raw - 用户输入的回答原文
   * @returns 是否需要结束面试（答完最后一题时返回 true）
   */
  const submitAnswer = async (
    raw: string,
  ): Promise<{ needFinish: boolean }> => {
    const text = raw.trim()
    if (!text || thinking.value || phase.value !== 'interviewing')
      return { needFinish: false }
    if (!interviewId.value) {
      throw new Error('面试会话未初始化，请重新开始面试')
    }

    if (!(await ensureAiProviderReady())) return { needFinish: false }

    pushMessage('candidate', text)
    thinking.value = true

    try {
      // 提交答案（普通 JSON）
      const { isLastRound } = await submitAnswerApi(interviewId.value, {
        content: text,
      })

      // 最后一题：由调用方触发 finish 生成总结
      if (isLastRound) {
        return { needFinish: true }
      }

      // 还有下一题：交由调用方调用 askNextQuestion 流式获取
      return { needFinish: false }
    } catch (error) {
      // 提交失败：复位 thinking，避免 UI 卡死在"思考中"
      thinking.value = false
      throw error
    }
    // 成功路径不复位 thinking，由后续的 askNextQuestion / finish 接管
  }

  /**
   * 流式获取下一题
   * 调用 ask 接口，由后端根据当前轮次自动出题；
   * 需在 submitAnswer 返回 needFinish=false 后由调用方触发。
   */
  const askNextQuestion = async () => {
    if (phase.value !== 'interviewing' || !interviewId.value) return

    try {
      streamController = new AbortController()
      const handleRetry = (info: SseRetryInfo) => {
        retryInfo.value = info
      }
      const stream = interviewAskApi(
        interviewId.value,
        streamController.signal,
        handleRetry,
      )
      activeRun = consumeStream(stream)
      await activeRun
    } finally {
      activeRun = null
      streamController = null
      retryInfo.value = null
      // "结束面试"中断本流后将接管 thinking（保持 true 直至总结流程结束），此处不能复位
      if (!finishing) thinking.value = false
    }
  }

  /**
   * 提前结束面试
   * 立即切换到 finished 状态，后台静默生成总结，不阻塞用户界面
   */
  const finish = async () => {
    // 防止重入（如总结生成中再次确认结束）
    if (finishing) return
    if (phase.value !== 'interviewing') return
    if (!interviewId.value) {
      throw new Error('面试会话未初始化')
    }

    // AI 服务就绪预检查：未选择服务商或未配置 Key 时提示并中止
    if (!(await ensureAiProviderReady())) return

    finishing = true
    try {
      if (thinking.value) {
        if (activeRun) {
          stopStream()
          await activeRun.catch(() => {})
        }
        // 等待收尾期间面试可能已自然结束
        if (phase.value !== 'interviewing' || !interviewId.value) return
      }

      stopTimer()
      // 立即切换到结束状态，让用户无需等待
      phase.value = 'finished'

      streamController = new AbortController()
      // 结束面试为后台静默生成总结，不展示网络波动重试提示
      const stream = interviewFinishApi(
        interviewId.value,
        {},
        streamController.signal,
      )
      activeRun = consumeStream(stream)
      await activeRun
    } catch (error) {
      // 后台生成总结失败，静默处理，不阻塞用户
      console.error('生成面试总结失败:', error)
    } finally {
      finishing = false
      activeRun = null
      streamController = null
      retryInfo.value = null
      thinking.value = false
    }
  }

  /**
   * 重置会话：回到欢迎页，清空消息与计时
   */
  const reset = () => {
    stopTimer()
    phase.value = 'idle'
    messages.value = []
    currentRound.value = 0
    totalRounds.value = DEFAULT_QUESTION_COUNT
    finalScore.value = null
    elapsedSeconds.value = 0
    interviewId.value = ''
  }

  return {
    phase,
    messages,
    thinking,
    retryInfo,
    /** 当前题号（兼容 index.vue 原有 askedCount 变量名） */
    askedCount: currentRound,
    totalRounds,
    finalScore,
    elapsedText,
    start,
    submitAnswer,
    askNextQuestion,
    finish,
    reset,
  }
}
