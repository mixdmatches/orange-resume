/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
export interface FieldConfig {
  prop: string // 字段名
  label: string // 字段标签
  type?: 'input' | 'textarea' | 'select' | 'editor' | 'date' | 'img' // 字段类型
  placeholder?: string // 占位符
  options?: string[] // 下拉选项（仅 select 类型）
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
  editableTitle?: boolean // 标题是否可编辑（自定义模块用）
  addText?: string // 添加按钮文本
  entryTitleProp?: string // 条目摘要字段名（条目头显示的标题取该字段值）
  sortable?: boolean // 条目是否支持拖拽排序
}

export interface ResumeFormEmits {
  (e: 'add'): void // 添加事件
  (e: 'delete', id: string): void // 删除事件
  (e: 'deleteModel'): void // 删除模块事件
  (e: 'hide', id: string): void // 隐藏事件
  (e: 'titleChange', title: string): void // 标题编辑事件
  (e: 'changeHideImg'): void // 隐藏img事件
}
