<script lang="ts" setup>
/**
 * SideBar.vue（实为顶部 SiteHeader，保留文件名以免破坏 import）
 *
 * 苹果官网导航风格：左 logo + 居中文字菜单 + 右极简操作
 * 移除 a-menu（默认样式平庸），改原生 <nav> + <a> 自定义
 * 高度 56px，纯白底，1px 底边
 */
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { header_routes } from '@/router'
import LineMdGithub from '~icons/line-md/github'
import ThemeIcon from '@/components/ThemeIcon.vue'

const router = useRouter()

/** 当前激活的菜单项路径（基于 router.currentRoute.value.path 计算）*/
const activePath = ref<string>('')

/** 路由变化时同步激活菜单项 */
watch(
  () => router.currentRoute.value.path,
  newVal => {
    activePath.value = newVal as string
  },
  { immediate: true },
)

/** 菜单项数据（基于 header_routes 派生）*/
const navItems = computed(() =>
  header_routes.map(item => ({
    path: item.path,
    title: item.meta?.title as string,
  })),
)

/** 点击菜单项发起导航 */
const handleClick = (path: string) => {
  router.push(path)
}

/** 跳转 GitHub 仓库 */
const goToGithub = () => {
  window.location.href = 'https://github.com/mixdmatches/orange-resume'
}
</script>

<template>
  <header class="site-header">
    <div class="header-inner">
      <!-- 左侧：品牌区（logo + 文字）-->
      <div class="header-brand" @click="router.push('/')">
        <img
          class="brand-logo"
          src="~@/assets/images/logo.png"
          alt="橘子简历"
        />
        <span class="brand-name">橘子简历</span>
      </div>

      <!-- 中间：横向导航菜单（原生 nav，自定义样式）-->
      <nav class="header-nav">
        <a
          v-for="item in navItems"
          :key="item.path"
          class="nav-item"
          :class="{ active: activePath === item.path }"
          @click="handleClick(item.path)"
        >
          {{ item.title }}
        </a>
      </nav>

      <!-- 右侧：操作区 -->
      <div class="header-actions">
        <button class="icon-btn" title="GitHub 仓库" @click="goToGithub">
          <line-md-github class="action-icon" />
        </button>
        <div class="icon-btn">
          <theme-icon />
        </div>
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.site-header {
  height: var(--header-height);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
}

.header-inner {
  max-width: var(--content-max-width);
  margin: 0 auto;
  height: 100%;
  padding: 0 var(--space-8);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-6);

  @media (max-width: 768px) {
    padding: 0 var(--space-5);
    gap: var(--space-4);
    // 移动端隐藏导航文字，仅保留 logo + 操作
    .header-nav {
      display: none;
    }
  }
}

/* ============ 品牌区 ============ */
.header-brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  flex-shrink: 0;

  .brand-logo {
    height: 32px;
    width: auto;
    object-fit: contain;
  }

  .brand-name {
    font-family: var(--font-display);
    font-size: var(--text-3xl);
    font-weight: var(--font-semibold);
    letter-spacing: var(--tracking-tight);
    color: var(--color-text);
  }

  &:hover .brand-name {
    color: var(--color-primary);
  }
}

/* ============ 导航 ============ */
.header-nav {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.nav-item {
  position: relative;
  padding: 0 var(--space-3);
  height: var(--header-height);
  display: inline-flex;
  align-items: center;
  // 导航高频交互入口，24px
  font-size: var(--text-xl);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: color var(--duration-base) var(--ease-out);

  &:hover {
    color: var(--color-text);
  }

  &.active {
    color: var(--color-text);

    // 苹果风：底部 2px 主色指示条
    &::after {
      content: '';
      position: absolute;
      bottom: -1px; // 覆盖 header 底边
      left: var(--space-3);
      right: var(--space-3);
      height: 2px;
      background: var(--color-primary);
      border-radius: var(--radius-full);
    }
  }
}

/* ============ 操作区 ============ */
.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex-shrink: 0;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--color-text-secondary);
  transition:
    background var(--duration-base) var(--ease-out),
    color var(--duration-base) var(--ease-out);

  &:hover {
    background: var(--color-surface-hover);
    color: var(--color-text);
  }
}
</style>
