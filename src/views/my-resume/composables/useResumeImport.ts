import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { createResume } from '@/service/resumeRepository'
import type { Resume } from '@/types/resume'
import { importPDF } from '@/utils/importPDF'
import type { SseRetryInfo } from '@/utils/ai-sse-util.ts'

/** 文件选中后的处理回调 */
// eslint-disable-next-line no-unused-vars
type ImportFileHandler = (file: File) => Promise<void>

/**
 * 简历导入：JSON 配置文件导入 / PDF 文件 AI 流式解析导入
 * @param options.refresh - 导入成功后刷新简历列表
 * @param options.closeModal - 导入流程结束（无论成败）后关闭导入弹窗
 */
export const useResumeImport = (options: {
  refresh: () => Promise<void> | void
  closeModal: () => void
}) => {
  const { refresh, closeModal } = options

  const importLoading = ref(false)
  const importProgressText = ref('')
  const pdfAbortController = ref<AbortController | null>(null)
  /** PDF 流式解析中的简历快照，驱动白纸实时生长预览 */
  const importSnapshot = ref<Resume | null>(null)
  /** PDF 导入重试状态 */
  const importRetryInfo = ref<SseRetryInfo | null>(null)

  /**
   * 创建隐藏的文件选择框，选中文件后交给 onFile 处理，
   * 流程结束后统一清理 DOM / loading 并关闭弹窗
   */
  const pickFile = (accept: string, onFile: ImportFileHandler) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.style.display = 'none'
    document.body.appendChild(input)

    const handleChange = async (e: Event) => {
      const file = (e.target as HTMLInputElement)?.files?.[0]
      if (!file) return
      try {
        await onFile(file)
      } finally {
        input.removeEventListener('change', handleChange)
        document.body.removeChild(input)
        importLoading.value = false
        closeModal()
      }
    }

    input.addEventListener('change', handleChange)
    input.click()
  }

  /**
   * 导入JSON配置
   */
  const handleImportJSON = () => {
    pickFile('.json', async file => {
      importLoading.value = true
      try {
        const text = await file.text()
        const resume = JSON.parse(text)

        if (!resume.title || !resume.globalConfiguration) {
          throw new Error('无效的简历配置文件')
        }

        await createResume(resume)
        await refresh()
        message.success('导入配置成功')
      } catch (error) {
        console.error('导入配置失败', error)
        message.error(error instanceof Error ? error.message : '导入配置失败')
      }
    })
  }

  /**
   * 停止当前 PDF 流式解析
   */
  const handleStopImportPDF = () => {
    pdfAbortController.value?.abort()
  }

  /**
   * 导入PDF配置（SSE 流式 AI 解析，渐进显示识别进度）
   */
  const handleImportPDF = () => {
    pickFile('.pdf', async file => {
      importLoading.value = true
      importProgressText.value = '正在提取 PDF 文字...'
      const controller = new AbortController()
      pdfAbortController.value = controller
      try {
        const resume = await importPDF(file, {
          signal: controller.signal,
          onProgress: progress => {
            if (progress.stage === 'extract') {
              importProgressText.value = '正在提取 PDF 文字...'
            } else {
              importProgressText.value = progress.degraded
                ? 'AI 解析中（结果较大，等待完整生成）...'
                : `AI 解析中 · 已识别 ${progress.parsedFields} 个字段`
            }
            if (progress.snapshot) {
              importSnapshot.value = progress.snapshot
            }
          },
          onRetry: info => {
            importRetryInfo.value = info
            importProgressText.value = `网络波动，正在第 ${info.retryCount} 次重试...`
          },
        })
        resume.title = 'Ai解析简历导入'
        await createResume(resume)
        await refresh()
        message.success('PDF 导入成功')
      } catch (error) {
        console.error('PDF 导入失败', error)
        const errMsg = error instanceof Error ? error.message : 'PDF 导入失败'
        // 用户主动停止不算失败，用 warning 提示
        if (errMsg === '已停止解析') {
          message.warning('已停止解析')
        } else {
          message.error(errMsg)
        }
      } finally {
        pdfAbortController.value = null
        importSnapshot.value = null
        importRetryInfo.value = null
        importProgressText.value = ''
      }
    })
  }

  return {
    importLoading,
    importProgressText,
    pdfAbortController,
    importSnapshot,
    importRetryInfo,
    handleImportJSON,
    handleImportPDF,
    handleStopImportPDF,
  }
}
