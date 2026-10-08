<script setup lang="ts">
/**
 * Profile · 个人中心
 *
 * 左侧导航栏 + 右侧内容卡布局（参考 SaaS 设置页风格）
 * - 用户信息来自 auth store（未恢复时静默调用 fetchProfile）
 * - AI 配置商复用 setting/ApiKeySetting 组件（原 /setting 路由已移除）
 * - 历史面试复用 InterviewHistoryList + InterviewDetailDrawer
 * - 注销账号：UI 先行，功能 TODO
 */
import { onMounted, ref, reactive, computed, h } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import {
  UserOutlined,
  MailOutlined,
  LogoutOutlined,
  DeleteOutlined,
  KeyOutlined,
  ApiOutlined,
  FileTextOutlined,
  SafetyOutlined,
} from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { listResumes } from '@/service/resumeRepository'
import { templates } from '@/template/index'
import type { Resume } from '@/types/resume'
import ApiKeySetting from '@/views/setting/components/ApiKeySetting.vue'
import InterviewHistoryList from '@/views/AI-simulation-interview/components/InterviewHistoryList.vue'
import InterviewDetailDrawer from '@/views/AI-simulation-interview/components/InterviewDetailDrawer.vue'
import {
  deleteInterviewApi,
  getInterviewDetailApi,
  listInterviewsApi,
} from '@/api/interview'
import type { InterviewDetail, InterviewSession } from '@/types/interview'

const router = useRouter()
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

// ========= 历史面试（复用 AI 面试页同款列表） =========

/** 历史面试列表 */
const historyList = ref<InterviewSession[]>([])
/** 历史列表加载中 */
const historyLoading = ref(false)
/** 详情抽屉是否打开 */
const detailVisible = ref(false)
/** 详情抽屉的面试详情数据 */
const detailData = ref<InterviewDetail | null>(null)
/** 详情抽屉加载中 */
const detailLoading = ref(false)
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
  loadHistory()
})

/** 退出登录：复用 store 逻辑（清 token + 队列），成功后回登录页 */
const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

/**
 * 注销账号
 * TODO: 后期实现注销流程——后端删除账号 + 清除云端简历/面试数据 + 清空本地 IndexedDB
 * 当前仅做 UI 占位提示
 */
const handleDeleteAccount = () => {
  Modal.warning({
    title: '注销账号功能开发中',
    content:
      '注销后云端简历、面试记录等数据将被永久清除且不可恢复，该功能即将上线。',
    okText: '我知道了',
  })
}

/**
 * 修改密码
 * TODO: 后期实现——弹出修改密码表单，调用后端改密接口（需登录态校验/旧密码验证）
 */
const handleChangePassword = () => {
  Modal.warning({
    title: '修改密码功能开发中',
    content: '修改密码功能即将上线，届时可通过本页面安全修改登录密码。',
    okText: '我知道了',
  })
}

/**
 * 绑定/换绑邮箱
 * TODO: 后期实现——验证码校验 + 后端绑定接口，绑定后用于找回密码与通知
 */
const handleBindEmail = () => {
  Modal.warning({
    title: '邮箱绑定功能开发中',
    content: '绑定邮箱功能即将上线，绑定后可用于找回密码与重要通知。',
    okText: '我知道了',
  })
}
</script>

