<script setup lang="ts">
/**
 * Setting · 通用设置页
 *
 * 苹果系统偏好设置风格：单列卡片堆叠，统一外壳
 * - 子组件 UserSetting / ApiKeySetting 内部逻辑保留不变
 * - 本次仅统一外壳（page-header + setting-stack）
 */
import UserSetting from './components/UserSetting.vue'
import ApiKeySetting from './components/ApiKeySetting.vue'
</script>

<template>
  <div class="page page-setting">
    <header class="page-header">
      <div>
        <h1 class="page-title">通用设置</h1>
        <p class="page-subtitle">管理账号信息与 AI 接口配置</p>
      </div>
    </header>

    <section class="setting-stack">
      <UserSetting />
      <ApiKeySetting />
    </section>
  </div>
</template>

<style scoped lang="scss">
.page-setting {
  .setting-stack {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    max-width: 720px;
    margin: 0 auto;
  }
}
</style>
