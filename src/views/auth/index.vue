<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginForm from './components/LoginForm.vue'
import RegisterForm from './components/RegisterForm.vue'
import ForgotForm from './components/ForgotForm.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

/** 当前激活的 Tab：login / register */
const activeTab = ref<'login' | 'register'>('login')

/** 是否展示忘记密码面板 */
const showForgot = ref(false)

/**
 * 登录/注册成功后的统一跳转
 * 优先跳转 query.redirect，否则跳首页
 */
function redirectAfterAuth() {
  const redirect = route.query.redirect
  router.replace(typeof redirect === 'string' ? redirect : '/app')
}

/**
 * 页面挂载时：
 * - 若已登录 → 跳首页，避免重复登录
 * - 若未登录但有残留 userInfo → 清理（401 场景）
 */
onMounted(() => {
  if (authStore.isLoggedIn) {
    router.replace('/')
  } else {
    authStore.clearAuth()
  }
})
</script>

<template>
  <div class="auth-page">
    <!-- ============ 左侧品牌区 ============ -->
    <aside class="brand-side">
      <svg
        class="brand-deco"
        viewBox="0 0 480 600"
        preserveAspectRatio="xMidYMid slice"
      >
        <g stroke="rgba(255,255,255,0.06)" stroke-width="1">
          <line
            v-for="i in 9"
            :key="`v${i}`"
            :x1="i * 60"
            y1="0"
            :x2="i * 60"
            y2="600"
          />
          <line
            v-for="i in 11"
            :key="`h${i}`"
            x1="0"
            :y1="i * 60"
            x2="480"
            :y2="i * 60"
          />
        </g>
        <circle
          cx="240"
          cy="300"
          r="180"
          fill="none"
          stroke="rgba(22,119,255,0.5)"
          stroke-width="1"
        />
        <circle
          cx="240"
          cy="300"
          r="140"
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          stroke-width="1"
        />
        <circle
          cx="240"
          cy="300"
          r="100"
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          stroke-width="1"
        />
        <circle cx="240" cy="300" r="56" fill="#1677ff" opacity="0.92" />
        <circle cx="380" cy="160" r="8" fill="#1677ff" />
        <circle
          cx="380"
          cy="160"
          r="20"
          fill="none"
          stroke="rgba(22,119,255,0.4)"
          stroke-width="1"
        />
        <circle cx="100" cy="440" r="6" fill="#69b1ff" />
      </svg>

      <div class="brand-content">
        <div class="brand-mark">
          <img src="~@/assets/images/logo.png" alt="橘子简历" />
        </div>
        <h1 class="brand-title">橘子简历</h1>
        <p class="brand-tagline">用 AI 陪你打造一份好简历</p>
      </div>
    </aside>

    <!-- ============ 右侧表单区 ============ -->
    <main class="form-side">
      <div class="form-card">
        <!-- 忘记密码面板 -->
        <ForgotForm
          v-if="showForgot"
          @back="showForgot = false"
          @success="
            () => {
              showForgot = false
              activeTab = 'login'
            }
          "
        />

        <!-- 登录 / 注册面板 -->
        <template v-else>
          <header class="form-header">
            <h2 class="form-title">
              {{ activeTab === 'login' ? '欢迎回来' : '创建账号' }}
            </h2>
            <p class="form-subtitle">
              {{
                activeTab === 'login'
                  ? '登录后继续编辑你的简历'
                  : '注册后即可使用所有 AI 功能'
              }}
            </p>
          </header>

          <a-tabs
            v-model:active-key="activeTab"
            centered
            :tabbar-style="{
              borderBottom: '1px solid var(--color-border)',
              marginBottom: '1.5rem',
            }"
          >
            <a-tab-pane key="login" tab="登录">
              <LoginForm
                @success="redirectAfterAuth"
                @forgot="showForgot = true"
              />
            </a-tab-pane>
            <a-tab-pane key="register" tab="注册">
              <RegisterForm @success="redirectAfterAuth" />
            </a-tab-pane>
          </a-tabs>
        </template>
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
.auth-page {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100vh;
  overflow: hidden;
}

/* ============ 左侧品牌区 ============ */
.brand-side {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-text);
  color: var(--color-text-inverse);
  overflow: hidden;

  .brand-deco {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0.95;
  }

  .brand-content {
    position: relative;
    z-index: 1;
    text-align: center;
    padding: 0 var(--space-8);
  }

  .brand-mark {
    display: flex;
    justify-content: center;
    margin-bottom: var(--space-6);

    img {
      width: 56px;
      height: auto;
      filter: brightness(0) invert(1);
    }
  }

  .brand-title {
    font-family: var(--font-display), serif;
    font-size: var(--text-4xl);
    font-weight: var(--font-bold);
    letter-spacing: var(--tracking-tight);
    color: #fff;
    margin-bottom: var(--space-3);
  }

  .brand-tagline {
    font-size: var(--text-lg);
    color: rgba(255, 255, 255, 0.7);
    line-height: var(--leading-relaxed);
  }
}

/* ============ 右侧表单区 ============ */
.form-side {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
  background: var(--color-bg);

  .form-card {
    width: 100%;
    max-width: 400px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: var(--space-8) var(--space-8) var(--space-6);
    box-shadow: var(--shadow-sm);
  }

  .form-header {
    text-align: center;
    margin-bottom: var(--space-6);
  }

  .form-title {
    font-family: var(--font-display), serif;
    font-size: var(--text-2xl);
    font-weight: var(--font-semibold);
    color: var(--color-text);
    letter-spacing: var(--tracking-tight);
    margin-bottom: var(--space-2);
  }

  .form-subtitle {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }
}

/* ============ 响应式 ============ */
@media (max-width: 768px) {
  .auth-page {
    grid-template-columns: 1fr;
  }

  .brand-side {
    display: none;
  }

  .form-side {
    padding: var(--space-5);
  }
}
</style>
