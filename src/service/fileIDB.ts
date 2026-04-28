const DB_NAME = 'FileHandleDB'
const DB_VERSION = 2
const HANDLE_STORE = 'handles'
const CONFIG_STORE = 'config'

/**
 * 打开数据库连接
 * @returns Promise<IDBDatabase> 数据库连接
 */
export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error('打开数据库失败'))
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result
      // 如果存储对象不存在，创建它
      if (!db.objectStoreNames.contains(HANDLE_STORE)) {
        db.createObjectStore(HANDLE_STORE)
      }
      if (!db.objectStoreNames.contains(CONFIG_STORE)) {
        db.createObjectStore(CONFIG_STORE)
      }
    }
  })
}

/**
 * 保存文件句柄
 * @param key 文件句柄的键名
 * @param value 文件句柄的值
 * @returns Promise<boolean> 保存是否成功
 */
export const saveFileHandleIDB = async (
  key: string,
  value: FileSystemDirectoryHandle | null,
): Promise<void> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(HANDLE_STORE, 'readwrite')
    const store = transaction.objectStore(HANDLE_STORE)
    const request = store.put(value, key)

    request.onsuccess = () => {
      resolve()
    }
    request.onerror = () => {
      reject(request.error)
    }
  })
}

/**
 * 获取文件句柄
 * @param key 文件句柄的键名
 * @returns Promise<any> 文件句柄的值或null
 */
export const getFileHandleIDB = async (
  key: string,
): Promise<FileSystemDirectoryHandle | null> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(HANDLE_STORE, 'readonly')
    const store = transaction.objectStore(HANDLE_STORE)
    const request = store.get(key)

    request.onsuccess = () => {
      resolve(request.result)
    }
    request.onerror = () => {
      reject(request.error)
    }
  })
}

/**
 * 保存文件路径配置
 * @param key 配置的键名
 * @param value 配置的值
 * @returns Promise<boolean> 保存是否成功
 */
export const saveConfigIDB = async (
  key: string,
  value: string,
): Promise<void> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CONFIG_STORE, 'readwrite')
    const store = transaction.objectStore(CONFIG_STORE)
    const request = store.put(value, key)

    request.onsuccess = () => {
      resolve()
    }
    request.onerror = () => {
      reject(request.error)
    }
  })
}

/**
 * 获取文件路径配置
 * @param key 配置的键名
 * @returns Promise<any> 配置的值或null
 */

export const getConfigIDB = async (key: string): Promise<string | null> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CONFIG_STORE, 'readonly')
    const store = transaction.objectStore(CONFIG_STORE)
    const request = store.get(key)

    request.onsuccess = () => {
      resolve(request.result)
    }
    request.onerror = () => {
      reject(request.error)
    }
  })
}

export const verifyPermission = async (
  handle: FileSystemDirectoryHandle,
  mode: FileSystemPermissionMode = 'readwrite',
): Promise<boolean> => {
  if (!handle) {
    return false
  }

  const options = { mode }

  // 检查当前权限
  if ((await handle.queryPermission(options)) === 'granted') {
    return true
  }

  // 请求权限
  if ((await handle.requestPermission(options)) === 'granted') {
    return true
  }

  return false
}
