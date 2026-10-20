<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Modal } from 'ant-design-vue'
import {
  DeleteOutlined,
  KeyOutlined,
  LogoutOutlined,
} from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'
import ChangePasswordModal from './ChangePasswordModal.vue'

const authStore = useAuthStore()
const router = useRouter()
const changePasswordVisible = ref(false)

/** 退出登录：二次确认后清除 token 并跳转登录页 */
const handleLogout = () => {
  Modal.confirm({
    title: '确认退出登录？',
    content: '退出后需重新登录才能访问简历数据',
    okText: '退出登录',
    cancelText: '取消',
    okType: 'danger',
    onOk: async () => {
      await authStore.logout()
      await router.push('/login')
    },
  })
}

/**
 * 注销账号
 */
const handleDeleteAccount = () => {
  Modal.confirm({
    title: '确认退出登录？',
    content: '退出后需重新登录才能访问简历数据',
    okText: '退出登录',
    cancelText: '取消',
    okType: 'danger',
    onOk: async () => {
      await authStore.deleteAccount()
      await router.push('/login')
    },
  })
}
</script>

<template>
  <div class="settings-list">
    <!-- 修改密码 -->
    <div class="settings-row">
      <div class="settings-text">
        <span class="settings-title">修改密码</span>
        <span class="settings-desc">定期更新密码保护账号安全</span>
      </div>
      <a-button @click="changePasswordVisible = true">
        <template #icon><key-outlined /></template>
        修改
      </a-button>
    </div>
    <div class="row-divider"></div>
    <!-- 退出登录 -->
    <div class="settings-row">
      <div class="settings-text">
        <span class="settings-title danger">退出登录</span>
        <span class="settings-desc"
          >退出后清除本机简历缓存，简历数据已保存在云端</span
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
        <span class="settings-desc">永久删除账号及云端全部数据，不可恢复</span>
      </div>
      <a-button danger type="primary" @click="handleDeleteAccount">
        <template #icon><delete-outlined /></template>
        注销账号
      </a-button>
    </div>
  </div>

  <ChangePasswordModal v-model:open="changePasswordVisible" />
</template>

<style scoped lang="scss">
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

@media (max-width: 640px) {
  .settings-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
