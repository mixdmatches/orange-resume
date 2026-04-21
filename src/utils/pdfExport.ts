import html2canvas from 'html2canvas'
import jsPDF, { type RGBAData } from 'jspdf'
// 将元素转化为canvas元素
// 通过 放大 提高清晰度
// width为内容宽度
async function toCanvas(element: HTMLElement) {
  if (!element) return { width: 0, height: 0 }

  // 保存原始样式
  const originalHeight = element.style.height
  const originalOverflow = element.style.overflow

  // 临时设置元素高度为自动，确保所有内容都可见
  element.style.height = 'auto'
  element.style.overflow = 'visible'

  // 隐藏分页标识元素
  const pageBreaks = element.querySelectorAll('.page-break')
  const pageBreakDisplays: string[] = []
  pageBreaks.forEach(pb => {
    pageBreakDisplays.push((pb as HTMLElement).style.display || '')
    ;(pb as HTMLElement).style.display = 'none'
  })

  // canvas元素
  const canvas = await html2canvas(element, {
    scale: 4, // 增加清晰度
    useCORS: true, // 允许跨域
    scrollY: 0, // 从顶部开始截图
    scrollX: 0,
    logging: false,
    backgroundColor: '#ffffff',
  })

  // 恢复分页标识元素的显示
  pageBreaks.forEach((pb, index) => {
    ;(pb as HTMLElement).style.display = pageBreakDisplays[index]
  })

  // 恢复原始样式
  element.style.height = originalHeight
  element.style.overflow = originalOverflow

  // 获取canvas转化后的宽高
  const { width: canvasWidth, height: canvasHeight } = canvas

  // 转化成图片Data
  const canvasData = canvas.toDataURL('image/jpeg', 1.0)

  return { width: canvasWidth, height: canvasHeight, data: canvasData }
}

/**
 * 生成pdf(A4多页pdf截断问题， 包括页眉、页脚 和 上下左右留空的护理)
 */
export async function generatePDF({
  element,
  filename,
}: {
  element: HTMLElement
  filename: string
}) {
  if (!(element instanceof HTMLElement)) {
    return
  }

  // 一页的高度， 转换宽度为一页元素的宽度
  const {
    width: imageWidth,
    height: imageHeight,
    data,
  } = await toCanvas(element)
  // 计算 PDF 的比例
  const pdfWidth = 210 // A4 宽度（mm）
  const pdfHeight = (pdfWidth / imageWidth) * imageHeight

  const pdf = new jsPDF()

  // 添加图片
  function addImage(
    _x: number,
    _y: number,
    pdfInstance: jsPDF,
    base_data:
      | string
      | HTMLImageElement
      | HTMLCanvasElement
      | Uint8Array
      | RGBAData,
    _width: number,
    _height: number,
  ) {
    pdfInstance.addImage(base_data, 'JPEG', _x, _y, _width, _height)
  }

  addImage(0, 0, pdf, data!, pdfWidth, pdfHeight)

  return pdf.save(filename)
}
