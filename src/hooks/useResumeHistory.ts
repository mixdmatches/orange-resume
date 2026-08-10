import { computed, ref } from 'vue'
import type { Resume } from '@/types/resume'
import { storage } from '@/utils/storage'

interface ResumeHistoryData {
  undoStack: Resume[]
  redoStack: Resume[]
  currentSnapshot: Resume
}

const HISTORY_KEY_PREFIX = 'resume-history:'
const MAX_HISTORY_DEPTH = 50

const historyKey = (resumeId: string) => `${HISTORY_KEY_PREFIX}${resumeId}`

const cloneResume = (resume: Resume): Resume =>
  JSON.parse(JSON.stringify(resume)) as Resume

export function useResumeHistory() {
  let resumeId = ''
  const undoStack = ref<Resume[]>([])
  const redoStack = ref<Resume[]>([])
  const currentSnapshot = ref<Resume | null>(null)

  const saveHistory = () => {
    if (!resumeId || !currentSnapshot.value) return
    storage.setForever(historyKey(resumeId), {
      undoStack: undoStack.value,
      redoStack: redoStack.value,
      currentSnapshot: currentSnapshot.value,
    })
  }

  const loadHistory = (id: string): ResumeHistoryData | undefined => {
    return storage.get<ResumeHistoryData>(historyKey(id))
  }

  const initialize = (id: string, initialState: Resume) => {
    resumeId = id
    const persisted = loadHistory(id)
    if (persisted && persisted.currentSnapshot) {
      undoStack.value = persisted.undoStack ?? []
      redoStack.value = persisted.redoStack ?? []
      currentSnapshot.value = cloneResume(persisted.currentSnapshot)
    } else {
      undoStack.value = []
      redoStack.value = []
      currentSnapshot.value = cloneResume(initialState)
    }
    saveHistory()
  }

  const clear = () => {
    if (!resumeId) return
    undoStack.value = []
    redoStack.value = []
    currentSnapshot.value = null
    storage.remove(historyKey(resumeId))
  }

  const pushState = (resume: Resume) => {
    if (!resumeId) return
    const snapshot = cloneResume(resume)
    if (
      currentSnapshot.value &&
      JSON.stringify(currentSnapshot.value) === JSON.stringify(snapshot)
    ) {
      return
    }

    if (currentSnapshot.value) {
      undoStack.value.push(cloneResume(currentSnapshot.value))
      if (undoStack.value.length > MAX_HISTORY_DEPTH) {
        undoStack.value.shift()
      }
    }

    currentSnapshot.value = snapshot
    redoStack.value = []
    saveHistory()
  }

  const undo = (): Resume | null => {
    if (!resumeId || undoStack.value.length === 0 || !currentSnapshot.value) {
      return null
    }

    const previous = undoStack.value.pop() as Resume
    redoStack.value.push(cloneResume(currentSnapshot.value))
    currentSnapshot.value = cloneResume(previous)
    saveHistory()
    return cloneResume(previous)
  }

  const redo = (): Resume | null => {
    if (!resumeId || redoStack.value.length === 0 || !currentSnapshot.value) {
      return null
    }

    const next = redoStack.value.pop() as Resume
    undoStack.value.push(cloneResume(currentSnapshot.value))
    currentSnapshot.value = cloneResume(next)
    saveHistory()
    return cloneResume(next)
  }

  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)

  return {
    initialize,
    pushState,
    undo,
    redo,
    clear,
    canUndo,
    canRedo,
  }
}
