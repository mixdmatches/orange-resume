import { defineStore } from 'pinia'
import { theme } from 'ant-design-vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

type ThemeType = 'light' | 'dark' | 'system'

export const useThemeStore = defineStore(
  'theme',
  () => {
    // 当前主题
    const currentTheme = ref<ThemeType>('light')

    // 检测系统默认主题
    const prefersLightQuery = window.matchMedia('(prefers-color-scheme: light)')
    const systemPrefersLight = ref(prefersLightQuery.matches)

    // 计算实际应用的主题（考虑系统设置）
    const activeTheme = computed<ThemeType>(() => {
      if (currentTheme.value === 'system') {
        return systemPrefersLight.value ? 'light' : 'dark'
      }
      return currentTheme.value
    })

    // 计算主题配置（根据实际应用的主题）
    // 通过 AntD ConfigProvider 的 token 映射，让 AntD 组件跟随全局 design token
    const themeConfig = computed(() => ({
      algorithm:
        activeTheme.value === 'light'
          ? theme.defaultAlgorithm
          : theme.darkAlgorithm,
      token: {
        colorPrimary: '#1677ff',
        colorSuccess: '#22c55e',
        colorWarning: '#f59e0b',
        colorError: '#ef4444',
        colorInfo: '#1677ff',
        borderRadius: 8,
        fontSize: 14,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', 'Microsoft YaHei', sans-serif",
      },
      components: {
        Button: {
          controlHeight: 36,
          paddingInline: 20,
          fontWeight: 500,
        },
        Input: {
          controlHeight: 40,
          borderRadius: 8,
        },
        Card: {
          borderRadiusLG: 12,
        },
        Modal: {
          borderRadiusLG: 12,
        },
      },
    }))

    // 处理系统主题变化
    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      systemPrefersLight.value = event.matches
    }

    // 更新文档主题属性
    const updateDocumentTheme = (theme: ThemeType) => {
      window.document.documentElement.setAttribute('data-theme', theme)
    }

    // 切换主题方法
    const switchTheme = (newTheme: ThemeType) => {
      currentTheme.value = newTheme
    }

    // 监听系统主题变化
    watch(
      () => systemPrefersLight.value,
      newValue => {
        if (currentTheme.value === 'system') {
          updateDocumentTheme(newValue ? 'light' : 'dark')
        }
      },
    )

    // 监听当前主题设置变化
    watch(
      () => currentTheme.value,
      newValue => {
        if (newValue === 'system') {
          updateDocumentTheme(systemPrefersLight.value ? 'light' : 'dark')
        } else {
          updateDocumentTheme(newValue)
        }
      },
      { immediate: true },
    ) // 立即执行一次以设置初始主题

    onMounted(() => {
      prefersLightQuery.addEventListener('change', handleSystemThemeChange)
    })
    onUnmounted(() => {
      prefersLightQuery.removeEventListener('change', handleSystemThemeChange)
    })

    return {
      currentTheme,
      themeConfig,
      activeTheme,
      switchTheme,
    }
  },
  {
    persist: true,
  },
)
