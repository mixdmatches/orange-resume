import type { Resume } from '@/types/resume'

/**
 * 将应用内简历序列化为纯文本，与文件上传产物同构，统一作为 AI 输入
 * @param resume 简历对象
 */
export function resumeToText(resume: Resume): string {
  const { basic } = resume
  const sections: string[] = []

  const basicLines = [
    basic.name && `姓名：${basic.name}`,
    basic.position && `求职方向：${basic.position}`,
    basic.phone && `电话：${basic.phone}`,
    basic.email && `邮箱：${basic.email}`,
    basic.address && `地址：${basic.address}`,
  ].filter(Boolean)
  if (basicLines.length) sections.push(basicLines.join('\n'))

  const eduLines = resume.educations
    .filter(e => e.visible)
    .map(e =>
      [e.school, e.major, e.degree, e.dateRange, e.gpa, e.description]
        .filter(Boolean)
        .join(' | '),
    )
    .filter(Boolean)
  if (eduLines.length) sections.push(`【教育经历】\n${eduLines.join('\n')}`)

  const internLines = resume.internships
    .filter(e => e.visible)
    .map(e =>
      [e.companyName, e.position, e.department, e.dateRange, e.description]
        .filter(Boolean)
        .join(' | '),
    )
    .filter(Boolean)
  if (internLines.length) sections.push(`【实习经历】\n${internLines.join('\n')}`)

  const projLines = resume.projects
    .filter(p => p.visible)
    .map(p =>
      [p.name, p.role, p.dateRange, p.gitAddress, p.description]
        .filter(Boolean)
        .join(' | '),
    )
    .filter(Boolean)
  if (projLines.length) sections.push(`【项目经历】\n${projLines.join('\n')}`)

  if (resume.skills?.trim()) sections.push(`【专业技能】\n${resume.skills.trim()}`)

  const customLines: string[] = []
  for (const [moduleName, items] of Object.entries(resume.customData ?? {})) {
    for (const item of items) {
      if (!item.visible) continue
      const line = [item.title, item.subTitle, item.dateRange, item.description]
        .filter(Boolean)
        .join(' | ')
      if (line) customLines.push(`${moduleName}：${line}`)
    }
  }
  if (customLines.length) sections.push(`【其他经历】\n${customLines.join('\n')}`)

  return sections.join('\n\n')
}
