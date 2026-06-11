import { pdfToJsonWithAI } from '@/utils/aiAPIConnect'
import {
  getDocument,
  GlobalWorkerOptions,
} from 'pdfjs-dist/legacy/build/pdf.mjs'
import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = pdfjsWorker

export async function importPDF(file: File) {
  const pdfText = await pdfToText(file)
  const pdfJson = await pdfToJsonWithAI(pdfText)
  return pdfJson
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fullText += content.items.map((item: any) => item.str).join(' ') + '\n'
  }

  return fullText.trim()
}
