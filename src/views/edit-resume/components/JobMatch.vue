<script setup lang="ts">
import { inject, ref } from 'vue'
import { message } from 'ant-design-vue'
import {
  CheckCircleFilled,
  CloseCircleFilled,
  RocketFilled,
  WarningFilled,
  BulbFilled,
} from '@ant-design/icons-vue'
import { motion } from 'motion-v'
import type { Resume } from '@/types/resume'
import { resumeToText } from '@/utils/resumeToText'
import { jobMatchApi } from '@/api'
import type { JobMatchResult } from '@/types/ai'

/** 简历数据 */
const resume = inject<Resume>('resume') as Resume

/** 岗位描述输入 */
const jobDescription = ref('')

/** 加载状态 */
const loading = ref(false)

/** 是否已分析过 */
const hasAnalyzed = ref(false)

/** 分析结果 */
const result = ref<JobMatchResult | null>(null)

/**
 * 根据匹配度返回颜色
 */
function getScoreColor(score: number): string {
  if (score >= 80) return '#52c41a'
  if (score >= 60) return '#1677ff'
  if (score >= 40) return '#faad14'
  return '#ff4d4f'
}

/**
 * 根据匹配度返回文案
 */
function getScoreText(score: number): string {
  if (score >= 80) return '高度匹配'
  if (score >= 60) return '基本匹配'
  if (score >= 40) return '部分匹配'
  return '匹配度较低'
}

/**
 * 执行岗位匹配分析
 */
const handleAnalyze = async () => {
  if (!jobDescription.value.trim()) {
    message.warning('请先粘贴岗位描述（JD）')
    return
  }
  if (loading.value) return

  loading.value = true
  result.value = null
  hasAnalyzed.value = true

  try {
    const resumeText = resumeToText(resume)
    result.value = await jobMatchApi({
      resumeText,
      jobDescription: jobDescription.value,
    })
    message.success('分析完成')
  } catch (error) {
    message.error((error as Error).message || '分析失败，请重试')
    hasAnalyzed.value = false
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="job-match">
    <!-- JD 输入区 -->
    <div class="jd-input-area">
      <div class="area-title">岗位描述（JD）</div>
      <a-textarea
        v-model:value="jobDescription"
        :rows="5"
        :disabled="loading"
        placeholder="请粘贴目标岗位的职位描述，包括职责、要求、技能等..."
        class="jd-textarea"
      />
      <div class="jd-actions">
        <a-button
          type="primary"
          :loading="loading"
          :disabled="loading || !jobDescription.trim()"
          @click="handleAnalyze"
        >
          {{ loading ? '分析中...' : '开始匹配分析' }}
        </a-button>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-state">
      <a-spin tip="AI 正在分析简历与岗位的匹配度..." />
    </div>

    <!-- 结果区 -->
    <template v-else-if="hasAnalyzed && result">
      <!-- 匹配度总览 -->
      <motion.div
        class="score-card"
        :initial="{ opacity: 0, y: 10 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.4 }"
      >
        <div class="score-ring">
          <a-progress
            type="circle"
            :percent="result.matchScore"
            :size="120"
            :stroke-color="getScoreColor(result.matchScore)"
          >
            <template #default>
              <div class="score-inner">
                <span class="score-num">{{ result.matchScore }}</span>
                <span class="score-unit">%</span>
              </div>
            </template>
          </a-progress>
        </div>
        <div class="score-info">
          <div
            class="score-text"
            :style="{ color: getScoreColor(result.matchScore) }"
          >
            {{ getScoreText(result.matchScore) }}
          </div>
          <div class="score-desc">
            简历与该岗位的整体匹配程度，分数越高越匹配
          </div>
        </div>
      </motion.div>

      <!-- 技能对比 -->
      <motion.div
        class="skills-card"
        :initial="{ opacity: 0, y: 10 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.4, delay: 0.1 }"
      >
        <div class="card-title">技能匹配</div>
        <div class="skills-grid">
          <!-- 已匹配 -->
          <div class="skill-col matched">
            <div class="col-header">
              <CheckCircleFilled style="color: #52c41a" />
              <span>已具备 ({{ result.matchedSkills.length }})</span>
            </div>
            <div v-if="result.matchedSkills.length" class="tag-list">
              <a-tag
                v-for="skill in result.matchedSkills"
                :key="skill"
                color="success"
              >
                {{ skill }}
              </a-tag>
            </div>
            <div v-else class="empty-text">暂无</div>
          </div>

          <!-- 缺失 -->
          <div class="skill-col missing">
            <div class="col-header">
              <CloseCircleFilled style="color: #ff4d4f" />
              <span>待补充 ({{ result.missingSkills.length }})</span>
            </div>
            <div v-if="result.missingSkills.length" class="tag-list">
              <a-tag
                v-for="skill in result.missingSkills"
                :key="skill"
                color="error"
              >
                {{ skill }}
              </a-tag>
            </div>
            <div v-else class="empty-text">暂无</div>
          </div>
        </div>
      </motion.div>

      <!-- 亮点 + 薄弱点 -->
      <div class="points-row">
        <motion.div
          class="points-card highlights"
          :initial="{ opacity: 0, y: 10 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.4, delay: 0.2 }"
        >
          <div class="card-title">
            <RocketFilled style="color: #52c41a; margin-right: 0.4rem" />
            简历亮点
          </div>
          <div v-if="result.highlights.length" class="point-list">
            <div
              v-for="(item, i) in result.highlights"
              :key="i"
              class="point-item"
            >
              <span class="point-section">{{ item.section }}</span>
              <span class="point-text">{{ item.point }}</span>
            </div>
          </div>
          <div v-else class="empty-text">暂无</div>
        </motion.div>

        <motion.div
          class="points-card weaknesses"
          :initial="{ opacity: 0, y: 10 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.4, delay: 0.25 }"
        >
          <div class="card-title">
            <WarningFilled style="color: #faad14; margin-right: 0.4rem" />
            薄弱点
          </div>
          <div v-if="result.weaknesses.length" class="point-list">
            <div
              v-for="(item, i) in result.weaknesses"
              :key="i"
              class="point-item"
            >
              <span class="point-section">{{ item.section }}</span>
              <span class="point-text">{{ item.point }}</span>
            </div>
          </div>
          <div v-else class="empty-text">暂无</div>
        </motion.div>
      </div>

      <!-- 改进建议 -->
      <motion.div
        class="suggestions-card"
        :initial="{ opacity: 0, y: 10 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.4, delay: 0.3 }"
      >
        <div class="card-title">
          <BulbFilled style="color: #1677ff; margin-right: 0.4rem" />
          改进建议
        </div>
        <ol v-if="result.suggestions.length" class="suggestion-list">
          <li v-for="(item, i) in result.suggestions" :key="i">
            {{ item }}
          </li>
        </ol>
        <div v-else class="empty-text">暂无</div>
      </motion.div>
    </template>

    <!-- 初始状态 -->
    <div v-else class="init-state">
      <a-empty description="粘贴目标岗位的 JD，AI 将分析简历与岗位的匹配度" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.job-match {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* JD 输入区 */
.jd-input-area {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  .area-title {
    font-size: 1.4rem;
    font-weight: 600;
    @include themify(
      (
        color: $text-color,
      )
    );
  }

  .jd-textarea {
    font-size: 1.3rem;
  }

  .jd-actions {
    display: flex;
    justify-content: flex-end;
  }
}

/* 加载/初始状态 */
.loading-state,
.init-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
}

/* 匹配度卡片 */
.score-card {
  display: flex;
  align-items: center;
  gap: 1.6rem;
  padding: 1.4rem;
  border: 1px solid;
  border-radius: 0.8rem;
  @include themify(
    (
      background-color: $bg-color,
      border-color: $border-color-mode,
    )
  );

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
    }

    .score-unit {
      font-size: 1.3rem;
      color: #8c8c8c;
      margin-left: 0.2rem;
    }
  }

  .score-info {
    flex: 1;

    .score-text {
      font-size: 1.8rem;
      font-weight: 600;
      margin-bottom: 0.4rem;
    }

    .score-desc {
      font-size: 1.2rem;
      color: #8c8c8c;
      line-height: 1.6;
    }
  }
}

