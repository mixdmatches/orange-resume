<script setup lang="ts">
import type { FieldConfig } from '@/types/form'
import type { Resume } from '@/types/resume'
import { inject } from 'vue'

const resume: Resume = inject('resume') as Resume

const projectFields: FieldConfig[] = [
  { prop: 'name', label: '项目名称', type: 'input' },
  { prop: 'role', label: '担任角色', type: 'input' },
  { prop: 'gitAddress', label: 'GitHub/GitLab地址', type: 'input' },
  { prop: 'dateRange', label: '时间范围', type: 'input' },
  { prop: 'description', label: '项目描述', type: 'editor' },
]

/**
 * 删除项目经历
 * @param id 项目经历的id
 */
const handleDeleteProject = (id: string) => {
  resume.projects = resume.projects.filter(item => item.id !== id)
}

/**
 * 添加项目经历
 */
const handleAddProject = () => {
  resume.projects.push({
    id: crypto.randomUUID(),
    name: '项目名称',
    role: '担任角色',
    gitAddress: 'GitHub/GitLab地址',
    dateRange: '时间范围',
    visible: true,
    description: '',
  })
}

/**
 * 隐藏项目经历
 * @param id 项目经历的id
 */
const handleHideProject = (id: string) => {
  resume.projects.forEach(item => {
    if (item.id === id) {
      item.visible = !item.visible
    }
  })
}

// 删除模块回调函数
const handleDeleteModel = () => {
  resume.menuSections = resume.menuSections.filter(
    item => item.id !== 'project',
  )
}
</script>

<template>
  <DataCard
    title="项目经历"
    :items="resume.projects"
    :fields="projectFields"
    @hide="handleHideProject"
    @delete="handleDeleteProject"
    @add="handleAddProject"
    @delete-model="handleDeleteModel"
  />
</template>
