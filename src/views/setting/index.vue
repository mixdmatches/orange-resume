<script setup lang="ts">
import { FolderOpenOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'

const handle = ref<{ name: string; kind: string }>({ name: '', kind: '' })
const handleSelectDir = async () => {
  try {
    const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' })
    console.log('Selected directory:', dirHandle)
    handle.value = dirHandle
  } catch (err) {
    console.error('Error selecting directory:', err)
  }
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
        <a-button size="large" type="primary" danger
          ><DeleteOutlined
        /></a-button>
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
