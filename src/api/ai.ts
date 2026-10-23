import type {
  GrammarCheckParams,
  GrammarCheckResult,
  JobMatchDto,
  JobMatchResult,
  ResumeScoreResult,
  ScoreParams,
  SelfIntroDto,
} from '@/types/ai'
import { AI_TIMEOUT, post } from '@/utils/request'
import { streamSse } from '@/utils/ai-sse-util.ts'

const AI_API_CONFIG = {
  timeout: AI_TIMEOUT,
}

/**
 * 流式pdf转stream
 * @param params
 */
export async function* pdfToJsonStreamApi(params: {
  pdfText: string
  signal?: AbortSignal
}): AsyncGenerator<string, void, unknown> {
  yield* streamSse('/ai/pdf-to-json/stream', params, params.signal)
}

/**
 * AI 自我介绍
 * @param params - 简历纯文本与生成选项（场景/时长/语气）
 * @yields 文本增量片段
 */
export async function selfIntroApi(params: SelfIntroDto) {
  return post<{ content: string }>('/ai/self-intro', params, AI_API_CONFIG)
}

/**
 * 语法检查
 * @param params - 待检查的文本
 * @returns 语法问题列表，每项包含原文、建议与说明
 */
export function grammarCheckApi(
  params: GrammarCheckParams,
): Promise<GrammarCheckResult> {
  return post<GrammarCheckResult>('/ai/grammar-check', params, AI_API_CONFIG)
}

/**
 * 简历评分
 * @param params - 完整简历数据
 * @returns 总分、分维度评分与优化建议
 */
export function scoreResumeApi(
  params: ScoreParams,
): Promise<ResumeScoreResult> {
  return post<ResumeScoreResult>('/ai/resume-score', params, AI_API_CONFIG)
}

/**
 * 岗位匹配分析
 * @param params
 * @returns
 */
export function jobMatchApi(params: JobMatchDto): Promise<JobMatchResult> {
  return post<JobMatchResult>('/ai/job-match', params, AI_API_CONFIG)
}

/**
 * 测试连接
 * @returns
 */
export function testConnectionApi(providerId: string) {
  return post(
    '/ai/test-connection',
    { providerId },
    {
      timeout: AI_TIMEOUT,
    },
  )
}

export default {
  grammarCheckApi,
  scoreResumeApi,
  jobMatchApi,
  selfIntroApi,
  pdfToJsonStreamApi,
  testConnectionApi,
}
