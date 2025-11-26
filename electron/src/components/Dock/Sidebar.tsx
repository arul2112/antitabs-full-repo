import { useCallback, useState, useEffect, useRef } from 'react'
import { useWindowManager } from '@/contexts/WindowManagerContext'
import { useSettings } from '@/contexts/SettingsContext'
import styles from './Sidebar.module.css'

interface SidebarProps {
  onProjectDashboardClick?: () => void
  projectName?: string
  onProjectNameChange?: (name: string) => void
}

interface MenuState {
  windowId: string
  x: number
  y: number
}

export default function Sidebar({ onProjectDashboardClick, projectName = 'Untitled Project', onProjectNameChange }: SidebarProps) {
  const { state, dispatch, createWindow, focusWindow, closeWindow } = useWindowManager()
  const { settings, setShowSidebar } = useSettings()
  const [editingWindowId, setEditingWindowId] = useState<string | null>(null)
  const [editingProjectName, setEditingProjectName] = useState(false)
  const [menuState, setMenuState] = useState<MenuState | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleCloseSidebar = useCallback(() => {
    setShowSidebar(false)
  }, [setShowSidebar])

  const handleProjectNameChange = useCallback((newName: string) => {
    onProjectNameChange?.(newName)
    setEditingProjectName(false)
  }, [onProjectNameChange])

  const handleWindowRename = useCallback((windowId: string, newName: string) => {
    dispatch({
      type: 'UPDATE_WINDOW',
      payload: { id: windowId, updates: { name: newName } }
    })
    setEditingWindowId(null)
  }, [dispatch])

  const handleToggleVisibility = useCallback((windowId: string, isHidden: boolean) => {
    dispatch({
      type: 'UPDATE_WINDOW',
      payload: { id: windowId, updates: { isHidden: !isHidden } }
    })
  }, [dispatch])

  const handleZoomToWindow = useCallback((windowId: string) => {
    const win = state.windows.find(w => w.id === windowId)
    if (!win) return

    // Fixed zoom level for consistent viewing
    const targetZoom = 0.76

    // Get viewport dimensions (accounting for sidebar)
    const sidebarWidth = settings.showSidebar ? 240 : 0
    const headerHeight = 32
    const viewportWidth = window.innerWidth - sidebarWidth
    const viewportHeight = window.innerHeight - headerHeight

    // Calculate center position to show window fully visible
    const windowCenterX = win.x + win.width / 2
    const windowCenterY = win.y + win.height / 2

    // Calculate pan to center the window in the viewport
    const panX = (viewportWidth / 2) - (windowCenterX * targetZoom) + sidebarWidth
    const panY = (viewportHeight / 2) - (windowCenterY * targetZoom) + headerHeight

    dispatch({
      type: 'SET_ZOOM',
      payload: { zoom: targetZoom }
    })
    dispatch({
      type: 'SET_PAN',
      payload: { panX, panY }
    })
  }, [state.windows, settings.showSidebar, dispatch])

  const handleMenuOpen = useCallback((e: React.MouseEvent, windowId: string) => {
    e.stopPropagation()
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setMenuState({
      windowId,
      x: rect.left,
      y: rect.bottom + 4
    })
  }, [])

  const handleMenuClose = useCallback(() => {
    setMenuState(null)
  }, [])

  const handleReload = useCallback((windowId: string) => {
    const win = state.windows.find(w => w.id === windowId)
    if (win) {
      const activeTab = win.tabs[win.activeTabIndex]
      const webview = document.querySelector(`#webview-${activeTab?.id}`) as any
      if (webview?.reload) {
        webview.reload()
      }
    }
    handleMenuClose()
  }, [state.windows, handleMenuClose])

  const handleStopLoading = useCallback((windowId: string) => {
    const win = state.windows.find(w => w.id === windowId)
    if (win) {
      const activeTab = win.tabs[win.activeTabIndex]
      const webview = document.querySelector(`#webview-${activeTab?.id}`) as any
      if (webview?.stop) {
        webview.stop()
      }
    }
    handleMenuClose()
  }, [state.windows, handleMenuClose])

  const handleRenameFromMenu = useCallback((windowId: string) => {
    setEditingWindowId(windowId)
    handleMenuClose()
  }, [handleMenuClose])

  const handleDeleteFromMenu = useCallback((windowId: string) => {
    closeWindow(windowId)
    handleMenuClose()
  }, [closeWindow, handleMenuClose])

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuState) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        handleMenuClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleMenuClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [menuState, handleMenuClose])

  // Hide sidebar in hideAllMode or if not visible
  if (state.modes.hideAllMode || !settings.showSidebar) {
    return null
  }

  return (
    <div className={styles.sidebar} data-tour="sidebar">
      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={onProjectDashboardClick}
          title="Back to Projects"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </button>

        {/* Editable project name */}
        {editingProjectName ? (
          <input
            type="text"
            className={styles.projectNameInput}
            defaultValue={projectName}
            autoFocus
            onBlur={(e) => handleProjectNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleProjectNameChange(e.currentTarget.value)
              } else if (e.key === 'Escape') {
                setEditingProjectName(false)
              }
            }}
          />
        ) : (
          <h3
            className={styles.projectName}
            onClick={() => setEditingProjectName(true)}
            title="Click to rename project"
          >
            {projectName}
          </h3>
        )}
      </div>

      {/* Toggle button outside sidebar on right */}
      <button
        className={styles.sidebarToggle}
        onClick={handleCloseSidebar}
        title="Hide Sidebar"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="11 17 6 12 11 7"/>
          <polyline points="18 17 13 12 18 7"/>
        </svg>
      </button>

      <div className={styles.content}>
        <button
          className={styles.newWindowBtn}
          onClick={() => createWindow()}
          title="New Window (Cmd+N)"
          data-tour="new-window"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="2" width="16" height="16" rx="2"/>
            <line x1="10" y1="6" x2="10" y2="14"/>
            <line x1="6" y1="10" x2="14" y2="10"/>
          </svg>
          <span>New Window </span>
        </button>

        <div className={styles.separator} />

        <div className={styles.windowList}>
          {state.windows.map(window => (
            <div
              key={window.id}
              className={`${styles.windowItem} ${window.id === state.activeWindowId ? styles.active : ''} ${window.isMinimized || window.isHidden ? styles.minimized : ''} ${state.selectedWindowIds.includes(window.id) ? styles.selected : ''}`}
              onClick={() => focusWindow(window.id)}
              style={window.windowColor ? { borderLeftColor: window.windowColor } : undefined}
            >
              <div className={styles.windowItemContent}>
                {/* Visibility toggle */}
                <button
                  className={`${styles.visibilityToggle} ${window.isHidden ? styles.hidden : styles.visible}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleVisibility(window.id, window.isHidden)
                  }}
                  title={window.isHidden ? 'Show Window' : 'Hide Window'}
                >
                  {window.isHidden ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>

                {/* Window name */}
                {editingWindowId === window.id ? (
                  <input
                    type="text"
                    className={styles.windowNameInput}
                    defaultValue={window.name}
                    autoFocus
                    onBlur={(e) => handleWindowRename(window.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleWindowRename(window.id, e.currentTarget.value)
                      } else if (e.key === 'Escape') {
                        setEditingWindowId(null)
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className={styles.windowName}
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      setEditingWindowId(window.id)
                    }}
                    title={window.name}
                  >
                    {window.name}
                  </span>
                )}

                {/* Zoom to window button */}
                <button
                  className={styles.zoomToBtn}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleZoomToWindow(window.id)
                  }}
                  title="Zoom to Window"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    <line x1="11" y1="8" x2="11" y2="14"/>
                    <line x1="8" y1="11" x2="14" y2="11"/>
                  </svg>
                </button>

                {/* Menu button */}
                <button
                  className={styles.menuBtn}
                  onClick={(e) => handleMenuOpen(e, window.id)}
                  title="More options"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2"/>
                    <circle cx="12" cy="12" r="2"/>
                    <circle cx="12" cy="19" r="2"/>
                  </svg>
                </button>

                {/* Close button */}
                <button
                  className={styles.closeBtn}
                  onClick={(e) => {
                    e.stopPropagation()
                    closeWindow(window.id)
                  }}
                  title="Close Window"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M1.41 0L0 1.41L4.59 6L0 10.59L1.41 12L6 7.41L10.59 12L12 10.59L7.41 6L12 1.41L10.59 0L6 4.59L1.41 0Z"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Window context menu */}
      {menuState && (
        <div
          ref={menuRef}
          className={styles.windowMenu}
          style={{ left: menuState.x, top: menuState.y }}
        >
          <button
            className={styles.windowMenuItem}
            onClick={() => handleRenameFromMenu(menuState.windowId)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Rename
          </button>
          <button
            className={styles.windowMenuItem}
            onClick={() => handleReload(menuState.windowId)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Reload
          </button>
          <button
            className={styles.windowMenuItem}
            onClick={() => handleStopLoading(menuState.windowId)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            Stop Loading
          </button>
          <div className={styles.windowMenuSeparator} />
          <button
            className={`${styles.windowMenuItem} ${styles.danger}`}
            onClick={() => handleDeleteFromMenu(menuState.windowId)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
