<script setup lang="ts">
import { ref } from 'vue'
import { h } from 'vue'
import { message } from 'ant-design-vue'
import { generateAnswer, hasApiKey } from '@/utils/deepseek'
import {
  CopyOutlined,
  SendOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue'

const props = defineProps({
  resumeTitle: {
    type: String,
    default: '',
  },
})

const userQuestion = ref('')
const generatedAnswer = ref('')
const isLoading = ref(false)
const copySuccess = ref(false)

const handleGenerate = async () => {
  if (!userQuestion.value.trim()) {
    message.warning('请先输入问题内容')
    return
  }

  if (!hasApiKey()) {
    message.error('请先在“设置”页面配置 API Key')
    return
  }

  isLoading.value = true
  generatedAnswer.value = ''
  try {
    generatedAnswer.value = await generateAnswer(userQuestion.value)
  } catch (error) {
    message.error((error as Error).message || '生成回答失败，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

const handleCopy = async () => {
  if (!generatedAnswer.value) {
    return
  }
  try {
    await navigator.clipboard.writeText(generatedAnswer.value)
    copySuccess.value = true
    message.success('复制成功')
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch {
    message.error('复制失败，请手动复制')
  }
}

const handleReset = () => {
  userQuestion.value = ''
  generatedAnswer.value = ''
  isLoading.value = false
}
</script>

<template>
  <a-card class="custom-panel" bordered>
    <div class="panel-header">
      <div>
        <h3>我的提问</h3>
        <p>你可以输入面试问题，AI 会生成参考回答，方便你整理面试答题思路。</p>
      </div>
      <a-tag color="success">智能答题</a-tag>
    </div>

    <div class="custom-body">
      <div class="question-input-wrapper">
        <a-textarea
          v-model:value="userQuestion"
          placeholder="请输入你想模拟的面试问题，例如：请介绍你最近项目中的核心贡献。"
          :auto-size="{ minRows: 4, maxRows: 8 }"
        />
        <a-space class="action-row">
          <a-button
            type="primary"
            :icon="h(SendOutlined)"
            :loading="isLoading"
            @click="handleGenerate"
            >生成回答</a-button
          >
          <a-button
            type="default"
            :icon="h(ReloadOutlined)"
            @click="handleReset"
            >清空</a-button
          >
        </a-space>
      </div>

      <div class="result-card">
        <div class="result-header">
          <div>
            <h4>参考回答</h4>
            <span>{{
              props.resumeTitle
                ? `基于：${props.resumeTitle}`
                : '直接输入问题即可生成回答'
            }}</span>
          </div>
          <a-space>
            <a-button
              type="primary"
              :icon="h(CopyOutlined)"
              :disabled="!generatedAnswer"
              @click="handleCopy"
              >{{ copySuccess ? '已复制' : '复制' }}</a-button
            >
          </a-space>
        </div>

        <div class="result-content">
          <a-textarea
            v-model:value="generatedAnswer"
            placeholder="生成回答将显示在这里"
            :rows="8"
            readonly
          />
        </div>
      </div>
    </div>
  </a-card>
</template>

<style scoped lang="scss">
.custom-panel {
  background: #fff;
  border-radius: 1rem;
  min-height: 380px;
  @include themify(
    (
      background: (
        light: #fff,
        dark: #111827,
      ),
      border-color: (
        light: #f0f0f0,
        dark: rgba(255, 255, 255, 0.12),
      ),
    )
  );
}

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.panel-header h3 {
  margin: 0;
  font-size: 1.6rem;
}

.panel-header p {
  margin: 0.6rem 0 0;
  color: rgba(0, 0, 0, 0.65);
  @include themify(
    (
      color: (
        light: rgba(0, 0, 0, 0.65),
        dark: rgba(255, 255, 255, 0.65),
      ),
    )
  );
}

.custom-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.action-row {
  justify-content: flex-start;
}

.result-card {
  border: 1px solid #f0f0f0;
  border-radius: 1rem;
  padding: 1rem;
  background: #fafafa;
  @include themify(
    (
      border-color: (
        light: #f0f0f0,
        dark: rgba(255, 255, 255, 0.12),
      ),
      background: (
        light: #fafafa,
        dark: #111827,
      ),
    )
  );
}

.result-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
}

.result-header h4 {
  margin: 0;
}

.result-header span {
  color: rgba(0, 0, 0, 0.65);
  @include themify(
    (
      color: (
        light: rgba(0, 0, 0, 0.65),
        dark: rgba(255, 255, 255, 0.65),
      ),
    )
  );
}

.result-content {
  min-height: 220px;
}
</style>
