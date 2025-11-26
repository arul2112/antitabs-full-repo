export interface TabState {
  id: string
  url: string
  title: string
  favicon: string
  isLoading: boolean
  canGoBack: boolean
  canGoForward: boolean
}

export interface WindowState {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  isMaximized: boolean
  isMinimized: boolean
  isHidden: boolean
  isFullscreen: boolean
  windowColor: string | null
  tabs: TabState[]
  activeTabIndex: number
  syncEnabled: boolean
}

export interface CanvasState {
  zoom: number      // 0.1 - 2.0
  panX: number
  panY: number
}

export interface WindowManagerModes {
  selectionMode: boolean
  windowCursorMode: boolean
  soloMode: boolean
  hideAllMode: boolean
}

export interface WindowManagerState {
  windows: WindowState[]
  activeWindowId: string | null
  canvas: CanvasState
  modes: WindowManagerModes
  selectedWindowIds: string[]
  nextWindowId: number
  sidebarCollapsed: boolean
}

export interface WindowSnapshot {
  id: string
  x: number
  y: number
  width: number
  height: number
  isMaximized: boolean
  isMinimized: boolean
  windowColor: string | null
}

export interface HistoryEntry {
  windows: WindowSnapshot[]
  timestamp: number
}

export type ResizeDirection =
  | 'n' | 's' | 'e' | 'w'
  | 'ne' | 'nw' | 'se' | 'sw'

export interface DragState {
  isDragging: boolean
  startX: number
  startY: number
  currentX: number
  currentY: number
  windowId: string | null
}

export interface ResizeState {
  isResizing: boolean
  direction: ResizeDirection | null
  startX: number
  startY: number
  startWidth: number
  startHeight: number
  startPosX: number
  startPosY: number
  windowId: string | null
}

export interface SelectionBoxState {
  isSelecting: boolean
  startX: number
  startY: number
  currentX: number
  currentY: number
}

export const DEFAULT_WINDOW_WIDTH = 800
export const DEFAULT_WINDOW_HEIGHT = 600
export const MIN_WINDOW_WIDTH = 400
export const MIN_WINDOW_HEIGHT = 300
export const DEFAULT_URL = 'https://www.google.com'

export const WINDOW_COLORS = [
  { name: 'None', value: null },
  { name: 'Sky Blue', value: '#87CEEB' },
  { name: 'Lavender', value: '#E6E6FA' },
  { name: 'Mint', value: '#98FF98' },
  { name: 'Cream', value: '#FFFDD0' },
  { name: 'Rose', value: '#FFE4E1' },
  { name: 'Aqua', value: '#7FFFD4' }
]
