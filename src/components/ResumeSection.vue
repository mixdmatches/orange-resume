<script setup lang="ts">
import type { Resume } from '@/types/resume'
import { computed, inject } from 'vue'

interface SectionProps {
  id: string
  title: string
  items: Array<{
    id: string
    visible: boolean
    subMain?: Array<string>
    address?: string
    description: string
  }>
}

defineProps<SectionProps>()

const resume: Resume = inject('resume') as Resume

const styles = computed(() => resume.globalConfiguration)

const descStyle = computed(() => ({
  fontSize: `${styles.value.baseFontSize}px`,
  lineHeight: styles.value.baseLineHeight,
}))

const titleStyle = computed(() => ({
  color: styles.value.themeColor,
  fontSize: `${styles.value.titleFontSize}px`,
  borderLeft: `4px solid ${styles.value.themeColor}`,
  backgroundColor: `${styles.value.themeColor}33`, // 20% 透明度
}))

const subTitleStyle = computed(() => ({
  fontSize: `${styles.value.subTitleFontSize}px`,
}))
</script>

<template>
  <section class="preview-section">
    <div class="section-title" :style="titleStyle">
      {{ title }}
    </div>
    <div class="cards" :style="{ gap: `${styles.paragraphSpacing}px` }">
      <div v-for="item in items" :key="item.id" class="timeline-card">
        <template v-if="item.visible">
          <div class="timeline-main" :style="subTitleStyle">
            <div class="timeline-title">
              {{ item.subMain?.[0] || '' }}
              <em v-show="item.subMain?.[0] !== '' && item.address !== ''"
                >-</em
              >
              {{ item.subMain?.[1] || '' }}
            </div>
            <div class="timeline-major">{{ item.subMain?.[2] || '' }}</div>
            <div class="timeline-period">
              {{ item.subMain?.[3] || '' }}
            </div>
          </div>
          <div :style="descStyle" v-html="item.description"></div>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.preview-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
  transition: background 0.3s ease-in-out;

  &:hover {
    background: #f5f7fa;
  }
}

.section-title {
  font-weight: 600;
  color: #111827;
  margin: 0;
  padding-left: 8px;
}

.cards {
  display: flex;
  flex-direction: column;
}

.timeline-card {
  border-radius: 6px;
}

.timeline-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.timeline-title {
  font-weight: 600;
  color: #1f2937;
}

.timeline-period,
.timeline-major,
.timeline-time {
  font-weight: 500;
}

.project-link {
  display: inline-block;
  font-size: 13px;
}
</style>
