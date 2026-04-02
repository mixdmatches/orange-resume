import type { Dayjs } from 'dayjs'
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
  dateRange: [Dayjs, Dayjs] | string
  visible: boolean
  gpa: string
  description: string
}

export interface Internship {
  id: string
  companyName: string
  position: string
  department: string
  dateRange: [Dayjs, Dayjs] | []
  description: string
  visible: boolean
}

export interface Project {
  id: string
  name: string
  role: string
  gitAddress: string
  dateRange: [Dayjs, Dayjs] | []
  startDate?: string
  endDate?: string
  visible: boolean
  description: string
}

export type Skill = string
