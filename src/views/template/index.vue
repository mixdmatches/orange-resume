<script setup lang="ts">
import { ref, computed } from 'vue'
import { templates } from '@/template/index'
import { DEFAULT_RESUME } from '@/config/init-resume-data'
import type { Resume } from '@/types/resume'
import classicPreview from '@/assets/images/classic.fcafadcb.svg'
import { useRouter } from 'vue-router'
import { addResumeIDB } from '@/service/resumeIDB'
import { message } from 'ant-design-vue'

const router = useRouter()

// 创建预览用的简历数据
const previewResume: Resume = {
  ...DEFAULT_RESUME,
  id: 'preview',
  title: '预览简历',
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

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
 * 使用模板创建新简历
 */
const handleUseTemplate = async () => {
  try {
    // 创建新简历数据
    const newResume: Resume = {
      ...DEFAULT_RESUME,
      id: `resume_${Date.now()}`,
      templateId: currentTemplateId.value,
      title: `${currentTemplateName.value}简历`,
      createdAt: Date.now(),
      updatedAt: null,
    }

    // 保存到 IndexedDB
    await addResumeIDB(newResume)

    // 关闭预览
    previewVisible.value = false

    // 跳转到编辑页面
    router.push(`/edit-resume/${newResume.id}`)

    message.success(`成功使用「${currentTemplateName.value}」模板创建简历`)
  } catch (error) {
    console.error('使用模板失败:', error)
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
    <div
      v-for="temp in templates"
      :key="temp.id"
      v-motion
      class="template-box"
      :while-hover="{ scale: 1.2 }"
      :while-press="{ scale: 0.8 }"
      :initial="{ opacity: 0, y: 30 }"
      :animate="{ opacity: 1, y: 0 }"
      :exit="{ opacity: 0, scale: 0 }"
      :transition="{ ...transition, delay: 0.3 }"
    >
      <div class="template-wrapper">
        <div class="template-image">
          <img :src="classicPreview" alt="模板预览" />
        </div>
        <!-- 蒙版 -->
        <div class="template-mask">
          <div class="template-name">{{ temp.name }}</div>
          <div class="template-description">{{ temp.description }}</div>
        </div>
      </div>
      <div class="template-button">
        <a-button type="primary" size="large">使用模板</a-button>
        <a-button size="large" @click="handlePreview(temp.id)">
          预览模板
        </a-button>
      </div>
    </div>
  </div>

  <!-- 预览模态框 -->
  <a-modal
    v-model:open="previewVisible"
    :title="`${currentTemplateName} - 简历预览`"
    :width="950"
    @cancel="handleClose"
  >
    <div class="preview-content">
      <div class="resume-preview-wrapper">
        <component
          :is="currentTemplate"
          v-if="currentTemplate"
          :resume="previewResume"
        />
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
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 20px;
  padding: 20px;

  .template-box {
    height: 600px;
    background-color: #f9f9f9;
    border-radius: 10px;
    overflow: hidden;
    position: relative;
    border: 1px solid #ccc;

    .template-wrapper {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    .template-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .template-mask {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 10;

      .template-name {
        font-size: 24px;
        font-weight: bold;
        color: #fff;
        margin-bottom: 12px;
      }

      .template-description {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.85);
        text-align: center;
        padding: 0 20px;
      }
    }

    .template-button {
      position: absolute;
      bottom: 20px;
      left: 20px;
      right: 20px;
      display: flex;
      justify-content: center;
      gap: 10px;
      z-index: 20;
    }

    // 鼠标移入显示蒙版
    &:hover {
      .template-mask {
        opacity: 1;
      }
    }
  }
}

// 预览模态框样式
.preview-content {
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;

  .resume-preview-wrapper {
    width: 100%;
    max-height: 600px;
    overflow-y: auto;
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    :deep(.resume-preview) {
      width: 100%;
      transform: scale(0.7);
      transform-origin: center top;
      transform-box: fill-box;
    }
  }
}
</style>
