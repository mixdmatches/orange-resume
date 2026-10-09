<script setup lang="ts">
import { ref, h, nextTick } from 'vue'
import type { ResumeFormProps, ResumeFormEmits } from '@/types/form.d.ts'
import {
  DownOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  PlusOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons-vue'
import AiEditor from '@/components/AiEditor.vue'
import ImgDrawer from '@/components/ImgDrawer.vue'

const props = withDefaults(defineProps<ResumeFormProps>(), {
  showExpand: true,
  showDelete: true,
  showEye: true,
  showTitleEye: false,
  showAdd: true,
  showActions: true,
  editableTitle: false,
})

const emit = defineEmits<ResumeFormEmits>()

/** 模块展开状态：默认展开，省去逐个点开的操作成本 */
const isExpand = ref(true)

/** 展开/收起模块 */
const handleExpand = () => {
  isExpand.value = !isExpand.value
}

// ============ 可编辑标题：草稿 + 确认/取消，与导航标题解耦 ============
/** 是否处于标题编辑态：编辑中只改本地草稿，不实时影响导航 */
const isEditingTitle = ref(false)
/** 标题草稿值 */
const titleDraft = ref('')
const titleInputRef = ref<HTMLInputElement | null>(null)

/** 进入标题编辑态：初始化草稿并自动聚焦 */
const openTitleEdit = () => {
  titleDraft.value = props.title
  isEditingTitle.value = true
  nextTick(() => titleInputRef.value?.focus())
}

/** 确认标题编辑：仅在此时上报，空值回退原标题 */
const confirmTitleEdit = () => {
  const next = titleDraft.value.trim()
  if (next && next !== props.title) {
    emit('titleChange', next)
  }
  isEditingTitle.value = false
}

/** 取消标题编辑：丢弃草稿还原显示 */
const cancelTitleEdit = () => {
  isEditingTitle.value = false
  titleDraft.value = ''
}

/** 触发添加条目 */
const handleAdd = () => {
  emit('add')
}

/** 请求删除单条条目 */
const handleDelete = (id: string) => {
  activeId.value = id
  isDeleteModel.value = false
  deleteConfirmText.value = '确定删除该条目吗？此操作不可撤销'
  open.value = true
}

/** 确认删除（区分条目 / 整个模块） */
const handleOk = () => {
  if (!isDeleteModel.value) {
    emit('delete', activeId.value)
  } else {
    emit('deleteModel')
  }
  open.value = false
  activeId.value = ''
}

/** 切换条目显示/隐藏 */
const handleHide = (id: string) => {
  emit('hide', id)
}

/** 请求删除整个模块 */
const handleDeleteModel = () => {
  isDeleteModel.value = true
  deleteConfirmText.value = '确定删除该模块吗？此操作不可撤销'
  open.value = true
}

// 调出图片调节侧边栏
const openImgDrawer = ref(false)
const handleChangeImg = () => {
  openImgDrawer.value = true
}

// 隐藏证件照
const handleHideImg = () => {
  emit('changeHideImg')
}

const open = ref(false)
const activeId = ref('')
const deleteTitle = ref('删除')
const deleteConfirmText = ref('确定删除吗？删除后不可恢复')
const isDeleteModel = ref(false) // 是否删除的是模块还是条目
</script>

<template>
  <a-modal v-model:open="open" :title="deleteTitle" @ok="handleOk">
    <p>{{ deleteConfirmText }}</p>
  </a-modal>

  <ImgDrawer v-model:open="openImgDrawer"></ImgDrawer>

  <div class="module-card">
    <!-- 模块头：标题 + 操作 + 展开箭头 -->
    <div
      class="module-head"
      :class="{ 'is-static': !showExpand || isEditingTitle }"
      role="button"
      :tabindex="showExpand && !isEditingTitle ? 0 : -1"
      @click="showExpand && !isEditingTitle && handleExpand()"
      @keydown.enter="showExpand && !isEditingTitle && handleExpand()"
    >
      <!-- 可编辑标题：编辑中为本地草稿，确认后才同步导航标题 -->
      <template v-if="editableTitle">
        <!-- 编辑态：草稿输入 + 确定/取消 -->
        <template v-if="isEditingTitle">
          <input
            ref="titleInputRef"
            v-model="titleDraft"
            class="module-title-input"
            placeholder="请输入模块名称"
            maxlength="20"
            @click.stop
            @keydown.stop
            @keydown.enter.prevent.stop="confirmTitleEdit"
            @keydown.esc.prevent.stop="cancelTitleEdit"
          />
          <span class="title-edit-actions" @click.stop>
            <button
              type="button"
              class="title-edit-btn confirm"
              title="确定"
              @click.stop="confirmTitleEdit"
            >
              <CheckOutlined />
            </button>
            <button
              type="button"
              class="title-edit-btn cancel"
              title="取消"
              @click.stop="cancelTitleEdit"
            >
              <CloseOutlined />
            </button>
          </span>
        </template>
        <!-- 展示态：标题文本 + 铅笔入口 -->
        <template v-else>
          <span class="module-title">{{ title }}</span>
          <button
            type="button"
            class="title-edit-btn trigger"
            title="编辑模块名称"
            @click.stop="openTitleEdit"
          >
            <EditOutlined />
          </button>
        </template>
      </template>
      <span v-else class="module-title">{{ title }}</span>
      <span class="head-actions">
        <span
          v-if="showTitleEye"
          class="head-action"
          title="隐藏模块"
          @click.stop
        >
          <EyeOutlined />
        </span>
        <span
          v-if="showDelete"
          class="head-action danger"
          title="删除模块"
          @click.stop="handleDeleteModel"
        >
          <DeleteOutlined />
        </span>
        <span
          v-if="showExpand"
          class="chevron"
          :class="{ 'is-open': isExpand }"
        >
          <DownOutlined />
        </span>
      </span>
    </div>

    <!-- 模块内容：条目列表 + 添加按钮 -->
    <div v-show="isExpand || !showExpand" class="module-body">
      <template v-for="(item, index) in items" :key="item.id">
        <div class="entry" :class="{ 'is-hidden': item.visible === false }">
          <!-- 条目头：序号 + 条目级操作 -->
          <div v-if="showActions" class="entry-head">
            <span class="entry-index">{{
              String(index + 1).padStart(2, '0')
            }}</span>
            <span class="entry-actions">
              <span
                v-if="showEye"
                class="entry-action"
                :title="item.visible !== false ? '隐藏该条目' : '显示该条目'"
                @click="handleHide(item.id)"
              >
                <EyeInvisibleOutlined v-if="item.visible !== false" />
                <EyeOutlined v-else />
              </span>
              <span
                v-if="showDelete"
                class="entry-action danger"
                title="删除该条目"
                @click="handleDelete(item.id)"
              >
                <DeleteOutlined />
              </span>
            </span>
          </div>

          <!-- 表单：2 列网格，label 置顶，编辑器通栏 -->
          <div class="form-grid">
            <template v-for="field in fields" :key="field.prop">
              <!-- 富文本编辑器：通栏 -->
              <div v-if="field.type === 'editor'" class="form-field field-full">
                <label class="field-label">{{ field.label }}</label>
                <AiEditor v-model="item[field.prop]" />
              </div>
              <!-- 下拉选择 -->
              <div v-else-if="field.type === 'select'" class="form-field">
                <label class="field-label">{{ field.label }}</label>
                <a-select
                  v-model:value="item[field.prop]"
                  :placeholder="field.placeholder || `请选择${field.label}`"
                  :options="
                    (field.options || []).map(option => ({
                      label: option,
                      value: option,
                    }))
                  "
                />
              </div>
              <!-- 证件照：通栏 + 调节/显隐按钮 -->
              <div
                v-else-if="field.type === 'img'"
                class="form-field field-full"
              >
                <label class="field-label">{{ field.label }}</label>
                <div class="img-input-group">
                  <a-input
                    v-model:value="item[field.prop]"
                    class="img-url-input"
                    :placeholder="
                      field.placeholder || `请输入${field.label}url`
                    "
                  />
                  <a-button @click="handleChangeImg">调节</a-button>
                  <a-button
                    :icon="
                      h(
                        items?.[0].photoConfig.visible !== false
                          ? EyeInvisibleOutlined
                          : EyeOutlined,
                      )
                    "
                    @click="handleHideImg"
                  ></a-button>
                </div>
              </div>
              <!-- 普通输入框 -->
              <div v-else class="form-field">
                <label class="field-label">{{ field.label }}</label>
                <a-input
                  v-model:value="item[field.prop]"
                  :placeholder="field.placeholder || `请输入${field.label}`"
                />
              </div>
            </template>
          </div>
        </div>
      </template>

      <!-- 添加条目：轻量幽灵按钮 -->
      <button
        v-if="showAdd"
        type="button"
        class="add-entry-btn"
        @click="handleAdd"
      >
        <PlusOutlined />
        {{ addText || '添加一条' }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* ============ 模块卡片容器 ============ */
.module-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

/* ============ 模块头 ============ */
.module-head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: none;
  background: transparent;
  font: inherit;
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
  user-select: none;
  transition: background-color var(--duration-fast) var(--ease-out);

  &:hover {
    background: var(--color-surface-hover);
  }

  /* 不可折叠的卡片（如基本信息）不响应指针 */
  &.is-static {
    cursor: default;

    &:hover {
      background: transparent;
    }
  }
}

.module-title {
  flex: 1;
  min-width: 0;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 可编辑标题：视觉与标题一致，hover/focus 用主色下边框提示可编辑 */
.module-title-input {
  flex: 1;
  min-width: 0;
  padding: 2px var(--space-2);
  border: none;
  border-bottom: 1px solid transparent;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  background: var(--color-bg-muted);
  font: inherit;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  /* 父级 module-head 设了 user-select:none，输入框需恢复可选中 */
  user-select: text;
  outline: none;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);

  &::placeholder {
    font-weight: var(--font-regular);
    color: var(--color-text-tertiary);
  }

  &:hover {
    border-bottom-color: var(--color-border-strong);
  }

  &:focus {
    background: var(--color-primary-bg);
    border-bottom-color: var(--color-primary);
  }
}

/* 标题编辑小按钮：确定 / 取消 / 铅笔入口 */
.title-edit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex: none;
  padding: 0;
  border: none;
  border-radius: var(--radius-full);
  background: transparent;
  font-size: 12px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition:
    color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out),
    opacity var(--duration-fast) var(--ease-out);

  &:hover {
    color: var(--color-text);
    background: var(--color-bg-muted);
  }

  /* 确认按钮：主色克制强调 */
  &.confirm:hover {
    color: var(--color-primary);
    background: var(--color-primary-bg);
  }

  /* 铅笔入口：默认隐藏，hover 模块头时淡入 */
  &.trigger {
    opacity: 0;

    &:hover {
      color: var(--color-primary);
      background: var(--color-primary-bg);
      opacity: 1;
    }
  }
}

