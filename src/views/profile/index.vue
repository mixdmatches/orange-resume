<script setup lang="ts">
import { onMounted, ref, computed, h } from 'vue'
import {
  MailOutlined,
  ApiOutlined,
  FileTextOutlined,
  SafetyOutlined,
} from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { listResumes } from '@/service/resumeRepository'
import type { Resume } from '@/types/resume'
import ApiKeySetting from './components/ApiKeySetting.vue'
import InterviewHistoryList from './components/InterviewHistoryList.vue'
import AccountSetting from './components/AccountSetting.vue'

const authStore = useAuthStore()

/** 导航项定义：key 用于切换 activeTab，icon 用 h() 渲染 */
type NavKey = 'ai-config' | 'history' | 'account'
const navItems: Array<{
  key: NavKey
  label: string
  desc: string
  icon: () => any
}> = [
  {
    key: 'ai-config',
    label: 'AI 配置商',
    desc: '模型 API Key',
    icon: () => h(ApiOutlined),
  },
  {
    key: 'history',
    label: '历史面试',
    desc: '面试记录回放',
    icon: () => h(FileTextOutlined),
  },
  {
    key: 'account',
    label: '账号与安全',
    desc: '密码 / 邮箱 / 登录',
    icon: () => h(SafetyOutlined),
  },
]

/** 当前选中的导航项 */
const activeTab = ref<NavKey>('ai-config')

/** 用户名首字符作为头像兜底（无头像图片资源） */
const avatarChar = computed(
  () => authStore.userInfo?.username?.charAt(0).toUpperCase() || '友',
)

/** 简历总数（onMounted 时从 Repository 读取） */
const resumeCount = ref(0)

