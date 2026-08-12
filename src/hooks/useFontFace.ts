import { onMounted } from 'vue'
import { FONT_DEFINITIONS, getFontFaceCss } from '@/utils/fonts'

const FONT_STYLE_ID = 'app-dynamic-fonts'
let fontsInjected = false

/**
 * 动态注入 @font-face 规则到页面头部
 * 确保字体文件能被浏览器正确加载
 * 使用单例模式：即使多个组件调用，也只注入一次
 */
export function useFontFace() {
  onMounted(async () => {
    // 防止同一页面内重复注入
    if (fontsInjected) return

    // 检查 DOM 中是否已存在（跨页面实例复用场景）
    const existing = document.getElementById(FONT_STYLE_ID)
    if (existing) {
      fontsInjected = true
      return
    }

    const styleEl = document.createElement('style')
    styleEl.id = FONT_STYLE_ID
    document.head.appendChild(styleEl)

    try {
      // 遍历所有字体定义，逐个生成 @font-face CSS 并拼接
      const cssSegments = await Promise.all(
        FONT_DEFINITIONS.map(definition => getFontFaceCss(definition.value)),
      )
      styleEl.textContent = cssSegments.join('\n')
      fontsInjected = true
    } catch (error) {
      console.error('[useFontFace] 字体加载失败：', error)
    }
  })
}
