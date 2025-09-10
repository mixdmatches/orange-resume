<script setup lang="ts">
import LineMdMoonAltLoop from '~icons/line-md/moon-alt-loop'
import LineMdMoonAltToSunnyOutlineLoopTransition from '~icons/line-md/moon-alt-to-sunny-outline-loop-transition'
import { useThemeStore } from '@/stores/theme.ts'
// ---------------------------------主题切换
const theme = useThemeStore()
</script>

<template>
  <a-dropdown>
    <line-md-moon-alt-to-sunny-outline-loop-transition
      v-if="theme.currentTheme === 'dark'"
    />
    <line-md-moon-alt-loop v-else />
    <template #overlay>
      <a-menu>
        <a-menu-item @click="theme.switchTheme('light')">
          Light Theme
        </a-menu-item>
        <a-menu-item @click="theme.switchTheme('dark')">
          Dark Theme
        </a-menu-item>
        <a-menu-item @click="theme.switchTheme('system')">
          System Theme
        </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<style scoped lang="scss">
svg {
  outline: none;
}
</style>
