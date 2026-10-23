import { reactive } from 'vue'
import { pdfToJsonStreamApi } from '@/api'
import { DEFAULT_RESUME } from '@/config/init-resume-data'
import type { Resume } from '@/types/resume'
import { generateUUID } from '@/utils/uuid'
import { repairJson } from '@/utils/repairJson'
import {
  getDocument,
  GlobalWorkerOptions,
} from 'pdfjs-dist/legacy/build/pdf.mjs'
import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = pdfjsWorker

/** 流式导入进度 */
export interface ImportPDFProgress {
  stage: 'extract' | 'stream'
  /** SSE 已累计接收的字符数 */
  receivedChars: number
  /** 已渐进解析出的顶层字段数 */
  parsedFields: number
  /** 连续解析失败过多，已降级为全量等待 */
  degraded: boolean
  /** 最新解析出的简历快照 */
  snapshot: Resume | null
}

/** 进度回调 */
// eslint-disable-next-line no-unused-vars
export type ImportPDFProgressHandler = (progress: ImportPDFProgress) => void

/** 流式导入选项 */
export interface ImportPDFOptions {
  onProgress?: ImportPDFProgressHandler
  signal?: AbortSignal
}

/** 进度回调节流间隔，避免高频刷新阻塞主线程 */
const STREAM_THROTTLE_MS = 100
/** 连续解析失败次数上限，超过则停止渐进解析，等待流结束后再全量处理 */
const MAX_CONSECUTIVE_PARSE_FAILS = 3

/**
 * 构建空白简历底稿：结构齐全但内容为空，避免默认样例数据残留到导入结果
 * @param draftId 底稿 id（整次导入复用，保证预览与最终入库数据一致）
 */
function blankResumeDraft(draftId: string): Resume {
  const draft = JSON.parse(JSON.stringify(DEFAULT_RESUME)) as Resume
  draft.id = draftId
  draft.title = ''
  draft.basic = {
    ...draft.basic,
    name: '',
    position: '',
    phone: '',
    email: '',
    address: '',
    photo: '',
  }
  draft.educations = []
  draft.internships = []
  draft.projects = []
  draft.skills = ''
  draft.customData = {}
  return draft
}

/**
 * 将（可能不完整的）解析结果原地合并进响应式底稿，供预览渲染与最终入库
 * @param parsed AI 解析出的部分/完整简历数据
 * @param base 响应式空白底稿
 */
function mergeResume(parsed: Partial<Resume> | null, base: Resume): Resume {
  if (!parsed) return base
  const patch = { ...parsed }
  // id 与模板强制取底稿值，防止 AI 返回的脏值进入数据流
  delete patch.id
  delete patch.templateId
  const basic = patch.basic
  delete patch.basic
  const customData = patch.customData
  delete patch.customData
  Object.assign(base, patch)
  // basic/customData 浅合并，防止 AI 局部字段覆盖丢失 photoConfig 等子字段
  if (basic) Object.assign(base.basic, basic)
  if (customData) Object.assign(base.customData, customData)
  return base
}

/**
 * 去除 markdown 代码围栏（流式累积中会被反复调用，必须幂等）
 * @param text 累积的原始文本
 */
function stripMarkdownFences(text: string): string {
  let s = text.trim()
  s = s.replace(/^```(?:json)?\s*/i, '')
  s = s.replace(/\s*```$/, '')
  return s.trim()
}

/**
 * 解析 Resume JSON 文本：优先原样解析，失败则走 repairJson 修复
 * @param raw 原始文本（可能含 markdown 围栏/截断）
 * @returns 解析成功返回 Resume，失败返回 null
 */
function parseResumeJson(raw: string): Partial<Resume> | null {
  const text = stripMarkdownFences(raw)
  if (!text) return null
  try {
    return JSON.parse(text) as Partial<Resume>
  } catch {
    /* 未完整，尝试修复 */
  }
  try {
    return JSON.parse(repairJson(text)) as Partial<Resume>
  } catch {
    return null
  }
}

/**
 * 统计已识别字段数（顶层非空字段）
 * @param resume 渐进解析出的部分简历
 */
