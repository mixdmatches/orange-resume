import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import vueDevTools from 'vite-plugin-vue-devtools'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'
import MotionResolver from 'motion-v/resolver'
// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    vueDevTools(),
    Components({
      resolvers: [IconsResolver(), MotionResolver()],
    }),
    Icons({}),
  ],
  resolve: {
    alias: {
      '@': path.resolve('./src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 注入全局 SCSS 变量与 mixin（themify 等）
        // design-tokens/themes/utilities 由 index.scss 统一引入，避免 :root 重复输出
        additionalData: `
          @use "@/assets/styles/variables.scss" as *;
        `,
      },
    },
  },
  server: {
    host: '0.0.0.0',
    open: true,
    proxy: {
      // 将 /api 前缀的请求代理到 NestJS 后端，避免联调时跨域
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '/api'),
      },
    },
  },
})
