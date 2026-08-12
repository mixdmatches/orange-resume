<script setup lang="ts">
import { computed, inject } from 'vue'
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
} from '@ant-design/icons-vue'

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
</script>

<template>
  <div class="resume-analysis">
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
</template>

<style scoped lang="scss">
.resume-analysis {
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
</style>
