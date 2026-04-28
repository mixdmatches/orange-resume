/* eslint-disable no-unused-vars */
declare global {
  interface Window {
    showDirectoryPicker(
      options?: FilePickerOptions,
    ): Promise<FileSystemDirectoryHandle>
  }
}

interface FilePickerOptions {
  multiple?: boolean
  mode?: 'read' | 'readwrite'
}

export {}
