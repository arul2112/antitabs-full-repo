import { useEffect, useCallback, useRef } from 'react'
import { useWindowManager } from '@/contexts/WindowManagerContext'

interface KeyboardShortcutsOptions {
  onToggleHelp?: () => void
  onToggleSettings?: () => void
  onToggleProjectDashboard?: () => void
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
  const {
    state,
    dispatch,
    createWindow,
    closeWindow,
    addTab,
    closeTab,
    focusWindow,
    cascadeWindows,
    tileWindows,
    toggleSelectionMode,
    toggleWindowCursorMode,
    toggleHideAllMode,
    toggleFullscreen,
    zoomToSelectedWindows,
    gridArrangeWindows,
    selectWindow,
    deselectWindow,
    setZoom,
    undo,
    redo
  } = useWindowManager()

  // Track ESC key presses for 4x quick toggle
  const escPressTimesRef = useRef<number[]>([])
  const ESC_PRESS_WINDOW = 1500 // 1.5 seconds window for 4 presses

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey
    const activeWindow = state.windows.find(w => w.id === state.activeWindowId)

    // Prevent default for our shortcuts
    const preventDefault = () => {
      e.preventDefault()
      e.stopPropagation()
    }

    // Cmd/Ctrl + N: New Window
    if (cmdOrCtrl && e.key === 'n' && !e.shiftKey) {
      preventDefault()
      createWindow()
      return
    }

    // Cmd/Ctrl + T: New Tab
    if (cmdOrCtrl && e.key === 't' && !e.shiftKey) {
      preventDefault()
      if (activeWindow) {
        addTab(activeWindow.id)
      }
      return
    }

    // Cmd/Ctrl + W: Close Tab
    if (cmdOrCtrl && e.key === 'w' && !e.shiftKey) {
      preventDefault()
      if (activeWindow) {
        if (activeWindow.tabs.length > 1) {
          closeTab(activeWindow.id, activeWindow.activeTabIndex)
        } else {
          closeWindow(activeWindow.id)
        }
      }
      return
    }

    // Cmd/Ctrl + Shift + W: Close Window
    if (cmdOrCtrl && e.key === 'w' && e.shiftKey) {
      preventDefault()
      if (activeWindow) {
        closeWindow(activeWindow.id)
      }
      return
    }

    // Cmd/Ctrl + L: Focus URL bar
    if (cmdOrCtrl && e.key === 'l') {
      preventDefault()
      const urlBar = document.querySelector('.urlBar') as HTMLInputElement
      if (urlBar) {
        urlBar.focus()
        urlBar.select()
      }
      return
    }

    // Cmd/Ctrl + R: Reload
    if (cmdOrCtrl && e.key === 'r') {
      preventDefault()
      if (activeWindow) {
        const activeTab = activeWindow.tabs[activeWindow.activeTabIndex]
        const webview = document.querySelector(`#webview-${activeTab?.id}`) as any
        if (webview) {
          webview.reload()
        }
      }
      return
    }

    // Cmd/Ctrl + [ : Go Back
    if (cmdOrCtrl && e.key === '[') {
      preventDefault()
      if (activeWindow) {
        const activeTab = activeWindow.tabs[activeWindow.activeTabIndex]
        const webview = document.querySelector(`#webview-${activeTab?.id}`) as any
        if (webview?.canGoBack()) {
          webview.goBack()
        }
      }
      return
    }

    // Cmd/Ctrl + ] : Go Forward
    if (cmdOrCtrl && e.key === ']') {
      preventDefault()
      if (activeWindow) {
        const activeTab = activeWindow.tabs[activeWindow.activeTabIndex]
        const webview = document.querySelector(`#webview-${activeTab?.id}`) as any
        if (webview?.canGoForward()) {
          webview.goForward()
        }
      }
      return
    }

    // Cmd/Ctrl + 1: Toggle window cursor mode
    if (cmdOrCtrl && e.key === '1' && !e.shiftKey) {
      preventDefault()
      toggleWindowCursorMode()
      return
    }

    // Cmd/Ctrl + 2: Toggle hide all mode
    if (cmdOrCtrl && e.key === '2' && !e.shiftKey) {
      preventDefault()
      toggleHideAllMode()
      return
    }

