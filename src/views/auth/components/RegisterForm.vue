<script setup lang="ts">
import { reactive, ref } from 'vue'
import { type FormInstance, message } from 'ant-design-vue'
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { initRepository } from '@/service/resumeRepository'
import type { RegisterParams } from '@/types/user'

const emit = defineEmits<{
  success: []
}>()

const authStore = useAuthStore()
const loading = ref(false)

const formRef = ref<FormInstance>()
const state = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名3-20位', trigger: 'blur' },
    {
      pattern: /^[A-Za-z0-9_]+$/,
      message: '用户名只能包含字母、数字、下划线',
      trigger: 'blur',
    },
  ],
  email: [
    { required: true, message: '请输入 QQ 邮箱', trigger: 'blur' },
    {
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
      validator: (_rule: unknown, value: string) =>
        value === state.password
          ? Promise.resolve()
          : Promise.reject('两次输入的密码不一致'),
      trigger: 'blur',
    },
  ],
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    loading.value = true
    const params: RegisterParams = {
      username: state.username,
      password: state.password,
      confirmPassword: state.confirmPassword,
      email: state.email || undefined,
    }
    await authStore.register(params)
    await message.success('注册成功')
    initRepository()
    emit('success')
  } catch {
    // 校验失败或接口报错已由拦截器处理
  } finally {
    loading.value = false
  }
}

defineExpose({ loading })
</script>

<template>
  <a-form ref="formRef" :model="state" :rules="rules" layout="vertical">
    <a-form-item name="username">
      <a-input
        v-model:value="state.username"
        size="large"
        placeholder="用户名"
        allow-clear
      >
        <template #prefix><UserOutlined /></template>
      </a-input>
    </a-form-item>
    <a-form-item name="email">
      <a-input
        v-model:value="state.email"
        size="large"
        placeholder="QQ 邮箱"
        allow-clear
      >
        <template #prefix><MailOutlined /></template>
      </a-input>
    </a-form-item>
    <a-form-item name="password">
      <a-input-password
        v-model:value="state.password"
        size="large"
        placeholder="密码（至少 6 位）"
      >
        <template #prefix><LockOutlined /></template>
      </a-input-password>
    </a-form-item>
    <a-form-item name="confirmPassword">
      <a-input-password
        v-model:value="state.confirmPassword"
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
        @click="handleSubmit"
      >
        注册
      </a-button>
    </a-form-item>
  </a-form>
</template>
