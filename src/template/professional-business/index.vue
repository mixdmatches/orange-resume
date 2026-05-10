<script setup lang="ts">
import { computed } from 'vue'
import type { Resume } from '@/types/resume'
import {
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  LinkOutlined,
} from '@ant-design/icons-vue'

const props = defineProps<{
  resume: Resume
}>()

const resumeStyles = computed(() => ({
  '--theme-color': props.resume.globalConfiguration.themeColor || '#1a5490',
  '--base-font-size': `${props.resume.globalConfiguration.baseFontSize || 14}px`,
  '--title-font-size': `${props.resume.globalConfiguration.titleFontSize || 26}px`,
  '--sub-title-font-size': `${props.resume.globalConfiguration.subTitleFontSize || 16}px`,
}))

const sortedSections = computed(() => {
  return [...props.resume.menuSections]
    .sort((a, b) => {
      return parseInt(a.order) - parseInt(b.order)
    })
    .filter(s => s.id !== 'basic')
})
</script>

<template>
  <div class="professional-business-resume" :style="resumeStyles">
    <!-- 商务头部 -->
    <header class="resume-header">
      <div class="header-top">
        <div class="header-brand">
          <div v-if="resume.basic.photo" class="avatar">
            <img :src="resume.basic.photo" :alt="resume.basic.name" />
          </div>
          <div class="brand-info">
            <h1 class="name">{{ resume.basic.name }}</h1>
            <p class="position">{{ resume.basic.position }}</p>
          </div>
        </div>
        <div class="header-contact">
          <div class="contact-row">
            <PhoneOutlined /> {{ resume.basic.phone }}
          </div>
          <div class="contact-row">
            <MailOutlined /> {{ resume.basic.email }}
          </div>
          <div class="contact-row">
            <EnvironmentOutlined /> {{ resume.basic.address }}
          </div>
        </div>
      </div>
      <div class="header-divider"></div>
    </header>

    <!-- 主体内容 -->
    <main class="resume-body">
      <div v-for="section in sortedSections" :key="section.id" class="section">
        <div class="section-header">
          <div class="section-line"></div>
          <h2 class="section-title">{{ section.title }}</h2>
          <div class="section-line"></div>
        </div>

        <div class="section-content">
          <!-- 教育经历 -->
          <template v-if="section.id === 'education'">
            <table class="data-table">
              <tbody>
                <tr v-for="edu in resume.educations" :key="edu.id">
                  <td class="time-cell">{{ edu.dateRange }}</td>
                  <td class="content-cell">
                    <strong>{{ edu.school }}</strong>
                    <span class="separator">|</span>
                    {{ edu.major }}
                    <span class="separator">|</span>
                    {{ edu.degree }}
                    <div v-if="edu.gpa" class="extra">GPA: {{ edu.gpa }}</div>
                    <div
                      v-if="edu.description"
                      class="description"
                      v-html="edu.description"
                    ></div>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>

          <!-- 实习经历 -->
          <template v-if="section.id === 'internship'">
            <table class="data-table">
              <tbody>
                <tr v-for="intern in resume.internships" :key="intern.id">
                  <td class="time-cell">{{ intern.dateRange }}</td>
                  <td class="content-cell">
                    <strong>{{ intern.companyName }}</strong>
                    <span class="separator">|</span>
                    {{ intern.position }}
                    <div
                      v-if="intern.description"
                      class="description"
                      v-html="intern.description"
                    ></div>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>

          <!-- 项目经历 -->
          <template v-if="section.id === 'project'">
            <table class="data-table">
              <tbody>
                <tr v-for="project in resume.projects" :key="project.id">
                  <td class="time-cell">{{ project.dateRange }}</td>
                  <td class="content-cell">
                    <strong>{{ project.name }}</strong>
                    <span class="separator">|</span>
                    {{ project.role }}
                    <div v-if="project.gitAddress" class="extra">
                      <LinkOutlined /> {{ project.gitAddress }}
                    </div>
                    <div
                      v-if="project.description"
                      class="description"
                      v-html="project.description"
                    ></div>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>

          <!-- 技能特长 -->
          <template v-if="section.id === 'skills'">
            <div class="data-table">
              <div class="skills-content" v-html="resume.skills"></div>
            </div>
          </template>

          <!-- 自定义模块 -->
          <template v-if="section.id.startsWith('custom-')">
            <table class="data-table">
              <tbody>
                <tr
                  v-for="item in resume.customData[section.id]"
                  :key="item.id"
                >
                  <td class="time-cell">{{ item.dateRange }}</td>
                  <td class="content-cell">
                    <strong>{{ item.title }}</strong>
                    <span class="separator">|</span>
                    {{ item.subTitle }}
                    <div
                      v-if="item.description"
                      class="description"
                      v-html="item.description"
                    ></div>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
