/// <reference types="vite/client" />
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<unknown, unknown, unknown>
  export default component
}

/** 自定义环境变量类型声明，供 import.meta.env 使用 */
interface ImportMetaEnv {
  /** 后端 API 基础地址，如 http://localhost:3000/api */
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
