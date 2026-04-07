<script setup lang="ts">
import type { Resume } from '@/types/userInfo'
import { computed, inject } from 'vue'
import DataCard from '@/components/DataCard.vue'
import type { FieldConfig } from '@/types/form'

const resume: Resume = inject('resume') as Resume

const basicFields: FieldConfig[] = [
  { label: '姓名', prop: 'name', type: 'input' },
  { label: '职位', prop: 'position', type: 'input' },
  { label: '联系电话', prop: 'phone', type: 'input' },
  { label: '电子邮箱', prop: 'email', type: 'input' },
  { label: '所在城市', prop: 'address', type: 'input' },
]

const basicItems = computed(() => [resume.basic])
</script>

<template>
  <DataCard
    title="基本信息"
    :fields="basicFields"
    :items="basicItems"
    :show-delete="false"
    :show-add="false"
    :show-actions="false"
  >
  </DataCard>
</template>
