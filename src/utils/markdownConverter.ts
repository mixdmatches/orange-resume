import type { Resume } from '@/types/resume'
import MarkdownIt from 'markdown-it'
import TurndownService from 'turndown'

const md = new MarkdownIt()
const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
})

function htmlToMd(html: string): string {
  const markdown = turndownService.turndown(html)
  return markdown
}

/**
 * 将Resume对象转换为Markdown文本
 * @param resume 简历对象
 * @returns Markdown格式的字符串
 */
export function resumeToMarkdown(resume: Resume): string {
  const lines: string[] = []

  lines.push(`# ${resume.basic.name || '姓名'}`)
  lines.push('')

  // 基本信息
  lines.push('## 基本信息')
  lines.push('')

  // 联系方式
  const contactLines: string[] = []
  if (resume.basic.position)
    contactLines.push(`- 职位：${resume.basic.position}`)
  if (resume.basic.phone) contactLines.push(`- 电话：${resume.basic.phone}`)
  if (resume.basic.email) contactLines.push(`- 邮箱：${resume.basic.email}`)
  if (resume.basic.address) contactLines.push(`- 地址：${resume.basic.address}`)
  if (contactLines.length > 0) {
    lines.push(...contactLines)
    lines.push('')
  }

  // 遍历菜单区块
  for (const section of resume.menuSections) {
    if (section.id === 'basic') continue

    lines.push(`## ${section.title}`)
    lines.push('')

    switch (section.id) {
      case 'education':
        for (const edu of resume.educations.filter(e => e.visible)) {
          lines.push(
            `### ${edu.school} | ${edu.major} | ${edu.degree} | ${edu.dateRange}`,
          )
          if (edu.description) {
            const md = htmlToMd(edu.description)
            lines.push(`${md}`)
          }
          lines.push('')
        }
        break

      case 'internship':
        for (const intern of resume.internships.filter(i => i.visible)) {
          const deptStr = intern.department ? ` | ${intern.department}` : ''
          lines.push(
            `### ${intern.companyName} | ${intern.position}${deptStr} | ${intern.dateRange}`,
          )
          if (intern.description) {
            const md = htmlToMd(intern.description)
            lines.push(`${md}`)
          }
          lines.push('')
        }
        break

      case 'project':
        for (const proj of resume.projects.filter(p => p.visible)) {
          const gitStr = proj.gitAddress ? ` | ${proj.gitAddress}` : ''
          lines.push(
            `### ${proj.name} | ${proj.role}${gitStr} | ${proj.dateRange}`,
          )
          if (proj.description) {
            const md = htmlToMd(proj.description)
            lines.push(`${md}`)
          }
          lines.push('')
        }
        break

      case 'skills':
        if (resume.skills) {
          const md = htmlToMd(resume.skills)
          lines.push(`${md}`)
          lines.push('')
        }
        break

      default:
        // 自定义模块
        if (section.id.startsWith('custom-')) {
          const customItems = resume.customData[section.id] || []
          for (const item of customItems.filter(c => c.visible)) {
            const subStr = item.subTitle ? ` | ${item.subTitle}` : ''
            lines.push(`### ${item.title}${subStr} | ${item.dateRange}`)
            if (item.description) {
              const md = htmlToMd(item.description)
              lines.push(`${md}`)
            }
            lines.push('')
          }
        }
        break
    }
  }

  return lines.join('\n')
}

/**
 * 将Markdown文本解析为Resume对象
 * @param markdown Markdown格式的字符串
 * @param baseResume 基础Resume对象（用于保留配置信息）
 * @returns 解析后的Resume对象
 */
