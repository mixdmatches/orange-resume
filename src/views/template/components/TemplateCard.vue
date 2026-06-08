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
  <a-card>
    <template #title>
      {{ props.template.name }}
    </template>

    <div class="banner-subtitle">{{ props.template.description }}</div>

    <div class="template-action">
      <a-button
        style="width: 100%"
        type="primary"
        @click="emit('use', props.template.id)"
      >
        使用模板
      </a-button>

      <a-button
        style="width: 100%"
        type="default"
        @click="emit('preview', props.template.id)"
      >
        预览模板
      </a-button>
    </div>
  </a-card>
</template>

<style scoped lang="scss">
.banner-subtitle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  margin-bottom: 10px;
  height: 50px;
  font-size: 1.2rem;
  @include themify(
    (
      color: $text-color,
    )
  );
}

.template-action {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
</style>
