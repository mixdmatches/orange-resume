import type { Resume } from '@/types/resume'

// 初始全局设置
export const initialGlobalConfiguration = {
  baseFontSize: 14, // 基础字体大小
  basePagePadding: 20, // 基础页面内边距
  baseLineHeight: 1.5, // 基础行高
  baseModuleSpacing: 10, // 基础模块间距
  paragraphSpacing: 10, // 段落间距
  titleFontSize: 16, // 标题字体大小
  subTitleFontSize: 14, // 子标题字体大小
  themeColor: '#111827', // 主题颜色
  autoOnePage: false, // 自动适配一页纸
}

// 初始默认简历内容
export const DEFAULT_RESUME: Omit<Resume, 'id'> = {
  templateId: 'classic',
  title: '未命名简历',
  createdAt: Date.now(),
  updatedAt: null,
  basic: {
    name: '陈下饭',
    position: '前端开发工程师',
    age: 20,
    phone: '17311002299',
    address: '南京',
    email: 'zhangsan@example.com',
    photo: '',
  },
  educations: [
    {
      id: '1',
      school: '清华大学',
      major: '软件工程',
      degree: '本科',
      dateRange: '2023-09-01 - 2027-06-30',
      visible: true,
      gpa: '',
      description: `<ul>
  <li>
    <p>综合绩点：3.8/4.0，专业前15%</p>
  </li>
  <li>
    <p>主修课程：Web前端开发（92）、数据结构（88）、数据库设计（90）、人机交互（89）</p>
  </li>
  <li>
    <p>连续两年获得校二等奖学金</p>
  </li>
  <li>
    <p>2024 校极客杯网页设计大赛 一等奖</p>
  </li>
</ul>
`,
    },
  ],
  skills: `
  <ul>
  <li>
    <p>语言基础：熟练掌握 HTML5/CSS3，JavaScript (ES6+)，TypeScript</p>
  </li>
  <li>
    <p>框架与库：React (Hooks, Router, Redux Toolkit)，Vue3 (基础使用)，Next.js (SSG/SSR
      了解)</p>
  </li>
  <li>
    <p>样式工具：TailwindCSS，Sass，Ant Design，Element Plus</p>
  </li>
  <li>
    <p>工程化/工具：Webpack，Vite，Git，ESLint，Prettier，Yarn/npm</p>
  </li>
  <li>
    <p>后端/其他：Node.js (Express 简单搭建)，RESTful API 调用，MySQL 基础</p>
  </li>
  <li>
    <p>开发环境：VS Code，Chrome DevTools，Postman，Figma（协作）</p>
  </li>
</ul>

  `,
  projects: [
    {
      id: '1',
      name: '校园助手',
      role: '前端开发',
      gitAddress: 'github.com',
      dateRange: '2023-07-01 - 2024-06-30',
      visible: true,
      description: `
      <p><strong>技术栈：</strong> React + Taro + TailwindCSS + 小程序云开发</p>
<ul>
  <li>
    <p>独立完成小程序前端界面设计与交互，包括周课表展示、按节次筛选空教室、考试倒计时三大模块。</p>
  </li>
  <li>
    <p>利用云函数爬取学校教务系统公开课表数据，进行清洗与缓存，实现课程实时同步与离线数据降级展示。</p>
  </li>
  <li>
    <p>使用 Taro UI + 自定义日历组件，支持周/日视图切换；数据存储采用本地缓存 + 云数据库双写。</p>
  </li>
  <li>
    <p>小程序累计被 600+ 本校同学使用，并完成两轮用户体验迭代（评分 4.8/5）。</p>
  </li>
</ul>

      `,
    },
    {
      id: '2',
      name: '技术笔记系统',
      role: '前端开发',
      gitAddress: 'github.com',
      dateRange: '2024-07-01 - 2025-06-30',
      visible: true,
      description: `
      <p><strong>技术栈：</strong> Next.js + MDX + TailwindCSS + Vercel</p>
<p>搭建轻量级静态博客站，支持 Markdown/MDX 渲染、代码高亮、暗色主题切换。</p>
<ul>
  <li>
    <p>自定义文章目录生成、评论模块（基于 Giscus），以及标签分类聚合页面。</p>
  </li>
  <li>
    <p>通过 Next.js 的 SSG 生成超 30 篇前端学习笔记与项目复盘文章，月均访问量约 500 PV。</p>
  </li>
  <li>
    <p>引入 ESLint + Husky 规范 Git 提交，提高代码质量。</p>
  </li>
</ul>
      `,
    },
  ],
  internships: [
    {
      id: '1',
      companyName: '字节跳动',
      position: '前端开发工程师',
      department: '',
      dateRange: '2024-07-01 - 2025-06-30',
      visible: true,
      description: `
      <ul>
  <li>
    <p>协助开发低代码表单生成器的迭代工作，负责维护 Form Render 组件，支持 JSON Schema
      动态渲染输入控件（输入框、下拉框、日期选择器等），提升了活动页表单配置效率。</p>
  </li>
  <li>
    <p>基于 Vue3 + Element Plus 完成 3 个内部运营工具页面的迁移，实现组件懒加载，首屏加载时间减少约 15%。</p>
  </li>
  <li>
    <p>参与设计系统的基础布局组件与动态路由权限控制（路由守卫 + 角色权限），为后续权限扩展打下基础。</p>
  </li>
</ul>
      `,
    },
  ],
  customData: {},
  menuSections: [
    {
      id: 'basic',
      title: '基本信息',
      order: '1',
    },
    {
      id: 'education',
      title: '教育经历',
      order: '2',
    },
    {
      id: 'internship',
      title: '实习经历',
      order: '3',
    },
    {
      id: 'project',
      title: '项目经历',
      order: '4',
    },
    {
      id: 'skills',
      title: '个人技能',
      order: '5',
    },
  ],
  globalConfiguration: initialGlobalConfiguration,
}
