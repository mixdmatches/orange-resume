import type { AiConfigInput, AiConfigResult } from '@/types/ai-config'
import { del, get, post, put } from '@/utils/request'

/**
 * 保存厂商AI配置
 * 内置厂商（deepseek/doubao/openai 等）必传固定 providerId，后端按 id upsert；
 * 自定义厂商创建时不传 providerId，由后端生成
 * @param data 单个AI配置（自定义厂商创建时不含 providerId）
 * @returns 后端返回的 providerId（新建自定义厂商为生成的新 id）
 */
export function addOrUpdateAiConfigApi(data: AiConfigInput) {
  return post<string>('/user/ai-config', data)
}

/**
 * 获取所有厂商AI配置
 * 返回的 apiKeyCipher 为掩码（如 'sk-d****xG2k'），明文永不回传
 */
export function getAiConfigApi() {
  return get<AiConfigResult[]>('/user/ai-config')
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
