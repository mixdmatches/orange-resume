<script setup lang="ts">
/**
 * Layout · 应用壳
 * 顶部 56px SiteHeader + 主内容区（贴边，子页面自控 padding）
 * 路由切换过渡：fade（200ms 苹果式淡入）
 */
import SideBar from './components/SideBar.vue'
</script>

<template>
  <div class="app-shell">
    <side-bar />
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style scoped lang="scss">
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-bg);
}

.app-main {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  // 移除外层 padding，子页面通过 .page 类自控
  // 这样避免 layout padding 与子页面 padding 双重叠加
}
</style>
