export interface Resume {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  basic: Basic
  educations: Education[]
  internships: Internship[]
  projects: Project[]
  skills: string
  customData: Record<string, CustomData[]>
  globalConfiguration: GlobalConfiguration
  menuSections: MenuSection[]
}

export interface GlobalConfiguration {
  baseFontSize: number // 基础字体大小
  basePagePadding: number // 基础页面内边距
  baseLineHeight: number // 基础行高
  baseModuleSpacing: number // 基础模块间距
  paragraphSpacing: number // 段落间距
  titleFontSize: number // 标题字体大小
  subTitleFontSize: number // 子标题字体大小
  themeColor: string // 主题颜色
}

export interface Basic {
  name: string
  position: string
  age: number
  phone: string
  address: string
  email: string
  photo: string
}

export interface Education {
  id: string
  school: string
  major: string
  degree: string
  dateRange: string
  visible: boolean
  gpa: string
  description: string
}

export interface Internship {
  id: string
  companyName: string
  position: string
  department: string
  dateRange: string
  description: string
  visible: boolean
}

export interface Project {
  id: string
  name: string
  role: string
  gitAddress: string
  dateRange: string
  visible: boolean
  description: string
}

export interface CustomData {
  id: string
  title: string
  dateRange: string
  subTitle: string
  visible: boolean
  description: string
}

export interface MenuSection {
  id: string
  title: string
  order: string
}

export type Skill = string