/* 公共卡片标题 */
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

/* 技能对比卡 */
.skills-card {
  padding: 1.4rem;
  border: 1px solid;
  border-radius: 0.8rem;
  @include themify(
    (
      background-color: $bg-color,
      border-color: $border-color-mode,
    )
  );

  .skills-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .skill-col {
    .col-header {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 1.3rem;
      font-weight: 500;
      margin-bottom: 0.6rem;
      @include themify(
        (
          color: $text-color,
        )
      );
    }

    .tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }

    .empty-text {
      font-size: 1.2rem;
      color: #bfbfbf;
    }
  }
}

/* 亮点 + 薄弱点 */
.points-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.points-card {
  padding: 1.4rem;
  border: 1px solid;
  border-radius: 0.8rem;
  @include themify(
    (
      background-color: $bg-color,
      border-color: $border-color-mode,
    )
  );

  .point-list {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .point-item {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    padding: 0.6rem 0.8rem;
    border-radius: 0.4rem;
    background: rgba(0, 0, 0, 0.03);

    .point-section {
      font-size: 1.2rem;
      font-weight: 600;
      color: #8c8c8c;
    }

    .point-text {
      font-size: 1.3rem;
      line-height: 1.6;
      @include themify(
        (
          color: $text-color,
        )
      );
    }
  }

  .empty-text {
    font-size: 1.3rem;
    color: #bfbfbf;
  }
}

/* 改进建议 */
.suggestions-card {
  padding: 1.4rem;
  border: 1px solid;
  border-radius: 0.8rem;
  @include themify(
    (
      background-color: $bg-color,
      border-color: $border-color-mode,
    )
  );

  .suggestion-list {
    margin: 0;
    padding-left: 1.8rem;

    li {
      font-size: 1.3rem;
      line-height: 1.8;
      color: #595959;
      margin-bottom: 0.4rem;
    }
  }

  .empty-text {
    font-size: 1.3rem;
    color: #bfbfbf;
  }
}
</style>
