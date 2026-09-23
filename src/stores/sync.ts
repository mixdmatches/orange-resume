import { defineStore } from 'pinia'
import { ref } from 'vue'

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
 *   云端同步状态与待同步条数（Local-First 架构）
 */
export const useSyncStore = defineStore('sync', () => {
  // 云端同步状态（Local-First 架构）
  const cloudStatus = ref<CloudSyncStatus>('synced')

  // 云端待同步条数
  const cloudPending = ref<number>(0)

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
    cloudStatus,
    cloudPending,
    setCloudStatus,
    setCloudPending,
  }
})
