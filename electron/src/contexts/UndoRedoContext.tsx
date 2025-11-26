import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react'
import type { WindowState, CanvasState } from '@/types'

// Maximum history steps
const MAX_HISTORY_STEPS = 35

// Storage key for persisting state
const STORAGE_KEY = 'antitabs-workspace'

// Types for history entries - we store complete snapshots, not intermediate states
export interface HistorySnapshot {
  windows: WindowState[]
  activeWindowId: string | null
  canvas: CanvasState
  selectedWindowIds: string[]
  nextWindowId: number
  timestamp: number
  actionType: string // Description of what action created this snapshot
}

export interface UndoRedoState {
  past: HistorySnapshot[]      // Previous states (max 35)
  present: HistorySnapshot     // Current state
  future: HistorySnapshot[]    // States to redo (max 35)
  currentProjectId: string | null
  currentProjectName: string
}

// Actions that should be recorded in history (action-complete only, not intermediate states)
export const RECORDABLE_ACTIONS = new Set([
  'CREATE_WINDOW',
  'CLOSE_WINDOW',
  'DUPLICATE_WINDOW',
  'DELETE_SELECTED_WINDOWS',
  'ADD_TAB',
  'CLOSE_TAB',
  'UPDATE_TAB',
  'MAXIMIZE_WINDOW',
  'MINIMIZE_WINDOW',
  'RESTORE_WINDOW',
  'SET_WINDOW_COLOR',
  'CASCADE_WINDOWS',
  'TILE_WINDOWS',
  'GRID_ARRANGE_WINDOWS',
  // Position/size changes are recorded only on completion (MOVE_WINDOW_END, RESIZE_WINDOW_END)
  'MOVE_WINDOW_END',
  'RESIZE_WINDOW_END',
  // Batch operations
  'RESTORE_STATE',
])

type UndoRedoAction =
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RECORD_STATE'; payload: { snapshot: HistorySnapshot; shouldRecord: boolean } }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'SET_PROJECT'; payload: { projectId: string | null; projectName: string } }
  | { type: 'LOAD_FROM_STORAGE'; payload: UndoRedoState }

// Create initial state
function createInitialSnapshot(): HistorySnapshot {
  return {
    windows: [],
    activeWindowId: null,
    canvas: {
      zoom: 0.5,
      panX: 0,
      panY: 0
    },
    selectedWindowIds: [],
    nextWindowId: 0,
    timestamp: Date.now(),
    actionType: 'INIT'
  }
}

const initialState: UndoRedoState = {
  past: [],
  present: createInitialSnapshot(),
  future: [],
  currentProjectId: null,
  currentProjectName: 'Untitled Project'
}

// Load state from localStorage
function loadFromStorage(): UndoRedoState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Validate the structure
      if (parsed.present && Array.isArray(parsed.past) && Array.isArray(parsed.future)) {
        return parsed
      }
    }
  } catch (e) {
    console.error('Failed to load workspace from storage:', e)
  }
  return null
}

// Save state to localStorage
function saveToStorage(state: UndoRedoState) {
  try {
    // Create a clean version for storage (limit history size)
    const storageState: UndoRedoState = {
      past: state.past.slice(-MAX_HISTORY_STEPS),
      present: state.present,
      future: state.future.slice(0, MAX_HISTORY_STEPS),
      currentProjectId: state.currentProjectId,
      currentProjectName: state.currentProjectName
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageState))
  } catch (e) {
    console.error('Failed to save workspace to storage:', e)
  }
}

