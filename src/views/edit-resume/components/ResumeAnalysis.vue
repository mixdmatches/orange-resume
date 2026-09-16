<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { message } from 'ant-design-vue'
import { motion } from 'motion-v'
import type { Resume } from '@/types/resume'
import {
  analyzeResume,
  type IssueLevel,
  type ResumeAnalysisResult,
} from '@/utils/resumeAnalysis'
import {
  CheckCircleFilled,
  WarningFilled,
  InfoCircleFilled,
  CloseCircleFilled,
  StarFilled,
  RocketFilled,
  BulbFilled,
} from '@ant-design/icons-vue'
import { hasApiKey } from '@/api'
import type { ResumeScoreResult } from '@/types/ai'
import { resumeToText } from '@/utils/resumeToText'
import { scoreResumeApi } from '@/api'

/**
 * 接收简历数据（优先用 inject，便于复用）
 */
const resume = inject<Resume>('resume') as Resume

/**
 * 计算简历分析结果（响应式，简历变动会自动重算）
 */
const analysisResult = computed<ResumeAnalysisResult>(() =>
  analyzeResume(resume),
)

/**
 * 按等级分组问题
 */
const groupedIssues = computed(() => {
  const groups: Record<IssueLevel, { message: string; sectionId?: string }[]> =
    {
      error: [],
      warning: [],
      info: [],
    }
  // 全局问题
  analysisResult.value.globalIssues.forEach(i => {
    groups[i.level].push({ message: i.message, sectionId: i.sectionId })
  })
  // 各模块问题
  analysisResult.value.sections.forEach(section => {
    section.issues.forEach(i => {
      groups[i.level].push({ message: i.message, sectionId: i.sectionId })
    })
  })
  return groups
})

/**
 * 等级配置（颜色与图标）
 */
const levelConfig: Record<
  IssueLevel,
  { color: string; bg: string; icon: typeof WarningFilled; label: string }
> = {
  error: {
    color: '#ff4d4f',
    bg: 'rgba(255, 77, 79, 0.1)',
    icon: CloseCircleFilled,
    label: '严重缺失',
  },
  warning: {
    color: '#faad14',
    bg: 'rgba(250, 173, 20, 0.1)',
    icon: WarningFilled,
    label: '建议完善',
  },
  info: {
    color: '#1677ff',
    bg: 'rgba(22, 119, 255, 0.1)',
    icon: InfoCircleFilled,
    label: '温馨提示',
  },
}

/**
 * 根据完成度返回颜色
 */
function getCompletenessColor(value: number): string {
  if (value >= 90) return '#52c41a'
  if (value >= 75) return '#1677ff'
  if (value >= 50) return '#faad14'
  return '#ff4d4f'
}

/**
 * 根据等级返回颜色
 */
function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A':
      return '#52c41a'
    case 'B':
      return '#1677ff'
    case 'C':
      return '#faad14'
    default:
      return '#ff4d4f'
  }
}

/**
 * 问题总数
 */
const totalIssueCount = computed(() => {
  return (
    groupedIssues.value.error.length +
    groupedIssues.value.warning.length +
    groupedIssues.value.info.length
  )
})

/** 当前激活的分析 Tab */
const activeTab = ref<'rule' | 'ai'>('rule')

/** AI 评分结果 */
const aiScoreResult = ref<ResumeScoreResult | null>(null)

/** AI 评分加载状态 */
const aiScoreLoading = ref(false)

/** 是否已执行过 AI 评分 */
const hasAiScored = ref(false)

/**
 * 根据分数返回颜色
 */
function getAiScoreColor(value: number): string {
  if (value >= 90) return '#52c41a'
  if (value >= 75) return '#1677ff'
  if (value >= 60) return '#faad14'
  return '#ff4d4f'
}

/**
 * 根据等级返回颜色
 */
function getAiGradeColor(grade: string): string {
  switch (grade) {
    case 'S':
      return '#eb2f96'
    case 'A':
      return '#52c41a'
    case 'B':
      return '#1677ff'
    case 'C':
      return '#faad14'
    default:
      return '#ff4d4f'
  }
}

/**
 * 调用 AI 开始评分
 */
const handleStartAiScore = async () => {
  if (!hasApiKey()) {
    message.warning('请先在设置中配置 API Key')
    return
  }
  if (aiScoreLoading.value) return

  aiScoreLoading.value = true
  aiScoreResult.value = null

  const resumeText = resumeToText(resume)
  aiScoreResult.value = await scoreResumeApi({ resumeText })
  hasAiScored.value = true
  message.success('评分完成')

  aiScoreLoading.value = false
}
</script>

