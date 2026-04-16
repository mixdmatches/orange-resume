<script setup lang="ts">
import type { Resume } from '@/types/resume'
import { computed, inject } from 'vue'
import SectionPreview from '@/components/ResumeSection.vue'

const resume: Resume = inject('resume') as Resume

const styles = computed(() => resume.globalConfiguration)

// 根据 menuSections 的 order 排序
const sortedMenuSections = () => {
  return resume.menuSections
    .filter(section => section.id !== 'basic') // 过滤掉 basic，因为基本信息单独渲染
    .sort((a, b) => parseInt(a.order) - parseInt(b.order))
}

// 整合适合 SectionPreview 组件的数据
const getSectionItems = (sectionId: string) => {
  switch (sectionId) {
    case 'education':
      return resume.educations.map(item => ({
        id: item.id,
        visible: item.visible,
        subMain: [item.school, item.degree, item.major, item.dateRange],
        address: '',
        description: item.description,
      }))
    case 'internship':
      return resume.internships.map(item => ({
        id: item.id,
        visible: item.visible,
        subMain: [
          item.companyName,
          item.department,
          item.position,
          item.dateRange,
        ],
        address: '',
        description: item.description,
      }))
    case 'project':
      return resume.projects.map(item => ({
        id: item.id,
        visible: item.visible,
        subMain: [item.name, '', item.role, item.dateRange],
        address: item.gitAddress,
        description: item.description,
      }))
    case 'skills':
      return [
        {
          id: 'skills',
          visible: true,
          subMain: [],
          address: '',
          description: resume.skills,
        },
      ]
    default:
      if (sectionId.startsWith('custom-')) {
        return (resume.customData[sectionId] || []).map(item => ({
          id: item.id,
          visible: item.visible,
          subMain: [item.title, item.subTitle, '', item.dateRange],
          address: '',
          description: item.description,
        }))
      }
      return []
  }
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
        <SectionPreview
          :id="section.id"
          :title="section.title"
          :items="getSectionItems(section.id)"
        />
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
  color: #111827;
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
</style>
