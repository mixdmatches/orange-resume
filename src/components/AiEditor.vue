<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { AiEditor } from 'aieditor'
import 'aieditor/dist/style.css'

const model = defineModel<string>({
  default: '',
})
const divRef = ref<Element>()

let aiEditor: AiEditor | null = null

onMounted(() => {
  aiEditor = new AiEditor({
    element: divRef.value as Element,
    toolbarKeys: [
      'undo',
      'redo',
      'brush',
      'eraser',
      '|',
      'bold',
      'italic',
      'underline',
      'strike',
      'link',
      'code',
      'subscript',
      'superscript',
      'hr',
      'emoji',
      '|',
      'highlight',
      'font-color',
      '|',
      'align',
      'line-height',
      '|',
      'bullet-list',
      'ordered-list',
      'indent-decrease',
      'indent-increase',
      'break',
      '|',
      'source-code',
      'fullscreen',
    ],
    placeholder: '点击输入内容...',
    content: model.value,
    onChange: aiEditor => {
      model.value = aiEditor.getHtml()
    },
  })
})

onUnmounted(() => {
  // 销毁编辑器并置空引用：库内部会级联清理 ProseMirror 视图、
  // 插件级 window 监听、tippy 弹层与事件总线，置空防止悬垂引用
  if (aiEditor) {
    aiEditor.destroy()
    aiEditor = null
  }
})
</script>

<template>
  <div ref="divRef" class="ai-editor-box" style="height: 300px" />
</template>

<style scoped>
.ai-editor-box {
  width: 100%;
  max-width: 100%;
}

.ai-editor-box :deep(.aie-container),
.ai-editor-box :deep(.aie-resize-wrapper) {
  max-width: 100% !important;
}
</style>
