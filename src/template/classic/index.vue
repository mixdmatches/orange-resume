<script setup lang="ts">
import type { Resume } from '@/types/resume'
import SectionPreview from '@/components/ResumeSection.vue'
import { provide } from 'vue'

const props = defineProps<{
  resume: Resume
}>()

const { resume } = props

// 提供 resume 给子组件
provide('resume', resume)

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
  <div class="classic">
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
    <template v-for="section in sortedMenuSections()" :key="section.id">
      <SectionPreview
        :id="section.id"
        :title="section.title"
        :items="getSectionItems(section.id)"
      />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.classic {
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
}
.preview-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e6eb;
  margin-bottom: 10px;
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
