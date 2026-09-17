import type { APIManufacturer } from '@/types/ai-config'

/** 内置固定厂商的 id 列表（始终存在，不可删除） */
export const BUILTIN_PROVIDER_IDS = ['deepseek', 'doubao', 'openai']

/** 内置固定厂商的默认配置 */
export const BUILTIN_PROVIDERS: APIManufacturer[] = [
  {
    providerId: 'deepseek',
    providerName: 'DeepSeek',
    icon: '🤖',
    hint: '在DeepSeek获取 API 密钥',
    modelId: '',
    apiKeyEnc: '',
    apiEndpoint: 'https://api.deepseek.com',
  },
  {
    providerId: 'doubao',
    providerName: '豆包',
    icon: '🧉',
    hint: '在火山引擎获取 API 密钥',
    apiKeyEnc: '',
    apiEndpoint: 'https://ark.cn-beijing.volces.com/api/v3',
    modelId: '',
  },
  {
    providerId: 'openai',
    providerName: 'OpenAI',
    icon: '🔮',
    hint: '在 OpenAI 平台获取 API 密钥',
    apiKeyEnc: '',
    apiEndpoint: 'https://api.openai.com/v1',
    modelId: '',
  },
]

/**
 * 获取厂商的固定 UI 信息（图标/名称/提示文案）
 * 纯前端固定数据：不持久化到本地、不传后端，按 providerId 实时推导
 * @param providerId - 厂商 id（新建未保存草稿可能为空，按自定义供应商推导）
 * @param providerName - 自定义供应商的用户填写名称（仅自定义厂商用于显示名）
 */
export function getProviderUI(
  providerId?: string,
  providerName?: string,
): Pick<APIManufacturer, 'icon' | 'providerName' | 'hint'> {
  const builtin = BUILTIN_PROVIDERS.find(item => item.providerId === providerId)
  if (builtin) {
    return {
      icon: builtin.icon,
      providerName: builtin.providerName,
      hint: builtin.hint,
    }
  }
  return {
    icon: '⚙️',
    providerName: providerName?.trim() || '自定义供应商',
    hint: '配置兼容 OpenAI 格式的自定义 AI 提供商（如 OpenRouter）',
  }
}

/** 默认 AI 润色提示词 */
export const DEFAULT_POLISH_PROMPT = `你是一个专业的简历优化助手。请帮助优化以下文本，使其更加专业和有吸引力。
优化原则：
1. 使用更专业的词汇和表达方式
2. 突出关键成就和技能
3. 保持简洁清晰
4. 使用主动语气
5. 保持原有信息的完整性
6. 保留我输入的格式
请直接返回优化后的文本，不要包含任何解释或其他内容。`
