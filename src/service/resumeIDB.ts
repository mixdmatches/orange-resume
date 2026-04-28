import type { Resume } from '@/types/resume'
import { debounceSyncToFile } from '@/utils/resumeSync'

const DB_NAME = 'resumeDB'
const DB_VERSION = 2
const STORE_NAME = 'resumes'

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
      db.deleteObjectStore('settings')
      // 如果存储对象不存在，创建它
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        // 创建索引，方便查询
        store.createIndex('createdAt', 'createdAt', { unique: false })
        store.createIndex('updatedAt', 'updatedAt', { unique: false })
      }
    }
  })
}

/**
 * 添加简历数据
 * @param resume 简历数据
 * @returns Promise<string> 新创建的简历ID
 */
export const addResumeIDB = async (
  resume: Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const newResume: Resume = {
      ...resume,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: null,
    }

    const request = store.add(newResume)

    request.onsuccess = () => {
      resolve(newResume.id)
    }

    request.onerror = () => {
      reject(new Error('添加简历失败'))
    }
  })
}

/**
 * 获取所有简历
 * @returns Promise<Resume[]> 简历列表
 */
export const getAllResumesIDB = async (): Promise<Resume[]> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(new Error('获取简历列表失败'))
    }
  })
}

/**
 * 根据ID获取简历
 * @param id 简历ID
 * @returns Promise<Resume | null> 简历数据或null
 */
export const getResumeByIdIDB = async (id: string): Promise<Resume | null> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(id)

    request.onsuccess = () => {
      resolve(request.result || null)
    }

    request.onerror = () => {
      reject(new Error('获取简历失败'))
    }
  })
}

/**
 * 更新简历数据
 * @param id 简历ID
 * @param resumeData 要更新的简历数据
 * @returns Promise<boolean> 更新是否成功
 */
export const updateResumeIDB = async (
  id: string,
  resumeData: Partial<Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<boolean> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const getRequest = store.get(id)

    getRequest.onsuccess = () => {
      const existingResume = getRequest.result

      if (!existingResume) {
        resolve(false)
        return
      }

      const updatedResume: Resume = {
        ...existingResume,
        ...resumeData,
        updatedAt: Date.now(),
      }

      debounceSyncToFile(updatedResume, existingResume)

      const putRequest = store.put(updatedResume)

      putRequest.onsuccess = () => {
        resolve(true)
      }

      putRequest.onerror = () => {
        reject(new Error('更新简历失败'))
      }
    }

    getRequest.onerror = () => {
      reject(new Error('获取简历失败'))
    }
  })
}

/**
 * 删除简历
 * @param id 简历ID
 * @returns Promise<boolean> 删除是否成功
 */
export const deleteResumeIDB = async (id: string): Promise<boolean> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => {
      resolve(true)
    }

    request.onerror = () => {
      reject(new Error('删除简历失败'))
    }
  })
}

/**
 * 清空所有简历数据
 * @returns Promise<boolean> 清空是否成功
 */
export const clearAllResumesIDB = async (): Promise<boolean> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()

    request.onsuccess = () => {
      resolve(true)
    }

    request.onerror = () => {
      reject(new Error('清空简历数据失败'))
    }
  })
}
