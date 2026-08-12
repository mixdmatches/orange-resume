import type { Resume } from '@/types/resume'

/**
 * 问题严重等级
 * - error: 严重缺失，影响简历可用性
 * - warning: 建议完善，提升简历质量
 * - info: 温馨提示
 */
export type IssueLevel = 'error' | 'warning' | 'info'

/**
 * 单条检测问题
 */
export interface AnalysisIssue {
  level: IssueLevel
  message: string
  /** 关联模块 id，用于定位 */
  sectionId?: string
}

/**
 * 单个模块的完整性检测结果
 */
export interface SectionAnalysis {
  /** 模块 id */
  id: string
  /** 模块标题 */
  title: string
  /** 完成度 0-100 */
  completeness: number
  /** 已填写字段数 */
  filledCount: number
  /** 总字段数 */
  totalCount: number
  /** 该模块的问题列表 */
  issues: AnalysisIssue[]
}

/**
 * 整体简历分析结果
 */
export interface ResumeAnalysisResult {
  /** 总体完成度 0-100 */
  overallCompleteness: number
  /** 各模块分析结果 */
  sections: SectionAnalysis[]
  /** 全局问题列表（不属于具体模块的） */
  globalIssues: AnalysisIssue[]
  /** 评分等级 */
  grade: 'A' | 'B' | 'C' | 'D'
  /** 评分说明 */
  gradeText: string
}

/**
 * 去除 HTML 标签，返回纯文本（用于估算描述字数）
 * @param html 含 HTML 标签的字符串
 * @returns 纯文本
 */
function stripHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

/**
 * 判断字符串是否为空（包括空白字符、占位符）
 * @param value 待检测的值
 * @returns 是否为空
 */
function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return true
    // 占位符视为空
    const placeholders = [
      '学校',
      '专业',
      '学历层次',
      '时间范围',
      '公司名称',
      '岗位名称',
      '所在部门',
      '项目名称',
      '担任角色',
      'GitHub/GitLab地址',
    ]
    return placeholders.includes(trimmed)
  }
  return false
}

/**
 * 校验邮箱格式
 * @param email 邮箱字符串
 * @returns 是否合法
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * 校验手机号格式（中国大陆）
 * @param phone 手机号字符串
 * @returns 是否合法
 */
function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone.replace(/[\s-]/g, ''))
}

/**
 * 统计字段填写情况，返回完成度
 * @param fields 字段值数组
 * @returns { filledCount, totalCount, completeness }
 */
function calcCompleteness(fields: unknown[]): {
  filledCount: number
  totalCount: number
  completeness: number
} {
  const totalCount = fields.length
  const filledCount = fields.filter(v => !isEmpty(v)).length
  const completeness =
    totalCount === 0 ? 0 : Math.round((filledCount / totalCount) * 100)
  return { filledCount, totalCount, completeness }
}

/**
 * 分析基本信息模块
 * @param resume 简历对象
 * @returns 基本信息模块分析结果
 */
function analyzeBasic(resume: Resume): SectionAnalysis {
  const issues: AnalysisIssue[] = []
  const b = resume.basic

  // 必填字段检测
  if (isEmpty(b.name)) {
    issues.push({ level: 'error', message: '姓名未填写', sectionId: 'basic' })
  }
  if (isEmpty(b.position)) {
    issues.push({
      level: 'warning',
      message: '求职职位未填写，HR难以快速定位你的求职方向',
      sectionId: 'basic',
    })
  }
  if (isEmpty(b.phone)) {
    issues.push({
      level: 'error',
      message: '联系电话未填写',
      sectionId: 'basic',
    })
  } else if (!isValidPhone(b.phone)) {
    issues.push({
      level: 'warning',
      message: '联系电话格式不规范（建议为 11 位手机号）',
      sectionId: 'basic',
    })
  }
  if (isEmpty(b.email)) {
    issues.push({
      level: 'warning',
      message: '电子邮箱未填写',
      sectionId: 'basic',
    })
  } else if (!isValidEmail(b.email)) {
    issues.push({
      level: 'warning',
      message: '电子邮箱格式不正确',
      sectionId: 'basic',
    })
  }
  if (isEmpty(b.address)) {
    issues.push({
      level: 'info',
      message: '所在城市未填写，建议补充方便 HR 评估异地求职',
      sectionId: 'basic',
    })
  }
  if (isEmpty(b.photo)) {
    issues.push({
      level: 'info',
      message: '未上传证件照，部分岗位建议添加以提升印象',
      sectionId: 'basic',
    })
  }

  const fields = [b.name, b.position, b.phone, b.email, b.address, b.photo]
  const { filledCount, totalCount, completeness } = calcCompleteness(fields)

  return {
    id: 'basic',
    title: '基本信息',
    completeness,
    filledCount,
    totalCount,
    issues,
  }
}

