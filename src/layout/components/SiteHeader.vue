<script setup lang="ts">
import LineMdGithub from '~icons/line-md/github'
import ThemeIcon from '@/components/ThemeIcon.vue'
</script>

<template>
  <div class="head">
    <span class="title">{{ $route.meta.title }}</span>
    <div class="work">
      <line-md-github />
      <theme-icon></theme-icon>
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
