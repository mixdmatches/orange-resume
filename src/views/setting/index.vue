<script setup lang="ts">
import { FolderOpenOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  deleteSettingIDB,
  getSettingIDB,
  saveSettingIDB,
} from '@/service/indexDB'

interface DirHandle {
  name: string
  kind: string
}

const handle = ref<DirHandle>({ name: '', kind: '' })

/**
 * 初始化时从 indexDB 恢复目录信息
 */
onMounted(async () => {
  const savedDir = await getSettingIDB('syncDir')
  if (savedDir) {
    try {
      const dirInfo = JSON.parse(savedDir as string)
      handle.value = {
        name: dirInfo.name || '',
        kind: dirInfo.kind || '',
      }
    } catch (e) {
      console.error('解析目录信息失败', e)
    }
  }
})

/**
 * 选择同步目录
 */
const handleSelectDir = async () => {
  try {
    const dirHandle: FileSystemDirectoryHandle =
      await window.showDirectoryPicker({ mode: 'readwrite' })

    handle.value = {
      name: dirHandle.name,
      kind: dirHandle.kind,
    }
    // 使用indexDB存储目录信息
    await saveSettingIDB('syncDir', JSON.stringify(handle.value))
    message.success('目录选择成功')
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.error('选择目录失败:', err)
      message.error('选择目录失败')
    }
  }
}

/**
 * 清除已选择的目录
 */
const handleClearDir = async () => {
  handle.value = { name: '', kind: '' }
  // 使用indexDB清除目录信息
  await deleteSettingIDB('syncDir')
  message.success('已清除目录设置')
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
          ><FolderOpenOutlined /> {{ handle.name || '请选择目录' }}</span
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
