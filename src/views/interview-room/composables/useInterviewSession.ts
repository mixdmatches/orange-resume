import { computed, onUnmounted, ref, type Ref } from 'vue'
import type { ChatMessage } from '@/types/ai'
import type { Resume } from '@/types/resume'
import { resumeToText } from '@/utils/resumeToText'

/** 面试阶段：idle=欢迎页 / interviewing=面试进行中 / finished=面试已结束 */
export type InterviewPhase = 'idle' | 'interviewing' | 'finished'

/** 面试间聊天消息 */
export interface RoomMessage {
  id: number
  /** interviewer=面试官（AI），candidate=候选人（用户），summary=面试总结 */
  role: 'interviewer' | 'candidate' | 'summary'
  content: string
  /** 是否正在流式输出（true 时 UI 可把空气泡显示为思考态） */
  streaming?: boolean
}

/**
 * 面试会话 composable
 * 负责面试状态机（idle → interviewing → finished）、聊天消息流、
 * 计时器与 AI 面试官交互；UI 层只负责渲染与用户输入。
 *
 * @param options.resume - 当前面试使用的简历（页面异步加载后写入的 ref）
 * @param options.jobType - 目标岗位方向（来自面试会话 store，选填）
 * @param options.jd - 目标岗位 JD 原文（来自面试会话 store，选填）
 * @param options.questionCount - 面试题目数量（来自面试会话 store）
 */
