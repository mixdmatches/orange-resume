import { del, get, post, put } from '@/utils/request'
import type { ListResult, Resume } from '@/types/resume'

/**
 * 把完整 Resume 转成后端 ResumeDto 期望的入参
 * 后端 content 字段存的就是完整 Resume 对象（除 id/createdAt/updatedAt 外）
 * id 字段：创建场景时会传给后端，后端优先使用前端生成的 id，保证前后端一致
 * @param resume 完整简历对象
 */
export const ResumetoPayload = (resume: Resume) => {
  const {
    basic,
    educations,
    internships,
    projects,
    skills,
    customData,
    globalConfiguration,
    menuSections,
  } = resume
  return {
    id: resume.id,
    templateId: resume.templateId,
    title: resume.title,
    content: {
      basic,
      educations,
      internships,
      projects,
      skills,
      customData,
      globalConfiguration,
      menuSections,
    },
  }
}

/**
 * 获取当前用户的简历列表
 * @returns 简历记录数组（按更新时间倒序）
 */
export function getResumeListApi(): Promise<ListResult> {
  return get<ListResult>('/resumes')
}

/**
 * 获取单条简历详情
 * @param id - 简历 ID
 */
export function getResumeByIdApi(id: string): Promise<Resume> {
  return get<Resume>(`/resumes/${id}`)
}

/**
 * 新建简历
 * @param resume - 简历标题与内容
 * @returns 创建后的完整记录（含后端生成的 id）
 */
export function createResumeApi(resume: Resume): Promise<{ id: string }> {
  return post<{ id: string }>('/resumes', ResumetoPayload(resume))
}

/**
 * 更新简历
 * @param id - 简历 ID
 * @param resume - 简历标题与内容
 * @returns 更新后的完整记录
 */
export function updateResumeApi(
  id: string,
  resume: Resume,
): Promise<{ id: string; updatedAt: number }> {
  return put<{ id: string; updatedAt: number }>(
    `/resumes/${id}`,
    ResumetoPayload(resume),
  )
}

/**
 * 删除简历
 * @param id - 简历 ID
 */
export function deleteResumeApi(id: string): Promise<{ success: true }> {
  return del<{ success: true }>(`/resumes/${id}`)
}

/**
 * 删除多份简历
 * @param ids - 简历 ID 数组
 */
export function deleteBatchResumeApi(
  ids: string[],
): Promise<{ success: true }> {
  return del<{ success: true }>(`/resumes/batch`, { data: ids })
}

/**
 * 复制简历
 * @param id - 简历 ID
 * @returns 新的简历 ID
 */
export const duplicateResumeApi = (id: string) =>
  post<{ newId: string }>(`/resumes/${id}/duplicate`)

export default {
  getResumeListApi,
  getResumeByIdApi,
  createResumeApi,
  updateResumeApi,
  deleteResumeApi,
  duplicateResumeApi,
}
