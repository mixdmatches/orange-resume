/**
 * LocalStorage 二次封装
 * 提供类型安全、过期时间支持、错误处理等增强功能
 */

/**
 * 存储项接口
 */
interface StorageItem<T = unknown> {
  value: T
  expires?: number // 过期时间戳（毫秒）
}

/**
 * 存储配置选项
 */
interface StorageOptions {
  expires?: number // 过期时间（毫秒），例如：1000 * 60 * 60 表示1小时
}

/**
 * LocalStorage 封装类
 */
class Storage {
  private readonly prefix: string

  /**
   * 构造函数
   * @param prefix - 存储键名前缀，避免键名冲突
   */
  constructor(prefix = 'orange-resume') {
    this.prefix = prefix
  }

  /**
   * 获取完整的键名（带前缀）
   */
  private getKey(key: string): string {
    return `${this.prefix}:${key}`
  }

  /**
   * 设置存储值
   * @param key - 键名
   * @param value - 值（支持任意可序列化类型）
   * @param options - 配置选项
   */
  set<T = unknown>(key: string, value: T, options?: StorageOptions): void {
    try {
      const item: StorageItem<T> = {
        value,
      }

      // 如果设置了过期时间
      if (options?.expires) {
        item.expires = Date.now() + options.expires
      }

      localStorage.setItem(this.getKey(key), JSON.stringify(item))
    } catch (error) {
      console.error('Storage set error:', error)
      throw new Error(`Failed to set storage key "${key}"`)
    }
  }

  /**
   * 获取存储值
   * @param key - 键名
   * @param defaultValue - 默认值（当键不存在或过期时返回）
   */
  get<T = unknown>(key: string, defaultValue?: T): T | undefined {
    try {
      const itemStr = localStorage.getItem(this.getKey(key))

      if (!itemStr) {
        return defaultValue
      }

      const item: StorageItem<T> = JSON.parse(itemStr)

      // 检查是否过期
      if (item.expires && Date.now() > item.expires) {
        this.remove(key)
        return defaultValue
      }

      return item.value
    } catch (error) {
      console.error('Storage get error:', error)
      return defaultValue
    }
  }

  /**
   * 删除存储项
   * @param key - 键名
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(this.getKey(key))
    } catch (error) {
      console.error('Storage remove error:', error)
      throw new Error(`Failed to remove storage key "${key}"`)
    }
  }

  /**
   * 清空所有存储（仅清空当前前缀下的项）
   */
  clear(): void {
    try {
      const keys = this.keys()
      keys.forEach(key => this.remove(key))
    } catch (error) {
      console.error('Storage clear error:', error)
      throw new Error('Failed to clear storage')
    }
  }

  /**
   * 获取所有键名（仅当前前缀下的）
   */
  keys(): string[] {
    const keys: string[] = []
    const prefix = this.getKey('')

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(prefix)) {
        keys.push(key.slice(prefix.length))
      }
    }

    return keys
  }

  /**
   * 检查键是否存在
   * @param key - 键名
   */
  has(key: string): boolean {
    return this.get(key) !== undefined
  }

  /**
   * 获取存储项数量
   */
  length(): number {
    return this.keys().length
  }

  /**
   * 设置永久存储（不过期）
   * @param key - 键名
   * @param value - 值
   */
  setForever<T = unknown>(key: string, value: T): void {
    this.set(key, value)
  }

  /**
   * 设置会话存储（页面关闭后失效）
   * 实际上使用 sessionStorage
   * @param key - 键名
   * @param value - 值
   */
  setSession<T = unknown>(key: string, value: T): void {
    try {
      sessionStorage.setItem(this.getKey(key), JSON.stringify(value))
    } catch (error) {
      console.error('Session storage set error:', error)
      throw new Error(`Failed to set session key "${key}"`)
    }
  }

  /**
   * 获取会话存储值
   * @param key - 键名
   * @param defaultValue - 默认值
   */
  getSession<T = unknown>(key: string, defaultValue?: T): T | undefined {
    try {
      const itemStr = sessionStorage.getItem(this.getKey(key))
      if (!itemStr) {
        return defaultValue
      }
      return JSON.parse(itemStr)
    } catch (error) {
      console.error('Session storage get error:', error)
      return defaultValue
    }
  }

  /**
   * 删除会话存储项
   * @param key - 键名
   */
  removeSession(key: string): void {
    try {
      sessionStorage.removeItem(this.getKey(key))
    } catch (error) {
      console.error('Session storage remove error:', error)
    }
  }
}

/**
 * 创建默认实例（使用默认前缀）
 */
export const storage = new Storage()

/**
 * 创建自定义实例
 * @param prefix - 自定义前缀
 */
export const createStorage = (prefix: string): Storage => {
  return new Storage(prefix)
}

/**
 * 快捷设置方法
 */
export const setStorage = <T = unknown>(
  key: string,
  value: T,
  options?: StorageOptions,
): void => {
  storage.set(key, value, options)
}

/**
 * 快捷获取方法
 */
export const getStorage = <T = unknown>(
  key: string,
  defaultValue?: T,
): T | undefined => {
  return storage.get(key, defaultValue)
}

/**
 * 快捷删除方法
 */
export const removeStorage = (key: string): void => {
  storage.remove(key)
}

/**
 * 快捷清空方法
 */
export const clearStorage = (): void => {
  storage.clear()
}

export default storage
