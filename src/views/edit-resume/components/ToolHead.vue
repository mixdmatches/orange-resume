<script setup lang="ts">
import LineMdArrowSmallLeft from '~icons/line-md/arrow-small-left'
import LineMdArrowCloseDown from '~icons/line-md/arrow-close-down'
import LineMdArrowsHorizontal from '~icons/line-md/arrows-horizontal'
import {
  DownOutlined,
  UndoOutlined,
  RedoOutlined,
  BarChartOutlined,
  RobotOutlined,
} from '@ant-design/icons-vue'
import { exportResumeToBrowserPrint } from '@/utils/print'
import ThemeIcon from '@/components/ThemeIcon.vue'
import ResumeAnalysis from './ResumeAnalysis.vue'
import AiAssistant from './AiAssistant.vue'
import GrammarCheck from './GrammarCheck.vue'
import SelfIntro from './SelfIntro.vue'
import JobMatch from './JobMatch.vue'
import { message } from 'ant-design-vue'
import { inject, ref } from 'vue'
import type { Resume } from '@/types/resume'
import templates from '@/template'
import previewImage from '@/assets/images/classic.fcafadcb.svg'
import { resumeToMarkdown } from '@/utils/markdownConverter'

const props = defineProps<{
  canUndo: boolean
  canRedo: boolean
}>()

const emit = defineEmits<{
  (e: 'undo'): void
  (e: 'redo'): void
}>()

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
  const previewWrapper = document.querySelector(
    '.preview-wrapper',
  ) as HTMLElement
  if (!previewWrapper) {
    message.error('预览区域未加载完成，请稍候再试')
    return
  }
  try {
    const pagePadding = resume.globalConfiguration.basePagePadding
    const fontFamily = resume.globalConfiguration.fontFamily
    await exportResumeToBrowserPrint(previewWrapper, pagePadding, fontFamily)
  } catch (error) {
    console.error('导出 PDF 失败：', error)
    message.error('导出 PDF 失败，请查看控制台或重试')
  }
}

const handleDownloadMarkdown = () => {
  const markdown = resumeToMarkdown(resume)
  const blob = new Blob([markdown], { type: 'text/markdown' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${resume.title}.md`
  a.click()
  URL.revokeObjectURL(a.href)
}

const drawerOpen = ref(false)

const handleChangeTemplate = () => {
  drawerOpen.value = true
}

const afterOpenChange = (open: boolean) => {
  drawerOpen.value = open
}

/** 数据分析抽屉开关 */
const analysisDrawerOpen = ref(false)

/** 打开简历数据分析抽屉 */
const handleOpenAnalysis = () => {
  analysisDrawerOpen.value = true
}

/** 数据分析抽屉关闭回调 */
const handleAnalysisAfterOpenChange = (open: boolean) => {
  analysisDrawerOpen.value = open
}

/** AI 工具子功能枚举（不含 assistant，assistant 走独立对话框） */
type AiToolKey = 'jobMatch' | 'selfIntro' | 'grammar'

/** AI 工具抽屉开关 */
const aiDrawerOpen = ref(false)

/** 当前激活的 AI 工具子功能 */
const activeAiTool = ref<AiToolKey>('jobMatch')

/** 智能助手对话框开关 */
const aiAssistantOpen = ref(false)

/**
 * 打开 AI 工具抽屉并切换到指定子功能
 * @param tool - 子功能 key
 */
const handleOpenAiTool = (tool: AiToolKey) => {
  activeAiTool.value = tool
  aiDrawerOpen.value = true
}

/** 打开智能助手对话框 */
const handleOpenAssistant = () => {
  aiAssistantOpen.value = true
}

/** AI 工具抽屉关闭回调 */
const handleAiDrawerAfterOpenChange = (open: boolean) => {
  aiDrawerOpen.value = open
}
</script>

<template>
  <div class="tool-head">
    <div class="tool-head-left">
      <line-md-arrow-small-left @click="$router.back()" />
      <a-input v-model:value="resume.title" class="title"></a-input>
      <div class="undo-redo-group">
        <a-tooltip title="撤销 (Ctrl+Z)">
          <a-button
            size="small"
            :disabled="!props.canUndo"
            class="icon-button"
            @click="emit('undo')"
          >
            <UndoOutlined />
          </a-button>
        </a-tooltip>
        <a-tooltip title="还原 (Ctrl+Shift+Z)">
          <a-button
            size="small"
            :disabled="!props.canRedo"
            class="icon-button"
            @click="emit('redo')"
          >
            <RedoOutlined />
          </a-button>
        </a-tooltip>
      </div>
    </div>
    <div class="tools">
      <a-tooltip title="切换模板">
        <a-button @click="handleChangeTemplate"
          ><line-md-arrows-horizontal
        /></a-button>
      </a-tooltip>
      <a-tooltip title="数据分析">
        <a-button @click="handleOpenAnalysis">
          <BarChartOutlined />
        </a-button>
      </a-tooltip>
      <a-dropdown>
        <a-button>
          <RobotOutlined style="margin-right: 0.2rem" />
          AI 工具
          <DownOutlined style="margin-left: 0.2rem" />
        </a-button>
        <template #overlay>
          <a-menu>
            <a-menu-item @click="handleOpenAssistant"> 智能助手 </a-menu-item>
            <a-menu-item @click="handleOpenAiTool('jobMatch')">
              岗位匹配
            </a-menu-item>
            <a-menu-item @click="handleOpenAiTool('selfIntro')">
              自我介绍
            </a-menu-item>
            <a-menu-item @click="handleOpenAiTool('grammar')">
              语法纠错
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
      <a-dropdown>
        <a-button type="primary" class="tool-download">
          <line-md-arrow-close-down style="margin-right: 0.2rem" />
          导出<DownOutlined
        /></a-button>
        <template #overlay>
          <a-menu>
            <a-menu-item @click="handleDownloadPDF"> PDF </a-menu-item>
            <a-menu-item @click="handleDownloadJson"> JSON配置 </a-menu-item>
            <a-menu-item @click="handleDownloadMarkdown">
              Markdown
            </a-menu-item>
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

  <!-- 数据分析抽屉 -->
  <a-drawer
    v-model:open="analysisDrawerOpen"
    title="简历数据分析"
    placement="right"
    width="480px"
    @after-open-change="handleAnalysisAfterOpenChange"
  >
    <ResumeAnalysis />
  </a-drawer>

  <!-- AI 工具抽屉 -->
  <a-drawer
    v-model:open="aiDrawerOpen"
    title="AI 工具"
    placement="right"
    width="480px"
    @after-open-change="handleAiDrawerAfterOpenChange"
  >
    <a-tabs
      v-model:active-key="activeAiTool"
      size="middle"
      tab-position="top"
      class="ai-tool-tabs"
    >
      <a-tab-pane key="jobMatch" tab="岗位匹配">
        <JobMatch />
      </a-tab-pane>
      <a-tab-pane key="selfIntro" tab="自我介绍">
        <SelfIntro />
      </a-tab-pane>
      <a-tab-pane key="grammar" tab="语法纠错">
        <GrammarCheck />
      </a-tab-pane>
    </a-tabs>
  </a-drawer>

  <!-- 智能助手可拖拽对话框 -->
  <AiAssistant v-model:open="aiAssistantOpen" />
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
    .undo-redo-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .update-time {
      font-size: 1.2rem;
      white-space: nowrap;
      @include themify(
        (
          color: $text-color,
        )
      );
    }
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

  .undo-redo-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .icon-button {
    width: 34px;
    height: 34px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
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
    border: 1px solid transparent;
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
