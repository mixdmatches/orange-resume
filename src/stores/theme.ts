import { defineStore } from 'pinia'
import { theme } from 'ant-design-vue'
import { computed, ref, watchEffect } from 'vue'
export const useThemeStore = defineStore(
  'theme',
  () => {
    // 定义主题配置
    const themeConfig = computed(() => {
      return {
        algorithm: isLight.value ? theme.defaultAlgorithm : theme.darkAlgorithm,
      }
    })

    // 1.检测系统默认主题
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)')
    const isLight = ref(prefersLight.matches)

    // 2.监听系统主题变化
    const handleThemeChange = (event: MediaQueryListEvent) => {
      isLight.value = event.matches
    }

    // 3.初始化监听
    watchEffect(() => {
      prefersLight.addEventListener('change', handleThemeChange)
      return () => {
        prefersLight.removeEventListener('change', handleThemeChange)
      }
    })

    // 4.定义切换主题方法函数
    const switchTheme = (theme: string) => {
      isLight.value = theme === 'light'
      window.document.documentElement.setAttribute('data-theme', theme)
    }

    // 5.监听isLight变化，切换主题
    watchEffect(() => {
      switchTheme(isLight.value ? 'light' : 'dark')
    })

    return {
      isLight,
      themeConfig,
      switchTheme,
    }
  },
  {
    persist: true,
  },
)
