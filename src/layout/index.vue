<script setup lang="ts">
import SideBar from './components/SideBar.vue'
import SiteHeader from './components/SiteHeader.vue'
</script>

<template>
  <div class="container">
    <side-bar></side-bar>
    <div class="main-content">
      <site-header></site-header>
      <router-view v-slot="{ Component }">
        <transition name="slide">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<style scoped lang="scss">
.container {
  display: flex;
  height: 100vh;

  .main-content {
    overflow-x: hidden;
    flex: 1;
    border-left: 1px solid $border-color;
    padding: 2rem;
  }
}
</style>
