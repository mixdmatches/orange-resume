/**
 * 简历数据调度层（Repository 模式）
 * 组件层只与本模块交互，由本模块决定走 IndexedDB 还是后端
 *
 * Local-First 策略：
 *   - 读：先 IDB（毫秒级）→ 没有再走云端 → 拉到后回填 IDB
 *   - 写：先写 IDB（本地立即可见）→ 入同步队列 → 异步上云
 *   - 删：先删 IDB → 入队列 → 异步删云端
 *   - 离线：写操作全部进队列，监听 online 事件回放
 *
 * 多端冲突策略：用 updatedAt 时间戳比对，云端更新则覆盖本地
 *
 * 说明：错误提示由 request.ts 的响应拦截器统一弹出，本层只负责
 *       控制流（成功/失败重试/出队等），不再重复 message.error。
 */
import type { Resume } from '@/types/resume'
import {
  addResumeIDB,
  deleteBatchResumeIDB,
  deleteResumeIDB,
  getAllResumesIDB,
  getResumeByIdIDB,
  updateResumeIDB,
} from './resumeIDB'
import {
  createResumeApi,
  deleteResumeApi,
  getResumeByIdApi,
  getResumeListApi,
  updateResumeApi,
} from '@/api/resume'
import {
  compactOps,
  dequeueSync,
  enqueueSync,
  getPendingCount,
  getPendingOps,
  incrementRetry,
  type SyncOp,
} from './syncQueue'

/** 最大重试次数，超过则丢弃避免永久阻塞 */
const MAX_RETRIES = 3
/** 高频编辑的防抖间隔（毫秒），合并连续 update */
const FLUSH_DEBOUNCE = 2000

/**
 * 更新 store 中的同步状态（异步不阻塞主流程）
 * 用于 UI 显示「已同步 / 同步中 / 待同步 N 条 / 离线」
 */
const updateSyncStatus = async () => {
  // 动态导入避免循环依赖（stores/sync → ... → repository → stores/sync）
  const { useSyncStore } = await import('@/stores/sync')
  const store = useSyncStore()
  const pending = await getPendingCount()
  store.setCloudPending(pending)
  store.setCloudStatus(
    navigator.onLine ? (pending > 0 ? 'pending' : 'synced') : 'offline',
  )
}

/**
 * 执行单个同步操作（真正调后端）
 * 注意：request.ts 拦截器会自动弹错误提示，这里只返回成功/失败
 * @param op 待执行操作
 * @returns 是否成功
 */
const executeOp = async (op: SyncOp): Promise<boolean> => {
  try {
    switch (op.type) {
      case 'create':
        if (!op.payload) throw new Error('payload missing')
        await createResumeApi(op.payload)
        return true
      case 'update':
        if (!op.payload) throw new Error('payload missing')
        await updateResumeApi(op.resumeId, op.payload)
        return true
      case 'delete':
        await deleteResumeApi(op.resumeId)
        return true
      default:
        return true
    }
  } catch (err) {
    // 拦截器已弹错误，这里只打日志便于调试
    console.warn('[sync] op failed', op, err)
    return false
  }
}

/**
 * 触发一次队列回放（如果在线）
 * 流程：合并操作 → 按顺序执行 → 成功出队，失败重试
 */
const flushQueue = async () => {
  if (!navigator.onLine) {
    await updateSyncStatus()
    return
  }
  const { useSyncStore } = await import('@/stores/sync')
  const store = useSyncStore()
  store.setCloudStatus('syncing')

  const ops = await compactOps()
  console.log(ops, '合并后的操作栈')
  for (const op of ops) {
    const ok = await executeOp(op)
    if (ok) {
      await dequeueSync(op.opId)
    } else {
      // 失败：超过重试上限则丢弃，否则累加重试次数
      if (op.retries >= MAX_RETRIES) {
        await dequeueSync(op.opId)
      } else {
        await incrementRetry(op.opId)
      }
      // 遇到失败就停止，保持顺序，下次再试
      break
    }
  }
  await updateSyncStatus()
}

/** 防抖回放定时器句柄 */
let flushTimer: ReturnType<typeof setTimeout> | null = null

/**
 * 防抖回放：合并高频编辑
 * 用户每秒可能改 10 次，2 秒内只触发一次回放
 */
const scheduleFlush = () => {
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = setTimeout(() => {
    flushTimer = null
    flushQueue()
  }, FLUSH_DEBOUNCE)
}

/** 网络监听是否已注册（避免重复绑定） */
let listening = false

/**
 * 注册网络状态监听（只注册一次）
 * - online：触发队列回放
 * - offline：更新 UI 状态
 */
const ensureNetworkListener = () => {
  if (listening) return
  window.addEventListener('online', () => flushQueue())
  window.addEventListener('offline', () => updateSyncStatus())
  listening = true
}

/**
 * 获取简历列表
 * 优先本地（列表页秒开），后台静默拉云端补全
 * @returns 本地已有的简历列表（按更新时间倒序）
 */
