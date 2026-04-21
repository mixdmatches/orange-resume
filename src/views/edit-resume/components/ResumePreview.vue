<script setup lang="ts">
import type { Resume } from '@/types/resume'
import { computed, inject, ref, onMounted, watch } from 'vue'
import SectionPreview from '@/components/ResumeSection.vue'

const resume: Resume = inject('resume') as Resume

const styles = computed(() => resume.globalConfiguration)

const previewCardRef = ref<HTMLElement | null>(null) // 引用预览卡片元素
const contentHeight = ref(0) // 实际内容高度

// 计算页面高度（A4 高度减去上下边距）
const pageHeight = computed(() => {
  const a4Height = 297 // A4 高度（mm）
  return a4Height
})

// 计算分页位置
const pageBreakPositions = computed(() => {
  const positions: number[] = []
  if (contentHeight.value <= 0) return positions

  // 计算需要的页数
  const pageCount = Math.ceil(contentHeight.value / pageHeight.value)

  // 生成分页位置
  for (let i = 1; i < pageCount; i++) {
    positions.push(pageHeight.value * i)
  }

  return positions
})

// 计算实际内容高度
const updateContentHeight = () => {
  if (previewCardRef.value) {
    // 获取实际内容高度（转换为mm）
    const rect = previewCardRef.value.getBoundingClientRect()
    // 假设 1px = 0.2645833333 mm
    contentHeight.value = rect.height * 0.2645833333
  }
}

// 监听内容变化
watch(
  () => [
    resume.educations,
    resume.internships,
    resume.projects,
    resume.skills,
    resume.customData,
  ],
  () => {
    // 延迟更新，确保DOM已更新
    setTimeout(updateContentHeight, 100)
  },
  { deep: true },
)

// 监听样式变化
watch(
  () => styles.value,
  () => {
    setTimeout(updateContentHeight, 100)
  },
  { deep: true },
)

// 组件挂载后计算高度
onMounted(() => {
  updateContentHeight()
  // 监听窗口 resize
  window.addEventListener('resize', updateContentHeight)
})

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
      ref="previewCardRef"
      class="preview-card"
      :style="{
        gap: `${styles.baseModuleSpacing}px`,
        padding: `${styles.basePagePadding}px`,
      }"
    >
      <!-- 分页标识 -->
      <div
        v-for="(position, index) in pageBreakPositions"
        :key="index"
        class="page-break"
        :style="{ top: `${position}mm` }"
      >
        <div class="page-break-line"></div>
        <div class="page-break-text">第 {{ index + 1 }} 页 截止</div>
      </div>

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
  position: relative;
}

.preview-controls {
  position: absolute;
  top: 10px;
  right: 20px;
  z-index: 100;
  background: white;
  padding: 8px 12px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 14px;
}

.control-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.control-checkbox {
  margin: 0;
}

.preview-card {
  width: 210mm;
  min-height: 297mm; /* A4 高度 */
  color: #111827;
  padding: 24px;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  cursor: pointer;
  position: relative;
}

/* 分页标识 */
.page-break {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.page-break-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #ff6b6b, transparent);
  opacity: 0.7;
}

.page-break-text {
  background: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  color: #ff6b6b;
  font-weight: 500;
  z-index: 11;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
