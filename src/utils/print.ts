/* eslint-disable no-console */
import { getFontFaceCss, normalizeFontFamily } from '@/utils/fonts'

export const exportResumeToBrowserPrint = async (
  resumeContent: HTMLElement | null,
  pagePadding: number,
  fontFamily?: string,
) => {
  // 参数校验：确保传入的 DOM 元素有效
  if (!resumeContent) {
    console.error('[print] resumeContent 为空，无法导出')
    throw new Error('预览区域未加载完成')
  }

  console.log('[print] 开始导出 PDF，fontFamily =', fontFamily)
  const printFrame = document.createElement('iframe')
  printFrame.style.position = 'absolute'
  printFrame.style.width = '1px'
  printFrame.style.height = '1px'
  printFrame.style.left = '-9999px'
  printFrame.style.top = '0'
  printFrame.style.visibility = 'hidden'
  printFrame.style.zIndex = '-1'
  document.body.appendChild(printFrame)

  const iframeWindow = printFrame.contentWindow
  if (!iframeWindow) {
    console.error('IFrame window not found')
    document.body.removeChild(printFrame)
    return
  }

  try {
    iframeWindow.document.open()

    const clonedContent = resumeContent.cloneNode(true) as HTMLElement
    const selectedFontFamily = normalizeFontFamily(fontFamily)
    const originalPreviewCard = resumeContent.querySelector(
      '.preview-card',
    ) as HTMLElement | null
    const clonedPreviewCard = clonedContent.querySelector(
      '.preview-card',
    ) as HTMLElement | null
    const scaleTarget = clonedPreviewCard || clonedContent

    // 获取 transform 值：优先使用内联样式，回退到计算样式
    let transformValue = scaleTarget.style.transform || ''
    if (!transformValue && originalPreviewCard) {
      const computedTransform =
        window.getComputedStyle(originalPreviewCard).transform
      transformValue = computedTransform === 'none' ? '' : computedTransform
    }

    // 解析缩放值：支持 scale(x) 和 matrix(a,0,0,d,0,0) 两种格式
    // getComputedStyle 返回的是 matrix 格式，纯 scale(x) 正则无法匹配
    let scale = 1
    const scaleMatch = transformValue.match(/scale\(([\d.]+)\)/)
    const matrixMatch = transformValue.match(
      /matrix\(([\d.]+),\s*[-\d.]+,\s*[-\d.]+,\s*([\d.]+),\s*[-\d.]+,\s*[-\d.]+\)/,
    )

    if (scaleMatch) {
      scale = Number(scaleMatch[1])
    } else if (matrixMatch) {
      scale = Number(matrixMatch[1])
    }

    if (Number.isFinite(scale) && scale > 0 && scale < 1) {
      // 打印时使用 zoom 参与分页布局计算，比 transform 更接近最终分页效果
      scaleTarget.style.removeProperty('transform')
      scaleTarget.style.removeProperty('transform-origin')
      scaleTarget.style.setProperty('width', '100%')
      scaleTarget.style.setProperty('zoom', String(scale))
    }

    clonedContent.style.setProperty(
      'font-family',
      selectedFontFamily,
      'important',
    )
    // 使用 inline=true 将字体转 base64 内联，确保 PDF 导出时字体不丢失
    // fonts.ts 已做降级保护：inline 失败会自动回退到 URL 引用，不会中断流程
    let fontFaceStyles: string
    try {
      fontFaceStyles = await getFontFaceCss(selectedFontFamily, true)
      console.log('[print] 字体样式加载成功')
    } catch (fontError) {
      console.error('[print] 字体样式加载失败，使用空样式继续：', fontError)
      fontFaceStyles = ''
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Resume</title>
          <style>
            ${fontFaceStyles}

            @page {
              size: A4;
              margin: 0;
              padding: 0;
            }
            * {
              box-sizing: border-box;
            }
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              background: white !important;
              height: auto !important;
              overflow: visible !important;
            }
            body {
              font-family: ${selectedFontFamily};
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .preview-card {
              margin: 0 !important;
              padding: ${pagePadding}px !important;
              -webkit-box-decoration-break: clone;
              box-decoration-break: clone;
              font-family: ${selectedFontFamily} !important;
              background: white !important;
            }

            #print-content {
              width: 210mm;
              margin: 0 auto;
              padding: 0;
              background: white;
              box-shadow: none;
            }
            #print-content * {
              box-shadow: none !important;
            }

            .preview-card .min-h-screen,
            .preview-card .min-h-full,
            .preview-card [style*="min-height"] {
              min-height: 0 !important;
            }
            
            .preview-card .page-break {
              display: none !important;
            }

            ${Array.from(document.styleSheets)
              .map(sheet => {
                try {
                  return Array.from(sheet.cssRules)
                    .map(rule => rule.cssText)
                    .join('\n')
                } catch (e) {
                  console.warn('Could not copy styles from sheet:', e)
                  return ''
                }
              })
              .join('\n')}
          </style>
        </head>
        <body>
          <div id="print-content">
            ${clonedContent.outerHTML}
          </div>
        </body>
      </html>
    `

    iframeWindow.document.write(htmlContent)
    iframeWindow.document.close()

    const printWhenReady = async () => {
      try {
        const doc = iframeWindow.document
        console.log('[print] 等待 iframe 资源就绪')

        // 等待字体加载，设置 5 秒超时防止线上字体加载失败导致无限挂起
        const fontReadyPromise = doc.fonts?.ready
          ? doc.fonts.ready
          : Promise.resolve()
        const fontTimeoutPromise = new Promise<void>(resolve =>
          setTimeout(() => {
            console.warn('[print] 字体加载超时（5s），继续执行打印')
            resolve()
          }, 5000),
        )
        await Promise.race([fontReadyPromise, fontTimeoutPromise])

        // 等待所有图片加载完成，设置 3 秒超时
        const images = Array.from(doc.images)
        const imageLoadPromises = images
          .filter(img => !img.complete)
          .map(
            img =>
              new Promise<void>(resolve => {
                img.onload = () => resolve()
                img.onerror = () => resolve()
              }),
          )
        if (imageLoadPromises.length > 0) {
          await Promise.race([
            Promise.all(imageLoadPromises),
            new Promise<void>(resolve =>
              setTimeout(() => {
                console.warn('[print] 图片加载超时（3s），继续执行打印')
                resolve()
              }, 3000),
            ),
          ])
        }

        // 给予额外的渲染帧缓冲
        await new Promise<void>(resolve => {
          iframeWindow.requestAnimationFrame(() => {
            iframeWindow.requestAnimationFrame(() => resolve())
          })
        })

        console.log('[print] 资源就绪，调用 window.print()')
        iframeWindow.focus()
        // 使用 try-catch 保护 print 调用，某些浏览器扩展（如沉浸式翻译）可能干扰
        try {
          iframeWindow.print()
          console.log('[print] print() 调用完成')
        } catch (printError) {
          console.error('[print] iframe.print() 抛出异常：', printError)
          throw printError
        }

        // 打印完成后清理iframe
        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame)
          }
        }, 1000)
      } catch (error) {
        console.error('[print] 打印流程出错：', error)
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame)
        }
        // 重新抛出，让上层 handleDownloadPDF 的 catch 能捕获并提示用户
        throw error
      }
    }

    // 使用 await 而非 void，确保 printWhenReady 内部的错误能被外层 catch 捕获
    // 进而传播到 handleDownloadPDF 的 try-catch，给用户可见的错误提示
    await printWhenReady()
  } catch (error) {
    console.error('[print] 导出流程出错：', error)
    if (document.body.contains(printFrame)) {
      document.body.removeChild(printFrame)
    }
    // 重新抛出，让上层 handleDownloadPDF 能捕获并提示用户
    throw error
  }
}
