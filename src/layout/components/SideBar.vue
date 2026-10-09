<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { header_nav_items } from '@/router'
import type { HeaderNavItem } from '@/router'
import LineMdGithub from '~icons/line-md/github'
import ThemeIcon from '@/components/ThemeIcon.vue'
import NavDropdown from './NavDropdown.vue'

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

/** 点击普通菜单项发起导航 */
const handleClick = (path: string) => {
  router.push(path)
}

/** 跳转 GitHub 仓库 */
const goToGithub = () => {
  window.location.href = 'https://github.com/mixdmatches/orange-resume'
}

/** 下拉项类型守卫 */
const isDropdown = (
  item: HeaderNavItem,
): item is HeaderNavItem & {
  type: 'dropdown'
  children: NonNullable<HeaderNavItem['children']>
} => item.type === 'dropdown'

/** 普通项类型守卫 */
const isItem = (
  item: HeaderNavItem,
): item is HeaderNavItem & { type: 'item'; path: string } =>
  item.type === 'item' && !!item.path
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

      <!-- 中间：横向导航菜单 -->
      <nav class="header-nav" aria-label="主导航">
        <template
          v-for="item in header_nav_items"
          :key="item.type === 'dropdown' ? `dd-${item.label}` : item.path"
        >
          <!-- 下拉分组 -->
          <nav-dropdown
            v-if="isDropdown(item)"
            :label="item.label"
            :icon="item.icon"
            :items="item.children"
            :active-path="activePath"
          />

          <!-- 普通按钮 -->
          <button
            v-else-if="isItem(item)"
            type="button"
            class="nav-item"
            :class="{ active: activePath === item.path }"
            @click="handleClick(item.path)"
          >
            <span class="nav-icon">
              <component :is="item.icon()" />
            </span>
            <span class="nav-label">{{ item.label }}</span>
          </button>
        </template>
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
    font-size: var(--text-lg);
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
  gap: var(--space-4);
}

.nav-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 var(--space-3);
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  cursor: pointer;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  transition:
    background var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);

  &:hover {
    background: var(--color-bg-muted);
    color: var(--color-text);
  }

  &.active {
    background: var(--color-primary-bg);
    color: var(--color-primary);
    font-weight: var(--font-semibold);

    .nav-icon {
      color: var(--color-primary);
    }
  }

  .nav-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: var(--color-text-tertiary);
    transition: color var(--duration-fast) var(--ease-out);
  }

  .nav-label {
    line-height: 1;
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
    background var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);

  &:hover {
    background: var(--color-bg-muted);
    color: var(--color-text);
  }
}
</style>
