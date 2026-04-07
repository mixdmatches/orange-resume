<script setup lang="ts">
import type { Resume } from '@/types/userInfo'
import {
  EyeOutlined,
  DeleteOutlined,
  DownOutlined,
  UpOutlined,
  PlusOutlined,
} from '@ant-design/icons-vue'
import AiEditor from '@/components/AiEditor.vue'
import { h, inject, ref } from 'vue'

const resume: Resume = inject('resume') as Resume

const degreeOptions = ['小学', '初中', '高中', '大专', '本科', '硕士', '博士']

/**
 * 添加教育经历
 */
const handleAddEducation = () => {
  resume.educations.push({
    id: crypto.randomUUID(),
    school: '学校',
    major: '专业',
    degree: '学历层次',
    dateRange: '时间范围',
    visible: true,
    gpa: '',
    description: '',
  })
}

/**
 * 删除教育经历
 * @param id 教育经历的id
 */
const handleDeleteEducation = (id: string) => {
  resume.educations = resume.educations.filter(item => item.id !== id)
}

const isExpand = ref(false)
const handleExpand = () => {
  isExpand.value = !isExpand.value
}
</script>

<template>
  <div class="collapse">
    <div class="info" @click.stop="handleExpand">
      <div class="info-title">
        教育经历 <DownOutlined v-if="!isExpand" /><UpOutlined v-else />
      </div>
      <div class="info-work">
        <DeleteOutlined style="font-size: 16px; color: red" />
      </div>
    </div>
    <div v-if="isExpand" class="collapse-content">
      <template v-for="value in resume.educations" :key="value.id">
        <a-form :label-col="{ style: { width: '120px' } }">
          <a-row>
            <a-form-item label="学校名称" name="school">
              <a-input
                v-model:value="value.school"
                style="width: 200px"
                placeholder="学校名称"
              />
            </a-form-item>
            <a-form-item label="就读专业" name="major">
              <a-input
                v-model:value="value.major"
                style="width: 200px"
                placeholder="就读专业"
              />
            </a-form-item>
          </a-row>
          <a-row>
            <a-form-item label="学历层次" name="degree">
              <a-select
                ref="select"
                v-model:value="value.degree"
                style="width: 200px"
              >
                <a-select-option
                  v-for="option in degreeOptions"
                  :key="option"
                  :value="option"
                  >{{ option }}</a-select-option
                >
              </a-select>
            </a-form-item>
            <a-form-item label="时间范围" name="dateRange">
              <a-input
                v-model:value="value.dateRange"
                style="width: 200px"
                placeholder="时间范围：YYYY/MM - YYYY/MM"
              />
            </a-form-item>
          </a-row>

          <a-form-item label="自定义描述" name="description">
            <AiEditor v-model="value.description" />
          </a-form-item>
          <a-space-compact style="margin-bottom: 1rem">
            <a-button
              type="dashed"
              danger
              :icon="h(DeleteOutlined)"
              @click="handleDeleteEducation(value.id)"
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
          @click="handleAddEducation"
          >添加教育经历</a-button
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
