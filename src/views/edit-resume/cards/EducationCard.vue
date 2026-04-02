<script setup lang="ts">
import type { Education } from '@/types/userInfo'
import {
  EyeOutlined,
  DeleteOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons-vue'
import { ref, watch, type Ref } from 'vue'

const degreeOptions = ['小学', '初中', '高中', '大专', '本科', '研究生', '博士']

const props = defineProps<{
  educations: Education[]
}>()
const emit = defineEmits<{
  handleEducation: [value: Education[]]
}>()
const localEducation: Ref<Education[]> = ref(props.educations)
watch(
  localEducation,
  newValue => {
    emit('handleEducation', newValue)
  },
  { deep: true },
)
const handleAddEducation = () => {
  localEducation.value.push({
    id: '',
    school: '',
    major: '',
    degree: '',
    dateRange: '',
    visible: true,
    gpa: '',
    description: ``,
  })
}
const isExpand = ref(false)
const handleExpand = () => {
  isExpand.value = !isExpand.value
}
</script>

<template>
  <div class="collapse">
    <div class="info" @click="handleExpand">
      <div class="info-title">
        教育经历 <DownOutlined v-if="!isExpand" /><UpOutlined v-else />
      </div>
      <div class="info-work">
        <EyeOutlined style="font-size: 16px" />
        <DeleteOutlined style="font-size: 16px; color: red" />
      </div>
    </div>
    <div v-if="isExpand" class="collapse-content">
      <template v-for="value in localEducation" :key="value.id">
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
              <a-range-picker
                v-model:value="value.dateRange"
                style="width: 200px"
                :format="'YYYY/MM'"
              />
            </a-form-item>
          </a-row>

          <a-form-item label="自定义描述" name="description">
            <a-textarea
              v-model:value="value.description"
              :rows="3"
              placeholder="自定义描述：课程/获奖/绩点等"
            />
          </a-form-item>
        </a-form>
        <a-button type="dashed" block danger>删除教育经历</a-button>
      </template>
      <div class="form-actions">
        <a-button type="dashed" block @click="handleAddEducation"
          >+ 添加教育经历</a-button
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
      margin-top: 1rem;
      display: flex;
      gap: 1rem;
    }
  }
}
</style>
