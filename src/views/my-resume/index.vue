<script setup lang="ts">
import { DEFAULT_RESUME } from '@/config/init-resume-data'
import {
  createResume,
  deleteBatchResume,
  deleteResume,
  listResumes,
} from '@/service/resumeRepository'
import type { Resume } from '@/types/resume'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  VerticalAlignTopOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import { computed, h, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { importPDF } from '@/utils/importPDF'
import { generateUUID } from '@/utils/uuid'
import TemplateThumb from '@/components/TemplateThumb.vue'

const router = useRouter()

const activeResumeId = ref<string>('')

const resumes = ref<Resume[]>([])

/** 最新更新时间文案 */
const latestUpdateText = computed(() => {
  if (!resumes.value.length) return '暂无简历'
  const latest = resumes.value.reduce((max, cur) => {
    const t = cur.updatedAt ?? cur.createdAt
    return t > (max.updatedAt ?? max.createdAt) ? cur : max
  })
  return dayjs(latest.updatedAt ?? latest.createdAt).format('YYYY-MM-DD HH:mm')
})

/**
 * 获取所有简历（走 Repository 调度层，本地优先 + 后台云同步）
 */
const getAllResume = async () => {
  const res = await listResumes()
  // Repository 已按 updatedAt 倒序返回，这里兜底一次
  res.sort(
    (a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt),
  )
  resumes.value = res
}

onMounted(() => {
  getAllResume()
})

/**
 * 创建简历（Repository 先写本地再入同步队列）
 */
const handleAddResume = async () => {
  const id = generateUUID().substring(0, 8)
  const newResume: Omit<Resume, 'createdAt' | 'updatedAt'> = {
    ...DEFAULT_RESUME,
    id,
    title: `新建简历${id}`,
  }
  await createResume(newResume as Resume)
  await getAllResume()
}

const handleEditResume = (id: string) => {
  router.push(`/edit-resume/${id}`)
}

// ========== 删除单份简历相关状态 ==========
const oneDeleteOpen = ref(false)
const oneDeleteLoading = ref(false)

const handleDeleteResume = async (id: string) => {
  activeResumeId.value = id
  oneDeleteOpen.value = true
}

/**
 * 确认删除单份简历
 */
const handleOneDeleteOk = async () => {
  oneDeleteLoading.value = true
  try {
    await deleteResume(activeResumeId.value)
    await getAllResume()
    message.success('删除成功')
  } catch (error) {
    message.error(error instanceof Error ? error.message : '删除失败')
  } finally {
    oneDeleteLoading.value = false
    oneDeleteOpen.value = false
  }
}

// ========== 批量删除相关状态 ==========
const selectMode = ref(false)
const batchDeleteOpen = ref(false)
const batchDeleteLoading = ref(false)
const selectedIds = ref<string[]>([])

/**
 * 是否全选（所有简历都被选中）
 */
const allSelected = computed<boolean>(() => {
  return (
    resumes.value.length > 0 &&
    selectedIds.value.length === resumes.value.length
  )
})

/**
 * 是否部分选中（非全选非全不选，复选框 indeterminate 半选状态）
 */
const indeterminate = computed<boolean>(() => {
  return (
    selectedIds.value.length > 0 &&
    selectedIds.value.length < resumes.value.length
  )
})

/**
 * 全选 / 取消全选
 */
const onCheckAllChange = (e: any) => {
  selectedIds.value = e.target.checked ? resumes.value.map(item => item.id) : []
}

/**
 * 判断某份简历是否被选中
 */
const isSelected = (id: string): boolean => {
  return selectedIds.value.includes(id)
}

/**
 * 切换单份简历的选中状态
 */
const toggleSelect = (id: string): void => {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

/**
 * 切换多选模式
 * 退出多选模式时清空选择
 */
const toggleSelectMode = (): void => {
  selectMode.value = !selectMode.value
  if (!selectMode.value) {
    selectedIds.value = []
  }
}

/**
 * 卡片点击：多选模式下切换选中，非多选模式下进入编辑
 */
const handleCardClick = (item: Resume) => {
  if (selectMode.value) {
    toggleSelect(item.id)
  } else {
    handleEditResume(item.id)
  }
}

/**
 * 确认批量删除
 */
const handleBatchDeleteOk = async () => {
  const idsToDelete = [...selectedIds.value]
  const deleteCount = idsToDelete.length
  batchDeleteLoading.value = true
  try {
    await deleteBatchResume(idsToDelete)
    await getAllResume()
    message.success(`批量删除成功，共删除 ${deleteCount} 份简历`)
    selectedIds.value = []
    selectMode.value = false
  } catch (error) {
    message.error(error instanceof Error ? error.message : '批量删除失败')
  } finally {
    batchDeleteLoading.value = false
    batchDeleteOpen.value = false
  }
}

// ========== 导入配置相关状态 ==========
const openConfigModal = ref(false)
const importLoading = ref(false)

/**
 * 导入JSON配置
 */
const handleImportJSON = async () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.style.display = 'none'
  document.body.appendChild(input)

  const handleChange = async (e: Event) => {
    const file = (e.target as HTMLInputElement)?.files?.[0]
    if (!file) return
    importLoading.value = true
    try {
      const text = await file.text()
      const resume = JSON.parse(text)

      if (!resume.title || !resume.globalConfiguration) {
        throw new Error('无效的简历配置文件')
      }

      await createResume(resume)
      await getAllResume()
      message.success('导入配置成功')
    } catch (error) {
      console.error('导入配置失败', error)
      message.error(error instanceof Error ? error.message : '导入配置失败')
    } finally {
      input.removeEventListener('change', handleChange)
      document.body.removeChild(input)
      importLoading.value = false
      openConfigModal.value = false
    }
  }

  input.addEventListener('change', handleChange)
  input.click()
}

/**
 * 导入PDF配置
 */
const handleImportPDF = async () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.pdf'
  input.style.display = 'none'
  document.body.appendChild(input)

  const handleChange = async (e: Event) => {
    const file = (e.target as HTMLInputElement)?.files?.[0]
    if (!file) return
    importLoading.value = true
    try {
      const resume = await importPDF(file)
      message.success('PDF 解析成功，正在处理...')
      console.log('PDF 解析文本内容：', resume)
      await createResume(resume)
      await getAllResume()
      message.success('PDF 导入成功')
    } catch (error) {
      console.error('PDF 导入失败', error)
      message.error(error instanceof Error ? error.message : 'PDF 导入失败')
    } finally {
      input.removeEventListener('change', handleChange)
      document.body.removeChild(input)
      importLoading.value = false
      openConfigModal.value = false
    }
  }

  input.addEventListener('change', handleChange)
  input.click()
}

