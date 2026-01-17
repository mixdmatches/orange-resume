<script setup lang="ts">
import { useResumeData } from '@/stores/userInfo'
import dayjs from 'dayjs'
import type { Basic, Education, Internship } from '@/types/userInfo'
const { resume } = useResumeData()
const resumeData = resume

defineProps<{
  basic: Basic
  educations: Education[]
  internships: Internship[]
}>()
</script>

<template>
  <div class="preview-wrapper">
    <div class="preview-card">
      <section class="preview-header">
        <div class="profile">
          <h1>{{ basic.name }}</h1>
          <p>{{ basic.position }}</p>
        </div>
        <div class="contact">
          <span>电话：{{ basic.phone }}</span>
          <span>邮箱：{{ basic.email }}</span>
          <span>地址：{{ basic.address }}</span>
        </div>
      </section>

      <section class="preview-section">
        <h2 class="section-title">教育经历</h2>
        <div
          v-for="item in educations"
          :key="item.school"
          class="timeline-card"
        >
          <div class="timeline-main">
            <div>
              <div class="timeline-title">{{ item.school }}</div>
              <div class="timeline-sub">{{ item.degree }}</div>
            </div>
            <div class="timeline-major">{{ item.major }}</div>
            <div class="timeline-period">
              {{ dayjs(item.dateRange[0], 'YYYY/MM') }} -
              {{ dayjs(item.dateRange[1], 'YYYY/MM') }}
            </div>
          </div>
          <ul class="timeline-list">
            {{
              item.description
            }}
          </ul>
        </div>
      </section>

      <section class="preview-section">
        <h2 class="section-title">实习经历</h2>
        <div v-for="item in internships" :key="item.id" class="timeline-card">
          <div class="timeline-main">
            <div>
              <div class="timeline-title">{{ item.companyName }}</div>
              <div class="timeline-sub">{{ item.department }}</div>
            </div>
            <div class="timeline-period">{{ item.position }}</div>
          </div>
          <ul class="timeline-list">
            {{
              item.description
            }}
          </ul>
        </div>
      </section>

      <section class="preview-section">
        <h2 class="section-title">项目经历</h2>
        <div
          v-for="item in resumeData.projects"
          :key="item.name"
          class="project-card"
        >
          <div class="project-head">
            <div>
              <div class="project-name">{{ item.name }}</div>
              <a
                class="project-link"
                :href="item.link"
                target="_blank"
                rel="noreferrer"
              >
                {{ item.link }}
              </a>
            </div>
            <span class="project-stack">{{ item.stack }}</span>
          </div>
          <p class="project-summary">{{ item.summary }}</p>
          <ul class="timeline-list">
            <li v-for="bullet in item.bullets" :key="bullet">{{ bullet }}</li>
          </ul>
        </div>
      </section>

      <section class="preview-section">
        <h2 class="section-title">个人技能</h2>
        <div class="skill-list">
          <span
            v-for="skill in resumeData.skills"
            :key="skill"
            class="skill-badge"
            >{{ skill }}</span
          >
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.preview-wrapper {
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.preview-card {
  width: 100%;
  height: 100%;
  border-radius: 0.5rem;
  padding: 2.4rem;
  background: #fdfdfd;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  box-shadow: 0 14px 50px rgba(15, 23, 42, 0.08);
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

.timeline-card,
.project-card {
  border-radius: 0.6rem;
  border: 1px solid #eef0f5;
  padding: 1.4rem 1.6rem;
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
.project-stack {
  font-size: 1.3rem;
  color: #818cf8;
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

.skill-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
}

.skill-badge {
  padding: 0.4rem 1rem;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
  font-size: 1.3rem;
  border: 1px solid rgba(59, 130, 246, 0.3);
}
</style>
