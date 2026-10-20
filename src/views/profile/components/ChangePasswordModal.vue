<script setup lang="ts">
import { reactive, ref } from 'vue'
import { type FormInstance, message } from 'ant-design-vue'
import { LockOutlined } from '@ant-design/icons-vue'
import { changePasswordApi } from '@/api/auth'

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

defineProps<{
  open: boolean
}>()

const loading = ref(false)
const formRef = ref<FormInstance>()

const state = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

function resetForm() {
  state.oldPassword = ''
  state.newPassword = ''
  state.confirmPassword = ''
  formRef.value?.resetFields()
}

const rules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码至少 6 位', trigger: 'blur' },
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

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  loading.value = true
  try {
    await changePasswordApi({
      oldPassword: state.oldPassword,
      newPassword: state.newPassword,
    })
    message.success('密码修改成功')
    resetForm()
    emit('update:open', false)
  } catch {
    // 接口异常由拦截器提示（如"旧密码错误"）
  } finally {
    loading.value = false
  }
}

function handleCancel() {
  resetForm()
  emit('update:open', false)
}
</script>

<template>
  <a-modal
    :open="open"
    title="修改密码"
    :confirm-loading="loading"
    :mask-closable="false"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <a-form
      ref="formRef"
      :model="state"
      :rules="rules"
      layout="vertical"
      class="change-pwd-form"
    >
      <a-form-item label="当前密码" name="oldPassword">
        <a-input-password
          v-model:value="state.oldPassword"
          placeholder="请输入当前密码"
          size="large"
        >
          <template #prefix><LockOutlined /></template>
        </a-input-password>
      </a-form-item>

      <a-form-item label="新密码" name="newPassword">
        <a-input-password
          v-model:value="state.newPassword"
          placeholder="新密码（至少 6 位）"
          size="large"
        >
          <template #prefix><LockOutlined /></template>
        </a-input-password>
      </a-form-item>

      <a-form-item label="确认新密码" name="confirmPassword">
        <a-input-password
          v-model:value="state.confirmPassword"
          placeholder="请再次输入新密码"
          size="large"
        >
          <template #prefix><LockOutlined /></template>
        </a-input-password>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<style scoped lang="scss">
.change-pwd-form {
  margin-top: var(--space-4);
}
</style>
