<script setup lang="ts">
import type { Resume } from '@/types/userInfo'
import { h, inject, ref } from 'vue'
import {
  EyeOutlined,
  DeleteOutlined,
  DownOutlined,
  UpOutlined,
  PlusOutlined,
} from '@ant-design/icons-vue'
import AiEditor from '@/components/AiEditor.vue'

const resume: Resume = inject('resume') as Resume

const isExpand = ref(false)
const handleExpand = () => {
  isExpand.value = !isExpand.value
}

/**
 * 删除项目经历
 * @param id 项目经历的id
 */
const handleDeleteProject = (id: string) => {
  resume.projects = resume.projects.filter(item => item.id !== id)
}

/**
 * 添加项目经历
 */
const handleAddProject = () => {
  resume.projects.push({
    id: crypto.randomUUID(),
    name: '项目名称',
    role: '担任角色',
    gitAddress: 'GitHub/GitLab地址',
    dateRange: '时间范围',
    visible: true,
    description: '',
  })
}
</script>

<template>
  <div class="collapse">
    <div class="info" @click="handleExpand">
      <div class="info-title">
        项目经历 <DownOutlined v-if="!isExpand" /><UpOutlined v-else />
      </div>
      <div class="info-work">
        <DeleteOutlined style="font-size: 16px; color: red" />
      </div>
    </div>
    <div v-if="isExpand" class="collapse-content">
      <template v-for="project in resume.projects" :key="project.id">
        <a-form :label-col="{ style: { width: '120px' } }">
          <a-row>
            <a-form-item label="项目名称">
              <a-input
                v-model:value="project.name"
                style="width: 200px"
                placeholder="项目名称"
              />
            </a-form-item>
            <a-form-item label="担任角色">
              <a-input
                v-model:value="project.role"
                placeholder="担任角色"
                style="width: 200px"
              />
            </a-form-item>
          </a-row>
          <a-row>
            <a-form-item label="项目地址">
              <a-input
                v-model:value="project.gitAddress"
                placeholder="GitHub/GitLab地址"
                style="width: 424px"
              />
            </a-form-item>
          </a-row>
          <a-row>
            <a-form-item label="项目时间">
              <a-input
                v-model:value="project.dateRange"
                placeholder="时间范围：YYYY/MM - YYYY/MM"
                style="width: 200px"
              />
            </a-form-item>
          </a-row>
          <a-form-item label="项目描述">
            <AiEditor v-model="project.description" />
          </a-form-item>
          <a-space-compact style="margin-bottom: 1rem">
            <a-button
              type="dashed"
              danger
              :icon="h(DeleteOutlined)"
              @click="handleDeleteProject(project.id)"
              >删除该经历</a-button
            >
            <a-button type="dashed" :icon="h(EyeOutlined)">隐藏该经历</a-button>
          </a-space-compact>
        </a-form>
      </template>
      <div class="form-actions">
        <a-button
          type="primary"
          block
          :icon="h(PlusOutlined)"
          @click="handleAddProject"
          >添加项目经历</a-button
        >
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.collapse {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  .info {
    width: 100%;
    min-height: 60px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    border: 1px dashed;
    padding: 1rem 1.4rem;
    cursor: pointer;
    transition:
      border-color 0.2s,
      background 0.2s;
    border-radius: 0.6rem;
    @include themify(
      (
        border-color: $border-color-mode,
      )
    );

    &:hover {
      background: rgba(59, 130, 246, 0.08);
    }

    &-title {
      font-size: 1.6rem;
      font-weight: 600;
    }

    .info-desc {
      font-size: 1.3rem;
      color: #8c8c8c;
      margin-top: 0.3rem;
    }

    &-work {
      display: flex;
      gap: 0.6rem;
      align-items: flex-end;
    }

    .info-action {
      color: $primary-color;
      font-size: 1.3rem;

      &.danger {
        color: #f97316;
      }
    }
  }

  &-content {
    width: 100%;
    border: 1px solid;
    padding: 1.4rem;
    border-radius: 0.6rem;
    background: rgba(255, 255, 255, 0.8);
    @include themify(
      (
        border-color: $border-color-mode,
      )
    );

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
    }
  }
}
</style>
