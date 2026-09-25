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
  TrophyOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons-vue'
import MarkdownIt from 'markdown-it'
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
 * 难度对应的 tag 颜色
 */
const difficultyColor = (d: string) =>
  d === 'easy' ? 'success' : d === 'hard' ? 'error' : 'warning'

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
 * 输入框键盘事件：Enter 发送、Shift+Enter 换行；
 * 中文输入法组词期间的 Enter 不触发发送（isComposing 判断）
 */
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault()
    handleSend()
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
    <header class="room-header">
      <div class="header-left">
        <a-button :icon="h(ArrowLeftOutlined)" @click="handleBack"
          >返回</a-button
        >
        <h2>面试间</h2>
        <a-tag v-if="phase === 'interviewing'" color="processing">
          第 {{ askedCount }} / {{ totalRounds }} 题
        </a-tag>
        <a-tag v-else-if="phase === 'finished'" color="success"
          >面试已结束</a-tag
        >
      </div>
      <div v-if="phase !== 'idle'" class="header-right">
        <clock-circle-outlined class="timer-icon" />
        <span class="timer-text">{{ elapsedText }}</span>
        <a-button
          v-if="phase === 'interviewing'"
          danger
          size="small"
          :disabled="thinking"
          @click="handleFinishClick"
          >结束面试</a-button
        >
      </div>
    </header>

    <!-- 欢迎页：面试配置摘要 + 开始按钮 -->
    <a-card v-if="phase === 'idle'" class="welcome-card">
      <div class="welcome">
        <robot-outlined class="welcome-icon" />
        <h3>准备开始模拟面试</h3>
        <p class="welcome-desc">
          AI 面试官将基于你的简历{{ jobType ? '与目标岗位' : '' }}进行
          多轮一对一模拟面试，结束后生成总结评价。
        </p>

        <div class="welcome-info">
          <div class="info-line">
            <span class="label">简历：</span>
            <span>{{ resume?.title || '加载中…' }}</span>
          </div>
          <div class="info-line">
            <span class="label">面试轮数：</span>
            <span>{{ questionCount }} 轮（动态出题）</span>
          </div>
          <div class="info-line">
            <span class="label">目标岗位：</span>
            <span>{{ jobType || '未指定' }}</span>
          </div>
          <div class="info-line">
            <span class="label">面试难度：</span>
            <span>{{ difficultyLabel(difficulty) }}</span>
          </div>
          <div v-if="hasJd" class="info-line jd-line">
            <span class="label">岗位 JD：</span>
            <pre class="jd-content">{{ jd }}</pre>
          </div>
        </div>

        <a-button
          type="primary"
          size="large"
          :loading="thinking"
          @click="handleStart"
          >开始面试</a-button
        >
      </div>
    </a-card>

    <!-- 面试进行中 / 已结束：聊天流 + 输入区 -->
    <template v-else>
      <div ref="chatContainerRef" class="chat-flow">
        <template v-for="msg in messages" :key="msg.id">
          <!-- 面试官（AI）消息：流式输出中（streaming）且尚无内容时显示思考态 -->
          <div v-if="msg.role === 'interviewer'" class="msg-row interviewer">
            <div class="avatar ai">
              <robot-outlined />
            </div>
            <div
              v-if="msg.streaming && !msg.content"
              class="bubble interviewer-bubble thinking-bubble"
            >
              <a-spin size="small" />
            </div>
            <div v-else class="bubble interviewer-bubble">
              {{ msg.content }}
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
          <div v-else-if="msg.role === 'evaluation'" class="msg-row evaluation">
            <div class="avatar ai">
              <robot-outlined />
            </div>
            <div class="eval-card">
              <div v-if="msg.streaming" class="eval-loading">
                <a-spin size="small" />
                <span>AI 正在评价你的回答…</span>
              </div>
              <template v-else-if="msg.evaluation">
                <div class="eval-header">
                  <span class="eval-round"
                    >第 {{ msg.evaluation.round }} 题评价</span
                  >
                  <a-tag :color="scoreColor(msg.evaluation.score)">
                    <trophy-outlined /> {{ msg.evaluation.score }} 分
                  </a-tag>
                </div>
                <div class="eval-feedback">{{ msg.evaluation.feedback }}</div>
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
                  <div class="eval-block-title"><warning-outlined /> 不足</div>
                  <ul>
                    <li v-for="(s, i) in msg.evaluation.weaknesses" :key="i">
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
                    <li v-for="(s, i) in msg.evaluation.suggestions" :key="i">
                      {{ s }}
                    </li>
                  </ul>
                </div>
              </template>
            </div>
          </div>

          <!-- 面试总结卡片 -->
          <div v-else class="summary-card">
            <div class="summary-title">
              <robot-outlined />
              <span>面试总结评价</span>
              <a-tag
                v-if="finalScore !== null"
                color="gold"
                class="summary-score"
              >
                <trophy-outlined /> 总分 {{ finalScore }}
              </a-tag>
            </div>
            <!-- 流式输出中（streaming）且尚无内容时显示思考态 -->
            <div v-if="msg.streaming && !msg.content" class="summary-loading">
              <a-spin size="small" />
              <span>正在生成面试总结…</span>
            </div>
            <!-- 内容为 AI 生成的 Markdown，经 markdown-it 渲染 -->
            <div
              v-else
              class="summary-body"
              v-html="renderMarkdown(msg.content)"
            ></div>
          </div>
        </template>
      </div>

      <div class="input-bar">
        <template v-if="phase === 'interviewing'">
          <a-textarea
            v-model:value="answerInput"
            :rows="4"
            :maxlength="2000"
            placeholder="输入你的回答（Enter 发送，Shift + Enter 换行）"
            @keydown="handleKeydown"
          />
          <a-button
            type="primary"
            :loading="thinking"
            :disabled="!answerInput.trim()"
            @click="handleSend"
            >发送</a-button
          >
        </template>

        <template v-else>
          <div class="finished-bar">
            <span class="finished-text"
              >本次面试已结束，用时 {{ elapsedText }}</span
            >
            <a-space>
              <a-button @click="handleRestart">重新面试</a-button>
              <a-button type="primary" @click="handleBack">返回配置页</a-button>
            </a-space>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.interview-room {
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  box-sizing: border-box;
}

