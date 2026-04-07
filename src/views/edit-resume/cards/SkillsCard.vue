<script setup lang="ts">
import type { Resume } from '@/types/userInfo'
import DataCard from '@/components/DataCard.vue'
import { inject } from 'vue'
import type { FieldConfig } from '@/types/form'

const resume: Resume = inject('resume') as Resume

// 技能字段配置
const skillsFields: FieldConfig[] = [
  { prop: 'skills', label: '个人技能', type: 'editor' },
]
</script>

<template>
  <DataCard
    title="个人技能"
    :items="[{ skills: resume.skills }]"
    :fields="skillsFields"
    :show-add="false"
  />
</template>
