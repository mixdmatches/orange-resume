<script setup lang="ts">
import { computed, h, nextTick, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import {
  ArrowLeftOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RobotOutlined,
  StopOutlined,
  TrophyOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons-vue'
import MarkdownIt from 'markdown-it'
import ChatInput from '@/components/ChatInput.vue'
import { useInterviewStore } from '@/stores/interview'
import { getResumeByIdIDB } from '@/service/resumeIDB'
import { useInterviewSession } from './composables/useInterviewSession'
import type { Resume } from '@/types/resume'

const router = useRouter()
const interviewStore = useInterviewStore()
const { jobType, jd, difficulty, questionCount, category, interviewId } =
  storeToRefs(interviewStore)
const resume = ref<Resume | null>(null)

/** 面试会话状态机（聊天流、计时器、AI 交互） */
const {
  phase,
  messages,
  thinking,
  askedCount,
  totalRounds,
  finalScore,
  elapsedText,
  start,
  submitAnswer,
  finish,
  reset,
} = useInterviewSession({
  resume,
  jobType,
  jd,
  difficulty,
  questionCount,
  category,
  interviewId,
})

/** 候选人正在输入的回答 */
const answerInput = ref('')
/** 聊天流滚动容器，用于自动滚动到底部 */
const chatContainerRef = ref<HTMLElement | null>(null)

/** markdown-it 实例：用于渲染面试总结与参考答案 */
const md = new MarkdownIt({ breaks: true, linkify: true })

/** 是否配置了岗位 JD */
const hasJd = computed(() => !!jd.value)

/**
 * 渲染 Markdown 文本为 HTML（面试总结卡片、参考答案使用）
 */
const renderMarkdown = (content: string) => md.render(content)

/**
 * 评分对应的 tag 颜色（80+绿、60+蓝、低于 60 红）
 */
const scoreColor = (score: number) =>
  score >= 80 ? 'success' : score >= 60 ? 'processing' : 'error'

/**
 * 难度中文标签
 */
const difficultyLabel = (d: string) =>
  d === 'easy' ? '简单' : d === 'hard' ? '困难' : '中等'

/**
 * 聊天流自动滚动到底部：新消息或"思考中"状态变化时触发
 */
watch(
  () => [messages.value.length, thinking.value],
  () => {
    nextTick(() => {
      const el = chatContainerRef.value
      if (el) el.scrollTop = el.scrollHeight
    })
  },
)

/**
 * 返回面试配置页
 */
const handleBack = async () => {
  router.push('/ai-interview')
}

/**
 * 点击"开始面试"：调用会话启动逻辑并提示失败原因
 */
const handleStart = async () => {
  try {
    await start()
  } catch (error) {
    message.error((error as Error).message || '启动面试失败，请稍后重试')
  }
}

/**
 * 发送回答：成功后清空输入框，失败时提示原因（输入保留）
 */
const handleSend = async () => {
  const text = answerInput.value.trim()
  if (!text) return
  try {
    await submitAnswer(text)
    answerInput.value = ''
  } catch (error) {
    message.error((error as Error).message || '发送失败，请稍后重试')
  }
}

/**
 * 点击"结束面试"：二次确认后生成总结评价
 */
const handleFinishClick = () => {
  Modal.confirm({
    title: '确定要提前结束面试吗？',
    content: '结束后 AI 将根据当前对话生成总结评价。',
    okText: '结束面试',
    cancelText: '继续面试',
    onOk: async () => {
      try {
        await finish()
      } catch (error) {
        message.error((error as Error).message || '生成总结失败，请稍后重试')
      }
    },
  })
}

/**
 * 重新面试：回到欢迎页并清空会话数据
 */
const handleRestart = () => {
  reset()
}

/** 加载当前面试会话关联的简历，无会话时退回配置页 */
const loadResume = async () => {
  if (!interviewStore.resumeId) {
    message.warning('请先选择简历并发起面试')
    router.replace('/ai-interview')
    return
  }
  try {
    resume.value = await getResumeByIdIDB(interviewStore.resumeId)
  } catch {
    message.error('读取简历失败，请返回重试')
  }
}

onMounted(loadResume)
</script>

<template>
  <div class="interview-room">
    <!-- 极简 header：56px 高，左返回 + 标题，右计时器 + 结束 -->
    <header class="room-header">
      <div class="header-left">
        <button class="icon-btn" title="返回" @click="handleBack">
          <arrow-left-outlined />
        </button>
        <h1 class="room-title">面试间</h1>
        <span
          v-if="phase === 'interviewing'"
          class="phase-tag phase-tag-active"
        >
          第 {{ askedCount }} / {{ totalRounds }} 题
        </span>
        <span v-else-if="phase === 'finished'" class="phase-tag phase-tag-done">
          已结束
        </span>
      </div>
      <div v-if="phase !== 'idle'" class="header-right">
        <clock-circle-outlined class="timer-icon" />
        <span class="timer-text">{{ elapsedText }}</span>
        <a-button
          v-if="phase === 'interviewing'"
          danger
          size="small"
          @click="handleFinishClick"
          >结束面试</a-button
        >
      </div>
    </header>

    <!-- 欢迎页：配置摘要 + 开始按钮（居中卡片） -->
    <main v-if="phase === 'idle'" class="welcome-wrap">
      <div class="welcome-card">
        <div class="welcome-icon">
          <robot-outlined />
        </div>
        <h2 class="welcome-title">准备开始模拟面试</h2>
        <p class="welcome-desc">
          AI 面试官将基于你的简历{{
            jobType ? '与目标岗位' : ''
          }}进行多轮一对一模拟面试，结束后生成总结评价。
        </p>

        <div class="welcome-info">
          <div class="info-line">
            <span class="label">简历</span>
            <span class="value">{{ resume?.title || '加载中…' }}</span>
          </div>
          <div class="info-line">
            <span class="label">轮数</span>
            <span class="value">{{ questionCount }} 轮（动态出题）</span>
          </div>
          <div class="info-line">
            <span class="label">岗位</span>
            <span class="value">{{ jobType || '未指定' }}</span>
          </div>
          <div class="info-line">
            <span class="label">难度</span>
            <span class="value">{{ difficultyLabel(difficulty) }}</span>
          </div>
          <div v-if="hasJd" class="info-line info-line-full">
            <span class="label">岗位 JD</span>
            <pre class="jd-content">{{ jd }}</pre>
          </div>
        </div>

        <a-button
          type="primary"
          size="large"
          :loading="thinking"
          class="welcome-start"
          @click="handleStart"
          >开始面试</a-button
        >
      </div>
    </main>

    <!-- 面试进行中 / 已结束：聊天流 + 输入区 -->
    <template v-else>
      <div ref="chatContainerRef" class="chat-flow">
        <div class="chat-inner">
          <template v-for="msg in messages" :key="msg.id">
            <!-- 面试官（AI）消息 -->
            <div v-if="msg.role === 'interviewer'" class="msg-row interviewer">
              <div class="avatar ai">
                <robot-outlined />
              </div>
              <div class="msg-main">
                <!-- typing 三点动画（streaming 且无内容时） -->
                <div
                  v-if="msg.streaming && !msg.content"
                  class="bubble interviewer-bubble thinking-bubble"
                >
                  <span class="typing-dots"> <i></i><i></i><i></i> </span>
                </div>
                <div v-else class="bubble interviewer-bubble">
                  {{ msg.content }}
                </div>
                <div v-if="msg.stopped" class="stop-tip">
                  <stop-outlined />
                  <span>已手动停止生成</span>
                </div>
              </div>
            </div>

            <!-- 候选人（用户）消息 -->
            <div v-else-if="msg.role === 'candidate'" class="msg-row candidate">
              <div class="bubble candidate-bubble">{{ msg.content }}</div>
              <div class="avatar user">
                <user-outlined />
              </div>
            </div>

            <!-- 单题评价卡片 -->
            <div
              v-else-if="msg.role === 'evaluation'"
              class="msg-row evaluation"
            >
              <div class="avatar ai">
                <robot-outlined />
              </div>
              <div class="msg-main">
                <div class="eval-card">
                  <!-- 评价生成中：typing 三点 -->
                  <div v-if="msg.streaming" class="eval-loading">
                    <span class="typing-dots"> <i></i><i></i><i></i> </span>
                    <span>AI 正在评价你的回答</span>
                  </div>
                  <template v-else-if="msg.evaluation">
                    <div class="eval-header">
                      <span class="eval-round"
                        >第 {{ msg.evaluation.round }} 题评价</span
                      >
                      <span
                        class="eval-score"
                        :class="scoreColor(msg.evaluation.score)"
                      >
                        <trophy-outlined /> {{ msg.evaluation.score }} 分
                      </span>
                    </div>
                    <div class="eval-feedback">
                      {{ msg.evaluation.feedback }}
                    </div>
                    <div
                      v-if="msg.evaluation.strengths.length"
                      class="eval-block eval-good"
                    >
                      <div class="eval-block-title">
                        <check-circle-outlined /> 亮点
                      </div>
                      <ul>
                        <li v-for="(s, i) in msg.evaluation.strengths" :key="i">
                          {{ s }}
                        </li>
                      </ul>
                    </div>
                    <div
                      v-if="msg.evaluation.weaknesses.length"
                      class="eval-block eval-bad"
                    >
                      <div class="eval-block-title">
                        <warning-outlined /> 不足
                      </div>
                      <ul>
                        <li
                          v-for="(s, i) in msg.evaluation.weaknesses"
                          :key="i"
                        >
                          {{ s }}
                        </li>
                      </ul>
                    </div>
                    <div
                      v-if="msg.evaluation.suggestions.length"
                      class="eval-block eval-tip"
                    >
                      <div class="eval-block-title"><bulb-outlined /> 建议</div>
                      <ul>
                        <li
                          v-for="(s, i) in msg.evaluation.suggestions"
                          :key="i"
                        >
                          {{ s }}
                        </li>
                      </ul>
                    </div>
                  </template>
                </div>
                <div v-if="msg.stopped" class="stop-tip">
                  <stop-outlined />
                  <span>已手动停止生成</span>
                </div>
              </div>
            </div>

            <!-- 面试总结卡片 -->
            <div v-else class="summary-card">
              <div class="summary-title">
                <robot-outlined />
                <span>面试总结评价</span>
                <span v-if="finalScore !== null" class="summary-score">
                  <trophy-outlined /> 总分 {{ finalScore }}
                </span>
              </div>
              <!-- 总结生成中：typing 三点 -->
              <div v-if="msg.streaming && !msg.content" class="summary-loading">
                <span class="typing-dots"> <i></i><i></i><i></i> </span>
                <span>正在生成面试总结</span>
              </div>
              <div
                v-else
                class="summary-body"
                v-html="renderMarkdown(msg.content)"
              ></div>
              <div v-if="msg.stopped" class="stop-tip">
                <stop-outlined />
                <span>已手动停止生成</span>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div class="input-bar">
        <div class="input-inner">
          <template v-if="phase === 'interviewing'">
            <ChatInput
              v-model:value="answerInput"
              :loading="thinking"
              :min-rows="2"
              :max-rows="6"
              :maxlength="2000"
              placeholder="输入你的回答…"
              hint="Enter 发送，Shift + Enter 换行"
              :show-stop="false"
              @send="handleSend"
            />
          </template>

          <template v-else>
            <div class="finished-bar">
              <span class="finished-text"
                >本次面试已结束，用时 {{ elapsedText }}</span
              >
              <a-space>
                <a-button @click="handleRestart">重新面试</a-button>
                <a-button type="primary" @click="handleBack"
                  >返回配置页</a-button
                >
              </a-space>
            </div>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
/* ============ 全屏布局 ============ */
.interview-room {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-subtle);
}

/* ============ 极简 Header（56px） ============ */
.room-header {
  flex: none;
  height: var(--header-height);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 var(--space-6);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.room-title {
  margin: 0;
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text);
}

.phase-tag {
  font-size: var(--text-xs);
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
  font-variant-numeric: tabular-nums;

  &.phase-tag-active {
    color: var(--color-primary);
    background: var(--color-primary-bg);
  }

  &.phase-tag-done {
    color: var(--color-success);
    background: var(--color-success-bg);
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.timer-icon {
  font-size: var(--text-base);
  color: var(--color-text-tertiary);
}

.timer-text {
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-right: var(--space-2);
}

/* ============ 欢迎页（居中卡片） ============ */
.welcome-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-6);
  overflow-y: auto;
}

.welcome-card {
  width: 100%;
  max-width: 560px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  padding: var(--space-10) var(--space-8);
  text-align: center;
  animation: fade-up var(--duration-normal) var(--ease-out);
}

.welcome-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto var(--space-4);
  border-radius: var(--radius-full);
  background: var(--color-primary-bg);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.welcome-title {
  margin: 0 0 var(--space-2);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--color-text);
}

