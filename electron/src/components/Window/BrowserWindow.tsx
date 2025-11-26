import { useRef, useState, useCallback, useEffect, type MouseEvent } from 'react'
import { useWindowManager } from '@/contexts/WindowManagerContext'
import type { WindowState, ResizeDirection } from '@/types'
import TabBar from './TabBar'
import NavigationBar from './NavigationBar'
import WebviewContainer from './WebviewContainer'
import styles from './BrowserWindow.module.css'

interface BrowserWindowProps {
  window: WindowState
}

interface DragState {
  isDragging: boolean
  startX: number
  startY: number
  windowStartX: number
  windowStartY: number
}

interface ResizeState {
  isResizing: boolean
  direction: ResizeDirection
  startX: number
  startY: number
  windowStartX: number
  windowStartY: number
  windowStartWidth: number
  windowStartHeight: number
}

const MIN_WIDTH = 400
const MIN_HEIGHT = 300

export default function BrowserWindow({ window }: BrowserWindowProps) {
  const windowRef = useRef<HTMLDivElement>(null)
  const {
    state,
    focusWindow,
    closeWindow,
    moveWindow,
    moveWindowEnd,
    resizeWindow,
    resizeWindowEnd,
    dispatch,
    toggleWindowSelection
  } = useWindowManager()

  const [dragState, setDragState] = useState<DragState | null>(null)
  const [resizeState, setResizeState] = useState<ResizeState | null>(null)

  const isActive = state.activeWindowId === window.id
  const isSelected = state.selectedWindowIds.includes(window.id)

  // Handle title bar mouse down for dragging
  const handleTitleBarMouseDown = useCallback((e: MouseEvent) => {
    if (window.isMaximized) return

    // Cmd/Ctrl + click to toggle selection
    if (e.metaKey || e.ctrlKey) {
      toggleWindowSelection(window.id)
      return
    }

    focusWindow(window.id)

    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      windowStartX: window.x,
      windowStartY: window.y
    })
  }, [window.id, window.x, window.y, window.isMaximized, focusWindow, toggleWindowSelection])

  // Handle resize handle mouse down
  const handleResizeMouseDown = useCallback((direction: ResizeDirection) => (e: MouseEvent) => {
    if (window.isMaximized) return
    e.stopPropagation()

    setResizeState({
      isResizing: true,
      direction,
      startX: e.clientX,
      startY: e.clientY,
      windowStartX: window.x,
      windowStartY: window.y,
      windowStartWidth: window.width,
      windowStartHeight: window.height
    })
  }, [window.x, window.y, window.width, window.height, window.isMaximized])

  // Global mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      const zoom = state.canvas.zoom

      if (dragState?.isDragging) {
        const dx = (e.clientX - dragState.startX) / zoom
        const dy = (e.clientY - dragState.startY) / zoom
        moveWindow(window.id, dragState.windowStartX + dx, dragState.windowStartY + dy)
      }

      if (resizeState?.isResizing) {
        const dx = (e.clientX - resizeState.startX) / zoom
        const dy = (e.clientY - resizeState.startY) / zoom
        const dir = resizeState.direction

        let newX = resizeState.windowStartX
        let newY = resizeState.windowStartY
        let newWidth = resizeState.windowStartWidth
        let newHeight = resizeState.windowStartHeight

        if (dir.includes('w')) {
          newX = resizeState.windowStartX + dx
          newWidth = resizeState.windowStartWidth - dx
        } else if (dir.includes('e')) {
          newWidth = resizeState.windowStartWidth + dx
        }

        if (dir.includes('n')) {
          newY = resizeState.windowStartY + dy
          newHeight = resizeState.windowStartHeight - dy
        } else if (dir.includes('s')) {
          newHeight = resizeState.windowStartHeight + dy
        }

        // Apply minimum constraints
        if (newWidth >= MIN_WIDTH && newHeight >= MIN_HEIGHT) {
          resizeWindow(window.id, newWidth, newHeight, newX, newY)
        } else if (newWidth >= MIN_WIDTH) {
          resizeWindow(window.id, newWidth, resizeState.windowStartHeight, newX, resizeState.windowStartY)
        } else if (newHeight >= MIN_HEIGHT) {
          resizeWindow(window.id, resizeState.windowStartWidth, newHeight, resizeState.windowStartX, newY)
        }
      }
    }

    const handleMouseUp = (e: globalThis.MouseEvent) => {
      const zoom = state.canvas.zoom

      // Record final position/size for undo/redo history
      if (dragState?.isDragging) {
        const dx = (e.clientX - dragState.startX) / zoom
        const dy = (e.clientY - dragState.startY) / zoom
        const finalX = dragState.windowStartX + dx
        const finalY = dragState.windowStartY + dy
        moveWindowEnd(window.id, finalX, finalY)
      }

      if (resizeState?.isResizing) {
        const dx = (e.clientX - resizeState.startX) / zoom
        const dy = (e.clientY - resizeState.startY) / zoom
        const dir = resizeState.direction

        let newX = resizeState.windowStartX
        let newY = resizeState.windowStartY
        let newWidth = resizeState.windowStartWidth
        let newHeight = resizeState.windowStartHeight

        if (dir.includes('w')) {
          newX = resizeState.windowStartX + dx
          newWidth = resizeState.windowStartWidth - dx
        } else if (dir.includes('e')) {
          newWidth = resizeState.windowStartWidth + dx
        }

        if (dir.includes('n')) {
          newY = resizeState.windowStartY + dy
          newHeight = resizeState.windowStartHeight - dy
        } else if (dir.includes('s')) {
          newHeight = resizeState.windowStartHeight + dy
        }

        // Apply minimum constraints and record final state
        if (newWidth >= MIN_WIDTH && newHeight >= MIN_HEIGHT) {
          resizeWindowEnd(window.id, newWidth, newHeight, newX, newY)
        } else if (newWidth >= MIN_WIDTH) {
          resizeWindowEnd(window.id, newWidth, resizeState.windowStartHeight, newX, resizeState.windowStartY)
        } else if (newHeight >= MIN_HEIGHT) {
          resizeWindowEnd(window.id, resizeState.windowStartWidth, newHeight, resizeState.windowStartX, newY)
        }
      }

      setDragState(null)
      setResizeState(null)
    }

    if (dragState?.isDragging || resizeState?.isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragState, resizeState, window.id, state.canvas.zoom, moveWindow, moveWindowEnd, resizeWindow, resizeWindowEnd])

  // Handle maximize toggle
  const handleMaximize = useCallback(() => {
    dispatch({ type: 'MAXIMIZE_WINDOW', payload: { id: window.id } })
  }, [dispatch, window.id])

  // Handle minimize
  const handleMinimize = useCallback(() => {
    dispatch({ type: 'MINIMIZE_WINDOW', payload: { id: window.id } })
  }, [dispatch, window.id])

  // Handle close
  const handleClose = useCallback(() => {
    closeWindow(window.id)
  }, [closeWindow, window.id])

  // Don't render minimized windows
  if (window.isMinimized) {
    return null
  }

  const windowStyle = window.isMaximized
    ? {
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: window.zIndex
      }
    : {
        left: window.x,
        top: window.y,
        width: window.width,
        height: window.height,
        zIndex: window.zIndex
      }

  const windowClassName = [
    styles.browserWindow,
    isActive ? styles.active : '',
    isSelected ? styles.selected : '',
    window.isMaximized ? styles.maximized : '',
    window.isFullscreen ? styles.fullscreen : '',
    dragState?.isDragging ? styles.dragging : ''
  ].filter(Boolean).join(' ')

  return (
    <div
      ref={windowRef}
      className={windowClassName}
      style={windowStyle}
      onMouseDown={() => focusWindow(window.id)}
      data-tour="window"
    >
      {/* Title Bar */}
      <div
        className={styles.titleBar}
        onMouseDown={handleTitleBarMouseDown}
        onDoubleClick={handleMaximize}
        style={window.windowColor ? { backgroundColor: window.windowColor } : undefined}
      >
        {/* Traffic Lights */}
        <div className={styles.trafficLights}>
          <button
            className={`${styles.trafficLight} ${styles.close}`}
            onClick={(e) => { e.stopPropagation(); handleClose(); }}
            title="Close"
          />
          <button
            className={`${styles.trafficLight} ${styles.minimize}`}
            onClick={(e) => { e.stopPropagation(); handleMinimize(); }}
            title="Minimize"
          />
          <button
            className={`${styles.trafficLight} ${styles.maximize}`}
            onClick={(e) => { e.stopPropagation(); handleMaximize(); }}
            title="Maximize"
          />
        </div>

        <div className={styles.windowTitle}>{window.name}</div>
      </div>

      {/* Tab Bar */}
      <TabBar window={window} />

      {/* Navigation Bar */}
      <NavigationBar window={window} />

      {/* Content Area - Webviews */}
      <div className={styles.contentArea}>
        {window.tabs.map((tab, index) => (
          <WebviewContainer
            key={tab.id}
            tab={tab}
            windowId={window.id}
            tabIndex={index}
            isActive={index === window.activeTabIndex}
          />
        ))}
      </div>

      {/* Resize Handles */}
      {!window.isMaximized && (
        <>
          <div className={`${styles.resizeHandle} ${styles.n}`} onMouseDown={handleResizeMouseDown('n')} />
          <div className={`${styles.resizeHandle} ${styles.s}`} onMouseDown={handleResizeMouseDown('s')} />
          <div className={`${styles.resizeHandle} ${styles.e}`} onMouseDown={handleResizeMouseDown('e')} />
          <div className={`${styles.resizeHandle} ${styles.w}`} onMouseDown={handleResizeMouseDown('w')} />
          <div className={`${styles.resizeHandle} ${styles.ne}`} onMouseDown={handleResizeMouseDown('ne')} />
          <div className={`${styles.resizeHandle} ${styles.nw}`} onMouseDown={handleResizeMouseDown('nw')} />
          <div className={`${styles.resizeHandle} ${styles.se}`} onMouseDown={handleResizeMouseDown('se')} />
          <div className={`${styles.resizeHandle} ${styles.sw}`} onMouseDown={handleResizeMouseDown('sw')} />
        </>
      )}
    </div>
  )
}