/** 格式化时间 */
const formatTime = (t?: number) => {
  if (!t) return '未更新'
  return dayjs(t).format('YYYY-MM-DD HH:mm')
}
</script>

<template>
  <div class="page page-my-resume">
    <!-- 删除单份简历弹窗 -->
    <a-modal
      v-model:open="oneDeleteOpen"
      title="删除简历"
      centered
      :confirm-loading="oneDeleteLoading"
      @ok="handleOneDeleteOk"
    >
      <p>确定删除该简历吗？删除后不可恢复</p>
    </a-modal>

    <!-- 批量删除简历确认弹窗 -->
    <a-modal
      v-model:open="batchDeleteOpen"
      title="批量删除简历"
      centered
      :confirm-loading="batchDeleteLoading"
      @ok="handleBatchDeleteOk"
    >
      <p>
        确定删除选中的
        <a-tag color="red">{{ selectedIds.length }}</a-tag>
        份简历吗？删除后不可恢复
      </p>
    </a-modal>

    <!-- 导入配置弹窗 -->
    <a-modal
      v-model:open="openConfigModal"
      title="选择导入文件类型"
      centered
      :footer="null"
      :closable="false"
      @cancel="() => (openConfigModal = false)"
    >
      <a-spin :spinning="importLoading">
        <div class="import-options">
          <a-card hoverable class="import-card" @click="handleImportJSON">
            <template #cover>
              <div class="import-icon json-icon">
                <plus-outlined />
              </div>
            </template>
            <a-card-meta
              title="JSON 导入"
              description="从本地 JSON 文件导入简历配置"
            />
          </a-card>

          <a-card hoverable class="import-card" @click="handleImportPDF">
            <template #cover>
              <div class="import-icon pdf-icon">
                <vertical-align-top-outlined />
              </div>
            </template>
            <a-card-meta
              title="PDF 导入(AI解析)"
              description="从本地 PDF 文件中提取简历内容，AI解析后导入"
            />
          </a-card>
        </div>
      </a-spin>
    </a-modal>

    <!-- ============ 页面头部 ============ -->
    <header class="page-header">
      <div>
        <h1 class="page-title">我的简历</h1>
        <p class="page-subtitle">
          {{ resumes.length }} 份简历 · 最新更新于 {{ latestUpdateText }}
        </p>
      </div>
      <div class="page-actions">
        <a-button
          type="primary"
          :disabled="selectMode"
          :icon="h(PlusOutlined)"
          @click="handleAddResume"
          >新建简历</a-button
        >
        <a-button
          :disabled="selectMode"
          :icon="h(VerticalAlignTopOutlined)"
          @click="() => (openConfigModal = true)"
          >导入配置</a-button
        >
        <a-button
          :icon="h(CheckSquareOutlined)"
          :type="selectMode ? 'primary' : 'default'"
          :danger="selectMode"
          @click="toggleSelectMode"
        >
          {{ selectMode ? '退出多选' : '批量管理' }}
        </a-button>
      </div>
    </header>

    <!-- ============ 批量操作栏（仅多选模式显示）============ -->
    <section v-if="selectMode" class="batch-bar">
      <div class="batch-left">
        <a-checkbox
          :checked="allSelected"
          :indeterminate="indeterminate"
          @change="onCheckAllChange"
        >
          全选
        </a-checkbox>
        <span class="selected-count">
          已选 <a-tag color="blue">{{ selectedIds.length }}</a-tag> / 共
          {{ resumes.length }} 份
        </span>
      </div>
      <a-button
        danger
        :disabled="selectedIds.length === 0"
        @click="() => (batchDeleteOpen = true)"
      >
        <template #icon><DeleteOutlined /></template>
        删除选中
      </a-button>
    </section>

    <!-- ============ 简历卡片网格 ============ -->
    <section v-if="resumes.length > 0" class="resume-grid">
      <article
        v-for="(item, i) in resumes"
        :key="item.id"
        class="resume-card"
        :class="{ selected: selectMode && isSelected(item.id) }"
        :style="{ animationDelay: `${i * 50}ms` }"
        @click="handleCardClick(item)"
      >
        <!-- 缩略图：实时渲染该简历对应模板（fit="width" 自适应卡片宽度）-->
        <div class="card-thumb">
          <TemplateThumb
            :template-id="item.templateId"
            :resume="item"
            fit="width"
          />
        </div>

        <div class="card-body">
          <h3 class="card-title">{{ item.title }}</h3>
          <p class="card-meta">更新于 {{ formatTime(item.updatedAt || 0) }}</p>
        </div>

        <div class="card-actions">
          <button
            class="card-action-btn"
            title="编辑"
            @click.stop="handleEditResume(item.id)"
          >
            <edit-outlined />
          </button>
          <button
            class="card-action-btn danger"
            title="删除"
            @click.stop="handleDeleteResume(item.id)"
          >
            <delete-outlined />
          </button>
        </div>

        <!-- 多选模式下的复选框 -->
        <div v-if="selectMode" class="card-check">
          <a-checkbox :checked="isSelected(item.id)" />
        </div>
      </article>
    </section>

    <a-empty v-else :image-style="{ height: '200px' }" description="暂无简历" />
  </div>
