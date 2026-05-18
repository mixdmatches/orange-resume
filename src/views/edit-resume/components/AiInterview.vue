<script setup lang="ts">
import { computed, h, ref } from 'vue'
import {
  MessageOutlined,
  CopyOutlined,
  EyeOutlined,
} from '@ant-design/icons-vue'

/**
 * Tab页签状态
 */
const activeKey = ref('1')

/**
 * 面试问题类型定义
 */
interface InterviewQuestion {
  id: number
  question: string
  answer: string
  showAnswer: boolean
}

/**
 * 模拟面试问题列表
 */
const questions = ref<InterviewQuestion[]>([
  {
    id: 1,
    question: '请简单介绍一下你自己？',
    answer:
      '您好，我是一名具有3年开发经验的前端工程师。我热爱编程，对新技术充满热情。在过去的工作中，我参与了多个大型项目的开发，积累了丰富的实战经验。我擅长使用Vue、React等现代前端框架，并且对用户体验有深刻的理解。',
    showAnswer: false,
  },
  {
    id: 2,
    question: '你为什么选择我们公司？',
    answer:
      '我一直关注贵公司的发展，非常认同公司的技术理念和企业文化。贵公司在行业内的创新精神和技术实力深深吸引了我。我相信在这里我能够充分发挥自己的专业技能，同时也能不断学习和成长。',
    showAnswer: false,
  },
  {
    id: 3,
    question: '请描述一个你遇到过的最具挑战性的项目？',
    answer:
      '在之前的项目中，我负责重构一个老旧的企业级管理系统。这个项目的挑战在于代码质量参差不齐，技术栈陈旧，并且需要在不影响业务的情况下进行迁移。我通过制定详细的迁移计划，采用渐进式重构策略，最终成功完成了项目，并将系统性能提升了40%。',
    showAnswer: false,
  },
  {
    id: 4,
    question: '你的优缺点是什么？',
    answer:
      '我的优点是学习能力强，能够快速适应新技术。同时我注重团队协作，善于沟通。我的缺点可能是有时候过于追求完美，在细节上花费过多时间。不过我正在学习如何在质量和效率之间找到平衡。',
    showAnswer: false,
  },
  {
    id: 5,
    question: '你未来的职业规划是什么？',
    answer:
      '在短期内，我希望能够深入学习架构设计和性能优化方面的知识，成为一名技术骨干。长期来看，我希望能够带领团队，在技术领域做出更大的贡献。',
    showAnswer: false,
  },
])

/**
 * 是否已点击查看（调用AI出题）
 */
const hasClickedView = ref(false)

/**
 * 是否正在生成问题
 */
const isGeneratingQuestions = ref(false)

/**
 * 是否显示所有答案
 */
const showAllAnswers = ref(false)

/**
 * 点击查看按钮，调用AI生成问题
 */
const handleViewQuestions = async () => {
  isGeneratingQuestions.value = true

  // 模拟AI生成问题的延迟
  await new Promise(resolve => setTimeout(resolve, 1000))

  hasClickedView.value = true
  isGeneratingQuestions.value = false
}

/**
 * 切换单个问题的答案显示状态
 * @param id 问题ID
 */
const toggleAnswer = (id: number) => {
  const question = questions.value.find(q => q.id === id)
  if (question) {
    question.showAnswer = !question.showAnswer
  }
}

/**
 * 查看所有答案
 */
const viewAllAnswers = () => {
  showAllAnswers.value = true
  questions.value.forEach(q => {
    q.showAnswer = true
  })
}

/**
 * 重新生成问题
 */
const regenerateQuestions = () => {
  hasClickedView.value = false
  showAllAnswers.value = false
  questions.value.forEach(q => {
    q.showAnswer = false
  })
}

/**
 * 第二个tab - 自己提问相关状态
 */
const userQuestion = ref('')
const generatedResult = ref('')
const isGenerating = ref(false)
const copySuccess = ref(false)

/**
 * 模拟生成回答
 */
