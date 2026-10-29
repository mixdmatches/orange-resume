<script setup lang="ts">
import type { AiConfigInput, APIManufacturer } from '@/types/ai-config'
import { message, Modal } from 'ant-design-vue'
import {
  ApiOutlined,
  DeleteOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  PlusOutlined,
  SlidersOutlined,
} from '@ant-design/icons-vue'
import { computed, h, onBeforeMount, ref } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import {
  BUILTIN_PROVIDER_IDS,
  BUILTIN_PROVIDERS,
  DEFAULT_POLISH_PROMPT,
  getProviderUI,
} from '@/constants/ai'
import SettingForm from './SettingForm.vue'
import PreferenceForm from './PreferenceForm.vue'
import {
  addOrUpdateAiConfigApi,
  deleteAiConfigApi,
  getAiConfigApi,
  getSelModelAndPromptApi,
  setSelModelAndPromptApi,
  testConnectionApi,
} from '@/api'

/** 加载中标记：后端数据就绪前不渲染表单区 */
const loading = ref(true)

const router = useRouter()

/** 已保存的厂商配置列表（后端数据"真源"） */
const savedStates = ref<APIManufacturer[]>([])

/** 当前使用的模型厂商 id（偏好表单保存后持久化到后端） */
const selectedProviderId = ref<string>('deepseek')

/** 已保存的润色提示词（偏好表单保存后的"真源"） */
const savedPolishPrompt = ref<string>(DEFAULT_POLISH_PROMPT)

/** 已保存的当前选中模型 id（偏好保存后的"真源"，用于判断偏好是否被修改） */
const savedSelectedProviderId = ref<string>('deepseek')

onBeforeMount(async () => {
  try {
    await loadAiConfigData()
  } finally {
    loading.value = false
  }
})

/**
 * 从后端拉取厂商配置列表并更新 savedStates（含最新掩码）
 * 仅刷新列表数据，不重置编辑状态
 */
async function refreshSavedStates() {
  const aiConfigs = await getAiConfigApi()
  const normalized = aiConfigs.map(item => ({
    providerId: item.providerId,
    providerName: item.providerName,
    apiKeyEnc: item.apiKeyCipher,
    modelId: item.modelId,
    apiEndpoint: item.apiEndpoint,
  }))

  // 内置厂商：始终存在，已保存的配置覆盖默认值
  const builtinStates = BUILTIN_PROVIDERS.map(builtin => {
    const saved = normalized.find(
      item => item.providerId === builtin.providerId,
    )
    return saved ? { ...builtin, ...saved } : { ...builtin }
  })

  // 自定义供应商：非内置 id 的全部保留
  const customStates = normalized.filter(
    item => !BUILTIN_PROVIDER_IDS.includes(item.providerId),
  )
  // 统一剥离固定 UI 字段，状态内只保留用户数据
  savedStates.value = [...builtinStates, ...customStates].map(pickPersisted)
}

/**
 * 从后端加载 AI 配置并初始化各状态
 * 厂商配置、当前选中模型、润色提示词三者独立存储
 */
async function loadAiConfigData() {
  const [, userAi] = await Promise.all([
    refreshSavedStates(),
    getSelModelAndPromptApi(),
  ])

  // 当前使用的模型若已失效（如被删除），回退到 DeepSeek
  const storedSelected = userAi?.selectedProviderId
  selectedProviderId.value =
    storedSelected &&
    savedStates.value.some(item => item.providerId === storedSelected)
      ? storedSelected
      : 'deepseek'

  savedPolishPrompt.value = userAi?.polishPrompt || DEFAULT_POLISH_PROMPT
  // 偏好"真源"同步：选中模型的已保存基准
  savedSelectedProviderId.value = selectedProviderId.value

  // 数据就绪后，基于真实数据初始化编辑状态
  currentEditId.value = selectedProviderId.value
  formDraft.value = cloneDraft()
  polishPromptDraft.value = savedPolishPrompt.value
}

/** 当前正在编辑的厂商 id（数据加载完成后会重新赋值） */
const currentEditId = ref<string>('deepseek')

/** 右侧激活视图：'provider' 厂商配置 / 'preference' 模型偏好 */
const activeTab = ref<'provider' | 'preference'>('provider')

