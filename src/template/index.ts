import Classic from '@/template/classic/index.vue'
import ModernTech from '@/template/modern-tech/index.vue'
import MinimalClean from '@/template/minimal-clean/index.vue'
import CreativeDesign from '@/template/creative-design/index.vue'
import ProfessionalBusiness from '@/template/professional-business/index.vue'
import { computed, type Component } from 'vue'
import type { Resume } from '@/types/resume'

export interface TemplateInfo {
  id: string
  name: string
  description: string
  component: Component
  previewImage: string
}

export const templates: TemplateInfo[] = [
  {
    id: 'classic',
    name: '经典模板',
    description: '基础模板，无特殊设计',
    component: Classic,
    previewImage: '/templates/classic.png',
  },
  {
    id: 'modern-tech',
    name: '现代科技感',
    description: '渐变背景、几何元素、动态效果，适合互联网/科技行业',
    component: ModernTech,
    previewImage: '/templates/modern-tech.png',
  },
  {
    id: 'minimal-clean',
    name: '极简清新',
    description: '留白充足、排版简洁，适合设计/创意行业',
    component: MinimalClean,
    previewImage: '/templates/minimal-clean.png',
  },
  {
    id: 'creative-design',
    name: '创意设计',
    description: '色彩丰富、卡片布局，适合艺术/媒体行业',
    component: CreativeDesign,
    previewImage: '/templates/creative-design.png',
  },
  {
    id: 'professional-business',
    name: '专业商务',
    description: '传统稳重、表格布局，适合金融/传统行业',
    component: ProfessionalBusiness,
    previewImage: '/templates/professional-business.png',
  },
]

export const getTemplateById = (id: string): TemplateInfo | undefined => {
  return templates.find(t => t.id === id)
}

export function useTemplateStyles(resume: Resume) {
  const resumeStyles = computed(() => ({
    ...resume.globalConfiguration,
    titleFontSize: `${resume.globalConfiguration.titleFontSize}px`,
    subTitleFontSize: `${resume.globalConfiguration.subTitleFontSize}px`,
    paragraphSpacing: `${resume.globalConfiguration.paragraphSpacing}px`,
    baseFontSize: `${resume.globalConfiguration.baseFontSize}px`,
    baseModuleSpacing: `${resume.globalConfiguration.baseModuleSpacing}px`,
  }))

  // 整合适合 ResumeSection 组件的数据
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

  return {
    resumeStyles,
    getSectionItems,
  }
}

export default templates
