# Orange Resume

## 简介

Orange Resume 是一个基于 Vue 3 + TypeScript +
Vite 的在线简历编辑器。它专注于简历创建、实时编辑、模板预览与导出，支持多份简历管理和本地持久化存储。

项目采用
**Local-First（本地优先）架构**：IndexedDB 作为热数据层负责本地读写与离线可用，后端 MySQL 作为冷数据层负责云端持久化，写操作先落本地再异步同步上云，断网时操作进入同步队列，联网后自动回放。

## 核心功能

### 简历编辑

- 简历管理：创建、编辑、复制、删除多份简历
- 模块化编辑：支持基本信息、教育经历、实习经历、项目经历、技能展示等常见模块
- 自定义模块：支持新增自定义简历模块，灵活扩展内容
- 实时预览：在编辑过程中同步显示简历预览效果
- 主题定制：调整字体、行高、间距、页边距、主题色等全局样式
- 模块排序：通过拖拽调整内容模块顺序
- PDF 导出：将简历导出为可打印的 PDF 格式
- 富文本编辑：集成富文本编辑器，支持技能与自我介绍内容的富文本展示

### 账号与云同步

- 用户认证：登录 / 注册，Token 失效自动清理并跳转登录页
- 本地优先：简历数据优先写入 IndexedDB，保证编辑流畅与离线可用
- 云端同步：写操作异步入队，按 FIFO 顺序回放到后端，失败自动重试
- 离线兜底：断网时操作存入 IndexedDB 同步队列，联网后自动补传
- 同步状态提示：实时展示已同步 / 同步中 / 待同步 / 离线 / 失败等状态

### AI 智能工具

- AI 配置管理：支持配置多个模型服务商与密钥，并可测试连通性
- 语法检查：对简历内容进行 AI 语法纠错
- 简历评分：AI 从多个维度为简历打分并给出改进建议
- 岗位匹配：结合目标岗位 JD 分析简历匹配度
- PDF 转简历：解析 PDF 文本自动生成结构化简历

### AI 模拟面试

- 基于所选简历与目标岗位（可选填 JD、难度、题量、题型）生成面试会话
- 面试间独立页面，AI 面试题与评价均通过 SSE 流式输出，逐题追问
- 面试结束后批量生成逐题评价与面试总结
- 支持查看历史面试记录与面试详情，可删除会话

## 目录结构

- `src/views/my-resume`：我的简历列表页面
- `src/views/edit-resume`：简历编辑页面及编辑器组件
- `src/views/template`：简历模板选择页面
- `src/views/AI-simulation-interview`：AI 模拟面试配置页（选择简历与岗位）
- `src/views/interview-room`：面试间页面（SSE 流式面试会话）
- `src/views/auth`：登录 / 注册页面
- `src/views/setting`：通用设置页面
- `src/api`：后端 HTTP 接口封装（简历、认证、AI、面试）
- `src/service`：数据层（IndexedDB 存储、Repository、同步队列）
  - `resumeIDB.ts`：简历 IndexedDB 存储实现
  - `resumeRepository.ts`：统一数据访问层，屏蔽本地与云端细节
  - `syncQueue.ts`：离线操作同步队列（FIFO 回放 + 重试上限）
  - `fileIDB.ts`：文件类 IndexedDB 存储
- `src/stores`：全局状态管理（认证、面试会话、同步状态、主题）
- `src/template`：简历模板实现
- `src/utils`：导出、打印、存储、样式等工具函数
- `src/hooks`：通用组合式函数
- `src/layout`：整体布局组件

## 技术栈

- Vue 3 + Composition API
- TypeScript
- Vite 7
- Pinia（持久化插件 pinia-plugin-persistedstate）
- Vue Router 4
- Ant Design Vue 4.x
- Axios
- IndexedDB 本地存储（Local-First 热数据层）
- OpenAI SDK（AI 能力，经后端代理调用）
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

### 后端联调

前端通过 Vite 代理将 `/api` 前缀的请求转发到本地 NestJS 后端（默认
`http://localhost:3000`），避免跨域：

- 后端地址可在 `vite.config.ts` 的 `server.proxy` 中修改
- API 基础地址通过 `.env.development` 中的 `VITE_API_BASE_URL=/api` 配置
- 登录、云同步与 AI 能力依赖后端服务，未启动后端时本地简历编辑功能不受影响

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

- `/login`：登录 / 注册
- `/my-resume`：简历列表与管理
- `/edit-resume/:id`：简历编辑与实时预览
- `/template`：模板选择与切换
- `/ai-interview`：AI 模拟面试配置
- `/interview-room`：AI 面试间（流式面试会话）
- `/setting`：全局设置与导入导出

## 重要说明

1. **数据分层**：简历数据优先保存在浏览器 IndexedDB 中，关闭页面后仍可恢复；登录后异步同步到云端。
2. **冲突策略**：本地与云端版本通过 `updatedAt`
   时间戳进行冲突裁决，保证多端数据一致。
3. **离线可用**：断网时编辑不中断，操作进入同步队列，联网后按顺序自动回放。
4. **ID 一致性**：简历 ID 由前端生成并传递给后端，确保本地与云端主键一致，增删改查均基于同一 ID。
5. **AI 能力**：AI 相关功能需在设置中配置模型服务商与密钥，请求经后端代理转发。
6. **导出功能**：通过 PDF 生成模块实现，适合保存与打印。
