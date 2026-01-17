<script setup lang="ts">
import { ref } from 'vue'
import type { Basic, Education, Internship } from '@/types/userInfo'
import ToolHead from './components/ToolHead.vue'
import EditContent from '@/views/edit-resume/components/EditContent.vue'
import ResumePreview from '@/views/edit-resume/components/ResumePreview.vue'
import BasicCard from './cards/BasicCard.vue'
import EducationCard from './cards/EducationCard.vue'
import InternshipCard from './cards/InternshipCard.vue'
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

const educations = ref<Education[]>([
  {
    id: '1',
    school: '清华大学',
    major: '软件工程',
    degree: '本科',
    dateRange: '',
    visible: true,
    gpa: '',
    description: ``,
  },
])
function setEducation(newValue: Education[]) {
  educations.value = newValue
}
const handleEducation = (newEducation: Education[]) => {
  setEducation(newEducation)
}

const internships = ref([
  {
    id: '1',
    companyName: '公司名称',
    position: '岗位名称',
    department: '部门',
    date: '',
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
      </edit-content>
      <span class="line"></span>
      <div class="view-content">
        <resume-preview
          :basic="basic"
          :educations="educations"
          :internships="internships"
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
