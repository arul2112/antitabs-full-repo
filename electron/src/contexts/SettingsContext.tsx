import { createContext, useContext, useReducer, useCallback, useEffect, type ReactNode } from 'react'

export type Theme = 'dark' | 'light' | 'blue' | 'purple' | 'green'

export interface SettingsState {
  theme: Theme
  accentColor: string
  showZoomControls: boolean
  showSidebar: boolean
  showMinimap: boolean
  onboardingCompleted: boolean
  onboardingSkipped: boolean
}

type SettingsAction =
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'SET_ACCENT_COLOR'; payload: string }
  | { type: 'SET_SHOW_ZOOM_CONTROLS'; payload: boolean }
  | { type: 'SET_SHOW_SIDEBAR'; payload: boolean }
  | { type: 'SET_SHOW_MINIMAP'; payload: boolean }
  | { type: 'SET_ONBOARDING_COMPLETED'; payload: boolean }
  | { type: 'SET_ONBOARDING_SKIPPED'; payload: boolean }
  | { type: 'RESTORE_SETTINGS'; payload: Partial<SettingsState> }

const STORAGE_KEY = 'antitabs-settings'

const defaultSettings: SettingsState = {
  theme: 'light',
  accentColor: '#667eea',
  showZoomControls: true,
  showSidebar: true,
  showMinimap: true,
  onboardingCompleted: false,
  onboardingSkipped: false
}

function loadSettings(): SettingsState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) }
    }
  } catch (e) {
    console.error('Failed to load settings:', e)
  }
  return defaultSettings
}

function saveSettings(settings: SettingsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (e) {
    console.error('Failed to save settings:', e)
  }
}

function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  let newState: SettingsState

  switch (action.type) {
    case 'SET_THEME':
      newState = { ...state, theme: action.payload }
      break
    case 'SET_ACCENT_COLOR':
      newState = { ...state, accentColor: action.payload }
      break
    case 'SET_SHOW_ZOOM_CONTROLS':
      newState = { ...state, showZoomControls: action.payload }
      break
    case 'SET_SHOW_SIDEBAR':
      newState = { ...state, showSidebar: action.payload }
      break
    case 'SET_SHOW_MINIMAP':
      newState = { ...state, showMinimap: action.payload }
      break
    case 'SET_ONBOARDING_COMPLETED':
      newState = { ...state, onboardingCompleted: action.payload }
      break
    case 'SET_ONBOARDING_SKIPPED':
      newState = { ...state, onboardingSkipped: action.payload }
      break
    case 'RESTORE_SETTINGS':
      newState = { ...state, ...action.payload }
      break
    default:
      return state
  }

  saveSettings(newState)
  return newState
}

interface SettingsContextValue {
  settings: SettingsState
  setTheme: (theme: Theme) => void
  setAccentColor: (color: string) => void
  setShowZoomControls: (show: boolean) => void
  setShowSidebar: (show: boolean) => void
  setShowMinimap: (show: boolean) => void
  setOnboardingCompleted: (completed: boolean) => void
  setOnboardingSkipped: (skipped: boolean) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, dispatch] = useReducer(settingsReducer, null, loadSettings)

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    const body = document.body

    // Remove all theme classes from both html and body
    const themeClasses = ['dark-mode', 'light-mode', 'blue-mode', 'purple-mode', 'green-mode']
    root.classList.remove(...themeClasses)
    body.classList.remove(...themeClasses)

    // Add current theme class to both
    root.classList.add(`${settings.theme}-mode`)
    body.classList.add(`${settings.theme}-mode`)

    // Set accent color CSS variable
    root.style.setProperty('--accent-color', settings.accentColor)
  }, [settings.theme, settings.accentColor])

  const setTheme = useCallback((theme: Theme) => {
    dispatch({ type: 'SET_THEME', payload: theme })
  }, [])

  const setAccentColor = useCallback((color: string) => {
    dispatch({ type: 'SET_ACCENT_COLOR', payload: color })
  }, [])

  const setShowZoomControls = useCallback((show: boolean) => {
    dispatch({ type: 'SET_SHOW_ZOOM_CONTROLS', payload: show })
  }, [])

  const setShowSidebar = useCallback((show: boolean) => {
    dispatch({ type: 'SET_SHOW_SIDEBAR', payload: show })
  }, [])

  const setShowMinimap = useCallback((show: boolean) => {
    dispatch({ type: 'SET_SHOW_MINIMAP', payload: show })
  }, [])

  const setOnboardingCompleted = useCallback((completed: boolean) => {
    dispatch({ type: 'SET_ONBOARDING_COMPLETED', payload: completed })
  }, [])

  const setOnboardingSkipped = useCallback((skipped: boolean) => {
    dispatch({ type: 'SET_ONBOARDING_SKIPPED', payload: skipped })
  }, [])

  const value: SettingsContextValue = {
    settings,
    setTheme,
    setAccentColor,
    setShowZoomControls,
    setShowSidebar,
    setShowMinimap,
    setOnboardingCompleted,
    setOnboardingSkipped
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

export { SettingsContext }