<template>
  <a-tabs v-model:active-key="activeTab" size="middle" class="resume-analysis">
    <a-tab-pane key="rule" tab="规则检查">
      <div class="tab-content">
        <!-- 总览卡片 -->
        <motion.div
          class="overview-card"
          :initial="{ opacity: 0, y: 10 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.4 }"
        >
          <div class="overview-header">
            <div class="overview-title">简历完成度</div>
            <div
              class="grade-badge"
              :style="{
                color: getGradeColor(analysisResult.grade),
                borderColor: getGradeColor(analysisResult.grade),
              }"
            >
              {{ analysisResult.grade }} 级
            </div>
          </div>
          <div class="overview-body">
            <div class="overall-progress">
              <div class="progress-ring">
                <a-progress
                  type="circle"
                  :percent="analysisResult.overallCompleteness"
                  :size="110"
                  :stroke-color="
                    getCompletenessColor(analysisResult.overallCompleteness)
                  "
                >
                  <template #default>
                    <div class="progress-inner">
                      <span class="progress-num">
                        {{ analysisResult.overallCompleteness }}
                      </span>
                      <span class="progress-unit">分</span>
                    </div>
                  </template>
                </a-progress>
              </div>
              <div class="overview-text">
                <p class="grade-text">{{ analysisResult.gradeText }}</p>
                <p class="issue-summary">
                  共检测到
                  <span class="issue-total">{{ totalIssueCount }}</span>
                  项建议
                  <template v-if="groupedIssues.error.length">
                    ，其中严重问题
                    <span class="issue-error">{{
                      groupedIssues.error.length
                    }}</span>
                  </template>
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <!-- 各模块完成度 -->
        <motion.div
          class="sections-card"
          :initial="{ opacity: 0, y: 10 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.4, delay: 0.1 }"
        >
          <div class="card-title">各模块完成度</div>
          <div class="sections-list">
            <div
              v-for="section in analysisResult.sections"
              :key="section.id"
              class="section-item"
            >
              <div class="section-header">
                <span class="section-name">{{ section.title }}</span>
                <span class="section-count">
                  {{ section.filledCount }} / {{ section.totalCount }}
                </span>
              </div>
              <a-progress
                :percent="section.completeness"
                :stroke-color="getCompletenessColor(section.completeness)"
                size="small"
              />
            </div>
          </div>
        </motion.div>

        <!-- 问题列表 -->
        <motion.div
          class="issues-card"
          :initial="{ opacity: 0, y: 10 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.4, delay: 0.2 }"
        >
          <div class="card-title">
            建议填写提示
            <span v-if="totalIssueCount === 0" class="perfect-tip">
              <CheckCircleFilled style="color: #52c41a" />
              简历已完整
            </span>
          </div>

          <template v-if="totalIssueCount === 0">
            <div class="empty-state">
              <CheckCircleFilled style="font-size: 3rem; color: #52c41a" />
              <p>恭喜！你的简历已完整，可以放心投递。</p>
            </div>
          </template>

          <template v-else>
            <div v-for="level in ['error', 'warning', 'info']" :key="level">
              <div
                v-if="groupedIssues[level].length"
                class="issue-group"
                :style="{
                  backgroundColor: levelConfig[level].bg,
                  borderColor: levelConfig[level].color,
                }"
              >
                <div
                  class="group-header"
                  :style="{ color: levelConfig[level].color }"
                >
                  <component :is="levelConfig[level].icon" />
                  <span>{{ levelConfig[level].label }}</span>
                  <span
                    class="group-count"
                    :style="{ backgroundColor: levelConfig[level].color }"
                    >{{ groupedIssues[level].length }}</span
                  >
                </div>
                <ul class="issue-list">
                  <li
                    v-for="(issue, idx) in groupedIssues[level]"
                    :key="`${level}-${idx}`"
                  >
                    {{ issue.message }}
                  </li>
                </ul>
              </div>
            </div>
          </template>
        </motion.div>
      </div>
    </a-tab-pane>

    <!-- AI 评分 Tab -->
    <a-tab-pane key="ai" tab="AI 评分">
      <div class="ai-score tab-content">
        <!-- 顶部操作栏 -->
        <div class="action-bar">
          <a-button
            type="primary"
            :loading="aiScoreLoading"
            @click="handleStartAiScore"
          >
            {{ aiScoreLoading ? '评分中...' : '开始 AI 评分' }}
          </a-button>
        </div>

        <!-- 加载中 -->
        <div v-if="aiScoreLoading" class="loading-state">
          <a-spin tip="AI 正在深度分析简历内容..." />
        </div>

        <!-- 结果区 -->
        <template v-else-if="hasAiScored && aiScoreResult">
          <!-- 总分 + 等级大卡片 -->
          <motion.div
            class="ai-total-card"
            :initial="{ opacity: 0, y: 10 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.4 }"
          >
            <div class="total-header">
              <div class="total-title">综合评分</div>
              <div
                class="grade-badge"
                :style="{
                  color: getAiGradeColor(aiScoreResult.grade),
                  borderColor: getAiGradeColor(aiScoreResult.grade),
                }"
              >
                {{ aiScoreResult.grade }} 级
              </div>
            </div>
            <div class="total-body">
              <div class="score-ring">
                <a-progress
                  type="circle"
                  :percent="aiScoreResult.totalScore"
                  :size="120"
                  :stroke-color="getAiScoreColor(aiScoreResult.totalScore)"
                >
                  <template #default>
                    <div class="score-inner">
                      <span class="score-num">
                        {{ aiScoreResult.totalScore }}
                      </span>
                      <span class="score-unit">分</span>
                    </div>
                  </template>
                </a-progress>
              </div>
              <div class="total-comment">
                {{ aiScoreResult.overallComment }}
              </div>
            </div>
          </motion.div>

          <!-- 6 维度评分 -->
          <motion.div
            class="dimensions-card"
            :initial="{ opacity: 0, y: 10 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.4, delay: 0.1 }"
          >
            <div class="card-title">
              <StarFilled style="color: #faad14; margin-right: 0.4rem" />
              维度评分
            </div>
            <div class="dimensions-list">
              <div
                v-for="dim in aiScoreResult.dimensions"
                :key="dim.name"
                class="dim-item"
              >
                <div class="dim-header">
                  <span class="dim-name">{{ dim.name }}</span>
                  <span
                    class="dim-score"
                    :style="{ color: getAiScoreColor(dim.score) }"
                  >
                    {{ dim.score }} 分
                  </span>
                </div>
                <a-progress
                  :percent="dim.score"
                  :stroke-color="getAiScoreColor(dim.score)"
                  size="small"
                />
                <div class="dim-comment">{{ dim.comment }}</div>
              </div>
            </div>
          </motion.div>

          <!-- 亮点 + 改进 双栏 -->
          <div class="highlights-issues-row">
            <motion.div
              class="highlights-card"
              :initial="{ opacity: 0, y: 10 }"
              :animate="{ opacity: 1, y: 0 }"
              :transition="{ duration: 0.4, delay: 0.2 }"
            >
              <div class="card-title">
                <RocketFilled style="color: #52c41a; margin-right: 0.4rem" />
                亮点 TOP3
              </div>
              <ul v-if="aiScoreResult.top3Highlights.length" class="list">
                <li v-for="(item, i) in aiScoreResult.top3Highlights" :key="i">
                  {{ item }}
                </li>
              </ul>
              <div v-else class="no-data">暂无</div>
            </motion.div>

            <motion.div
              class="issues-card"
              :initial="{ opacity: 0, y: 10 }"
              :animate="{ opacity: 1, y: 0 }"
              :transition="{ duration: 0.4, delay: 0.25 }"
            >
              <div class="card-title">
                <BulbFilled style="color: #ff4d4f; margin-right: 0.4rem" />
                改进建议 TOP3
              </div>
              <ul v-if="aiScoreResult.top3Issues.length" class="list">
                <li v-for="(item, i) in aiScoreResult.top3Issues" :key="i">
                  {{ item }}
                </li>
              </ul>
              <div v-else class="no-data">暂无</div>
            </motion.div>
          </div>
        </template>

        <!-- 初始状态 -->
        <div v-else class="init-state">
          <a-empty
            description="点击「开始 AI 评分」，HR 视角深度评估简历质量"
          />
        </div>
      </div>
    </a-tab-pane>
  </a-tabs>
