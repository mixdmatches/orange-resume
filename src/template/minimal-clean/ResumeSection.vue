<script setup lang="ts">
import { useTemplateStyles } from '@/template'
import type { Resume } from '@/types/resume'
import { inject } from 'vue'

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

const { resumeStyles: styles } = useTemplateStyles(resume)
</script>

<template>
  <div class="section">
    <h2 class="section-title">{{ title }}</h2>

    <div class="section-content">
      <div v-for="item in items" :key="item.id" class="timeline-item">
        <template v-if="item.visible">
          <div v-if="item.subMain?.length" class="timeline-header">
            <span class="timeline-header__item">{{
              item.subMain?.[0] || ''
            }}</span>
            <span class="timeline-header__item">
              {{ item.subMain?.[2] || '' }}
              <em v-show="item.subMain?.[1] !== '' && item.subMain?.[2] !== ''"
                >|</em
              >
              {{ item.subMain?.[1] || '' }}
            </span>
            <span class="timeline-header__item">{{
              item.subMain?.[3] || ''
            }}</span>
          </div>
          <span class="timeline-link">{{ item.address }}</span>
          <div
            v-if="item.description"
            class="description"
            v-html="item.description"
          ></div>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.section {
  margin-bottom: v-bind('styles.baseModuleSpacing');

  &:last-child {
    margin-bottom: 0;
  }

  .section-title {
    font-size: v-bind('styles.titleFontSize');
    font-weight: 600;
    color: v-bind('styles.themeColor');
    padding-bottom: 8px;
    border-bottom: 1px solid #eee;
    letter-spacing: 2px;
  }

  .section-content {
    .timeline-item {
      margin-bottom: v-bind('styles.paragraphSpacing');
      padding-left: 20px;
      border-left: 2px solid #eee;
      position: relative;

      &::before {
        content: '';
        position: absolute;
        left: -5px;
        top: 6px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: v-bind('styles.themeColor');
      }

      &:last-child {
        margin-bottom: 0;
      }

      .timeline-header {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        margin-bottom: 4px;

        span:first-child {
          font-weight: 600;
          color: #333;
        }
        span:last-child {
          color: #999;
          font-family: 'Courier New', monospace;
          text-align: right;
        }

        .timeline-header__item {
          font-size: v-bind('styles.subTitleFontSize');
        }
      }
      .timeline-link {
        color: v-bind('styles.themeColor');
      }

      .description {
        font-size: v-bind('styles.baseFontSize');
        color: #555;
        line-height: v-bind('styles.baseLineHeight');

        :deep(p) {
          margin-bottom: 6px;
        }

        :deep(ul) {
          padding-left: 20px;
          margin: 8px 0;

          li {
            margin-bottom: 4px;
          }
        }
      }
    }
  }
}
</style>