/**
 * 分析教育经历模块
 * @param resume 简历对象
 * @returns 教育经历模块分析结果
 */
function analyzeEducation(resume: Resume): SectionAnalysis {
  const issues: AnalysisIssue[] = []
  const list = resume.educations || []

  if (list.length === 0) {
    issues.push({
      level: 'error',
      message: '尚未添加教育经历，这是简历的核心模块',
      sectionId: 'education',
    })
    return {
      id: 'education',
      title: '教育经历',
      completeness: 0,
      filledCount: 0,
      totalCount: 5,
      issues,
    }
  }

  let totalFields = 0
  let filledFields = 0

  list.forEach((edu, idx) => {
    const fields = [edu.school, edu.major, edu.degree, edu.dateRange]
    fields.forEach((f, i) => {
      totalFields++
      if (!isEmpty(f)) filledFields++
      else {
        const labels = ['学校名称', '就读专业', '学历层次', '时间范围']
        issues.push({
          level: 'warning',
          message: `教育经历第 ${idx + 1} 条的「${labels[i]}」未填写`,
          sectionId: 'education',
        })
      }
    })

    // 描述建议
    const descText = stripHtml(edu.description)
    if (!descText) {
      issues.push({
        level: 'info',
        message: `教育经历第 ${idx + 1} 条缺少自定义描述，可补充 GPA、主修课程等`,
        sectionId: 'education',
      })
    }
  })

  const completeness =
    totalFields === 0 ? 0 : Math.round((filledFields / totalFields) * 100)

  return {
    id: 'education',
    title: '教育经历',
    completeness,
    filledCount: filledFields,
    totalCount: totalFields,
    issues,
  }
}

/**
 * 分析实习经历模块
 * @param resume 简历对象
 * @returns 实习经历模块分析结果
 */
function analyzeInternship(resume: Resume): SectionAnalysis {
  const issues: AnalysisIssue[] = []
  const list = resume.internships || []

  if (list.length === 0) {
    issues.push({
      level: 'warning',
      message: '尚未添加实习经历，应届生建议至少补充 1 段实习',
      sectionId: 'internship',
    })
    return {
      id: 'internship',
      title: '实习经历',
      completeness: 0,
      filledCount: 0,
      totalCount: 4,
      issues,
    }
  }

  let totalFields = 0
  let filledFields = 0

  list.forEach((intern, idx) => {
    const fields = [intern.companyName, intern.position, intern.dateRange]
    fields.forEach((f, i) => {
      totalFields++
      if (!isEmpty(f)) filledFields++
      else {
        const labels = ['公司名称', '岗位名称', '时间范围']
        issues.push({
          level: 'warning',
          message: `实习经历第 ${idx + 1} 条的「${labels[i]}」未填写`,
          sectionId: 'internship',
        })
      }
    })

    // 部门可选
    totalFields++
    if (!isEmpty(intern.department)) filledFields++

    // 描述字数检测
    const descText = stripHtml(intern.description)
    if (!descText) {
      issues.push({
        level: 'error',
        message: `实习经历第 ${idx + 1} 条缺少描述，请补充工作内容与成果`,
        sectionId: 'internship',
      })
    } else if (descText.length < 30) {
      issues.push({
        level: 'warning',
        message: `实习经历第 ${idx + 1} 条描述较短（${descText.length} 字），建议详细说明职责与业绩`,
        sectionId: 'internship',
      })
    }
  })

  const completeness =
    totalFields === 0 ? 0 : Math.round((filledFields / totalFields) * 100)

  return {
    id: 'internship',
    title: '实习经历',
    completeness,
    filledCount: filledFields,
    totalCount: totalFields,
    issues,
  }
}

/**
 * 分析项目经历模块
 * @param resume 简历对象
 * @returns 项目经历模块分析结果
 */
