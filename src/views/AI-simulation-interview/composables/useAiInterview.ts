import type { Resume } from '@/types/resume'

export interface InterviewQuestion {
  id: number
  question: string
  answer: string
}

const createSection = (title: string, value?: string) =>
  `${title}: ${value?.trim() || '未填写'}`

export const resumeToText = (resume: Resume): string => {
  const lines: string[] = []
  const { basic, educations, internships, projects, skills } = resume

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

export const parseQuestions = (content: string): InterviewQuestion[] => {
  const result: InterviewQuestion[] = []
  const lines = content.split(/\r?\n/)
  let currentQuestion = ''
  let currentAnswer = ''
  let answerMode = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const questionMatch = trimmed.match(
      /^(Q\d+|\d+\.|问题\d*:?|Question\d*:?)[\s:]*([^\n]+)/i,
    )
    if (questionMatch) {
      if (currentQuestion) {
        result.push({
          id: result.length + 1,
          question: currentQuestion.trim(),
          answer: currentAnswer.trim() || '暂无参考回答',
        })
      }
      currentQuestion = questionMatch[2].trim()
      currentAnswer = ''
      answerMode = false
      continue
    }

    if (/^(回答|参考答案|答|Answer)[:：]\s*/i.test(trimmed)) {
      answerMode = true
      currentAnswer +=
        trimmed.replace(/^(回答|参考答案|答|Answer)[:：]\s*/i, '') + '\n'
      continue
    }

    if (answerMode) {
      currentAnswer += trimmed + '\n'
    }
  }

  if (currentQuestion) {
    result.push({
      id: result.length + 1,
      question: currentQuestion.trim(),
      answer: currentAnswer.trim() || '暂无参考回答',
    })
  }

  return result
}