/** 格式化注册时间为中文日期；未知时返回占位 */
const joinedText = computed(() => {
  const t = authStore.userInfo?.createdAt
  if (!t) return '—'
  return new Date(t).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

/**
 * 初始化：恢复用户信息（store 已 persist，刷新后可能只有 token）
 * 同时读取简历总数用于统计
 */
const initProfile = async () => {
  if (!authStore.userInfo) {
    try {
      await authStore.fetchProfile()
    } catch {
      // 用户信息获取失败不阻塞页面，展示占位即可
    }
  }
  try {
    const res: Resume[] = await listResumes()
    resumeCount.value = res.length
  } catch {
    resumeCount.value = 0
  }
}

onMounted(() => {
  initProfile()
})
</script>

<template>
  <div class="page page-profile">
    <!-- ============ 页面头部 ============ -->
    <header class="page-header">
      <div>
        <h1 class="page-title">个人中心</h1>
        <p class="page-subtitle">管理账号信息、AI 配置与面试记录</p>
      </div>
    </header>

    <!-- ============ 主体：左侧导航 + 右侧内容 ============ -->
    <div class="profile-layout">
      <!-- ===== 左侧导航栏 ===== -->
      <aside class="profile-nav">
        <!-- 用户信息 -->
        <div class="nav-user">
          <div class="avatar">
            <span class="avatar-char">{{ avatarChar }}</span>
          </div>
          <div class="user-info">
            <div class="user-name">
              {{ authStore.userInfo?.username || '未登录用户' }}
            </div>
            <div class="user-email">
              <mail-outlined />
              {{ authStore.userInfo?.email || '未绑定邮箱' }}
            </div>
          </div>
        </div>

        <div class="nav-divider"></div>

        <!-- 导航列表 -->
        <nav class="nav-list">
          <button
            v-for="item in navItems"
            :key="item.key"
            type="button"
            class="nav-item"
            :class="{ active: activeTab === item.key }"
            @click="activeTab = item.key"
          >
            <span class="nav-icon">
              <component :is="item.icon()" />
            </span>
            <span class="nav-text">
              <span class="nav-label">{{ item.label }}</span>
              <span class="nav-desc">{{ item.desc }}</span>
            </span>
          </button>
        </nav>

        <div class="nav-divider"></div>

        <div class="nav-foot">
          <span class="foot-text">加入于 {{ joinedText }}</span>
        </div>
      </aside>

      <!-- ===== 右侧内容区 ===== -->
      <main class="profile-content">
        <!-- AI 配置商 -->
        <template v-if="activeTab === 'ai-config'">
          <section class="content-card">
            <div class="content-head">
              <h2 class="content-title">AI 配置商</h2>
              <p class="content-desc">
                配置模型厂商 API Key 与使用偏好，AI 工具将按此调用大模型服务
              </p>
            </div>
            <api-key-setting />
          </section>
        </template>

        <!-- 历史面试 -->
        <template v-else-if="activeTab === 'history'">
          <section class="content-card">
            <div class="content-head">
              <h2 class="content-title">历史面试</h2>
              <p class="content-desc">查看历次 AI 模拟面试的记录与评价详情</p>
            </div>
            <interview-history-list />
          </section>
        </template>

        <!-- 账号与安全 -->
        <template v-else-if="activeTab === 'account'">
          <section class="content-card">
            <div class="content-head">
              <h2 class="content-title">账号与安全</h2>
              <p class="content-desc">管理账号密码、邮箱绑定与登录状态</p>
            </div>
            <account-setting />
          </section>
        </template>
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* ============ 页面容器 ============ */
.page-profile {
  max-width: var(--content-max-width);
  display: flex;
  flex-direction: column;
}

/* ============ 主体双栏布局 ============ */
.profile-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: var(--space-6);
  align-items: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

/* ============ 左侧导航栏 ============ */
.profile-nav {
  position: sticky;
  top: calc(var(--header-height, 56px) + var(--space-6));
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);

  @media (max-width: 768px) {
    position: static;
  }
}

/* 用户信息块 */
.nav-user {
  display: flex;
  align-items: center;
  gap: var(--space-3);

  .avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    background: var(--color-primary-bg);
    border-radius: var(--radius-full);

    .avatar-char {
      font-family: var(--font-display);
      font-size: var(--text-base);
      font-weight: var(--font-bold);
      color: var(--color-primary);
    }
  }

  .user-info {
    min-width: 0;

    .user-name {
      font-size: var(--text-sm);
      font-weight: var(--font-semibold);
      color: var(--color-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-email {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: var(--text-xs);
      color: var(--color-text-tertiary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

.nav-divider {
  height: 1px;
  background: var(--color-border);
}

/* 导航列表 */
.nav-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3) var(--space-3);
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition:
    background var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);

  &:hover {
    background: var(--color-bg-muted);
  }

  &.active {
    background: var(--color-primary-bg);
    color: var(--color-primary);

    .nav-icon {
      color: var(--color-primary);
    }

    .nav-label {
      color: var(--color-primary);
      font-weight: var(--font-semibold);
    }
  }

  .nav-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 16px;
    height: 20px;
    font-size: 16px;
    line-height: 1;
    color: var(--color-text-secondary);
    margin-top: 1px;
  }

  .nav-text {
    display: flex;
    flex-direction: column;
    gap: 0;
    min-width: 0;
  }

  .nav-label {
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    color: var(--color-text);
    transition: color var(--duration-fast) var(--ease-out);
  }

  .nav-desc {
    font-size: calc(var(--text-xs) * 0.8);
    color: var(--color-text-tertiary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.nav-foot {
  padding-top: var(--space-1);
  text-align: center;

  .foot-text {
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
  }
}

/* ============ 右侧内容区 ============ */
.profile-content {
  min-width: 0;
}

.content-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}

.content-head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: var(--space-5);

  .content-title {
    font-size: var(--text-base);
    font-weight: var(--font-semibold);
    color: var(--color-text);
    margin: 0;
    letter-spacing: -0.01em;
  }

  .content-desc {
    margin: 0;
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
  }
}

.row-divider {
  height: 1px;
  background: var(--color-border);
}

/* ============ 响应式 ============ */
@media (max-width: 768px) {
  .profile-layout {
    grid-template-columns: 1fr;
  }

  .nav-list {
    flex-direction: row;
    overflow-x: auto;
    gap: var(--space-2);
  }

  .nav-item {
    flex-shrink: 0;
    padding: var(--space-2) var(--space-3);

    .nav-icon {
      width: 24px;
      height: 24px;
      font-size: 14px;
    }

    .nav-desc {
      display: none;
    }
  }
}
</style>