/** 配置弹窗是否打开（厂商配置填写表单统一在弹窗内完成） */
const configModalOpen = ref(false)

/** 弹窗模式：'create' 新建自定义供应商 / 'edit' 编辑已有厂商 */
const modalMode = ref<'create' | 'edit'>('edit')

/** 新建自定义供应商时的临时 id（仅本地占位，保存后由后端生成真实 id） */
const NEW_PROVIDER_ID = ''

/** 厂商配置表单草稿（弹窗内编辑副本，保存成功后提交后端） */
const formDraft = ref<APIManufacturer>()

/** SettingForm 子组件实例引用，用于调用 clearValidate() 清除校验红框 */
const settingFormRef = ref<InstanceType<typeof SettingForm>>()

/** 弹窗内"测试连接"加载态 */
const isTesting = ref(false)

/** 弹窗保存请求进行中，用于禁用重复提交 */
const isSaving = ref(false)

/** 润色提示词草稿（偏好表单编辑副本，保存偏好后写回 savedPolishPrompt） */
const polishPromptDraft = ref<string>(DEFAULT_POLISH_PROMPT)

/**
 * 深拷贝指定厂商配置作为表单草稿
 * 避免编辑过程直接影响已保存数据
 * @param id - 厂商 id（缺省为当前编辑厂商）
 */
function cloneDraft(id: string = currentEditId.value): APIManufacturer {
  const target = savedStates.value.find(item => item.providerId === id)
  const source = target ?? savedStates.value[0]
  // savedStates 尚未从后端加载完成（或列表为空）时，返回空草稿兜底
  if (!source) {
    return {
      providerId: id,
      providerName: '',
      apiKeyEnc: '',
      modelId: '',
      apiEndpoint: '',
    }
  }
  return JSON.parse(JSON.stringify(source))
}

/**
 * 为厂商数据合并固定 UI 信息（icon/name/hint）
 * 这些字段是前端固定数据，运行时按 providerId 推导，不持久化
 * @param item - 厂商数据（可能不含 UI 字段）
 */
function withUI(item: APIManufacturer): APIManufacturer {
  return { ...item, ...getProviderUI(item.providerId, item.providerName) }
}

/**
 * 提取需要持久化的用户数据字段（剥离 icon/name/hint 等固定 UI 数据）
 * @param item - 厂商数据
 */
function pickPersisted(item: APIManufacturer) {
  return {
    providerId: item.providerId,
    providerName: item.providerName ?? '',
    apiKeyEnc: item.apiKeyEnc ?? '',
    modelId: item.modelId ?? '',
    apiEndpoint: item.apiEndpoint ?? '',
  }
}

/**
 * 当前激活视图是否有未保存的修改
 * 弹窗关闭时厂商导航不带草稿修改，只有偏好视图的编辑会产生未保存状态
 */
const isCurrentDirty = computed(
  () => activeTab.value === 'preference' && isPreferenceDirty.value,
)

/** 厂商列表视图模型（已合并固定 UI 信息，列表仅展示已保存厂商） */
const providerListView = computed<APIManufacturer[]>(() =>
  savedStates.value.map(withUI),
)

/** 当前厂商的视图模型（概览区展示已保存配置，不展示弹窗草稿） */
const currentProviderView = computed<APIManufacturer | undefined>(() => {
  const saved = savedStates.value.find(
    item => item.providerId === currentEditId.value,
  )
  return saved ? withUI(saved) : undefined
})

/** 当前厂商是否已配置（填了 API Key 与模型 ID） */
const currentConfigured = computed(() => {
  const item = savedStates.value.find(i => i.providerId === currentEditId.value)
  return Boolean(item?.apiKeyEnc && item?.modelId)
})

/** API Key 是否可见（默认隐藏，切换厂商时自动复位） */
const apiKeyVisible = ref(false)

/** 概览区 API Key 展示文案：隐藏时只保留末 4 位，避免整段密钥暴露 */
const apiKeyDisplay = computed(() => {
  const key = currentProviderView.value?.apiKeyEnc ?? ''
  if (!key) return '未填写'
  if (apiKeyVisible.value) return key
  const tail = key.slice(-4)
  return `****${tail}`
})

/** "当前使用的模型"下拉选项（仅已保存的厂商，已合并固定 UI 信息） */
const savedProviders = computed(() => savedStates.value.map(withUI))

