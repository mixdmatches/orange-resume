<script setup lang="ts">
import { ref } from 'vue'
import type { Basic, Education, Internship, Project } from '@/types/userInfo'
import ToolHead from './components/ToolHead.vue'
import EditContent from '@/views/edit-resume/components/EditContent.vue'
import ResumePreview from '@/views/edit-resume/components/ResumePreview.vue'
import BasicCard from './cards/BasicCard.vue'
import EducationCard from './cards/EducationCard.vue'
import InternshipCard from './cards/InternshipCard.vue'
import ProjectCard from './cards/ProjectCard.vue'
import SkillsCard from './cards/SkillsCard.vue'
import dayjs from 'dayjs'

// 基础信息
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
const handleBasic = (newBasic: Basic) => {
  setBasic(newBasic)
}

// 教育信息
const educations = ref<Education[]>([
  {
    id: '1',
    school: '清华大学',
    major: '软件工程',
    degree: '本科',
    dateRange: [dayjs(), dayjs()],
    visible: true,
    gpa: '',
    description: `主修课程：数据结构、算法设计、操作系统、计算机网络、Web开发技术



专业排名前 5%，连续三年获得一等奖学金



担任计算机协会技术部部长，组织多次技术分享会



参与开源项目贡献，获得 GitHub Campus Expert 认证`,
  },
])
function setEducation(newValue: Education[]) {
  educations.value = newValue
}
const handleEducation = (newEducation: Education[]) => {
  setEducation(newEducation)
}

// 实习经历
const internships = ref<Internship[]>([
  {
    id: '1',
    companyName: '公司名称',
    position: '岗位名称',
    department: '部门',
    dateRange: [dayjs(), dayjs()],
    visible: true,
    description:
      '负责南京本地医保系统的移动端重构，统一 ESLint 规范并修复 20+ bug自研 Vue 组件库沉淀常用表单、弹窗等业务场景，服务 6 个在研项目。配合后端完成患者管理模块的数据可视化大屏，构建率提升 35%.',
  },
])
function setInternships(newValue: Internship[]) {
  internships.value = newValue
}

const handleInternship = (newValue: Internship[]) => {
  setInternships(newValue)
}

// 项目经历
const projects = ref<Project[]>([
  {
    id: '1',
    name: '微信小程序开发者工具',
    role: '前端开发',
    gitAddress: 'github.com',
    dateRange: [dayjs(), dayjs()],
    visible: true,
    description: `



为开发者提供小程序开发、调试和发布的一站式解决方案



基于 Electron 构建的跨平台桌面应用



支持多平台开发，包括 Windows、macOS 和 Linux



提供实时的错误日志和性能分析工具



集成第三方插件和 SDK，支持开发者自定义功能`,
  },
  {
    id: '2',
    name: '前端监控平台',
    role: '前端开发',
    gitAddress: 'github.com',
    dateRange: [dayjs(), dayjs()],
    visible: true,
    description: `



一个完整的前端监控解决方案，包含错误监控、性能监控、用户行为分析等功能。



基于 Vue 和 Element UI 构建，提供实时的监控数据和可视化分析工具。



支持多种监控指标，包括错误日志、性能指标、用户行为分析等。



提供详细的错误日志和性能分析工具，帮助开发者定位和优化问题。



集成第三方插件和 SDK，支持开发者自定义功能。`,
  },
])
function setProjects(newValue: Project[]) {
  projects.value = newValue
}

const handleProjects = (newValue: Project[]) => {
  setProjects(newValue)
}

// 个人技能
const skills = ref<string>(`



前端框架：熟悉 React、Vue.js，熟悉 Next.js、Nuxt.js 等 SSR 框架



开发语言：TypeScript、JavaScript(ES6+)、HTML5、CSS3



UI/样式：熟悉 TailwindCSS、Sass/Less、CSS Module、Styled-components



状态管理：Redux、Vuex、Zustand、Jotai、React Query



工程化工具：Webpack、Vite、Rollup、Babel、ESLint



测试工具：Jest、React Testing Library、Cypress



性能优化：熟悉浏览器渲染原理、性能指标监控、代码分割、懒加载等优化技术



版本控制：Git、SVN



技术管理：具备团队管理经验，主导过多个大型项目的技术选型和架构设计`)
function setSkills(newValue: string) {
  skills.value = newValue
}

const handleSkills = (newValue: string) => {
  setSkills(newValue)
}
</script>

<template>
  <div class="edit-container">
    <tool-head></tool-head>
    <div class="edit-resume">
      <edit-content>
        <template #basic>
          <BasicCard :basic="basic" @handle-basic="handleBasic"></BasicCard>
        </template>
        <template #education>
          <EducationCard
            :educations="educations"
            @handle-education="handleEducation"
          ></EducationCard>
        </template>
        <template #internship>
          <InternshipCard
            :internships="internships"
            @handle-internships="handleInternship"
          ></InternshipCard>
        </template>
        <template #project>
          <ProjectCard
            :projects="projects"
            @handle-projects="handleProjects"
          ></ProjectCard>
        </template>
        <template #skills>
          <SkillsCard
            :skills="skills"
            @handle-skills="handleSkills"
          ></SkillsCard>
        </template>
      </edit-content>
      <span class="line"></span>
      <div class="view-content">
        <resume-preview
          :basic="basic"
          :educations="educations"
          :internships="internships"
          :projects="projects"
          :skills="skills"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.edit-container {
  @include themify(
    (
      background-color: $layout-bg-color,
    )
  );
}
.edit-resume {
  margin-top: 1rem;
  width: 100%;
  height: calc(100vh - $site-header-height - 1rem);
  display: flex;

  .line {
    width: 2px;
    height: 100%;
    margin: 0 0.2rem;
    @include themify(
      (
        background-color: $border-color-mode,
      )
    );
  }
  .view-content {
    width: 50%;
    height: 100%;
    border-radius: 0.5rem;
    padding: 1rem;
    @include themify(
      (
        color: $text-color,
        background-color: $bg-color,
      )
    );
  }
}
</style>
