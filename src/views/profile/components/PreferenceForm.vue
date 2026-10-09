<script setup lang="ts">
import type { APIManufacturer } from '@/types/ai-config'
import { ReloadOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { DEFAULT_POLISH_PROMPT } from '@/constants/ai'

// "当前使用的模型"下拉选项（仅已保存的厂商，父组件已合并固定 UI 信息）
defineProps<{
  providers: APIManufacturer[]
}>()

// 当前使用的模型厂商 id（与父组件双向绑定）
const selectedProviderId = defineModel<string>('selectedProviderId', {
  required: true,
})

// 润色提示词草稿（与父组件双向绑定）
const polishPrompt = defineModel<string>('polishPrompt', {
  required: true,
})

const emit = defineEmits<{
  save: []
}>()

/** 重置润色提示词为默认值（仍需点击保存才生效） */
function resetPrompt() {
  polishPrompt.value = DEFAULT_POLISH_PROMPT
  message.info('已重置提示词，保存后生效')
}
</script>

<template>
  <!-- 当前使用的模型 -->
  <div class="setting-item">
    <label class="setting-label">当前使用的模型</label>
    <a-select v-model:value="selectedProviderId" style="width: 240px">
      <a-select-option
        v-for="model in providers"
        :key="model.providerId"
        :value="model.providerId"
      >
        <span class="model-option">
          <span class="model-option-icon">{{ model.icon }}</span>
          {{ model.providerName }}
        </span>
      </a-select-option>
    </a-select>
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
    />
  </div>

  <!-- 保存按钮 -->
  <div class="setting-item form-actions">
    <a-button type="primary" @click="emit('save')">保存偏好</a-button>
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
  }
}

.model-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  .model-option-icon {
    font-size: 16px;
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