</template>

<style scoped lang="scss">
/* ============ 批量操作栏 ============ */
.batch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);

  .batch-left {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .selected-count {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);

    :deep(.ant-tag) {
      margin-inline-end: 4px;
    }
  }
}

/* ============ 简历卡片网格 ============ */
.resume-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--space-5);
}

.resume-card {
  position: relative;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  // Grid 子项 min-width:auto 会被内容撑开，设 0 让 grid 控制列宽
  min-width: 0;
  // flex column 让卡片内容纵向排列，card-body 可 flex:1 填满
  display: flex;
  flex-direction: column;
  transition:
    border-color var(--duration-base) var(--ease-out),
    box-shadow var(--duration-base) var(--ease-out);
  animation: fade-up var(--duration-slow) var(--ease-out) both;

  &:hover {
    border-color: var(--color-primary-border);
    box-shadow: var(--shadow-md);

    .card-actions {
      opacity: 1;
      transform: translateY(0);
    }
  }

  &.selected {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary);
  }
}

.card-thumb {
  width: 100%;
  // 高度自适应：scale 0.3 时 TemplateThumb 完整高度约 337px，不写死避免裁切
  display: flex;
  justify-content: center;
  padding: var(--space-4);
  background: var(--color-bg-muted);
  overflow: hidden;
  border-bottom: 1px solid var(--color-border);
}

.card-body {
  padding: var(--space-3) var(--space-4);
  // flex:1 填满卡片剩余空间，让同行卡片内 body 等高
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.card-actions {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  display: flex;
  gap: var(--space-1);
  opacity: 0;
  transform: translateY(-4px);
  transition:
    opacity var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-out);

  // 多选模式下隐藏操作按钮
  .resume-card.selected & {
    display: none;
  }
}

.card-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 16px;
  transition: all var(--duration-base) var(--ease-out);

  &:hover {
    color: var(--color-text);
    border-color: var(--color-border-strong);
  }

  &.danger:hover {
    color: var(--color-danger);
    border-color: var(--color-danger);
    background: var(--color-danger-bg);
  }
}

.card-check {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
}

/* ============ 导入弹窗 ============ */
.import-options {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
  justify-content: space-between;
  padding-top: var(--space-3);
}

.import-card {
  width: calc(50% - 8px);
  cursor: pointer;
  transition: transform var(--duration-base) var(--ease-out);

  &:hover {
    transform: translateY(-2px);
  }
}

.import-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  font-size: 36px;
  color: #fff;
  border-radius: var(--radius-md);
}

.json-icon {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
}

.pdf-icon {
  background: linear-gradient(135deg, #f04864 0%, #ff7a45 100%);
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