export const useInterviewSession = (options: {
  resume: Ref<Resume | null>
  jobType: Ref<string>
  jd: Ref<string>
  questionCount: Ref<number>
}) => {
  const { resume, jobType, jd, questionCount } = options

  /** 当前面试阶段 */
  const phase = ref<InterviewPhase>('idle')
  /** 聊天消息流（含面试总结） */
  const messages = ref<RoomMessage[]>([])
  /** AI 面试官是否正在回复（用于禁用输入与展示思考态） */
  const thinking = ref(false)
  /** 已提问的数量（用于顶部进度展示） */
  const askedCount = ref(0)
  /** 面试已用秒数 */
  const elapsedSeconds = ref(0)

  /** 计时器 id（null 表示未启动） */
  let timer: number | null = null
  /** 消息 id 自增器 */
  let messageId = 0

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
   */
  const pushMessage = (role: RoomMessage['role'], content: string) => {
    const msg: RoomMessage = { id: ++messageId, role, content }
    messages.value.push(msg)
    return msg
  }

  /**
   * 构造面试官的 system 提示词（每次调用时基于最新状态生成）
   */
  const buildSystemPrompt = () => {
    const lines = [
      '你是一位经验丰富的面试官，正在对候选人进行一对一的模拟面试。',
      '',
      '候选人简历如下：',
      resume.value ? resumeToText(resume.value) : '（未提供）',
    ]
    if (jobType.value) {
      lines.push('', `目标岗位：${jobType.value}`)
    }
    if (jd.value) {
      lines.push('', '岗位 JD 内容如下：', jd.value)
    }
    lines.push(
      '',
      '面试规则：',
      `1. 整场面试共 ${questionCount.value} 个问题，每次只提出一个问题，等候选人回答后再继续`,
      '2. 问题结合简历与岗位要求，由浅入深，覆盖专业技能、项目经验与解决问题能力',
      '3. 收到回答后先用一两句话简要点评，再提出下一个问题，不要一次抛出多个问题',
      '4. 语气专业自然，像真实面试对话，回复保持简洁',
    )
    return lines.join('\n')
  }

  /**
   * 流式调用 AI 面试官，逐字增量追加到 target 消息
   * @param target - 接收流式增量的消息对象（content 会被持续追加）
   * @param extra - 本轮附加给模型的指令
   * @param maxTokens - 回复最大 token 数
   */
  const streamInto = async (
    target: RoomMessage,
    extra: string,
    maxTokens = 800,
  ) => {
    const apiMessages: ChatMessage[] = [
      { role: 'system', content: buildSystemPrompt() },
      ...messages.value
        .filter(msg => msg.role !== 'summary' && msg.id !== target.id)
        .map(msg => ({
          role:
            msg.role === 'interviewer'
              ? ('assistant' as const)
              : ('user' as const),
          content: msg.content,
        })),
      { role: 'user', content: extra },
    ]

    const { chatStreamApi } = await import('@/api/ai')
    // 标记为流式中：UI 会把空 content 的占位气泡显示为思考态
    target.streaming = true
    try {
      const stream = chatStreamApi({ messages: apiMessages, maxTokens })
      for await (const chunk of stream) {
        target.content += chunk
      }
    } catch (error) {
      // 异常中断（网络错误、后端 error 事件等）：若已无任何内容，
      // 给占位消息填兑底文案，避免出现空气泡或一直停留在思考态；
      // 若已收到部分内容则保留半截回复，对用户更友好
      if (!target.content) {
        target.content = '（回复失败，请稍后重试）'
      }
      throw error
    } finally {
      // 保险：无论成功、失败还是中途取消，都必清流式标记
      target.streaming = false
    }
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

  // 组件卸载时清理计时器，防止内存泄漏
  onUnmounted(stopTimer)

  /**
   * 开始面试：重置会话并让 AI 提出第一个问题
   * @throws 简历缺失或未配置 API Key 时抛出带友好文案的错误
   */
  const start = async () => {
    if (!resume.value) {
      throw new Error('简历数据缺失，请返回重新选择简历')
    }
    if (thinking.value) return

    thinking.value = true
    phase.value = 'interviewing'
    messages.value = []
    askedCount.value = 0
    startTimer()
    try {
      // 先占位一条空消息，再流式追加，UI 即可逐字渲染面试官提问
      const msg = pushMessage('interviewer', '')
      askedCount.value = 1
      await streamInto(msg, '请开始面试，提出第一个问题。')
      if (!msg.content) {
        msg.content = '你好，请先做一个简单的自我介绍。'
      }
    } catch (error) {
      // 启动失败则回退到欢迎页，避免停留在没有消息的"进行中"状态
      phase.value = 'idle'
      stopTimer()
      throw error
    } finally {
      thinking.value = false
    }
  }

  /**
   * 生成面试总结评价并结束面试
   * @param context - 总结时的附加说明（如"候选人主动结束面试"）
   */
  const generateSummary = async (context: string) => {
    stopTimer()
    const instruction = `面试到此结束。${context}请你以面试官身份，根据整场面试对话对候选人进行总结评价，用 Markdown 格式输出，包含以下四个部分：
## 整体表现
## 亮点
## 待改进
## 复习建议
评价要具体、客观，尽量引用候选人回答中的实际内容作为依据。`
    // 占位空 summary 消息，流式追加让总结也逐字呈现
    const summaryMsg = pushMessage('summary', '')
    await streamInto(summaryMsg, instruction, 1200)
    if (!summaryMsg.content) {
      summaryMsg.content = '未能生成面试总结，请稍后重试。'
    }
    phase.value = 'finished'
  }

  /**
   * 提交候选人的回答
   * 非最后一题：AI 简短点评并提出下一个问题；
   * 最后一题：AI 给出收尾点评后自动生成总结评价并结束面试。
   * @param raw - 用户输入的回答原文
   */
  const submitAnswer = async (raw: string) => {
    const text = raw.trim()
    if (!text || thinking.value || phase.value !== 'interviewing') return

    pushMessage('candidate', text)
    thinking.value = true
    try {
      const isLast = askedCount.value >= questionCount.value
      const instruction = isLast
        ? `候选人已回答完全部 ${questionCount.value} 个问题。请用两三句话给出简短的现场收尾点评，不要提出新问题。`
        : '请针对候选人的回答简要点评（一两句），然后提出下一个问题。'
      // 占位空消息，流式追加点评与下一题，UI 逐字渲染
      const replyMsg = pushMessage('interviewer', '')
      await streamInto(replyMsg, instruction)
      if (isLast) {
        await generateSummary('')
      } else {
        askedCount.value += 1
      }
    } finally {
      thinking.value = false
    }
  }

  /**
   * 提前结束面试：停止答题并生成总结评价
   */
  const finish = async () => {
    if (phase.value !== 'interviewing' || thinking.value) return
    thinking.value = true
    try {
      await generateSummary('候选人主动结束了面试。')
    } finally {
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
    askedCount.value = 0
    elapsedSeconds.value = 0
  }

  return {
    phase,
    messages,
    thinking,
    askedCount,
    elapsedText,
    start,
    submitAnswer,
    finish,
    reset,
  }
}