/** 模型偏好是否有未保存的修改（选中模型或提示词与已保存值不一致） */
const isPreferenceDirty = computed(
  () =>
    selectedProviderId.value !== savedSelectedProviderId.value ||
    polishPromptDraft.value !== savedPolishPrompt.value,
)

/**
 * 打开厂商配置弹窗（仅新增/主动修改配置时调用）
 * @param id - 目标厂商 id
 */
function openEditModal(id: string) {
  modalMode.value = 'edit'
  currentEditId.value = id
  isTesting.value = false
  formDraft.value = cloneDraft(id)
  configModalOpen.value = true
  // 打开弹窗后清除上一次表单的校验红框 / 错误提示
  settingFormRef.value?.clearValidate()
}

/** 点击厂商：仅切换当前厂商展示配置概览，不打开弹窗 */
function handleSelect(id: string) {
  // 从偏好视图切走时若有未保存修改，先确认并丢弃
  if (activeTab.value === 'preference' && isPreferenceDirty.value) {
    confirmLeave(() => {
      activeTab.value = 'provider'
      currentEditId.value = id
      apiKeyVisible.value = false
    })
    return
  }
  activeTab.value = 'provider'
  currentEditId.value = id
  // 切换厂商后 API Key 重新回到隐藏状态
  apiKeyVisible.value = false
}

/** 打开模型偏好视图（有未保存修改时弹窗确认，确认后丢弃修改） */
function handleShowPreference() {
  confirmLeave(() => {
    activeTab.value = 'preference'
  })
}

/**
 * 执行切换编辑厂商并重置草稿
 * @param id - 目标厂商 id
 */
function doSelect(id: string) {
  activeTab.value = 'provider'
  currentEditId.value = id
  formDraft.value = cloneDraft(id)
  // 切换厂商后清除上一份表单的校验红框 / 错误提示
  settingFormRef.value?.clearValidate()
}

/** 新增自定义供应商：打开空白弹窗填写，保存后才真正加入列表 */
function handleAddCustom() {
  activeTab.value = 'provider'
  modalMode.value = 'create'
  // 草稿不带真实 id（空字符串占位），保存后由后端生成并回填
  currentEditId.value = NEW_PROVIDER_ID
  isTesting.value = false
  // 仅初始化用户数据字段，icon/name/hint 等固定 UI 由 getProviderUI 推导
  formDraft.value = {
    providerId: NEW_PROVIDER_ID,
    apiKeyEnc: '',
    apiEndpoint: '',
    modelId: '',
    providerName: '',
  }
  configModalOpen.value = true
  settingFormRef.value?.clearValidate()
}

/**
 * 测试连接（页面操作区调用）：后端按已保存配置发起真实请求
 * 仅已保存的厂商可测试（当前 id 为空时按钮禁用）
 */
async function handleTestConnection() {
  const providerId = currentEditId.value
  if (!providerId) return
  isTesting.value = true
  try {
    await testConnectionApi(providerId)
    message.success('连接测试成功')
  } catch (e) {
    // 失败提示由 request 层统一弹出，这里仅记录日志
    console.error('连接测试失败:', e)
  } finally {
    isTesting.value = false
  }
}

/** 保存弹窗表单草稿到后端，成功后关闭弹窗并同步本地状态 */
async function handleSave() {
  const draft = formDraft.value
  if (!draft) return

  // 新建自定义供应商不传 providerId（由后端生成）；其余按已有 id upsert
  const payload: AiConfigInput =
    modalMode.value === 'create'
      ? {
          providerName: draft.providerName,
          apiKeyEnc: draft.apiKeyEnc,
          modelId: draft.modelId,
          apiEndpoint: draft.apiEndpoint,
        }
      : {
          providerId: draft.providerId,
          providerName: draft.providerName,
          apiKeyEnc: draft.apiKeyEnc,
          modelId: draft.modelId,
          apiEndpoint: draft.apiEndpoint,
        }

  let returnedId: string
  isSaving.value = true
  try {
    returnedId = await addOrUpdateAiConfigApi(payload)
  } catch (e) {
    console.error('保存 AI 配置失败:', e)
    return
  } finally {
    isSaving.value = false
  }

  // 保存成功后重拉列表同步最新掩码（key 传新明文后掩码会变化）
  try {
    await refreshSavedStates()
  } catch (e) {
    console.error('刷新 AI 配置列表失败:', e)
  }

  // 新建供应商用后端生成的真实 id 替换本地临时 id，保证后续编辑/删除/偏好判断 id 一致
  if (modalMode.value === 'create') currentEditId.value = returnedId

  // 草稿重置为已保存内容，掩码回显与后端对齐
  formDraft.value = cloneDraft(currentEditId.value)
  // 保存成功，清除表单校验红框并关闭弹窗
  settingFormRef.value?.clearValidate()
  configModalOpen.value = false
  message.success('保存成功')
}

