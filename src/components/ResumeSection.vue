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

const styles = computed(() => ({
  ...resume.globalConfiguration,
  titleFontSize: `${resume.globalConfiguration.titleFontSize}px`,
  subTitleFontSize: `${resume.globalConfiguration.subTitleFontSize}px`,
  paragraphSpacing: `${resume.globalConfiguration.paragraphSpacing}px`,
  baseFontSize: `${resume.globalConfiguration.baseFontSize}px`,
}))
</script>

<template>
  <section class="preview-section">
    <div class="section-title">
      {{ title }}
    </div>
    <div class="cards">
      <div v-for="item in items" :key="item.id" class="timeline-card">
        <template v-if="item.visible">
          <div v-if="item.subMain?.length" class="timeline-main">
            <div class="timeline-title">
              {{ item.subMain?.[0] || '' }}
              <em v-show="item.subMain?.[0] !== '' && item.subMain?.[1] !== ''"
                >-</em
              >
              {{ item.subMain?.[1] || '' }}
            </div>
            <div class="timeline-major">{{ item.subMain?.[2] || '' }}</div>
            <div class="timeline-period">
              {{ item.subMain?.[3] || '' }}
            </div>
          </div>
          <p v-show="item.address !== ''" class="project-link">
            {{ item.address }}
          </p>
          <div class="description" v-html="item.description"></div>
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
  color: v-bind('styles.themeColor');
  font-size: v-bind('styles.titleFontSize');
  border-left: 4px solid v-bind('styles.themeColor');
  background-color: v-bind('styles.themeColor') + '33';
}

.cards {
  display: flex;
  flex-direction: column;
  gap: v-bind('styles.paragraphSpacing');
}

.timeline-card {
  border-radius: 6px;
}

.timeline-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  font-size: v-bind('styles.subTitleFontSize');
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
  color: v-bind('styles.themeColor');
}

.description {
  font-size: v-bind('styles.baseFontSize');
  line-height: v-bind('styles.baseLineHeight');
}
</style>