const generateAnswer = async () => {
  if (!userQuestion.value.trim()) return

  isGenerating.value = true
  generatedResult.value = ''

  // 模拟API调用延迟
  await new Promise(resolve => setTimeout(resolve, 1500))

  // 模拟生成的回答
  generatedResult.value = `针对您的问题「${userQuestion.value}」，以下是我的建议：\n\n首先，建议您明确问题的核心需求，梳理关键要点。其次，可以参考相关的行业最佳实践和案例，从中获取灵感。最后，结合自身的经验和专业知识，形成完整的解决方案。\n\n如果您需要更具体的指导，请提供更多背景信息，我会为您提供更详细的分析和建议。`

  isGenerating.value = false
}

/**
 * 复制结果到剪贴板
 */
const copyResult = async () => {
  if (!generatedResult.value) return

  try {
    await navigator.clipboard.writeText(generatedResult.value)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

/**
 * 重试生成
 */
const retryGenerate = () => {
  generatedResult.value = ''
}

const activeKeys = ref([
  ...questions.value.filter(q => q.showAnswer).map(q => String(q.id)),
])
</script>

<template>
  <div class="ai-interview">
    <a-tabs v-model:active-key="activeKey">
      <!-- Tab 1: AI模拟面试 -->
      <a-tab-pane key="1" tab="AI模拟面试">
        <div class="interview-tab">
          <!-- 默认状态：未点击查看 -->
          <div v-if="!hasClickedView" class="default-card">
            <div class="card-content">
              <div class="card-header">
                <span class="card-title">模拟面试</span>
                <span class="card-badge">WonderAI</span>
              </div>
              <p class="card-desc">AI智能生成模拟面试问答</p>
              <a-button
                type="primary"
                size="large"
                :loading="isGeneratingQuestions"
                @click="handleViewQuestions"
              >
                {{ isGeneratingQuestions ? '生成中...' : '点击查看' }}
              </a-button>
            </div>
            <div class="card-illustration">
              <div class="ai-icon">AI</div>
              <div class="message-icon">📝</div>
            </div>
          </div>

          <!-- 已点击查看：显示问题列表 -->
          <div v-else class="questions-panel">
            <!-- 头部提示 -->
            <div class="tab-header">
              <MessageOutlined class="header-icon" />
              <span>AI为您生成的面试问题</span>
            </div>

            <!-- 问题列表 -->
            <div class="question-list">
              <div
                v-for="question in questions"
                :key="question.id"
                class="question-item"
              >
                <div class="question-header">
                  <span class="question-number">Q{{ question.id }}</span>
                  <span class="question-text">{{ question.question }}</span>
                  <a-button
                    type="link"
                    size="small"
                    class="toggle-btn"
                    @click="toggleAnswer(question.id)"
                  >
                    {{ question.showAnswer ? '收起' : '查看答案' }}
                  </a-button>
                </div>

                <div v-if="question.showAnswer" v-motion class="answer-content">
                  <p>{{ question.answer }}</p>
                </div>
              </div>
            </div>

            <!-- 查看全部回答按钮 -->
            <div class="action-bar">
              <a-space>
                <a-button type="primary" @click="regenerateQuestions"
                  >继续生成</a-button
                >
                <a-button
                  type="primary"
                  :icon="h(EyeOutlined)"
                  :disabled="showAllAnswers"
                  @click="viewAllAnswers"
                >
                  查看全部回答
                </a-button>
              </a-space>
            </div>
          </div>
        </div>
      </a-tab-pane>

      <!-- Tab 2: 自己提问 -->
      <a-tab-pane key="2" tab="自己提问">
        <div class="question-tab">
          <h3>输入问题</h3>
          <!-- 输入区域 -->
          <div class="input-section">
            <a-textarea
              v-model:value="userQuestion"
              placeholder="请输入您的问题..."
              :auto-size="{ minRows: 3, maxRows: 6 }"
              class="question-input"
            />
            <a-button
              type="primary"
              size="large"
              block
              :loading="isGenerating"
              :disabled="!userQuestion.trim()"
              @click="generateAnswer"
            >
              {{ isGenerating ? '生成中...' : '生成回答' }}
            </a-button>
          </div>

          <!-- 结果展示区域 -->
          <h3>生成结果</h3>
          <div class="result-section">
            <a-textarea
              v-model:value="generatedResult"
              placeholder="生成结果将显示在这里"
              :rows="8"
              class="result-content"
              :readonly="true"
            />
            <a-space style="margin-top: 10px">
              <a-button type="primary" @click="copyResult"> 复制 </a-button>
              <a-button>重试</a-button>
            </a-space>
          </div>
        </div>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<style scoped lang="scss">
.ai-interview {
  width: 50%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 0.5rem;
  padding: 1.6rem;
  background-color: #fff !important;
  overflow: scroll;
  @include themify(
    (
      color: $text-color,
      background-color: $layout-bg-color,
    )
  );
}

/* 第一个Tab - AI模拟面试 */
.interview-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tab-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 1rem 0;
  margin-bottom: 1rem;
  border-bottom: 1px solid $border-color;

  .header-icon {
    font-size: 1.8rem;
    color: $primary-color;
  }

  span {
    font-size: 1.4rem;
    font-weight: 500;
  }

  .regenerate-btn {
    margin-left: auto;
    color: $primary-color;
    border-color: $primary-color;
  }
}

/* 默认卡片样式 */
.default-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2rem;
  border: 1px solid $border-color;
  border-radius: 1.2rem;
  min-height: 200px;

  .card-content {
    flex: 1;

    .card-header {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      margin-bottom: 1rem;

      .card-title {
        font-size: 2rem;
        font-weight: 600;
      }

      .card-badge {
        padding: 0.3rem 0.8rem;
        font-size: 1.2rem;
        font-weight: 500;
        border-radius: 0.4rem;
      }
    }

    .card-desc {
      margin: 0 0 1.5rem 0;
      font-size: 1.4rem;
    }
  }

  .card-illustration {
    position: relative;
    width: 120px;
    height: 120px;

    .ai-icon {
      position: absolute;
      top: 0;
      right: 0;
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #004cff 0%, #35a7ff 100%);
      border-radius: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.4rem;
      font-weight: bold;
      color: #fff;
      box-shadow: 0 4px 20px rgba(0, 128, 255, 0.4);
    }

    .message-icon {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 60px;
      height: 60px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      backdrop-filter: blur(10px);
    }
  }
}

