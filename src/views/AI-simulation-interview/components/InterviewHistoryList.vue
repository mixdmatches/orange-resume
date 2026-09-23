<script setup lang="ts">
import { DeleteOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import type { InterviewSession } from '@/types/interview'

/** 历史面试列表组件 Props */
const props = defineProps<{
  /** 面试会话列表 */
  list: InterviewSession[]
  /** 是否正在加载 */
  loading: boolean
}>()

/** 历史面试列表组件 Emits */
const emit = defineEmits<{
  /** 点击列表项打开详情 */
  (e: 'open-detail', id: string): void
  /** 删除面试会话 */
  (e: 'delete', session: InterviewSession): void
  /** 刷新列表 */
  (e: 'refresh'): void
}>()

/**
 * 面试状态对应的 tag 颜色
 */
const statusColor = (status: string) => {
  if (status === 'finished') return 'success'
  if (status === 'in_progress') return 'processing'
  return 'default'
}

/**
 * 面试状态中文标签
 */
const statusLabel = (status: string) => {
  if (status === 'finished') return '已结束'
  if (status === 'in_progress') return '进行中'
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
    <div class="card-header">
      <h3>历史面试</h3>
      <a-button
        type="text"
        size="small"
        :loading="loading"
        @click="emit('refresh')"
      >
        <template #icon><reload-outlined /></template>
        刷新
      </a-button>
    </div>

    <a-empty
      v-if="!list.length && !loading"
      description="还没有面试记录"
      class="empty-state"
    />

    <a-list
      v-else
      :data-source="list"
      :loading="loading"
      item-layout="horizontal"
    >
      <template #renderItem="{ item }">
        <a-dropdown :trigger="['contextmenu']">
          <a-list-item
            class="history-item"
            @click="emit('open-detail', item.id)"
          >
            <a-list-item-meta>
              <template #title>
                <span class="item-title">{{ item.title }}</span>
              </template>
              <template #description>
                <a-space size="small" wrap>
                  <a-tag :color="statusColor(item.interviewStatus)">
                    {{ statusLabel(item.interviewStatus) }}
                  </a-tag>
                  <a-tag v-if="item.difficulty" :color="difficultyColor(item.difficulty)">
                    {{ difficultyLabel(item.difficulty) }}
                  </a-tag>
                  <span class="meta-text">{{ formatTime(item.createdAt) }}</span>
                  <span v-if="item.totalScore !== null" class="meta-text score-text">
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
                @click.stop="emit('delete', item)"
              >
                <template #icon><delete-outlined /></template>
              </a-button>
            </template>
          </a-list-item>
          <template #overlay>
            <a-menu>
              <a-menu-item @click="emit('open-detail', item.id)">
                <eye-outlined />
                查看详情
              </a-menu-item>
              <a-menu-item danger @click="emit('delete', item)">
                <delete-outlined />
                删除
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </template>
    </a-list>
  </a-card>
</template>

<style scoped lang="scss">
.history-card {
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.card-header h3 {
  margin: 0;
  font-size: 1.4rem;
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
    @include themify(
      (
        background: (
          light: #f5f5f5,
          dark: rgba(255, 255, 255, 0.06),
        ),
      )
    );
  }
}

.item-title {
  font-weight: 500;
}

.meta-text {
  font-size: 0.85rem;
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

.score-text {
  font-weight: 600;
  color: #fa8c16;
  @include themify(
    (
      color: (
        light: #fa8c16,
        dark: #fa8c16,
      ),
    )
  );
}
</style>
