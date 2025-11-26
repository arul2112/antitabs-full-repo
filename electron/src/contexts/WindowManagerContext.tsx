import { createContext, useContext, useReducer, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type {
  WindowState,
  TabState,
  WindowManagerState,
  WindowManagerModes
} from '@/types'
import { DEFAULT_WINDOW_POSITION, CANVAS_SIZE, INITIAL_ZOOM, calculateInitialPan } from '@/constants/canvas'
import { useUndoRedo, RECORDABLE_ACTIONS, type HistorySnapshot } from './UndoRedoContext'

// Action types
type WindowManagerAction =
  | { type: 'CREATE_WINDOW'; payload?: { x?: number; y?: number; width?: number; height?: number } }
  | { type: 'CLOSE_WINDOW'; payload: { id: string } }
  | { type: 'FOCUS_WINDOW'; payload: { id: string } }
  | { type: 'UPDATE_WINDOW'; payload: { id: string; updates: Partial<WindowState> } }
  | { type: 'MOVE_WINDOW'; payload: { id: string; x: number; y: number } }
  | { type: 'MOVE_WINDOW_END'; payload: { id: string; x: number; y: number } }
  | { type: 'RESIZE_WINDOW'; payload: { id: string; width: number; height: number; x?: number; y?: number } }
  | { type: 'RESIZE_WINDOW_END'; payload: { id: string; width: number; height: number; x?: number; y?: number } }
  | { type: 'MAXIMIZE_WINDOW'; payload: { id: string } }
  | { type: 'MINIMIZE_WINDOW'; payload: { id: string } }
  | { type: 'RESTORE_WINDOW'; payload: { id: string } }
  | { type: 'DUPLICATE_WINDOW'; payload: { id: string } }
  | { type: 'SET_WINDOW_COLOR'; payload: { id: string; color: string | null } }
  | { type: 'ADD_TAB'; payload: { windowId: string; url?: string } }
  | { type: 'CLOSE_TAB'; payload: { windowId: string; tabIndex: number } }
  | { type: 'SWITCH_TAB'; payload: { windowId: string; tabIndex: number } }
  | { type: 'UPDATE_TAB'; payload: { windowId: string; tabIndex: number; updates: Partial<TabState> } }
  | { type: 'SET_ZOOM'; payload: { zoom: number; panX?: number; panY?: number } }
  | { type: 'SET_PAN'; payload: { panX: number; panY: number } }
  | { type: 'RESET_ZOOM' }
  | { type: 'SET_MODE'; payload: Partial<WindowManagerModes> }
  | { type: 'TOGGLE_SELECTION_MODE' }
  | { type: 'TOGGLE_WINDOW_CURSOR_MODE' }
  | { type: 'TOGGLE_SOLO_MODE' }
  | { type: 'TOGGLE_HIDE_ALL_MODE' }
  | { type: 'TOGGLE_FULLSCREEN'; payload: { id: string } }
  | { type: 'SELECT_WINDOW'; payload: { id: string } }
  | { type: 'DESELECT_WINDOW'; payload: { id: string } }
  | { type: 'TOGGLE_WINDOW_SELECTION'; payload: { id: string } }
  | { type: 'SELECT_WINDOWS_IN_RECT'; payload: { x: number; y: number; width: number; height: number } }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SELECT_ALL_WINDOWS' }
  | { type: 'DELETE_SELECTED_WINDOWS' }
  | { type: 'CASCADE_WINDOWS' }
  | { type: 'TILE_WINDOWS' }
  | { type: 'GRID_ARRANGE_WINDOWS' }
  | { type: 'SET_SIDEBAR_COLLAPSED'; payload: { collapsed: boolean } }
  | { type: 'RESTORE_STATE'; payload: Partial<WindowManagerState> }
  | { type: 'RESTORE_FROM_SNAPSHOT'; payload: HistorySnapshot }
  | { type: 'INITIALIZE_CANVAS_VIEW'; payload: { viewportWidth: number; viewportHeight: number } }

// Calculate initial pan for typical viewport (will be adjusted on first render)
// Using approximate viewport: 1920x1080 minus sidebar (240) and header (32)
const defaultViewport = { width: 1680, height: 1048 }
const initialPan = calculateInitialPan(defaultViewport.width, defaultViewport.height, INITIAL_ZOOM)

// Initial state
const initialState: WindowManagerState = {
  windows: [],
  activeWindowId: null,
  canvas: {
    zoom: INITIAL_ZOOM,
    panX: initialPan.panX,
    panY: initialPan.panY
  },
  modes: {
    selectionMode: false,
    windowCursorMode: false,
    soloMode: false,
    hideAllMode: false
  },
  selectedWindowIds: [],
  nextWindowId: 0,
  sidebarCollapsed: false
}

// Helper function to create a new window
function createNewWindow(state: WindowManagerState, options?: { x?: number; y?: number; width?: number; height?: number }): WindowState {
  const offset = state.windows.length * 40
  const id = uuidv4()
  const tabId = uuidv4()

  return {
    id,
    name: `Window ${state.nextWindowId + 1}`,
    x: options?.x ?? DEFAULT_WINDOW_POSITION.x + offset,
    y: options?.y ?? DEFAULT_WINDOW_POSITION.y + offset,
    width: options?.width ?? 1400,
    height: options?.height ?? 900,
    zIndex: state.windows.length + 1,
    isMaximized: false,
    isMinimized: false,
    isHidden: false,
    isFullscreen: false,
    windowColor: null,
    syncEnabled: false,
    tabs: [{
      id: tabId,
      url: 'https://www.google.com',
      title: 'New Tab',
      favicon: '',
      isLoading: true,
      canGoBack: false,
      canGoForward: false
    }],
    activeTabIndex: 0
  }
}

// Helper to create a new tab
function createNewTab(url = 'https://www.google.com'): TabState {
  return {
    id: uuidv4(),
    url,
    title: 'New Tab',
    favicon: '',
    isLoading: true,
    canGoBack: false,
    canGoForward: false
  }
}

// Reducer
function windowManagerReducer(state: WindowManagerState, action: WindowManagerAction): WindowManagerState {
  switch (action.type) {
    case 'CREATE_WINDOW': {
      const newWindow = createNewWindow(state, action.payload)
      // Ensure new window has highest z-index
      const maxZ = state.windows.length > 0 ? Math.max(...state.windows.map(w => w.zIndex)) : 0
      newWindow.zIndex = maxZ + 1
      return {
        ...state,
        windows: [...state.windows, newWindow],
        activeWindowId: newWindow.id,
        nextWindowId: state.nextWindowId + 1
      }
    }

    case 'CLOSE_WINDOW': {
      const { id } = action.payload
      const filteredWindows = state.windows.filter(w => w.id !== id)
      const newActiveId = state.activeWindowId === id
        ? filteredWindows[filteredWindows.length - 1]?.id ?? null
        : state.activeWindowId

      // If no windows left, create a new one
      if (filteredWindows.length === 0) {
        const newWindow = createNewWindow({ ...state, windows: [] })
        return {
          ...state,
          windows: [newWindow],
          activeWindowId: newWindow.id,
          selectedWindowIds: [],
          nextWindowId: state.nextWindowId + 1
        }
      }

      return {
        ...state,
        windows: filteredWindows,
        activeWindowId: newActiveId,
        selectedWindowIds: state.selectedWindowIds.filter(sid => sid !== id)
      }
    }

    case 'FOCUS_WINDOW': {
      const { id } = action.payload
      const window = state.windows.find(w => w.id === id)
      if (!window || window.isMinimized) return state

      const maxZ = Math.max(...state.windows.map(w => w.zIndex), 0)
      const updatedWindows = state.windows.map(w =>
        w.id === id ? { ...w, zIndex: maxZ + 1 } : w
      )

      return {
        ...state,
        windows: updatedWindows,
        activeWindowId: id
      }
    }

    case 'UPDATE_WINDOW': {
      const { id, updates } = action.payload
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === id ? { ...w, ...updates } : w
        )
      }
    }

    case 'MOVE_WINDOW': {
      const { id, x, y } = action.payload
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === id ? { ...w, x, y } : w
        )
      }
    }

    case 'RESIZE_WINDOW': {
      const { id, width, height, x, y } = action.payload
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === id ? { ...w, width, height, ...(x !== undefined ? { x } : {}), ...(y !== undefined ? { y } : {}) } : w
        )
      }
    }

    case 'MAXIMIZE_WINDOW': {
      const { id } = action.payload
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === id ? { ...w, isMaximized: !w.isMaximized } : w
        )
      }
    }

    case 'MINIMIZE_WINDOW': {
      const { id } = action.payload
      const updatedWindows = state.windows.map(w =>
        w.id === id ? { ...w, isMinimized: true } : w
      )
      const newActiveId = state.activeWindowId === id
        ? updatedWindows.find(w => !w.isMinimized)?.id ?? null
        : state.activeWindowId

      return {
        ...state,
        windows: updatedWindows,
        activeWindowId: newActiveId
      }
    }

    case 'RESTORE_WINDOW': {
      const { id } = action.payload
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === id ? { ...w, isMinimized: false } : w
        ),
        activeWindowId: id
      }
    }

    case 'DUPLICATE_WINDOW': {
      const { id } = action.payload
      const sourceWindow = state.windows.find(w => w.id === id)
      if (!sourceWindow) return state

      const newWindow: WindowState = {
        ...sourceWindow,
        id: uuidv4(),
        name: sourceWindow.name + ' (Copy)',
        x: sourceWindow.x + 40,
        y: sourceWindow.y + 40,
        zIndex: Math.max(...state.windows.map(w => w.zIndex)) + 1,
        tabs: sourceWindow.tabs.map(tab => ({
          ...tab,
          id: uuidv4()
        }))
      }

      return {
        ...state,
        windows: [...state.windows, newWindow],
        activeWindowId: newWindow.id,
        nextWindowId: state.nextWindowId + 1
      }
    }

    case 'SET_WINDOW_COLOR': {
      const { id, color } = action.payload
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === id ? { ...w, windowColor: color } : w
        )
      }
    }

    case 'ADD_TAB': {
      const { windowId, url } = action.payload
      const newTab = createNewTab(url)
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === windowId
            ? { ...w, tabs: [...w.tabs, newTab], activeTabIndex: w.tabs.length }
            : w
        )
      }
    }

    case 'CLOSE_TAB': {
      const { windowId, tabIndex } = action.payload
      return {
        ...state,
        windows: state.windows.map(w => {
          if (w.id !== windowId) return w
          const newTabs = w.tabs.filter((_, i) => i !== tabIndex)

          // If no tabs left, close the window
          if (newTabs.length === 0) {
            return w // Will be handled by CLOSE_WINDOW
          }

          const newActiveIndex = tabIndex >= newTabs.length
            ? newTabs.length - 1
            : tabIndex

          return { ...w, tabs: newTabs, activeTabIndex: newActiveIndex }
        })
      }
    }

    case 'SWITCH_TAB': {
      const { windowId, tabIndex } = action.payload
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === windowId ? { ...w, activeTabIndex: tabIndex } : w
        )
      }
    }

    case 'UPDATE_TAB': {
      const { windowId, tabIndex, updates } = action.payload
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === windowId
            ? {
                ...w,
                tabs: w.tabs.map((tab, i) =>
                  i === tabIndex ? { ...tab, ...updates } : tab
                )
              }
            : w
        )
      }
    }

    case 'SET_ZOOM': {
      const { zoom, panX, panY } = action.payload
      return {
        ...state,
        canvas: {
          zoom: Math.max(0.1, Math.min(2.0, zoom)),
          panX: panX ?? state.canvas.panX,
          panY: panY ?? state.canvas.panY
        }
      }
    }

    case 'SET_PAN': {
      const { panX, panY } = action.payload
      return {
        ...state,
        canvas: { ...state.canvas, panX, panY }
      }
    }

    case 'RESET_ZOOM': {
      return {
        ...state,
        canvas: { zoom: 1.0, panX: 0, panY: 0 }
      }
    }

    case 'SET_MODE': {
      return {
        ...state,
        modes: { ...state.modes, ...action.payload }
      }
    }

    case 'TOGGLE_SELECTION_MODE': {
      return {
        ...state,
        modes: { ...state.modes, selectionMode: !state.modes.selectionMode },
        selectedWindowIds: state.modes.selectionMode ? [] : state.selectedWindowIds
      }
    }

    case 'TOGGLE_WINDOW_CURSOR_MODE': {
      return {
        ...state,
        modes: { ...state.modes, windowCursorMode: !state.modes.windowCursorMode }
      }
    }

    case 'TOGGLE_SOLO_MODE': {
      return {
        ...state,
        modes: { ...state.modes, soloMode: !state.modes.soloMode }
      }
    }

    case 'TOGGLE_HIDE_ALL_MODE': {
      return {
        ...state,
        modes: { ...state.modes, hideAllMode: !state.modes.hideAllMode }
      }
    }

    case 'TOGGLE_FULLSCREEN': {
      const { id } = action.payload
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === id ? { ...w, isFullscreen: !w.isFullscreen } : w
        )
      }
    }

    case 'MOVE_WINDOW_END': {
      // Same as MOVE_WINDOW but signals end of drag operation for history recording
      const { id, x, y } = action.payload
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === id ? { ...w, x, y } : w
        )
      }
    }

    case 'RESIZE_WINDOW_END': {
      // Same as RESIZE_WINDOW but signals end of resize operation for history recording
      const { id, width, height, x, y } = action.payload
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === id ? { ...w, width, height, ...(x !== undefined ? { x } : {}), ...(y !== undefined ? { y } : {}) } : w
        )
      }
    }

    case 'RESTORE_FROM_SNAPSHOT': {
      // Restore state from a history snapshot (for undo/redo)
      const snapshot = action.payload
      return {
        ...state,
        windows: snapshot.windows,
        activeWindowId: snapshot.activeWindowId,
        canvas: snapshot.canvas,
        selectedWindowIds: snapshot.selectedWindowIds,
        nextWindowId: snapshot.nextWindowId
      }
    }

    case 'SELECT_WINDOW': {
      const { id } = action.payload
      if (state.selectedWindowIds.includes(id)) return state
      return {
        ...state,
        selectedWindowIds: [...state.selectedWindowIds, id]
      }
    }

    case 'DESELECT_WINDOW': {
      const { id } = action.payload
      return {
        ...state,
        selectedWindowIds: state.selectedWindowIds.filter(sid => sid !== id)
      }
    }

    case 'TOGGLE_WINDOW_SELECTION': {
      const { id } = action.payload
      const isSelected = state.selectedWindowIds.includes(id)
      return {
        ...state,
        selectedWindowIds: isSelected
          ? state.selectedWindowIds.filter(sid => sid !== id)
          : [...state.selectedWindowIds, id]
      }
    }

    case 'SELECT_WINDOWS_IN_RECT': {
      const { x, y, width, height } = action.payload
      const selectedIds = state.windows
        .filter(w => {
          const windowRight = w.x + w.width
          const windowBottom = w.y + w.height
          const rectRight = x + width
          const rectBottom = y + height

          return (
            w.x < rectRight &&
            windowRight > x &&
            w.y < rectBottom &&
            windowBottom > y
          )
        })
        .map(w => w.id)

      return {
        ...state,
        selectedWindowIds: selectedIds
      }
    }

    case 'CLEAR_SELECTION': {
      return {
        ...state,
        selectedWindowIds: []
      }
    }

    case 'SELECT_ALL_WINDOWS': {
      return {
        ...state,
        selectedWindowIds: state.windows.map(w => w.id)
      }
    }

    case 'DELETE_SELECTED_WINDOWS': {
      const filteredWindows = state.windows.filter(
        w => !state.selectedWindowIds.includes(w.id)
      )

      // If no windows left, create a new one
      if (filteredWindows.length === 0) {
        const newWindow = createNewWindow({ ...state, windows: [] })
        return {
          ...state,
          windows: [newWindow],
          activeWindowId: newWindow.id,
          selectedWindowIds: [],
          nextWindowId: state.nextWindowId + 1
        }
      }

      const newActiveId = state.selectedWindowIds.includes(state.activeWindowId ?? '')
        ? filteredWindows[filteredWindows.length - 1]?.id ?? null
        : state.activeWindowId

      return {
        ...state,
        windows: filteredWindows,
        activeWindowId: newActiveId,
        selectedWindowIds: []
      }
    }

    case 'CASCADE_WINDOWS': {
      const windowsToArrange = state.selectedWindowIds.length > 0
        ? state.windows.filter(w => state.selectedWindowIds.includes(w.id) && !w.isMinimized)
        : state.windows.filter(w => !w.isMinimized)

      // Start near center of canvas
      const startX = DEFAULT_WINDOW_POSITION.x
      const startY = DEFAULT_WINDOW_POSITION.y
      const offset = 70

      return {
        ...state,
        windows: state.windows.map(w => {
          const index = windowsToArrange.findIndex(aw => aw.id === w.id)
          if (index === -1) return w
          return {
            ...w,
            x: startX + index * offset,
            y: startY + index * offset,
            width: 1400,
            height: 900,
            isMaximized: false
          }
        })
      }
    }

    case 'TILE_WINDOWS': {
      const windowsToArrange = state.selectedWindowIds.length > 0
        ? state.windows.filter(w => state.selectedWindowIds.includes(w.id) && !w.isMinimized)
        : state.windows.filter(w => !w.isMinimized)

      if (windowsToArrange.length === 0) return state

      const gap = 20
      const windowWidth = 1400
      const windowHeight = 900
      const cols = Math.ceil(Math.sqrt(windowsToArrange.length))
      const rows = Math.ceil(windowsToArrange.length / cols)

      // Center the tile grid in the canvas
      const totalWidth = cols * windowWidth + (cols - 1) * gap
      const totalHeight = rows * windowHeight + (rows - 1) * gap
      const startX = (CANVAS_SIZE - totalWidth) / 2
      const startY = (CANVAS_SIZE - totalHeight) / 2

      return {
        ...state,
        windows: state.windows.map(w => {
          const index = windowsToArrange.findIndex(aw => aw.id === w.id)
          if (index === -1) return w
          const col = index % cols
          const row = Math.floor(index / cols)
          return {
            ...w,
            x: startX + col * (windowWidth + gap),
            y: startY + row * (windowHeight + gap),
            width: windowWidth,
            height: windowHeight,
            isMaximized: false
          }
        })
      }
    }

    case 'GRID_ARRANGE_WINDOWS': {
      if (state.selectedWindowIds.length === 0) return state

      const selectedWindows = state.windows.filter(w => state.selectedWindowIds.includes(w.id))
      const gap = 20
      const windowWidth = 1400
      const windowHeight = 900
      const cols = Math.ceil(Math.sqrt(selectedWindows.length))

      let minX = Math.min(...selectedWindows.map(w => w.x))
      let minY = Math.min(...selectedWindows.map(w => w.y))
      if (minX === Infinity) minX = gap
      if (minY === Infinity) minY = gap

      return {
        ...state,
        windows: state.windows.map(w => {
          const index = selectedWindows.findIndex(sw => sw.id === w.id)
          if (index === -1) return w
          const col = index % cols
          const row = Math.floor(index / cols)
          return {
            ...w,
            x: minX + col * (windowWidth + gap),
            y: minY + row * (windowHeight + gap),
            width: windowWidth,
            height: windowHeight,
            isMaximized: false
          }
        })
      }
    }

    case 'SET_SIDEBAR_COLLAPSED': {
      return {
        ...state,
        sidebarCollapsed: action.payload.collapsed
      }
    }

    case 'RESTORE_STATE': {
      return {
        ...state,
        ...action.payload
      }
    }

    case 'INITIALIZE_CANVAS_VIEW': {
      const { viewportWidth, viewportHeight } = action.payload
      const newPan = calculateInitialPan(viewportWidth, viewportHeight, INITIAL_ZOOM)
      return {
        ...state,
        canvas: {
          zoom: INITIAL_ZOOM,
          panX: newPan.panX,
          panY: newPan.panY
        }
      }
    }

    default:
      return state
  }
}

