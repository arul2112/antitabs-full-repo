// Update information types
export interface UpdateInfo {
  version: string
  releaseDate?: string
  releaseNotes?: string
}

export interface UpdateProgress {
  percent: number
  bytesPerSecond: number
  transferred: number
  total: number
}

export interface ElectronAPI {
  // Window controls
  minimizeApp: () => Promise<void>
  maximizeApp: () => Promise<void>
  closeApp: () => Promise<void>
  fullscreenApp: (flag: boolean) => Promise<void>
  openExternal: (url: string) => Promise<{ success: boolean; error?: string }>
  onCanvasZoomWheel: (callback: (data: { deltaY: number; x: number; y: number }) => void) => void

  // Auto-updater
  getAppVersion: () => Promise<string>
  checkForUpdates: () => Promise<{ success: boolean; updateInfo?: UpdateInfo; error?: string }>
  downloadUpdate: () => Promise<{ success: boolean; error?: string }>
  installUpdate: () => Promise<{ success: boolean; error?: string }>

  // Auto-updater event listeners (return cleanup function)
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => () => void
  onUpdateNotAvailable: (callback: (info: { version: string }) => void) => () => void
  onUpdateProgress: (callback: (progress: UpdateProgress) => void) => () => void
  onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => () => void
  onUpdateError: (callback: (error: { message: string }) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
