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
  CameraOutlined,
} from '@ant-design/icons-vue'
import { exportResumeToBrowserPrint } from '@/utils/print'
import ThemeIcon from '@/components/ThemeIcon.vue'
import ResumeAnalysis from './ResumeAnalysis.vue'
import AiAssistant from './AiAssistant.vue'
import GrammarCheck from './GrammarCheck.vue'
import SelfIntro from './SelfIntro.vue'
import JobMatch from './JobMatch.vue'
import IdCardMaker from './IdCardMaker.vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { computed, inject, ref } from 'vue'
import { resumeToText } from '@/utils/resumeToText'
import type { Resume } from '@/types/resume'
import templates from '@/template'
import TemplateThumb from '@/components/TemplateThumb.vue'
import type { CloudSyncStatus } from '@/stores/sync'

const props = defineProps<{
  canUndo: boolean
  canRedo: boolean
  /** 最后保存时间戳（毫秒），null 表示尚未保存 */
  lastSaveTime: number | null
  cloudStatus: CloudSyncStatus
}>()

const emit = defineEmits<{
  (e: 'undo'): void
  (e: 'redo'): void
}>()

/** 证件照制作弹窗开关 */
const idCardOpen = ref(false)

/** 打开证件照制作弹窗 */
const handleOpenIdCard = () => {
  idCardOpen.value = true
}

const resume: Resume = inject('resume') as Resume

/** 当前简历的纯文本形式（传给 AI 助手供 Agent 工具调用） */
const resumeText = computed(() => resumeToText(resume))

/**
 * 根据云端同步状态返回保存位置前缀：
 * - synced：本地写入 + 云端同步完成 → "云端已上传"
 * - syncing / pending / offline / error：本地写入但云端未完成 → "本地保存"
 */
const saveLocation = computed(() => {
  if (props.cloudStatus === 'synced') return '云端已上传'
  return '本地保存'
})

/** 格式化日期为中文：2026年10月08日 14:30 */
const formatChineseDate = (timestamp: number) => {
  return dayjs(timestamp).format('YYYY年MM月DD日 HH:mm')
}

/** 工具栏主文案：位置 + 时间，例如 "云端已上传 2026年10月08日 14:30" */
const saveDisplay = computed(() => {
  if (!props.lastSaveTime) return '尚未保存'
  return `${saveLocation.value} ${formatChineseDate(props.lastSaveTime)}`
})

/** 完整时间，hover 时在 title 中显示精确到秒 */
const fullSaveTime = computed(() => {
  if (!props.lastSaveTime) return '尚未保存'
  return `${saveLocation.value} ${dayjs(props.lastSaveTime).format('YYYY-MM-DD HH:mm:ss')}`
})

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
    <!-- ============ 左侧：返回 / 标题 / 撤销重做 / 保存状态 ============ -->
    <div class="tool-head-left">
      <a-tooltip title="返回">
        <button class="icon-btn" @click="$router.back()">
          <line-md-arrow-small-left />
        </button>
      </a-tooltip>

      <span class="divider-v"></span>

      <a-input v-model:value="resume.title" class="title-input" />

      <div class="undo-redo-group">
        <a-tooltip title="撤销 (Ctrl+Z)">
          <button
            class="icon-btn"
            :disabled="!props.canUndo"
            @click="emit('undo')"
          >
            <UndoOutlined />
          </button>
        </a-tooltip>
        <a-tooltip title="还原 (Ctrl+Shift+Z)">
          <button
            class="icon-btn"
            :disabled="!props.canRedo"
            @click="emit('redo')"
          >
            <RedoOutlined />
          </button>
        </a-tooltip>
      </div>

      <span class="divider-v"></span>

      <div class="save-status" :title="fullSaveTime">
        <span class="status-dot" :class="`dot-${props.cloudStatus}`"></span>
        {{ saveDisplay }}
      </div>
    </div>

    <!-- ============ 右侧：模板 / 分析 / AI 工具 / 导出 / 主题 ============ -->
    <div class="tools">
      <a-tooltip title="切换模板">
        <button class="icon-btn" @click="handleChangeTemplate">
          <line-md-arrows-horizontal />
        </button>
      </a-tooltip>
      <a-tooltip title="数据分析">
        <button class="icon-btn" @click="handleOpenAnalysis">
          <BarChartOutlined />
        </button>
      </a-tooltip>
      <a-tooltip title="证件照制作">
        <button class="icon-btn" @click="handleOpenIdCard">
          <CameraOutlined />
        </button>
      </a-tooltip>

      <span class="divider-v"></span>

      <a-dropdown>
        <a-button class="ghost-btn">
          <RobotOutlined />
          AI 工具
          <DownOutlined class="btn-caret" />
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
        <a-button type="primary" class="primary-btn">
          <line-md-arrow-close-down />
          导出
          <DownOutlined class="btn-caret" />
        </a-button>
        <template #overlay>
          <a-menu>
            <a-menu-item @click="handleDownloadPDF"> PDF </a-menu-item>
            <a-menu-item @click="handleDownloadJson"> JSON配置 </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>

      <span class="divider-v"></span>

      <a-tooltip title="切换主题">
        <button class="icon-btn">
          <theme-icon></theme-icon>
        </button>
      </a-tooltip>
    </div>
  </div>

  <a-drawer
    v-model:open="drawerOpen"
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
          :class="{ 'template-box-active': resume.templateId === template.id }"
        >
          <!-- 实时渲染真实模板预览 -->
          <div class="template-thumb">
            <TemplateThumb
              :template-id="template.id"
              :resume="resume"
              :scale="0.22"
            />
          </div>
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
  <AiAssistant v-model:open="aiAssistantOpen" :resume-text="resumeText" />

  <!-- 证件照制作弹窗 -->
  <IdCardMaker v-model:open="idCardOpen" />