    // Cmd/Ctrl + 3-9: Switch tabs (1 and 2 are used for modes above)
    if (cmdOrCtrl && e.key >= '3' && e.key <= '9') {
      preventDefault()
      if (activeWindow) {
        const tabIndex = parseInt(e.key) - 1
        if (tabIndex < activeWindow.tabs.length) {
          dispatch({
            type: 'SWITCH_TAB',
            payload: { windowId: activeWindow.id, tabIndex }
          })
        }
      }
      return
    }

    // Cmd/Ctrl + Shift + [ : Previous tab
    if (cmdOrCtrl && e.shiftKey && e.key === '[') {
      preventDefault()
      if (activeWindow && activeWindow.tabs.length > 1) {
        const newIndex = activeWindow.activeTabIndex > 0
          ? activeWindow.activeTabIndex - 1
          : activeWindow.tabs.length - 1
        dispatch({
          type: 'SWITCH_TAB',
          payload: { windowId: activeWindow.id, tabIndex: newIndex }
        })
      }
      return
    }

    // Cmd/Ctrl + Shift + ] : Next tab
    if (cmdOrCtrl && e.shiftKey && e.key === ']') {
      preventDefault()
      if (activeWindow && activeWindow.tabs.length > 1) {
        const newIndex = activeWindow.activeTabIndex < activeWindow.tabs.length - 1
          ? activeWindow.activeTabIndex + 1
          : 0
        dispatch({
          type: 'SWITCH_TAB',
          payload: { windowId: activeWindow.id, tabIndex: newIndex }
        })
      }
      return
    }

    // Cmd/Ctrl + Shift + N: Open project dashboard
    if (cmdOrCtrl && e.shiftKey && e.key === 'n') {
      preventDefault()
      options.onToggleProjectDashboard?.()
      return
    }

    // Cmd/Ctrl + ,: Open settings
    if (cmdOrCtrl && e.key === ',') {
      preventDefault()
      options.onToggleSettings?.()
      return
    }

    // Cmd/Ctrl + /: Toggle help
    if (cmdOrCtrl && e.key === '/') {
      preventDefault()
      options.onToggleHelp?.()
      return
    }

    // Cmd/Ctrl + M: Minimize window
    if (cmdOrCtrl && e.key === 'm') {
      preventDefault()
      if (activeWindow) {
        dispatch({ type: 'MINIMIZE_WINDOW', payload: { id: activeWindow.id } })
      }
      return
    }

    // Cmd/Ctrl + Shift + M: Maximize window
    if (cmdOrCtrl && e.shiftKey && e.key === 'm') {
      preventDefault()
      if (activeWindow) {
        dispatch({ type: 'MAXIMIZE_WINDOW', payload: { id: activeWindow.id } })
      }
      return
    }

    // Cmd/Ctrl + Enter: Toggle fullscreen
    if (cmdOrCtrl && e.key === 'Enter') {
      preventDefault()
      if (activeWindow) {
        toggleFullscreen(activeWindow.id)
      }
      return
    }

    // Cmd/Ctrl + Shift + C: Cascade windows
    if (cmdOrCtrl && e.shiftKey && e.key === 'c') {
      preventDefault()
      cascadeWindows()
      return
    }

    // Cmd/Ctrl + Shift + T: Tile windows
    if (cmdOrCtrl && e.shiftKey && e.key === 't') {
      preventDefault()
      tileWindows()
      return
    }

    // Cmd/Ctrl + Z: Undo
    if (cmdOrCtrl && e.key === 'z' && !e.shiftKey) {
      preventDefault()
      undo()
      return
    }

    // Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y: Redo
    if ((cmdOrCtrl && e.shiftKey && e.key === 'z') || (cmdOrCtrl && e.key === 'y')) {
      preventDefault()
      redo()
      return
    }

    // Cmd/Ctrl + 0: Reset zoom
    if (cmdOrCtrl && e.key === '0') {
      preventDefault()
      setZoom(1)
      return
    }

    // Cmd/Ctrl + =: Zoom in
    if (cmdOrCtrl && e.key === '=') {
      preventDefault()
      setZoom(Math.min(2, state.canvas.zoom + 0.1))
      return
    }

    // Cmd/Ctrl + -: Zoom out
    if (cmdOrCtrl && e.key === '-') {
      preventDefault()
      setZoom(Math.max(0.1, state.canvas.zoom - 0.1))
      return
    }

