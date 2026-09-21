<script setup lang="ts">
import type { APIManufacturer, AiConfigInput } from '@/types/ai-config'
import { Modal, message } from 'ant-design-vue'
import {
  DeleteOutlined,
  KeyOutlined,
  PlusOutlined,
  SlidersOutlined,
} from '@ant-design/icons-vue'
import { computed, onBeforeMount, ref } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import {
  BUILTIN_PROVIDERS,
  BUILTIN_PROVIDER_IDS,
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
} from '@/api/ai-config.ts'

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

  // 后端返回的 apiKeyCipher 为掩码（明文永不回传），归一化为 apiKeyEnc 仅用于表单回显
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

/** 是否处于"新建自定义供应商"（尚未保存）状态 */
const isNewProvider = ref(false)

/** 厂商配置表单草稿（编辑副本，保存成功后提交后端） */
const formDraft = ref<APIManufacturer>()

/** SettingForm 子组件实例引用，用于调用 clearValidate() 清除校验红框 */
const settingFormRef = ref<InstanceType<typeof SettingForm>>()

/** 润色提示词草稿（偏好表单编辑副本，保存偏好后写回 savedPolishPrompt） */
const polishPromptDraft = ref<string>(DEFAULT_POLISH_PROMPT)

/**
 * 深拷贝当前编辑厂商配置作为表单草稿
 * 避免编辑过程直接影响已保存数据
 */
