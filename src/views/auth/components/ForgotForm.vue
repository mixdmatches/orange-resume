<script setup lang="ts">
import { reactive, ref } from 'vue'
import { type FormInstance, message } from 'ant-design-vue'
import {
  ArrowLeftOutlined,
  LockOutlined,
  MailOutlined,
  SafetyOutlined,
} from '@ant-design/icons-vue'
import { getVerifyCodeApi, resetPasswordApi } from '@/api'
import { useCountdown } from '@/hooks/useCountdown.ts'

const emit = defineEmits<{
  back: []
  success: []
}>()

const loading = ref(false)
const { countdown, start: startCountdown, stop: stopCountdown } = useCountdown()

const formRef = ref<FormInstance>()
const state = reactive({
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: '',
})

const rules = {
  email: [
    { required: true, message: '请输入 QQ 邮箱', trigger: 'blur' },
    {
      pattern: /^[A-Za-z0-9._%+-]+@qq\.com$/,
      message: '仅支持 QQ 邮箱（格式：xxx@qq.com）',
      trigger: 'blur',
    },
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为 6 位数字', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_rule: unknown, value: string) =>
        value === state.newPassword
          ? Promise.resolve()
          : Promise.reject('两次输入的密码不一致'),
      trigger: 'blur',
    },
  ],
}

async function handleSendCode() {
  try {
    await formRef.value?.validateFields('email')
  } catch {
    return
  }

  if (countdown.value > 0) return
  try {
    await getVerifyCodeApi(state.email)
    message.success('验证码已发送，请查收邮件')
    startCountdown()
  } catch {
    // 接口异常由拦截器提示
  }
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  loading.value = true
  try {
    await resetPasswordApi({
      email: state.email,
      code: state.code,
      newPassword: state.newPassword,
    })
    message.success('密码重置成功，请使用新密码登录')
    emit('success')
  } catch {
    // 接口异常由拦截器提示
  } finally {
    loading.value = false
  }
}

function handleBack() {
  state.email = ''
  state.code = ''
  state.newPassword = ''
  state.confirmPassword = ''
  stopCountdown()
  emit('back')
}

defineExpose({ loading })
</script>

<template>
  <div>
    <header class="form-header">
      <a-button type="link" class="back-btn" @click="handleBack">
        <template #icon>
          <ArrowLeftOutlined />
        </template>
        返回登录
      </a-button>
      <h2 class="form-title">忘记密码</h2>
      <p class="form-subtitle">输入邮箱获取验证码并设置新密码</p>
    </header>

    <a-form ref="formRef" :model="state" :rules="rules" layout="vertical">
      <a-form-item name="email">
        <a-input
          v-model:value="state.email"
          size="large"
          placeholder="QQ 邮箱"
          allow-clear
        >
          <template #prefix>
            <MailOutlined />
          </template>
        </a-input>
      </a-form-item>

      <a-form-item name="code">
        <a-input
          v-model:value="state.code"
          size="large"
          placeholder="6 位验证码"
          :maxlength="6"
        >
          <template #prefix>
            <SafetyOutlined />
          </template>
          <template #suffix>
            <a-button
              type="link"
              size="small"
              :disabled="countdown > 0"
              @click="handleSendCode"
            >
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </a-button>
          </template>
        </a-input>
      </a-form-item>

      <a-form-item name="newPassword">
        <a-input-password
          v-model:value="state.newPassword"
          size="large"
          placeholder="新密码（至少 6 位）"
        >
          <template #prefix>
            <LockOutlined />
          </template>
        </a-input-password>
      </a-form-item>

      <a-form-item name="confirmPassword">
        <a-input-password
          v-model:value="state.confirmPassword"
          size="large"
          placeholder="确认新密码"
        >
          <template #prefix>
            <LockOutlined />
          </template>
        </a-input-password>
      </a-form-item>

      <a-form-item>
        <a-button
          type="primary"
          size="large"
          block
          :loading="loading"
          @click="handleSubmit"
        >
          重置密码
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<style scoped lang="scss">
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

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  margin-bottom: var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);

  &:hover {
    color: var(--color-primary);
  }
}
</style>