/** 丢弃当前视图的未保存修改 */
function discardDraft() {
  if (activeTab.value === 'preference') {
    // 偏好草稿恢复为已保存值
    selectedProviderId.value = savedSelectedProviderId.value
    polishPromptDraft.value = savedPolishPrompt.value
  } else {
    // 厂商草稿重置为当前厂商的已保存内容
    formDraft.value = cloneDraft()
  }
}

/**
 * 离开当前视图前确认未保存修改，确认后丢弃修改并执行跳转
 * @param leave - 确认离开后执行的动作
 */
function confirmLeave(leave: () => void) {
  if (isCurrentDirty.value) {
    Modal.confirm({
      title: '有未保存的修改',
      content: '离开后将丢弃当前未保存的修改，是否继续？',
      okText: '继续',
      cancelText: '取消',
      onOk: () => {
        discardDraft()
        leave()
      },
    })
  } else {
    leave()
  }
}

/** 弹窗内厂商信息（由草稿推导，新建时也可展示名称与图标） */
const modalProviderView = computed<APIManufacturer | undefined>(() =>
  formDraft.value ? withUI(formDraft.value) : undefined,
)

/**
 * 弹窗取消 / 关闭：直接关闭并丢弃未保存草稿，不做二次确认
 * 新建草稿被放弃后不会出现在列表中，编辑草稿重置为已保存内容
 */
function handleModalClose() {
  configModalOpen.value = false
  // 新建未保存：恢复为当前使用厂商的已保存内容，避免草稿残留空 id
  if (modalMode.value === 'create') {
    currentEditId.value = selectedProviderId.value || 'deepseek'
  }
  modalMode.value = 'edit'
  formDraft.value = cloneDraft()
  settingFormRef.value?.clearValidate()
}

/**
 * 删除自定义供应商（内置厂商不可删除）
 * @param id - 要删除的厂商 id
 */
function handleDeleteCustom(id: string) {
  Modal.confirm({
    title: '删除供应商',
    content: '删除后不可恢复，确定删除该自定义供应商吗？',
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      // 先删后端，成功后再更新本地状态
      // 失败提示由 request 层统一弹出，这里仅记录日志并中止本地更新
      try {
        await deleteAiConfigApi(id)
      } catch (e) {
        console.error('删除 AI 配置失败:', e)
        return
      }
      savedStates.value = savedStates.value.filter(
        item => item.providerId !== id,
      )
      // 若删除的是当前使用的模型，回退为 DeepSeek 并同步后端
      if (selectedProviderId.value === id) {
        selectedProviderId.value = 'deepseek'
        // 偏好"真源"同步回退值，保持偏好无脏状态
        savedSelectedProviderId.value = 'deepseek'
        setSelModelAndPromptApi({ selectedProviderId: 'deepseek' }).catch(e =>
          console.error('同步模型偏好失败:', e),
        )
      }
      // 若删除的是正在编辑的厂商，切回当前使用的模型
      if (currentEditId.value === id) {
        doSelect(selectedProviderId.value || 'deepseek')
      }
      message.success('删除成功')
    },
  })
}

/** 保存模型偏好（当前使用的模型 + 润色提示词）到后端，成功后同步本地"真源" */
async function handleSavePreference() {
  try {
    await setSelModelAndPromptApi({
      selectedProviderId: selectedProviderId.value,
      polishPrompt: polishPromptDraft.value,
    })
  } catch (e) {
    // 失败提示由 request 层统一弹出，这里仅记录日志并中止本地更新
    console.error('保存模型偏好失败:', e)
    return
  }
  savedSelectedProviderId.value = selectedProviderId.value
  savedPolishPrompt.value = polishPromptDraft.value
  message.success('保存成功')
}

