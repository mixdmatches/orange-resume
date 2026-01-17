import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useResumeData = defineStore('resumeData', function () {
  const resume = ref({
    name: '陈秋萍',
    title: '前端开发实习生',
    contact: {
      phone: '17343691959',
      email: '1919600547@qq.com',
      location: '江苏扬州',
    },
    education: [
      {
        school: '扬州大学广陵学院',
        degree: '软件工程 · 本科',
        period: '2019.09 - 2023.06',
        highlights: [
          '主修课程：数据结构、操作系统、Android 开发',
          '奖项：第16届蓝桥杯省二等奖、第10届高校大赛二等奖',
        ],
      },
    ],
    internships: [
      {
        company: '江苏健康无忧网络科技有限公司',
        title: '前端开发实习生',
        period: '2023.03 - 2023.10',
        bullets: [
          '负责南京本地医保系统的移动端重构，统一 ESLint 规范并修复 20+ bug。',
          '自研 Vue 组件库沉淀常用表单、弹窗等业务场景，服务 6 个在研项目。',
          '配合后端完成患者管理模块的数据可视化大屏，构建率提升 35%。',
        ],
      },
    ],
    projects: [
      {
        name: 'FanUI 组件库',
        link: 'https://github.com/mixdmatches/FanUI',
        stack: 'TypeScript · Vue3 · Vite · Sass',
        summary:
          'FanUI 是一款轻量 TypeScript 组件库，目前已支持 25+ 组件，接入 VitePress 文档与 Storybook 演示。',
        bullets: [
          '封装 Input/Radio/Checkbox 等表单组件，提供异步校验能力。',
          '构建主题 Token 体系及代码生成工具，支持暗色模式与多品牌主题。',
          '完成 Loading 动画、图标管理及打包脚本，发布 npm 包供团队复用。',
        ],
      },
    ],
    skills: [
      'Vue3/Vite/Pinia',
      'TypeScript/ESLint',
      'Sass/UnoCSS',
      'Ant Design Vue',
      'Node.js/Express',
      'Git/GitHub Actions',
    ],
  })
  const basic = ref({
    name: '下饭',
    position: '前端开发工程师',
    age: 20,
    phone: '1234567',
    address: '南京',
    email: '1919600547@qq.com',
    photo: '',
  })

  function setBasic(newBasic: typeof basic.value) {
    basic.value = newBasic
  }
  return {
    resume,
    basic,
    setBasic,
  }
})