export async function listResumes(): Promise<Resume[]> {
  ensureNetworkListener()
  // 1. 先读本地，立即返回
  const local = await getAllResumesIDB()

  // 2. 静默同步：后台拉云端补全（不阻塞列表渲染）
  if (navigator.onLine) {
    void (async () => {
      try {
        // 读取同步队列，避免重复拉取删除中的简历，也避免误删创建中的简历
        const pendingOps = await getPendingOps()
        const pendingDeleteIds = new Set(
          pendingOps.filter(op => op.type === 'delete').map(op => op.resumeId),
        )
        const pendingCreateIds = new Set(
          pendingOps.filter(op => op.type === 'create').map(op => op.resumeId),
        )

        const remote = await getResumeListApi()
        const remoteIds = new Set(remote.list.map(r => r.id))

        for (const summary of remote.list) {
          // 防竞态：跳过有 pending delete 的简历，避免删除中的简历被复活
          if (pendingDeleteIds.has(summary.id)) {
            console.log(
              `[listResumes] 跳过 ${summary.id}：本地有待执行的删除操作`,
            )
            continue
          }
          const existed = local.find(r => r.id === summary.id)
          if (!existed) {
            // 本地没有 → 拉详情后存本地
            try {
              const detail = await getResumeByIdApi(summary.id)
              await addResumeIDB(detail)
            } catch (e) {
              console.warn('拉取简历详情失败', e)
            }
          } else if (
            summary.updatedAt &&
            (!existed.updatedAt || summary.updatedAt > existed.updatedAt)
          ) {
            // 云端更新时间更新 → 拉详情覆盖本地
            try {
              const detail = await getResumeByIdApi(summary.id)
              await updateResumeIDB(summary.id, detail)
            } catch (e) {
              console.warn('更新简历详情失败', e)
            }
          }
        }

        // 对账：删除本地有但云端已不存在的简历（排除正在创建中的）
        // 场景：用户在另一台设备删除了某份简历，本机需要同步删除
        for (const localResume of local) {
          if (
            !remoteIds.has(localResume.id) &&
            !pendingCreateIds.has(localResume.id)
          ) {
            console.log(
              `[listResumes] 对账删除 ${localResume.id}：云端已不存在`,
            )
            await deleteResumeIDB(localResume.id)
          }
        }
      } catch (e) {
        // 离线或未登录，静默失败
        console.warn('同步云端列表失败', e)
      }
    })()
  }

  return local.sort(
    (a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt),
  )
}

/**
 * 获取单份简历详情
 * 优先 IDB，没有再走云端，云端拉到后回填 IDB
 * @param id 简历 ID
 * @returns 简历对象或 null
 */
export async function getResumeById(id: string): Promise<Resume | null> {
  ensureNetworkListener()
  // 1. 先读本地
  const local = await getResumeByIdIDB(id)
  if (local) {
    // 后台静默拉云端更新（如果有更新版本）
    if (navigator.onLine) {
      void (async () => {
        try {
          const remote = await getResumeByIdApi(id)
          if (
            remote.updatedAt &&
            (!local.updatedAt || remote.updatedAt > local.updatedAt)
          ) {
            await updateResumeIDB(id, remote)
            return remote // 返回最新版本
          }
        } catch {
          // 静默失败
        }
      })()
    }
    return local
  }

  // 2. 本地没有，走云端
  if (navigator.onLine) {
    try {
      const remote = await getResumeByIdApi(id)
      await addResumeIDB(remote)
      return remote
    } catch {
      return null
    }
  }
  return null
}

/**
 * 创建新简历
 * 先写 IDB（本地立即可见），再入队，触发异步上云
 * @param resume 完整简历对象
 */
export async function createResume(resume: Resume): Promise<void> {
  ensureNetworkListener()
  await addResumeIDB(resume)
  await enqueueSync({
    type: 'create',
    resumeId: resume.id,
    payload: resume,
  })
  flushQueue()
}

/**
 * 更新简历（高频编辑场景）
 * 先写 IDB，再入队（会被 compactOps 合并），防抖触发上云
 * @param resume 完整简历对象
 */
export async function updateResume(resume: Resume): Promise<void> {
  ensureNetworkListener()
  await updateResumeIDB(resume.id, resume)
  await enqueueSync({
    type: 'update',
    resumeId: resume.id,
    payload: resume,
  })
  // 防抖回放，合并高频编辑
  scheduleFlush()
}

/**
 * 删除简历
 * 先删 IDB，再入队
 * @param id 简历 ID
 */
export async function deleteResume(id: string): Promise<void> {
  ensureNetworkListener()
  await deleteResumeIDB(id)
  await enqueueSync({
    type: 'delete',
    resumeId: id,
  })
  flushQueue()
}

/**
 * 批量删除简历
 * 先批量删 IDB，再分别入队每个删除操作
 * @param ids 简历 ID 数组
 */
export async function deleteBatchResume(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  ensureNetworkListener()
  // 先批量删本地 IDB（单个事务，效率更高）
  await deleteBatchResumeIDB(ids)
  // 为每个简历 ID 单独入队（保证回放时可逐条重试、失败隔离）
  for (const id of ids) {
    await enqueueSync({
      type: 'delete',
      resumeId: id,
    })
  }
  flushQueue()
}

/**
 * 应用初始化时调用一次：启动队列回放、注册网络监听
 * 在 main.ts 中有 token 时调用
 */
export function initRepository() {
  ensureNetworkListener()
  // 启动时跑一次回放，把上次没同步完的操作继续
  void flushQueue()
}
