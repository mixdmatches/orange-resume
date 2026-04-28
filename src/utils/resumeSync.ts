/* eslint-disable no-console */
import { getFileHandleIDB, verifyPermission } from '@/service/fileIDB'
import { addResumeIDB, getResumeByIdIDB } from '@/service/resumeIDB'
import type { Resume } from '@/types/resume'

const isResumeData = (value: unknown) => {
  if (!value || typeof value !== 'object') return false

  const resumeData = value as Partial<Resume>
  return typeof resumeData.id === 'string' && resumeData.id.length > 0
}

/**
 * 格式化为时间戳
 */
const parseTimestamp = (value?: string | number): number | null => {
  if (!value) {
    return null
  }

  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}

/**
 * 是否需要从文件中导入到本地简历
 * @param newResume
 * @param oldResume
 * @param sourceModifiedAt
 */
const shouldImportedResumeFromFile = (
  fileResume: Partial<Resume>,
  localResume: Resume,
  sourceModifiedAt: number,
) => {
  const fileUpdatedAt = parseTimestamp(fileResume.updatedAt as number)
  const localUpdatedAt = parseTimestamp(localResume.updatedAt as number)
  const fileModifiedAt =
    typeof sourceModifiedAt === 'number' && Number.isFinite(sourceModifiedAt)
      ? sourceModifiedAt
      : null

  // 1. 两个更新时间都存在
  if (fileUpdatedAt !== null && localUpdatedAt !== null) {
    if (fileUpdatedAt !== localUpdatedAt) {
      return fileUpdatedAt > localUpdatedAt
    }

    return fileModifiedAt !== null && fileModifiedAt > localUpdatedAt + 1000
  }

  // 2. 只有文件更新时间存在
  if (fileUpdatedAt !== null && localUpdatedAt === null) {
    return true
  }

  // 3. 只有本地更新时间存在
  if (fileUpdatedAt === null && localUpdatedAt !== null) {
    return fileModifiedAt !== null && fileModifiedAt > localUpdatedAt + 1000
  }

  return fileModifiedAt !== null
}

/**
 * 归一化导入的简历数据
 * @param resume
 * @param sourceModifiedAt
 * @returns
 */
const normalizeImportedResume = (resume: Resume, sourceModifiedAt?: number) => {
  if (
    typeof sourceModifiedAt !== 'number' ||
    !Number.isFinite(sourceModifiedAt)
  ) {
    return resume
  }

  const fileUpdatedAt = parseTimestamp(resume.updatedAt as number)
  if (fileUpdatedAt !== null && fileUpdatedAt >= sourceModifiedAt) {
    return resume
  }

  return {
    ...resume,
    updatedAt: new Date(sourceModifiedAt).toISOString(),
  }
}

/**
 * 从文件导入简历数据
 * @param fileResume 从文件导入的简历数据
 * @param lastModifiedTime 文件最后修改时间戳
 * @returns
 */
const updateResumeFromFile = async (
  fileResume: Resume,
  lastModifiedTime: number,
): Promise<boolean> => {
  const localResume = await getResumeByIdIDB(fileResume.id as string)

  // 应用中不存在，直接导入文件内容到应用
  if (!localResume) {
    // 需要将简历文件导入应用中
    const importedResume = normalizeImportedResume(fileResume, lastModifiedTime)
    await addResumeIDB(importedResume)
    return true
  }
  // 不需要从文件中导入
  if (!shouldImportedResumeFromFile(fileResume, localResume, lastModifiedTime))
    return false
  // 需要将简历文件导入应用中
  const importedResume = normalizeImportedResume(fileResume, lastModifiedTime)
  await addResumeIDB(importedResume)

  return true
}

/**
 * 同步简历到文件
 * @param resumeData 简历数据
 * @returns
 */
const syncResumeToFile = async (resumeData: Resume, prevResume?: Resume) => {
  try {
    const handle = await getFileHandleIDB('syncDirectory')
    if (!handle) return

    const hasPermission = await verifyPermission(handle)
    if (!hasPermission) return

    const dirHandle = handle as FileSystemDirectoryHandle

    if (
      prevResume &&
      prevResume.id === resumeData.id &&
      prevResume.title !== resumeData.title
    ) {
      try {
        await dirHandle.removeEntry(`${prevResume.title}.json`)
      } catch (error) {
        console.warn('删除旧文件失败', error)
      }
    }

    const fileName = `${resumeData.title}.json`
    const fileHandle = await dirHandle.getFileHandle(fileName, {
      create: true,
    })

    const writable = await fileHandle.createWritable()
    await writable.write(JSON.stringify(resumeData, null, 2))
    await writable.close()
    console.log('同步成功')
  } catch (error) {
    console.warn('同步简历到文件失败', error)
  }
}

// 防抖同步简历到文件:合并高频写入
let syncTimer: ReturnType<typeof setTimeout> | null = null
export const debounceSyncToFile = (resumeData: Resume, prevResume?: Resume) => {
  if (syncTimer) {
    clearTimeout(syncTimer)
  }
  syncTimer = setTimeout(() => {
    syncResumeToFile(resumeData, prevResume)
    syncTimer = null
  }, 1500)
}

/**
 * 从目录同步简历数据
 * @returns
 */
export const syncResumeFromDirectory = async () => {
  const result = {
    skipped: 0,
    synced: 0,
    failed: 0,
  }

  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    return result
  }

  try {
    const handle = await getFileHandleIDB('syncDirectory')
    if (!handle || handle.kind !== 'directory') return result

    const hasPermission = await verifyPermission(handle)
    if (!hasPermission) return result

    const entries = []
    for await (const entry of handle.values()) {
      entries.push(entry)
    }
    if (!entries) return result

    for await (const entry of entries) {
      if (entry.kind !== 'file' || !entry.name.endsWith('.json')) {
        result.skipped++
        continue
      }

      try {
        const file = await entry.getFile()
        const content = await file.text()
        const resumeData = JSON.parse(content)

        if (!isResumeData(resumeData)) {
          result.skipped++
          continue
        }

        const imported = await updateResumeFromFile(
          resumeData,
          file.lastModified,
        )

        if (imported) {
          result.synced++
        } else {
          result.skipped++
        }
      } catch (error) {
        result.failed++
        console.error(`读取文件失败"${entry.name}":`, error)
      }
    }
  } catch (error) {
    console.error('同步简历失败', error)
  }
  console.log(result)

  return result
}
