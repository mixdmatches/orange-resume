<script setup lang="ts">
import type { Resume } from '@/types/userInfo'
import DataCard from '@/components/DataCard.vue'
import { inject } from 'vue'
import type { FieldConfig } from '@/types/form'

const resume: Resume = inject('resume') as Resume

const degreeOptions = ['小学', '初中', '高中', '大专', '本科', '硕士', '博士']

// 教育经历字段配置
const educationFields: FieldConfig[] = [
  { prop: 'school', label: '学校名称', type: 'input', placeholder: '学校名称' },
  { prop: 'major', label: '就读专业', type: 'input', placeholder: '就读专业' },
  {
    prop: 'degree',
    label: '学历层次',
    type: 'select',
    placeholder: '学历层次',
    options: degreeOptions,
  },
  {
    prop: 'dateRange',
    label: '时间范围',
    type: 'input',
    placeholder: '时间范围：YYYY/MM - YYYY/MM',
  },
  { prop: 'description', label: '自定义描述', type: 'editor' },
]

const handleAddEducation = () => {
  resume.educations.push({
    id: crypto.randomUUID(),
    school: '学校',
    major: '专业',
    degree: '学历层次',
    dateRange: '时间范围',
    visible: true,
    gpa: '',
    description: '',
  })
}

const handleDeleteEducation = (id: string) => {
  resume.educations = resume.educations.filter(item => item.id !== id)
}

const handleHideEducation = (id: string) => {
  const education = resume.educations.find(item => item.id === id)
  if (education) {
    education.visible = !education.visible
  }
}
</script>

<template>
  <DataCard
    title="教育经历"
    :items="resume.educations"
    :fields="educationFields"
    @add="handleAddEducation"
    @delete="handleDeleteEducation"
    @hide="handleHideEducation"
  />
</template>
