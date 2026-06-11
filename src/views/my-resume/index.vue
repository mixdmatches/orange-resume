<script setup lang="ts">
import { DEFAULT_RESUME } from '@/config/init-resume-data'
import {
  addResumeIDB,
  deleteResumeIDB,
  getAllResumesIDB,
} from '@/service/resumeIDB'
import type { Resume } from '@/types/resume'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  VerticalAlignTopOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  FilePdfOutlined,
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import { h, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message, notification } from 'ant-design-vue'
import { getConfigIDB, getFileHandleIDB } from '@/service/fileIDB'
import { useSyncStore } from '@/stores/sync'
import { importPDF } from '@/utils/importPDF'

const router = useRouter()

const activeResumeId = ref<string>('')

const resumes = ref<Resume[]>([])

/**
 * 获取所有简历
 */
const getAllResume = async () => {
  const res = await getAllResumesIDB()
  res.sort((a, b) => b.createdAt - a.createdAt)
  resumes.value = res
}

onMounted(() => {
  getAllResume()
})

/**
 * 创建简历
 */
const handleAddResume = async () => {
  const newResume: Omit<Resume, 'createdAt' | 'updatedAt'> = {
    ...DEFAULT_RESUME,
    id: crypto.randomUUID().substring(0, 5),
  }
  newResume.title = `新建简历${crypto.randomUUID().substring(0, 5)}`

  await addResumeIDB(newResume)
  await getAllResume()
}

const handleEditResume = (id: string) => {
  router.push(`/edit-resume/${id}`)
}

const handleDeleteResume = async (id: string) => {
  activeResumeId.value = id
  open.value = true
}

const open = ref(false)
const confirmLoading = ref(false)

/**
 * 确认删除简历
 */
const handleOk = async () => {
  confirmLoading.value = true
  try {
    await deleteResumeIDB(activeResumeId.value)
    await getAllResume()
    message.success('删除成功')
  } catch (error) {
    message.error(error instanceof Error ? error.message : '删除失败')
  } finally {
    confirmLoading.value = false
    open.value = false
  }
}

// 导入配置弹窗开关
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

      await addResumeIDB(resume)
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
      await addResumeIDB(resume)
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

const transition = {
  type: 'spring',
  visualDuration: 0.6,
  bounce: 0.4,
}

const syncStore = useSyncStore()

const hasDirConfig = ref(false)
const folderPath = ref<string>('')

onMounted(async () => {
  const dirHandle = await getFileHandleIDB('syncDirectory')
  const path = await getConfigIDB('syncDirectoryPath')
  if (dirHandle && path) {
    folderPath.value = path
    hasDirConfig.value = true
  } else {
    hasDirConfig.value = false
    if (!document.querySelector('.ant-notification-notice'))
      notification.error({
        message: '同步目录未配置',
        description: '同步目录未配置，将无法自动备份您的简历数据',
      })
  }
})
</script>

<template>
  <div class="my-resume">
    <!-- 删除简历弹窗 -->
    <a-modal
      v-model:open="open"
      title="删除简历"
      :confirm-loading="confirmLoading"
      @ok="handleOk"
    >
      <p>确定删除该简历吗？删除后不可恢复</p>
    </a-modal>

    <!-- 导入配置弹窗 -->
    <a-modal
      v-model:open="openConfigModal"
      title="选择导入文件类型"
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
      <a-space>
        <a-button
          type="primary"
          size="large"
          :icon="h(PlusOutlined)"
          @click="handleAddResume"
          >新建简历</a-button
        >
        <a-button
          size="large"
          :icon="h(VerticalAlignTopOutlined)"
          @click="() => (openConfigModal = true)"
          >导入配置</a-button
        >
      </a-space>
    </div>

    <!-- 同步结果显示 -->
    <div v-if="syncStore.syncResult" class="sync-result">
      <a-alert
        message="同步完成"
        type="info"
        show-icon
        closable
        @close="syncStore.clearSyncResult()"
      >
        <template #description>
          <div class="sync-stats">
            <span class="sync-stat">
              <CheckCircleOutlined class="stat-icon synced" />
              同步: <strong>{{ syncStore.syncResult.synced }}</strong>
            </span>
            <span class="sync-stat">
              <ExclamationCircleOutlined class="stat-icon skipped" />
              跳过: <strong>{{ syncStore.syncResult.skipped }}</strong>
            </span>
            <span class="sync-stat">
              <CloseCircleOutlined class="stat-icon failed" />
              失败: <strong>{{ syncStore.syncResult.failed }}</strong>
            </span>
          </div>
        </template>
      </a-alert>
    </div>

    <!-- 简历卡片展示 -->
    <div v-if="resumes.length > 0" class="resumes">
      <a-card
        v-for="item in resumes"
        :key="item.id"
        v-motion
        :while-hover="{ scale: 1.2 }"
        :while-press="{ scale: 0.8 }"
        :initial="{ opacity: 0, y: 30 }"
        :animate="{ opacity: 1, y: 0 }"
        :exit="{ opacity: 0, scale: 0 }"
        :transition="{ ...transition, delay: 0.3 }"
        hoverable
      >
        <template #actions>
          <edit-outlined key="edit" @click="handleEditResume(item.id)" />
          <DeleteOutlined
            key="delete"
            style="color: #ff4d4f"
            @click="handleDeleteResume(item.id)"
          />
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
}
.work {
  margin-bottom: 2rem;
}

.sync-result {
  margin-bottom: 2rem;

  .sync-stats {
    display: flex;
    gap: 24px;
    margin-top: 8px;

    .sync-stat {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;

      .stat-icon {
        font-size: 16px;

        &.synced {
          color: #52c41a;
        }

        &.skipped {
          color: #faad14;
        }

        &.failed {
          color: #ff4d4f;
        }
      }

      strong {
        font-weight: 600;
      }
    }
  }
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
</style>
