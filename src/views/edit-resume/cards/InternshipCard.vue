<script setup lang="ts">
import type { FieldConfig } from '@/types/form'
import type { Resume } from '@/types/resume'
import { inject } from 'vue'

const resume: Resume = inject('resume') as Resume

const internshipFields: FieldConfig[] = [
  { prop: 'companyName', label: '公司名称', type: 'input' },
  { prop: 'position', label: '岗位名称', type: 'input' },
  { prop: 'department', label: '所在部门', type: 'input' },
  { prop: 'dateRange', label: '时间范围', type: 'input' },
  { prop: 'description', label: '实习描述', type: 'editor' },
]

/**
 * 删除实习经历
 * @param id 实习经历的id
 */
const handleDeleteInternship = (id: string) => {
  resume.internships = resume.internships.filter(item => item.id !== id)
}

/**
 * 添加实习经历
 */
const handleAddInternship = () => {
  resume.internships.push({
    id: crypto.randomUUID(),
    companyName: '公司名称',
    position: '岗位名称',
    department: '所在部门',
    dateRange: '时间范围',
    visible: true,
    description: '',
  })
}
const handleHideInternship = (id: string) => {
  resume.internships.forEach(item => {
    if (item.id === id) {
      item.visible = !item.visible
    }
  })
}
</script>

<template>
  <DataCard
    title="实习经历"
    :items="resume.internships"
    :fields="internshipFields"
    @add="handleAddInternship"
    @delete="handleDeleteInternship"
    @hide="handleHideInternship"
  />
</template>