    // Tab (no modifier): Focus next window
    if (e.key === 'Tab' && !cmdOrCtrl && !e.shiftKey && !e.altKey) {
      // Only handle if not in an input
      if (document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA') {
        preventDefault()
        const visibleWindows = state.windows.filter(w => !w.isMinimized)
        if (visibleWindows.length > 1) {
          const currentIndex = visibleWindows.findIndex(w => w.id === state.activeWindowId)
          const nextIndex = (currentIndex + 1) % visibleWindows.length
          focusWindow(visibleWindows[nextIndex].id)
        }
      }
      return
    }

    // Shift + Tab: Focus previous window
    if (e.key === 'Tab' && e.shiftKey && !cmdOrCtrl && !e.altKey) {
      if (document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA') {
        preventDefault()
        const visibleWindows = state.windows.filter(w => !w.isMinimized)
        if (visibleWindows.length > 1) {
          const currentIndex = visibleWindows.findIndex(w => w.id === state.activeWindowId)
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : visibleWindows.length - 1
          focusWindow(visibleWindows[prevIndex].id)
        }
      }
      return
    }

    // Escape: Clear selection / exit fullscreen / 4x quick hide-all toggle
    if (e.key === 'Escape') {
      const now = Date.now()
      escPressTimesRef.current.push(now)

      // Keep only presses within the time window
      escPressTimesRef.current = escPressTimesRef.current.filter(
        time => now - time < ESC_PRESS_WINDOW
      )

      // Check for 4x quick press
      if (escPressTimesRef.current.length >= 4) {
        escPressTimesRef.current = []
        toggleHideAllMode()
        return
      }

      if (state.selectedWindowIds.length > 0) {
        dispatch({ type: 'CLEAR_SELECTION' })
      } else if (activeWindow?.isFullscreen) {
        toggleFullscreen(activeWindow.id)
      }
      return
    }

    // S key: Toggle selection mode
    if (e.key === 's' && !cmdOrCtrl && !e.shiftKey && !e.altKey) {
      if (document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA') {
        preventDefault()
        toggleSelectionMode()
      }
      return
    }

    // V key: Toggle selection for active window
    if (e.key === 'v' && !cmdOrCtrl && !e.shiftKey && !e.altKey) {
      if (document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA') {
        preventDefault()
        if (activeWindow) {
          if (state.selectedWindowIds.includes(activeWindow.id)) {
            deselectWindow(activeWindow.id)
          } else {
            selectWindow(activeWindow.id)
          }
        }
      }
      return
    }

    // Z key: Zoom to selected windows
    if (e.key === 'z' && !cmdOrCtrl && !e.shiftKey && !e.altKey) {
      if (document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA') {
        preventDefault()
        zoomToSelectedWindows()
      }
      return
    }

    // F11: Toggle fullscreen for active window
    if (e.key === 'F11') {
      preventDefault()
      if (activeWindow) {
        toggleFullscreen(activeWindow.id)
      }
      return
    }

    // Cmd/Ctrl + G: Grid arrange selected windows
    if (cmdOrCtrl && e.key === 'g' && !e.shiftKey) {
      preventDefault()
      gridArrangeWindows()
      return
    }

    // Cmd/Ctrl + A: Select all windows
    if (cmdOrCtrl && e.key === 'a') {
      if (document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA') {
        preventDefault()
        dispatch({ type: 'SELECT_ALL_WINDOWS' })
      }
      return
    }

    // Delete/Backspace: Delete selected windows
    if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedWindowIds.length > 0) {
      if (document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA') {
        preventDefault()
        state.selectedWindowIds.forEach(id => closeWindow(id))
        dispatch({ type: 'CLEAR_SELECTION' })
      }
      return
    }

    // Cmd/Ctrl + Shift + H: Hide all windows
    if (cmdOrCtrl && e.shiftKey && e.key === 'h') {
      preventDefault()
      toggleHideAllMode()
      return
    }

    // Cmd/Ctrl + Shift + S: Solo mode
    if (cmdOrCtrl && e.shiftKey && e.key === 's') {
      preventDefault()
      dispatch({ type: 'TOGGLE_SOLO_MODE' })
      return
    }
  }, [state, dispatch, createWindow, closeWindow, addTab, closeTab, focusWindow, cascadeWindows, tileWindows, setZoom, options, toggleSelectionMode, toggleWindowCursorMode, toggleHideAllMode, toggleFullscreen, zoomToSelectedWindows, gridArrangeWindows, selectWindow, deselectWindow, undo, redo])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

export default useKeyboardShortcuts