function undoRedoReducer(state: UndoRedoState, action: UndoRedoAction): UndoRedoState {
  switch (action.type) {
    case 'UNDO': {
      if (state.past.length === 0) return state

      const previous = state.past[state.past.length - 1]
      const newPast = state.past.slice(0, -1)

      const newState = {
        ...state,
        past: newPast,
        present: previous,
        future: [state.present, ...state.future].slice(0, MAX_HISTORY_STEPS)
      }

      saveToStorage(newState)
      return newState
    }

    case 'REDO': {
      if (state.future.length === 0) return state

      const next = state.future[0]
      const newFuture = state.future.slice(1)

      const newState = {
        ...state,
        past: [...state.past, state.present].slice(-MAX_HISTORY_STEPS),
        present: next,
        future: newFuture
      }

      saveToStorage(newState)
      return newState
    }

    case 'RECORD_STATE': {
      const { snapshot, shouldRecord } = action.payload

      if (!shouldRecord) {
        // Just update present without recording to history
        const newState = {
          ...state,
          present: snapshot
        }
        saveToStorage(newState)
        return newState
      }

      // Record to history - push current present to past, set new present, clear future
      const newState = {
        ...state,
        past: [...state.past, state.present].slice(-MAX_HISTORY_STEPS),
        present: snapshot,
        future: [] // Clear redo stack when new action is recorded
      }

      saveToStorage(newState)
      return newState
    }

    case 'CLEAR_HISTORY': {
      const newState = {
        ...state,
        past: [],
        future: []
      }
      saveToStorage(newState)
      return newState
    }

    case 'SET_PROJECT': {
      const newState = {
        ...state,
        currentProjectId: action.payload.projectId,
        currentProjectName: action.payload.projectName
      }
      saveToStorage(newState)
      return newState
    }

    case 'LOAD_FROM_STORAGE': {
      return action.payload
    }

    default:
      return state
  }
}

// Context value interface
interface UndoRedoContextValue {
  state: UndoRedoState
  // Core actions
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  // State management
  recordState: (snapshot: Omit<HistorySnapshot, 'timestamp'>, actionType: string, shouldRecord?: boolean) => void
  clearHistory: () => void
  // Project management
  setProject: (projectId: string | null, projectName: string) => void
  currentProjectId: string | null
  currentProjectName: string
  // Getters
  getPresent: () => HistorySnapshot
  getPastCount: () => number
  getFutureCount: () => number
}

const UndoRedoContext = createContext<UndoRedoContextValue | null>(null)

export function UndoRedoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(undoRedoReducer, initialState, () => {
    // Try to load from storage on init
    const stored = loadFromStorage()
    return stored || initialState
  })

  // Undo action
  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' })
  }, [])

  // Redo action
  const redo = useCallback(() => {
    dispatch({ type: 'REDO' })
  }, [])

  // Record a new state snapshot
  const recordState = useCallback((
    snapshot: Omit<HistorySnapshot, 'timestamp'>,
    actionType: string,
    shouldRecord: boolean = true
  ) => {
    const fullSnapshot: HistorySnapshot = {
      ...snapshot,
      timestamp: Date.now(),
      actionType
    }

    // Determine if this action should be recorded based on action type
    const shouldActuallyRecord = shouldRecord && RECORDABLE_ACTIONS.has(actionType)

    dispatch({
      type: 'RECORD_STATE',
      payload: {
        snapshot: fullSnapshot,
        shouldRecord: shouldActuallyRecord
      }
    })
  }, [])

  // Clear history
  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY' })
  }, [])

  // Set current project
  const setProject = useCallback((projectId: string | null, projectName: string) => {
    dispatch({ type: 'SET_PROJECT', payload: { projectId, projectName } })
  }, [])

  // Getters
  const getPresent = useCallback(() => state.present, [state.present])
  const getPastCount = useCallback(() => state.past.length, [state.past.length])
  const getFutureCount = useCallback(() => state.future.length, [state.future.length])

  const value: UndoRedoContextValue = {
    state,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    recordState,
    clearHistory,
    setProject,
    currentProjectId: state.currentProjectId,
    currentProjectName: state.currentProjectName,
    getPresent,
    getPastCount,
    getFutureCount
  }

  return (
    <UndoRedoContext.Provider value={value}>
      {children}
    </UndoRedoContext.Provider>
  )
}

export function useUndoRedo() {
  const context = useContext(UndoRedoContext)
  if (!context) {
    throw new Error('useUndoRedo must be used within an UndoRedoProvider')
  }
  return context
}

export { UndoRedoContext }