/* hover 模块头时显示铅笔入口 */
.module-head:hover .title-edit-btn.trigger {
  opacity: 0.7;
}

.title-edit-actions {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  flex: none;
}

.head-actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex: none;
}

.head-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  font-size: 14px;
  color: var(--color-text-tertiary);
  border-radius: var(--radius-sm);
  transition:
    color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);

  &:hover {
    color: var(--color-text);
    background: var(--color-bg-muted);
  }

  &.danger:hover {
    color: var(--color-danger);
    background: var(--color-danger-bg);
  }
}

.chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  font-size: 12px;
  color: var(--color-text-tertiary);
  transition: transform var(--duration-base) var(--ease-out);

  &.is-open {
    transform: rotate(180deg);
  }
}

/* ============ 模块内容 ============ */
.module-body {
  padding: 0 var(--space-4) var(--space-4);
}

.entry {
  padding: var(--space-3) 0 var(--space-4);

  /* 条目之间用细分隔线区分，保持克制 */
  & + .entry {
    border-top: 1px solid var(--color-border);
  }

  /* 被隐藏的条目降低不透明度作提示 */
  &.is-hidden {
    opacity: 0.5;
  }
}

.entry-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.entry-index {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-text-tertiary);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.entry-actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.entry-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  font-size: 14px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition:
    color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);

  &:hover {
    color: var(--color-text);
    background: var(--color-bg-muted);
  }

  &.danger:hover {
    color: var(--color-danger);
    background: var(--color-danger-bg);
  }
}

/* ============ 表单网格：2 列，label 置顶 ============ */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3) var(--space-4);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;

  /* 编辑器 / 图片组等宽字段通栏 */
  &.field-full {
    grid-column: 1 / -1;
  }
}

.field-label {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  line-height: var(--leading-normal);
}

.img-input-group {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.img-url-input {
  flex: 1;
  min-width: 0;
}

/* ============ 添加条目按钮 ============ */
.add-entry-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  margin-top: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-bg-muted);
  color: var(--color-text-secondary);
  font: inherit;
  font-size: var(--text-xs);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);

  &:hover {
    background: var(--color-primary-bg);
    color: var(--color-primary);
  }
}
</style>
