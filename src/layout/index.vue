<script setup lang="ts">
import SideBar from './components/SideBar.vue'
</script>

<template>
  <div class="container">
    <side-bar></side-bar>
    <div class="main-content">
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
  flex-direction: column;
  height: 100vh;

  .main-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 1.5rem;
    @include themify(
      (
        background-color: $layout-bg-color,
      )
    );
  }
}
</style>
