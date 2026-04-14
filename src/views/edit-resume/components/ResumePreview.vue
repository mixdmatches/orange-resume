<script setup lang="ts">
import type { Resume } from '@/types/resume'
import { computed, inject } from 'vue'

const resume: Resume = inject('resume') as Resume

const styles = computed(() => resume.globalConfiguration)

const descStyle = computed(() => ({
  fontSize: `${styles.value.baseFontSize}px`,
  lineHeight: styles.value.baseLineHeight,
}))

const titleStyle = computed(() => ({
  fontSize: `${styles.value.titleFontSize}px`,
}))

const subTitleStyle = computed(() => ({
  fontSize: `${styles.value.subTitleFontSize}px`,
}))

const isExist = (id: string) => {
  return resume.menuSections.some(item => item.id === id)
}

// 根据 menuSections 的 order 排序
const sortedMenuSections = () => {
  return resume.menuSections
    .filter(section => section.id !== 'basic') // 过滤掉 basic，因为基本信息单独渲染
    .sort((a, b) => parseInt(a.order) - parseInt(b.order))
}
</script>

<template>
  <div class="preview-wrapper">
    <div
      class="preview-card"
      :style="{
        gap: `${styles.baseModuleSpacing}px`,
        padding: `${styles.basePagePadding}px`,
      }"
    >
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

      <!-- 根据 menuSections 的 order 排序渲染模块 -->
      <template v-for="section in sortedMenuSections()" :key="section.id">
        <!-- 教育经历 -->
        <section
          v-if="section.id === 'education' && isExist('education')"
          class="preview-section"
        >
          <div class="section-title" :style="titleStyle">
            {{ section.title }}
          </div>
          <div class="cards" :style="{ gap: `${styles.paragraphSpacing}px` }">
            <div
              v-for="item in resume.educations"
              :key="item.school"
              class="timeline-card"
            >
              <template v-if="item.visible">
                <div class="timeline-main" :style="subTitleStyle">
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
                <div :style="descStyle" v-html="item.description"></div>
              </template>
            </div>
          </div>
        </section>

        <!-- 实习经历 -->
        <section
          v-if="section.id === 'internship' && isExist('internship')"
          class="preview-section"
        >
          <div :style="titleStyle" class="section-title">
            {{ section.title }}
          </div>
          <div class="cards" :style="{ gap: `${styles.paragraphSpacing}px` }">
            <div
              v-for="item in resume.internships"
              :key="item.id"
              class="timeline-card"
            >
              <template v-if="item.visible">
                <div class="timeline-main" :style="subTitleStyle">
                  <div class="timeline-title">
                    {{ item.companyName }}
                    <em
                      v-show="item.companyName !== '' && item.department !== ''"
                      >-</em
                    >
                    {{ item.department }}
                  </div>
                  <div class="timeline-major">{{ item.position }}</div>
                  <div class="timeline-period">{{ item.dateRange }}</div>
                </div>
                <div :style="descStyle" v-html="item.description"></div>
              </template>
            </div>
          </div>
        </section>

        <!-- 项目经历 -->
        <section
          v-if="section.id === 'project' && isExist('project')"
          class="preview-section"
        >
          <div :style="titleStyle" class="section-title">
            {{ section.title }}
          </div>
          <div class="cards" :style="{ gap: `${styles.paragraphSpacing}px` }">
            <div
              v-for="item in resume.projects"
              :key="item.id"
              class="timeline-card"
            >
              <template v-if="item.visible">
                <div class="timeline-main" :style="subTitleStyle">
                  <div class="timeline-title">{{ item.name }}</div>
                  <span class="timeline-major">{{ item.role }}</span>
                  <span class="timeline-time">{{ item.dateRange }}</span>
                </div>
                <a
                  class="project-link"
                  :href="item.gitAddress"
                  target="_blank"
                  rel="noreferrer"
                >
                  {{ item.gitAddress }}
                </a>
                <div :style="descStyle" v-html="item.description"></div>
              </template>
            </div>
          </div>
        </section>

        <!-- 个人技能 -->
        <section
          v-if="section.id === 'skills' && isExist('skills')"
          class="preview-section"
        >
          <div :style="titleStyle" class="section-title">
            {{ section.title }}
          </div>
          <div class="cards" :style="{ gap: `${styles.paragraphSpacing}px` }">
            <div
              class="timeline-card"
              :style="descStyle"
              v-html="resume.skills"
            ></div>
          </div>
        </section>

        <!-- 自定义模块 -->
        <section
          v-if="section.id.startsWith('custom-') && isExist(section.id)"
          class="preview-section"
        >
          <div :style="titleStyle" class="section-title">
            {{ section.title }}
          </div>
          <div class="cards" :style="{ gap: `${styles.paragraphSpacing}px` }">
            <div
              v-for="item in resume.customData[section.id] || []"
              :key="item.id"
              class="timeline-card"
            >
              <template v-if="item.visible">
                <div class="timeline-main" :style="subTitleStyle">
                  <div class="timeline-title">{{ item.title }}</div>
                  <span class="timeline-major">{{ item.subTitle }}</span>
                  <span class="timeline-time">{{ item.dateRange }}</span>
                </div>
                <div :style="descStyle" v-html="item.description"></div>
              </template>
            </div>
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
}

.preview-card {
  width: 210mm;
  height: 270mm;
  padding: 24px;
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e6eb;
  background-color: #fff;
  cursor: pointer;
}

.preview-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e6eb;

  .profile {
    h1 {
      font-size: 32px;
      margin: 0;
      color: #111827;
    }
    p {
      margin-top: 4px;
      color: #4b5563;
    }
  }

  .contact {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 14px;
    color: #4b5563;
    text-align: right;
  }
}

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
  border-left: 4px solid #3b82f6;
  padding-left: 8px;
}

.cards {
  display: flex;
  flex-direction: column;
}

.timeline-card {
  border-radius: 6px;
}

.timeline-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 8px;
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
  color: #3b82f6;
  margin-top: 2px;
}
</style>
