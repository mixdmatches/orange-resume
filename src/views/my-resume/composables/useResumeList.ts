import { computed, ref } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { DEFAULT_RESUME } from '@/config/init-resume-data'
import {
  createResume,
  deleteResume,
  listResumes,
} from '@/service/resumeRepository'
import type { Resume } from '@/types/resume'
import { generateUUID } from '@/utils/uuid'
import storage from '@/utils/storage'

export const useResumeList = () => {
  const resumes = ref<Resume[]>([])
  /** 待删除的简历 id */
  const activeResumeId = ref<string>('')
  const oneDeleteOpen = ref(false)
  const oneDeleteLoading = ref(false)

  /** 最新更新时间文案 */
  const latestUpdateText = computed(() => {
    if (!resumes.value.length) return '暂无简历'
    const latest = resumes.value.reduce((max, cur) => {
      const t = cur.updatedAt ?? cur.createdAt
      return t > (max.updatedAt ?? max.createdAt) ? cur : max
    })
    return dayjs(latest.updatedAt ?? latest.createdAt).format(
      'YYYY-MM-DD HH:mm',
    )
  })

  // 获取所有简历
  const getAllResume = async () => {
    const res = await listResumes()
    // Repository 已按 updatedAt 倒序返回，这里兜底一次
    res.sort(
      (a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt),
    )
    resumes.value = res
  }

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
      // 清除本地编辑操作历史栈
      storage.remove(`resume-history:${activeResumeId.value}`)
      message.success('删除成功')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除失败')
    } finally {
      oneDeleteLoading.value = false
      oneDeleteOpen.value = false
    }
  }

  return {
    resumes,
    latestUpdateText,
    oneDeleteOpen,
    oneDeleteLoading,
    getAllResume,
    handleAddResume,
    handleDeleteResume,
    handleOneDeleteOk,
  }
}
