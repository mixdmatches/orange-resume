<script setup lang="ts">
import { PlusOutlined, VerticalAlignTopOutlined } from '@ant-design/icons-vue'
import TemplateThumb from '@/components/TemplateThumb.vue'
import { useResumeImport } from '../composables/useResumeImport'

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  imported: []
}>()

const {
  importLoading,
  importProgressText,
  pdfAbortController,
  importSnapshot,
  handleImportJSON,
  handleImportPDF,
  handleStopImportPDF,
} = useResumeImport({
  refresh: () => emit('imported'),
  closeModal: () => (open.value = false),
})
</script>

<template>
  <a-modal
    v-model:open="open"
    title="选择导入文件类型"
    centered
    :footer="null"
    :closable="false"
  >
    <!-- 空闲态：选择导入方式 -->
    <div v-if="!importLoading" class="import-options">
      <a-card hoverable class="import-card" @click="handleImportJSON">
        <template #cover>
          <div class="import-icon json-icon">
            <plus-outlined />
          </div>
        </template>
        <a-card-meta
          title="JSON 导入"
          description="从本地 JSON 文件导入简历配置"
        />
      </a-card>

      <a-card hoverable class="import-card" @click="handleImportPDF">
        <template #cover>
          <div class="import-icon pdf-icon">
            <vertical-align-top-outlined />
          </div>
        </template>
        <a-card-meta
          title="PDF 导入(AI解析)"
          description="从本地 PDF 文件中提取简历内容，AI解析后导入"
        />
      </a-card>
    </div>

    <!-- 解析态：白纸实时生长预览，AI 内容随流逐块填充 -->
    <div v-else class="import-live">
      <div v-if="importSnapshot" class="live-paper">
        <TemplateThumb
          :template-id="importSnapshot.templateId"
          :resume="importSnapshot"
          fit="width"
        />
      </div>
      <div v-else class="live-extract">
        <a-spin size="small" />
      </div>
      <div class="live-status">
        <span v-if="importSnapshot" class="live-dot" aria-hidden="true"></span>
        <span class="progress-text">{{ importProgressText }}</span>
        <a-button
          v-if="pdfAbortController"
          size="small"
          type="link"
          @click="handleStopImportPDF"
        >
          停止解析
        </a-button>
      </div>
    </div>
  </a-modal>
</template>

<style scoped lang="scss">
/* ============ 导入弹窗 ============ */
.import-options {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
  justify-content: space-between;
  padding-top: var(--space-3);
}

.import-card {
  width: calc(50% - 8px);
  cursor: pointer;
  transition: transform var(--duration-base) var(--ease-out);

  &:hover {
    transform: translateY(-2px);
  }
}

.import-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  font-size: 36px;
  color: #fff;
  border-radius: var(--radius-md);
}

.json-icon {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
}

.pdf-icon {
  background: linear-gradient(135deg, #f04864 0%, #ff7a45 100%);
}

/* ============ 流式解析实时预览 ============ */
.import-live {
  padding-top: var(--space-3);
  animation: fade-up var(--duration-base) var(--ease-out);
}

// A4 白纸舞台：TemplateThumb fit="width" 按容器宽自适应缩放
.live-paper {
  width: min(320px, 100%);
  margin: 0 auto;
  overflow: hidden;
  background: #fff;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
}

// 提取文字阶段的过渡占位
.live-extract {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 140px;
}

.live-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) 0 var(--space-1);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

// 呼吸圆点：表示内容正在实时生成
.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: live-pulse 1.2s var(--ease-out) infinite;
}

@keyframes live-pulse {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(0.85);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .import-live,
  .live-dot {
    animation: none;
  }
}
</style>
