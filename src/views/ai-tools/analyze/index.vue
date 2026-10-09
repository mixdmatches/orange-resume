<script setup lang="ts">
// AI 简历分析 · 占位页面
</script>

<template>
  <div class="page page-ai-tools">
    <div class="placeholder">
      <div class="placeholder-icon">📊</div>
      <h2 class="placeholder-title">AI 简历分析</h2>
      <p class="placeholder-desc">全面诊断简历质量，提供评分与针对性改进建议</p>
      <a-tag color="orange">功能开发中</a-tag>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-ai-tools {
  max-width: var(--content-max-width);
  display: flex;
  justify-content: center;
  padding-top: var(--space-16);
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  text-align: center;

  .placeholder-icon {
    font-size: 48px;
    line-height: 1;
  }

  .placeholder-title {
    font-size: var(--text-2xl);
    font-weight: var(--font-semibold);
    color: var(--color-text);
    margin: 0;
  }

  .placeholder-desc {
    font-size: var(--text-sm);
    color: var(--color-text-tertiary);
    margin: 0;
  }
}
</style>
