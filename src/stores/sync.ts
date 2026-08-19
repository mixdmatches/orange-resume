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
 * 云端同步状态
 * - synced：已同步，无待处理操作
 * - syncing：同步中，正在向云端推送
 * - pending：有待同步操作（断网期间累积）
 * - offline：离线，无法同步
 * - error：同步失败（重试上限）
 */
type CloudSyncStatus = 'synced' | 'syncing' | 'pending' | 'offline' | 'error'

/**
 * 同步状态管理 Store
 * 用于在 setting / my-resume / edit-resume 页面之间共享：
 *   1. 本地目录文件同步结果（旧功能保留）
 *   2. 云端同步状态与待同步条数（Local-First 架构新增）
 */
export const useSyncStore = defineStore('sync', () => {
  // 本地目录文件同步结果
  const syncResult = ref<SyncResult | null>(null)

  // 是否正在同步（本地目录）
  const isSyncing = ref(false)

  // 云端同步状态（Local-First 架构）
  const cloudStatus = ref<CloudSyncStatus>('synced')

  // 云端待同步条数
  const cloudPending = ref<number>(0)

  /**
   * 更新本地目录同步结果
   */
  const updateSyncResult = (result: SyncResult) => {
    syncResult.value = result
  }

  /**
   * 清除本地目录同步结果
   */
  const clearSyncResult = () => {
    syncResult.value = null
  }

  /**
   * 设置云端同步状态
   * @param status 云端同步状态枚举
   */
  const setCloudStatus = (status: CloudSyncStatus) => {
    cloudStatus.value = status
  }

  /**
   * 设置云端待同步条数
   * @param count 待同步操作数
   */
  const setCloudPending = (count: number) => {
    cloudPending.value = count
  }

  return {
    syncResult,
    isSyncing,
    cloudStatus,
    cloudPending,
    updateSyncResult,
    clearSyncResult,
    setCloudStatus,
    setCloudPending,
  }
})
