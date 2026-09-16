<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { message } from 'ant-design-vue'
import {
  CheckCircleFilled,
  CloseCircleFilled,
  WarningFilled,
} from '@ant-design/icons-vue'
import type { Resume } from '@/types/resume'
import { hasApiKey } from '@/api'
import { grammarCheckApi } from '@/api'
import { resumeToText } from '@/utils/resumeToText'
import type { GrammarIssue } from '@/types/ai'

/** 简历数据 */
const resume = inject<Resume>('resume') as Resume

/** 是否加载中 */
const loading = ref(false)

/** 是否已执行过检查（用于区分初始状态和检查完成状态） */
const hasChecked = ref(false)

/** 纠错结果列表 */
const issues = ref<GrammarIssue[]>([])

/** error 数量 */
const errorCount = computed(
  () => issues.value.filter(i => i.severity === 'error').length,
)

/** warning 数量 */
const warningCount = computed(
  () => issues.value.filter(i => i.severity === 'warning').length,
)

/**
 * 执行语法纠错检查
 */
const handleCheck = async () => {
  if (!hasApiKey()) {
    message.warning('请先在设置中配置 API Key')
    return
  }
  if (loading.value) return

  loading.value = true
  issues.value = []
  hasChecked.value = true

  try {
    const { issues: resultIssues } = await grammarCheckApi({
      resumeText: resumeToText(resume),
    })
    if (resultIssues.length === 0) {
      message.success('未发现语法问题，简历文本很规范')
    } else {
      issues.value = resultIssues
      message.info(`共发现 ${resultIssues.length} 处问题`)
    }
  } catch (error) {
    message.error((error as Error).message || '检查失败，请重试')
    hasChecked.value = false
  } finally {
    loading.value = false
  }
}

/** 严重等级配置 */
const severityConfig = {
  error: {
    color: '#ff4d4f',
    bg: 'rgba(255, 77, 79, 0.08)',
    icon: CloseCircleFilled,
    label: '错误',
  },
  warning: {
    color: '#faad14',
    bg: 'rgba(250, 173, 20, 0.08)',
    icon: WarningFilled,
    label: '提醒',
  },
}

/**
 * 递归遍历简历对象，查找并替换第一条匹配的文本
 * @param issue - 纠错项
 * @returns 是否成功替换
 */
const applyFix = (issue: GrammarIssue): boolean => {
  const { original, suggestion } = issue
  if (!original) return false

  /** 深度优先遍历对象的所有字符串属性 */
  const traverse = (obj: unknown): boolean => {
    if (obj === null || typeof obj !== 'object') return false
    for (const key of Object.keys(obj)) {
      const val = (obj as Record<string, unknown>)[key]
      if (typeof val === 'string') {
        if (val.includes(original)) {
          ;(obj as Record<string, unknown>)[key] = val.replace(
            original,
            suggestion,
          )
          return true
        }
      } else if (typeof val === 'object' && val !== null) {
        if (traverse(val)) return true
      }
    }
    return false
  }

  return traverse(resume)
}

/**
 * 点击修正按钮：应用单条纠错建议到简历
 * @param idx - 问题在列表中的索引
 * @param issue - 纠错项
 */
const handleFix = (idx: number, issue: GrammarIssue) => {
  const success = applyFix(issue)
  if (success) {
    issues.value.splice(idx, 1)
    message.success('已修正')
  } else {
    message.warning('未能在简历中找到对应文本，可能已被修改')
  }
}
</script>

