<script setup lang="ts">
import { FolderOpenOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import {
  getConfigIDB,
  getFileHandleIDB,
  saveConfigIDB,
  saveFileHandleIDB,
  verifyPermission,
} from '@/service/fileIDB'
import { syncResumeFromDirectory } from '@/utils/resumeSync'
import { useSyncStore } from '@/stores/sync'

const directoryHandle = ref<FileSystemDirectoryHandle | null>(null)
const folderPath = ref<string>('')
const syncStore = useSyncStore()

/**
 * 初始化同步目录
 */
onMounted(async () => {
  try {
    const handle = await getFileHandleIDB('syncDirectory')
    const path = await getConfigIDB('syncDirectoryPath')
    if (handle && path) {
      const hasPermission = await verifyPermission(
        handle as FileSystemDirectoryHandle,
      )
      if (hasPermission) {
        directoryHandle.value = handle as FileSystemDirectoryHandle
        folderPath.value = path as string
      }
    }
  } catch (error) {
    console.error('获取同步目录失败:', error)
  }
})

/**
 * 选择同步目录
 */
const handleSelectDir = async () => {
  try {
    syncStore.isSyncing = true
    const handle = await window.showDirectoryPicker({ mode: 'readwrite' })
    const hasPermission = await verifyPermission(handle)
    if (hasPermission) {
      directoryHandle.value = handle
      folderPath.value = handle.name
      await saveFileHandleIDB('syncDirectory', handle)
      await saveConfigIDB('syncDirectoryPath', handle.name)

      // 执行同步并保存结果到Store
      const result = await syncResumeFromDirectory()
      syncStore.updateSyncResult(result)

      message.success(`已选择目录：${handle.name}`)
    }
  } catch (error) {
    console.error('选择目录失败:', error)
  } finally {
    syncStore.isSyncing = false
  }
}

/**
 * 清除已选择的目录
 */
const handleClearDir = async () => {
  directoryHandle.value = null
  folderPath.value = ''
  await saveConfigIDB('syncDirectoryPath', '')
  await saveFileHandleIDB('syncDirectory', null)
  syncStore.clearSyncResult()
}
</script>

<template>
  <div class="setting">
    <a-card>
      <template #title>
        <div class="setting-title">
          <FolderOpenOutlined :style="{ fontSize: '16px' }" /> 同步目录
        </div>
      </template>
      <p>选择一个文件夹来同步和备份您的简历</p>
      <div class="setting-content">
        <span class="setting-dir"
          ><FolderOpenOutlined />
          {{ directoryHandle ? folderPath : '请选择目录' }}</span
        >
        <a-button size="large" type="primary" @click="handleSelectDir"
          >选择文件目录</a-button
        >
        <a-button size="large" type="primary" danger @click="handleClearDir">
          <DeleteOutlined />
        </a-button>
      </div>
    </a-card>
  </div>
</template>

<style scoped lang="scss">
.setting-content {
  display: flex;
  align-items: center;
  gap: 1rem;

  .setting-dir {
    flex: 1;
    border: 1px solid #d9d9d9;
    background-color: #fcfcfd;
    padding: 8px 16px;
    border-radius: 8px;
  }
}
</style>