.room-header {
  flex: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-left h2 {
  margin: 0;
  font-size: 1.6rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.timer-icon {
  font-size: 1.1rem;
}

.timer-text {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  font-size: 1.15rem;
}

/* ---------- 欢迎页 ---------- */
.welcome-card {
  margin: auto;
  width: 100%;
  max-width: 560px;
  border-radius: 1rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
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

.welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  padding: 2.4rem 1.6rem;
}

.welcome-icon {
  font-size: 3.5rem;
}

.welcome h3 {
  margin: 0;
  font-size: 1.5rem;
}

.welcome-desc {
  margin: 0;
  max-width: 520px;
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

.welcome-info {
  display: grid;
  gap: 0.5rem;
  max-width: 560px;
  width: 100%;
  padding: 1rem 1.2rem;
  border-radius: 0.8rem;
  text-align: left;
  @include themify(
    (
      background: (
        light: #f7f8fa,
        dark: rgba(255, 255, 255, 0.06),
      ),
    )
  );
}

.info-line {
  display: flex;
  gap: 0.5rem;
}

.info-line .label {
  color: rgba(0, 0, 0, 0.45);
  flex: none;
  @include themify(
    (
      color: (
        light: rgba(0, 0, 0, 0.45),
        dark: rgba(255, 255, 255, 0.45),
      ),
    )
  );
}

.jd-line {
  flex-direction: column;
}

.jd-content {
  margin: 0;
  padding: 0.6rem 0.8rem;
  border-radius: 0.6rem;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  line-height: 1.7;
  max-height: 160px;
  overflow-y: auto;
  @include themify(
    (
      background: (
        light: #fff,
        dark: rgba(255, 255, 255, 0.06),
      ),
      color: (
        light: #333,
        dark: rgba(255, 255, 255, 0.85),
      ),
    )
  );
}

/* ---------- 聊天流 ---------- */
.chat-flow {
  flex: 1;
  overflow-y: auto;
  padding: 1.2rem;
  border-radius: 1rem;
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

.msg-row {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.msg-row.interviewer,
.msg-row.evaluation {
  justify-content: flex-start;
}

.msg-row.candidate {
  justify-content: flex-end;
}

.avatar {
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.1rem;
}

.avatar.ai {
  background: #1677ff;
}

.avatar.user {
  background: #52c41a;
}

.bubble {
  max-width: 72%;
  padding: 0.7rem 1rem;
  border-radius: 0.8rem;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.7;
}

.interviewer-bubble {
  @include themify(
    (
      background: (
        light: #f4f5f7,
        dark: rgba(255, 255, 255, 0.08),
      ),
      color: (
        light: #333,
        dark: rgba(255, 255, 255, 0.88),
      ),
    )
  );
}

.candidate-bubble {
  @include themify(
    (
      background: (
        light: #e6f4ff,
        dark: rgba(22, 119, 255, 0.25),
      ),
      color: (
        light: #1f2d3d,
        dark: rgba(255, 255, 255, 0.92),
      ),
    )
  );
}

.thinking-bubble {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

/* ---------- 题目元信息 ---------- */
.q-meta {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}

.ref-answer {
  margin-top: 0.6rem;

  :deep(.ant-collapse-header) {
    padding: 0.3rem 0;
    font-size: 0.85rem;
  }
}

/* ---------- 评价卡片 ---------- */
.eval-card {
  max-width: 72%;
  padding: 0.8rem 1rem;
  border-radius: 0.8rem;
  border: 1px solid;
  @include themify(
    (
      background: (
        light: #fafafa,
        dark: rgba(255, 255, 255, 0.04),
      ),
      border-color: (
        light: #e8e8e8,
        dark: rgba(255, 255, 255, 0.12),
      ),
    )
  );
}

.eval-loading {
  display: flex;
  align-items: center;
  gap: 0.6rem;
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

.eval-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.5rem;
}

.eval-round {
  font-weight: 600;
}

.eval-feedback {
  line-height: 1.7;
  margin-bottom: 0.6rem;
}

.eval-block {
  margin-top: 0.5rem;
}

.eval-block-title {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.3rem;
}

.eval-good .eval-block-title {
  color: #52c41a;
}

.eval-bad .eval-block-title {
  color: #ff4d4f;
}

.eval-tip .eval-block-title {
  color: #faad14;
}

.eval-block ul {
  margin: 0;
  padding-left: 1.2rem;
}

.eval-block li {
  margin: 0.2rem 0;
  line-height: 1.6;
}

/* ---------- 总结卡片 ---------- */
.summary-card {
  margin: 1.2rem 0;
  padding: 1rem 1.2rem;
  border-radius: 0.8rem;
  border: 1px solid;
  @include themify(
    (
      background: (
        light: #f7f8fa,
        dark: rgba(255, 255, 255, 0.06),
      ),
      border-color: (
        light: #91caff,
        dark: rgba(22, 119, 255, 0.45),
      ),
    )
  );
}

.summary-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.summary-score {
  margin-left: auto;
}

.summary-loading {
  display: flex;
  align-items: center;
  gap: 0.6rem;
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

.summary-body {
  line-height: 1.8;
  word-break: break-word;

  :deep(h2) {
    font-size: 1.1rem;
    margin: 0.8rem 0 0.4rem;
  }

  :deep(p) {
    margin: 0.4rem 0;
  }

  :deep(ul) {
    margin: 0.4rem 0;
    padding-left: 1.4rem;
  }

  :deep(li) {
    margin: 0.2rem 0;
  }
}

/* ---------- 输入区 ---------- */
.input-bar {
  flex: none;
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
}

.finished-bar {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.7rem 1rem;
  border-radius: 0.8rem;
  @include themify(
    (
      background: (
        light: #f4f5f7,
        dark: rgba(255, 255, 255, 0.08),
      ),
    )
  );
}

.finished-text {
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

@media screen and (max-width: 700px) {
  .bubble,
  .eval-card {
    max-width: 86%;
  }
}
</style>