/**
 * 离开设置页面守卫：有未保存修改时弹窗确认
 * 确认离开后先丢弃修改再重新导航，确保守卫二次放行
 */
onBeforeRouteLeave(to => {
  // 仅偏好视图的未保存修改需要拦截（弹窗内草稿随取消/关闭直接丢弃）
  if (!isCurrentDirty.value) return true

  Modal.confirm({
    title: '有未保存的修改',
    content: '离开页面后将丢弃当前未保存的修改，是否离开？',
    okText: '离开',
    okType: 'danger',
    cancelText: '留在本页',
    onOk: () => {
      discardDraft()
      router.push(to)
    },
  })
  // 先拦截本次导航，用户确认后重新跳转
  return false
})
</script>

<template>
  <div v-if="!loading" class="ai-settings-container">
    <!-- 左侧厂商列表 -->
    <div class="model-list">
      <div
        v-for="model in providerListView"
        :key="model.providerId"
        :class="[
          'model-item',
          {
            active:
              activeTab === 'provider' && currentEditId === model.providerId,
          },
        ]"
        @click="handleSelect(model.providerId ?? '')"
      >
        <span class="model-icon">{{ model.icon }}</span>
        <span class="model-name">{{ model.providerName }}</span>
        <DeleteOutlined
          v-if="!BUILTIN_PROVIDER_IDS.includes(model.providerId ?? '')"
          class="model-delete"
          @click.stop="handleDeleteCustom(model.providerId ?? '')"
        />
      </div>
      <div class="model-item add-item" @click="handleAddCustom">
        <PlusOutlined />
        <span class="model-name">新增自定义供应商</span>
      </div>
      <div class="model-line"></div>
      <!-- 模型偏好入口 -->
      <div
        :class="['model-item', { active: activeTab === 'preference' }]"
        @click="handleShowPreference"
      >
        <span class="model-icon"><SlidersOutlined /></span>
        <span class="model-name">模型偏好</span>
      </div>
    </div>

    <!-- 右侧设置内容 -->
    <div class="model-settings">
      <!-- 厂商配置视图 -->
      <template v-if="activeTab === 'provider'">
        <!-- 厂商概览 -->
        <div class="model-info">
          <span class="model-info-icon">{{ currentProviderView?.icon }}</span>
          <div class="model-info-content">
            <div class="model-info-name">
              {{ currentProviderView?.providerName }}
            </div>
            <div class="model-info-hint">{{ currentProviderView?.hint }}</div>
          </div>
          <a-tag :color="currentConfigured ? 'green' : 'orange'">
            {{ currentConfigured ? '已配置' : '未配置' }}
          </a-tag>
        </div>

        <!-- 配置摘要 -->
        <div class="config-summary">
          <div class="summary-row">
            <span class="summary-label">模型 ID</span>
            <span class="summary-value">
              {{ currentProviderView?.modelId || '未填写' }}
            </span>
          </div>
          <div class="row-divider"></div>
          <div class="summary-row">
            <span class="summary-label">API Key</span>
            <div class="summary-key">
              <span class="summary-value">
                {{ apiKeyDisplay }}
              </span>
              <a-tooltip
                v-if="currentProviderView?.apiKeyEnc"
                :title="apiKeyVisible ? '隐藏' : '显示'"
              >
                <component
                  :is="apiKeyVisible ? EyeOutlined : EyeInvisibleOutlined"
                  class="summary-key-toggle"
                  @click="apiKeyVisible = !apiKeyVisible"
                />
              </a-tooltip>
            </div>
          </div>
          <div class="row-divider"></div>
          <div class="summary-row">
            <span class="summary-label">API 端点</span>
            <span class="summary-value">
              {{ currentProviderView?.apiEndpoint || '未填写' }}
            </span>
          </div>
        </div>

        <!-- 操作按钮：测试连接在页面上，配置填写统一在弹窗内完成 -->
        <div class="config-actions">
          <a-tooltip v-if="!currentEditId" title="请先保存配置后再测试连接">
            <a-button disabled>测试连接</a-button>
          </a-tooltip>
          <a-button v-else :loading="isTesting" @click="handleTestConnection">
            测试连接
          </a-button>
          <a-button
            type="primary"
            :icon="h(ApiOutlined)"
            @click="openEditModal(currentEditId)"
          >
            {{ currentConfigured ? '修改配置' : '填写 API Key' }}
          </a-button>
        </div>
      </template>

      <!-- 模型偏好视图（当前使用的模型 + 润色提示词，独立保存） -->
      <PreferenceForm
        v-else
        v-model:selected-provider-id="selectedProviderId"
        v-model:polish-prompt="polishPromptDraft"
        :providers="savedProviders"
        @save="handleSavePreference"
      />
    </div>

    <!-- 厂商配置弹窗（点取消直接关闭，未保存内容丢弃） -->
    <a-modal
      v-model:open="configModalOpen"
      :title="modalMode === 'create' ? '新增自定义供应商' : '填写 API Key 配置'"
      :width="480"
      :mask-closable="false"
      :destroy-on-close="false"
      centered
      :footer="null"
      @cancel="handleModalClose"
    >
      <!-- 弹窗内厂商信息（由草稿推导，新建时也可展示） -->
      <div v-if="modalProviderView" class="modal-provider">
        <span class="modal-provider-icon">{{ modalProviderView.icon }}</span>
        <div class="modal-provider-content">
          <div class="modal-provider-name">
            {{ modalProviderView.providerName }}
          </div>
          <div class="modal-provider-hint">{{ modalProviderView.hint }}</div>
        </div>
      </div>

      <!-- 厂商配置表单 -->
      <SettingForm
        ref="settingFormRef"
        v-model:form="formDraft!"
        :saving="isSaving"
        @save="handleSave"
        @cancel="handleModalClose"
      />
    </a-modal>
  </div>
