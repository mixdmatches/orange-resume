<script setup lang="ts">
import type { Education } from '@/types/userInfo'
import { ref, watch, type Ref } from 'vue'

const degreeOptions = ['小学', '初中', '高中', '大专', '本科', '研究生', '博士']

const props = defineProps<{
  educations: Education[]
}>()
const emit = defineEmits<{
  handleEducation: [value: Education[]]
}>()
const localEducation: Ref<Education[]> = ref(
  JSON.parse(JSON.stringify(props.educations)),
)
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
      <div>
        <div class="info-title">教育经历</div>
        <div class="info-desc">描述</div>
      </div>
      <div class="info-work">
        <span class="info-action">可见</span>
        <span class="info-action danger">删除</span>
      </div>
    </div>
    <div v-if="isExpand" class="collapse-content">
      <template v-for="value in localEducation" :key="value.id">
        <div class="form-grid">
          <a-input v-model:value="value.school" placeholder="学校名称" />
          <a-input v-model:value="value.major" placeholder="就读专业" />
          <a-select ref="select" v-model:value="value.degree">
            <a-select-option
              v-for="option in degreeOptions"
              :key="option"
              :value="option"
              >{{ option }}</a-select-option
            >
          </a-select>
          <a-range-picker v-model:value="value.dateRange" :format="'YYYY/MM'" />
        </div>
        <a-textarea
          v-model:value="value.description"
          :rows="3"
          placeholder="自定义描述：课程/获奖/绩点等"
        />
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
    min-height: 78px;
    display: flex;
    justify-content: space-between;
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
      flex-direction: column;
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
