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

export const createDefaultQuestionList = (
  _resume: Resume,
): InterviewQuestion[] => {
  return [
    {
      id: 1,
      question: '请介绍一下你最近参与的项目以及你在其中承担的角色。',
      answer: `根据简历信息，请说明你在项目中的具体职责、技术选型和关键成果。`,
    },
    {
      id: 2,
      question: '你在当前岗位中掌握了哪些核心技能？',
      answer: `请结合你的技能和项目经历说明你最擅长的技术栈，以及你如何在实际场景中应用它们。`,
    },
    {
      id: 3,
      question: '你面临过的最大技术挑战是什么？你是如何解决的？',
      answer: `请结合实际经历描述问题定位、解决方案和最终结果。`,
    },
  ]
}
