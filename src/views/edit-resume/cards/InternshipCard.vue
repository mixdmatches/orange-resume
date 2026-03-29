<script setup lang="ts">
import type { Internship } from '@/types/userInfo'
import { computed, ref, watch } from 'vue'
import {
  EyeOutlined,
  DeleteOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons-vue'
const props = defineProps<{
  internships: Internship[]
}>()

const emit = defineEmits<{
  handleInternship: [value: Internship[]]
}>()

const localInternships = computed(() => props.internships)
watch(
  () => localInternships.value,
  (newValue: Internship[]) => {
    emit('handleInternship', newValue)
  },
)

const isExpand = ref(false)
const handleExpand = () => {
  isExpand.value = !isExpand.value
}
const handleDeleteInternship = () => {}
const handleAddInternship = () => {}
</script>

<template>
  <div class="collapse">
    <div class="info" @click="handleExpand">
      <div class="info-title">
        实习经历 <DownOutlined v-if="!isExpand" /><UpOutlined v-else />
      </div>
      <div class="info-work">
        <EyeOutlined style="font-size: 16px" />
        <DeleteOutlined style="font-size: 16px; color: red" />
      </div>
    </div>
    <div v-if="isExpand" class="collapse-content">
      <template v-for="internship in localInternships" :key="internship.id">
        <a-form :label-col="{ style: { width: '120px' } }">
          <a-row>
            <a-form-item label="公司名称">
              <a-input
                v-model:value="internship.companyName"
                style="width: 200px"
                placeholder="公司名称"
              />
            </a-form-item>
            <a-form-item label="岗位名称">
              <a-input
                v-model:value="internship.position"
                placeholder="岗位名称"
                style="width: 200px"
              />
            </a-form-item>
          </a-row>
          <a-row>
            <a-form-item label="所在部门">
              <a-input
                v-model:value="internship.department"
                placeholder="所在部门"
                style="width: 200px"
              />
            </a-form-item>
            <a-form-item label="实习时间">
              <a-range-picker
                v-model:value="internship.date"
                :format="'YYYY/MM'"
                style="width: 200px"
              />
            </a-form-item>
          </a-row>
          <a-form-item label="实习成果">
            <a-textarea
              v-model:value="internship.description"
              :rows="4"
              placeholder="输入实习成果、负责模块..."
            />
          </a-form-item>
        </a-form>
        <a-button type="dashed" block danger @click="handleDeleteInternship"
          >删除实习经历</a-button
        >
      </template>
      <div class="form-actions">
        <a-button type="dashed" block @click="handleAddInternship"
          >+ 添加实习经历</a-button
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
