<script setup lang="ts">
import { computed } from 'vue'
import type { Resume } from '@/types/resume'

const props = defineProps<{
  resume: Resume
}>()

const resumeStyles = computed(() => ({
  '--theme-color': props.resume.globalConfiguration.themeColor || '#2c3e50',
  '--base-font-size': `${props.resume.globalConfiguration.baseFontSize || 14}px`,
  '--title-font-size': `${props.resume.globalConfiguration.titleFontSize || 28}px`,
  '--sub-title-font-size': `${props.resume.globalConfiguration.subTitleFontSize || 16}px`,
}))

const sortedSections = computed(() => {
  const sections = props.resume.menuSections.filter(i => i.id !== 'basic')
  return sections.sort((a, b) => {
    return parseInt(a.order) - parseInt(b.order)
  })
})
</script>

<template>
  <div class="minimal-clean-resume" :style="resumeStyles">
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
      <div v-for="section in sortedSections" :key="section.id" class="section">
        <h2 class="section-title">{{ section.title }}</h2>

        <div class="section-content">
          <!-- 教育经历 -->
          <template v-if="section.id === 'education'">
            <div
              v-for="edu in resume.educations"
              :key="edu.id"
              class="timeline-item"
            >
              <div class="timeline-header">
                <span class="school">{{ edu.school }}</span>
                <span class="date">{{ edu.dateRange }}</span>
              </div>
              <p class="detail">{{ edu.major }} · {{ edu.degree }}</p>
              <div
                v-if="edu.description"
                class="description"
                v-html="edu.description"
              ></div>
            </div>
          </template>

          <!-- 实习经历 -->
          <template v-if="section.id === 'internship'">
            <div
              v-for="intern in resume.internships"
              :key="intern.id"
              class="timeline-item"
            >
              <div class="timeline-header">
                <span class="company">{{ intern.companyName }}</span>
                <span class="date">{{ intern.dateRange }}</span>
              </div>
              <p class="detail">{{ intern.position }}</p>
              <div
                v-if="intern.description"
                class="description"
                v-html="intern.description"
              ></div>
            </div>
          </template>

          <!-- 项目经历 -->
          <template v-if="section.id === 'project'">
            <div
              v-for="project in resume.projects"
              :key="project.id"
              class="timeline-item"
            >
              <div class="timeline-header">
                <span class="project-name">{{ project.name }}</span>
                <span class="date">{{ project.dateRange }}</span>
              </div>
              <p class="detail">{{ project.role }}</p>
              <div
                v-if="project.description"
                class="description"
                v-html="project.description"
              ></div>
            </div>
          </template>

          <!-- 技能特长 -->
          <template v-if="section.id === 'skills'">
            <div class="timeline-item">
              <div class="description" v-html="resume.skills"></div>
            </div>
          </template>

          <!-- 自定义模块 -->
          <template v-if="section.id.startsWith('custom-')">
            <div
              v-for="item in resume.customData[section.id]"
              :key="item.id"
              class="timeline-item"
            >
              <div class="timeline-header">
                <span class="title">{{ item.title }}</span>
                <span class="date">{{ item.dateRange }}</span>
              </div>
              <p class="detail">{{ item.subTitle }}</p>
              <div
                v-if="item.description"
                class="description"
                v-html="item.description"
              ></div>
            </div>
          </template>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
.minimal-clean-resume {
  margin: 0 auto;
  background: #fff;
  font-size: var(--base-font-size);
  color: #2c3e50;
  line-height: 1.6;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  .resume-header {
    text-align: center;
    padding: 50px 40px 30px;
    border-bottom: 1px solid #eee;

    .name {
      font-size: var(--title-font-size);
      font-weight: 300;
      letter-spacing: 8px;
      margin-bottom: 10px;
      color: var(--theme-color);
    }

    .position {
      font-size: var(--sub-title-font-size);
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
    padding: 30px 50px;

    .section {
      margin-bottom: 32px;

      &:last-child {
        margin-bottom: 0;
      }

      .section-title {
        font-size: var(--sub-title-font-size);
        font-weight: 600;
        color: var(--theme-color);
        margin-bottom: 20px;
        padding-bottom: 8px;
        border-bottom: 1px solid #eee;
        letter-spacing: 2px;
      }

      .section-content {
        .timeline-item {
          margin-bottom: 24px;
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
            background: var(--theme-color);
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
            line-height: 1.8;

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
                border-color: var(--theme-color);
                color: var(--theme-color);
              }
            }
          }
        }
      }
    }
  }
}
</style>
