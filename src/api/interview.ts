import { fetchSseEvents } from '@/api/ai'
import type {
  CreateInterviewDto,
  InterviewDetail,
  InterviewListParams,
  InterviewListResult,
  InterviewSession,
  InterviewSseEvent,
  InterviewStreamDto,
} from '@/types/interview'
import { AI_TIMEOUT, del, get, post } from '@/utils/request'

/** 非流式 AI 接口超时配置（题库生成 / 总结评分等 LLM 长耗时操作） */
const INTERVIEW_API_CONFIG = {
  timeout: AI_TIMEOUT,
}

/** 创建面试会话 */
export function createInterviewApi(data: CreateInterviewDto) {
  return post<InterviewSession>('/interviews', data, INTERVIEW_API_CONFIG)
}

export async function* interviewStreamApi(
  interviewId: string,
  data: InterviewStreamDto = {},
  signal?: AbortSignal,
): AsyncGenerator<InterviewSseEvent, void, unknown> {
  for await (const event of fetchSseEvents(
    `/interviews/${interviewId}/stream`,
    data,
    { errorPrefix: '面试请求失败', signal },
  )) {
    yield event as InterviewSseEvent
  }
}

/**
 * 开始面试
 * @param interviewId
 * @param data
 * @param signal
 */
export async function* interviewStartApi(
  interviewId: string,
  data: InterviewStreamDto = {},
  signal?: AbortSignal,
): AsyncGenerator<InterviewSseEvent, void, unknown> {
  for await (const event of fetchSseEvents(
    `/interviews/${interviewId}/start`,
    data,
    { errorPrefix: '面试请求失败', signal },
  )) {
    yield event as InterviewSseEvent
  }
}

/**
 * 提交用户回答
 * @param interviewId
 * @param data
 * @param signal
 */
export async function* interviewAnswerApi(
  interviewId: string,
  data: InterviewStreamDto = {},
  signal?: AbortSignal,
): AsyncGenerator<InterviewSseEvent, void, unknown> {
  for await (const event of fetchSseEvents(
    `/interviews/${interviewId}/answer`,
    data,
    { errorPrefix: '提交用户回答失败', signal },
  )) {
    yield event as InterviewSseEvent
  }
}

/**
 * 提前结束面试
 * @param interviewId
 * @param data
 * @param signal
 */
export async function* interviewFinishApi(
  interviewId: string,
  data: InterviewStreamDto = {},
  signal?: AbortSignal,
): AsyncGenerator<InterviewSseEvent, void, unknown> {
  for await (const event of fetchSseEvents(
    `/interviews/${interviewId}/finish`,
    data,
    { errorPrefix: '提前结束面试失败', signal },
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
  interviewStartApi,
  interviewAnswerApi,
  interviewFinishApi,
}
