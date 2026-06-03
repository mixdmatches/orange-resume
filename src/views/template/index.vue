<script setup lang="ts">
import { ref, computed, provide } from 'vue'
import { templates } from '@/template/index'
import { DEFAULT_RESUME } from '@/config/init-resume-data'
import type { Resume } from '@/types/resume'
import TemplateCard from './components/TemplateCard.vue'
import { useRouter } from 'vue-router'
import { addResumeIDB } from '@/service/resumeIDB'
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
    // 创建新简历数据
    const newResume: Resume = {
      ...previewResume,
      id: `resume_${Date.now()}`,
      templateId,
      title: `${currentTemplateName.value}简历-${crypto.randomUUID().substring(0, 5)}`,
    }

    // 保存到 IndexedDB
    await addResumeIDB(newResume)

    // 跳转到编辑页面
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
    // 创建新简历数据
    const newResume: Resume = {
      ...previewResume,
      id: `resume_${Date.now()}`,
      templateId: currentTemplateId.value,
      title: `${currentTemplateName.value}简历-${crypto.randomUUID().substring(0, 5)}`,
    }

    // 保存到 IndexedDB
    await addResumeIDB(newResume)

    // 关闭预览
    previewVisible.value = false

    // 跳转到编辑页面
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

const transition = {
  type: 'spring',
  visualDuration: 0.6,
  bounce: 0.4,
}
</script>

<template>
  <div class="template-container">
    <template v-for="temp in templates" :key="temp.id">
      <div
        v-motion
        class="template-box"
        :while-hover="{ scale: 1.02 }"
        :while-press="{ scale: 0.98 }"
        :initial="{ opacity: 0, y: 20 }"
        :animate="{ opacity: 1, y: 0 }"
        :exit="{ opacity: 0, scale: 0.95 }"
        :transition="{ ...transition, delay: 0.15 }"
      >
        <template-card
          :template="temp"
          @use="handleUse"
          @preview="handlePreview"
        />
      </div>
    </template>
  </div>

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
        <span class="preview-note"
          >该预览仅展示模板样式，不会同步实际简历数据。</span
        >
      </div>
      <div class="resume-preview-wrapper">
        <div class="preview-stage">
          <div class="preview-paper">
            <component :is="currentTemplate" v-if="currentTemplate" />
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <template #footer>
      <div style="display: flex; justify-content: flex-end; gap: 10px">
        <a-button @click="handleClose">关闭预览</a-button>
        <a-button type="primary" @click="handleUseTemplate">
          使用此模板
        </a-button>
      </div>
    </template>
  </a-modal>
</template>

<style scoped lang="scss">
.template-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  padding: 20px;
}

.template-box {
  width: 100%;
}

.preview-content {
  padding: 0;
  background: transparent;

  .preview-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 18px;
    gap: 6px;
    text-align: center;
  }

  .preview-title {
    font-size: 16px;
    font-weight: 700;
    color: #102a43;
  }

  .preview-note {
    font-size: 13px;
    color: #61708c;
    line-height: 1.6;
  }

  .resume-preview-wrapper {
    width: 100%;
    max-width: 860px;
    max-height: calc(100vh - 260px);
    overflow-y: auto;
    background: linear-gradient(180deg, #f7fbff 0%, #ffffff 100%);
    border: 1px solid rgba(24, 144, 255, 0.16);
    padding: 16px;
    border-radius: 18px;
    box-shadow: 0 18px 48px rgba(15, 23, 42, 0.12);
    margin: 0 auto;
    display: flex;
    justify-content: center;
    align-items: flex-start;

    .preview-stage {
      width: 100%;
      transform: scale(0.54);
      transform-origin: top center;
      border-radius: 18px;
      overflow: visible;
      background: transparent;
      box-shadow: none;
    }

    .preview-paper {
      width: 100%;
      aspect-ratio: 0.707 / 1;
      max-width: 720px;
      background: #ffffff;
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.08);
      box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }

    :deep(.resume-preview) {
      width: 100%;
      min-height: 100%;
    }
  }
}
</style>
