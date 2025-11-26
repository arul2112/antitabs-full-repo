import { useState, useCallback, useEffect } from 'react'
import { WindowManagerProvider, useWindowManager } from './contexts/WindowManagerContext'
import { SettingsProvider, useSettings } from './contexts/SettingsContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { UndoRedoProvider } from './contexts/UndoRedoContext'
import { Canvas } from './components/Canvas'
import AppHeader from './components/AppHeader/AppHeader'
import Sidebar from './components/Dock/Sidebar'
import SidebarOpenButton from './components/Dock/SidebarOpenButton'
import RightToolbar from './components/Toolbar/RightToolbar'
import ZoomControls from './components/Toolbar/ZoomControls'
import CanvasTopControls from './components/Toolbar/CanvasTopControls'
import Minimap from './components/Canvas/Minimap'
import WindowsContainer from './components/Window/WindowsContainer'
import { Login } from './components/Login'
import { Settings } from './components/Settings'
import { HelpModal } from './components/HelpModal'
import { ProjectDashboard } from './components/ProjectDashboard'
import { Onboarding } from './components/Onboarding'
import { ModalProvider } from './components/Modal'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import styles from './App.module.css'

// Loading screen shown during auth check
function LoadingScreen() {
  return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingContent}>
        <div className={styles.loadingSpinner} />
        <p className={styles.loadingText}>Loading...</p>
      </div>
    </div>
  )
}

interface Project {
  id: string
  name: string
  created: number
  lastModified: number
  windows: any[]
  canvasState: {
    zoom: number
    panX: number
    panY: number
  }
}

const STORAGE_KEY = 'antitabs-projects'

function AppContent() {
  const [showHelp, setShowHelp] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const {
    state,
    createWindow,
    dispatch,
    initializeCanvasView,
    loadProject,
    saveProject,
    closeProject,
    currentProjectId,
    currentProjectName,
    setProjectName
  } = useWindowManager()
  const { settings } = useSettings()
  const { soloMode, hideAllMode } = state.modes

  // Project is active when we have a currentProjectId
  const hasActiveProject = currentProjectId !== null

  const toggleHelp = useCallback(() => setShowHelp(prev => !prev), [])
  const toggleSettings = useCallback(() => setShowSettings(prev => !prev), [])
  const closeSettings = useCallback(() => setShowSettings(false), [])
  const closeHelp = useCallback(() => setShowHelp(false), [])
  const closeOnboarding = useCallback(() => setShowOnboarding(false), [])
  const startOnboarding = useCallback(() => setShowOnboarding(true), [])

  // Initialize canvas view on first load
  useEffect(() => {
    initializeCanvasView()
  }, [initializeCanvasView])

  // Auto-start onboarding for first-time users (only when project is active)
  useEffect(() => {
    if (!settings.onboardingCompleted && !settings.onboardingSkipped && hasActiveProject) {
      // Small delay to let UI settle
      const timer = setTimeout(() => {
        setShowOnboarding(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [settings.onboardingCompleted, settings.onboardingSkipped, hasActiveProject])

  const handleOpenProject = useCallback((project: Project) => {
    console.log('Opening project:', project.name)
    loadProject(project.id)

    // Create a window if project has none
    if (!project.windows || project.windows.length === 0) {
      // Small delay to let the project load first
      setTimeout(() => {
        createWindow()

        // Set zoom and pan to show window fully visible and centered
        const targetZoom = 0.76
        const sidebarWidth = settings.showSidebar ? 240 : 0
        const headerHeight = 32
        const viewportWidth = window.innerWidth - sidebarWidth
        const viewportHeight = window.innerHeight - headerHeight

        const windowWidth = 1400
        const windowHeight = 900
        const windowX = 25000 - windowWidth / 2.15
        const windowY = 25000 - windowHeight / 2.25
        const windowCenterX = windowX + windowWidth / 2
        const windowCenterY = windowY + windowHeight / 2

        const panX = (viewportWidth / 2) - (windowCenterX * targetZoom) + sidebarWidth
        const panY = (viewportHeight / 2) - (windowCenterY * targetZoom) + headerHeight

        dispatch({ type: 'SET_ZOOM', payload: { zoom: targetZoom } })
        dispatch({ type: 'SET_PAN', payload: { panX, panY } })
      }, 100)
    }
  }, [loadProject, createWindow, dispatch, settings.showSidebar])

  const handleProjectNameChange = useCallback((newName: string) => {
    setProjectName(newName)
    // Also update in projects storage
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && currentProjectId) {
      try {
        const projects = JSON.parse(saved) as Project[]
        const updatedProjects = projects.map(p =>
          p.id === currentProjectId ? { ...p, name: newName, lastModified: Date.now() } : p
        )
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects))
      } catch (e) {
        console.error('Failed to update project name:', e)
      }
    }
  }, [setProjectName, currentProjectId])

  // Auto-save project when state changes
  useEffect(() => {
    if (currentProjectId && state.windows.length > 0) {
      // Debounce auto-save
      const timer = setTimeout(() => {
        saveProject()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [state.windows, state.canvas, currentProjectId, saveProject])

  useKeyboardShortcuts({
    onToggleHelp: toggleHelp,
    onToggleSettings: toggleSettings,
    onToggleProjectDashboard: () => {} // No toggle needed - dashboard is a separate page now
  })

  // Apply body classes for solo and hide-all modes
  if (soloMode) {
    document.body.classList.add('solo-mode')
  } else {
    document.body.classList.remove('solo-mode')
  }

  if (hideAllMode) {
    document.body.classList.add('hide-all-mode')
  } else {
    document.body.classList.remove('hide-all-mode')
  }

  // If no project is active, show the dashboard as a full page
  if (!hasActiveProject) {
    return (
      <ProjectDashboard
        isOpen={true}
        onClose={() => {}} // Can't close - must select a project
        onOpenProject={handleOpenProject}
      />
    )
  }

  // Project is active - show the main app
  return (
    <div className="app">
      {!hideAllMode && (
        <>
          {!soloMode && (
            <AppHeader
              onSettingsClick={toggleSettings}
              onHelpClick={toggleHelp}
            />
          )}
          <Sidebar
            onProjectDashboardClick={closeProject}
            projectName={currentProjectName}
            onProjectNameChange={handleProjectNameChange}
          />
          <SidebarOpenButton />
          <RightToolbar />
          <ZoomControls />
          <CanvasTopControls />
          <Minimap />
        </>
      )}
      <Canvas>
        <WindowsContainer />
      </Canvas>
      <Settings isOpen={showSettings} onClose={closeSettings} />
      <HelpModal isOpen={showHelp} onClose={closeHelp} onStartDemo={startOnboarding} />
      <Onboarding
        isOpen={showOnboarding}
        onClose={closeOnboarding}
        onComplete={closeOnboarding}
      />
    </div>
  )
}

function AuthenticatedApp() {
  const { isLoading, isAuthenticated, hasAccess } = useAuth()

  // Show loading while checking auth
  if (isLoading) {
    return <LoadingScreen />
  }

  // Show login if not authenticated or doesn't have access
  if (!isAuthenticated || !hasAccess) {
    return <Login />
  }

  // Show main app
  return (
    <UndoRedoProvider>
      <WindowManagerProvider>
        <AppContent />
      </WindowManagerProvider>
    </UndoRedoProvider>
  )
}

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <ModalProvider>
          <AuthenticatedApp />
        </ModalProvider>
      </AuthProvider>
    </SettingsProvider>
  )
}

export default App