</template>

<style scoped lang="scss">
.resume-analysis {
  :deep(.ant-tabs-content) {
    padding-top: 0.4rem;
  }
}
.tab-content {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.overview-card,
.sections-card,
.issues-card {
  border: 1px solid;
  border-radius: 0.8rem;
  padding: 1.4rem;
  @include themify(
    (
      background-color: $bg-color,
      border-color: $border-color-mode,
    )
  );
}

.card-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  @include themify(
    (
      color: $text-color,
    )
  );

  .perfect-tip {
    font-size: 1.2rem;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }
}

.overview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;

  .overview-title {
    font-size: 1.5rem;
    font-weight: 600;
    @include themify(
      (
        color: $text-color,
      )
    );
  }

  .grade-badge {
    padding: 0.3rem 0.8rem;
    font-size: 1.3rem;
    font-weight: 600;
    border: 1px solid;
    border-radius: 0.4rem;
  }
}

.overall-progress {
  display: flex;
  align-items: center;
  gap: 1.5rem;

  .progress-ring {
    flex-shrink: 0;
  }

  .progress-inner {
    display: flex;
    align-items: baseline;
    justify-content: center;

    .progress-num {
      font-size: 2.4rem;
      font-weight: 700;
      color: #1677ff;
    }

    .progress-unit {
      font-size: 1.2rem;
      color: #8c8c8c;
      margin-left: 0.2rem;
    }
  }

  .overview-text {
    flex: 1;

    .grade-text {
      font-size: 1.5rem;
      font-weight: 500;
      margin: 0 0 0.5rem 0;
      @include themify(
        (
          color: $text-color,
        )
      );
    }

    .issue-summary {
      font-size: 1.3rem;
      color: #8c8c8c;
      margin: 0;

      .issue-total,
      .issue-error {
        color: #ff4d4f;
        font-weight: 600;
        margin: 0 0.2rem;
      }
    }
  }
}

