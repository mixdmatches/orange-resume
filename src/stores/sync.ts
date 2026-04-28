import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 同步结果接口
 */
interface SyncResult {
  skipped: number // 跳过的文件数
  synced: number // 同步的文件数
  failed: number // 失败的文件数
}

/**
 * 同步状态管理 Store
 * 用于在 setting 和 my-resume 页面之间共享同步结果
 */
export const useSyncStore = defineStore('sync', () => {
  // 同步结果
  const syncResult = ref<SyncResult | null>(null)

  // 是否正在同步
  const isSyncing = ref(false)

  /**
   * 更新同步结果
   */
  const updateSyncResult = (result: SyncResult) => {
    syncResult.value = result
  }

  /**
   * 清除同步结果
   */
  const clearSyncResult = () => {
    syncResult.value = null
  }

  return {
    syncResult,
    isSyncing,
    updateSyncResult,
    clearSyncResult,
  }
})
