import type { Resume } from '@/types/resume'

const createSection = (title: string, value?: string) =>
  `${title}: ${value?.trim() || '未填写'}`

export const resumeToText = (resume: Resume): string => {
  const lines: string[] = []
  // 各模块字段若为 undefined（新建空白简历/PDF 导入缺字段）时兜底，避免读取 .length 报错
  const {
    basic = {} as Resume['basic'],
    educations = [],
    internships = [],
    projects = [],
    skills = '',
  } = resume

  lines.push('候选人简历信息如下：')
  lines.push(createSection('姓名', basic.name))
  lines.push(createSection('求职岗位', basic.position))
  lines.push(createSection('电话', basic.phone))
  lines.push(createSection('邮箱', basic.email))
  lines.push(createSection('地址', basic.address))
  lines.push('')

  if (educations.length) {
    lines.push('教育经历：')
    educations.forEach(item => {
      lines.push(
        `- ${item.school} | ${item.major} | ${item.degree} | ${item.dateRange}`,
      )
      if (item.description) lines.push(`  - ${item.description}`)
    })
    lines.push('')
  }

  if (internships.length) {
    lines.push('实习经历：')
    internships.forEach(item => {
      lines.push(`- ${item.companyName} | ${item.position} | ${item.dateRange}`)
      if (item.description) lines.push(`  - ${item.description}`)
    })
    lines.push('')
  }

  if (projects.length) {
    lines.push('项目经历：')
    projects.forEach(item => {
      lines.push(`- ${item.name} | ${item.role} | ${item.dateRange}`)
      if (item.description) lines.push(`  - ${item.description}`)
    })
    lines.push('')
  }

  lines.push(createSection('技能专长', skills))

  return lines.join('\n')
}
