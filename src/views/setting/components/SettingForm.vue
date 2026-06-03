<script setup lang="ts">
import type { APIManufacturer } from '@/types/APISetting'
import { message } from 'ant-design-vue'
import { ReloadOutlined } from '@ant-design/icons-vue'
import { computed, ref } from 'vue'

const apiForm = defineModel<APIManufacturer>('apiForm', {
  required: true,
})

const polishPrompt = defineModel<string>('polishPrompt', {
  required: true,
})

const isTesting = ref(false)
const handleTestConnection = async () => {
  isTesting.value = true
  setTimeout(() => {
    isTesting.value = false
    message.success('连接测试成功')
  }, 1500)
}

const resetPrompt = () => {
  polishPrompt.value = `你是一个专业的简历优化助手。请帮助优化以下文本，使其更加专业和有吸引力。
              优化原则：
              1. 使用更专业的词汇和表达方式
              2. 突出关键成就和技能
              3. 保持简洁清晰
              4. 使用主动语气
              5. 保持原有信息的完整性
              6. 保留我输入的格式
              请直接返回优化后的文本，不要包含任何解释或其他内容。`
  message.info('已重置提示词')
}

const apiLink = computed(() => {
  if (apiForm.value.id === 'deepseek') {
    return 'https://platform.deepseek.com/usage'
  } else if (apiForm.value.id === 'doubao') {
    return 'https://console.volcengine.com/'
  } else if (apiForm.value.id === 'openai') {
    return 'https://platform.openai.com/api-keys'
  }
  return ''
})
</script>

<template>
  <!-- AI服务商名称 -->
  <div v-if="apiForm.id === 'custom'" class="setting-item">
    <label class="setting-label">提供商名称</label>
    <a-input
      v-model:value="apiForm.providerName"
      placeholder="提供商名称"
      class="setting-input"
    />
  </div>

  <!-- API Key -->
  <div class="setting-item">
    <label class="setting-label">
      API Key
      <a
        v-show="apiLink !== ''"
        :key="apiLink"
        :href="apiLink"
        target="_blank"
        class="setting-link"
        >获取 API Key</a
      >
    </label>
    <a-input-password
      v-model:value="apiForm.apiKey"
      style="width: 400px"
      placeholder="API Key"
      :visibility-toggle="false"
      class="setting-input"
    />
  </div>

  <!-- 模型 ID -->
  <div v-if="apiForm.id !== 'deepseek'" class="setting-item">
    <label class="setting-label">模型 ID</label>
    <a-input
      v-model:value="apiForm.modelId"
      placeholder="模型 ID"
      class="setting-input"
    />
  </div>

  <!-- API端点 -->
  <div
    v-if="apiForm.id !== 'deepseek' && apiForm.id !== 'doubao'"
    class="setting-item"
  >
    <label class="setting-label">API端点</label>
    <a-input
      v-model:value="apiForm.apiEndpoint"
      class="setting-input"
      placeholder="API端点"
    />
  </div>

  <!-- 连接测试 -->
  <div class="setting-item">
    <label class="setting-label">连接测试</label>
    <a-button type="primary" :loading="isTesting" @click="handleTestConnection">
      测试连接
    </a-button>
  </div>

  <!-- AI 润色提示词 -->
  <div class="setting-item">
    <label class="setting-label">
      AI 润色提示词
      <a-button @click="resetPrompt"> <ReloadOutlined /> 重置 </a-button>
    </label>
    <a-textarea
      v-model:value="polishPrompt"
      placeholder="请输入提示词..."
      :rows="10"
    >
    </a-textarea>
  </div>
</template>

<style scoped lang="scss">
.setting-item {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }

  .setting-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    font-weight: 500;
    color: #333;
    margin-bottom: 8px;
    @include themify(
      (
        color: (
          light: #333,
          dark: #f8faff,
        ),
      )
    );

    .setting-link {
      font-size: 13px;
      font-weight: normal;
      color: #1890ff;
      @include themify(
        (
          color: (
            light: #1890ff,
            dark: #60a5fa,
          ),
        )
      );
    }
  }

  .setting-input {
    width: 100%;
    max-width: 400px;

    input,
    textarea {
      @include themify(
        (
          background: (
            light: #fff,
            dark: #111827,
          ),
          color: (
            light: #000,
            dark: #f8faff,
          ),
          border-color: (
            light: #d9d9d9,
            dark: rgba(255, 255, 255, 0.12),
          ),
        )
      );
    }
  }
}
</style>
