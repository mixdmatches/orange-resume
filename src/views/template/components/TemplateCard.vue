<script setup lang="ts">
import type { TemplateInfo } from '@/template/index'

const props = defineProps({
  template: {
    type: Object as () => TemplateInfo,
    required: true,
  },
})

const emit = defineEmits(['preview', 'use'])
</script>

<template>
  <a-card class="template-card">
    <template #title>
      <div class="banner-title">{{ props.template.name }}</div>
    </template>
    <div class="card-banner">
      <div class="banner-subtitle">{{ props.template.description }}</div>
    </div>

    <div class="template-action">
      <div class="actions-row">
        <a-button type="primary" @click="emit('use', props.template.id)">
          使用模板
        </a-button>
        <a-button type="default" @click="emit('preview', props.template.id)">
          预览模板
        </a-button>
      </div>
    </div>
  </a-card>
</template>

<style scoped lang="scss">
.template-card {
  min-width: 260px;
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 1rem;
  overflow: hidden;
}

.card-banner {
  min-height: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.banner-title {
  font-size: 1.5rem;
  font-weight: 700;
}

.banner-subtitle {
  font-size: 1.2rem;
  margin-top: 4px;
  @include themify(
    (
      color: $text-color,
    )
  );
}

.template-action {
  margin: 12px 1.2rem 1.2rem;
  display: flex;
  align-items: center;
}

.actions-row {
  width: 100%;
  display: flex;
  gap: 10px;
  justify-content: space-between;
}

.actions-row .ant-btn {
  flex: 1 1 50%;
  height: 38px;
  border-radius: 8px;
}

.btn-use {
  background: linear-gradient(90deg, #2f80ed 0%, #1e63d6 100%);
  border: none;
  color: #fff;
}

.btn-preview {
  flex: 0 0 36%;
}
</style>