function analyzeProject(resume: Resume): SectionAnalysis {
  const issues: AnalysisIssue[] = []
  const list = resume.projects || []

  if (list.length === 0) {
    issues.push({
      level: 'warning',
      message: '尚未添加项目经历，技术岗建议至少补充 1-2 个项目',
      sectionId: 'project',
    })
    return {
      id: 'project',
      title: '项目经历',
      completeness: 0,
      filledCount: 0,
      totalCount: 4,
      issues,
    }
  }

  let totalFields = 0
  let filledFields = 0

  list.forEach((proj, idx) => {
    const fields = [proj.name, proj.role, proj.dateRange]
    fields.forEach((f, i) => {
      totalFields++
      if (!isEmpty(f)) filledFields++
      else {
        const labels = ['项目名称', '担任角色', '时间范围']
        issues.push({
          level: 'warning',
          message: `项目经历第 ${idx + 1} 条的「${labels[i]}」未填写`,
          sectionId: 'project',
        })
      }
    })

    // git 地址可选
    totalFields++
    if (!isEmpty(proj.gitAddress)) filledFields++
    else {
      issues.push({
        level: 'info',
        message: `项目经历第 ${idx + 1} 条未填写 GitHub/GitLab 地址，技术岗建议补充`,
        sectionId: 'project',
      })
    }

    // 描述字数检测
    const descText = stripHtml(proj.description)
    if (!descText) {
      issues.push({
        level: 'error',
        message: `项目经历第 ${idx + 1} 条缺少描述，请补充项目背景、技术栈与个人贡献`,
        sectionId: 'project',
      })
    } else if (descText.length < 50) {
      issues.push({
        level: 'warning',
        message: `项目经历第 ${idx + 1} 条描述偏短（${descText.length} 字），建议采用 STAR 法则详细阐述`,
        sectionId: 'project',
      })
    }
  })

  const completeness =
    totalFields === 0 ? 0 : Math.round((filledFields / totalFields) * 100)

  return {
    id: 'project',
    title: '项目经历',
    completeness,
    filledCount: filledFields,
    totalCount: totalFields,
    issues,
  }
}

/**
 * 分析个人技能模块
 * @param resume 简历对象
 * @returns 个人技能模块分析结果
 */
function analyzeSkills(resume: Resume): SectionAnalysis {
  const issues: AnalysisIssue[] = []
  const skillsText = stripHtml(resume.skills || '')

  if (!skillsText) {
    issues.push({
      level: 'error',
      message: '个人技能未填写，请列出掌握的技术栈与工具',
      sectionId: 'skills',
    })
    return {
      id: 'skills',
      title: '个人技能',
      completeness: 0,
      filledCount: 0,
      totalCount: 1,
      issues,
    }
  }

  // 简单估算技能项数量（按行或顿号分隔）
  const skillCount = skillsText
    .split(/[\n、,，]/)
    .map(s => s.trim())
    .filter(Boolean).length

  let completeness = 100
  if (skillCount < 3) {
    issues.push({
      level: 'warning',
      message: `技能项较少（约 ${skillCount} 项），建议补充更多技能点`,
      sectionId: 'skills',
    })
    completeness = 60
  } else if (skillCount < 5) {
    issues.push({
      level: 'info',
      message: '建议按熟练度对技能分级（了解 / 熟悉 / 精通）',
      sectionId: 'skills',
    })
    completeness = 85
  }

  return {
    id: 'skills',
    title: '个人技能',
    completeness,
    filledCount: 1,
    totalCount: 1,
    issues,
  }
}

/**
 * 分析自定义模块
 * @param resume 简历对象
 * @returns 自定义模块分析结果数组
 */
function analyzeCustomModules(resume: Resume): SectionAnalysis[] {
  const results: SectionAnalysis[] = []
  const customData = resume.customData || {}

  Object.keys(customData).forEach(key => {
    const items = customData[key] || []
    const sectionMeta = resume.menuSections.find(s => s.id === key)
    const title = sectionMeta?.title || key
    const issues: AnalysisIssue[] = []

    if (items.length === 0) {
      issues.push({
        level: 'info',
        message: `自定义模块「${title}」暂无内容`,
        sectionId: key,
      })
      results.push({
        id: key,
        title,
        completeness: 0,
        filledCount: 0,
        totalCount: 1,
        issues,
      })
      return
    }

    let totalFields = 0
    let filledFields = 0

    items.forEach((item, idx) => {
      const fields = [item.title, item.subTitle, item.dateRange]
      fields.forEach((f, i) => {
        totalFields++
        if (!isEmpty(f)) filledFields++
        else if (i === 0) {
          // 只对标题缺失做提示
          issues.push({
            level: 'warning',
            message: `「${title}」第 ${idx + 1} 条标题未填写`,
            sectionId: key,
          })
        }
      })

      const descText = stripHtml(item.description)
      if (!descText) {
        issues.push({
          level: 'warning',
          message: `「${title}」第 ${idx + 1} 条缺少描述内容`,
          sectionId: key,
        })
      }
    })

    const completeness =
      totalFields === 0 ? 0 : Math.round((filledFields / totalFields) * 100)

    results.push({
      id: key,
      title,
      completeness,
      filledCount: filledFields,
      totalCount: totalFields,
      issues,
    })
  })

  return results
}

