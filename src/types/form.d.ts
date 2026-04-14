/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
export interface FieldConfig {
  prop: string // 字段名
  label: string // 字段标签
  type?: 'input' | 'textarea' | 'select' | 'editor' | 'date' // 字段类型
  placeholder?: string // 占位符
  options?: string[] // 下拉选项（仅 select 类型）
  span?: number // 占用列数，默认 12
  style?: string // 样式
}

export interface ResumeFormProps {
  title: string // 表单标题
  items?: any[] // 表单数据项数组
  fields: FieldConfig[] // 字段配置
  showExpand?: boolean // 是否显示展开/收起
  showDelete?: boolean // 是否显示删除按钮
  showEye?: boolean // 是否显示隐藏按钮
  showTitleEye?: boolean // 是否显示标题隐藏按钮
  showAdd?: boolean // 是否显示添加按钮
  showActions?: boolean // 是否显示操作按钮
  showSort?: boolean
  labelWidth?: string // 标签宽度
  addText?: string // 添加按钮文本
}

export interface ResumeFormEmits {
  (e: 'add'): void // 添加事件
  (e: 'delete', id: string): void // 删除事件
  (e: 'deleteModel'): void // 删除模块事件
  (e: 'hide', id: string): void // 隐藏事件
  (e: 'update', payload: { index: number; field: string; value: any }): void // 更新事件
}
