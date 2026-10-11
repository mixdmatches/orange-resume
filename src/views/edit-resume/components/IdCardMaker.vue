<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { VueCropper } from 'vue-cropper'
import 'vue-cropper/dist/index.css'
import {
  UploadOutlined,
  SwapOutlined,
  UndoOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons-vue'
import { motion } from 'motion-v'
import { removeBackground, preload } from '@imgly/background-removal'

/** 抠图公共配置：资源走 npmmirror 镜像，规避官方 CDN 国内被墙 */
const IMG_CONFIG = {
  // 模型与分片资源从 npmmirror 文件镜像加载（与主包 1.4.5 配套）
  publicPath:
    'https://registry.npmmirror.com/@imgly/background-removal-data/1.4.5/files/dist/',
  // 1.4.5 仅支持 small/medium，medium 是质量与体积的平衡点（约 40MB）
  model: 'medium' as const,
}

const props = defineProps<{
  /** 控制弹窗显示 */
  open: boolean
}>()

/** 模型是否已完成预热 */
let preloaded = false

/** 弹窗首次打开时预热模型资源（失败静默，生成时库会自动重拉） */
watch(
  () => props.open,
  open => {
    if (!open || preloaded) return
    preload(IMG_CONFIG)
      .then(() => {
        preloaded = true
      })
      .catch(() => {})
  },
  { immediate: true },
)

const emit = defineEmits<{
  /** 请求关闭弹窗 */
  (e: 'update:open', val: boolean): void
}>()

/** 底色预设 */
export interface BgColor {
  id: string
  label: string
  /** CSS 颜色值 */
  value: string
}

/** 固定证件照规格：一寸（25×35mm） */
const PRESET = { label: '一寸', width: 295, height: 413, desc: '25×35mm' }

/** 常用底色 */
const bgColors: BgColor[] = [
  { id: 'white', label: '白色', value: '#ffffff' },
  { id: 'blue', label: '蓝色', value: '#438edb' },
  { id: 'red', label: '红色', value: '#d50000' },
  { id: 'original', label: '原图', value: '' },
]

/** 当前选中的底色 ID */
const activeBgId = ref('blue')

/** 原始图片源（传入 VueCropper） */
const imageSrc = ref('')

/** 文件输入引用 */
const fileInputRef = ref<HTMLInputElement | null>(null)

/** 拖拽是否悬停 */
const isDragging = ref(false)

/** VueCropper 组件引用 */
const cropperRef = ref<InstanceType<typeof VueCropper> | null>(null)

/** 当前选中的底色对象 */
const activeBg = computed(
  () => bgColors.find(b => b.id === activeBgId.value) ?? bgColors[0],
)

/** 是否已上传图片 */
const hasImage = computed(() => !!imageSrc.value)

/** 预览视图状态：edit 编辑 / generating 生成中 / done 完成 */
const view = ref<'edit' | 'generating' | 'done'>('edit')

/** 生成完成的证件照 DataURL */
const previewUrl = ref('')

/** 初始截图框宽度（px） */
const INIT_CROP_WIDTH = 160

/** 初始截图框高度（px，按一寸比例 295:413 换算） */
const INIT_CROP_HEIGHT = Math.round(
  (INIT_CROP_WIDTH * PRESET.height) / PRESET.width,
)

/** 弹窗关闭 */
const handleClose = () => {
  emit('update:open', false)
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

/** 加载图片文件（交给 VueCropper 渲染） */
const loadImageFile = async (file: File) => {
  if (!file.type.startsWith('image/')) {
    message.error('请选择图片文件')
    return
  }
  const reader = new FileReader()
  reader.onload = ev => {
    const img = new Image()
    img.onload = () => {
      imageSrc.value = ev.target?.result as string
    }
    img.src = ev.target?.result as string
  }
  reader.readAsDataURL(file)
}

/** VueCropper 图片加载失败回调 */
const handleImgLoadError = () => {
  imageSrc.value = ''
  message.error('图片加载失败，请更换图片')
}

/** 重置截图框到初始位置 */
const handleResetCrop = () => {
  cropperRef.value?.refresh()
}

/** 将图片缩到长边 maxSide 内降低推理内存占用，失败时返回原图 */
const shrinkImage = (blob: Blob, maxSide = 1080): Promise<Blob> =>
  createImageBitmap(blob)
    .then(bitmap => {
      const longSide = Math.max(bitmap.width, bitmap.height)
      if (longSide <= maxSide) {
        bitmap.close()
        return blob
      }
      const scale = maxSide / longSide
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(bitmap.width * scale)
      canvas.height = Math.round(bitmap.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        bitmap.close()
        return blob
      }
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      bitmap.close()
      return new Promise<Blob>(resolve =>
        canvas.toBlob(b => resolve(b ?? blob), 'image/png'),
      )
    })
    .catch(() => blob)

/** 裁剪与抠图缓存：结果页换底色时 cropper 已卸载，直接复用此处数据 */
const pipelineCache = ref<{
  /** 裁剪指纹：裁剪框/图片位姿/输出体积任一变化都会使其失效 */
  fingerprint: string
  /** 裁剪结果 Blob */
  cropBlob: Blob
  /** AI 抠出的透明人像（原图模式下为 null） */
  cutout: Blob | null
} | null>(null)

/** 从 cropper 异步取裁剪 Blob（组件已卸载时返回 null） */
const getCropBlob = (cropper: any): Promise<Blob | null> =>
  new Promise(resolve => {
    try {
      cropper.getCropBlob((blob: Blob) => resolve(blob ?? null))
    } catch {
      resolve(null)
    }
  })

/** 计算裁剪指纹：图片缩放/位移/裁剪框变化都会反映到指纹 */
const fingerprintOf = (cropper: any, blob: Blob) =>
  [
    cropper.scale,
    cropper.x,
    cropper.y,
    cropper.cropW,
    cropper.cropH,
    cropper.cropOffsertX,
    cropper.cropOffsertY,
    blob.size,
  ].join('|')

/** 将人像 Blob 合成到规格尺寸画布（非原图模式先填底色） */
const composeIdCard = async (portraitBlob: Blob): Promise<string> => {
  const canvas = document.createElement('canvas')
  canvas.width = PRESET.width
  canvas.height = PRESET.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  const isOriginal = activeBgId.value === 'original'
  const portrait = await createImageBitmap(portraitBlob)
  if (!isOriginal) {
    ctx.fillStyle = activeBg.value.value
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.drawImage(portrait, 0, 0, canvas.width, canvas.height)
  portrait.close()
  return canvas.toDataURL('image/png')
}

/** AI 抠图：先缩图降低内存，输出透明背景 PNG */
const aiCutout = async (cropBlob: Blob): Promise<Blob> => {
  const heapNow = () =>
    (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
      ?.usedJSHeapSize ?? 0
  const heap0 = heapNow()
  const t0 = performance.now()
  const shrunk = await shrinkImage(cropBlob)
  const tShrink = Math.round(performance.now() - t0)
  const blob = await removeBackground(shrunk, {
    ...IMG_CONFIG,
    output: { format: 'image/png' },
  })
  const tTotal = Math.round(performance.now() - t0)
  console.table([
    { 指标: '原图体积', 值: `${(cropBlob.size / 1024).toFixed(0)} KB` },
    { 指标: '送入模型体积', 值: `${(shrunk.size / 1024).toFixed(0)} KB` },
    { 指标: '缩图耗时', 值: `${tShrink} ms` },
    { 指标: '端到端耗时', 值: `${tTotal} ms` },
    {
      指标: '堆增长(参考)',
      值: `${((heapNow() - heap0) / 1048576).toFixed(1)} MB`,
    },
  ])
  return blob
}

/** 编辑态生成：从 cropper 取裁剪，指纹未变则复用缓存免二次推理 */
const generateFromCropper = async (): Promise<string> => {
  const cropper = cropperRef.value
  if (!cropper) return ''
  const cropBlob = await getCropBlob(cropper)
  if (!cropBlob) return ''
  const isOriginal = activeBgId.value === 'original'
  const fp = fingerprintOf(cropper, cropBlob)
  let cutoutBlob =
    pipelineCache.value?.fingerprint === fp ? pipelineCache.value.cutout : null
  if (!isOriginal && !cutoutBlob) cutoutBlob = await aiCutout(cropBlob)
  pipelineCache.value = { fingerprint: fp, cropBlob, cutout: cutoutBlob }
  return composeIdCard(isOriginal ? cropBlob : (cutoutBlob as Blob))
}

/** 结果页换底色：不依赖 cropper，直接复用缓存重绘 */
const regenerateWithBg = async (): Promise<string> => {
  const entry = pipelineCache.value
  if (!entry) return ''
  const isOriginal = activeBgId.value === 'original'
  let cutoutBlob = entry.cutout
  if (!isOriginal && !cutoutBlob) {
    cutoutBlob = await aiCutout(entry.cropBlob)
    pipelineCache.value = { ...entry, cutout: cutoutBlob }
  }
  return composeIdCard(isOriginal ? entry.cropBlob : cutoutBlob)
}

/** 生成并进入结果视图（cropper 入口失败回编辑页，缓存入口失败留在结果页） */
const runGenerate = async (mode: 'cropper' | 'cache') => {
  view.value = 'generating'
  const dataUrl =
    mode === 'cropper' ? await generateFromCropper() : await regenerateWithBg()
  if (!dataUrl) {
    message.error('生成失败，请重试')
    view.value = mode === 'cache' ? 'done' : 'edit'
    return
  }
  previewUrl.value = dataUrl
  view.value = 'done'
}

/** 点击预览 */
const handlePreviewImg = async () => {
  if (!hasImage.value) {
    message.warning('请先上传照片')
    return
  }
  await runGenerate('cropper')
}

/** 结果页切换底色：复用缓存秒级重绘，或首次切到颜色时补一次推理 */
const handleResultBgChange = (bgId: string) => {
  if (bgId === activeBgId.value) return
  activeBgId.value = bgId
  runGenerate('cache')
}

/** 返回编辑视图 */
const handleBackEdit = () => {
  view.value = 'edit'
}

/** 下载生成的证件照 */
const handleDownload = () => {
  if (!previewUrl.value) return
  const a = document.createElement('a')
  a.href = previewUrl.value
  a.download = `${PRESET.label}_证件照.png`
  a.click()
  message.success('下载成功')
}
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

        <!-- 已上传时的裁剪预览（VueCropper 接管交互） -->
        <motion.div
          v-else-if="view === 'edit'"
          class="crop-stage"
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          :transition="{ duration: 0.25 }"
        >
          <div class="cropper-wrap">
            <VueCropper
              ref="cropperRef"
              :img="imageSrc"
              :output-size="1"
              output-type="png"
              :info="false"
              :can-scale="true"
              :auto-crop="true"
              :auto-crop-width="INIT_CROP_WIDTH"
              :auto-crop-height="INIT_CROP_HEIGHT"
              :fixed="true"
              :fixed-number="[PRESET.width, PRESET.height]"
              :full="true"
              :high="true"
              :can-move="true"
              :can-move-box="true"
              :center-box="true"
              :max-img-size="4000"
              mode="contain"
              @img-load-error="handleImgLoadError"
            />
          </div>

          <div class="crop-footer">
            <span class="crop-size">
              {{ PRESET.width }}×{{ PRESET.height }} px ·
              {{ PRESET.desc }}
            </span>
            <div class="crop-actions">
              <a-tooltip title="重新选择">
                <button class="mini-btn" @click="triggerFileSelect">
                  <SwapOutlined />
                </button>
              </a-tooltip>
              <a-tooltip title="重置裁剪框">
                <button class="mini-btn" @click="handleResetCrop">
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

        <!-- 生成中：loading -->
        <div v-else-if="view === 'generating'" class="progress-stage">
          <a-spin size="large" />
          <div class="stage-text">
            正在生成证件照，首次使用需下载模型资源，请耐心等待
          </div>
        </div>

        <!-- 生成完成：结果预览、切底色与导出 -->
        <div v-else class="result-stage">
          <img :src="previewUrl" class="result-img" alt="证件照预览" />
          <div class="result-bg-row">
            <button
              v-for="bg in bgColors"
              :key="bg.id"
              class="result-bg-dot"
              :class="{ active: activeBgId === bg.id, 'no-color': !bg.value }"
              :style="bg.value ? { backgroundColor: bg.value } : undefined"
              :title="bg.label"
              @click="handleResultBgChange(bg.id)"
            />
          </div>
          <div class="result-actions">
            <a-button @click="handleBackEdit">返回编辑</a-button>
            <a-button type="primary" @click="handleDownload">下载照片</a-button>
          </div>
        </div>
      </div>

      <!-- ============ 右侧：控制面板（仅编辑态） ============ -->
      <div v-if="view === 'edit'" class="control-panel">
        <!-- 提示 -->
        <div class="tip-box">
          <InfoCircleOutlined class="tip-icon" />
          <span class="tip-text">
            拖动/滚轮缩放调整照片，拖动裁剪框选取区域；点击预览后自动抠出人像，可再换底色或下载
          </span>
        </div>

        <!-- 操作按钮 -->
        <div class="action-row">
          <a-button
            type="primary"
            class="action-btn action-confirm"
            :disabled="!hasImage"
            @click="handlePreviewImg"
            >预览效果</a-button
          >
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

/* VueCropper 容器（组件根节点默认铺满父容器） */
.cropper-wrap {
  flex: 1;
  min-height: 400px;
  border-radius: var(--radius-lg);
  overflow: hidden;

  :deep(.vue-cropper) {
    background: var(--color-bg-muted);
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

/* 生成中进度舞台 */
.progress-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  min-height: 400px;

  .stage-text {
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
  }
}

/* 生成结果舞台 */
.result-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-5);
  min-height: 400px;

  .result-img {
    width: 236px;
    height: 330px;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    background: #fff;
  }

  .result-bg-row {
    display: flex;
    gap: var(--space-3);
  }

  .result-bg-dot {
    width: 24px;
    height: 24px;
    border-radius: var(--radius-full);
    border: 2px solid var(--color-border);
    cursor: pointer;
    transition: border-color var(--duration-fast) var(--ease-out);

    &.active {
      border-color: var(--color-primary);
    }

    &.no-color {
      background: repeating-conic-gradient(#e8e8e8 0% 25%, #fff 0% 50%) 0 0 /
        8px 8px;
    }
  }

  .result-actions {
    display: flex;
    gap: var(--space-3);
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