</template>

<style scoped lang="scss">
/* ============ 工具栏 ============ */
.tool-head {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  width: 100%;
  height: var(--header-height);
  padding: 0 var(--space-4);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.tool-head-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}

/* 功能分组之间的细分隔线 */
.divider-v {
  flex: none;
  width: 1px;
  height: 20px;
  margin: 0 var(--space-1);
  background: var(--color-border);
}

/* ============ 统一图标按钮 ============ */
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex: none;
  padding: 0;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 18px;
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover:not(:disabled) {
    background: var(--color-bg-muted);
    color: var(--color-text);
  }

  &:active:not(:disabled) {
    background: var(--color-bg-muted);
    color: var(--color-primary);
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
}

/* ============ 标题输入：ghost 样式，hover/focus 才显形 ============ */
.title-input {
  width: 240px;
  height: 34px;
  padding: 0 var(--space-2);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  transition:
    background-color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);

  &:hover {
    background: var(--color-bg-muted);
  }

  &:focus {
    background: var(--color-surface);
    border-color: var(--color-primary);
    box-shadow: var(--focus-ring);
    outline: none;
  }
}

.undo-redo-group {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

/* ============ 保存状态：状态点 + 文案 ============ */
.save-status {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  white-space: nowrap;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-text-tertiary);
  flex: none;

  &.dot-synced {
    background: var(--color-success);
  }

  &.dot-syncing {
    background: var(--color-primary);
    animation: dot-pulse 1.2s var(--ease-in-out) infinite;
  }

  &.dot-pending {
    background: var(--color-warning);
  }

  &.dot-offline,
  &.dot-error {
    background: var(--color-danger);
  }
}

@keyframes dot-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

/* 减弱动效偏好：停用状态点脉冲 */
@media (prefers-reduced-motion: reduce) {
  .status-dot.dot-syncing {
    animation: none;
  }
}

/* ============ 右侧工具组 ============ */
.tools {
  display: flex;
  align-items: center;
  gap: var(--space-2);

  /* 下拉按钮统一圆角与内边距 */
  :deep(.ant-btn) {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    height: 32px;
    padding: 0 var(--space-3);
    border-radius: var(--radius-md);

    .btn-caret {
      font-size: 10px;
      opacity: 0.6;
    }
  }
}

/* ============ 模板选择抽屉 ============ */
.template-container {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
}

.template-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);

  &:hover {
    border-color: var(--color-primary-border);
  }

  &.template-box-active {
    border-color: var(--color-primary);
    background: var(--color-primary-bg);
  }
}

.template-thumb {
  width: 100%;
  // 高度自适应：scale 0.22 时完整 A4 缩放高度约 247px，不写死避免裁切
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--color-bg-muted);
  display: flex;
  justify-content: center;
  padding: var(--space-2);
}

/* ============ 响应式 ============ */
@media (max-width: 768px) {
  .tool-head {
    padding: 0 var(--space-3);
    flex-wrap: wrap;
    height: auto;
    min-height: var(--header-height);
    padding-top: var(--space-1);
    padding-bottom: var(--space-1);
  }

  .title-input {
    width: 140px;
  }

  .save-status,
  .divider-v {
    display: none;
  }

  .tools {
    gap: var(--space-1);
  }

  .template-container {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
