<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Modal } from 'ant-design-vue'
import {
  LogoutOutlined,
  DeleteOutlined,
  KeyOutlined,
  MailOutlined,
} from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

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
        <span class="settings-desc">永久删除账号及云端全部数据，不可恢复</span>
      </div>
      <a-button danger type="primary" @click="handleDeleteAccount">
        <template #icon><delete-outlined /></template>
        注销账号
      </a-button>
    </div>
  </div>
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
