<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import {
  UploadOutlined,
  SwapOutlined,
  UndoOutlined,
  DownloadOutlined,
  CheckOutlined,
  CloseOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons-vue'
import { motion } from 'motion-v'

const props = defineProps<{
  /** 控制弹窗显示 */
  open: boolean
}>()

const emit = defineEmits<{
  /** 请求关闭弹窗 */
  (e: 'update:open', val: boolean): void
  /** 确认使用，将结果回传给父组件 */
  (e: 'confirm', data: IdCardResult): void
}>()

/** 证件照规格预设 */
export interface IdCardPreset {
  /** 唯一标识 */
  id: string
  /** 显示名称 */
  label: string
  /** 宽度（像素）*/
  width: number
  /** 高度（像素）*/
  height: number
  /** 实际物理尺寸描述 */
  desc: string
}

/** 底色预设 */
export interface BgColor {
  id: string
  label: string
  /** CSS 颜色值 */
  value: string
}

/** 确认后的证件照结果 */
export interface IdCardResult {
  /** 处理后的图片 Base64 */
  dataUrl: string
  /** 宽度 px */
  width: number
  /** 高度 px */
  height: number
  /** 使用的底色 */
  bgColor: string
}

/** 常用证件照规格 */
const presets: IdCardPreset[] = [
  { id: '1inch', label: '一寸', width: 295, height: 413, desc: '25×35mm' },
  { id: '2inch', label: '二寸', width: 413, height: 579, desc: '35×49mm' },
  {
    id: 'small1inch',
    label: '小一寸',
    width: 260,
    height: 378,
    desc: '22×32mm',
  },
  {
    id: 'small2inch',
    label: '小二寸',
    width: 413,
    height: 531,
    desc: '35×45mm',
  },
  {
    id: 'full2inch',
    label: '大二寸',
    width: 413,
    height: 626,
    desc: '35×53mm',
  },
]

/** 常用底色 */
const bgColors: BgColor[] = [
  { id: 'white', label: '白色', value: '#ffffff' },
  { id: 'blue', label: '蓝色', value: '#438edb' },
  { id: 'red', label: '红色', value: '#d50000' },
]

/** 当前选中的规格 ID */
const activePresetId = ref('1inch')

/** 当前选中的底色 ID */
const activeBgId = ref('blue')

/** 上传后的图片对象 */
const uploadedImage = ref<HTMLImageElement | null>(null)

/** 原始图片源 */
const imageSrc = ref('')

/** 裁剪框数据（相对坐标 0~1） */
const cropBox = ref({ x: 0.25, y: 0.15, w: 0.5, h: 0.75 })

/** 文件输入引用 */
const fileInputRef = ref<HTMLInputElement | null>(null)

/** 拖拽是否悬停 */
const isDragging = ref(false)

/** 当前选中的规格对象 */
const activePreset = computed(
  () => presets.find(p => p.id === activePresetId.value) ?? presets[0],
)

/** 当前选中的底色对象 */
const activeBg = computed(
  () => bgColors.find(b => b.id === activeBgId.value) ?? bgColors[0],
)

/** 图片宽高比（基于选中规格） */
const targetRatio = computed(
  () => activePreset.value.width / activePreset.value.height,
)

/** 是否已上传图片 */
const hasImage = computed(() => !!uploadedImage.value)

/** 弹窗关闭 */
const handleClose = () => {
  emit('update:open', false)
}

/** 重置裁剪区域 */
const resetCropBox = () => {
  cropBox.value = { x: 0.25, y: 0.15, w: 0.5, h: 0.75 }
}

/** 触发文件选择 */
const triggerFileSelect = () => {
  fileInputRef.value?.click()
}

/** 处理文件选择 */
const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) loadImageFile(file)
}

/** 拖拽进入 */
const handleDragEnter = () => {
  isDragging.value = true
}

/** 拖拽离开 */
const handleDragLeave = () => {
  isDragging.value = false
}

/** 放置文件 */
const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) loadImageFile(file)
}

/** 加载图片文件 */
const loadImageFile = (file: File) => {
  if (!file.type.startsWith('image/')) {
    message.error('请选择图片文件')
    return
  }
  const reader = new FileReader()
  reader.onload = ev => {
    const img = new Image()
    img.onload = () => {
      uploadedImage.value = img
      imageSrc.value = ev.target?.result as string
      resetCropBox()
    }
    img.src = ev.target?.result as string
  }
  reader.readAsDataURL(file)
}

/** 切换底色（换背景色） */
const changeBgColor = (bgId: string) => {
  activeBgId.value = bgId
}

/** 生成裁剪后的证件照 DataURL */
const generateIdCard = (): string => {
  if (!uploadedImage.value) return ''
  const img = uploadedImage.value
  const preset = activePreset.value
  const bg = activeBg.value

  const canvas = document.createElement('canvas')
  canvas.width = preset.width
  canvas.height = preset.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  // 底色填充
  ctx.fillStyle = bg.value
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 按裁剪区域从原图截取并缩放到目标尺寸
  const sx = cropBox.value.x * img.naturalWidth
  const sy = cropBox.value.y * img.naturalHeight
  const sw = cropBox.value.w * img.naturalWidth
  const sh = cropBox.value.h * img.naturalHeight

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)

  return canvas.toDataURL('image/png')
}

