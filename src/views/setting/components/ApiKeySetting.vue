<script setup lang="ts">
import { message } from 'ant-design-vue'
import { ref } from 'vue'

// AI 设置
const selectedModel = ref('doubao')
const apiKey = ref('')
const modelId = ref('')
const isTesting = ref(false)
const prompt = ref(
  '优化原则： 1. 使用更专业的词汇和表达方式 2. 突出关键成就和技能 3. 保持简洁清晰 4. 使用主动语气 5. 保持原有信息的完整性 6. 保留我输入的格式 请直接返回优化后的文本，不要包含任何解释或其他内容。',
)
const apiEndpoint = ref('')
const providerName = ref('')

const models = [
  { id: 'deepseek', name: 'DeepSeek', icon: '🤖' },
  { id: 'doubao', name: '豆包', icon: '🧉', hint: '在火山引擎获取 API 密钥' },
  { id: 'openai', name: 'OpenAI', icon: '🔮' },
  { id: 'custom', name: '自定义提供商', icon: '⚙️' },
]

const handleTestConnection = async () => {
  isTesting.value = true
  setTimeout(() => {
    isTesting.value = false
    message.success('连接测试成功')
  }, 1500)
}

const resetPrompt = () => {
  message.info('已重置提示词')
}
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
          :class="['model-item', { active: selectedModel === model.id }]"
          @click="selectedModel = model.id"
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
            models.find(m => m.id === selectedModel)?.icon
          }}</span>
          <div class="model-info-content">
            <div class="model-info-name">
              {{ models.find(m => m.id === selectedModel)?.name }}
            </div>
            <div class="model-info-hint">
              {{ models.find(m => m.id === selectedModel)?.hint }}
            </div>
          </div>
        </div>

        <!-- AI服务商名称 -->
        <div v-if="selectedModel === 'custom'" class="setting-item">
          <label class="setting-label">提供商名称</label>
          <a-input
            v-model="providerName"
            placeholder="提供商名称"
            class="setting-input"
          />
        </div>

        <!-- API Key -->
        <div class="setting-item">
          <label class="setting-label">
            API Key
            <a href="#" class="setting-link">获取 API Key</a>
          </label>
          <a-input
            v-model="apiKey"
            placeholder="API Key"
            class="setting-input"
          />
        </div>

        <!-- 模型 ID -->
        <div v-if="selectedModel !== 'deepseek'" class="setting-item">
          <label class="setting-label">模型 ID</label>
          <a-input
            v-model="modelId"
            placeholder="模型 ID"
            class="setting-input"
          />
        </div>

        <!-- API端点 -->
        <div v-if="selectedModel !== 'deepseek'" class="setting-item">
          <label class="setting-label">API端点</label>
          <a-input
            v-model="apiEndpoint"
            class="setting-input"
            placeholder="API端点"
          />
        </div>

        <!-- 连接测试 -->
        <div class="setting-item">
          <label class="setting-label">连接测试</label>
          <a-button
            type="primary"
            :loading="isTesting"
            @click="handleTestConnection"
          >
            <RefreshOutlined />
            测试连接
          </a-button>
        </div>

        <!-- AI 润色提示词 -->
        <div class="setting-item">
          <label class="setting-label">
            AI 润色提示词
            <a-button @click="resetPrompt"> <RefreshOutlined /> 重置 </a-button>
          </label>
          <a-textarea
            v-model:value="prompt"
            placeholder="请输入提示词..."
            :rows="10"
          >
          </a-textarea>
        </div>
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

  .model-list-header {
    padding: 12px 0;
    color: rgba(0, 0, 0, 0.5);
  }

  .model-line {
    height: 1px;
    background: #e8e8e8;
    margin: 12px 0;
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
    }

    &.active {
      background: #e6f7ff;
    }

    .model-icon {
      font-size: 20px;
    }

    .model-name {
      font-size: 14px;
      color: #333;
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

  .model-info-icon {
    font-size: 32px;
  }

  .model-info-content {
    .model-info-name {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
    }

    .model-info-hint {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.5);
    }
  }
}

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

    .setting-link {
      font-size: 13px;
      font-weight: normal;
      color: #1890ff;
    }
  }

  .setting-input {
    width: 100%;
    max-width: 400px;
  }
}
</style>
