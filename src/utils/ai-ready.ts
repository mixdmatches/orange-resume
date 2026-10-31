import { message } from 'ant-design-vue'
import { getAiConfigApi, getSelModelAndPromptApi } from '@/api'

export async function ensureAiProviderReady(): Promise<boolean> {
  // 并行拉取：用户选中的服务商偏好 + 全部服务商配置（apiKeyCipher 为掩码，可判断是否已配置 Key）
  const [preference, configs] = await Promise.all([
    getSelModelAndPromptApi(),
    getAiConfigApi(),
  ])

  // 1. 必须已选择服务商（未选择时后端返回空字符串）
  if (!preference.selectedProviderId) {
    message.warning(
      '请先前往「个人中心 -> AI配置商 -> 模型偏好选择模型」选择并保存要使用的 AI 服务商',
    )
    return false
  }

  // 2. 选中的服务商必须有配置记录（如配置被删除后偏好未同步）
  const provider = configs.find(
    c => c.providerId === preference.selectedProviderId,
  )
  if (!provider) {
    message.warning(
      '选中的 AI 服务商配置已失效，请前往「设置 → AI 服务商」重新选择并保存',
    )
    return false
  }

  // 3. 必须已配置 API Key（后端返回掩码，未配置时为空字符串）
  if (!provider.apiKeyCipher) {
    message.warning(
      `AI 服务商「${provider.providerName}」尚未配置 API Key，请前往「设置 → AI 服务商」补全`,
    )
    return false
  }

  return true
}