/** 下载证件照 */
const handleDownload = () => {
  if (!hasImage.value) {
    message.warning('请先上传照片')
    return
  }
  const dataUrl = generateIdCard()
  if (!dataUrl) {
    message.error('生成失败，请重试')
    return
  }
  const preset = activePreset.value
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `${preset.label}_证件照.png`
  a.click()
  message.success('下载成功')
}

/** 确认使用 */
const handleConfirm = () => {
  if (!hasImage.value) {
    message.warning('请先上传照片')
    return
  }
  const dataUrl = generateIdCard()
  emit('confirm', {
    dataUrl,
    width: activePreset.value.width,
    height: activePreset.value.height,
    bgColor: activeBg.value.value,
  })
  emit('update:open', false)
}

/** 图片加载后重置裁剪框（按规格比例） */
watch(activePreset, () => {
  if (uploadedImage.value) {
    resetCropBox()
  }
})
</script>

<template>
  <a-modal
    :open="props.open"
    title="证件照制作"
    :footer="null"
    :width="800"
    :destroy-on-close="true"
    centered
    @cancel="handleClose"
  >
    <div class="idcard-maker">
      <!-- ============ 左侧：预览区 ============ -->
      <div class="preview-panel">
        <!-- 未上传时的上传区 -->
        <div
          v-if="!hasImage"
          class="upload-area"
          :class="{ dragging: isDragging }"
          @click="triggerFileSelect"
          @dragenter="handleDragEnter"
          @dragleave="handleDragLeave"
          @dragover.prevent
          @drop="handleDrop"
        >
          <UploadOutlined class="upload-icon" />
          <div class="upload-title">上传照片</div>
          <div class="upload-hint">点击选择 · 拖拽图片到此处</div>
          <div class="upload-tip">支持 JPG / PNG，建议正面免冠照</div>
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            hidden
            @change="handleFileChange"
          />
        </div>

        <!-- 已上传时的裁剪预览 -->
        <motion.div
          v-else
          class="crop-stage"
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          :transition="{ duration: 0.25 }"
        >
          <div class="crop-canvas" :style="{ backgroundColor: activeBg.value }">
            <!-- 原图（作为裁剪源） -->
            <img :src="imageSrc" class="crop-source" alt="原始照片" />
            <!-- 裁剪框 overlay：显示目标证件照比例的参考框 -->
            <div
              class="crop-guide"
              :style="{
                aspectRatio: `${activePreset.width} / ${activePreset.height}`,
              }"
            >
              <!-- 九宫格辅助线 -->
              <div class="grid-lines">
                <span class="line-h line-h-1"></span>
                <span class="line-h line-h-2"></span>
                <span class="line-v line-v-1"></span>
                <span class="line-v line-v-2"></span>
              </div>
            </div>
          </div>

          <div class="crop-footer">
            <span class="crop-size">
              {{ activePreset.width }}×{{ activePreset.height }} px ·
              {{ activePreset.desc }}
            </span>
            <div class="crop-actions">
              <a-tooltip title="重新选择">
                <button class="mini-btn" @click="triggerFileSelect">
                  <SwapOutlined />
                </button>
              </a-tooltip>
              <a-tooltip title="重置裁剪">
                <button class="mini-btn" @click="resetCropBox">
                  <UndoOutlined />
                </button>
              </a-tooltip>
              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                hidden
                @change="handleFileChange"
              />
            </div>
          </div>
        </motion.div>
      </div>

      <!-- ============ 右侧：控制面板 ============ -->
      <div class="control-panel">
        <!-- 规格选择 -->
        <div class="control-group">
          <div class="group-title">选择规格</div>
          <div class="preset-list">
            <button
              v-for="p in presets"
              :key="p.id"
              class="preset-btn"
              :class="{ active: activePresetId === p.id }"
              @click="activePresetId = p.id"
            >
              <span class="preset-label">{{ p.label }}</span>
              <span class="preset-desc">{{ p.desc }}</span>
            </button>
          </div>
        </div>

        <!-- 底色选择 -->
        <div class="control-group">
          <div class="group-title">底色</div>
          <div class="bg-list">
            <button
              v-for="bg in bgColors"
              :key="bg.id"
              class="bg-btn"
              :class="{ active: activeBgId === bg.id }"
              @click="changeBgColor(bg.id)"
            >
              <span class="bg-swatch" :style="{ backgroundColor: bg.value }">
                <CheckOutlined v-if="activeBgId === bg.id" />
              </span>
              <span class="bg-label">{{ bg.label }}</span>
            </button>
          </div>
        </div>

        <!-- 提示 -->
        <div class="tip-box">
          <InfoCircleOutlined class="tip-icon" />
          <span class="tip-text">
            建议使用正面免冠照片，人像居中，面部占比约 2/3
          </span>
        </div>

        <!-- 操作按钮 -->
        <div class="action-row">
          <a-button
            class="action-btn action-download"
            :disabled="!hasImage"
            @click="handleDownload"
          >
            <DownloadOutlined />
            下载
          </a-button>
          <a-button
            type="primary"
            class="action-btn action-confirm"
            :disabled="!hasImage"
            @click="handleConfirm"
          >
            <CheckOutlined />
            使用此照片
          </a-button>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<style scoped lang="scss">