// Context
interface WindowManagerContextValue {
  state: WindowManagerState
  dispatch: React.Dispatch<WindowManagerAction>
  // Convenience methods
  createWindow: (options?: { x?: number; y?: number; width?: number; height?: number }) => void
  closeWindow: (id: string) => void
  focusWindow: (id: string) => void
  moveWindow: (id: string, x: number, y: number) => void
  moveWindowEnd: (id: string, x: number, y: number) => void
  resizeWindow: (id: string, width: number, height: number, x?: number, y?: number) => void
  resizeWindowEnd: (id: string, width: number, height: number, x?: number, y?: number) => void
  duplicateWindow: (id: string) => void
  addTab: (windowId: string, url?: string) => void
  closeTab: (windowId: string, tabIndex: number) => void
  switchTab: (windowId: string, tabIndex: number) => void
  updateTab: (windowId: string, tabIndex: number, updates: Partial<TabState>) => void
  setZoom: (zoom: number, panX?: number, panY?: number) => void
  zoomIn: (centerX?: number, centerY?: number) => void
  zoomOut: (centerX?: number, centerY?: number) => void
  resetZoom: () => void
  toggleSelectionMode: () => void
  toggleWindowCursorMode: () => void
  toggleSoloMode: () => void
  toggleHideAllMode: () => void
  toggleFullscreen: (id: string) => void
  selectWindow: (id: string) => void
  deselectWindow: (id: string) => void
  toggleWindowSelection: (id: string) => void
  clearSelection: () => void
  deleteSelectedWindows: () => void
  cascadeWindows: () => void
  tileWindows: () => void
  gridArrangeWindows: () => void
  zoomToSelectedWindows: () => void
  initializeCanvasView: () => void
  // Undo/Redo
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  // Project management
  saveProject: () => void
  loadProject: (projectId: string) => void
  closeProject: () => void
  currentProjectId: string | null
  currentProjectName: string
  setProjectName: (name: string) => void
  // Getters
  getActiveWindow: () => WindowState | undefined
  getSelectedWindows: () => WindowState[]
}

