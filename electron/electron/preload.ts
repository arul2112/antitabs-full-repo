import { contextBridge, ipcRenderer } from 'electron'

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

  // Auto-updater event listeners
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => () => void
  onUpdateNotAvailable: (callback: (info: { version: string }) => void) => () => void
  onUpdateProgress: (callback: (progress: UpdateProgress) => void) => () => void
  onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => () => void
  onUpdateError: (callback: (error: { message: string }) => void) => () => void
}

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeApp: () => ipcRenderer.invoke('app-minimize'),
  maximizeApp: () => ipcRenderer.invoke('app-maximize'),
  closeApp: () => ipcRenderer.invoke('app-close'),
  fullscreenApp: (flag: boolean) => ipcRenderer.invoke('app-fullscreen', flag),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  onCanvasZoomWheel: (callback: (data: { deltaY: number; x: number; y: number }) => void) => {
    ipcRenderer.on('canvas-zoom-wheel', (_event, data) => callback(data))
  },

  // Auto-updater IPC calls
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),

  // Auto-updater event listeners (with cleanup function)
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, info: UpdateInfo) => callback(info)
    ipcRenderer.on('update-available', handler)
    return () => ipcRenderer.removeListener('update-available', handler)
  },
  onUpdateNotAvailable: (callback: (info: { version: string }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, info: { version: string }) => callback(info)
    ipcRenderer.on('update-not-available', handler)
    return () => ipcRenderer.removeListener('update-not-available', handler)
  },
  onUpdateProgress: (callback: (progress: UpdateProgress) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, progress: UpdateProgress) => callback(progress)
    ipcRenderer.on('update-progress', handler)
    return () => ipcRenderer.removeListener('update-progress', handler)
  },
  onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, info: UpdateInfo) => callback(info)
    ipcRenderer.on('update-downloaded', handler)
    return () => ipcRenderer.removeListener('update-downloaded', handler)
  },
  onUpdateError: (callback: (error: { message: string }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, error: { message: string }) => callback(error)
    ipcRenderer.on('update-error', handler)
    return () => ipcRenderer.removeListener('update-error', handler)
  }
} satisfies ElectronAPI)
