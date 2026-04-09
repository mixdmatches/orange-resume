<script setup lang="ts">
import html2canvas from 'html2canvas'
import jsPDF, { type RGBAData } from 'jspdf'
import LineMdArrowSmallLeft from '~icons/line-md/arrow-small-left'
import LineMdArrowCloseDown from '~icons/line-md/arrow-close-down'
import LineMdArrowsHorizontal from '~icons/line-md/arrows-horizontal'
import { DownOutlined } from '@ant-design/icons-vue'
import ThemeIcon from '@/components/ThemeIcon.vue'
import { inject } from 'vue'
import type { Resume } from '@/types/resume'
const resume: Resume = inject('resume') as Resume

const handleDownloadJson = () => {
  const json = JSON.stringify(resume)
  const blob = new Blob([json], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${resume.title}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

// 将元素转化为canvas元素
// 通过 放大 提高清晰度
// width为内容宽度
async function toCanvas(element: HTMLElement) {
  if (!element) return { width: 0, height: 0 }

  // canvas元素
  const canvas = await html2canvas(element, {
    scale: window.devicePixelRatio * 2, // 增加清晰度
    useCORS: true, // 允许跨域
  })

  // 获取canvas转化后的宽高
  const { width: canvasWidth, height: canvasHeight } = canvas

  // 转化成图片Data
  const canvasData = canvas.toDataURL('image/jpeg', 1.0)

  return { width: canvasWidth, height: canvasHeight, data: canvasData }
}

/**
 * 生成pdf(A4多页pdf截断问题， 包括页眉、页脚 和 上下左右留空的护理)
 */
async function generatePDF({
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

const handleDownloadPDF = async () => {
  await generatePDF({
    element: document.querySelector('.preview-wrapper')!,
    filename: `${resume.title}.pdf`,
  })
}
</script>

<template>
  <div class="tool-head">
    <div class="tool-head-left">
      <line-md-arrow-small-left @click="$router.back()" />
      <a-input v-model:value="resume.title" class="title"></a-input>
    </div>
    <div class="tools">
      <a-tooltip title="切换模板">
        <a-button><line-md-arrows-horizontal /></a-button>
      </a-tooltip>
      <a-dropdown>
        <a-button type="primary" class="tool-download">
          <line-md-arrow-close-down style="margin-right: 0.2rem" />
          导出<DownOutlined
        /></a-button>
        <template #overlay>
          <a-menu>
            <a-menu-item @click="handleDownloadPDF"> PDF </a-menu-item>
            <a-menu-item @click="handleDownloadJson"> JSON配置 </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
      <theme-icon></theme-icon>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tool-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: $site-header-height;
  line-height: $site-header-height;
  padding: 1rem 2rem;
  font-size: 2rem;
  border-bottom: 1px solid;
  @include themify(
    (
      color: $text-color,
      background-color: $bg-color,
      border-color: $border-color-mode,
    )
  );
  &-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .tools {
    display: flex;
    gap: 2rem;
    .tool-download {
      display: flex;
      align-items: center;
    }
  }
}
</style>