.welcome-desc {
  margin: 0 0 var(--space-6);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
  font-size: var(--text-sm);
}

.welcome-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  text-align: left;
  padding: var(--space-5);
  margin-bottom: var(--space-6);
  background: var(--color-bg-muted);
  border-radius: var(--radius-lg);
}

.info-line {
  display: flex;
  flex-direction: column;
  gap: 2px;

  &.info-line-full {
    grid-column: 1 / -1;
  }

  .label {
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
  }

  .value {
    font-size: var(--text-sm);
    color: var(--color-text);
    font-weight: var(--font-medium);
  }
}

.jd-content {
  margin: 0;
  padding: var(--space-2) var(--space-3);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  line-height: var(--leading-relaxed);
  max-height: 160px;
  overflow-y: auto;
  color: var(--color-text-secondary);
}

.welcome-start {
  min-width: 200px;
}

/* ============ 聊天流（居中 820px 容器） ============ */
.chat-flow {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-6) var(--space-6);
}

.chat-inner {
  max-width: 820px;
  margin: 0 auto;
}

.msg-row {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
  animation: fade-up var(--duration-normal) var(--ease-out);

  &.interviewer,
  &.evaluation {
    justify-content: flex-start;
  }

  &.candidate {
    justify-content: flex-end;
  }
}

