<script setup lang="ts">
import { useThemeStore } from '@/stores/theme.ts'
const theme = useThemeStore()
</script>

<template>
  <a-config-provider :theme="theme.themeConfig">
    <router-view />
  </a-config-provider>
</template>