/**
 * 根据完成度计算评分等级
 * @param completeness 完成度 0-100
 * @returns 等级与说明
 */
function calcGrade(completeness: number): {
  grade: 'A' | 'B' | 'C' | 'D'
  gradeText: string
} {
  if (completeness >= 90) {
    return { grade: 'A', gradeText: '简历已较为完善，可以投递' }
  }
  if (completeness >= 75) {
    return { grade: 'B', gradeText: '简历基本完善，建议补全细节' }
  }
  if (completeness >= 50) {
    return { grade: 'C', gradeText: '简历存在较多缺失，建议完善后再投递' }
  }
  return { grade: 'D', gradeText: '简历信息严重不足，请尽快补充' }
}

/**
 * 各模块权重（用于计算总体完成度）
 */
const SECTION_WEIGHTS: Record<string, number> = {
  basic: 0.25,
  education: 0.2,
  internship: 0.2,
  project: 0.2,
  skills: 0.1,
  // custom 权重平分剩余
}

/**
 * 分析简历完整性，返回分析结果
 * @param resume 简历对象
 * @returns 简历分析结果
 */
export function analyzeResume(resume: Resume): ResumeAnalysisResult {
  const globalIssues: AnalysisIssue[] = []

  // 分析各模块
  const basic = analyzeBasic(resume)
  const education = analyzeEducation(resume)
  const internship = analyzeInternship(resume)
  const project = analyzeProject(resume)
  const skills = analyzeSkills(resume)
  const customs = analyzeCustomModules(resume)

  const sections = [basic, education, internship, project, skills, ...customs]

  // 计算总体完成度（按权重加权）
  let weightedSum = 0
  let weightTotal = 0

  const coreSections = { basic, education, internship, project, skills }
  Object.entries(SECTION_WEIGHTS).forEach(([id, weight]) => {
    const sec = coreSections[id as keyof typeof coreSections]
    weightedSum += sec.completeness * weight
    weightTotal += weight
  })

  // 自定义模块平分剩余权重
  if (customs.length > 0) {
    const remainWeight = Math.max(0, 1 - weightTotal)
    const perWeight = remainWeight / customs.length
    customs.forEach(c => {
      weightedSum += c.completeness * perWeight
    })
    weightTotal += remainWeight
  }

  const overallCompleteness =
    weightTotal === 0 ? 0 : Math.round(weightedSum / weightTotal)

  // 全局提示
  if (resume.title && resume.title.trim() === '') {
    globalIssues.push({
      level: 'info',
      message: '简历标题未填写，建议设置一个有辨识度的标题',
    })
  }

  // 检查模块是否启用
  const enabledSections = resume.menuSections.map(s => s.id)
  const coreMissing: Array<{ id: string; name: string }> = []
  if (!enabledSections.includes('education')) {
    coreMissing.push({ id: 'education', name: '教育经历' })
  }
  if (!enabledSections.includes('internship')) {
    coreMissing.push({ id: 'internship', name: '实习经历' })
  }
  if (!enabledSections.includes('project')) {
    coreMissing.push({ id: 'project', name: '项目经历' })
  }
  if (!enabledSections.includes('skills')) {
    coreMissing.push({ id: 'skills', name: '个人技能' })
  }
  coreMissing.forEach(m => {
    globalIssues.push({
      level: 'warning',
      message: `「${m.name}」模块未启用，可在「添加模块」中开启`,
      sectionId: m.id,
    })
  })

  const { grade, gradeText } = calcGrade(overallCompleteness)

  return {
    overallCompleteness,
    sections,
    globalIssues,
    grade,
    gradeText,
  }
}
