<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, type FormInstance } from 'ant-design-vue'
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { initRepository } from '@/service/resumeRepository'
import type { RegisterParams } from '@/types/user'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

/** 当前激活的 Tab：login / register */
const activeTab = ref<'login' | 'register'>('login')

/** 提交按钮 loading 状态（两个表单共用） */
const loading = ref(false)

/* ----------------- 登录表单 ----------------- */
const loginFormRef = ref<FormInstance>()
const loginState = reactive({
  username: '',
  password: '',
})
const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

/* ----------------- 注册表单 ----------------- */
const registerFormRef = ref<FormInstance>()
const registerState = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})
const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    {
      min: 3,
      max: 20,
      message: '用户名3-20位',
      trigger: 'blur',
    },
    {
      // 注意：pattern 必须传 RegExp 对象，async-validator 会静默忽略字符串形式的 pattern
      pattern: /^[A-Za-z0-9_]+$/,
      message: '用户名只能包含字母、数字、下划线',
      trigger: 'blur',
    },
  ],
  email: [
    {
      required: true,
      message: '请输入 QQ 邮箱',
      trigger: 'blur',
    },
    {
      // 仅允许 QQ 邮箱：数字账号或英文别名均可（如 12345@qq.com、alias@qq.com）
      pattern: /^[A-Za-z0-9._%+-]+@qq\.com$/,
      message: '仅支持 QQ 邮箱（格式：xxx@qq.com）',
      trigger: 'blur',
    },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      // 自定义校验：两次密码必须一致
      validator: (_rule: unknown, value: string) =>
        value === registerState.password
          ? Promise.resolve()
          : Promise.reject('两次输入的密码不一致'),
      trigger: 'blur',
    },
  ],
}

/**
 * 登录/注册成功后的统一跳转
 * 优先跳转 query.redirect，否则跳首页
 */
function redirectAfterAuth() {
  const redirect = route.query.redirect
  router.replace(typeof redirect === 'string' ? redirect : '/app')
}

/**
 * 处理登录提交
 * 先校验表单，再调用 store.login，成功后跳转
 * 同时启动 Local-First 同步引擎（注册网络监听 + 回放离线队列）
 */
async function handleLogin() {
  try {
    await loginFormRef.value?.validate()
    loading.value = true
    await authStore.login(loginState)
    message.success('登录成功')
    await authStore.fetchProfile()
    // 登录成功后启动 Repository（多次调用安全，内部有 listening 标志）
    initRepository()
    redirectAfterAuth()
  } catch {
    // 校验失败或接口报错，错误提示已由拦截器/校验处理
  } finally {
    loading.value = false
  }
}

/**
 * 处理注册提交
 * 先校验表单，再调用 store.register，成功后跳转
 * 同时启动 Local-First 同步引擎
 */
async function handleRegister() {
  try {
    await registerFormRef.value?.validate()
    loading.value = true
    const params: RegisterParams = {
      username: registerState.username,
      password: registerState.password,
      confirmPassword: registerState.confirmPassword,
      email: registerState.email || undefined,
    }
    await authStore.register(params)
    message.success('注册成功')
    // 注册成功后同样启动 Repository
    initRepository()
  } catch {
    // 校验失败或接口报错
  } finally {
    loading.value = false
  }
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
      <!-- 极简 SVG 几何装饰：网格 + 圆环 -->
      <svg
        class="brand-deco"
        viewBox="0 0 480 600"
        preserveAspectRatio="xMidYMid slice"
      >
        <!-- 网格线 -->
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
        <!-- 中心圆环（三层同心圆，描边） -->
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
        <!-- 主色实心圆 -->
        <circle cx="240" cy="300" r="56" fill="#1677ff" opacity="0.92" />
        <!-- 右上小圆 -->
        <circle cx="380" cy="160" r="8" fill="#1677ff" />
        <circle
          cx="380"
          cy="160"
          r="20"
          fill="none"
          stroke="rgba(22,119,255,0.4)"
          stroke-width="1"
        />
        <!-- 左下小圆 -->
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
          <!-- 登录 Tab -->
          <a-tab-pane key="login" tab="登录">
            <a-form
              ref="loginFormRef"
              :model="loginState"
              :rules="loginRules"
              layout="vertical"
            >
              <a-form-item name="username">
                <a-input
                  v-model:value="loginState.username"
                  size="large"
                  placeholder="用户名"
                  allow-clear
                >
                  <template #prefix><UserOutlined /></template>
                </a-input>
              </a-form-item>
              <a-form-item name="password">
                <a-input-password
                  v-model:value="loginState.password"
                  size="large"
                  placeholder="密码"
                >
                  <template #prefix><LockOutlined /></template>
                </a-input-password>
              </a-form-item>
              <a-form-item>
                <a-button
                  type="primary"
                  size="large"
                  block
                  :loading="loading"
                  @click="handleLogin"
                >
                  登录
                </a-button>
              </a-form-item>
            </a-form>
          </a-tab-pane>

          <!-- 注册 Tab -->
          <a-tab-pane key="register" tab="注册">
            <a-form
              ref="registerFormRef"
              :model="registerState"
              :rules="registerRules"
              layout="vertical"
            >
              <a-form-item name="username">
                <a-input
                  v-model:value="registerState.username"
                  size="large"
                  placeholder="用户名"
                  allow-clear
                >
                  <template #prefix><UserOutlined /></template>
                </a-input>
              </a-form-item>
              <a-form-item name="email">
                <a-input
                  v-model:value="registerState.email"
                  size="large"
                  placeholder="QQ 邮箱"
                  allow-clear
                >
                  <template #prefix><MailOutlined /></template>
                </a-input>
              </a-form-item>
              <a-form-item name="password">
                <a-input-password
                  v-model:value="registerState.password"
                  size="large"
                  placeholder="密码（至少 6 位）"
                >
                  <template #prefix><LockOutlined /></template>
                </a-input-password>
              </a-form-item>
              <a-form-item name="confirm">
                <a-input-password
                  v-model:value="registerState.confirmPassword"
                  size="large"
                  placeholder="确认密码"
                >
                  <template #prefix><LockOutlined /></template>
                </a-input-password>
              </a-form-item>
              <a-form-item>
                <a-button
                  type="primary"
                  size="large"
                  block
                  :loading="loading"
                  @click="handleRegister"
                >
                  注册
                </a-button>
              </a-form-item>
            </a-form>
          </a-tab-pane>
        </a-tabs>
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
      filter: brightness(0) invert(1); // logo 反白
    }
  }

  .brand-title {
    font-family: var(--font-display);
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
    font-family: var(--font-display);
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