/* 问题面板样式 */
.questions-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.question-list {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-item {
  border: 1px solid $border-color;
  border-radius: 0.8rem;
  overflow: hidden;
  background-color: #fff;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .question-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.2rem;
    background-color: #fafafa;
    border-bottom: 1px solid transparent;
    transition: border-color 0.3s ease;

    .question-number {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #004cff 0%, #35a7ff 100%);
      color: #fff;
      font-weight: 600;
      font-size: 1.3rem;
      border-radius: 0.4rem;
    }

    .question-text {
      flex: 1;
      font-size: 1.4rem;
      font-weight: 500;
      color: #333;
    }

    .toggle-btn {
      flex-shrink: 0;
      color: $primary-color;
      padding: 0.4rem 0.8rem;
      font-size: 1.3rem;

      &:hover {
        color: #004cff;
      }
    }
  }

  &.show-answer .question-header {
    border-bottom-color: $border-color;
  }

  .answer-content {
    padding: 1rem 1.2rem;
    background-color: #fff;

    p {
      margin: 0;
      line-height: 1.8;
      color: #666;
      font-size: 1.4rem;
    }
  }
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s ease,
    max-height 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  max-height: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  max-height: 500px;
}

.action-bar {
  display: flex;
  justify-content: center;
  padding-top: 1rem;
  border-top: 1px solid $border-color;
}

/* 第二个Tab - 自己提问 */
.question-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.input-section {
  margin-bottom: 1.5rem;
}

.question-input {
  margin-bottom: 1rem;
}

.result-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-radius: 0.6rem;
  overflow: hidden;
}

.result-content {
  resize: none;
}
</style>
