export interface AiConfig {
  providerId: string // 厂商ID
  providerName: string // 厂商名字
  /** API Key：保存时传明文（HTTPS 保护）；未修改时传空字符串，后端保留原密文；表单回显场景存掩码 */
  apiKeyEnc: string
  modelId: string //模型ID
  apiEndpoint: string //API地址
}

export interface AiConfigResult {
  providerId: string
  providerName: string
  apiKeyCipher: string // 掩码后的字符串，如 'sk-d****xG2k'
  modelId: string
  apiEndpoint: string
}

/**
 * 保存配置入参（创建/更新通用）
 * 内置厂商（deepseek/doubao/openai 等）必传固定 providerId，后端按 id upsert；
 * 自定义厂商创建时不传 providerId，由后端生成并返回
 */
export interface AiConfigInput extends Omit<AiConfig, 'providerId'> {
  providerId?: string
}

/**
 * 厂商配置（本地编辑状态）
 * 基于去掉必选 id 的 AiConfig 派生：新建自定义厂商草稿尚未保存时无 providerId
 * （空字符串/undefined 占位），保存成功后由后端生成真实 id 回填
 */
export interface APIManufacturer extends Omit<AiConfig, 'providerId'> {
  /** 厂商ID：已保存厂商必有；新建未保存草稿为空占位 */
  providerId?: string
  /** 图标（前端固定 UI 数据，由 getProviderUI 按 id 推导，不持久化/不传后端） */
  icon?: string
  /** 提示文案（前端固定 UI 数据，由 getProviderUI 按 id 推导，不持久化/不传后端） */
  hint?: string
}

export interface APIState {
  polishPrompt?: string
  selectedProviderId?: string | null
  states: APIManufacturer[]
}
