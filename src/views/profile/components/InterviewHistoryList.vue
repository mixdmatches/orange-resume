<script setup lang="ts">
import { DeleteOutlined, EyeOutlined } from '@ant-design/icons-vue'
import type { InterviewDetail, InterviewSession } from '@/types/interview'
import {
  listInterviewsApi,
  deleteInterviewApi,
  getInterviewDetailApi,
} from '@/api'
import { message, Modal } from 'ant-design-vue'
import { ref, reactive, onMounted } from 'vue'

/** 历史面试列表 */
const historyList = ref<InterviewSession[]>([])
/** 历史列表加载中 */
const historyLoading = ref(false)

/** 分页信息 */
const pagination = reactive({
  currentPage: 1,
  pageSize: 5,
  total: 0,
})

/**
 * 加载历史面试列表
 */
const loadHistory = async () => {
  historyLoading.value = true
  try {
    const res = await listInterviewsApi({
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
    })
    pagination.total = res.total
    historyList.value = res.list
  } catch {
    message.error('加载历史面试失败')
  } finally {
    historyLoading.value = false
  }
}

const handleCurrentChange = (current: number) => {
  pagination.currentPage = current
  loadHistory()
}

const handlePageSizeChange = (_current: number, size: number) => {
  pagination.currentPage = 1
  pagination.pageSize = size
  loadHistory()
}

/**
 * 删除面试会话（二次确认）
 * @param session 面试会话对象
 */
const handleDeleteInterview = (session: InterviewSession) => {
  Modal.confirm({
    title: '删除该面试记录？',
    content: `将删除「${session.title}」，此操作不可恢复。`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        await deleteInterviewApi(session.id)
        message.success('已删除')
        await loadHistory()
      } catch {
        message.error('删除失败')
      }
    },
  })
}

onMounted(() => {
  loadHistory()
})

/** 详情抽屉是否打开 */
const detailVisible = ref(false)
/** 详情抽屉的面试详情数据 */
const detailData = ref<InterviewDetail | null>(null)
/** 详情抽屉加载中 */
const detailLoading = ref(false)

/**
 * 打开面试详情抽屉
 * @param id 面试会话 ID
 */
const handleOpenDetail = async (id: string) => {
  detailVisible.value = true
  detailData.value = null
  detailLoading.value = true
  try {
    detailData.value = await getInterviewDetailApi(id)
  } catch {
    message.error('加载面试详情失败')
  } finally {
    detailLoading.value = false
  }
}

/**
 * 面试状态对应的 tag 颜色
 */
const statusColor = (status: string) => {
  if (status === 'finished') return 'success'
  if (status === 'in_progress') return 'processing'
  if (status === 'stopped') return 'warning'
  return 'default'
}

/**
 * 面试状态中文标签
 */
const statusLabel = (status: string) => {
  if (status === 'finished') return '已结束'
  if (status === 'in_progress') return '进行中'
  if (status === 'stopped') return '已中止'
  return '待开始'
}

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
 * 格式化时间（简短日期时间）
 */
const formatTime = (t?: string) => {
  if (!t) return ''
  const d = new Date(t)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`
  return d.toLocaleDateString('zh-CN')
}
</script>

<template>
  <a-card class="history-card" bordered>
    <a-empty
      v-if="!historyList.length && !historyLoading"
      description="还没有面试记录"
      class="empty-state"
    />

    <a-list
      v-else
      :data-source="historyList"
      :loading="historyLoading"
      item-layout="horizontal"
    >
      <template #renderItem="{ item }">
        <a-dropdown :trigger="['contextmenu']">
          <a-list-item class="history-item" @click="handleOpenDetail(item.id)">
            <a-list-item-meta>
              <template #title>
                <span class="item-title">{{ item.title }}</span>
              </template>
              <template #description>
                <a-space size="small" wrap>
                  <a-tag :color="statusColor(item.interviewStatus)">
                    {{ statusLabel(item.interviewStatus) }}
                  </a-tag>
                  <a-tag
                    v-if="item.difficulty"
                    :color="difficultyColor(item.difficulty)"
                  >
                    {{ difficultyLabel(item.difficulty) }}
                  </a-tag>
                  <span class="meta-text">{{
                    formatTime(item.createdAt)
                  }}</span>
                  <span
                    v-if="item.totalScore !== null"
                    class="meta-text score-text"
                  >
                    总分 {{ item.totalScore }}
                  </span>
                </a-space>
              </template>
            </a-list-item-meta>
            <template #actions>
              <a-button
                type="text"
                danger
                size="small"
                @click.stop="handleDeleteInterview(item)"
              >
                <template #icon><delete-outlined /></template>
              </a-button>
            </template>
          </a-list-item>
          <template #overlay>
            <a-menu>
              <a-menu-item @click="handleOpenDetail(item.id)">
                <eye-outlined />
                查看详情
              </a-menu-item>
              <a-menu-item danger @click="handleDeleteInterview(item)">
                <delete-outlined />
                删除
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </template>
    </a-list>

    <a-pagination
      v-if="historyList.length > 0"
      :page-size="pagination.pageSize"
      :current="pagination.currentPage"
      :total="pagination.total"
      :page-size-options="[5, 10, 20]"
      show-size-changer
      @change="handleCurrentChange"
      @show-size-change="handlePageSizeChange"
    />
  </a-card>
  <!-- 面试详情抽屉 -->
  <interview-detail-drawer
    v-model:open="detailVisible"
    :detail="detailData"
    :loading="detailLoading"
  />
</template>

<style scoped lang="scss">
.history-card {
  border-radius: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.empty-state {
  padding: 2rem 0;
}

.history-item {
  cursor: pointer;
  border-radius: 0.6rem;
  transition: background 0.2s;
  padding-left: 0.6rem !important;
  padding-right: 0.6rem !important;

  &:hover {
    background: var(--color-surface-hover);
  }
}

.item-title {
  font-weight: 500;
}

.meta-text {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.score-text {
  font-weight: 600;
  color: var(--color-warning);
}
</style>
