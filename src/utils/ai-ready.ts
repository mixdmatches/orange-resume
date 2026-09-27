import { message } from 'ant-design-vue'
import { getAiConfigApi, getSelModelAndPromptApi } from '@/api/ai-config'

/**
 * AI 服务就绪预检查
 *
 * 在发起任何 AI 调用（AI 对话 / AI 面试）前调用，校验：
 * 1. 已在设置页「选择并保存」AI 服务商（偏好记录存在）
 * 2. 选中的服务商仍有配置记录
 * 3. 该服务商已配置 API Key
 *
 * 任一条件不满足时弹出 warning 提示并返回 false，调用方据此中止，
 * 避免发出注定失败的请求（后端会以"请先在设置中选择 AI 服务商"拒绝）
 *
 * @returns true=就绪可发起 AI 调用；false=未就绪（内部已弹提示）
 */
export async function ensureAiProviderReady(): Promise<boolean> {
  // 并行拉取：用户选中的服务商偏好 + 全部服务商配置（apiKeyCipher 为掩码，可判断是否已配置 Key）
  const [preference, configs] = await Promise.all([
    getSelModelAndPromptApi(),
    getAiConfigApi(),
  ])

  // 1. 必须已选择服务商（未选择时后端返回空字符串）
  if (!preference.selectedProviderId) {
    message.warning('请先前往「设置 → AI 服务商」选择并保存要使用的 AI 服务商')
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
