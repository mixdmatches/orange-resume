import type { AiConfigInput, AiConfigResult } from '@/types/ai-config'
import { del, get, post, put } from '@/utils/request'

/**
 * 保存厂商AI配置
 * @param data 单个AI配置
 * @returns 后端返回的 providerId
 */
export function addOrUpdateAiConfigApi(data: AiConfigInput) {
  return post<string>('/user/ai-config', data)
}

/**
 * 获取所有厂商AI配置
 */
export function getAiConfigApi() {
  return get<AiConfigResult[]>('/user/ai-config')
}

/**
 * 获取当前选中的厂商AI配置
 */
export function getCurrentAiConfig() {
  return get<{ baseUrl: string; modelId: string; apiKey: string }>(
    '/user/current-ai-config',
  )
}

/**
 * 删除厂商AI配置
 * @param providerId 厂商ID
 * @returns
 */
export function deleteAiConfigApi(providerId: string) {
  return del(`/user/ai-config/${providerId}`)
}

/**
 * 获取用户选择的模型和提示词
 * @returns
 */
export function getSelModelAndPromptApi() {
  return get<{ selectedProviderId?: string | null; polishPrompt?: string }>(
    '/user/ai-config/sel-model-and-prompt',
  )
}

/**
 * 设置用户选择的模型和提示词
 * @param data 包含选中模型ID和提示词的对象
 * @returns
 */
export function setSelModelAndPromptApi(data: {
  selectedProviderId?: string | null
  polishPrompt?: string
}) {
  return put<void>('/user/ai-config/sel-model-and-prompt', data)
}

export default {
  addOrUpdateAiConfigApi,
  getAiConfigApi,
  deleteAiConfigApi,
  getSelModelAndPromptApi,
  setSelModelAndPromptApi,
  getCurrentAiConfig,
}
