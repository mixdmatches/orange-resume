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
  FileTextOutlined,
  FilePdfOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import { computed, h, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { importPDF } from '@/utils/importPDF'

const router = useRouter()

const activeResumeId = ref<string>('')

const resumes = ref<Resume[]>([])

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
  const id = crypto.randomUUID().substring(0, 8)
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
 * 派生状态：由 selectedIds 和 resumes 长度计算得出
 */
const allSelected = computed<boolean>(() => {
  return (
    resumes.value.length > 0 &&
    selectedIds.value.length === resumes.value.length
  )
})

/**
 * 是否部分选中（非全选非全不选，用于复选框的 indeterminate 半选状态）
 * 派生状态：由 selectedIds 和 resumes 长度计算得出
 */
const indeterminate = computed<boolean>(() => {
  return (
    selectedIds.value.length > 0 &&
    selectedIds.value.length < resumes.value.length
  )
})

/**
 * 全选 / 取消全选
 * 根据 checkbox 的 checked 状态批量设置 selectedIds
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
    // 删除成功后清空选择，退出多选模式
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

      // 验证数据结构
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
      // 清理 input 元素
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
</script>

<template>
  <div class="my-resume">
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
                <FileTextOutlined />
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
                <FilePdfOutlined />
              </div>
            </template>
            <a-card-meta
              title="PDF 导入(AI解析)"
              description="从本地 PDF 文件中提取简历内容，AI解析后导入，用时较长但解析精准"
            />
          </a-card>
        </div>
      </a-spin>
    </a-modal>

    <div class="work">
      <a-space wrap>
        <a-button
          type="primary"
          size="large"
          :disabled="selectMode"
          :icon="h(PlusOutlined)"
          @click="handleAddResume"
          >新建简历</a-button
        >
        <a-button
          size="large"
          :disabled="selectMode"
          :icon="h(VerticalAlignTopOutlined)"
          @click="() => (openConfigModal = true)"
          >导入配置</a-button
        >
        <a-button
          size="large"
          :icon="h(CheckSquareOutlined)"
          :type="selectMode ? 'primary' : 'default'"
          :danger="selectMode"
          @click="toggleSelectMode"
        >
          {{ selectMode ? '退出多选' : '批量管理' }}
        </a-button>

        <!-- 多选模式下的操作栏 -->
        <template v-if="selectMode">
          <!-- 全选复选框 -->
          <a-checkbox
            :checked="allSelected"
            :indeterminate="indeterminate"
            @change="onCheckAllChange"
          >
            全选
          </a-checkbox>
          <!-- 已选数量提示 -->
          <span class="selected-count">
            已选
            <a-tag color="blue">{{ selectedIds.length }}</a-tag> / 共
            {{ resumes.length }} 份
          </span>
          <!-- 批量删除按钮 -->
          <a-button
            size="large"
            danger
            :disabled="selectedIds.length === 0"
            @click="() => (batchDeleteOpen = true)"
          >
            <template #icon><DeleteOutlined /></template>
            删除选中
          </a-button>
        </template>
      </a-space>
    </div>

    <!-- 简历卡片展示 -->
    <div v-if="resumes.length > 0" class="resumes">
      <a-card
        v-for="item in resumes"
        :key="item.id"
        v-motion
        :while-hover="selectMode ? {} : { scale: 1.2 }"
        :while-press="selectMode ? {} : { scale: 0.8 }"
        :initial="{ opacity: 0, y: 30 }"
        :animate="{ opacity: 1, y: 0 }"
        :exit="{ opacity: 0, scale: 0 }"
        :transition="{
          type: 'spring',
          visualDuration: 0.6,
          bounce: 0.4,
          delay: 0.3,
        }"
        hoverable
        :class="{ 'card-selected': selectMode && isSelected(item.id) }"
        @click="selectMode && toggleSelect(item.id)"
      >
        <!-- 多选模式下的复选框 -->
        <template #actions>
          <template v-if="!selectMode">
            <edit-outlined key="edit" @click="handleEditResume(item.id)" />
            <DeleteOutlined
              key="delete"
              style="color: #ff4d4f"
              @click="handleDeleteResume(item.id)"
            />
          </template>
          <!-- 多选模式下 actions 区域显示选择提示 -->
          <div v-else @click.stop="toggleSelect(item.id)">
            <a-checkbox :checked="isSelected(item.id)" />
          </div>
        </template>
        <a-card-meta
          :title="item.title"
          :description="`创建：${dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}`"
        >
        </a-card-meta>
        <a-card-meta
          :description="`更新：${item.updatedAt ? dayjs(item.updatedAt).format('YYYY-MM-DD HH:mm') : '未更新'}`"
        >
        </a-card-meta>
      </a-card>
    </div>
    <a-empty v-else :image-style="{ height: '200px' }" description="暂无简历" />
  </div>
</template>

<style scoped lang="scss">
.add-resume {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 70px;
  line-height: 70px;
  text-align: center;
  border-radius: 1rem;
  border: 1px dashed $primary-color;
  font-size: 1.4rem;
  transition: all 0.3s ease-in-out;
  cursor: pointer;
  margin-bottom: 2rem;
  &:hover {
    background-color: $primary-color;
    color: #fff;
  }
}
.resumes {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-gap: 2rem;
  .card-selected {
    border: 2px solid #1677ff;
    box-shadow: 0 4px 12px rgba(22, 119, 255, 0.25);
    cursor: pointer;
  }
}
.work {
  margin-bottom: 2rem;
}

.import-options {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: space-between;
  padding-top: 12px;
}

.import-card {
  width: calc(50% - 8px);
  cursor: pointer;
  transition: transform 0.3s;
}

.import-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  font-size: 36px;
  color: #fff;
  border-radius: 8px;
}

.json-icon {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
}

.pdf-icon {
  background: linear-gradient(135deg, #f04864 0%, #ff7a45 100%);
}

.import-card:hover {
  transform: translateY(-4px);
}

.selected-count {
  font-size: 14px;
  margin-left: 8px;
  @include themify(
    (
      color: $text-color,
    )
  );
  :deep(.ant-tag) {
    margin-inline-end: 4px;
  }
}
</style>
