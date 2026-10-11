# Orange Resume

## 简介

Orange Resume 是一个基于 Vue 3 + TypeScript +
Vite 的在线简历编辑器。它专注于简历创建、实时编辑、模板预览与导出，支持多份简历管理。

项目采用
**Local-First（本地优先）架构**：IndexedDB 作为热数据层负责本地读写，后端 MySQL 作为冷数据层负责云端持久化，写操作先落本地再异步同步上云，断网时操作进入同步队列，联网后自动回放。

## 核心功能

### 简历编辑

- 简历管理：创建、编辑、删除多份简历, 支持pdf、json格式的简历导入
- 模块化编辑：支持基本信息、教育经历、实习经历、项目经历、技能展示等常见模块
- 自定义模块：支持新增自定义简历模块，灵活扩展内容
- 实时预览：在编辑过程中同步显示简历预览效果
- 主题定制：调整字体、行高、间距、页边距、主题色等全局样式
- 模块排序：通过拖拽调整内容模块顺序
- PDF 导出：基于浏览器打印能力将简历导出为可打印的 PDF
- 富文本编辑：集成 AiEditor 富文本编辑器
- AI 编辑助手：编辑页内置多轮对话助手，基于会话的 SSE 流式回复

### 账号与云同步

- 用户认证：登录 / 注册，双 Token 机制自动续期，失效自动清理并跳转登录页
- 账号注销：支持注销账号，完整清理本地数据
- 本地优先：简历数据优先写入 IndexedDB，保证编辑流畅与离线可用
- 云端同步：写操作异步入队，按 FIFO 顺序回放到后端，失败自动重试
- 断网兜底：断网时操作存入 IndexedDB 同步队列，联网后自动补传
- 同步状态提示：实时展示已同步 / 同步中 / 待同步 / 离线 / 失败等状态
- 多账号隔离：退出登录 / 注销时清空本机简历缓存，避免切换账号后数据串号

### AI 智能工具

- AI 配置管理：在个人中心配置多个模型服务商与密钥，并可测试连通性
- 语法检查：对简历内容进行 AI 语法纠错
- 简历评分：AI 从多个维度为简历打分并给出改进建议
- 岗位匹配：结合目标岗位 JD 分析简历匹配度
- PDF 转简历：解析 PDF 文本自动生成结构化简历

### AI 模拟面试

- 基于所选简历与目标岗位（可选填 JD、难度、题量、题型）生成面试会话
- 面试间独立页面，AI 面试题与评价均通过 SSE 流式输出，逐题追问
- 面试结束后批量生成逐题评价与面试总结
- 个人中心支持查看历史面试记录与面试详情，可删除会话

## 目录结构

- `src/views/landing`：营销主页（未登录可访问）
- `src/views/my-resume`：我的简历列表页面
- `src/views/edit-resume`：简历编辑页面及编辑器组件
- `src/views/template`：简历模板选择页面
- `src/views/profile`：个人中心（AI 服务商配置、历史面试记录、账号与安全）
- `src/views/AI-simulation-interview`：AI 模拟面试配置页（选择简历与岗位）
- `src/views/interview-room`：面试间页面（SSE 流式面试会话）
- `src/views/auth`：登录 / 注册页面
- `src/api`：后端 HTTP 接口封装
- `src/service`：数据层（IndexedDB 存储、Repository、同步队列）
  - `resumeIDB.ts`：简历 IndexedDB 存储实现
  - `resumeRepository.ts`：统一数据访问层，屏蔽本地与云端细节
  - `syncQueue.ts`：离线操作同步队列（FIFO 回放 + 重试上限）
- `src/stores`：全局状态管理（认证、面试会话、同步状态、主题）
- `src/template`：简历模板实现
- `src/utils`：导出、打印、存储、样式等工具函数
- `src/hooks`：通用组合式函数
- `src/layout`：整体布局组件

## 技术栈

- Vue 3 + Composition API
- TypeScript
- Vite 7
- Pinia
- Vue Router
- Axios
- IndexedDB 本地存储（Local-First 热数据层）
- 后端服务：NestJS + MySQL（独立服务，开发时经 Vite 代理联调）
