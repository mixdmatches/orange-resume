<script setup lang="ts">
import { ref, h } from 'vue'
import type { ResumeFormProps, ResumeFormEmits } from '@/types/form.d.ts'
import {
  DownOutlined,
  UpOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  PlusOutlined,
} from '@ant-design/icons-vue'
import AiEditor from '@/components/AiEditor.vue'

withDefaults(defineProps<ResumeFormProps>(), {
  showExpand: true,
  showDelete: true,
  showEye: true,
  showTitleEye: false,
  showAdd: true,
  showActions: true,
  labelWidth: '120px',
})

const emit = defineEmits<ResumeFormEmits>()

const isExpand = ref(false)
const open = ref(false)
const activeId = ref('')
const deleteTitle = ref('删除')
const deleteConfirmText = ref('确定删除吗？删除后不可恢复')
const isDeleteModel = ref(false) // 是否删除的是模块还是条目

const handleExpand = () => {
  isExpand.value = !isExpand.value
}

const handleAdd = () => {
  emit('add')
}

const handleDelete = (id: string) => {
  activeId.value = id
  isDeleteModel.value = false
  deleteConfirmText.value = '确定删除该条目吗？此操作不可撤销'
  open.value = true
}

const handleOk = () => {
  if (!isDeleteModel.value) {
    emit('delete', activeId.value)
  } else {
    emit('deleteModel')
  }
  open.value = false
  activeId.value = ''
}

const handleHide = (id: string) => {
  emit('hide', id)
}

// 删除模块回调函数
const handleDeleteModel = () => {
  isDeleteModel.value = true
  deleteConfirmText.value = '确定删除该模块吗？此操作不可撤销'
  open.value = true
}
</script>

<template>
  <a-modal v-model:open="open" :title="deleteTitle" @ok="handleOk">
    <p>{{ deleteConfirmText }}</p>
  </a-modal>
  <div class="collapse">
    <div v-if="showExpand" class="info" @click.stop="handleExpand">
      <div class="info-title">
        {{ title }}
        <DownOutlined v-if="!isExpand" />
        <UpOutlined v-else />
      </div>
      <div class="info-work">
        <DeleteOutlined
          v-if="showDelete"
          style="font-size: 16px; color: red"
          @click.stop="handleDeleteModel"
        />
        <EyeOutlined v-if="showTitleEye" style="font-size: 16px" />
      </div>
    </div>
    <div v-if="isExpand || !showExpand" class="collapse-content">
      <template v-for="item in items" :key="item.id">
        <div class="form-item">
          <a-form>
            <a-row v-for="field in fields" :key="field.prop" gutter="16">
              <a-col :span="field.type === 'editor' ? 24 : field.span || 12">
                <a-form-item :label="field.label" :name="field.prop">
                  <template v-if="field.type === 'editor'">
                    <AiEditor v-model="item[field.prop]" />
                  </template>
                  <template v-else-if="field.type === 'select'">
                    <a-select
                      v-model:value="item[field.prop]"
                      style="width: 200px"
                      :placeholder="field.placeholder || `请选择${field.label}`"
                    >
                      <a-select-option
                        v-for="option in field.options"
                        :key="option"
                        :value="option"
                      >
                        {{ option }}
                      </a-select-option>
                    </a-select>
                  </template>
                  <template v-else>
                    <a-input
                      v-model:value="item[field.prop]"
                      :style="field.style || 'width: 200px'"
                      :placeholder="field.placeholder || `请输入${field.label}`"
                    />
                  </template>
                </a-form-item>
              </a-col>
            </a-row>

            <a-space-compact
              v-if="showActions"
              style="margin-bottom: 1rem; margin-top: 1rem"
            >
              <a-button
                type="dashed"
                danger
                :icon="h(DeleteOutlined)"
                @click="handleDelete(item.id)"
              >
                {{ deleteTitle || '删除' }}
              </a-button>
              <a-button
                v-if="showEye"
                type="dashed"
                :icon="
                  h(item.visible !== false ? EyeOutlined : EyeInvisibleOutlined)
                "
                @click="handleHide(item.id)"
              >
                {{ item.visible !== false ? '隐藏' : '显示' }}
              </a-button>
            </a-space-compact>
          </a-form>
          <slot name="custom"></slot>
        </div>
      </template>

      <div v-if="showAdd" class="form-actions">
        <a-button
          type="primary"
          block
          :icon="h(PlusOutlined)"
          @click="handleAdd"
        >
          {{ addText || '添加条目' }}
        </a-button>
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
    min-height: 30px;
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

    &-work {
      display: flex;
      gap: 0.6rem;
      align-items: flex-end;
    }

    .info-action {
      color: $primary-color;
      font-size: 1.3rem;
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

    .form-actions {
      display: flex;
      gap: 1rem;
    }
  }
}
</style>
