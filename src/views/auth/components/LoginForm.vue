<script setup lang="ts">
import { reactive, ref } from 'vue'
import { type FormInstance, message } from 'ant-design-vue'
import { LockOutlined, UserOutlined } from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { initRepository } from '@/service/resumeRepository'

const emit = defineEmits<{
  success: []
  forgot: []
}>()

const authStore = useAuthStore()
const loading = ref(false)

const formRef = ref<FormInstance>()
const state = reactive({
  usernameOrEmail: '',
  password: '',
})

const rules = {
  usernameOrEmail: [
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' },
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    loading.value = true
    await authStore.login(state)
    await message.success('登录成功')
    await authStore.fetchProfile()
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
        v-model:value="state.usernameOrEmail"
        size="large"
        placeholder="用户名或邮箱"
        allow-clear
      >
        <template #prefix><UserOutlined /></template>
      </a-input>
    </a-form-item>
    <a-form-item name="password">
      <a-input-password
        v-model:value="state.password"
        size="large"
        placeholder="密码"
      >
        <template #prefix><LockOutlined /></template>
      </a-input-password>
    </a-form-item>
    <a-form-item>
      <div class="login-extras">
        <a class="forgot-link" @click="$emit('forgot')"> 忘记密码？ </a>
      </div>
    </a-form-item>
    <a-form-item>
      <a-button
        type="primary"
        size="large"
        block
        :loading="loading"
        @click="handleSubmit"
      >
        登录
      </a-button>
    </a-form-item>
  </a-form>
</template>

<style scoped lang="scss">
.login-extras {
  display: flex;
  justify-content: flex-end;

  .forgot-link {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    cursor: pointer;

    &:hover {
      color: var(--color-primary);
    }
  }
}
</style>