function countParsedFields(resume: Partial<Resume> | null): number {
  if (!resume) return 0
  return Object.values(resume).filter(
    v => v !== null && v !== undefined && v !== '',
  ).length
}

/**
 * 将响应式底稿深拷贝为纯 JSON 数据
 */
function toPlainResume(resume: Resume): Resume {
  return JSON.parse(JSON.stringify(resume))
}

/**
 * 导入 PDF：提取文字后走 SSE 流式 AI 解析，渐进解析并节流上报进度与简历快照
 * 结束/中止/出错时优先全量解析，失败则回退已解析的部分结果
 * @param file PDF 文件
 * @param opts 进度回调与外部中止信号
 * @returns 完整简历（部分结果已与空白底稿合并补全）
 */
export async function importPDF(
  file: File,
  opts?: ImportPDFOptions,
): Promise<Resume> {
  // 底稿做成深层响应式对象：整个导入期间引用不变，内容随流原地生长
  const draft = reactive(blankResumeDraft(generateUUID().substring(0, 8)))
  const emit = (p: ImportPDFProgress) => opts?.onProgress?.(p)
  emit({
    stage: 'extract',
    receivedChars: 0,
    parsedFields: 0,
    degraded: false,
    snapshot: null,
  })

  const pdfText = await pdfToText(file)

  // 内部控制器：承载用户主动停止
  const controller = new AbortController()
  if (opts?.signal) {
    if (opts.signal.aborted) controller.abort()
    else
      opts.signal.addEventListener('abort', () => controller.abort(), {
        once: true,
      })
  }

  let buffer = ''
  let bestPartial: Partial<Resume> | null = null
  let consecutiveFails = 0
  let degraded = false
  let lastEmitAt = 0

  try {
    for await (const chunk of pdfToJsonStreamApi({
      pdfText,
      signal: controller.signal,
    })) {
      buffer += chunk
      // 节流：100ms 内最多解析并上报一次
      const now = Date.now()
      if (now - lastEmitAt < STREAM_THROTTLE_MS) continue
      lastEmitAt = now
      // 已降级则不再尝试渐进解析，仅上报接收进度
      if (!degraded) {
        const parsed = parseResumeJson(buffer)

        if (parsed) {
          bestPartial = parsed
          // 原地写入底稿：快照引用不变，白纸内容随流实时生长
          mergeResume(parsed, draft)

          consecutiveFails = 0
        } else if (++consecutiveFails >= MAX_CONSECUTIVE_PARSE_FAILS) {
          degraded = true
        }
      }
      emit({
        stage: 'stream',
        receivedChars: buffer.length,
        parsedFields: countParsedFields(bestPartial),
        degraded,
        snapshot: bestPartial ? draft : null,
      })
    }

    // 流正常结束：优先全量解析，失败回退部分结果
    const finalParsed = parseResumeJson(buffer) ?? bestPartial
    if (finalParsed) return toPlainResume(mergeResume(finalParsed, draft))
    throw new Error('AI 解析结果为空，请重试')
  } catch (error) {
    // 中止/出错：仍尝试用已接收内容兜底解析，尽量保留结果
    const finalParsed = parseResumeJson(buffer) ?? bestPartial
    if (finalParsed) return toPlainResume(mergeResume(finalParsed, draft))
    if (controller.signal.aborted) throw new Error('已停止解析')
    throw error
  }
}

/**
 * pdf转text文字
 */
export async function pdfToText(file: File) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await getDocument({ data: arrayBuffer }).promise

  let fullText = ''
  const numPages = pdf.numPages || 0

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    // 按 hasEOL 还原换行结构，避免全文挤成一行影响 AI 理解
    const pageText = content.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => (item.hasEOL ? `${item.str}\n` : item.str))
      .join(' ')
    fullText += pageText + '\n'
  }

  // 压缩冗余空白，减少送入 AI 的无效 token，缩短模型 prefill 耗时
  const text = fullText
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  if (!text) {
    throw new Error(
      '该 PDF 没有可提取的文字（可能是扫描件或图片转的 PDF），请换用文字版 PDF',
    )
  }
  return text
}
