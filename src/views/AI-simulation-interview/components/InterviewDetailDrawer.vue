<script setup lang="ts">
import {
  BulbOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  WarningOutlined,
} from '@ant-design/icons-vue'
import MarkdownIt from 'markdown-it'
import type { InterviewDetail } from '@/types/interview'

/** 面试详情抽屉 Props */
const props = defineProps<{
  /** 抽屉是否打开（v-model:open） */
  open: boolean
  /** 面试详情数据 */
  detail: InterviewDetail | null
  /** 是否正在加载 */
  loading: boolean
}>()

/** 面试详情抽屉 Emits */
const emit = defineEmits<{
  /** v-model:open 更新 */
  (e: 'update:open', value: boolean): void
}>()

/** markdown-it 实例：渲染面试总结与参考答案 */
const md = new MarkdownIt({ breaks: true, linkify: true })

/**
 * 渲染 Markdown 文本为 HTML
 */
const renderMarkdown = (content: string) => md.render(content)

/**
 * 评分对应的颜色（80+绿、60+蓝、低于 60 红）
 */
const scoreColor = (score: number) =>
  score >= 80 ? '#52c41a' : score >= 60 ? '#1677ff' : '#ff4d4f'

/**
 * 评分对应的 tag 颜色
 */
const scoreTagColor = (score: number) =>
  score >= 80 ? 'success' : score >= 60 ? 'processing' : 'error'

/**
 * 难度中文标签
 */
const difficultyLabel = (d: string) =>
  d === 'easy' ? '简单' : d === 'hard' ? '困难' : '中等'

/**
 * 难度对应的 tag 颜色
 */
const difficultyColor = (d: string) =>
  d === 'easy' ? 'success' : d === 'hard' ? 'error' : 'warning'

/**
 * 面试状态中文标签
 */
const statusLabel = (status: string) => {
  if (status === 'finished') return '已结束'
  if (status === 'in_progress') return '进行中'
  return '待开始'
}

/**
 * 面试状态对应的 tag 颜色
 */
const statusColor = (status: string) => {
  if (status === 'finished') return 'success'
  if (status === 'in_progress') return 'processing'
  return 'default'
}

/**
 * 格式化耗时（秒 → mm:ss 或 X分Y秒）
 */
