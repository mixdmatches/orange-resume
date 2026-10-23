import { computed, ref, type Ref } from 'vue'
import { message } from 'ant-design-vue'
import { deleteBatchResume } from '@/service/resumeRepository'
import type { Resume } from '@/types/resume'
import storage from '@/utils/storage'

/**
 * 批量管理：多选模式 / 选中状态维护 / 批量删除
 * @param options.resumes - 简历列表（用于全选与半选状态计算）
 * @param options.refresh - 批量删除成功后刷新简历列表
 */
export const useBatchSelect = (options: {
  resumes: Ref<Resume[]>
  refresh: () => Promise<void> | void
}) => {
  const { resumes, refresh } = options

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
  const checkAll = (checked: boolean) => {
    selectedIds.value = checked ? resumes.value.map(item => item.id) : []
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
      await refresh()
      for (const id of idsToDelete) {
        storage.remove(`resume-history:${id}`)
      }
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

  return {
    selectMode,
    batchDeleteOpen,
    batchDeleteLoading,
    selectedIds,
    allSelected,
    indeterminate,
    checkAll,
    isSelected,
    toggleSelect,
    toggleSelectMode,
    handleBatchDeleteOk,
  }
}
