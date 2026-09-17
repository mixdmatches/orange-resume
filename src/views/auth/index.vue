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
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [
    {
      required: true,
      type: 'email',
      message: '邮箱格式不正确',
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
  router.replace(typeof redirect === 'string' ? redirect : '/')
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
    <!-- 左侧品牌展示区 -->
    <div class="brand-side">
      <div class="brand-content">
        <h1 class="brand-title">橙子简历</h1>
        <p class="brand-slogan">用 AI 陪你打造一份好简历</p>
        <p class="brand-desc">
          智能润色 · 语法检查 · 模拟面试<br />
          让每一份简历都闪闪发光
        </p>
      </div>
    </div>

    <!-- 右侧表单区 -->
    <div class="form-side">
      <div class="form-wrapper">
        <a-tabs v-model:active-key="activeTab" centered>
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
                  placeholder="邮箱"
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
    </div>
  </div>
</template>

<style scoped lang="scss">
.auth-page {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.brand-side {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 45%;
  background-image:
    url('https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Minimal%20blue%20gradient%20abstract%20illustration%2C%20soft%20geometric%20shapes%2C%20fluid%20curves%2C%20workspace%20vibe%2C%20resume%20concept%2C%20premium%20UI%20background%2C%20no%20text&image_size=portrait_4_3'),
    linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #5b86e5 100%);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  color: #fff;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(22, 119, 255, 0.45) 0%,
      rgba(30, 60, 114, 0.55) 100%
    );
  }

  .brand-content {
    position: relative;
    z-index: 1;
    text-align: center;
    padding: 0 2rem;
  }

  .brand-title {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 1rem;
    letter-spacing: 0.2rem;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .brand-slogan {
    font-size: 1.4rem;
    margin-bottom: 1.5rem;
    opacity: 0.97;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  }

  .brand-desc {
    font-size: 1rem;
    line-height: 1.8;
    opacity: 0.92;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  }
}

/* 右侧表单区 */
.form-side {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 55%;
  padding: 2rem;
  background: #fff;

  .form-wrapper {
    width: 100%;
    max-width: 400px;
  }
}

/* 窄屏隐藏品牌区，表单区占满 */
@media (max-width: 768px) {
  .brand-side {
    display: none;
  }

  .form-side {
    width: 100%;
  }
}
</style>
