<script setup lang="ts">
import { computed } from 'vue'
import type { Resume } from '@/types/resume'
import {
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  GithubOutlined,
  BookOutlined,
  ExperimentOutlined,
  ProjectOutlined,
  ToolOutlined,
  AppstoreOutlined,
} from '@ant-design/icons-vue'

const props = defineProps<{
  resume: Resume
}>()

// 计算样式
const resumeStyles = computed(() => ({
  '--theme-color': props.resume.globalConfiguration.themeColor || '#1890ff',
  '--base-font-size': `${props.resume.globalConfiguration.baseFontSize || 14}px`,
  '--title-font-size': `${props.resume.globalConfiguration.titleFontSize || 24}px`,
  '--sub-title-font-size': `${props.resume.globalConfiguration.subTitleFontSize || 16}px`,
}))

// 按 order 排序的菜单项
const sortedSections = computed(() => {
  return [...props.resume.menuSections]
    .sort((a, b) => {
      return parseInt(a.order) - parseInt(b.order)
    })
    .filter(s => s.id !== 'basic')
})

// 获取模块图标
const getSectionIcon = (sectionId: string) => {
  const iconMap: Record<string, any> = {
    education: BookOutlined,
    internship: ExperimentOutlined,
    project: ProjectOutlined,
    skills: ToolOutlined,
  }
  return iconMap[sectionId] || AppstoreOutlined
}
</script>

<template>
  <div class="modern-tech-resume" :style="resumeStyles">
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
                <h3 class="school">{{ edu.school }}</h3>
                <span class="date">{{ edu.dateRange }}</span>
              </div>
              <p class="major">{{ edu.major }} | {{ edu.degree }}</p>
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
                <h3 class="company">{{ intern.companyName }}</h3>
                <span class="date">{{ intern.dateRange }}</span>
              </div>
              <p class="position">
                {{ intern.position }} | {{ intern.department }}
              </p>
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
                <h3 class="project-name">{{ project.name }}</h3>
                <span class="date">{{ project.dateRange }}</span>
              </div>
              <p class="role">{{ project.role }}</p>
              <p v-if="project.gitAddress" class="git-link">
                <GithubOutlined /> {{ project.gitAddress }}
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
                <h3 class="item-title">{{ item.title }}</h3>
                <span class="date">{{ item.dateRange }}</span>
              </div>
              <p class="sub-title">{{ item.subTitle }}</p>
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
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  background: #fff;
  font-size: var(--base-font-size);
  color: #333;
  line-height: 1.6;

  .resume-header {
    background: linear-gradient(135deg, var(--theme-color) 0%);
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
        font-size: var(--title-font-size);
        font-weight: 700;
        margin-bottom: 8px;
        letter-spacing: 2px;
      }

      .position {
        font-size: var(--sub-title-font-size);
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
    padding: 30px 40px;

    .section {
      margin-bottom: 28px;

      &:last-child {
        margin-bottom: 0;
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 2px solid var(--theme-color);

        .section-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: var(--theme-color);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .section-title {
          font-size: var(--sub-title-font-size);
          font-weight: 600;
          color: var(--theme-color);
        }

        .section-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(
            to right,
            var(--theme-color),
            transparent
          );
        }
      }

      .section-content {
        padding-left: 48px;

        .education-item,
        .internship-item,
        .project-item,
        .custom-item {
          margin-bottom: 20px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid var(--theme-color);

          &:last-child {
            margin-bottom: 0;
          }

          .item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;

            h3 {
              font-size: 16px;
              font-weight: 600;
              color: #333;
            }

            .date {
              font-size: 14px;
              color: #666;
              font-family: 'Courier New', monospace;
            }
          }

          .major,
          .position,
          .role,
          .sub-title {
            font-size: 14px;
            color: #666;
            margin-bottom: 8px;
          }

          .gpa {
            font-size: 13px;
            color: var(--theme-color);
            font-weight: 500;
          }

          .git-link {
            font-size: 13px;
            color: var(--theme-color);
            margin-bottom: 8px;
          }

          .description {
            font-size: 14px;
            color: #555;
            line-height: 1.8;

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
              background: var(--theme-color);
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
