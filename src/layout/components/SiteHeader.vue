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
      <line-md-moon-alt-to-sunny-outline-loop-transition
        v-if="theme.isLight"
        @click="theme.switchTheme('dark')"
      />
      <line-md-moon-alt-loop v-else @click="theme.switchTheme('light')" />
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
  }
}
</style>