.sections-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.section-item {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.4rem;

    .section-name {
      font-size: 1.3rem;
      @include themify(
        (
          color: $text-color,
        )
      );
    }

    .section-count {
      font-size: 1.2rem;
      color: #8c8c8c;
    }
  }
}

.issue-group {
  border: 1px solid;
  border-radius: 0.6rem;
  padding: 1rem 1.2rem;
  margin-bottom: 0.8rem;

  &:last-child {
    margin-bottom: 0;
  }

  .group-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.4rem;
    font-weight: 600;
    margin-bottom: 0.6rem;

    .group-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 22px;
      height: 22px;
      padding: 0 6px;
      border-radius: 11px;
      font-size: 1.1rem;
      color: #fff;
    }
  }

  .issue-list {
    margin: 0;
    padding-left: 1.6rem;

    li {
      font-size: 1.3rem;
      line-height: 1.8;
      color: #595959;
      list-style: disc;
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
  gap: 1rem;

  p {
    font-size: 1.4rem;
    color: #8c8c8c;
    margin: 0;
  }
}

/* ================== AI 评分 Tab 样式 ================== */
.ai-score {
  .action-bar {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
}

.ai-total-card,
.dimensions-card,
.highlights-card {
  border: 1px solid;
  border-radius: 0.8rem;
  padding: 1.4rem;
  @include themify(
    (
      background-color: $bg-color,
      border-color: $border-color-mode,
    )
  );
}

.card-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  @include themify(
    (
      color: $text-color,
    )
  );
}

.ai-total-card {
  .total-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;

    .total-title {
      font-size: 1.5rem;
      font-weight: 600;
      @include themify(
        (
          color: $text-color,
        )
      );
    }

    .grade-badge {
      padding: 0.3rem 1rem;
      font-size: 1.6rem;
      font-weight: 700;
      border: 2px solid;
      border-radius: 0.6rem;
    }
  }

  .total-body {
    display: flex;
    align-items: center;
    gap: 1.6rem;

    .score-ring {
      flex-shrink: 0;
    }

    .score-inner {
      display: flex;
      align-items: baseline;
      justify-content: center;

      .score-num {
        font-size: 2.6rem;
        font-weight: 700;
        color: $primary-color;
      }

      .score-unit {
        font-size: 1.3rem;
        color: #8c8c8c;
        margin-left: 0.2rem;
      }
    }

    .total-comment {
      flex: 1;
      font-size: 1.35rem;
      line-height: 1.8;
      color: #595959;
    }
  }
}

.dimensions-card {
  .dimensions-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .dim-item {
    .dim-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.3rem;

      .dim-name {
        font-size: 1.3rem;
        @include themify(
          (
            color: $text-color,
          )
        );
      }

      .dim-score {
        font-size: 1.3rem;
        font-weight: 600;
      }
    }

    .dim-comment {
      margin-top: 0.4rem;
      font-size: 1.2rem;
      color: #8c8c8c;
      line-height: 1.6;
    }
  }
}

.highlights-issues-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.highlights-card,
.issues-card {
  .list {
    margin: 0;
    padding-left: 1.8rem;

    li {
      font-size: 1.3rem;
      line-height: 1.8;
      color: #595959;
      list-style: disc;
    }
  }

  .no-data {
    font-size: 1.3rem;
    color: #bfbfbf;
  }
}
</style>
