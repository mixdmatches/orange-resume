/**
 * AI 面试模块 API
 *
 * 说明：
 * - 非流式接口使用 request 封装（axios），走统一拦截器（鉴权/错误提示/401 刷新）
 * - 流式答题基于 ai.ts 的通用传输层 fetchSseEvents 复用
 * - 后端统一入口 POST /interviews/:id/stream，按 interview_session.status 自动路由：
 *   pending_questions → 开始面试（空 body 或不传 content）
 *   in_progress + content → 答题评价
 *   in_progress + finishOnly=true → 提前结束
 */
import { fetchSseEvents } from '@/api/ai'
import type {
  CreateInterviewDto,
  InterviewDetail,
  InterviewListParams,
  InterviewListResult,
  InterviewSession,
  InterviewStreamDto,
  InterviewSseEvent,
} from '@/types/interview'
import { AI_TIMEOUT, del, get, post } from '@/utils/request'

/** 非流式 AI 接口超时配置（题库生成 / 总结评分等 LLM 长耗时操作） */
const INTERVIEW_API_CONFIG = {
  timeout: AI_TIMEOUT,
}

/**
 * 创建面试会话
 * 双写 ai_session(type=interview) + interview_session，状态为待开始（pending_questions）。
 * 仅创建不开始，生成题库/面试开始由统一 SSE 入口触发。
 * @param data 创建面试 DTO（简历 ID 必传，岗位/难度等可选）
 * @returns 面试会话对象（含会话 ID）
 */
export function createInterviewApi(data: CreateInterviewDto) {
  return post<InterviewSession>('/interviews', data, INTERVIEW_API_CONFIG)
}

/**
 * 面试统一 SSE 流（唯一写入口）
 * POST /api/interviews/:id/stream
 *
 * 行为由 interview_session.status 自动路由，评价统一在结束后批量推送：
 * - pending_questions → 开始面试：question_start → question*（逐 token）→ question_done
 * - in_progress + content → 答题：question_start → question* → question_done（直接下一题，无评价）
 * - 最后一题答完 / finishOnly=true → 结束：evaluation_start → evaluation_done（逐题批量评价）→ summary_start → summary* → done
 * - finished → error 事件
 *
 * 所有错误（含 HTTP 404）都以 error 事件推送，前端收到后 throw new Error 终止迭代。
 *
 * @param interviewId 面试会话 ID
 * @param data 统一流 DTO（开始时可空对象，答题传 content，提前结束传 finishOnly: true）
 * @yields 面试 SSE 事件对象（按 event 字段判别处理）
 */
export async function* interviewStreamApi(
  interviewId: string,
  data: InterviewStreamDto = {},
): AsyncGenerator<InterviewSseEvent, void, unknown> {
  for await (const event of fetchSseEvents(
    `/interviews/${interviewId}/stream`,
    data,
    { errorPrefix: '面试请求失败' },
  )) {
    yield event as InterviewSseEvent
  }
}

/**
 * 面试列表（offset 分页，按最近活跃倒序，排除已删除）
 * @param params 页码 / 每页条数
 * @returns 面试列表与分页信息
 */
export function listInterviewsApi(params?: InterviewListParams) {
  return get<InterviewListResult>('/interviews', params)
}

/**
 * 面试详情（含所有题目 / 回答 / 评价 + 总结评分）
 * @param interviewId 面试会话 ID
 * @returns 面试详情
 */
export function getInterviewDetailApi(interviewId: string) {
  return get<InterviewDetail>(`/interviews/${interviewId}`)
}

/**
 * 删除面试（软删除，仅标记不物理清除）
 * @param interviewId 面试会话 ID
 * @returns 删除结果
 */
export function deleteInterviewApi(interviewId: string) {
  return del<{ success: true }>(`/interviews/${interviewId}`)
}

export default {
  createInterviewApi,
  interviewStreamApi,
  listInterviewsApi,
  getInterviewDetailApi,
  deleteInterviewApi,
}
