<script setup lang="ts">
import { ref, watch, inject, onBeforeUnmount, nextTick } from 'vue'
import { motion } from 'motion-v'
import type { Resume } from '@/types/resume'
import { resumeToMarkdown, markdownToResume } from '@/utils/markdownConverter'
import { message } from 'ant-design-vue'

const resume: Resume = inject('resume') as Resume

/**
 * Markdown 编辑内容
 */
const markdownContent = ref('')

/**
 * 是否正在编辑（防止循环更新）
 */
const isEditing = ref(false)
const isProgrammaticUpdate = ref(false)
let syncTimer: ReturnType<typeof setTimeout> | null = null
let lastSyncedMarkdown = ''

const updateMarkdownContent = (value: string) => {
  isProgrammaticUpdate.value = true
  markdownContent.value = value
  nextTick(() => {
    isProgrammaticUpdate.value = false
  })
}

/**
 * 初始化：将 Resume 对象转换为 Markdown
 */
const initMarkdown = () => {
  updateMarkdownContent(resumeToMarkdown(resume))
  lastSyncedMarkdown = markdownContent.value
}

/**
 * 将 Markdown 同步到 Resume 对象
 */
const syncToResume = (options: { showMessage?: boolean } = {}) => {
  if (isEditing.value) return

  const normalizedMarkdown = markdownContent.value
  if (normalizedMarkdown === lastSyncedMarkdown) return

  try {
    isEditing.value = true
    const updatedResume = markdownToResume(normalizedMarkdown, resume)

    // 保留全局配置
    updatedResume.globalConfiguration = resume.globalConfiguration
    updatedResume.id = resume.id
    updatedResume.templateId = resume.templateId
    updatedResume.title = resume.title
    updatedResume.createdAt = resume.createdAt
    updatedResume.updatedAt = resume.updatedAt

    // 更新 resume 对象
    Object.assign(resume, updatedResume)
    lastSyncedMarkdown = normalizedMarkdown
    if (options.showMessage) {
      message.success('已同步到简历')
    }
  } catch {
    if (options.showMessage) {
      message.error('解析失败，请检查 Markdown 格式')
    }
  } finally {
    isEditing.value = false
  }
}

const scheduleSync = () => {
  if (syncTimer) {
    clearTimeout(syncTimer)
  }

  syncTimer = window.setTimeout(() => {
    void syncToResume()
  }, 400)
}

const flushPendingSync = (showMessage = false) => {
  if (syncTimer) {
    clearTimeout(syncTimer)
    syncTimer = null
  }

  if (!isEditing.value) {
    void syncToResume({ showMessage })
  }
}

// 监听 resume 变化，更新 Markdown（仅在非编辑状态下）
watch(
  () => resume,
  () => {
    if (!isEditing.value) {
      updateMarkdownContent(resumeToMarkdown(resume))
    }
  },
  { deep: true },
)

watch(
  markdownContent,
  () => {
    if (isProgrammaticUpdate.value || isEditing.value) return
    scheduleSync()
  },
  { flush: 'post' },
)

onBeforeUnmount(() => {
  flushPendingSync()
})

// 初始化
initMarkdown()
</script>

<template>
  <motion.div
    class="markdown-editor"
    :initial="{ opacity: 0, y: 20 }"
    :animate="{ opacity: 1, y: 0 }"
    :transition="{ duration: 0.5, ease: 'easeOut' }"
  >
    <div class="editor-toolbar">
      <span class="toolbar-title">Markdown 编辑</span>
      <div class="toolbar-actions">
        <a-button size="small" @click="() => flushPendingSync(true)">
          同步到简历
        </a-button>
        <a-button size="small" @click="initMarkdown">重置</a-button>
      </div>
    </div>

    <div class="editor-container">
      <div class="editor-panel">
        <a-textarea
          v-model:value="markdownContent"
          class="markdown-textarea"
          placeholder="在此输入 Markdown 内容..."
          :auto-size="{ minRows: 20, maxRows: 30 }"
          @blur="() => flushPendingSync(true)"
        />
      </div>
    </div>
  </motion.div>
</template>

<style scoped lang="scss">
.markdown-editor {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid;
  @include themify(
    (
      background-color: $bg-color,
      border-color: $border-color-mode,
    )
  );

  .toolbar-title {
    font-size: 1.4rem;
    font-weight: 600;
    @include themify(
      (
        color: $text-color,
      )
    );
  }

  .toolbar-actions {
    display: flex;
    gap: 0.5rem;
  }
}

.editor-container {
  display: grid;
  gap: 1rem;
  min-height: 400px;
}

.editor-panel,
.preview-panel {
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid;
  @include themify(
    (
      background-color: $bg-color,
      border-color: $border-color-mode,
    )
  );

  .panel-header {
    padding: 0.6rem 1rem;
    font-size: 1.2rem;
    font-weight: 600;
    border-bottom: 1px solid;
    @include themify(
      (
        color: $text-color,
        background-color: $layout-bg-color,
        border-bottom-color: $border-color-mode,
      )
    );
  }
}

.markdown-textarea {
  width: 100%;
  min-height: 350px;
  padding: 1rem;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 1.3rem;
  line-height: 1.6;
  resize: none;
  background-color: transparent;
  border: none;
  @include themify(
    (
      color: $text-color,
    )
  );

  &:focus {
    outline: none;
  }
}

.preview-content {
  padding: 1rem;
  min-height: 350px;
  overflow-y: auto;
  @include themify(
    (
      color: $text-color,
    )
  );

  :deep(h1) {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  :deep(h2) {
    font-size: 1.6rem;
    margin-top: 1.5rem;
    margin-bottom: 0.8rem;
    padding-bottom: 0.3rem;
    border-bottom: 1px solid;
    @include themify(
      (
        border-bottom-color: $border-color-mode,
      )
    );
  }

  :deep(h3) {
    font-size: 1.4rem;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
  }

  :deep(ul) {
    padding-left: 1.5rem;
    margin: 0.5rem 0;
  }

  :deep(li) {
    margin-bottom: 0.3rem;
    line-height: 1.6;
  }

  :deep(p) {
    margin: 0.5rem 0;
    line-height: 1.6;
  }
}

.format-guide {
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid;
  @include themify(
    (
      background-color: $bg-color,
      border-color: $border-color-mode,
    )
  );

  .guide-title {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    @include themify(
      (
        color: $text-color,
      )
    );
  }

  .guide-content {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.3rem;

    p {
      margin: 0;
      font-size: 1.2rem;
      @include themify(
        (
          color: $text-color,
        )
      );

      code {
        padding: 0.1rem 0.4rem;
        border-radius: 0.3rem;
        font-family: 'Consolas', 'Monaco', monospace;
        color: $primary-color;
        @include themify(
          (
            background-color: $layout-bg-color,
          )
        );
      }
    }
  }
}
</style>
