import { useRef, useCallback, useState, useEffect, type MouseEvent, type WheelEvent } from 'react'
import { useWindowManager } from '@/contexts/WindowManagerContext'
import { CANVAS_SIZE } from '@/constants/canvas'
import CanvasGrid from './CanvasGrid'
import SelectionBox from './SelectionBox'
import SnapPreview from './SnapPreview'
import { ContextMenu } from '@/components/ContextMenu'
import styles from './Canvas.module.css'

interface SelectionState {
  isSelecting: boolean
  startX: number
  startY: number
  currentX: number
  currentY: number
}

interface PanState {
  isPanning: boolean
  startX: number
  startY: number
  panStartX: number
  panStartY: number
}

interface ContextMenuState {
  isOpen: boolean
  x: number
  y: number
}

export default function Canvas({ children }: { children: React.ReactNode }) {
  const desktopRef = useRef<HTMLDivElement>(null)
  const canvasWrapperRef = useRef<HTMLDivElement>(null)

  const { state, dispatch, setZoom, createWindow, cascadeWindows, tileWindows } = useWindowManager()

  const [selectionState, setSelectionState] = useState<SelectionState | null>(null)
  const [panState, setPanState] = useState<PanState | null>(null)
  const [spaceKeyPressed, setSpaceKeyPressed] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ isOpen: false, x: 0, y: 0 })

  const { zoom, panX, panY } = state.canvas
  const { selectionMode } = state.modes

  // Helper to constrain pan within canvas bounds - hard stop at edges
  // Sidebar is now overlay, so viewport is full width
  const constrainPan = useCallback((newPanX: number, newPanY: number, currentZoom: number) => {
    const headerHeight = 32
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight - headerHeight

    const scaledCanvasSize = CANVAS_SIZE * currentZoom

    // NO margin - hard stop at canvas edge
    // Canvas left edge (0) should not go past viewport right edge
    const maxPanX = 0
    // Canvas right edge should not go past viewport left edge
    const minPanX = viewportWidth - scaledCanvasSize

    // Canvas top edge (0) should not go past viewport bottom edge
    const maxPanY = headerHeight
    // Canvas bottom edge should not go past viewport top edge
    const minPanY = viewportHeight - scaledCanvasSize + headerHeight

    return {
      panX: Math.max(minPanX, Math.min(maxPanX, newPanX)),
      panY: Math.max(minPanY, Math.min(maxPanY, newPanY))
    }
  }, [])

  // Handle wheel events for zoom/pan
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()

    // Get mouse position relative to the canvas container
    const rect = desktopRef.current?.getBoundingClientRect()
    if (!rect) return

    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Detect input type:
    // - ctrlKey with deltaMode 0 = pinch gesture on trackpad → ZOOM
    // - deltaMode 0 (pixel-based) without ctrlKey = trackpad two-finger scroll → PAN
    // - deltaMode 1 (line-based) = mouse wheel → ZOOM
    const isPinchGesture = e.ctrlKey && e.deltaMode === 0
    const isTrackpadScroll = e.deltaMode === 0 && !e.ctrlKey

    if (isPinchGesture) {
      // Pinch zoom on trackpad - zoom at pointer
      const zoomFactor = 1 - (e.deltaY * 0.01)
      const newZoom = Math.max(0.1, Math.min(2.0, zoom * zoomFactor))

      // STOP if at zoom limits - do nothing
      if (newZoom === zoom) return

      const pointXInCanvas = (mouseX - panX) / zoom
      const pointYInCanvas = (mouseY - panY) / zoom

      const newPanX = mouseX - pointXInCanvas * newZoom
      const newPanY = mouseY - pointYInCanvas * newZoom

      const constrained = constrainPan(newPanX, newPanY, newZoom)
      setZoom(newZoom, constrained.panX, constrained.panY)
    } else if (isTrackpadScroll) {
      // Two-finger scroll on trackpad → PAN (both horizontal and vertical)
      const constrained = constrainPan(panX - e.deltaX, panY - e.deltaY, zoom)
      dispatch({
        type: 'SET_PAN',
        payload: constrained
      })
    } else {
      // Mouse wheel → ZOOM at pointer
      const zoomFactor = 1 - (e.deltaY * 0.002)
      const newZoom = Math.max(0.1, Math.min(2.0, zoom * zoomFactor))

      // STOP if at zoom limits - do nothing
      if (newZoom === zoom) return

      const pointXInCanvas = (mouseX - panX) / zoom
      const pointYInCanvas = (mouseY - panY) / zoom

      const newPanX = mouseX - pointXInCanvas * newZoom
      const newPanY = mouseY - pointYInCanvas * newZoom

      const constrained = constrainPan(newPanX, newPanY, newZoom)
      setZoom(newZoom, constrained.panX, constrained.panY)
    }
  }, [zoom, panX, panY, setZoom, dispatch, constrainPan])

  // Attach wheel event listener with passive: false to allow preventDefault
  useEffect(() => {
    const desktop = desktopRef.current
    if (!desktop) return

    desktop.addEventListener('wheel', handleWheel as any, { passive: false })

    return () => {
      desktop.removeEventListener('wheel', handleWheel as any)
    }
  }, [handleWheel])

  // Handle mouse down on canvas
  const handleMouseDown = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement
    const isEmptyCanvas = target.id === 'desktop' ||
                          target.id === 'canvas-wrapper' ||
                          target.classList.contains(styles.canvasGrid)

    // Selection mode - start selection box
    if (selectionMode && e.button === 0 && isEmptyCanvas) {
      const rect = desktopRef.current?.getBoundingClientRect()
      if (!rect) return

      setSelectionState({
        isSelecting: true,
        startX: e.clientX - rect.left,
        startY: e.clientY - rect.top,
        currentX: e.clientX - rect.left,
        currentY: e.clientY - rect.top
      })
      e.preventDefault()
      return
    }

    // Middle mouse button for pan
    if (e.button === 1) {
      setPanState({
        isPanning: true,
        startX: e.clientX,
        startY: e.clientY,
        panStartX: panX,
        panStartY: panY
      })
      e.preventDefault()
    }
  }, [selectionMode, panX, panY])

  // Handle mouse move
  const handleMouseMove = useCallback((e: MouseEvent) => {
    // Selection box
    if (selectionState?.isSelecting) {
      const rect = desktopRef.current?.getBoundingClientRect()
      if (!rect) return

      setSelectionState(prev => prev ? {
        ...prev,
        currentX: e.clientX - rect.left,
        currentY: e.clientY - rect.top
      } : null)
    }

    // Panning - apply constraints
    if (panState?.isPanning) {
      const dx = e.clientX - panState.startX
      const dy = e.clientY - panState.startY
      const constrained = constrainPan(
        panState.panStartX + dx,
        panState.panStartY + dy,
        zoom
      )
      dispatch({
        type: 'SET_PAN',
        payload: constrained
      })
    }
  }, [selectionState, panState, dispatch, zoom, constrainPan])

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    // Complete selection
    if (selectionState?.isSelecting) {
      // Calculate selection rectangle in canvas coordinates
      const x = Math.min(selectionState.startX, selectionState.currentX)
      const y = Math.min(selectionState.startY, selectionState.currentY)
      const width = Math.abs(selectionState.currentX - selectionState.startX)
      const height = Math.abs(selectionState.currentY - selectionState.startY)

      // Convert to canvas coordinates (accounting for zoom/pan)
      const canvasX = (x - panX) / zoom
      const canvasY = (y - panY) / zoom
      const canvasWidth = width / zoom
      const canvasHeight = height / zoom

      dispatch({
        type: 'SELECT_WINDOWS_IN_RECT',
        payload: { x: canvasX, y: canvasY, width: canvasWidth, height: canvasHeight }
      })

      setSelectionState(null)
    }

    // End panning
    if (panState?.isPanning) {
      setPanState(null)
    }
  }, [selectionState, panState, panX, panY, zoom, dispatch])

  // Handle context menu
  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault()
    const target = e.target as HTMLElement
    const isEmptyCanvas = target.id === 'desktop' ||
                          target.id === 'canvas-wrapper' ||
                          target.classList.contains(styles.canvasGrid)

    if (isEmptyCanvas) {
      setContextMenu({
        isOpen: true,
        x: e.clientX,
        y: e.clientY
      })
    }
  }, [])

  const closeContextMenu = useCallback(() => {
    setContextMenu({ isOpen: false, x: 0, y: 0 })
  }, [])

  // Keyboard events for space key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space key for zoom
      if (e.code === 'Space' && !spaceKeyPressed) {
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          setSpaceKeyPressed(true)
          e.preventDefault()
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpaceKeyPressed(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [spaceKeyPressed])

  // Listen for canvas zoom from Electron
  useEffect(() => {
    if (window.electronAPI?.onCanvasZoomWheel) {
      window.electronAPI.onCanvasZoomWheel((data) => {
        const zoomSpeed = 0.005
        const delta = -data.deltaY * zoomSpeed
        const newZoom = Math.max(0.1, Math.min(2.0, zoom + delta))

        // STOP if at zoom limits - do nothing
        if (newZoom === zoom) return

        const mouseXInCanvas = (data.x - panX) / zoom
        const mouseYInCanvas = (data.y - panY) / zoom
        const newPanX = data.x - mouseXInCanvas * newZoom
        const newPanY = data.y - mouseYInCanvas * newZoom

        const constrained = constrainPan(newPanX, newPanY, newZoom)
        setZoom(newZoom, constrained.panX, constrained.panY)
      })
    }
  }, [zoom, panX, panY, setZoom, constrainPan])

  const canvasStyle = {
    transform: `translate(${panX}px, ${panY}px) scale(${zoom})`
  }

  const desktopClassName = [
    styles.desktop,
    panState?.isPanning ? styles.panning : '',
    selectionMode ? styles.selectionMode : ''
  ].filter(Boolean).join(' ')

  return (
    <div
      id="desktop"
      ref={desktopRef}
      className={desktopClassName}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
    >
      <div
        id="canvas-wrapper"
        ref={canvasWrapperRef}
        className={styles.canvasWrapper}
        style={canvasStyle}
      >
        <CanvasGrid />
        {children}
      </div>

      {selectionState?.isSelecting && (
        <SelectionBox
          x={Math.min(selectionState.startX, selectionState.currentX)}
          y={Math.min(selectionState.startY, selectionState.currentY)}
          width={Math.abs(selectionState.currentX - selectionState.startX)}
          height={Math.abs(selectionState.currentY - selectionState.startY)}
        />
      )}

      <SnapPreview />

      <ContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={closeContextMenu}
        onNewWindow={createWindow}
        onCascade={cascadeWindows}
        onTile={tileWindows}
      />
    </div>
  )
}
