<script lang="ts" setup>
import { ref, inject, toRefs, computed } from 'vue'
import type { Resume } from '@/types/resume'
import PhotoImg from './PhotoImg.vue'

const open = defineModel<boolean>('open', {
  required: true,
})

const resume: Resume = inject('resume') as Resume

const { basic } = toRefs(resume)

const ratioOptions: Record<string, string> = {
  square: '1:1',
  fourThree: '4:3',
  threeFour: '3:4',
  sixteenNine: '16:9',
  custom: '自定义',
} as const

const radiusOptions: Record<string, string> = {
  none: '无',
  medium: '中等',
  round: '圆形',
  custom: '自定义',
} as const

const activeRadiusKey = ref<keyof typeof radiusOptions>('round')

const activeRatioKey = computed<keyof typeof ratioOptions>(() => {
  const active = Object.entries(ratioOptions).find(
    ([, label]) => label === basic.value.photoConfig.aspectRatio,
  )
  return (active?.[0] as keyof typeof ratioOptions) ?? 'custom'
})

const updateRatio = (key: keyof typeof ratioOptions) => {
  const config = basic.value.photoConfig
  config.aspectRatio = ratioOptions[key]

  if (key === 'square') {
    config.width = 90
    config.height = 90
  } else if (key === 'fourThree') {
    config.width = 120
    config.height = 90
  } else if (key === 'threeFour') {
    config.width = 90
    config.height = 120
  } else if (key === 'sixteenNine') {
    config.width = 160
    config.height = 90
  }

  if (activeRadiusKey.value === 'round') {
    config.borderRadius = Math.floor(config.width / 2)
  }
  if (activeRadiusKey.value === 'custom') {
    config.customBorderRadius = config.borderRadius
    config.borderRadius = 0
  }
}

const updateRadius = (key: keyof typeof radiusOptions) => {
  activeRadiusKey.value = key
  const config = basic.value.photoConfig

  config.borderRadius =
    key === 'none'
      ? 0
      : key === 'medium'
        ? 8
        : key === 'round'
          ? Math.floor(config.width / 2)
          : config.borderRadius

  if (key === 'custom') {
    config.customBorderRadius = config.borderRadius
    config.borderRadius = 0
  }
}
</script>

<template>
  <a-drawer
    v-model:open="open"
    root-class-name="img-drawer-root"
    placement="left"
  >
    <div class="img-drawer">
      <div class="drawer-title">头像设置</div>

      <div class="preview-box">
        <PhotoImg
          :url="basic.photo"
          :width="basic.photoConfig.width"
          :height="basic.photoConfig.height"
          :radius="
            activeRadiusKey == 'custom'
              ? basic.photoConfig.customBorderRadius
              : basic.photoConfig.borderRadius
          "
        />
      </div>

      <div class="field">
        <div class="field-label">在线链接</div>
        <a-input v-model:value="basic.photo" placeholder="输入图片链接" />
      </div>

      <div class="field">
        <div class="field-label">尺寸</div>
        <div class="size-grid">
          <div class="size-item">
            <a-input
              v-model:value="basic.photoConfig.width"
              type="number"
              min="1"
              max="500"
              placeholder="宽度"
            />
            <span class="size-suffix">W</span>
          </div>
          <div class="size-item">
            <a-input
              v-model:value="basic.photoConfig.height"
              type="number"
              min="1"
              max="500"
              placeholder="高度"
            />
            <span class="size-suffix">H</span>
          </div>
        </div>
      </div>

      <div class="field">
        <div class="field-label">宽高比</div>
        <div class="button-group">
          <a-button
            v-for="[key, label] in Object.entries(ratioOptions)"
            :key="key"
            :type="activeRatioKey === key ? 'primary' : 'default'"
            @click="updateRatio(key)"
          >
            {{ label }}
          </a-button>
        </div>
      </div>

      <div class="field">
        <div class="field-label">圆角</div>
        <div class="button-group">
          <a-button
            v-for="[key, label] in Object.entries(radiusOptions)"
            :key="key"
            :type="activeRadiusKey === key ? 'primary' : 'default'"
            @click="updateRadius(key)"
          >
            {{ label }}
          </a-button>
        </div>
        <a-input
          v-if="activeRadiusKey == 'custom'"
          v-model:value="basic.photoConfig.customBorderRadius"
          type="number"
          min="0"
          :max="basic.photoConfig.width"
          placeholder="圆角"
        />
      </div>
    </div>
  </a-drawer>
</template>

<style lang="scss" scoped>
.img-drawer-root {
  width: 420px;
}

.img-drawer {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.drag-handle {
  width: 64px;
  height: 6px;
  background: #d9d9d9;
  border-radius: 999px;
  margin: 0 auto 12px;
}

.drawer-title {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: #111111;
}

.preview-box {
  display: flex;
  justify-content: center;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field-label {
  color: #222222;
  font-size: 14px;
  font-weight: 500;
}

.size-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.size-item {
  position: relative;
}

.size-suffix {
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.close-button {
  margin-top: 8px;
}
</style>
