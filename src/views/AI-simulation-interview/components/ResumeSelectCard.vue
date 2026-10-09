<script setup lang="ts">
import { computed, ref } from 'vue'
import { message } from 'ant-design-vue'
import {
  FileTextOutlined,
  UploadOutlined,
  InboxOutlined,
  FilePdfOutlined,
  FileMarkdownOutlined,
  FileWordOutlined,
} from '@ant-design/icons-vue'
import type { Resume } from '@/types/resume'

/**
 * ResumeSelectCard 选择简历卡片
 * 双入口设计：
 *  1. 应用内简历 —— 原有下拉选择流程（功能保留）
 *  2. 外部简历上传 —— pdf/json/txt/word/markdown（UI 先行，功能 TODO）
 */
const props = defineProps({
  resumes: {
    type: Array as () => Resume[],
    default: () => [],
  },
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'manage'): void
  (e: 'preview'): void
}>()

/** 当前激活的入口：inner=应用内简历 / upload=外部简历上传 */
const activeTab = ref<'inner' | 'upload'>('inner')

/** 拖拽悬停状态（用于上传区高亮） */
const dragOver = ref(false)

const selectedResume = computed(
  () => props.resumes.find(item => item.id === props.modelValue) ?? null,
)

const options = computed(() =>
  props.resumes.map(item => ({
    label: item.title,
    value: item.id,
  })),
)

const currentValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
})

/**
 * 点击上传区
 * TODO: 后期实现外部简历解析与导入（pdf/json/txt/word/markdown）
 */
const handleUploadClick = () => {
  message.info('外部简历上传功能开发中，敬请期待')
}

/**
 * 拖拽放下（阻止默认行为，避免浏览器直接打开文件）
 * TODO: 后期在这里接收文件并走解析流程
 */
const handleDrop = (e: DragEvent) => {
  dragOver.value = false
  e.preventDefault()
  message.info('外部简历上传功能开发中，敬请期待')
}

/** 拖拽悬停进入 */
const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  dragOver.value = true
}

/** 拖拽离开 */
const handleDragLeave = () => {
  dragOver.value = false
}
</script>

<template>
  <a-card class="resume-select-card" bordered>
    <div class="select-header">
      <p>
        使用页面内创建的简历，或上传外部简历文件，AI
        将基于简历内容生成面试题目。
      </p>
    </div>

    <!-- ============ 入口切换 Tab ============ -->
    <div class="entry-tabs">
      <button
        class="entry-tab"
        :class="{ active: activeTab === 'inner' }"
        type="button"
        @click="activeTab = 'inner'"
      >
        <FileTextOutlined class="tab-icon" />
        <span class="tab-label">应用内简历</span>
      </button>
      <button
        class="entry-tab"
        :class="{ active: activeTab === 'upload' }"
        type="button"
        @click="activeTab = 'upload'"
      >
        <UploadOutlined class="tab-icon" />
        <span class="tab-label">外部简历上传</span>
      </button>
    </div>

    <!-- ============ 应用内简历（原有功能） ============ -->
    <template v-if="activeTab === 'inner'">
      <div class="select-row">
        <a-select
          v-model:value="currentValue"
          :options="options"
          placeholder="请选择简历"
          style="min-width: 320px; width: 100%"
        />
        <a-space>
          <a-button
            type="default"
            :disabled="!selectedResume"
            @click="emit('preview')"
          >
            查看简历
          </a-button>
          <a-button type="default" @click="emit('manage')">我的简历</a-button>
        </a-space>
      </div>

      <div v-if="selectedResume" class="resume-summary">
        <a-space direction="vertical" size="middle">
          <a-tag color="blue">当前简历</a-tag>
          <div class="summary-line">
            <span class="label">标题：</span>
            <span>{{ selectedResume.title }}</span>
          </div>
          <div class="summary-line">
            <span class="label">姓名：</span>
            <span>{{ selectedResume.basic.name || '未填写' }}</span>
          </div>
          <div class="summary-line">
            <span class="label">求职方向：</span>
            <span>{{ selectedResume.basic.position || '未填写' }}</span>
          </div>
        </a-space>
      </div>

      <div v-else class="empty-hint">
        <a-empty description="暂无简历，请先创建或导入简历" />
      </div>
    </template>

    <!-- ============ 外部简历上传（UI 先行，功能 TODO） ============ -->
    <template v-else>
      <!-- TODO: 后期实现外部简历解析导入流程：
           1. 点击/拖拽接收文件（.pdf .json .txt .docx .md）
           2. pdf 走 importPDF（已有 utils/importPDF.ts）
           3. json 走 JSON.parse 校验 Resume 结构
           4. txt/md/word 提取纯文本后交给 AI 结构化（参考 pdfToJsonApi）
           5. 解析成功后写入简历库并自动选中 -->
      <div
        class="upload-zone"
        :class="{ 'drag-over': dragOver }"
        role="button"
        tabindex="0"
        @click="handleUploadClick"
        @keydown.enter="handleUploadClick"
        @drop="handleDrop"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
      >
        <div class="upload-icon">
          <InboxOutlined />
        </div>
        <p class="upload-title">点击或拖拽简历文件到此处上传</p>
        <p class="upload-desc">支持 PDF / JSON / TXT / Word / Markdown 格式</p>
        <div class="format-tags">
          <span class="format-tag"><FilePdfOutlined /> PDF</span>
          <span class="format-tag"><FileTextOutlined /> JSON</span>
          <span class="format-tag"><FileTextOutlined /> TXT</span>
          <span class="format-tag"><FileWordOutlined /> Word</span>
          <span class="format-tag"><FileMarkdownOutlined /> Markdown</span>
        </div>
        <a-tag class="dev-tag" color="orange">功能开发中</a-tag>
      </div>
    </template>
  </a-card>
