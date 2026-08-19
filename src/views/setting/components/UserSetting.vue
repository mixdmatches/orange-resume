<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Popconfirm } from 'ant-design-vue'
import {
  UserOutlined,
  LogoutOutlined,
  LoginOutlined,
  MailOutlined,
} from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

/** 是否已登录 */
const isLoggedIn = computed(() => authStore.isLoggedIn)
/** 当前用户信息 */
const user = computed(() => authStore.userInfo)

const avatarLetter = computed(() => {
  const name = user.value?.username
  if (!name) return ''
  return name.charAt(0).toUpperCase()
})

function goToLogin() {
  router.push({ path: '/login', query: { redirect: route.fullPath } })
}

const isLoggingOut = ref(false)

/**
 * 处理退出登录
 * 1. 清空本地鉴权状态 + 同步队列
 * 2. 跳转到登录页
 */
async function handleLogout() {
  if (isLoggingOut.value) return
  isLoggingOut.value = true
  try {
    await authStore.logout()
    message.success('已退出登录')
    router.replace('/login')
  } catch (err) {
    console.error('[setting] 退出登录异常:', err)
    message.error('退出登录失败，请重试')
  } finally {
    isLoggingOut.value = false
  }
}
</script>

<template>
  <div class="setting">
    <!-- 用户信息卡片 -->
    <a-card style="margin-bottom: 10px">
      <template #title>
        <div class="setting-title">
          <UserOutlined :style="{ fontSize: '16px' }" /> 用户中心
        </div>
      </template>

      <!-- 未登录状态：引导去登录 -->
      <div v-if="!isLoggedIn" class="empty-state">
        <div class="empty-icon">
          <UserOutlined />
        </div>
        <p class="empty-text">您还未登录，登录后可同步简历到云端</p>
        <a-button type="primary" size="large" @click="goToLogin">
          <LoginOutlined /> 去登录
        </a-button>
      </div>

      <!-- 已登录状态：展示用户信息 + 退出按钮 -->
      <div v-else class="user-content">
        <div class="user-info">
          <!-- 字母头像 -->
          <div class="avatar">
            <span v-if="avatarLetter">{{ avatarLetter }}</span>
            <UserOutlined v-else />
          </div>
          <!-- 用户详情 -->
          <div class="user-detail">
            <div class="user-name">{{ user?.username || '未命名用户' }}</div>
            <div class="user-meta">
              <span class="meta-item">
                <MailOutlined />
                {{ user?.email || '未绑定邮箱' }}
              </span>
            </div>
          </div>
        </div>
        <!-- 操作按钮 -->
        <div class="user-action">
          <Popconfirm
            title="确认退出登录？"
            ok-text="确认"
            cancel-text="取消"
            @confirm="handleLogout"
          >
            <a-button size="large" danger :loading="isLoggingOut">
              <LogoutOutlined /> 退出登录
            </a-button>
          </Popconfirm>
        </div>
      </div>
    </a-card>
  </div>
</template>

<style scoped lang="scss">
/* ====== 未登录空状态 ====== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem 0 0.5rem;

  .empty-icon {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    margin-bottom: 1rem;
    color: $primary-color;
    background: rgba(22, 119, 255, 0.1);
  }

  .empty-text {
    margin-bottom: 1.5rem;
    color: rgba(0, 0, 0, 0.55);
    @include themify(
      (
        color: (
          light: rgba(0, 0, 0, 0.55),
          dark: rgba(255, 255, 255, 0.7),
        ),
      )
    );
  }
}

/* ====== 已登录用户内容 ====== */
.user-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  min-width: 0;
}

/* 字母头像 */
.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
  flex-shrink: 0;
  background: linear-gradient(135deg, #1e3c72 0%, #5b86e5 100%);
}

.user-detail {
  min-width: 0;

  .user-name {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #333;
    @include themify(
      (
        color: (
          light: #333,
          dark: #f8faff,
        ),
      )
    );
  }

  .user-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.5rem;
    font-size: 0.875rem;
    color: rgba(0, 0, 0, 0.55);
    @include themify(
      (
        color: (
          light: rgba(0, 0, 0, 0.55),
          dark: rgba(255, 255, 255, 0.7),
        ),
      )
    );

    .meta-item {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
  }
}

.user-action {
  flex-shrink: 0;
}

/* 窄屏布局自适应：用户信息与按钮纵向堆叠 */
@media (max-width: 640px) {
  .user-content {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