function cloneDraft(): APIManufacturer {
  const target = savedStates.value.find(
    item => item.providerId === currentEditId.value,
  )
  const source = target ?? savedStates.value[0]
  // savedStates 尚未从后端加载完成（或列表为空）时，返回空草稿兜底
  if (!source) {
    return {
      providerId: currentEditId.value,
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

/** 当前厂商表单是否有未保存的修改 */
const isDirty = computed(() => {
  // 新建未保存的供应商视为有修改
  if (isNewProvider.value) return true
  if (!formDraft.value) return false
  const saved = savedStates.value.find(
    item => item.providerId === currentEditId.value,
  )
  if (!saved) return true
  // 只比较用户数据字段，避免 UI 字段干扰判断
  return (
    JSON.stringify(pickPersisted(formDraft.value)) !==
    JSON.stringify(pickPersisted(saved))
  )
})

/** 左侧可编辑列表视图模型 = 已保存厂商 + 正在新建（未保存）的厂商，已合并固定 UI 信息 */
const editingListView = computed<APIManufacturer[]>(() => {
  const list = [...savedStates.value]
  if (isNewProvider.value && formDraft.value) list.push(formDraft.value)
  return list.map(withUI)
})

/** 当前编辑厂商的视图模型（已合并固定 UI 信息） */
const currentEditView = computed<APIManufacturer>(() =>
  withUI(formDraft.value!),
)

/** "当前使用的模型"下拉选项（仅已保存的厂商，已合并固定 UI 信息） */
const savedProviders = computed(() => savedStates.value.map(withUI))

/**
 * 判断自定义供应商草稿是否为空（所有字段均未填写）
 * 空草稿切换时无需弹窗确认
 */
function isEmptyCustom(item: APIManufacturer): boolean {
  return (
    !item.providerName?.trim() &&
    !item.apiKeyEnc?.trim() &&
    !item.apiEndpoint?.trim() &&
    !item.modelId?.trim()
  )
}

/** 模型偏好是否有未保存的修改（选中模型或提示词与已保存值不一致） */
const isPreferenceDirty = computed(
  () =>
    selectedProviderId.value !== savedSelectedProviderId.value ||
    polishPromptDraft.value !== savedPolishPrompt.value,
)

/** 当前激活视图是否有未保存的修改 */
const isCurrentDirty = computed(() =>
  activeTab.value === 'preference' ? isPreferenceDirty.value : isDirty.value,
)

/**
 * 丢弃当前视图的未保存修改，恢复为已保存内容
 */
function discardDraft() {
  if (activeTab.value === 'preference') {
    // 偏好草稿恢复为已保存值
    selectedProviderId.value = savedSelectedProviderId.value
    polishPromptDraft.value = savedPolishPrompt.value
  } else if (isNewProvider.value) {
    // 新建草稿放弃，编辑状态回退到当前使用的模型
    doSelect(selectedProviderId.value || 'deepseek')
  } else {
    // 已有厂商的草稿重置为已保存内容
    formDraft.value = cloneDraft()
  }
}

/**
 * 离开当前视图前确认未保存修改，确认后丢弃修改并执行跳转
 * @param leave - 确认离开后执行的动作
 */
function confirmLeave(leave: () => void) {
  // 全空的新建草稿直接丢弃，不打扰用户
  const skipConfirm = isNewProvider.value && isEmptyCustom(formDraft.value!)

  if (isCurrentDirty.value && !skipConfirm) {
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

/**
 * 切换编辑厂商（有未保存修改时弹窗确认）
 * @param id - 目标厂商 id
 */
function handleSelect(id: string) {
  // 厂商视图下点击当前正在编辑的厂商：无操作
  if (activeTab.value === 'provider' && id === currentEditId.value) return

  const isCurrent = id === currentEditId.value
  // 离开当前视图前统一确认未保存修改（含偏好视图改了下拉未保存的情况）
  confirmLeave(() => {
    if (isCurrent) {
      // 偏好视图点回当前正在编辑的厂商：仅切回视图
      activeTab.value = 'provider'
    } else {
      doSelect(id)
    }
  })
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
  isNewProvider.value = false
  activeTab.value = 'provider'
  currentEditId.value = id
  formDraft.value = cloneDraft()
  // 切换厂商后清除上一份表单的校验红框 / 错误提示
  settingFormRef.value?.clearValidate()
}

/** 新增自定义供应商：进入新建编辑状态，保存后才真正加入列表 */
function handleAddCustom() {
  activeTab.value = 'provider'
  isNewProvider.value = true
  // 草稿不带真实 id（空字符串占位），保存后由后端生成并回填
  currentEditId.value = ''
  // 仅初始化用户数据字段，icon/name/hint 等固定 UI 由 getProviderUI 推导
  formDraft.value = {
    providerId: '',
    apiKeyEnc: '',
    apiEndpoint: '',
    modelId: '',
    providerName: '',
  }
  // 进入新建状态，清除之前的校验红框
  settingFormRef.value?.clearValidate()
}

/** 保存当前表单草稿到后端，成功后同步本地状态 */
async function handleSave() {
  const draft = formDraft.value
  if (!draft) return

  // 新建自定义供应商不传 providerId（由后端生成）；其余按已有 id upsert
  const payload: AiConfigInput = isNewProvider.value
    ? {
        providerName: draft.providerName,
        apiKeyEnc: draft.apiKeyEnc,
        modelId: draft.modelId,
        apiEndpoint: draft.apiEndpoint,
      }
    : draft

  // API Key 未修改（仍与已保存掩码一致）时传空字符串，后端保留原密文
  // 新建厂商在 savedStates 中无记录，天然跳过该判断，原样传用户输入值
  const saved = savedStates.value.find(
    item => item.providerId === draft.providerId,
  )
  if (saved && draft.apiKeyEnc === saved.apiKeyEnc) {
    payload.apiKeyEnc = ''
  }

  let returnedId: string
  try {
    returnedId = await addOrUpdateAiConfigApi(payload)
  } catch (e) {
    console.error('保存 AI 配置失败:', e)
    return
  }

  // 保存成功后重拉列表同步最新掩码（key 传新明文后掩码会变化）
  try {
    await refreshSavedStates()
  } catch (e) {
    console.error('刷新 AI 配置列表失败:', e)
  }

  if (isNewProvider.value) {
    // 用后端生成的真实 id 替换本地临时 id，保证后续编辑/删除/偏好判断 id 一致
    currentEditId.value = returnedId
    isNewProvider.value = false
  }
  // 草稿重置为已保存内容，掩码回显与后端对齐
  formDraft.value = cloneDraft()
  // 保存成功，清除表单校验红框
  settingFormRef.value?.clearValidate()
  message.success('保存成功')
}

/** 取消编辑：丢弃厂商草稿修改，恢复为已保存内容 */
function handleCancel() {
  if (isNewProvider.value) {
    // 新建中的供应商直接放弃，切回当前使用的模型（doSelect 内部已 clearValidate）
    doSelect(selectedProviderId.value || 'deepseek')
    return
  }
  formDraft.value = cloneDraft()
  // 取消编辑，恢复已保存内容后清除校验红框
  settingFormRef.value?.clearValidate()
}

/**
 * 删除自定义供应商（内置厂商不可删除）
 * 未保存的新建草稿直接本地丢弃（后端无此记录，调删除接口会报错）
 * @param id - 要删除的厂商 id
 */
function handleDeleteCustom(id: string) {
  // 未保存的新建草稿：本地直接放弃，不走后端删除
  if (!savedStates.value.some(item => item.providerId === id)) {
    // 全空草稿直接放弃，不打扰用户
    if (isEmptyCustom(formDraft.value!)) {
      doSelect(selectedProviderId.value || 'deepseek')
      return
    }
    Modal.confirm({
      title: '放弃新建供应商',
      content: '该供应商尚未保存，确定放弃已填写的内容吗？',
      okText: '放弃',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => doSelect(selectedProviderId.value || 'deepseek'),
    })
    return
  }

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
  // 全空的新建草稿视为无修改
  const skipConfirm = isNewProvider.value && isEmptyCustom(formDraft.value!)
  if (!isCurrentDirty.value || skipConfirm) return true

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
  <!-- API key 设置 -->
  <a-card>
    <template #title>
      <div class="setting-title">
        <KeyOutlined :style="{ fontSize: '16px' }" /> API Key
      </div>
    </template>

    <!-- 数据由后端异步加载，就绪前不渲染表单区，避免访问未初始化状态 -->
    <div v-if="!loading" class="ai-settings-container">
      <!-- 左侧厂商列表 -->
      <div class="model-list">
        <div
          v-for="model in editingListView"
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
          <!-- 模型信息 -->
          <div class="model-info">
            <span class="model-info-icon">{{ currentEditView.icon }}</span>
            <div class="model-info-content">
              <div class="model-info-name">
                {{ currentEditView.providerName }}
              </div>
              <div class="model-info-hint">{{ currentEditView.hint }}</div>
            </div>
            <a-tag v-if="isNewProvider" color="orange">未保存</a-tag>
          </div>

          <!-- 厂商配置表单 -->
          <SettingForm
            ref="settingFormRef"
            v-model:form="formDraft!"
            :on-save="handleSave"
            @cancel="handleCancel"
          />
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
    </div>
  </a-card>
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
  @include themify(
    (
      background: (
        light: #fff,
        dark: #111827,
      ),
      border-color: (
        light: #e8e8e8,
        dark: rgba(255, 255, 255, 0.12),
      ),
    )
  );

  .model-line {
    height: 1px;
    background: #e8e8e8;
    margin: 12px 0;
    @include themify(
      (
        background: (
          light: #e8e8e8,
          dark: rgba(255, 255, 255, 0.12),
        ),
      )
    );
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
      background: #f5f5f5;
      @include themify(
        (
          background: (
            light: #f5f5f5,
            dark: rgba(255, 255, 255, 0.08),
          ),
        )
      );
    }

    &.active {
      background: #e6f7ff;
      @include themify(
        (
          background: (
            light: #e6f7ff,
            dark: rgba(59, 130, 246, 0.18),
          ),
        )
      );
    }

    .model-icon {
      font-size: 20px;
    }

    .model-name {
      flex: 1;
      font-size: 14px;
      color: #333;
      @include themify(
        (
          color: (
            light: #333,
            dark: #f8faff,
          ),
        )
      );
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
      color: #1890ff;
      @include themify(
        (
          color: (
            light: #1890ff,
            dark: #60a5fa,
          ),
        )
      );
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
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 24px;
  @include themify(
    (
      background: (
        light: #fafafa,
        dark: #111827,
      ),
      border-color: (
        light: #f0f0f0,
        dark: rgba(255, 255, 255, 0.12),
      ),
    )
  );

  .model-info-icon {
    font-size: 32px;
  }

  .model-info-content {
    flex: 1;

    .model-info-name {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
      @include themify(
        (
          color: (
            light: #333,
            dark: #f8faff,
          ),
        )
      );
    }

    .model-info-hint {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.5);
      @include themify(
        (
          color: (
            light: rgba(0, 0, 0, 0.5),
            dark: rgba(255, 255, 255, 0.65),
          ),
        )
      );
    }
  }
}
</style>