const WindowManagerContext = createContext<WindowManagerContextValue | null>(null)

// Storage key for projects
const PROJECTS_STORAGE_KEY = 'antitabs-projects'

// Provider
export function WindowManagerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(windowManagerReducer, initialState)
  const undoRedo = useUndoRedo()
  const lastActionRef = useRef<string>('')
  const isRestoringRef = useRef(false)

  // Sync state with UndoRedo on mount and restore from storage
  useEffect(() => {
    const snapshot = undoRedo.getPresent()
    if (snapshot.windows.length > 0 || snapshot.nextWindowId > 0) {
      isRestoringRef.current = true
      dispatch({ type: 'RESTORE_FROM_SNAPSHOT', payload: snapshot })
      setTimeout(() => {
        isRestoringRef.current = false
      }, 100)
    }
  }, [])

  // Record state changes to UndoRedo
  useEffect(() => {
    if (isRestoringRef.current) return

    const actionType = lastActionRef.current
    const shouldRecord = RECORDABLE_ACTIONS.has(actionType)

    const snapshot: Omit<HistorySnapshot, 'timestamp'> = {
      windows: state.windows,
      activeWindowId: state.activeWindowId,
      canvas: state.canvas,
      selectedWindowIds: state.selectedWindowIds,
      nextWindowId: state.nextWindowId,
      actionType
    }

    undoRedo.recordState(snapshot, actionType, shouldRecord)
  }, [state.windows, state.activeWindowId, state.canvas, state.selectedWindowIds, state.nextWindowId])

  // Wrapper dispatch that tracks action type
  const trackedDispatch = useCallback((action: WindowManagerAction) => {
    lastActionRef.current = action.type
    dispatch(action)
  }, [])

  const createWindow = useCallback((options?: { x?: number; y?: number; width?: number; height?: number }) => {
    trackedDispatch({ type: 'CREATE_WINDOW', payload: options })
  }, [trackedDispatch])

  const closeWindow = useCallback((id: string) => {
    trackedDispatch({ type: 'CLOSE_WINDOW', payload: { id } })
  }, [trackedDispatch])

  const focusWindow = useCallback((id: string) => {
    dispatch({ type: 'FOCUS_WINDOW', payload: { id } })
  }, [])

  // During drag - not recorded to history
  const moveWindow = useCallback((id: string, x: number, y: number) => {
    dispatch({ type: 'MOVE_WINDOW', payload: { id, x, y } })
  }, [])

  // End of drag - recorded to history
  const moveWindowEnd = useCallback((id: string, x: number, y: number) => {
    trackedDispatch({ type: 'MOVE_WINDOW_END', payload: { id, x, y } })
  }, [trackedDispatch])

  // During resize - not recorded to history
  const resizeWindow = useCallback((id: string, width: number, height: number, x?: number, y?: number) => {
    dispatch({ type: 'RESIZE_WINDOW', payload: { id, width, height, x, y } })
  }, [])

  // End of resize - recorded to history
  const resizeWindowEnd = useCallback((id: string, width: number, height: number, x?: number, y?: number) => {
    trackedDispatch({ type: 'RESIZE_WINDOW_END', payload: { id, width, height, x, y } })
  }, [trackedDispatch])

  const duplicateWindow = useCallback((id: string) => {
    trackedDispatch({ type: 'DUPLICATE_WINDOW', payload: { id } })
  }, [trackedDispatch])

  const addTab = useCallback((windowId: string, url?: string) => {
    trackedDispatch({ type: 'ADD_TAB', payload: { windowId, url } })
  }, [trackedDispatch])

  const closeTab = useCallback((windowId: string, tabIndex: number) => {
    trackedDispatch({ type: 'CLOSE_TAB', payload: { windowId, tabIndex } })
  }, [trackedDispatch])

  const switchTab = useCallback((windowId: string, tabIndex: number) => {
    dispatch({ type: 'SWITCH_TAB', payload: { windowId, tabIndex } })
  }, [])

  const updateTab = useCallback((windowId: string, tabIndex: number, updates: Partial<TabState>) => {
    trackedDispatch({ type: 'UPDATE_TAB', payload: { windowId, tabIndex, updates } })
  }, [trackedDispatch])

  const setZoom = useCallback((zoom: number, panX?: number, panY?: number) => {
    dispatch({ type: 'SET_ZOOM', payload: { zoom, panX, panY } })
  }, [])

  const zoomIn = useCallback((centerX?: number, centerY?: number) => {
    const newZoom = Math.min(2.0, state.canvas.zoom * 1.1)
    if (centerX !== undefined && centerY !== undefined) {
      const canvasX = (centerX - state.canvas.panX) / state.canvas.zoom
      const canvasY = (centerY - state.canvas.panY) / state.canvas.zoom
      const newPanX = centerX - canvasX * newZoom
      const newPanY = centerY - canvasY * newZoom
      dispatch({ type: 'SET_ZOOM', payload: { zoom: newZoom, panX: newPanX, panY: newPanY } })
    } else {
      dispatch({ type: 'SET_ZOOM', payload: { zoom: newZoom } })
    }
  }, [state.canvas])

  const zoomOut = useCallback((centerX?: number, centerY?: number) => {
    const newZoom = Math.max(0.1, state.canvas.zoom / 1.1)
    if (centerX !== undefined && centerY !== undefined) {
      const canvasX = (centerX - state.canvas.panX) / state.canvas.zoom
      const canvasY = (centerY - state.canvas.panY) / state.canvas.zoom
      const newPanX = centerX - canvasX * newZoom
      const newPanY = centerY - canvasY * newZoom
      dispatch({ type: 'SET_ZOOM', payload: { zoom: newZoom, panX: newPanX, panY: newPanY } })
    } else {
      dispatch({ type: 'SET_ZOOM', payload: { zoom: newZoom } })
    }
  }, [state.canvas])

  const resetZoom = useCallback(() => {
    dispatch({ type: 'RESET_ZOOM' })
  }, [])

  const toggleSelectionMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_SELECTION_MODE' })
  }, [])

  const toggleWindowCursorMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_WINDOW_CURSOR_MODE' })
  }, [])

  const toggleSoloMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_SOLO_MODE' })
  }, [])

  const toggleHideAllMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_HIDE_ALL_MODE' })
  }, [])

  const toggleFullscreen = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_FULLSCREEN', payload: { id } })
  }, [])

  const selectWindow = useCallback((id: string) => {
    dispatch({ type: 'SELECT_WINDOW', payload: { id } })
  }, [])

  const deselectWindow = useCallback((id: string) => {
    dispatch({ type: 'DESELECT_WINDOW', payload: { id } })
  }, [])

  const toggleWindowSelection = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_WINDOW_SELECTION', payload: { id } })
  }, [])

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' })
  }, [])

  const deleteSelectedWindows = useCallback(() => {
    trackedDispatch({ type: 'DELETE_SELECTED_WINDOWS' })
  }, [trackedDispatch])

  const cascadeWindows = useCallback(() => {
    trackedDispatch({ type: 'CASCADE_WINDOWS' })
  }, [trackedDispatch])

  const tileWindows = useCallback(() => {
    trackedDispatch({ type: 'TILE_WINDOWS' })
  }, [trackedDispatch])

  const gridArrangeWindows = useCallback(() => {
    trackedDispatch({ type: 'GRID_ARRANGE_WINDOWS' })
  }, [trackedDispatch])

  const zoomToSelectedWindows = useCallback(() => {
    const selectedWindows = state.windows.filter(w => state.selectedWindowIds.includes(w.id))
    if (selectedWindows.length === 0) return

    // Calculate bounding box
    const minX = Math.min(...selectedWindows.map(w => w.x))
    const minY = Math.min(...selectedWindows.map(w => w.y))
    const maxX = Math.max(...selectedWindows.map(w => w.x + w.width))
    const maxY = Math.max(...selectedWindows.map(w => w.y + w.height))

    const boundingWidth = maxX - minX
    const boundingHeight = maxY - minY
    const centerX = minX + boundingWidth / 2
    const centerY = minY + boundingHeight / 2

    // Calculate zoom to fit with padding, accounting for sidebar and header
    // Assume sidebar is visible (240px), header is 32px
    const sidebarWidth = 240
    const headerHeight = 32
    const viewportWidth = window.innerWidth - sidebarWidth
    const viewportHeight = window.innerHeight - headerHeight
    const padding = 80

    const zoomX = (viewportWidth - padding * 2) / boundingWidth
    const zoomY = (viewportHeight - padding * 2) / boundingHeight
    const newZoom = Math.max(0.1, Math.min(1.0, Math.min(zoomX, zoomY)))

    // Calculate pan to center the selection in the viewport
    const newPanX = (viewportWidth / 2) - (centerX * newZoom)
    const newPanY = headerHeight + (viewportHeight / 2) - (centerY * newZoom)

    dispatch({ type: 'SET_ZOOM', payload: { zoom: newZoom } })
    dispatch({ type: 'SET_PAN', payload: { panX: newPanX, panY: newPanY } })
  }, [state.windows, state.selectedWindowIds])

  const initializeCanvasView = useCallback(() => {
    const sidebarWidth = 240
    const headerHeight = 32
    const viewportWidth = window.innerWidth - sidebarWidth
    const viewportHeight = window.innerHeight - headerHeight
    dispatch({ type: 'INITIALIZE_CANVAS_VIEW', payload: { viewportWidth, viewportHeight } })
  }, [])

  const getActiveWindow = useCallback(() => {
    return state.windows.find(w => w.id === state.activeWindowId)
  }, [state.windows, state.activeWindowId])

  const getSelectedWindows = useCallback(() => {
    return state.windows.filter(w => state.selectedWindowIds.includes(w.id))
  }, [state.windows, state.selectedWindowIds])

  // Undo action
  const undo = useCallback(() => {
    if (!undoRedo.canUndo) return
    undoRedo.undo()
    // Get the new present snapshot and restore it
    setTimeout(() => {
      const snapshot = undoRedo.getPresent()
      isRestoringRef.current = true
      dispatch({ type: 'RESTORE_FROM_SNAPSHOT', payload: snapshot })
      setTimeout(() => {
        isRestoringRef.current = false
      }, 100)
    }, 0)
  }, [undoRedo])

  // Redo action
  const redo = useCallback(() => {
    if (!undoRedo.canRedo) return
    undoRedo.redo()
    // Get the new present snapshot and restore it
    setTimeout(() => {
      const snapshot = undoRedo.getPresent()
      isRestoringRef.current = true
      dispatch({ type: 'RESTORE_FROM_SNAPSHOT', payload: snapshot })
      setTimeout(() => {
        isRestoringRef.current = false
      }, 100)
    }, 0)
  }, [undoRedo])

  // Save current state to project storage
  const saveProject = useCallback(() => {
    const projectId = undoRedo.currentProjectId
    if (!projectId) return

    try {
      const stored = localStorage.getItem(PROJECTS_STORAGE_KEY)
      const projects = stored ? JSON.parse(stored) : []

      const projectIndex = projects.findIndex((p: { id: string }) => p.id === projectId)

      const projectData = {
        id: projectId,
        name: undoRedo.currentProjectName,
        created: projectIndex >= 0 ? projects[projectIndex].created : Date.now(),
        lastModified: Date.now(),
        windows: state.windows,
        canvasState: state.canvas
      }

      if (projectIndex >= 0) {
        projects[projectIndex] = projectData
      } else {
        projects.push(projectData)
      }

      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects))
    } catch (e) {
      console.error('Failed to save project:', e)
    }
  }, [state.windows, state.canvas, undoRedo.currentProjectId, undoRedo.currentProjectName])

  // Load project from storage
  const loadProject = useCallback((projectId: string) => {
    try {
      const stored = localStorage.getItem(PROJECTS_STORAGE_KEY)
      if (!stored) return

      const projects = JSON.parse(stored)
      const project = projects.find((p: { id: string }) => p.id === projectId)

      if (project) {
        undoRedo.setProject(projectId, project.name)
        undoRedo.clearHistory()

        isRestoringRef.current = true
        trackedDispatch({
          type: 'RESTORE_STATE',
          payload: {
            windows: project.windows || [],
            canvas: project.canvasState || { zoom: 0.5, panX: 0, panY: 0 },
            selectedWindowIds: [],
            nextWindowId: (project.windows?.length || 0) + 1
          }
        })
        setTimeout(() => {
          isRestoringRef.current = false
        }, 100)
      }
    } catch (e) {
      console.error('Failed to load project:', e)
    }
  }, [undoRedo, trackedDispatch])

  // Set project name
  const setProjectName = useCallback((name: string) => {
    undoRedo.setProject(undoRedo.currentProjectId, name)
  }, [undoRedo])

  // Close project and go back to dashboard
  const closeProject = useCallback(() => {
    // Save current project first
    if (undoRedo.currentProjectId) {
      saveProject()
    }
    // Clear project ID to go back to dashboard
    undoRedo.setProject(null, 'Untitled Project')
    undoRedo.clearHistory()
    // Reset state
    dispatch({ type: 'RESTORE_STATE', payload: { windows: [], selectedWindowIds: [], nextWindowId: 0 } })
  }, [undoRedo, saveProject])

  const value: WindowManagerContextValue = {
    state,
    dispatch,
    createWindow,
    closeWindow,
    focusWindow,
    moveWindow,
    moveWindowEnd,
    resizeWindow,
    resizeWindowEnd,
    duplicateWindow,
    addTab,
    closeTab,
    switchTab,
    updateTab,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    toggleSelectionMode,
    toggleWindowCursorMode,
    toggleSoloMode,
    toggleHideAllMode,
    toggleFullscreen,
    selectWindow,
    deselectWindow,
    toggleWindowSelection,
    clearSelection,
    deleteSelectedWindows,
    cascadeWindows,
    tileWindows,
    gridArrangeWindows,
    zoomToSelectedWindows,
    initializeCanvasView,
    // Undo/Redo
    undo,
    redo,
    canUndo: undoRedo.canUndo,
    canRedo: undoRedo.canRedo,
    // Project management
    saveProject,
    loadProject,
    closeProject,
    currentProjectId: undoRedo.currentProjectId,
    currentProjectName: undoRedo.currentProjectName,
    setProjectName,
    // Getters
    getActiveWindow,
    getSelectedWindows
  }

  return (
    <WindowManagerContext.Provider value={value}>
      {children}
    </WindowManagerContext.Provider>
  )
}

// Hook
export function useWindowManager() {
  const context = useContext(WindowManagerContext)
  if (!context) {
    throw new Error('useWindowManager must be used within a WindowManagerProvider')
  }
  return context
}

export { WindowManagerContext }