.professional-business-resume {
  margin: 0 auto;
  background: #fff;
  font-size: var(--base-font-size);
  color: #333;
  line-height: 1.6;
  font-family: 'Times New Roman', Times, serif;

  .resume-header {
    padding: 40px 50px 20px;

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-brand {
        display: flex;
        align-items: center;
        gap: 20px;

        .avatar {
          width: 80px;
          height: 100px;
          border: 2px solid var(--theme-color);
          padding: 3px;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }

        .brand-info {
          .name {
            font-size: var(--title-font-size);
            font-weight: 700;
            color: var(--theme-color);
            letter-spacing: 4px;
            margin-bottom: 6px;
          }

          .position {
            font-size: var(--sub-title-font-size);
            color: #666;
          }
        }
      }

      .header-contact {
        text-align: right;

        .contact-row {
          font-size: 13px;
          color: #555;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }

    .header-divider {
      margin-top: 20px;
      height: 3px;
      background: linear-gradient(to right, var(--theme-color), transparent);
    }
  }

  .resume-body {
    padding: 20px 50px 40px;

    .section {
      margin-bottom: 28px;

      &:last-child {
        margin-bottom: 0;
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;

        .section-line {
          flex: 1;
          height: 1px;
          background: #ddd;
        }

        .section-title {
          font-size: var(--sub-title-font-size);
          font-weight: 700;
          color: var(--theme-color);
          letter-spacing: 4px;
          white-space: nowrap;
        }
      }

      .section-content {
        .data-table {
          width: 100%;
          border-collapse: collapse;

          tbody {
            tr {
              border-bottom: 1px solid #eee;

              &:last-child {
                border-bottom: none;
              }

              td {
                padding: 12px 0;
                vertical-align: top;

                &.time-cell {
                  width: 160px;
                  font-size: 13px;
                  color: #666;
                  font-family: 'Courier New', monospace;
                  white-space: nowrap;
                }

                &.content-cell {
                  font-size: 14px;
                  color: #333;

                  strong {
                    font-weight: 600;
                    color: #222;
                  }

                  .separator {
                    margin: 0 8px;
                    color: #ccc;
                  }

                  .extra {
                    font-size: 13px;
                    color: #666;
                    margin-top: 4px;
                  }

                  .description {
                    margin-top: 8px;
                    font-size: 13px;
                    color: #555;
                    line-height: 1.8;

                    :deep(p) {
                      margin-bottom: 6px;
                    }

                    :deep(ul) {
                      padding-left: 20px;
                      margin: 6px 0;

                      li {
                        margin-bottom: 3px;
                      }
                    }
                  }
                }
              }
            }
          }
        }

        .skills-content {
          :deep(ul) {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            list-style: none;
            padding: 0;

            li {
              border: 1px solid #ddd;
              padding: 8px 12px;
              text-align: center;
              font-size: 13px;
              color: #555;
              transition: all 0.3s;

              &:hover {
                background: var(--theme-color);
                color: #fff;
                border-color: var(--theme-color);
              }
            }
          }
        }
      }
    }
  }
}
</style>
