# Orange Resume - 在线简历编辑器

一个基于 Vue 3 + TypeScript + Vite 构建的现代化在线简历编辑器，支持简历创建、编辑、预览和导出功能。

## 功能特性

- **简历管理**：创建、编辑、删除多份简历
- **模块化编辑**：支持基本信息、教育经历、实习经历、项目经历、个人技能等模块
- **自定义模块**：支持添加自定义简历模块
- **实时预览**：编辑时实时预览简历效果
- **主题定制**：支持自定义主题颜色、字体大小、间距等样式
- **拖拽排序**：支持模块顺序拖拽调整
- **PDF 导出**：支持将简历导出为 PDF 文件
- **数据持久化**：使用 IndexedDB 本地存储简历数据
- **配置导入导出**：支持 JSON 格式的简历配置导入导出
- **富文本编辑**：集成 AiEditor 富文本编辑器

## 技术栈

- **前端框架**：Vue 3 (Composition API + `<script setup>`)
- **构建工具**：Vite 7
- **语言**：TypeScript
- **UI 组件库**：Ant Design Vue 4.x
- **状态管理**：Vue 3 provide/inject
- **路由**：Vue Router 4
- **富文本编辑器**：AiEditor
- **拖拽功能**：vue-draggable-plus
- **数据存储**：IndexedDB
- **样式**：SCSS
- **代码规范**：ESLint + Prettier

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

启动后访问：http://localhost:5173

### 构建生产版本

```bash
pnpm build
```

### 预览生产版本

```bash
pnpm preview
```

### 代码检查与格式化

```bash
# 检查代码规范
pnpm lint

# 自动修复代码规范问题
pnpm lint:fix

# 格式化代码
pnpm format
```

## 项目结构

```
src/
├── assets/              # 静态资源
│   ├── images/          # 图片资源
│   └── styles/          # 全局样式
│       ├── index.scss   # 样式入口
│       ├── reset.scss   # 样式重置
│       └── variables.scss # SCSS 变量
├── components/          # 公共组件
│   ├── AiEditor.vue     # 富文本编辑器组件
│   ├── DataCard.vue     # 通用表单卡片组件
│   ├── ResumeSection.vue # 简历模块预览组件
│   └── ThemeIcon.vue    # 主题图标组件
├── config/              # 配置文件
│   ├── default-template.ts # 默认模板配置
│   └── init-resume-data.ts # 初始简历数据
├── layout/              # 布局组件
│   ├── components/      # 布局子组件
│   │   ├── SideBar.vue  # 侧边栏
│   │   └── SiteHeader.vue # 顶部导航
│   └── index.vue        # 主布局
├── router/              # 路由配置
│   └── index.ts
├── service/             # 服务层
│   └── indexDB.ts       # IndexedDB 数据服务
├── stores/              # 状态管理
│   └── theme.ts         # 主题状态
├── types/               # TypeScript 类型定义
│   ├── form.d.ts        # 表单类型
│   └── resume.d.ts      # 简历类型
├── views/               # 页面组件
│   ├── AI-simulation-interview/ # AI 模拟面试
│   ├── custom-template/ # 自定义模板
│   ├── edit-resume/     # 简历编辑页
│   │   ├── cards/       # 编辑卡片组件
│   │   │   ├── BasicCard.vue
│   │   │   ├── CustomCard.vue
│   │   │   ├── EducationCard.vue
│   │   │   ├── InternshipCard.vue
│   │   │   ├── ProjectCard.vue
│   │   │   └── SkillsCard.vue
│   │   ├── components/  # 编辑页子组件
│   │   │   ├── EditContent.vue   # 编辑内容区
│   │   │   ├── ResumePreview.vue # 简历预览
│   │   │   └── ToolHead.vue      # 工具栏
│   │   └── index.vue    # 编辑页入口
│   ├── my-resume/       # 我的简历列表
│   ├── setting/         # 设置页
│   └── template/        # 模板中心
├── App.vue              # 根组件
└── main.ts              # 入口文件
```

## 核心功能说明

### 简历数据结构

简历数据采用 TypeScript 类型定义，主要包含以下模块：

- **basic**：基本信息（姓名、职位、年龄、电话、地址、邮箱、照片）
- **educations**：教育经历数组
- **internships**：实习经历数组
- **projects**：项目经历数组
- **skills**：个人技能（富文本）
- **customData**：自定义模块数据
- **menuSections**：菜单模块配置（id、标题、排序）
- **globalConfiguration**：全局样式配置（字体、间距、主题色等）

### 数据存储

使用 IndexedDB 进行本地数据存储，支持：

- 简历的增删改查
- 按创建时间排序
- 数据持久化

### 主题定制

支持以下样式配置：

- 基础字体大小（12-24px）
- 模块标题字体大小
- 子标题字体大小
- 行高（1-2）
- 页边距（0-50px）
- 模块间距（1-99px）
- 段落间距（1-99px）
- 主题颜色（预设颜色 + 自定义颜色选择器）

### 模块拖拽

使用 `vue-draggable-plus` 实现模块拖拽排序：

- 基本信息模块固定不参与拖拽
- 其他模块可自由拖拽调整顺序
- 拖拽后自动更新模块 order 字段

## 路由说明

| 路径 | 名称 | 说明 |
|------|------|------|
| `/my-resume` | 我的简历 | 简历列表管理页 |
| `/edit-resume/:id` | 编辑简历 | 简历编辑页 |
| `/template` | 模板中心 | 简历模板选择页 |
| `/ai-interview` | 模拟面试 | AI 模拟面试功能 |
| `/setting` | 通用设置 | 系统设置页 |

## 开发指南

### 添加新的简历模块

1. 在 `src/types/resume.d.ts` 中定义数据类型
2. 在 `src/views/edit-resume/cards/` 中创建编辑卡片组件
3. 在 `src/components/ResumeSection.vue` 中添加预览逻辑
4. 在 `src/config/init-resume-data.ts` 中添加默认数据
5. 在 `src/views/edit-resume/components/EditContent.vue` 中注册组件

### 自定义主题样式

主题样式使用 SCSS 变量和 `themify` mixin 实现：

```scss
// 使用主题变量
@include themify(
  (
    color: $text-color,
    background-color: $layout-bg-color,
  )
);
```

## 注意事项

- 简历数据存储在浏览器 IndexedDB 中，清除浏览器数据会导致数据丢失
- 建议定期使用"导入配置"功能备份简历数据
- PDF 导出功能使用浏览器打印功能，不同浏览器可能有差异

## 许可证

MIT
