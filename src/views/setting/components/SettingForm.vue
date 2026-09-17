<script setup lang="ts">
import type { APIManufacturer } from '@/types/ai-config'
import { message } from 'ant-design-vue'
import { computed, ref } from 'vue'
import { testConnectionApi } from '@/api'
import { BUILTIN_PROVIDER_IDS } from '@/constants/ai'

// 厂商配置表单草稿：由父组件持有，点击保存后才提交后端
const form = defineModel<APIManufacturer>('form', {
  required: true,
})

const emit = defineEmits<{
  save: []
  cancel: []
}>()

const isTesting = ref(false)

/** 是否为尚未保存的新建草稿：无真实 providerId，后端无法按 id 查到配置 */
const isUnsaved = computed(() => !form.value.providerId)

/**
 * 测试连接：后端按 providerId 查已保存配置发起真实请求
 * 因此仅已保存的厂商可测试，未保存草稿禁用
 */
const handleTestConnection = async () => {
  const { providerId } = form.value
  // 未保存草稿（含掩码回显场景）后端无法发起真实请求
  if (!providerId) return
  isTesting.value = true
  try {
    await testConnectionApi(providerId)
    message.success('连接测试成功')
  } finally {
    isTesting.value = false
  }
}

/** 获取 API Key 的跳转链接（自定义供应商无链接） */
const apiLink = computed(() => {
  if (form.value.providerId === 'deepseek') {
    return 'https://platform.deepseek.com/usage'
  } else if (form.value.providerId === 'doubao') {
    return 'https://console.volcengine.com/'
  } else if (form.value.providerId === 'openai') {
    return 'https://platform.openai.com/api-keys'
  }
  return ''
})

/** 是否为内置固定厂商：API 端点不可编辑、无提供商名称输入 */
const isBuiltin = computed(() =>
  BUILTIN_PROVIDER_IDS.includes(form.value.providerId ?? ''),
)
</script>

<template>
  <!-- 提供商名称（仅自定义供应商） -->
  <div v-if="!isBuiltin" class="setting-item">
    <label class="setting-label">提供商名称</label>
    <a-input
      v-model:value="form.providerName"
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
      v-model:value="form.apiKeyEnc"
      style="width: 400px"
      placeholder="API Key"
      class="setting-input"
    />
  </div>

  <!-- 模型 ID -->
  <div class="setting-item">
    <label class="setting-label">模型 ID</label>
    <a-input
      v-model:value="form.modelId"
      placeholder="模型 ID"
      class="setting-input"
    />
  </div>

  <!-- API端点 -->
  <div class="setting-item">
    <label class="setting-label">API端点</label>
    <a-input
      v-model:value="form.apiEndpoint"
      :bordered="!isBuiltin"
      :disabled="isBuiltin"
      class="setting-input"
      placeholder="API端点"
    />
  </div>

  <!-- 连接测试（未保存草稿无真实 id，后端无法按 id 查配置发起请求，禁用） -->
  <div class="setting-item">
    <label class="setting-label">连接测试</label>
    <a-tooltip v-if="isUnsaved" title="请先保存配置后再测试连接">
      <a-button type="primary" disabled>测试连接</a-button>
    </a-tooltip>
    <a-button
      v-else
      type="primary"
      :loading="isTesting"
      @click="handleTestConnection"
    >
      测试连接
    </a-button>
  </div>

  <!-- 操作按钮 -->
  <div class="setting-item form-actions">
    <a-button @click="emit('cancel')">取消</a-button>
    <a-button type="primary" @click="emit('save')">保存</a-button>
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
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
