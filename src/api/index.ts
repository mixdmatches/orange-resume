export * as authApi from './auth'
export * as resumeApi from './resume'
export * as aiApi from './ai'

// 同时导出各模块的命名成员，方便按需引入
export * from './auth'
export * from './resume'
export * from './ai'
