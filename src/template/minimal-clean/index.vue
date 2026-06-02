<script setup lang="ts">
import { computed, inject } from 'vue'
import type { Resume } from '@/types/resume'
import { useTemplateStyles } from '@/template'
import SectionPreview from './ResumeSection.vue'

const resume = inject('resume') as Resume

const { resumeStyles: styles, getSectionItems } = useTemplateStyles(resume)

const sortedSections = computed(() => {
  const sections = resume.menuSections.filter(i => i.id !== 'basic')
  return sections.sort((a, b) => {
    return parseInt(a.order) - parseInt(b.order)
  })
})
</script>

<template>
  <div class="minimal-clean-resume">
    <!-- 简洁头部 -->
    <header class="resume-header">
      <h1 class="name">{{ resume.basic.name }}</h1>
      <p class="position">{{ resume.basic.position }}</p>
      <div class="contact-bar">
        <span>{{ resume.basic.phone }}</span>
        <span class="divider">|</span>
        <span>{{ resume.basic.email }}</span>
        <span class="divider">|</span>
        <span>{{ resume.basic.address }}</span>
      </div>
    </header>

    <!-- 主体内容 -->
    <main class="resume-body">
      <template v-for="section in sortedSections" :key="section.id">
        <SectionPreview
          :id="section.id"
          :title="section.title"
          :items="getSectionItems(section.id)"
        />
      </template>
    </main>
  </div>
</template>

<style scoped lang="scss">
.minimal-clean-resume {
  background: #fff;
  font-size: v-bind('styles.baseFontSize');
  color: #2c3e50;
  line-height: 1.6;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  .resume-header {
    text-align: center;
    padding: 10px 40px 30px;
    border-bottom: 1px solid #eee;

    .name {
      font-size: v-bind('styles.titleFontSize');
      font-weight: 300;
      letter-spacing: 8px;
      margin-bottom: 10px;
      color: v-bind('styles.themeColor');
    }

    .position {
      font-size: v-bind('styles.subTitleFontSize');
      color: #666;
      margin-bottom: 16px;
      font-weight: 400;
    }

    .contact-bar {
      font-size: 13px;
      color: #888;

      .divider {
        margin: 0 12px;
        color: #ddd;
      }
    }
  }

  .resume-body {
    .section {
      margin-bottom: v-bind('styles.baseModuleSpacing');

      &:last-child {
        margin-bottom: 0;
      }

      .section-title {
        font-size: v-bind('styles.subTitleFontSize');
        font-weight: 600;
        color: v-bind('styles.themeColor');
        margin-bottom: 20px;
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
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 6px;

            span:first-child {
              font-weight: 600;
              font-size: 15px;
              color: #333;
            }

            .date {
              font-size: 13px;
              color: #999;
              font-family: 'Courier New', monospace;
            }
          }

          .detail {
            font-size: 14px;
            color: #666;
            margin-bottom: 8px;
          }

          .description {
            font-size: 14px;
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

        .skills-content {
          :deep(ul) {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            list-style: none;
            padding: 0;

            li {
              border: 1px solid #ddd;
              padding: 4px 12px;
              border-radius: 4px;
              font-size: 13px;
              color: #666;
              transition: all 0.3s;

              &:hover {
                border-color: v-bind('styles.themeColor');
                color: v-bind('styles.themeColor');
              }
            }
          }
        }
      }
    }
  }
}
</style>