<template>
  <div class="page page-profile">
    <!-- ============ 页面头部 ============ -->
    <header class="page-head">
      <h1 class="page-title">个人中心</h1>
      <p class="page-desc">管理账号信息、AI 配置与面试记录</p>
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

        <!-- 统计 -->
        <div class="nav-stats">
          <div class="stat-item">
            <div class="stat-num">{{ resumeCount }}</div>
            <div class="stat-label">简历</div>
          </div>
          <div class="stat-item">
            <div class="stat-num">{{ templates.length }}</div>
            <div class="stat-label">模板</div>
          </div>
          <div class="stat-item">
            <div class="stat-num">5</div>
            <div class="stat-label">AI 工具</div>
          </div>
        </div>

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
            <interview-history-list
              :list="historyList"
              :loading="historyLoading"
              :total="pagination.total"
              :current-page="pagination.currentPage"
              :page-size="pagination.pageSize"
              @open-detail="handleOpenDetail"
              @page-size="handlePageSizeChange"
              @current-page="handleCurrentChange"
              @delete="handleDeleteInterview"
              @refresh="loadHistory"
            />
          </section>
        </template>

        <!-- 账号与安全 -->
        <template v-else-if="activeTab === 'account'">
          <section class="content-card">
            <div class="content-head">
              <h2 class="content-title">账号与安全</h2>
              <p class="content-desc">管理账号密码、邮箱绑定与登录状态</p>
            </div>
            <div class="settings-list">
              <!-- 修改密码 -->
              <div class="settings-row">
                <div class="settings-text">
                  <span class="settings-title">
                    修改密码
                    <a-tag color="orange">开发中</a-tag>
                  </span>
                  <span class="settings-desc">定期更新密码保护账号安全</span>
                </div>
                <a-button @click="handleChangePassword">
                  <template #icon><key-outlined /></template>
                  修改
                </a-button>
              </div>
              <div class="row-divider"></div>
              <!-- 绑定邮箱 -->
              <div class="settings-row">
                <div class="settings-text">
                  <span class="settings-title">
                    绑定邮箱
                    <a-tag color="orange">开发中</a-tag>
                  </span>
                  <span class="settings-desc">
                    {{ authStore.userInfo?.email || '未绑定邮箱' }}
                  </span>
                </div>
                <a-button @click="handleBindEmail">
                  <template #icon><mail-outlined /></template>
                  {{ authStore.userInfo?.email ? '换绑' : '绑定' }}
                </a-button>
              </div>
              <div class="row-divider"></div>
              <!-- 退出登录 -->
              <div class="settings-row">
                <div class="settings-text">
                  <span class="settings-title danger">退出登录</span>
                  <span class="settings-desc"
                    >清除本地登录状态，简历数据仍保留在此设备</span
                  >
                </div>
                <a-button danger @click="handleLogout">
                  <template #icon><logout-outlined /></template>
                  退出登录
                </a-button>
              </div>
              <div class="row-divider"></div>
              <!-- 注销账号 -->
              <div class="settings-row">
                <div class="settings-text">
                  <span class="settings-title danger">注销账号</span>
                  <span class="settings-desc"
                    >永久删除账号及云端全部数据，不可恢复</span
                  >
                </div>
                <a-button danger type="primary" @click="handleDeleteAccount">
                  <template #icon><delete-outlined /></template>
                  注销账号
                </a-button>
              </div>
            </div>
          </section>
        </template>
      </main>
    </div>

    <!-- 面试详情抽屉 -->
    <interview-detail-drawer
      v-model:open="detailVisible"
      :detail="detailData"
      :loading="detailLoading"
    />
  </div>
</template>

<style scoped lang="scss">
/* ============ 页面容器 ============ */
.page-profile {
  max-width: var(--content-max-width);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* ============ 页面头部 ============ */
.page-head {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .page-title {
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-weight: var(--font-bold);
    letter-spacing: -0.02em;
    color: var(--color-text);
    margin: 0;
  }

  .page-desc {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--color-text-tertiary);
  }
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
  align-items: center;
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
    width: 32px;
    height: 32px;
    font-size: 16px;
    color: var(--color-text-secondary);
  }

  .nav-text {
    display: flex;
    flex-direction: column;
    gap: 0;
    min-width: 0;
  }

  .nav-label {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--color-text);
    transition: color var(--duration-fast) var(--ease-out);
  }

  .nav-desc {
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

/* 统计 */
.nav-stats {
  display: flex;
  justify-content: space-around;
  padding: var(--space-3) 0;

  .stat-item {
    text-align: center;

    .stat-num {
      font-family: var(--font-display);
      font-size: var(--text-lg);
      font-weight: var(--font-bold);
      color: var(--color-text);
      line-height: 1.1;
    }

    .stat-label {
      margin-top: 2px;
      font-size: var(--text-xs);
      color: var(--color-text-tertiary);
    }
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
    font-size: var(--text-lg);
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

/* ============ 通用设置行 ============ */
.settings-list {
  display: flex;
  flex-direction: column;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) 0;

  &:first-of-type {
    padding-top: 0;
  }

  &:last-of-type {
    padding-bottom: 0;
  }

  .settings-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .settings-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--color-text);

    &.danger {
      color: var(--color-error);
    }

    .ant-tag {
      margin: 0;
      font-size: var(--text-xs);
      line-height: 18px;
      padding: 0 6px;
    }
  }

  .settings-desc {
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

@media (max-width: 640px) {
  .settings-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
