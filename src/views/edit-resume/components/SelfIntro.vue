<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { message } from 'ant-design-vue'
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import MarkdownIt from 'markdown-it'
import type { Resume } from '@/types/resume'
import { resumeToText } from '@/utils/resumeToText'
import { selfIntroStreamApi } from '@/api'
import type { SelfIntroOptions } from '@/types/ai'

/** 简历数据 */
const resume = inject<Resume>('resume') as Resume

/** markdown-it 实例 */
const md = new MarkdownIt({
  breaks: true,
  linkify: true,
})

/** 表单选项 */
const scene = ref<SelfIntroOptions['scene']>('校招')
const duration = ref<SelfIntroOptions['duration']>(3)
const tone = ref<SelfIntroOptions['tone']>('正式')

/** 是否生成中 */
const loading = ref(false)

/** 生成的 Markdown 原文 */
const content = ref('')

/** 是否已生成过（区分初始状态） */
const hasGenerated = ref(false)

/** 渲染后的 HTML */
const renderedHtml = computed(() => md.render(content.value))

/**
 * 开始生成自我介绍（流式）
 */
const handleGenerate = async () => {
  if (loading.value) return

  loading.value = true
  content.value = ''
  hasGenerated.value = true

  try {
    const resumeText = resumeToText(resume)
    const options: SelfIntroOptions = {
      scene: scene.value,
      duration: duration.value,
      tone: tone.value,
    }
    for await (const delta of selfIntroStreamApi({
      resumeText,
      options,
    })) {
      content.value += delta
    }
  } catch (error) {
    message.error((error as Error).message || '生成失败，请重试')
    hasGenerated.value = false
  } finally {
    loading.value = false
  }
}

/**
 * 复制全文到剪贴板
 */
const handleCopy = async () => {
  if (!content.value) return
  try {
    await navigator.clipboard.writeText(content.value)
    message.success('已复制到剪贴板')
  } catch {
    message.error('复制失败，请手动选择文本复制')
  }
}
</script>

<template>
  <div class="self-intro">
    <!-- 选项表单 -->
    <div class="options-form">
      <div class="form-item">
        <span class="form-label">场景</span>
        <a-radio-group v-model:value="scene" :disabled="loading">
          <a-radio-button value="校招">校招</a-radio-button>
          <a-radio-button value="社招">社招</a-radio-button>
          <a-radio-button value="实习">实习</a-radio-button>
        </a-radio-group>
      </div>
      <div class="form-item">
        <span class="form-label">时长</span>
        <a-radio-group v-model:value="duration" :disabled="loading">
          <a-radio-button :value="1">1 分钟</a-radio-button>
          <a-radio-button :value="3">3 分钟</a-radio-button>
          <a-radio-button :value="5">5 分钟</a-radio-button>
        </a-radio-group>
      </div>
      <div class="form-item">
        <span class="form-label">语气</span>
        <a-radio-group v-model:value="tone" :disabled="loading">
          <a-radio-button value="正式">正式</a-radio-button>
          <a-radio-button value="轻松">轻松</a-radio-button>
        </a-radio-group>
      </div>
      <a-button
        type="primary"
        :loading="loading"
        :disabled="loading"
        @click="handleGenerate"
      >
        {{ loading ? '生成中...' : hasGenerated ? '重新生成' : '生成自我介绍' }}
      </a-button>
    </div>

    <!-- 内容区 -->
    <div class="content-area">
      <!-- 初始状态 -->
      <div v-if="!hasGenerated && !loading" class="init-state">
        <a-empty
          description="选择场景、时长、语气后点击生成，AI 将为你撰写自我介绍"
        />
      </div>

      <!-- 生成中 / 已生成：Markdown 预览 -->
      <div v-else class="markdown-preview">
        <!-- 顶部操作栏（生成中不显示复制） -->
        <div v-if="hasGenerated && !loading && content" class="preview-toolbar">
          <span class="word-count">约 {{ content.length }} 字</span>
          <a-space>
            <a-button size="small" @click="handleCopy">
              <CopyOutlined /> 复制
            </a-button>
            <a-button size="small" :loading="loading" @click="handleGenerate">
              <ReloadOutlined /> 重新生成
            </a-button>
          </a-space>
        </div>

        <!-- Markdown 渲染区 -->
        <div class="markdown-body" v-html="renderedHtml"></div>

        <!-- 加载中提示（首次流式未收到内容时） -->
        <div v-if="loading && !content" class="loading-hint">
          <a-spin tip="AI 正在构思自我介绍..." />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.self-intro {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.options-form {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 1rem;
  border: 1px solid;
  border-radius: 0.6rem;
  @include themify(
    (
      background-color: $bg-color,
      border-color: $border-color-mode,
    )
  );

  .form-item {
    display: flex;
    align-items: center;
    gap: 0.8rem;

    .form-label {
      flex-shrink: 0;
      width: 3rem;
      font-size: 1.3rem;
      font-weight: 500;
      @include themify(
        (
          color: $text-color,
        )
      );
    }
  }
}

.content-area {
  min-height: 200px;
}

.init-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
}

.markdown-preview {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  .preview-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.4rem 0;

    .word-count {
      font-size: 1.2rem;
      color: #8c8c8c;
    }
  }

  .markdown-body {
    padding: 1rem 1.2rem;
    font-size: 1.4rem;
    line-height: 1.9;
    border: 1px solid;
    border-radius: 0.6rem;
    @include themify(
      (
        background-color: $bg-color,
        border-color: $border-color-mode,
        color: $text-color,
      )
    );

    :deep(p) {
      margin: 0 0 0.8rem 0;
    }

    :deep(strong) {
      font-weight: 600;
      color: #1677ff;
    }

    :deep(ul),
    :deep(ol) {
      padding-left: 1.8rem;
      margin: 0 0 0.8rem 0;
    }

    :deep(li) {
      margin-bottom: 0.3rem;
    }
  }

  .loading-hint {
    display: flex;
    justify-content: center;
    padding: 2rem 0;
  }
}
</style>
