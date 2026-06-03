<script setup lang="ts">
import LineMdArrowSmallLeft from '~icons/line-md/arrow-small-left'
import LineMdArrowCloseDown from '~icons/line-md/arrow-close-down'
import LineMdArrowsHorizontal from '~icons/line-md/arrows-horizontal'
import { DownOutlined } from '@ant-design/icons-vue'
import { exportResumeToBrowserPrint } from '@/utils/print'
import ThemeIcon from '@/components/ThemeIcon.vue'
import { inject, ref } from 'vue'
import type { Resume } from '@/types/resume'
import templates from '@/template'
import previewImage from '@/assets/images/classic.fcafadcb.svg'

// const resumeMode = defineModel('resumeMode', {
//   type: String,
//   default: 'edit',
// })

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

const drawerOpen = ref(false)

const handleChangeTemplate = () => {
  drawerOpen.value = true
}

const afterOpenChange = (open: boolean) => {
  drawerOpen.value = open
}
</script>

<template>
  <div class="tool-head">
    <div class="tool-head-left">
      <line-md-arrow-small-left @click="$router.back()" />
      <a-input v-model:value="resume.title" class="title"></a-input>
      <!-- <div class="tool-mode">
        <span
          :class="{ active: resumeMode === 'edit' }"
          @click="resumeMode = 'edit'"
          >编辑简历</span
        >
        <span
          :class="{ active: resumeMode === 'interview' }"
          @click="resumeMode = 'interview'"
          >模拟面试</span
        >
      </div> -->
    </div>
    <div class="tools">
      <a-tooltip title="切换模板">
        <a-button @click="handleChangeTemplate"
          ><line-md-arrows-horizontal
        /></a-button>
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
  <a-drawer
    v-model:open="drawerOpen"
    class="custom-class"
    root-class-name="root-class-name"
    :root-style="{ color: 'blue' }"
    title="选择模板"
    width="700px"
    placement="left"
    @after-open-change="afterOpenChange"
  >
    <a-radio-group
      v-model:value="resume.templateId"
      @change="handleChangeTemplate"
    >
      <div class="template-container">
        <div
          v-for="template in templates"
          :key="template.id"
          class="template-box"
        >
          <img :src="previewImage" alt="" />
          <a-radio :value="template.id">{{ template.name }}</a-radio>
        </div>
      </div>
    </a-radio-group>
  </a-drawer>
</template>

<style scoped lang="scss">
.tool-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: $site-header-height;
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
    .tool-mode {
      display: flex;
      gap: 1rem;
      span {
        padding: 4px 6px;
        border-radius: 4px;
        font-size: 1.4rem;
        cursor: pointer;
        text-wrap: nowrap;
        &.active {
          // color: $primary-color;
          @include themify(
            (
              background-color: $layout-bg-color,
            )
          );
        }
      }
    }
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
.template-container {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  .template-box {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    border-radius: 10px;
    border: 1px solid $border-color;
    padding: 10px;
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 10px;
    }
  }
}
</style>
