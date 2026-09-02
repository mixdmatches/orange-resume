export interface APIManufacturer {
  id: string
  name: string
  icon: string
  hint: string
  apiKey: string
  modelId?: string
  apiEndpoint: string
  providerName?: string
}

export interface APIState {
  polishPrompt?: string
  selectedModel?: string | null
  states: APIManufacturer[]
}
