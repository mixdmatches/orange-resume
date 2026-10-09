<script setup lang="ts">
import type { APIManufacturer } from '@/types/ai-config'
import { message, type FormInstance } from 'ant-design-vue'
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

/** Ant Design Vue 表单实例引用，用于手动触发 validate */
const formRef = ref<FormInstance>()

const isTesting = ref(false)

/** 是否为尚未保存的新建草稿：无真实 providerId，后端无法按 id 查到配置 */
const isUnsaved = computed(() => !form.value.providerId)

/** 是否为内置固定厂商：API 端点不可编辑、无提供商名称输入 */
const isBuiltin = computed(() =>
  BUILTIN_PROVIDER_IDS.includes(form.value.providerId ?? ''),
)

/* ----------------------- 表单校验规则 ----------------------- */

/**
 * apiKeyEnc 校验器：
 * - 新建未保存厂商：必填 + 不能包含掩码 ****
 * - 已保存厂商：允许保持后端回传的掩码不变（父组件 handleSave 会将未修改的 key 转为空串）
 */
const apiKeyEncRules = computed(() => {
  if (!isUnsaved.value) return []
  return [
    { required: true, message: '请输入 API Key', trigger: 'blur' },
    {
      validator: (_rule: unknown, value: string) =>
        value.includes('****')
          ? Promise.reject('API Key 不能包含掩码 ****，请输入真实的 Key')
          : Promise.resolve(),
      trigger: 'blur',
    },
  ]
})

/** modelId 校验规则：所有厂商都必填 */
const modelIdRules = [
  { required: true, message: '请输入模型 ID', trigger: 'blur' },
]

/**
 * apiEndpoint 校验规则：
 * - 自定义厂商：必填
 * - 内置厂商：不校验（端点由后端固定，表单 disabled）
 */
const apiEndpointRules = computed(() => {
  if (isBuiltin.value) return []
  return [{ required: true, message: '请输入 API 端点', trigger: 'blur' }]
})

/** 自定义厂商的 providerName 校验规则：仅新建未保存时必填（已保存厂商名称已持久化） */
const providerNameRules = computed(() => {
  if (isBuiltin.value || !isUnsaved.value) return []
  return [{ required: true, message: '请输入提供商名称', trigger: 'blur' }]
})

/* ----------------------- 事件处理 ----------------------- */

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

/**
 * 点击保存按钮：先执行表单校验，校验通过后通知父组件提交到后端
 * 校验失败时错误提示会自动显示在对应字段下方
 */
const handleSaveClick = async () => {
  try {
    await formRef.value?.validate()
    emit('save')
  } catch {
    // 校验失败：错误提示由 a-form-item 自动渲染，这里只需静默拦截
  }
}

/** 清除表单校验状态：用于在切换厂商时重置校验 */
const clearValidate = () => {
  formRef.value?.clearValidate()
}

defineExpose({
  clearValidate,
})

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
</script>

<template>
  <a-form ref="formRef" :model="form" layout="vertical">
    <!-- 提供商名称（仅自定义供应商） -->
    <a-form-item
      v-if="!isBuiltin"
      name="providerName"
      :rules="providerNameRules"
      class="setting-item"
    >
      <template #label>提供商名称</template>
      <a-input
        v-model:value="form.providerName"
        placeholder="提供商名称"
        class="setting-input"
      />
    </a-form-item>

    <!-- API Key -->
    <a-form-item name="apiKeyEnc" :rules="apiKeyEncRules" class="setting-item">
      <template #label>
        API Key
        <a
          v-show="apiLink !== ''"
          :key="apiLink"
          :href="apiLink"
          target="_blank"
          class="setting-link"
          >获取 API Key</a
        >
      </template>
      <a-input-password
        v-model:value="form.apiKeyEnc"
        style="width: 400px"
        placeholder="API Key"
        class="setting-input"
      />
    </a-form-item>

    <!-- 模型 ID -->
    <a-form-item name="modelId" :rules="modelIdRules" class="setting-item">
      <template #label>模型 ID</template>
      <a-input
        v-model:value="form.modelId"
        placeholder="模型 ID"
        class="setting-input"
      />
    </a-form-item>

    <!-- API端点 -->
    <a-form-item
      name="apiEndpoint"
      :rules="apiEndpointRules"
      class="setting-item"
    >
      <template #label>API端点</template>
      <a-input
        v-model:value="form.apiEndpoint"
        :bordered="!isBuiltin"
        :disabled="isBuiltin"
        class="setting-input"
        placeholder="API端点"
      />
    </a-form-item>

    <!-- 连接测试（未保存草稿无真实 id，后端无法按 id 查配置发起请求，禁用） -->
    <div class="setting-item">
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
      <a-button type="primary" @click="handleSaveClick">保存</a-button>
    </div>
  </a-form>
</template>

<style scoped lang="scss">
.setting-item {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }

  /* 覆盖 a-form-item 的 label 容器，去掉 vertical layout 自带的 padding */
  :deep(.ant-form-item-label) {
    padding-bottom: 4px;
    line-height: 1.5;
  }

  /* 覆盖 label 元素本身，恢复原来 .setting-label 的 flex 布局，让 "获取 API Key" 链接靠右 */
  :deep(.ant-form-item-label > label) {
    display: flex;
    align-items: center;
    font-size: 14px;
    font-weight: 500;
    color: #333;
    @include themify(
      (
        color: (
          light: #333,
          dark: #f8faff,
        ),
      )
    );

    /* label 右侧跳转链接（如 "获取 API Key"） */
    .setting-link {
      margin-left: 20px;
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