<template>
  <div class="grammar-check">
    <!-- 顶部操作栏 -->
    <div class="action-bar">
      <a-button
        type="primary"
        :loading="loading"
        :disabled="loading"
        @click="handleCheck"
      >
        {{ loading ? '检查中...' : '开始检查' }}
      </a-button>
      <div v-if="hasChecked && !loading && issues.length > 0" class="stats">
        共 <span class="num">{{ issues.length }}</span> 处问题
        <span class="error-num">错误 {{ errorCount }}</span>
        <span class="warn-num">提醒 {{ warningCount }}</span>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-state">
      <a-spin tip="AI 正在检查简历文本..." />
    </div>

    <!-- 结果区 -->
    <template v-else-if="hasChecked">
      <!-- 无问题 -->
      <div v-if="issues.length === 0" class="empty-state">
        <CheckCircleFilled style="font-size: 3rem; color: #52c41a" />
        <p>未发现语法问题，简历文本很规范</p>
      </div>

      <!-- 问题列表 -->
      <div v-else class="issue-list">
        <div
          v-for="(issue, idx) in issues"
          :key="idx"
          class="issue-card"
          :style="{
            backgroundColor: severityConfig[issue.severity].bg,
            borderColor: severityConfig[issue.severity].color,
          }"
        >
          <!-- 卡片头部：模块名 + 等级标签 -->
          <div class="card-header">
            <span class="section-name">{{ issue.section }}</span>
            <span
              class="severity-tag"
              :style="{
                color: '#fff',
                backgroundColor: severityConfig[issue.severity].color,
              }"
            >
              <component :is="severityConfig[issue.severity].icon" />
              {{ severityConfig[issue.severity].label }}
            </span>
          </div>

          <!-- 原文 → 建议 -->
          <div class="diff-area">
            <div class="diff-row original">
              <span class="diff-label">原文</span>
              <span class="diff-text">{{ issue.original }}</span>
            </div>
            <div class="diff-row suggestion">
              <span class="diff-label">建议</span>
              <span class="diff-text">{{ issue.suggestion }}</span>
            </div>
          </div>

          <!-- 原因 + 修正按钮 -->
          <div class="reason">
            <div class="reason-text">
              <span class="reason-label">原因：</span>{{ issue.reason }}
            </div>
            <a-button
              size="small"
              type="primary"
              class="fix-btn"
              @click="handleFix(idx, issue)"
            >
              修正
            </a-button>
          </div>
        </div>
      </div>
    </template>

    <!-- 初始状态 -->
    <div v-else class="init-state">
      <a-empty
        description="点击「开始检查」，AI 将扫描简历中的错别字、语病、标点等问题"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.grammar-check {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.action-bar {
  display: flex;
  align-items: center;
  gap: 1rem;

  .stats {
    font-size: 1.3rem;
    color: #8c8c8c;

    .num {
      color: #ff4d4f;
      font-weight: 600;
    }
    .error-num {
      margin-left: 0.8rem;
      color: #ff4d4f;
    }
    .warn-num {
      margin-left: 0.4rem;
      color: #faad14;
    }
  }
}

.loading-state,
.init-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  gap: 1rem;

  p {
    font-size: 1.4rem;
    color: #8c8c8c;
    margin: 0;
  }
}

.issue-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.issue-card {
  border: 1px solid;
  border-radius: 0.6rem;
  padding: 1rem 1.2rem;

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.8rem;

    .section-name {
      font-size: 1.3rem;
      font-weight: 600;
      @include themify(
        (
          color: $text-color,
        )
      );
    }

    .severity-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.2rem 0.6rem;
      font-size: 1.2rem;
      border-radius: 0.4rem;
    }
  }

  .diff-area {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 0.8rem;

    .diff-row {
      display: flex;
      gap: 0.6rem;
      font-size: 1.3rem;
      line-height: 1.6;

      .diff-label {
        flex-shrink: 0;
        width: 3rem;
        font-weight: 600;
      }

      .diff-text {
        flex: 1;
      }

      &.original {
        .diff-label {
          color: #ff4d4f;
        }
        .diff-text {
          text-decoration: line-through;
          color: #ff4d4f;
          opacity: 0.85;
        }
      }

      &.suggestion {
        .diff-label {
          color: #52c41a;
        }
        .diff-text {
          color: #52c41a;
          font-weight: 500;
        }
      }
    }
  }

  .reason {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    font-size: 1.2rem;
    color: #595959;
    padding-top: 0.6rem;
    border-top: 1px dashed rgba(0, 0, 0, 0.1);

    .reason-text {
      flex: 1;
    }

    .reason-label {
      font-weight: 600;
    }

    .fix-btn {
      flex-shrink: 0;
    }
  }
}
</style>
