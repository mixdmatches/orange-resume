<script setup lang="ts">
import LineMdMoonAltLoop from '~icons/line-md/moon-alt-loop'
import LineMdMoonAltToSunnyOutlineLoopTransition from '~icons/line-md/moon-alt-to-sunny-outline-loop-transition'
import LineMdGithub from '~icons/line-md/github'
import { useThemeStore } from '@/stores/theme.ts'
// ---------------------------------主题切换
const theme = useThemeStore()
</script>

<template>
  <div class="head">
    <span class="title">{{ $route.meta.title }}</span>
    <div class="work">
      <line-md-github />
      <a-dropdown>
        <line-md-moon-alt-to-sunny-outline-loop-transition
          v-if="theme.currentTheme === 'dark'"
        />
        <line-md-moon-alt-loop v-else />
        <template #overlay>
          <a-menu>
            <a-menu-item @click="theme.switchTheme('light')">
              <a href="javascript:;">Light Theme</a>
            </a-menu-item>
            <a-menu-item @click="theme.switchTheme('dark')">
              <a href="javascript:;">Dark Theme</a>
            </a-menu-item>
            <a-menu-item @click="theme.switchTheme('system')">
              <a href="javascript:;">System Theme</a>
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
  </div>
</template>

<style scoped lang="scss">
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  height: $site-header-height;
  padding: 0 1rem;
  .title {
    flex: 1;
    font-size: 2rem;
    font-weight: bold;
  }
  .nav {
    display: flex;
    gap: 3rem;
    font-size: 1.6rem;
  }
  .work {
    display: flex;
    gap: 2rem;
    font-size: 2rem;
    margin-right: 1rem;
    cursor: pointer;
    svg {
      outline: none;
    }
  }
}
</style>
