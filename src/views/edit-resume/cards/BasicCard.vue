<script setup lang="ts">
import type { Basic, Resume } from '@/types/userInfo'
import { DownOutlined, UpOutlined } from '@ant-design/icons-vue'
import { inject, ref } from 'vue'

const resume: Resume = inject('resume') as Resume

interface BasicField {
  label: string
  prop: keyof Basic
}
const basicFields: BasicField[] = [
  { label: '姓名', prop: 'name' },
  { label: '职位', prop: 'position' },
  { label: '联系电话', prop: 'phone' },
  { label: '电子邮箱', prop: 'email' },
  { label: '所在城市', prop: 'address' },
]

const isExpand = ref(false)
const handleExpand = () => {
  isExpand.value = !isExpand.value
}
</script>

<template>
  <div class="collapse">
    <div class="info" @click="handleExpand">
      <div class="info-title">
        基本信息 <DownOutlined v-if="!isExpand" /><UpOutlined v-else />
      </div>
      <div class="info-work"></div>
    </div>

    <div v-if="isExpand" class="collapse-content">
      <div class="basic-field">
        <div class="field-warper">
          <div
            v-for="field in basicFields"
            :key="field.prop"
            class="field-item"
          >
            <div class="field-input">
              <div class="field-prop">
                <span class="prop">{{ field.label }}</span>
              </div>
              <a-input
                v-model:value="resume.basic[field.prop]"
                class="field-text"
                :placeholder="`请输入${field.label}`"
              />
            </div>
          </div>
        </div>
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

    .basic-field {
      .field-warper {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .field-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.6rem;
        padding: 0.8rem 1rem;
      }

      .sort-icon {
        cursor: move;
        font-size: 1.8rem;
        color: #9ca3af;
        display: flex;
      }

      .field-input {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .field-prop {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        width: 120px;
        font-size: 1.3rem;
        color: #4b5563;
      }

      .field-text {
        flex: 1;
      }

      .field-work {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        font-size: 1.2rem;
        color: #94a3b8;
      }
    }
  }
}
</style>