</template>

<style scoped lang="scss">
.ai-settings-container {
  display: flex;
  gap: 24px;
}

.model-list {
  width: 200px;
  flex-shrink: 0;
  padding: 0 10px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);

  .model-line {
    height: 1px;
    background: var(--color-border);
    margin: 12px 0;
  }

  .model-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 16px;
    border-radius: 8px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: var(--color-surface-hover);
    }

    &.active {
      background: var(--color-primary-bg);
    }

    .model-icon {
      font-size: 20px;
    }

    .model-name {
      flex: 1;
      font-size: 14px;
      color: var(--color-text);
    }

    .model-delete {
      opacity: 0;
      transition: opacity 0.2s ease;
      color: #ff4d4f;

      &:hover {
        color: #ff7875;
      }
    }

    &:hover .model-delete {
      opacity: 1;
    }

    &.add-item {
      color: var(--color-primary);
    }
  }
}

.model-settings {
  flex: 1;
}

.model-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  margin-bottom: 20px;

  .model-info-icon {
    font-size: 32px;
  }

  .model-info-content {
    flex: 1;

    .model-info-name {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: 4px;
    }

    .model-info-hint {
      font-size: 13px;
      color: var(--color-text-secondary);
    }
  }
}

.config-summary {
  margin-bottom: 20px;

  .summary-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: 12px 0;

    &:first-of-type {
      padding-top: 0;
    }

    &:last-of-type {
      padding-bottom: 0;
    }

    .summary-label {
      flex-shrink: 0;
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
    }

    .summary-value {
      font-family: var(--font-mono, monospace), serif;
      font-size: var(--text-sm);
      color: var(--color-text);
      word-break: break-all;
      text-align: right;
    }

    /* API Key 值 + 小眼睛切换按钮 */
    .summary-key {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--space-2);
      min-width: 0;

      .summary-key-toggle {
        flex-shrink: 0;
        cursor: pointer;
        font-size: 15px;
        color: var(--color-text-tertiary);
        transition: color 0.2s ease;

        &:hover {
          color: var(--color-primary);
        }
      }
    }
  }

  .row-divider {
    height: 1px;
    background: var(--color-border);
  }
}

.config-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);

  .ant-btn {
    display: inline-flex;
    align-items: center;
  }
}

.modal-provider {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-5);
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);

  .modal-provider-icon {
    font-size: 28px;
    line-height: 1;
  }

  .modal-provider-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .modal-provider-name {
    font-size: var(--text-sm);
    font-weight: var(--font-semibold);
    color: var(--color-text);
  }

  .modal-provider-hint {
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
  }
}
</style>
