<script setup lang="ts">
import { computed, inject } from 'vue'
import type { Resume } from '@/types/resume'
import {
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  BookOutlined,
  ExperimentOutlined,
  ProjectOutlined,
  ToolOutlined,
  AppstoreOutlined,
} from '@ant-design/icons-vue'
import { useTemplateStyles } from '@/template'

const resume: Resume = inject('resume') as Resume

const { resumeStyles: styles } = useTemplateStyles(resume)

// 按 order 排序的菜单项
const sortedSections = computed(() => {
  return [...resume.menuSections]
    .sort((a, b) => {
      return parseInt(a.order) - parseInt(b.order)
    })
    .filter(s => s.id !== 'basic')
})

// 获取模块图标
const getSectionIcon = (sectionId: string) => {
  const iconMap: Record<string, typeof BookOutlined> = {
    education: BookOutlined,
    internship: ExperimentOutlined,
    project: ProjectOutlined,
    skills: ToolOutlined,
  }
  return iconMap[sectionId] || AppstoreOutlined
}
</script>

<template>
  <div class="modern-tech-resume">
    <!-- 头部区域 -->
    <header class="resume-header">
      <div class="header-content">
        <div v-if="resume.basic.photo" class="avatar">
          <img :src="resume.basic.photo" :alt="resume.basic.name" />
        </div>
        <div class="header-info">
          <h1 class="name">{{ resume.basic.name }}</h1>
          <p class="position">{{ resume.basic.position }}</p>
          <div class="contact-info">
            <span class="contact-item">
              <PhoneOutlined /> {{ resume.basic.phone }}
            </span>
            <span class="contact-item">
              <MailOutlined /> {{ resume.basic.email }}
            </span>
            <span class="contact-item">
              <EnvironmentOutlined /> {{ resume.basic.address }}
            </span>
          </div>
        </div>
      </div>
      <div class="header-decoration">
        <div class="tech-line"></div>
        <div class="tech-dots">
          <span v-for="i in 5" :key="i" class="dot"></span>
        </div>
      </div>
    </header>

    <!-- 主体内容 -->
    <main class="resume-body">
      <div v-for="section in sortedSections" :key="section.id" class="section">
        <div class="section-header">
          <div class="section-icon">
            <component :is="getSectionIcon(section.id)" />
          </div>
          <h2 class="section-title">{{ section.title }}</h2>
          <div class="section-line"></div>
        </div>

        <div class="section-content">
          <!-- 教育经历 -->
          <template v-if="section.id === 'education'">
            <div
              v-for="edu in resume.educations"
              :key="edu.id"
              class="education-item"
            >
              <div class="item-header">
                <p class="school">{{ edu.school }}</p>
                <p class="major">{{ edu.major }} | {{ edu.degree }}</p>
                <span class="date">{{ edu.dateRange }}</span>
              </div>

              <p v-if="edu.gpa" class="gpa">GPA: {{ edu.gpa }}</p>
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
              class="internship-item"
            >
              <div class="item-header">
                <p class="company">{{ intern.companyName }}</p>
                <p class="position">
                  {{ intern.position }} | {{ intern.department }}
                </p>
                <span class="date">{{ intern.dateRange }}</span>
              </div>
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
              class="project-item"
            >
              <div class="item-header">
                <p class="project-name">{{ project.name }}</p>
                <p class="role">{{ project.role }}</p>
                <span class="date">{{ project.dateRange }}</span>
              </div>
              <p v-if="project.gitAddress" class="git-link">
                {{ project.gitAddress }}
              </p>
              <div
                v-if="project.description"
                class="description"
                v-html="project.description"
              ></div>
            </div>
          </template>

          <!-- 技能特长 -->
          <template v-if="section.id === 'skills'">
            <div class="project-item">
              <div class="skills-content" v-html="resume.skills"></div>
            </div>
          </template>

          <!-- 自定义模块 -->
          <template v-if="section.id.startsWith('custom-')">
            <div
              v-for="item in resume.customData[section.id]"
              :key="item.id"
              class="custom-item"
            >
              <div class="item-header">
                <p class="item-title">{{ item.title }}</p>
                <p class="sub-title">{{ item.subTitle }}</p>
                <span class="date">{{ item.dateRange }}</span>
              </div>

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
.modern-tech-resume {
  background: #fff;
  font-size: v-bind('styles.baseFontSize');
  color: #333;
  line-height: 1.6;

  .resume-header {
    background: linear-gradient(135deg, v-bind('styles.themeColor') 0%);
    color: #fff;
    padding: 40px;
    position: relative;
    overflow: hidden;

    .header-content {
      display: flex;
      align-items: center;
      gap: 30px;
      position: relative;
      z-index: 1;
    }

    .avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      overflow: hidden;
      border: 4px solid rgba(255, 255, 255, 0.3);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .header-info {
      flex: 1;

      .name {
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 8px;
      }

      .position {
        font-size: 14px;
        opacity: 0.9;
        margin-bottom: 16px;
      }

      .contact-info {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;

        .contact-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          opacity: 0.85;
        }
      }
    }

    .header-decoration {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60px;

      .tech-line {
        position: absolute;
        bottom: 20px;
        left: 40px;
        right: 40px;
        height: 2px;
        background: rgba(255, 255, 255, 0.2);
      }

      .tech-dots {
        position: absolute;
        bottom: 16px;
        right: 40px;
        display: flex;
        gap: 8px;

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.6);
          animation: pulse 2s infinite;

          @for $i from 1 through 5 {
            &:nth-child(#{$i}) {
              animation-delay: #{$i * 0.2}s;
            }
          }
        }
      }
    }
  }

  .resume-body {
    padding-top: 20px;
    .section {
      margin-bottom: v-bind('styles.baseModuleSpacing');

      &:last-child {
        margin-bottom: 0;
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 2px solid v-bind('styles.themeColor');

        .section-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: v-bind('styles.themeColor');
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .section-title {
          font-size: v-bind('styles.titleFontSize');
          font-weight: 600;
          color: v-bind('styles.themeColor');
        }

        .section-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(
            to right,
            v-bind('styles.themeColor'),
            transparent
          );
        }
      }

      .section-content {
        padding-left: 48px;
        display: flex;
        flex-direction: column;
        gap: v-bind('styles.paragraphSpacing');

        .education-item,
        .internship-item,
        .project-item,
        .custom-item {
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid v-bind('styles.themeColor');

          &:last-child {
            margin-bottom: 0;
          }

          .item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;

            p {
              font-size: v-bind('styles.subTitleFontSize');
              font-weight: 600;
              color: #333;
            }

            .date {
              font-size: v-bind('styles.subTitleFontSize');
              color: #666;
              font-family: 'Courier New', monospace;
            }
          }

          .major,
          .position,
          .role,
          .sub-title {
            font-size: v-bind('styles.subTitleFontSize');
            color: #666;
            margin-bottom: 8px;
          }

          .gpa {
            font-size: v-bind('styles.subTitleFontSize');
            color: v-bind('styles.themeColor');
            font-weight: 500;
          }

          .git-link {
            font-size: 13px;
            color: v-bind('styles.themeColor');
            margin-bottom: 8px;
          }

          .description {
            font-size: v-bind('styles.baseFontSize');
            color: #555;
            line-height: v-bind('styles.baseLineHeight');

            :deep(p) {
              margin-bottom: 8px;
            }
          }
        }

        .skills-content {
          :deep(ul) {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            list-style: none;
            padding: 0;

            li {
              background: v-bind('styles.themeColor');
              color: #fff;
              padding: 6px 16px;
              border-radius: 20px;
              font-size: 14px;
            }
          }
        }
      }
    }
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}
</style>
