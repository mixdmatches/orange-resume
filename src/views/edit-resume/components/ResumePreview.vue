<script setup lang="ts">
import type { Resume } from '@/types/resume'
import { inject } from 'vue'
const resume: Resume = inject('resume') as Resume

const isExist = (id: string) => {
  return resume.menuSections.some(item => item.id === id)
}
</script>

<template>
  <div class="preview-wrapper">
    <div class="preview-card">
      <!-- 基本信息 -->
      <section class="preview-header">
        <div class="profile">
          <h1>{{ resume.basic.name }}</h1>
          <p>{{ resume.basic.position }}</p>
        </div>
        <div class="contact">
          <span>电话：{{ resume.basic.phone }}</span>
          <span>邮箱：{{ resume.basic.email }}</span>
          <span>地址：{{ resume.basic.address }}</span>
        </div>
      </section>

      <!-- 教育经历 -->
      <section v-if="isExist('education')" class="preview-section">
        <h2 class="section-title">教育经历</h2>
        <div
          v-for="item in resume.educations"
          :key="item.school"
          class="timeline-card"
        >
          <template v-if="item.visible">
            <div class="timeline-main">
              <div class="timeline-title">
                {{ item.school }}
                <em v-show="item.school !== '' && item.degree !== ''">-</em>
                {{ item.degree }}
              </div>
              <div class="timeline-major">{{ item.major }}</div>
              <div class="timeline-period">
                {{ item.dateRange }}
              </div>
            </div>
            <div class="timeline-desc" v-html="item.description"></div>
          </template>
        </div>
      </section>

      <!-- 实习经历 -->
      <section v-if="isExist('internship')" class="preview-section">
        <h2 class="section-title">实习经历</h2>
        <div
          v-for="item in resume.internships"
          :key="item.id"
          class="timeline-card"
        >
          <template v-if="item.visible">
            <div class="timeline-main">
              <div class="timeline-title">
                {{ item.companyName }}
                <em v-show="item.companyName !== '' && item.department !== ''"
                  >-</em
                >
                {{ item.department }}
              </div>
              <div class="timeline-period">{{ item.position }}</div>
              <div class="timeline-time">
                {{ item.dateRange }}
              </div>
            </div>
            <div class="timeline-desc" v-html="item.description"></div>
          </template>
        </div>
      </section>

      <!-- 项目经历 -->
      <section v-if="isExist('project')" class="preview-section">
        <h2 class="section-title">项目经历</h2>
        <div
          v-for="item in resume.projects"
          :key="item.name"
          class="timeline-card"
        >
          <template v-if="item.visible">
            <div class="timeline-main">
              <div class="timeline-title">{{ item.name }}</div>
              <span class="timeline-major">{{ item.role }}</span>
              <span class="timeline-time">
                {{ item.dateRange }}
              </span>
            </div>
            <a
              class="project-link"
              :href="item.gitAddress"
              target="_blank"
              rel="noreferrer"
            >
              {{ item.gitAddress }}
            </a>
            <p class="project-summary" v-html="item.description"></p>
          </template>
        </div>
      </section>

      <!-- 个人技能 -->
      <section v-if="isExist('skills')" class="preview-section">
        <h2 class="section-title">个人技能</h2>
        <div class="timeline-card" v-html="resume.skills"></div>
      </section>

      <!-- 自定义模块 -->
      <template
        v-for="(customData, index) in Object.values(resume.customData)"
        :key="index"
      >
        <section v-if="isExist(`custom-${index}`)" class="preview-section">
          <h2 class="section-title">自定义模块</h2>
          <div v-for="item in customData" :key="item.id" class="timeline-card">
            <template v-if="item.visible">
              <div class="timeline-main">
                <div class="timeline-title">{{ item.title }}</div>
                <span class="timeline-major">{{ item.subTitle }}</span>
                <span class="timeline-time">
                  {{ item.dateRange }}
                </span>
              </div>
              <div class="timeline-desc" v-html="item.description"></div>
            </template>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.preview-wrapper {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  border: 1px solid #e5e6eb;
}

.preview-card {
  width: 100%;
  height: 100%;
  border-radius: 0.5rem;
  padding: 2.4rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  cursor: pointer;
}

.preview-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: 1.2rem;
  border-bottom: 1px solid #e5e6eb;

  .profile {
    h1 {
      font-size: 3.2rem;
      margin: 0;
      color: #111827;
    }
    p {
      margin-top: 0.4rem;
      color: #4b5563;
    }
  }

  .contact {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    font-size: 1.4rem;
    color: #4b5563;
    text-align: right;
  }
}

.preview-section {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  border-left: 4px solid #3b82f6;
  padding-left: 0.8rem;
}

.timeline-card {
  border-radius: 0.6rem;
  background: #fff;
}

.timeline-main,
.project-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.8rem;
}

.timeline-title,
.project-name {
  font-size: 1.6rem;
  font-weight: 600;
  color: #1f2937;
}

.timeline-sub {
  font-size: 1.4rem;
  color: #6b7280;
  margin-top: 0.2rem;
}

.timeline-period,
.timeline-major,
.timeline-time,
.project-stack {
  font-size: 1.3rem;
  font-weight: 500;
}

.timeline-list {
  padding-left: 1.4rem;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  color: #4b5563;
  font-size: 1.4rem;
}

.project-link {
  display: inline-block;
  font-size: 1.3rem;
  color: #3b82f6;
  margin-top: 0.2rem;
}

.project-summary {
  margin: 0 0 0.8rem;
  color: #4b5563;
  line-height: 1.6;
}

.skill-card {
  padding: 1.4rem 1.6rem;
  background: #fff;
}
</style>
