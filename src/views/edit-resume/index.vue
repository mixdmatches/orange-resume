<script setup lang="ts">
import ToolHead from './components/ToolHead.vue'
import EditContent from '@/views/edit-resume/components/EditContent.vue'
</script>

<template>
  <div class="edit-container">
    <tool-head></tool-head>
    <div class="edit-resume">
      <edit-content></edit-content>
      <span class="line"></span>
      <div class="view-content"></div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.edit-container {
  @include themify(
    (
      background-color: $layout-bg-color,
    )
  );
}
.edit-resume {
  margin-top: 1rem;
  width: 100%;
  height: calc(100vh - $site-header-height - 1rem);
  display: flex;

  .line {
    width: 2px;
    height: 100%;
    margin: 0 0.2rem;
    @include themify(
      (
        background-color: $border-color-mode,
      )
    );
  }
  .view-content {
    width: 50%;
    height: 100%;
    border-radius: 0.5rem;
    padding: 1rem;
    @include themify(
      (
        color: $text-color,
        background-color: $bg-color,
      )
    );
  }
}
</style>
