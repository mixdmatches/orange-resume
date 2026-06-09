# Orange Resume

## 简介

Orange Resume 是一个基于 Vue 3 + TypeScript +
Vite 的在线简历编辑器。它专注于简历创建、实时编辑、模板预览与导出，支持多份简历管理和本地持久化存储。

## 核心功能

- 简历管理：创建、编辑、复制、删除多份简历
- 模块化编辑：支持基本信息、教育经历、实习经历、项目经历、技能展示等常见模块
- 自定义模块：支持新增自定义简历模块，灵活扩展内容
- 实时预览：在编辑过程中同步显示简历预览效果
- 主题定制：调整字体、行高、间距、页边距、主题色等全局样式
- 模块排序：通过拖拽调整内容模块顺序
- PDF 导出：将简历导出为可打印的 PDF 格式
- 本地存储：使用 IndexedDB 保存简历数据，支持持久化与配置备份
- 富文本编辑：集成富文本编辑器，支持技能与自我介绍内容的富文本展示

## 目录结构

- `src/views/edit-resume`：简历编辑页面及编辑器组件
- `src/views/my-resume`：我的简历列表页面
- `src/views/template`：简历模板选择页面
- `src/views/AI-simulation-interview`：AI 模拟面试页面
- `src/views/setting`：通用设置页面
- `src/stores`：全局状态管理逻辑
- `src/service`：IndexedDB 数据存储服务
- `src/template`：简历模板实现
- `src/utils`：导出、打印、存储、样式等工具函数

## 技术栈

- Vue 3 + Composition API
- TypeScript
- Vite 7
- Ant Design Vue 4.x
- Vue Router 4
- IndexedDB 本地存储
- SCSS
- ESLint + Prettier

## 项目截图

我的简历： ![alt text](/public/image.png)
简历编辑：![alt text](/public/editResume.png)
模板中心：![alt text](/public/template.png)
预览模板：![alt text](/public/viewTemplate.png)
模拟面试：![alt text](/public/interview.png)
通用设置：![alt text](/public/setting.png)

## 快速运行

### 环境要求

- Node.js >= 18
- pnpm >= 8

### 安装依赖

```bash
pnpm install
```

### 启动开发环境

```bash
pnpm dev
```

打开浏览器访问：`http://localhost:5173`

### 打包发布

```bash
pnpm build
```

### 本地预览

```bash
pnpm preview
```

## 代码检查与格式化

```bash
pnpm lint
pnpm lint:fix
pnpm format
```

## 主要页面路由

- `/my-resume`：简历列表与管理
- `/edit-resume/:id`：简历编辑与实时预览
- `/template`：模板选择与切换
- `/ai-interview`：AI 模拟面试
- `/setting`：全局设置与导入导出

## 重要说明

1. 简历数据保存在浏览器 IndexedDB 中，关闭页面后仍可恢复。
2. 样式可通过项目内主题配置快速切换，适配不同简历视觉效果。
3. 导出功能通过 PDF 生成模块实现，适合保存与打印。
4. 编辑器针对简历常见模块进行了可视化支持，便于快速构建标准化简历。
