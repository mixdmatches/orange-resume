<script setup lang="ts">
import LineMdArrowSmallLeft from '~icons/line-md/arrow-small-left'
import LineMdArrowCloseDown from '~icons/line-md/arrow-close-down'
import LineMdArrowsHorizontal from '~icons/line-md/arrows-horizontal'
import { DownOutlined } from '@ant-design/icons-vue'
import { exportResumeToBrowserPrint } from '@/utils/print'
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

const handleDownloadPDF = async () => {
  await exportResumeToBrowserPrint(
    document.querySelector('.preview-wrapper')!,
    resume.globalConfiguration.basePagePadding,
  )
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
