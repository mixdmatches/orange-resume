<script setup lang="ts">
import { h, inject, ref } from 'vue'
import { MessageOutlined, EyeOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import {
  generateInterviewQuestions,
  generateAnswer,
  hasApiKey,
} from '@/utils/deepseek'
import type { Resume } from '@/types/resume'

/**
 * 获取简历数据
 */
const resume = inject<Resume>('resume')

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
 * 面试问题列表
 */
const questions = ref<InterviewQuestion[]>([])

/**
 * 解析AI返回的问题和答案
 */
const parseQuestions = (content: string): InterviewQuestion[] => {
  const result: InterviewQuestion[] = []
  const lines = content.split('\n')
  let currentQuestion = ''
  let currentAnswer = ''
  let isAnswer = false

  for (const line of lines) {
    // 匹配问题行 (如 Q1:, Q2:, 问题：, 1.)
    const questionMatch = line.match(/^(Q\d+|\d+\.|问题\d+|问题：?)\s*(.+)/)
    if (questionMatch) {
      // 如果有之前的问题，先保存
      if (currentQuestion) {
        result.push({
          id: result.length + 1,
          question: currentQuestion.trim(),
          answer: currentAnswer.trim() || '暂无参考回答',
          showAnswer: false,
        })
      }
      currentQuestion = questionMatch[2]
      currentAnswer = ''
      isAnswer = false
      continue
    }

    // 匹配回答开始
    if (
      line.includes('回答：') ||
      line.includes('参考答案：') ||
      line.includes('答：')
    ) {
      isAnswer = true
      currentAnswer = line.replace(/^(回答|参考答案|答)：?\s*/, '')
      continue
    }

    // 如果正在收集回答，继续添加
    if (isAnswer) {
      currentAnswer += '\n' + line
    }
  }

  // 保存最后一个问题
  if (currentQuestion) {
    result.push({
      id: result.length + 1,
      question: currentQuestion.trim(),
      answer: currentAnswer.trim() || '暂无参考回答',
      showAnswer: false,
    })
  }

  return result
}

/**
 * 将简历转换为文本格式
 */
const resumeToText = (res: Resume): string => {
  return JSON.stringify(res)
}

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
  // 检查API Key是否配置
  if (!hasApiKey()) {
    message.error('请先在设置中配置API Key')
    return
  }

  // 检查简历是否有内容
  if (!resume || !resume.basic.name) {
    message.warning('请先填写简历基本信息')
    return
  }

  isGeneratingQuestions.value = true

  try {
    // 将简历转换为文本
    const resumeText = resumeToText(resume)

    // 调用API生成面试问题
    const result = await generateInterviewQuestions(resumeText, 5)

    // 解析问题
    const parsedQuestions = parseQuestions(result)

    if (parsedQuestions.length > 0) {
      questions.value = parsedQuestions
    } else {
      // 如果解析失败，使用默认问题
      questions.value = [
        {
          id: 1,
          question: '请介绍一下你最近参与的项目？',
          answer:
            '根据您的简历，您参与了多个项目。请详细描述您在项目中的角色、职责和主要贡献。',
          showAnswer: false,
        },
        {
          id: 2,
          question: '您掌握的核心技术栈有哪些？',
          answer:
            '根据您的简历，您的技能包括：' +
            (resume.skills || '未填写') +
            '。请详细说明您在这些技术方面的实践经验。',
          showAnswer: false,
        },
        {
          id: 3,
          question: '您的职业规划是什么？',
          answer:
            '作为一名' +
            (resume.basic.position || '求职者') +
            '，您未来的职业发展方向是什么？有哪些具体的计划？',
          showAnswer: false,
        },
      ]
    }

    hasClickedView.value = true
  } catch (error) {
    message.error((error as Error).message || '生成面试问题失败')
    console.error('生成面试问题失败:', error)
  } finally {
    isGeneratingQuestions.value = false
  }
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
const regenerateQuestions = async () => {
  showAllAnswers.value = false
  questions.value.forEach(q => {
    q.showAnswer = false
  })

  // 重新生成问题
  await handleViewQuestions()
}

/**
 * 第二个tab - 自己提问相关状态
 */
const userQuestion = ref('')
const generatedResult = ref('')
const isGenerating = ref(false)
const copySuccess = ref(false)

/**
 * 生成回答
 */
const generateUserAnswer = async () => {
  if (!userQuestion.value.trim()) return

  // 检查API Key是否配置
  if (!hasApiKey()) {
    message.error('请先在设置中配置API Key')
    return
  }

  isGenerating.value = true
  generatedResult.value = ''

  try {
    // 调用API生成回答
    const result = await generateAnswer(userQuestion.value)
    generatedResult.value = result
  } catch (error) {
    message.error((error as Error).message || '生成回答失败')
    console.error('生成回答失败:', error)
  } finally {
    isGenerating.value = false
  }
}

/**
 * 复制结果到剪贴板
 */
const copyResult = async () => {
  if (!generatedResult.value) return

  try {
    await navigator.clipboard.writeText(generatedResult.value)
    copySuccess.value = true
    message.success('复制成功')
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
const retryGenerate = async () => {
  generatedResult.value = ''
  await generateUserAnswer()
}
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
              @click="generateUserAnswer"
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
              <a-button @click="retryGenerate">重试</a-button>
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
