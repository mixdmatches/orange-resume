import { computed, onUnmounted, ref, type Ref } from 'vue'
import type {
  InterviewCategory,
  InterviewDifficulty,
  InterviewSseEvent,
} from '@/types/interview'
import type { Resume } from '@/types/resume'
import { createInterviewApi, interviewStreamApi } from '@/api/interview'
import { DEFAULT_QUESTION_COUNT } from '@/stores/interview'
import { ensureAiProviderReady } from '@/utils/ai-ready'

/** 面试阶段：idle=欢迎页 / interviewing=面试进行中 / finished=面试已结束 */
export type InterviewPhase = 'idle' | 'interviewing' | 'finished'

/** 单题评价的结构化载荷（evaluation 角色消息携带） */
export interface EvaluationPayload {
  /** 当前题号 */
  round: number
  /** 总题数 */
  totalRounds: number
  /** 得分（0-100） */
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
  /** interviewer=面试官（AI），candidate=候选人（用户），summary=面试总结，evaluation=单题评价 */
  role: 'interviewer' | 'candidate' | 'summary' | 'evaluation'
  content: string
  /** 是否正在流式输出（true 时 UI 可显示思考态） */
  streaming?: boolean
  /** 该条 AI 消息被用户手动停止生成（UI 据此在消息下方显示停止提示行） */
  stopped?: boolean
  /** 评价结构化数据（role='evaluation' 时填充） */
  evaluation?: EvaluationPayload
}

/**
 * 面试会话 composable
 * 负责面试状态机（idle → interviewing → finished）、聊天消息流、
 * 计时器与 AI 面试官交互；UI 层只负责渲染与用户输入。
 *
 * 基于"面试统一 SSE 流 API"驱动：start / answer / finish 都调同一个
 * interviewStreamApi，后端按 interview_session.status 自动路由行为。
 *
 * @param options.resume - 当前面试使用的简历（页面异步加载后写入的 ref）
 * @param options.jobType - 目标岗位方向（来自面试会话 store，选填）
 * @param options.jd - 目标岗位 JD 原文（来自面试会话 store，仅前端展示，不传后端）
 * @param options.difficulty - 面试难度（来自面试会话 store）
 * @param options.questionCount - 面试题目数量（来自面试会话 store）
 * @param options.category - 面试题目类型（来自面试会话 store，null=混合出题）
 * @param options.interviewId - 后端面试会话 ID（来自 store，双向同步：创建时写入，结束时清空）
 */
