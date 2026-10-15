import { pdfToText } from '@/utils/importPDF'
import type { FileType } from 'ant-design-vue/es/upload/interface'
import mammoth from 'mammoth'

export async function extractFileText(file: FileType): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''

  if (['txt', 'md', 'json'].includes(ext)) {
    return file.text()
  }

  if (ext === 'pdf') {
    return pdfToText(file)
  }

  if (ext === 'docx') {
    const { value } = await mammoth.extractRawText({
      arrayBuffer: await file.arrayBuffer(),
    })
    return value
  }

  throw new Error(`暂不支持的文件格式：.${ext}`)
}
