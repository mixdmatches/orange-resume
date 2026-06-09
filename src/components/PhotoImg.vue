<script setup lang="ts">
import { computed } from 'vue'
import imageUrl from '@/assets/images/卡通证件照.png'

const props = defineProps<{
  url: string
  width: number
  height: number
  radius: number
}>()

const style = computed(() => {
  return {
    width: props.width + 'px',
    height: props.height + 'px',
    borderRadius: props.radius + 'px',
  }
})
</script>

<template>
  <img
    class="preview-img"
    :style="style"
    :src="url ? url : imageUrl"
    alt="头像预览"
  />
</template>

<style lang="scss" scoped>
.preview-img {
  object-fit: cover;
  border: 1px solid #e8e8e8;
}
</style>