const formatDuration = (sec: number | null) => {
  if (sec === null || sec === undefined) return '—'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m} 分 ${s} 秒` : `${s} 秒`
}

/**
 * 从详情中按题号查找回答
 */
const getAnswer = (detail: InterviewDetail, round: number) =>
  detail.answers.find(a => a.roundIndex === round)?.content

/**
 * 从详情中按题号查找评价
 */
const getEvaluation = (detail: InterviewDetail, round: number) =>
  detail.evaluations.find(e => e.roundIndex === round)

/**
 * 默认展开第一题
 */
const defaultOpenKeys = (detail: InterviewDetail) =>
  detail.questions.length > 0 ? [String(detail.questions[0].roundIndex)] : []
</script>

<template>
  <a-drawer
    :open="open"
    title="面试详情"
    placement="right"
    width="860"
    @update:open="emit('update:open', $event)"
  >
    <a-spin :spinning="loading">
      <div v-if="detail" class="detail-root">
        <!-- 顶部概要 -->
        <a-descriptions :column="2" size="small" bordered class="detail-meta">
          <a-descriptions-item label="岗位">
            {{ detail.jobTitle || '未指定' }}
          </a-descriptions-item>
          <a-descriptions-item label="难度">
            <a-tag :color="difficultyColor(detail.difficulty)">
              {{ difficultyLabel(detail.difficulty) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="statusColor(detail.status)">
              {{ statusLabel(detail.status) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="题数">
            {{ detail.answeredRounds }}/{{ detail.totalRounds }}
          </a-descriptions-item>
          <a-descriptions-item label="总分">
            <span v-if="detail.totalScore !== null" class="detail-score">
              {{ detail.totalScore }}
            </span>
            <span v-else>未评分</span>
          </a-descriptions-item>
          <a-descriptions-item label="用时">
            {{ formatDuration(detail.durationSec) }}
          </a-descriptions-item>
        </a-descriptions>

        <!-- 总评分卡 -->
        <div v-if="detail.scoreDetail" class="score-card">
          <div class="card-section-title">
            <trophy-outlined />
            <span>总评</span>
          </div>
          <div class="score-overall">
            综合得分
            <span class="score-number">{{
              detail.scoreDetail.overallScore
            }}</span>
            分
          </div>

          <!-- 分维度评分进度条 -->
          <div class="dim-list">
            <div
              v-for="dim in detail.scoreDetail.dimensions"
              :key="dim.name"
              class="dim-item"
            >
              <div class="dim-header">
                <span class="dim-name">{{ dim.name }}</span>
                <span
                  class="dim-score"
                  :style="{ color: scoreColor(dim.score) }"
                >
                  {{ dim.score }} 分
                </span>
              </div>
              <a-progress
                :percent="dim.score"
                :stroke-color="scoreColor(dim.score)"
                :show-info="false"
                size="small"
              />
              <div class="dim-comment">{{ dim.comment }}</div>
            </div>
          </div>

          <!-- 亮点 / 不足 / 建议 -->
          <div
            v-if="detail.scoreDetail.strengths.length"
            class="score-block good"
          >
            <div class="block-title"><check-circle-outlined /> 亮点</div>
            <ul>
              <li v-for="(s, i) in detail.scoreDetail.strengths" :key="i">
                {{ s }}
              </li>
            </ul>
          </div>
          <div
            v-if="detail.scoreDetail.weaknesses.length"
            class="score-block bad"
          >
            <div class="block-title"><warning-outlined /> 不足</div>
            <ul>
              <li v-for="(s, i) in detail.scoreDetail.weaknesses" :key="i">
                {{ s }}
              </li>
            </ul>
          </div>
          <div
            v-if="detail.scoreDetail.suggestions.length"
            class="score-block tip"
          >
            <div class="block-title"><bulb-outlined /> 改进建议</div>
            <ul>
              <li v-for="(s, i) in detail.scoreDetail.suggestions" :key="i">
                {{ s }}
              </li>
            </ul>
          </div>

          <!-- 最终结论 -->
          <div class="verdict">
            <div class="block-title">面试结论</div>
            <p>{{ detail.scoreDetail.finalVerdict }}</p>
          </div>
        </div>

        <!-- 总结 Markdown -->
        <div v-if="detail.summary" class="summary-section">
          <div class="card-section-title">
            <check-circle-outlined />
            <span>面试总结</span>
          </div>
          <div
            class="markdown-body"
            v-html="renderMarkdown(detail.summary)"
          ></div>
        </div>

        <!-- 每题详情 -->
        <div class="rounds-section">
          <div class="card-section-title">
            <bulb-outlined />
            <span>题目详情</span>
          </div>
          <a-collapse :default-active-key="defaultOpenKeys(detail)">
            <a-collapse-panel
              v-for="q in detail.questions"
              :key="String(q.roundIndex)"
              :header="`第 ${q.roundIndex} 题`"
            >
              <!-- 题目 -->
              <div class="round-section question">
                <div class="section-label">题目</div>
                <div class="section-body">{{ q.question }}</div>
              </div>

              <!-- 回答 -->
              <div
                v-if="getAnswer(detail, q.roundIndex)"
                class="round-section answer"
              >
                <div class="section-label">你的回答</div>
                <div class="section-body">
                  {{ getAnswer(detail, q.roundIndex) }}
                </div>
              </div>

              <!-- 评价 -->
              <div
                v-if="getEvaluation(detail, q.roundIndex)"
                class="round-section eval"
              >
                <div class="section-label">评价</div>
                <div class="section-body">
                  <a-tag
                    :color="
                      scoreTagColor(getEvaluation(detail, q.roundIndex)!.score)
                    "
                  >
                    {{ getEvaluation(detail, q.roundIndex)!.score }} 分
                  </a-tag>
                  <p class="eval-feedback">
                    {{ getEvaluation(detail, q.roundIndex)!.feedback }}
                  </p>
                  <div
                    v-if="getEvaluation(detail, q.roundIndex)!.strengths.length"
                  >
                    <strong>亮点：</strong>
                    <ul>
                      <li
                        v-for="(s, i) in getEvaluation(detail, q.roundIndex)!
                          .strengths"
                        :key="i"
                      >
                        {{ s }}
                      </li>
                    </ul>
                  </div>
                  <div
                    v-if="
                      getEvaluation(detail, q.roundIndex)!.weaknesses.length
                    "
                  >
                    <strong>不足：</strong>
                    <ul>
                      <li
                        v-for="(s, i) in getEvaluation(detail, q.roundIndex)!
                          .weaknesses"
                        :key="i"
                      >
                        {{ s }}
                      </li>
                    </ul>
                  </div>
                  <div
                    v-if="
                      getEvaluation(detail, q.roundIndex)!.suggestions.length
                    "
                  >
                    <strong>建议：</strong>
                    <ul>
                      <li
                        v-for="(s, i) in getEvaluation(detail, q.roundIndex)!
                          .suggestions"
                        :key="i"
                      >
                        {{ s }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </a-collapse-panel>
          </a-collapse>
        </div>
      </div>

      <a-empty v-else-if="!loading" description="未加载到详情" />
    </a-spin>
  </a-drawer>
</template>

<style scoped lang="scss">
.detail-root {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.card-section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.8rem;
}

/* ---------- 概要 ---------- */
.detail-meta {
  margin-bottom: 0.6rem;
}

.detail-score {
  font-weight: 700;
  font-size: 1.2rem;
  color: #fa8c16;
}

/* ---------- 总评卡 ---------- */
.score-card {
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
        light: #e8e8e8,
        dark: rgba(255, 255, 255, 0.12),
      ),
    )
  );
}

.score-overall {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.score-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fa8c16;
}

.dim-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.dim-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.2rem;
}

.dim-name {
  font-weight: 500;
}

.dim-score {
  font-weight: 600;
}

.dim-comment {
  font-size: 0.85rem;
  margin-top: 0.2rem;
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

.score-block {
  margin-top: 0.8rem;
}

.block-title {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.3rem;
}

.score-block.good .block-title {
  color: #52c41a;
}

.score-block.bad .block-title {
  color: #ff4d4f;
}

.score-block.tip .block-title {
  color: #faad14;
}

.score-block ul {
  margin: 0;
  padding-left: 1.2rem;
}

.score-block li {
  margin: 0.2rem 0;
  line-height: 1.6;
}

.verdict {
  margin-top: 1rem;
  padding-top: 0.8rem;
  border-top: 1px solid;
  @include themify(
    (
      border-color: (
        light: #e8e8e8,
        dark: rgba(255, 255, 255, 0.12),
      ),
    )
  );
}

.verdict .block-title {
  margin-bottom: 0.4rem;
}

.verdict p {
  margin: 0;
  line-height: 1.7;
}

/* ---------- 总结 ---------- */
.summary-section {
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
        light: #e8e8e8,
        dark: rgba(255, 255, 255, 0.12),
      ),
    )
  );
}

.markdown-body {
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
}

/* ---------- 题目详情 ---------- */
.rounds-section {
  .section-title {
    margin-bottom: 0.6rem;
  }
}

.round-section {
  margin-bottom: 0.8rem;
}

.section-label {
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 0.3rem;
  color: rgba(0, 0, 0, 0.45);
  @include themify(
    (
      color: (
        light: rgba(0, 0, 0, 0.45),
        dark: rgba(255, 255, 255, 0.45),
      ),
    )
  );
}

.section-body {
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.section-tags {
  margin-top: 0.3rem;
}

.eval-feedback {
  margin: 0.4rem 0;
}

.ref-collapse {
  margin-top: 0.4rem;

  :deep(.ant-collapse-header) {
    padding: 0.3rem 0;
    font-size: 0.85rem;
  }
}
</style>
