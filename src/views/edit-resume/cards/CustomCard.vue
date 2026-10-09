<script setup lang="ts">
import type { Resume } from '@/types/resume'
import DataCard from '@/components/DataCard.vue'
import { computed, inject } from 'vue'
import { generateUUID } from '@/utils/uuid'
import type { FieldConfig } from '@/types/form'

const props = defineProps({
  customName: {
    type: String,
    required: true,
  },
})

const resume: Resume = inject('resume') as Resume

/** 卡片展示标题：优先取 menuSections 中的模块名，避免头部直接显示 "custom-0" 原始 id */
const displayTitle = computed(() => {
  const section = resume.menuSections.find(
    section => section.id === props.customName,
  )
  return section?.title || '自定义模块'
})

/**
 * 编辑模块名称：回写 menuSections 中对应 section 的 title，
 * 左侧导航与右侧预览均实时跟随更新
 * @param title - 新的模块名称
 */
const handleTitleChange = (title: string) => {
  const section = resume.menuSections.find(
    section => section.id === props.customName,
  )
  if (section) {
    section.title = title
  }
}

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
    id: generateUUID(),
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

// 删除模块回调函数
const handleDeleteModel = () => {
  delete resume.customData[props.customName]
  const newMenu = resume.menuSections.filter(
    item => item.id !== props.customName,
  )
  resume.menuSections = newMenu
}
</script>

<template>
  <DataCard
    :title="displayTitle"
    editable-title
    :items="resume.customData[customName]"
    :fields="customFields"
    @title-change="handleTitleChange"
    @add="handleAdd"
    @delete-model="handleDeleteModel"
    @delete="handleDelete"
    @hide="handleHide"
  />
</template>
