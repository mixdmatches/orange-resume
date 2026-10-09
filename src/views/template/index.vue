<script setup lang="ts">
import { ref, computed, provide } from 'vue'
import { templates } from '@/template/index'
import { DEFAULT_RESUME } from '@/config/init-resume-data'
import type { Resume } from '@/types/resume'
import TemplateCard from './components/TemplateCard.vue'
import TemplateThumb from '@/components/TemplateThumb.vue'
import { useRouter } from 'vue-router'
import { addResumeIDB } from '@/service/resumeIDB'
import { generateUUID } from '@/utils/uuid'
import { message } from 'ant-design-vue'

const router = useRouter()

// 创建预览用的简历数据
const previewResume: Resume = {
  ...DEFAULT_RESUME,
  id: 'preview',
  templateId: '',
  title: '预览简历',
}

provide('resume', previewResume)

// 预览模态框状态
const previewVisible = ref(false)
const currentTemplateId = ref('')

// 当前选中的模板组件
const currentTemplate = computed(() => {
  const template = templates.find(t => t.id === currentTemplateId.value)
  return template?.component
})

// 当前模板名称
const currentTemplateName = computed(() => {
  const template = templates.find(t => t.id === currentTemplateId.value)
  return template?.name || ''
})

/**
 * 打开预览模态框
 */
const handlePreview = (tempId: string) => {
  currentTemplateId.value = tempId
  previewVisible.value = true
}

/**
 * 直接使用模板
 */
const handleUse = async (templateId: string) => {
  currentTemplateId.value = templateId
  try {
    const newResume: Resume = {
      ...previewResume,
      id: `resume_${Date.now()}`,
      templateId,
      title: `${currentTemplateName.value}简历-${generateUUID().substring(0, 5)}`,
    }

    await addResumeIDB(newResume)

    router.push(`/edit-resume/${newResume.id}`)

    message.success(`成功使用「${currentTemplateName.value}」模板创建简历`)
  } catch {
    message.error('使用模板失败，请重试')
  }
}

/**
 * 使用模板创建新简历
 */
const handleUseTemplate = async () => {
  try {
    const newResume: Resume = {
      ...previewResume,
      id: `resume_${Date.now()}`,
      templateId: currentTemplateId.value,
      title: `${currentTemplateName.value}简历-${generateUUID().substring(0, 5)}`,
    }

    await addResumeIDB(newResume)

    previewVisible.value = false

    router.push(`/edit-resume/${newResume.id}`)

    message.success(`成功使用「${currentTemplateName.value}」模板创建简历`)
  } catch {
    message.error('使用模板失败，请重试')
  }
}

/**
 * 关闭预览模态框
 */
const handleClose = () => {
  previewVisible.value = false
}
</script>

<template>
  <div class="page page-template">
    <header class="page-header">
      <div>
        <h1 class="page-title">模板中心</h1>
        <p class="page-subtitle">
          挑选一个起点，内容填好直接用 · 卡片为实时渲染
        </p>
      </div>
    </header>

    <section class="template-grid">
      <div
        v-for="(t, i) in templates"
        :key="t.id"
        class="template-box"
        :style="{ animationDelay: `${i * 60}ms` }"
      >
        <TemplateCard
          :template="t"
          :preview-resume="previewResume"
          @use="handleUse"
          @preview="handlePreview"
        />
      </div>
    </section>

    <!-- 预览模态框 -->
    <a-modal
      v-model:open="previewVisible"
      :title="`${currentTemplateName} - 模板预览`"
      :width="900"
      @cancel="handleClose"
    >
      <div class="preview-content">
        <div class="preview-header">
          <span class="preview-title">预览当前模板布局与页面样式</span>
          <span class="preview-note">
            该预览仅展示模板样式，不会同步实际简历数据。
          </span>
        </div>
        <div class="resume-preview-wrapper">
          <!-- 用 TemplateThumb scale=1 实现完整 A4 1:1 预览，自带 padding 页面边距 -->
          <TemplateThumb
            v-if="currentTemplateId"
            :template-id="currentTemplateId"
            :resume="previewResume"
            :scale="0.5"
          />
        </div>
      </div>

      <template #footer>
        <div class="preview-footer">
          <a-button @click="handleClose">关闭预览</a-button>
          <a-button type="primary" @click="handleUseTemplate">
            使用此模板
          </a-button>
        </div>
      </template>
    </a-modal>
  </div>
</template>

<style scoped lang="scss">
.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-6);
}

.template-box {
  width: 100%;
  animation: fade-up var(--duration-slow) var(--ease-out) both;
}

.preview-content {
  padding: 0;
  background: transparent;

  .preview-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: var(--space-5);
    gap: var(--space-2);
    text-align: center;
  }

  .preview-title {
    font-size: var(--text-base);
    font-weight: var(--font-semibold);
    color: var(--color-text);
  }

  .preview-note {
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
  }
}

.resume-preview-wrapper {
  display: flex;
  justify-content: center;
  // 灰底衬托白纸 + 纸张阴影，避免弹窗白底与模板白纸融为一体
  padding: var(--space-6);
  max-height: 70vh;
  overflow: auto;
  background: var(--color-bg-muted);
  border-radius: var(--radius-lg);

  // A4 白纸加投影，呈现"纸放在桌面上"的层次感
  :deep(.thumb-viewport) {
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-lg);
  }
}

.preview-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