.idcard-maker {
  display: flex;
  gap: var(--space-6);
  min-height: 480px;
}

/* ============ 左侧预览区 ============ */
.preview-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
}

/* 上传区 */
.upload-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  min-height: 400px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-muted);
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);

  &:hover {
    border-color: var(--color-primary);
    background: var(--color-primary-bg);
  }

  &.dragging {
    border-color: var(--color-primary);
    background: var(--color-primary-bg);
  }

  .upload-icon {
    font-size: 40px;
    color: var(--color-text-tertiary);
    padding: var(--space-4);
    border-radius: var(--radius-full);
    background: var(--color-surface);
    margin-bottom: var(--space-2);
  }

  .upload-title {
    font-size: var(--text-base);
    font-weight: var(--font-semibold);
    color: var(--color-text);
  }

  .upload-hint {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  .upload-tip {
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
  }
}

/* 裁剪舞台 */
.crop-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 400px;
}

.crop-canvas {
  flex: 1;
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 360px;

  .crop-source {
    position: absolute;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    z-index: 0;
    opacity: 0.45;
    filter: saturate(0.6);
  }

  .crop-guide {
    position: relative;
    width: 70%;
    height: auto;
    max-width: 280px;
    z-index: 1;
    border: 1.5px solid var(--color-primary);
    border-radius: var(--radius-md);
    box-shadow:
      0 0 0 9999px rgba(0, 0, 0, 0.35),
      0 4px 20px rgba(0, 0, 0, 0.15);
  }

  /* 九宫格辅助线 */
  .grid-lines {
    position: absolute;
    inset: 0;
    pointer-events: none;

    .line-h,
    .line-v {
      position: absolute;
      background: rgba(255, 255, 255, 0.5);
    }

    .line-h {
      left: 0;
      right: 0;
      height: 1px;
    }

    .line-h-1 {
      top: 33.33%;
    }

    .line-h-2 {
      top: 66.66%;
    }

    .line-v {
      top: 0;
      bottom: 0;
      width: 1px;
    }

    .line-v-1 {
      left: 33.33%;
    }

    .line-v-2 {
      left: 66.66%;
    }
  }
}

.crop-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .crop-size {
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
  }

  .crop-actions {
    display: flex;
    gap: var(--space-1);
  }

  .mini-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: var(--radius-md);
    background: var(--color-bg-muted);
    color: var(--color-text-secondary);
    font-size: 14px;
    cursor: pointer;
    transition:
      background-color var(--duration-fast) var(--ease-out),
      color var(--duration-fast) var(--ease-out);

    &:hover {
      background: var(--color-primary-bg);
      color: var(--color-primary);
    }
  }
}

/* ============ 右侧控制面板 ============ */
.control-panel {
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.group-title {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  letter-spacing: var(--tracking-wide);
}

/* 规格选择 */
.preset-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-2);
}

.preset-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--space-3) var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);

  &:hover {
    border-color: var(--color-primary-border);
  }

  &.active {
    border-color: var(--color-primary);
    background: var(--color-primary-bg);
  }

  .preset-label {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--color-text);
  }

  .preset-desc {
    font-size: 12px;
    color: var(--color-text-tertiary);
  }
}

/* 底色选择 */
.bg-list {
  display: flex;
  gap: var(--space-2);
}

.bg-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);

  &:hover {
    background: var(--color-bg-muted);
  }

  &.active {
    border-color: var(--color-primary);
  }

  .bg-swatch {
    position: relative;
    width: 36px;
    height: 36px;
    border-radius: var(--radius-full);
    border: 2px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color var(--duration-fast) var(--ease-out);
  }

  &.active .bg-swatch {
    border-color: var(--color-primary);
  }

  .bg-label {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }
}

/* 提示框 */
.tip-box {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-bg-muted);

  .tip-icon {
    color: var(--color-primary);
    font-size: 14px;
    margin-top: 1px;
    flex-shrink: 0;
  }

  .tip-text {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    line-height: 1.5;
  }
}

/* 底部操作按钮 */
.action-row {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  height: 36px;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  border-radius: var(--radius-md);

  &.action-download {
    background: var(--color-bg);
    border-color: var(--color-border);
    color: var(--color-text);

    &:hover:not(:disabled) {
      border-color: var(--color-primary-border);
      color: var(--color-primary);
    }
  }

  &.action-confirm {
    width: 100%;
  }
}
</style>
