<script setup lang="ts"></script>

<template>
  <div class="head">
    <div class="title">{{ $route.meta.title }}</div>
    <div class="work"></div>
  </div>
</template>

<style scoped lang="scss">
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: $site-header-height;
  padding: 1rem;

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
}
</style>
