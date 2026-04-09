<script setup lang="ts">
import type { Resume } from '@/types/resume'
import DataCard from '@/components/DataCard.vue'
import { inject } from 'vue'
import type { FieldConfig } from '@/types/form'

const resume: Resume = inject('resume') as Resume

// 技能字段配置
const skillsFields: FieldConfig[] = [
  { prop: 'skills', label: '个人技能', type: 'editor' },
]

const handleDeleteModel = () => {
  resume.menuSections = resume.menuSections.filter(item => item.id !== 'skills')
}
</script>

<template>
  <DataCard
    title="个人技能"
    :items="[{ skills: resume.skills }]"
    :fields="skillsFields"
    :show-actions="false"
    :show-add="false"
    @delete-model="handleDeleteModel"
  />
</template>
