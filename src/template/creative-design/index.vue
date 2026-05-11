<script setup lang="ts">
import { computed, inject } from 'vue'
import type { Resume } from '@/types/resume'
import { useTemplateStyles } from '@/template'

const resume: Resume = inject('resume') as Resume

const { resumeStyles: styles } = useTemplateStyles(resume)

const sortedSections = computed(() => {
  return [...resume.menuSections]
    .filter(s => s.id !== 'skills' && s.id !== 'basic') // 技能在侧边栏显示
    .sort((a, b) => parseInt(a.order) - parseInt(b.order))
})

const hasSkills = computed(() => {
  return resume.skills && resume.skills.length > 0
})
</script>

<template>
  <div class="creative-design-resume">
    <!-- 创意头部 -->
    <header class="resume-header">
      <div class="header-bg">
        <div class="geometric-shapes">
          <div class="shape circle"></div>
          <div class="shape triangle"></div>
          <div class="shape square"></div>
        </div>
      </div>
      <div class="header-content">
        <div v-if="resume.basic.photo" class="avatar">
          <img :src="resume.basic.photo" :alt="resume.basic.name" />
        </div>
        <div class="header-text">
          <h1 class="name">{{ resume.basic.name }}</h1>
          <p class="position">{{ resume.basic.position }}</p>
          <div class="contact-chips">
            <span class="chip">{{ resume.basic.phone }}</span>
            <span class="chip">{{ resume.basic.email }}</span>
            <span class="chip">{{ resume.basic.address }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- 主体内容 -->
    <main class="resume-body">
      <div class="body-layout">
        <!-- 左侧栏 -->
        <aside class="sidebar">
          <div class="sidebar-section">
            <h3>联系方式</h3>
            <div class="contact-list">
              <div class="contact-item">
                <span class="label">电话</span>
                <span class="value">{{ resume.basic.phone }}</span>
              </div>
              <div class="contact-item">
                <span class="label">邮箱</span>
                <span class="value">{{ resume.basic.email }}</span>
              </div>
              <div class="contact-item">
                <span class="label">地址</span>
                <span class="value">{{ resume.basic.address }}</span>
              </div>
            </div>
          </div>

          <div v-if="hasSkills" class="sidebar-section">
            <h3>技能特长</h3>
            <div class="skills-list" v-html="resume.skills"></div>
          </div>
        </aside>

        <!-- 右侧主内容 -->
        <div class="main-content">
          <div
            v-for="(section, index) in sortedSections"
            :key="section.id"
            class="section"
          >
            <div class="section-header">
              <span class="section-number">{{ index + 1 }}</span>
              <p class="section-title">{{ section.title }}</p>
            </div>

            <div class="section-content">
              <!-- 教育经历 -->
              <template v-if="section.id === 'education'">
                <div
                  v-for="edu in resume.educations"
                  :key="edu.id"
                  class="card-item"
                >
                  <div class="card-header">
                    <h3>{{ edu.school }}</h3>
                    <span class="badge">{{ edu.dateRange }}</span>
                  </div>
                  <p class="subtitle">{{ edu.major }} | {{ edu.degree }}</p>
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
                  class="card-item"
                >
                  <div class="card-header">
                    <h3>{{ intern.companyName }}</h3>
                    <span class="badge">{{ intern.dateRange }}</span>
                  </div>
                  <p class="subtitle">
                    {{ intern.position }} · {{ intern.department }}
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
                  class="card-item"
                >
                  <div class="card-header">
                    <h3>{{ project.name }}</h3>
                    <span class="badge">{{ project.dateRange }}</span>
                  </div>
                  <p class="subtitle">{{ project.role }}</p>
                  <p class="link">{{ project.gitAddress }}</p>
                  <div
                    v-if="project.description"
                    class="description"
                    v-html="project.description"
                  ></div>
                </div>
              </template>

              <!-- 自定义模块 -->
              <template v-if="section.id.startsWith('custom-')">
                <div
                  v-for="item in resume.customData[section.id]"
                  :key="item.id"
                  class="card-item"
                >
                  <div class="card-header">
                    <h3>{{ item.title }}</h3>
                    <span class="badge">{{ item.dateRange }}</span>
                  </div>
                  <p class="subtitle">{{ item.subTitle }}</p>
                  <div
                    v-if="item.description"
                    class="description"
                    v-html="item.description"
                  ></div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
.creative-design-resume {
  margin: 0 auto;
  background: #fff;
  font-size: v-bind('styles.baseFontSize');
  color: #333;
  line-height: 1.6;

  .resume-header {
    position: relative;
    padding-bottom: 40px;

    .header-bg {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 200px;
      background: linear-gradient(
        135deg,
        v-bind('styles.themeColor') 0%,
        #ffd93d 100%
      );
      overflow: hidden;

      .geometric-shapes {
        position: absolute;
        width: 100%;
        height: 100%;

        .shape {
          position: absolute;
          opacity: 0.2;

          &.circle {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: #fff;
            top: 20px;
            right: 50px;
          }

          &.triangle {
            width: 0;
            height: 0;
            border-left: 50px solid transparent;
            border-right: 50px solid transparent;
            border-bottom: 80px solid #fff;
            bottom: 20px;
            left: 100px;
          }

          &.square {
            width: 60px;
            height: 60px;
            background: #fff;
            transform: rotate(45deg);
            top: 50px;
            left: 50%;
          }
        }
      }
    }

    .header-content {
      position: relative;
      z-index: 1;
      padding: 40px;
      display: flex;
      align-items: flex-end;
      gap: 30px;

      .avatar {
        width: 140px;
        height: 140px;
        border-radius: 20px;
        overflow: hidden;
        border: 4px solid #fff;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .header-text {
        flex: 1;
        padding-bottom: 10px;

        .name {
          font-size: 18px;
          font-weight: 800;
          color: #fff;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
          margin-bottom: 8px;
        }

        .position {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 16px;
        }

        .contact-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;

          .chip {
            background: rgba(255, 255, 255, 0.9);
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 13px;
            color: #333;
            backdrop-filter: blur(10px);
          }
        }
      }
    }
  }

  .resume-body {
    .body-layout {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 20px;
    }

    .sidebar {
      .sidebar-section {
        margin-bottom: 30px;

        h3 {
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: v-bind('styles.themeColor');
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 2px solid v-bind('styles.themeColor');
        }

        .contact-list {
          .contact-item {
            margin-bottom: 12px;

            .label {
              display: block;
              font-size: 12px;
              color: #999;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 4px;
            }

            .value {
              font-size: 14px;
              color: #333;
            }
          }
        }

        .skills-list {
          font-size: v-bind('styles.baseFontSize');
          color: #555;
          line-height: v-bind('styles.baseLineHeight');
          :deep(ul) {
            list-style: none;
            padding: 0;

            li {
              position: relative;
              padding-left: 16px;
              margin-bottom: 8px;
              font-size: 14px;

              &::before {
                content: '▸';
                position: absolute;
                left: 0;
                color: v-bind('styles.themeColor');
              }
            }
          }
        }
      }
    }

    .main-content {
      .section {
        margin-bottom: v-bind('styles.baseModuleSpacing');

        &:last-child {
          margin-bottom: 0;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;

          .section-number {
            font-size: 24px;
            font-weight: 800;
            color: v-bind('styles.themeColor');
            opacity: 0.3;
          }

          .section-title {
            font-size: v-bind('styles.titleFontSize');
            font-weight: 700;
            color: #333;
          }
        }

        .section-content {
          .card-item {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: v-bind('styles.paragraphSpacing');
            position: relative;
            overflow: hidden;

            &::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              width: 4px;
              height: 100%;
              background: v-bind('styles.themeColor');
            }

            &:last-child {
              margin-bottom: 0;
            }

            .card-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;

              h3 {
                font-size: v-bind('styles.subTitleFontSize');
                font-weight: 600;
                color: #333;
              }

              .badge {
                background: v-bind('styles.themeColor');
                color: #fff;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 13px;
              }
            }

            .subtitle {
              font-size: 14px;
              color: #666;
              font-weight: 500;
              margin-bottom: 12px;
            }
            .link {
              color: v-bind('styles.themeColor');
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
        }
      }
    }
  }
}
</style>
