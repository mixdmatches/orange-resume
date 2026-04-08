<script setup lang="ts">
import type { Resume } from '@/types/resume'
import DataCard from '@/components/DataCard.vue'
import { inject } from 'vue'
import type { FieldConfig } from '@/types/form'

const props = defineProps({
  customName: {
    type: String,
    required: true,
  },
})

const resume: Resume = inject('resume') as Resume

const customFields: FieldConfig[] = [
  {
    prop: 'title',
    label: '自定义标题',
    type: 'input',
    placeholder: '自定义标题',
  },
  {
    prop: 'subTitle',
    label: '自定义副标题',
    type: 'input',
    placeholder: '自定义副标题',
  },
  {
    prop: 'dateRange',
    label: '时间范围',
    type: 'input',
    placeholder: '时间范围：YYYY/MM - YYYY/MM',
  },
  { prop: 'description', label: '自定义内容', type: 'editor' },
]

const handleAdd = () => {
  resume.customData[props.customName].push({
    id: crypto.randomUUID(),
    visible: true,
    title: '',
    subTitle: '',
    dateRange: '',
    description: '',
  })
}

const handleDelete = (id: string) => {
  resume.customData[props.customName] = resume.customData[
    props.customName
  ].filter(item => item.id !== id)
}
const handleHide = (id: string) => {
  const item = resume.customData[props.customName].find(item => item.id === id)
  if (item) {
    item.visible = !item.visible
  }
}
</script>

<template>
  <DataCard
    :title="customName"
    :items="resume.customData[customName]"
    :fields="customFields"
    @add="handleAdd"
    @delete="handleDelete"
    @hide="handleHide"
  />
</template>