.msg-main {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  max-width: 76%;
}

/* 手动停止生成提示行 */
.stop-tip {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-top: var(--space-1);
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

/* 头像：AI 主色，用户 灰色 */
.avatar {
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: var(--text-base);

  &.ai {
    background: var(--color-primary);
  }

  &.user {
    background: var(--color-text-tertiary);
  }
}

/* 气泡 */
.bubble {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  white-space: pre-wrap;
  word-break: break-word;
  line-height: var(--leading-relaxed);
  font-size: var(--text-sm);
}

.interviewer-bubble {
  background: var(--color-bg-muted);
  color: var(--color-text);
  border-bottom-left-radius: var(--space-1);
}

.candidate-bubble {
  background: var(--color-primary);
  color: #fff;
  border-bottom-right-radius: var(--space-1);
}

.thinking-bubble {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* typing 三点动画 */
.typing-dots {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  i {
    width: 6px;
    height: 6px;
    border-radius: var(--radius-full);
    background: currentColor;
    opacity: 0.4;
    animation: typing-bounce 1.4s infinite var(--ease-in-out);

    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes typing-bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

/* ============ 评价卡片 ============ */
.eval-card {
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  width: 100%;
}

.eval-loading {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}

.eval-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.eval-round {
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  color: var(--color-text);
}

.eval-score {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
  margin-left: auto;

  &.success {
    color: var(--color-success);
    background: var(--color-success-bg);
  }
  &.processing {
    color: var(--color-primary);
    background: var(--color-primary-bg);
  }
  &.error {
    color: var(--color-danger);
    background: var(--color-danger-bg);
  }
}

.eval-feedback {
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-3);
  color: var(--color-text);
  font-size: var(--text-sm);
}

.eval-block {
  margin-top: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-border);
}

.eval-block-title {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  margin-bottom: var(--space-1);
}

.eval-good .eval-block-title {
  color: var(--color-success);
}
.eval-bad .eval-block-title {
  color: var(--color-danger);
}
.eval-tip .eval-block-title {
  color: var(--color-warning);
}

.eval-block ul {
  margin: 0;
  padding-left: var(--space-5);
}

.eval-block li {
  margin: var(--space-1) 0;
  line-height: var(--leading-normal);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

/* ============ 总结卡片 ============ */
.summary-card {
  margin: var(--space-5) 0;
  padding: var(--space-5) var(--space-6);
  border-radius: var(--radius-lg);
  background: var(--color-primary-bg);
  border: 1px solid var(--color-primary-border);
}

.summary-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: var(--font-semibold);
  font-size: var(--text-base);
  color: var(--color-text);
  margin-bottom: var(--space-3);
}

.summary-score {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  padding: 2px var(--space-3);
  border-radius: var(--radius-full);
  color: var(--color-warning);
  background: var(--color-warning-bg);
}

.summary-loading {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}

.summary-body {
  line-height: var(--leading-relaxed);
  word-break: break-word;
  color: var(--color-text);
  font-size: var(--text-sm);

  :deep(h2) {
    font-size: var(--text-base);
    font-weight: var(--font-semibold);
    margin: var(--space-3) 0 var(--space-2);
  }

  :deep(p) {
    margin: var(--space-2) 0;
  }

  :deep(ul) {
    margin: var(--space-2) 0;
    padding-left: var(--space-5);
  }

  :deep(li) {
    margin: var(--space-1) 0;
  }

  :deep(code) {
    padding: 2px var(--space-1);
    border-radius: var(--radius-sm);
    background: var(--color-bg-muted);
    font-family: var(--font-mono);
    font-size: 0.9em;
  }
}

/* ============ 输入区（居中 820px） ============ */
.input-bar {
  flex: none;
  padding: var(--space-3) var(--space-6) var(--space-5);
  background: var(--color-bg-subtle);
  border-top: 1px solid var(--color-border);
}

.input-inner {
  max-width: 820px;
  margin: 0 auto;
}

.finished-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--color-bg-muted);
}

.finished-text {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

/* ============ 响应式 ============ */
@media (max-width: 768px) {
  .room-header {
    padding: 0 var(--space-4);
    gap: var(--space-2);
    flex-wrap: wrap;
    height: auto;
    min-height: var(--header-height);
    padding-top: var(--space-2);
    padding-bottom: var(--space-2);
  }

  .chat-flow {
    padding: var(--space-4);
  }

  .input-bar {
    padding: var(--space-3) var(--space-4);
  }

  .msg-main,
  .bubble {
    max-width: 100%;
  }

  .welcome-info {
    grid-template-columns: 1fr;
  }

  .welcome-card {
    padding: var(--space-6) var(--space-4);
  }
}
</style>