export const useInterviewSession = (options: {
  resume: Ref<Resume | null>
  jobType: Ref<string>
  jd: Ref<string>
  difficulty: Ref<InterviewDifficulty>
  questionCount: Ref<number>
  category: Ref<InterviewCategory>
  interviewId: Ref<string>
}) => {
  const { resume, jobType, difficulty, questionCount, category, interviewId } =
    options

  /** 当前面试阶段 */
  const phase = ref<InterviewPhase>('idle')
  /** 聊天消息流（含面试总结与评价） */
  const messages = ref<RoomMessage[]>([])
  /** AI 面试官是否正在回复（用于禁用输入与展示思考态） */
  const thinking = ref(false)
  /** 当前题号（用于顶部进度展示） */
  const currentRound = ref(0)
  /** 题库总题数（来自 question_start 事件的 totalRounds） */
  const totalRounds = ref(DEFAULT_QUESTION_COUNT)
  /** 面试最终总分（done 事件后填充，null 表示未出分） */
  const finalScore = ref<number | null>(null)
  /** 面试已用秒数 */
  const elapsedSeconds = ref(0)

  /** 计时器 id（null 表示未启动） */
  let timer: number | null = null
  /** 消息 id 自增器 */
  let messageId = 0
  /** 当前流式请求控制器（中断生成时调用 abort() 断开 SSE 流） */
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

  /**
   * 中止当前 SSE 流（仅供内部"结束面试"流程与组件卸载使用）
   * 通过 AbortController 中止底层 fetch，SSE 流立即断开；
   * consumeStream 会捕获 AbortError 并兜底修复半成品消息（标记 stopped），不视为错误。
   * 注意：面试间 UI 不提供单条消息的"停止生成"按钮（ChatInput showStop=false），
   * 中断面试行为的唯一入口是"返回"（组件卸载）与"结束面试"（finish 内部中断旧流）
   */
  const stopStream = () => {
    streamController?.abort()
  }

  /**
   * 处理统一 SSE 流的事件，将事件适配为 RoomMessage
   *
   * 事件序列（后端按状态自动路由，评价统一在结束后推送）：
   * - 开始面试：question_start → question*（逐 token）→ question_done
   * - 答题（还有下一轮）：question_start → question* → question_done（直接下一题，无评价）
   * - 答题（最后一轮）：question_done → evaluation_start → evaluation_done（逐题批量评价）→ summary_start → summary* → done
   * - 提前结束：直接 evaluation_start → evaluation_done（逐题批量评价）→ summary_start → summary* → done
   *
   * @param stream - interviewStreamApi 返回的异步迭代器
   */
  const consumeStream = async (
    stream: AsyncGenerator<InterviewSseEvent, void, unknown>,
  ) => {
    /** 当前面试官占位消息（question_start 时创建，question 逐字追加） */
    let interviewerMsg: RoomMessage | null = null
    /** 当前评价占位消息（evaluation_start 时创建，evaluation_done 时回填） */
    let evalMsg: RoomMessage | null = null
    /** 总结占位消息（summary_start 时创建，summary 事件逐字追加） */
    let summaryMsg: RoomMessage | null = null
    /** 是否被用户主动停止（AbortError） */
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
              // done 事件里的 summary 作为兜底（流式中断且 summary 为空时回填）
              if (!summaryMsg.content) summaryMsg.content = evt.summary
            }
            finalScore.value = evt.totalScore
            phase.value = 'finished'
            stopTimer()
            interviewId.value = ''
            break

          // ========== 后端错误 ==========
          case 'error':
            // 抛给调用方（UI 层 catch 后 message.error 展示原因），
            // finally 会复位 thinking，兜底逻辑修复半成品消息
            throw new Error(evt.message)
        }
      }
    } catch (error) {
      // 用户主动停止生成：不算错误，走下方兜底修复半成品消息；其余错误继续抛出
      if ((error as Error).name === 'AbortError') {
        stopped = true
      } else {
        throw error
      }
    }

    // ========== 兜底：流结束后修正可能的半成品消息 ==========
    // 用户手动停止：不填占位文案，保留已生成的部分内容，
    // 通过 stopped 标记让 UI 在消息下方渲染"已手动停止生成"提示行
    // 面试官占位消息仍为 streaming 态（中途出错或被停止），兜底填充
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
    if (!resume.value) {
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
        resumeId: resume.value.id,
        jobTitle: jobType.value.trim() || undefined,
        questionCount: questionCount.value || undefined,
        category: category.value ?? undefined,
        difficulty: difficulty.value,
      })
      // 写回 store（通过 storeToRefs 的 ref 双向同步）
      interviewId.value = session.id

      // 2. 统一 SSE 流（空对象 → 后端根据 pending_questions 状态自动路由到"开始面试"路径）
      streamController = new AbortController()
      const stream = interviewStreamApi(session.id, {}, streamController.signal)
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
      // "结束面试"中断本流后将接管 thinking（保持 true 直至总结流程结束），此处不能复位
      if (!finishing) thinking.value = false
    }
  }

  /**
   * 提交候选人的回答
   * 统一 SSE 流 + content → 后端路由到"答题评价"路径：
   * evaluation_start → evaluation_done → 下一题流式出题 / 总结 → done
   * @param raw - 用户输入的回答原文
   */
  const submitAnswer = async (raw: string) => {
    const text = raw.trim()
    if (!text || thinking.value || phase.value !== 'interviewing') return
    if (!interviewId.value) {
      throw new Error('面试会话未初始化，请重新开始面试')
    }
    // AI 服务就绪预检查：未选择服务商或未配置 Key 时提示并中止
    if (!(await ensureAiProviderReady())) return
    // "结束面试"流程已启动（可能正在中断旧流）：本次回答不再提交，避免与总结流并发写消息
    if (finishing) return

    pushMessage('candidate', text)
    thinking.value = true

    try {
      streamController = new AbortController()
      const stream = interviewStreamApi(
        interviewId.value,
        { content: text },
        streamController.signal,
      )
      activeRun = consumeStream(stream)
      await activeRun
    } finally {
      activeRun = null
      streamController = null
      // "结束面试"中断本流后将接管 thinking（保持 true 直至总结流程结束），此处不能复位
      if (!finishing) thinking.value = false
    }
  }

  /** 面试总结是否已完成（phase 为 finished）；用函数封装读取，避免 TS 对 phase.value 的字面量收窄导致后续比较报错 */
  const isPhaseFinished = () => phase.value === 'finished'

  /**
   * 提前结束面试：统一 SSE 流 + finishOnly: true
   * 后端路由到"提前结束"路径：summary_start → summary* → done
   *
   * 允许在 AI 生成中（出题/评价/总结）点击：先中断当前流并等待其收尾
   * （半成品消息由 consumeStream 兜底标记 stopped，UI 显示"已手动停止生成"），
   * 再发起总结流，保证同一时刻只有一个流在写消息。
   * 这是面试间唯一主动中断生成的方式（单条消息不支持停止，见 ChatInput showStop=false）
   */
  const finish = async () => {
    // 防止重入（如总结生成中再次确认结束）
    if (finishing) return
    if (phase.value !== 'interviewing') return
    if (!interviewId.value) {
      throw new Error('面试会话未初始化')
    }

    finishing = true
    try {
      if (thinking.value) {
        // AI 正在生成：中断当前流并等待其收尾（旧流的 finally 会跳过 thinking 复位），
        // thinking 在整个结束流程中保持 true，避免等待间隙用户提交回答与结束流程并发
        if (activeRun) {
          stopStream()
          await activeRun.catch(() => {})
        }
        // 等待收尾期间面试可能已自然结束（done 事件先于中断到达）
        if (phase.value !== 'interviewing' || !interviewId.value) return
      }

      // AI 服务就绪预检查：未选择服务商或未配置 Key 时提示并中止
      if (!(await ensureAiProviderReady())) return

      thinking.value = true
      stopTimer()

      streamController = new AbortController()
      const stream = interviewStreamApi(
        interviewId.value,
        { finishOnly: true },
        streamController.signal,
      )
      activeRun = consumeStream(stream)
      await activeRun
      // 流正常结束但未进入 finished（如服务端提前关闭）：恢复计时器让用户可重试
      if (!isPhaseFinished()) startTimer()
    } catch (error) {
      // 失败时不改变 phase，让用户可以重试
      startTimer()
      throw error
    } finally {
      finishing = false
      activeRun = null
      streamController = null
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
    /** 当前题号（兼容 index.vue 原有 askedCount 变量名） */
    askedCount: currentRound,
    totalRounds,
    finalScore,
    elapsedText,
    start,
    submitAnswer,
    finish,
    reset,
  }
}