export function markdownToResume(markdown: string, baseResume: Resume): Resume {
  const lines = markdown.split('\n')
  const resume = JSON.parse(JSON.stringify(baseResume)) as Resume

  // 清空列表数据
  resume.educations = []
  resume.internships = []
  resume.projects = []
  resume.skills = ''
  resume.customData = {}

  let currentSection: string | null = null
  let currentDescription: string[] = []

  const normalizeDescriptionLine = (line: string) => {
    const trimmed = line.trim()
    if (!trimmed) return ''

    return trimmed.replace(/^([-*+]|\d+\.)\s+/, '').trim()
  }

  /**
   * 保存当前描述内容到对应模块
   */
  const flushDescription = () => {
    if (currentDescription.length === 0) return

    const desc = currentDescription.join('\n')
    currentDescription = []

    switch (currentSection) {
      case 'education': {
        const edu = resume.educations[resume.educations.length - 1]
        if (edu) edu.description = desc
        break
      }
      case 'internship': {
        const intern = resume.internships[resume.internships.length - 1]
        if (intern) intern.description = desc
        break
      }
      case 'project': {
        const proj = resume.projects[resume.projects.length - 1]
        if (proj) proj.description = desc
        break
      }
      case 'skills': {
        resume.skills = desc
        break
      }
      default:
        if (currentSection?.startsWith('custom-')) {
          const items = resume.customData[currentSection]
          if (items && items.length > 0) {
            items[items.length - 1].description = desc
          }
        }
        break
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // 跳过空行：保留描述块内的段落分隔，但不提前结束当前描述
    if (!line) {
      if (currentDescription.length > 0 && currentSection) {
        currentDescription.push('')
      }
      continue
    }

    // 解析标题
    if (line.startsWith('# ')) {
      // 一级标题：姓名
      flushDescription()
      resume.basic.name = line.replace('# ', '').trim()
      currentSection = null
      continue
    }

    if (line.startsWith('## ')) {
      // 二级标题：职位或模块标题
      flushDescription()
      const title = line.replace('## ', '').trim()

      if (title === '基本信息') {
        currentSection = null
        continue
      }

      const section = resume.menuSections.find(s => s.title === title)
      if (section) {
        currentSection = section.id
        continue
      }

      if (!currentSection && !resume.basic.position && title) {
        resume.basic.position = title
        continue
      }

      currentSection = null
      continue
    }

    if (line.startsWith('### ')) {
      // 三级标题：具体条目
      flushDescription()
      const content = line.replace('### ', '').trim()
      const parts = content.split(' | ').map(p => p.trim())

      switch (currentSection) {
        case 'education': {
          const [school, major, degree, dateRange] = parts
          resume.educations.push({
            id: crypto.randomUUID(),
            school: school || '',
            major: major || '',
            degree: degree || '',
            dateRange: dateRange || '',
            visible: true,
            gpa: '',
            description: '',
          })
          break
        }
        case 'internship': {
          const [companyName, position, department, dateRange] = parts
          resume.internships.push({
            id: crypto.randomUUID(),
            companyName: companyName || '',
            position: position || '',
            department: department || '',
            dateRange: dateRange || '',
            description: '',
            visible: true,
          })
          break
        }
        case 'project': {
          const [name, role, gitAddress, dateRange] = parts
          resume.projects.push({
            id: crypto.randomUUID(),
            name: name || '',
            role: role || '',
            gitAddress: gitAddress || '',
            dateRange: dateRange || '',
            visible: true,
            description: '',
          })
          break
        }
        default:
          if (currentSection?.startsWith('custom-')) {
            if (!resume.customData[currentSection]) {
              resume.customData[currentSection] = []
            }
            const [title, subTitle, dateRange] = parts
            resume.customData[currentSection].push({
              id: crypto.randomUUID(),
              title: title || '',
              subTitle: subTitle || '',
              dateRange: dateRange || '',
              visible: true,
              description: '',
            })
          }
          break
      }
      continue
    }

    // 解析描述内容（支持列表项、段落和多行描述）
    if (!currentSection) {
      if (line.startsWith('电话：')) {
        resume.basic.phone = line.replace('电话：', '').trim()
      } else if (line.startsWith('邮箱：')) {
        resume.basic.email = line.replace('邮箱：', '').trim()
      } else if (line.startsWith('地址：')) {
        resume.basic.address = line.replace('地址：', '').trim()
      }
      continue
    }

    if (currentSection === 'skills') {
      const content = normalizeDescriptionLine(line)
      if (!content) continue

      if (resume.skills) {
        resume.skills += '\n' + content
      } else {
        resume.skills = content
      }
      continue
    }

    const content = normalizeDescriptionLine(line)
    if (content) {
      currentDescription.push(content)
    }
  }

  // 最后刷新一次描述
  flushDescription()

  return resume
}

/**
 * 将Markdown文本渲染为HTML
 * @param markdown Markdown格式的字符串
 * @returns HTML字符串
 */
export function renderMarkdown(markdown: string): string {
  return md.render(markdown)
}
