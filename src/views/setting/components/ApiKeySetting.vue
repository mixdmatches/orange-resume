<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { KeyOutlined } from '@ant-design/icons-vue'
import SettingForm from './SettingForm.vue'
import type { APIManufacturer } from '@/types/APISetting'
import { storage } from '@/utils/storage'

const defaultApiState = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: '🤖',
    hint: '在DeepSeek获取 API 密钥',
    modelId: '',
    apiKey: '',
    apiEndpoint: 'https://api.deepseek.com',
  },
  {
    id: 'doubao',
    name: '豆包',
    icon: '🧉',
    hint: '在火山引擎获取 API 密钥',
    apiKey: '',
    apiEndpoint: 'https://ark.cn-beijing.volces.com/api/v3',
    modelId: '',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '🔮',
    hint: '在 OpenAI 平台获取 API 密钥',
    apiKey: '',
    apiEndpoint: 'https://api.openai.com/v1',
    modelId: '',
  },
  {
    id: 'custom',
    name: '自定义提供商',
    icon: '⚙️',
    hint: '配置兼容 OpenAI 格式的自定义 AI 提供商（如 OpenRouter）',
    apiKey: '',
    apiEndpoint: '',
    modelId: '',
    providerName: '',
  },
]

const apiState = ref<APIManufacturer[]>(
  storage.get('apiState')?.states || defaultApiState,
)

const currenModel = ref('deepseek') // 界面选择的模型

const selectedModel = ref(storage.get('apiState')?.selectedModel || 'deepseek') // 使用的模型

// AI 润色提示词
const polishPrompt = ref(
  `你是一个专业的简历优化助手。请帮助优化以下文本，使其更加专业和有吸引力。
              优化原则：
              1. 使用更专业的词汇和表达方式
              2. 突出关键成就和技能
              3. 保持简洁清晰
              4. 使用主动语气
              5. 保持原有信息的完整性
              6. 保留我输入的格式
              请直接返回优化后的文本，不要包含任何解释或其他内容。`,
)

const currentApiForm = computed<APIManufacturer>(
  () =>
    apiState.value.find(item => item.id == currenModel.value) ||
    apiState.value[0],
)

const models = computed(() =>
  apiState.value.map(item => ({
    id: item.id,
    name: item.name,
    icon: item.icon,
    hint: item.hint,
  })),
)

watch(
  () => currentApiForm.value,
  newVal => {
    apiState.value.forEach(item => {
      if (item.id == newVal.id) {
        item = newVal
      }
    })
    storage.set('apiState', {
      selectedModel: selectedModel.value,
      states: apiState.value,
      polishPrompt: polishPrompt.value,
    })
  },
  {
    deep: true,
  },
)

watch(
  () => selectedModel.value,
  newVal => {
    storage.set('apiState', {
      selectedModel: newVal,
      states: apiState.value,
      polishPrompt: polishPrompt.value,
    })
  },
)

watch(
  () => polishPrompt.value,
  newVal => {
    storage.set('apiState', {
      selectedModel: selectedModel.value,
      states: apiState.value,
      polishPrompt: newVal,
    })
  },
)

onMounted(() => {
  const state = storage.get('apiState')
  if (!state) return
  if (state.apiState) {
    apiState.value = state.apiState as APIManufacturer[]
    if (state.selectedModel) {
      selectedModel.value = state.selectedModel
    }
  }
})
</script>

<template>
  <!-- API key 设置 -->
  <a-card>
    <template #title>
      <div class="setting-title">
        <KeyOutlined :style="{ fontSize: '16px' }" /> API Key
      </div>
    </template>

    <div class="ai-settings-container">
      <!-- 左侧模型选择 -->
      <div class="model-list">
        <div class="model-list-header">当前使用的模型</div>
        <a-select
          v-model:value="selectedModel"
          style="width: 180px; margin-bottom: 10px"
        >
          <a-select-option
            v-for="model in models"
            :key="model.id"
            :value="model.id"
          >
            {{ model.name }}
          </a-select-option>
        </a-select>
        <div class="model-line"></div>
        <div
          v-for="model in models"
          :key="model.id"
          :class="['model-item', { active: currenModel === model.id }]"
          @click="currenModel = model.id"
        >
          <span class="model-icon">{{ model.icon }}</span>
          <span class="model-name">{{ model.name }}</span>
        </div>
      </div>
      <!-- 右侧设置内容 -->
      <div class="model-settings">
        <!-- 模型信息 -->
        <div class="model-info">
          <span class="model-info-icon">{{
            models.find(m => m.id === currenModel)?.icon
          }}</span>
          <div class="model-info-content">
            <div class="model-info-name">
              {{ models.find(m => m.id === currenModel)?.name }}
            </div>
            <div class="model-info-hint">
              {{ models.find(m => m.id === currenModel)?.hint }}
            </div>
          </div>
        </div>

        <!-- 设置表单 -->
        <SettingForm
          v-model:api-form="currentApiForm"
          v-model:polish-prompt="polishPrompt"
        />
      </div>
    </div>
  </a-card>
</template>

<style scoped lang="scss">
.ai-settings-container {
  display: flex;
  gap: 24px;
}

.model-list {
  width: 200px;
  flex-shrink: 0;
  padding: 0 10px;
  border-radius: 8px;
  overflow: hidden;
  @include themify(
    (
      background: (
        light: #fff,
        dark: #111827,
      ),
      border-color: (
        light: #e8e8e8,
        dark: rgba(255, 255, 255, 0.12),
      ),
    )
  );

  .model-list-header {
    padding: 12px 0;
    color: rgba(0, 0, 0, 0.5);
    @include themify(
      (
        color: (
          light: rgba(0, 0, 0, 0.5),
          dark: rgba(255, 255, 255, 0.65),
        ),
      )
    );
  }

  .model-line {
    height: 1px;
    background: #e8e8e8;
    margin: 12px 0;
    @include themify(
      (
        background: (
          light: #e8e8e8,
          dark: rgba(255, 255, 255, 0.12),
        ),
      )
    );
  }

  .model-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 16px;
    border-radius: 8px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #f5f5f5;
      @include themify(
        (
          background: (
            light: #f5f5f5,
            dark: rgba(255, 255, 255, 0.08),
          ),
        )
      );
    }

    &.active {
      background: #e6f7ff;
      @include themify(
        (
          background: (
            light: #e6f7ff,
            dark: rgba(59, 130, 246, 0.18),
          ),
        )
      );
    }

    .model-icon {
      font-size: 20px;
    }

    .model-name {
      font-size: 14px;
      color: #333;
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
}

.model-settings {
  flex: 1;
}

.model-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 24px;
  @include themify(
    (
      background: (
        light: #fafafa,
        dark: #111827,
      ),
      border-color: (
        light: #f0f0f0,
        dark: rgba(255, 255, 255, 0.12),
      ),
    )
  );

  .model-info-icon {
    font-size: 32px;
  }

  .model-info-content {
    .model-info-name {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
      @include themify(
        (
          color: (
            light: #333,
            dark: #f8faff,
          ),
        )
      );
    }

    .model-info-hint {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.5);
      @include themify(
        (
          color: (
            light: rgba(0, 0, 0, 0.5),
            dark: rgba(255, 255, 255, 0.65),
          ),
        )
      );
    }
  }
}
</style>
