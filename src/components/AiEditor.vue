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
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  aiEditor && aiEditor.destroy()
})
</script>

<template>
  <div ref="divRef" style="height: 300px" />
</template>
