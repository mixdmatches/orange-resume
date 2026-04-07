<script setup lang="ts">
import { inject, ref } from 'vue'
import {
  EyeOutlined,
  DeleteOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons-vue'
import type { Resume } from '@/types/userInfo'
import AiEditor from '@/components/AiEditor.vue'

const resume: Resume = inject('resume') as Resume

const isExpand = ref(false)
const handleExpand = () => {
  isExpand.value = !isExpand.value
}
</script>

<template>
  <div class="collapse">
    <div class="info" @click="handleExpand">
      <div class="info-title">
        个人技能 <DownOutlined v-if="!isExpand" /><UpOutlined v-else />
      </div>
      <div class="info-work">
        <EyeOutlined style="font-size: 16px" />
        <DeleteOutlined style="font-size: 16px; color: red" />
      </div>
    </div>
    <div v-if="isExpand" class="collapse-content">
      <AiEditor v-model="resume.skills" />
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
