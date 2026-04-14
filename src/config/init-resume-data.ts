import type { Resume } from '@/types/resume'
import dayjs from 'dayjs'

// 初始全局设置
export const initialGlobalConfiguration = {
  baseFontSize: 16, // 基础字体大小
  basePagePadding: 10, // 基础页面内边距
  baseLineHeight: 1.5, // 基础行高
  baseModuleSpacing: 10, // 基础模块间距
  paragraphSpacing: 10, // 段落间距
  titleFontSize: 20, // 标题字体大小
  subTitleFontSize: 18, // 子标题字体大小
  themeColor: '#111827', // 主题颜色
}

// 初始默认简历内容
export const DEFAULT_RESUME: Omit<Resume, 'id'> = {
  title: '未命名简历',
  createdAt: dayjs().unix(),
  updatedAt: dayjs().unix(),
  basic: {
    name: '陈下饭',
    position: '前端开发工程师',
    age: 20,
    phone: '17343691959',
    address: '南京',
    email: '1919600547@qq.com',
    photo: '',
  },
  educations: [
    {
      id: '1',
      school: '清华大学',
      major: '软件工程',
      degree: '本科',
      dateRange: '2018-09-01 - 2022-06-30',
      visible: true,
      gpa: '',
      description: `主修课程：数据结构、算法设计、操作系统、计算机网络、Web开发技术



专业排名前 5%，连续三年获得一等奖学金



担任计算机协会技术部部长，组织多次技术分享会



参与开源项目贡献，获得 GitHub Campus Expert 认证`,
    },
  ],
  skills: `



前端框架：熟悉 React、Vue.js，熟悉 Next.js、Nuxt.js 等 SSR 框架



开发语言：TypeScript、JavaScript(ES6+)、HTML5、CSS3



UI/样式：熟悉 TailwindCSS、Sass/Less、CSS Module、Styled-components



状态管理：Redux、Vuex、Zustand、Jotai、React Query



工程化工具：Webpack、Vite、Rollup、Babel、ESLint



测试工具：Jest、React Testing Library、Cypress



性能优化：熟悉浏览器渲染原理、性能指标监控、代码分割、懒加载等优化技术



版本控制：Git、SVN



技术管理：具备团队管理经验，主导过多个大型项目的技术选型和架构设计`,
  projects: [
    {
      id: '1',
      name: '中后台管理系统',
      role: '前端开发工程师',
      gitAddress: 'github.com',
      dateRange: '2022-07-01 - 2023-06-30',
      visible: true,
      description: `



基于 React 开发的创作者数据分析和内容管理平台，服务百万级创作者群体



包含数据分析、内容管理、收益管理等多个子系统



使用 Redux 进行状态管理，实现复杂数据流的高效处理



采用 Ant Design 组件库，确保界面设计的一致性和用户体验



实施代码分割和懒加载策略，优化大规模应用的加载性能`,
    },
  ],
  internships: [
    {
      id: '1',
      companyName: '字节跳动',
      position: '前端开发工程师',
      department: '研发部',
      dateRange: '2023-07-01 - 2024-06-30',
      visible: true,
      description: `



负责抖音创作者平台的开发与维护，主导多个核心功能的技术方案设计



优化项目工程化配置，将构建时间从 8 分钟优化至 2 分钟，提升团队开发效率



设计并实现组件库，提升代码复用率达 70%，显著减少开发时间



主导性能优化项目，使平台首屏加载时间减少 50%，接入 APM 监控系统



指导初级工程师，组织技术分享会，提升团队整体技术水平`,
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
