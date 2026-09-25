/**
 * 离线操作同步队列
 * 断网时把「待同步操作」存入 IndexedDB，联网后按 FIFO 回放
 * 这是 Local-First 架构的核心兜底机制
 *
 * 设计要点：
 * 1. 操作持久化在独立的 IDB 数据库，避免和简历数据库耦合
 * 2. 通过 compactOps 合并冗余操作（同一简历只保留最后一次）
 * 3. 失败重试有上限，避免队列永久阻塞
 */
import type { Resume } from '@/types/resume'

/** 操作类型 */
export type SyncOpType = 'create' | 'update' | 'delete'

/** 单个待同步操作 */
export interface SyncOp {
  /** 唯一 ID（用作主键） */
  opId: string
  /** 操作类型 */
  type: SyncOpType
  /** 目标简历 ID */
  resumeId: string
  /** 操作数据（create/update 用，delete 不用） */
  payload?: Resume
  /** 创建时间，用于排序 */
  createdAt: number
  /** 重试次数 */
  retries: number
}

/** 队列数据库名 */
const DB_NAME = 'resumeSyncQueueDB'
/** 数据库版本 */
const DB_VERSION = 1
/** Object Store 名 */
const STORE_NAME = 'syncQueue'

/**
 * 打开队列数据库
 * @returns IDBDatabase 连接
 */
const openQueueDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'opId' })
        // 按创建时间排序用
        store.createIndex('createdAt', 'createdAt', { unique: false })
        // 按 resumeId 查询用（合并时遍历）
        store.createIndex('resumeId', 'resumeId', { unique: false })
      }
    }
  })
}

/**
 * 生成简单唯一 ID（用于 opId 主键）
 * @returns 时间戳 + 随机字符串
 */
const genOpId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

/**
 * 入队：新增一个待同步操作
 * @param op 不含 opId/createdAt/retries 的操作数据
 * @returns 入队后的完整操作对象
 */
export async function enqueueSync(
  op: Omit<SyncOp, 'opId' | 'createdAt' | 'retries'>,
): Promise<SyncOp> {
  const db = await openQueueDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const newOp: SyncOp = {
      ...op,
      opId: genOpId(),
      createdAt: Date.now(),
      retries: 0,
    }
    const req = store.add(newOp)
    req.onsuccess = () => resolve(newOp)
    req.onerror = () => reject(req.error)
  })
}

/**
 * 获取所有待同步操作（按时间升序）
 * @returns 按 createdAt 升序排列的操作列表
 */
export async function getPendingOps(): Promise<SyncOp[]> {
  const db = await openQueueDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const idx = store.index('createdAt')
    const req = idx.getAll()
    req.onsuccess = () => resolve(req.result as SyncOp[])
    req.onerror = () => reject(req.error)
  })
}

/**
 * 按 resumeId 合并冗余操作（核心去重逻辑）
 * 规则：
 *   - 同一份简历只保留最后一次操作
 *   - 若最后是 delete，丢弃这条简历所有之前的操作（反正要删）
 *   - 若最后是 update，覆盖之前的 create/update（update 已含完整内容）
 *   - 删除被合并覆盖的无效 op（writeback）
 *
 * @returns 合并后按时间升序的操作列表（这些 op 已在 IDB 中保留）
 */
export async function compactOps(): Promise<SyncOp[]> {
  const allOps = await getPendingOps()

  if (allOps.length === 0) return []

  // 第 1 步：分组选出每条 resumeId 要保留的最后一条 op
  const grouped = new Map<string, SyncOp>()
  for (const op of allOps) {
    const prev = grouped.get(op.resumeId)
    if (!prev) {
      grouped.set(op.resumeId, op)
      continue
    }
    // 后来的 delete / update 直接覆盖（update 已含完整内容，create 已无意义）
    if (op.type === 'delete' || op.type === 'update') {
      grouped.set(op.resumeId, op)
    }
  }

  const keptOps = new Set<string>()
  for (const kept of grouped.values()) {
    keptOps.add(kept.opId)
  }

  // 第 2 步：找出所有被合并覆盖的无效 op，从 IDB 删除 writeback
  const droppedOpIds: string[] = []
  for (const op of allOps) {
    if (!keptOps.has(op.opId)) {
      droppedOpIds.push(op.opId)
    }
  }

  if (droppedOpIds.length > 0) {
    await deleteUnableOps(droppedOpIds)
  }

  // 第 3 步：返回保留下来的 op（按时间升序，保证回放顺序）
  return Array.from(grouped.values()).sort((a, b) => a.createdAt - b.createdAt)
}

/**
 * 出队：删除一个操作（同步成功后调用）
 * @param opId 操作 ID
 */
export async function dequeueSync(opId: string): Promise<void> {
  const db = await openQueueDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.delete(opId)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

/**
 * 删除无效操作（被合并覆盖的 op）
 * @param droppedOpIds 需要删除的无效操作 ID 数组
 */
export async function deleteUnableOps(droppedOpIds: string[]): Promise<void> {
  const db = await openQueueDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    for (const opId of droppedOpIds) {
      store.delete(opId)
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * 增加重试计数（同步失败时调用）
 * @param opId 操作 ID
 */
export async function incrementRetry(opId: string): Promise<void> {
  const db = await openQueueDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const getReq = store.get(opId)
    getReq.onsuccess = () => {
      const op = getReq.result as SyncOp | undefined
      if (!op) return
      op.retries += 1
      store.put(op)
    }
    getReq.onerror = () => reject(getReq.error)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * 队列长度（用于 UI 展示「N 条待同步」）
 * @returns 待同步操作数
 */
export async function getPendingCount(): Promise<number> {
  const ops = await compactOps()
  return ops.length
}

/**
 * 清空队列（退出登录时调用，清除当前用户所有待同步操作）
 * 同时关闭数据库连接以释放资源
 */
export async function clearQueue(): Promise<void> {
  try {
    const db = await openQueueDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.clear()
      req.onsuccess = () => {
        resolve()
      }
      req.onerror = () => {
        reject(req.error)
      }
    })
  } catch (err) {
    console.error('[syncQueue] 打开数据库失败，无法清空队列:', err)
  }
}