</template>

<style scoped lang="scss">
.resume-select-card {
  min-width: 320px;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border-color: var(--color-border);
}

.select-header {
  margin-bottom: var(--space-5);

  p {
    margin: 0;
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    line-height: var(--leading-normal);
  }
}

/* ============ 入口切换 Tab ============ */
.entry-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-1);
  padding: var(--space-1);
  margin-bottom: var(--space-5);
  background: var(--color-bg-muted);
  border-radius: var(--radius-md);
}

.entry-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  height: 38px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  transition:
    background var(--duration-base) var(--ease-out),
    color var(--duration-base) var(--ease-out),
    box-shadow var(--duration-base) var(--ease-out);

  .tab-icon {
    font-size: 15px;
  }

  .tab-label {
    font-size: var(--text-xs);
  }

  &:hover {
    color: var(--color-text);
  }

  &.active {
    background: var(--color-surface);
    color: var(--color-primary);
    box-shadow: var(--shadow-xs);
  }
}

/* ============ 应用内简历 ============ */
.select-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-3);
  align-items: center;
  margin-bottom: var(--space-4);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.resume-summary {
  padding: var(--space-4) 0 0;
  border-top: 1px solid var(--color-border);
  color: var(--color-text);
}

.summary-line {
  display: flex;
  gap: var(--space-2);
  font-size: var(--text-xs);
  line-height: var(--leading-relaxed);
}

.label {
  color: var(--color-text-secondary);
  min-width: 70px;
  flex-shrink: 0;
}

.empty-hint {
  padding: var(--space-4) 0;
  color: var(--color-text);
}

/* ============ 外部简历上传区 ============ */
.upload-zone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-10) var(--space-6) var(--space-6);
  border: 1.5px dashed var(--color-border-strong);
  border-radius: var(--radius-lg);
  background: var(--color-bg-subtle);
  cursor: pointer;
  text-align: center;
  transition:
    border-color var(--duration-base) var(--ease-out),
    background var(--duration-base) var(--ease-out);

  &:hover,
  &.drag-over {
    border-color: var(--color-primary);
    background: var(--color-primary-bg);

    .upload-icon {
      color: var(--color-primary);
      transform: translateY(-2px);
    }
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
}

.upload-icon {
  font-size: 40px;
  color: var(--color-text-tertiary);
  transition:
    color var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-out);
}

.upload-title {
  margin: var(--space-2) 0 0;
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--color-text);
}

.upload-desc {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

/* 格式标签行 */
.format-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.format-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

/* 开发中角标 */
.dev-tag {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  margin: 0;
}
</style>
