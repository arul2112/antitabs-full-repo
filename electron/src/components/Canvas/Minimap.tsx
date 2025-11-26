import { useCallback, useMemo } from 'react'
import { useWindowManager } from '@/contexts/WindowManagerContext'
import { useSettings } from '@/contexts/SettingsContext'
import { CANVAS_BOUNDS } from '@/constants/canvas'
import styles from './Minimap.module.css'

const MINIMAP_SIZE = 150
const MINIMAP_PADDING = 4

export default function Minimap() {
  const { state, dispatch } = useWindowManager()
  const { settings } = useSettings()

  // Use the fixed canvas bounds from constants
  const bounds = useMemo(() => CANVAS_BOUNDS, [])

  // Calculate fixed scale to fit canvas bounds in minimap
  const scale = useMemo(() => {
    const scaleX = (MINIMAP_SIZE - MINIMAP_PADDING * 2) / bounds.width
    const scaleY = (MINIMAP_SIZE - MINIMAP_PADDING * 2) / bounds.height
    return Math.min(scaleX, scaleY)
  }, [bounds])

  // Calculate viewport rectangle in minimap (what user currently sees)
  const viewport = useMemo(() => {
    const sidebarWidth = settings.showSidebar ? 240 : 0
    const headerHeight = 32

    // Viewport size in canvas coordinates (inverse of zoom)
    const viewportWidth = (window.innerWidth - sidebarWidth) / state.canvas.zoom
    const viewportHeight = (window.innerHeight - headerHeight) / state.canvas.zoom

    // Calculate top-left of viewport in canvas coordinates
    const viewLeft = (sidebarWidth - state.canvas.panX) / state.canvas.zoom
    const viewTop = (headerHeight - state.canvas.panY) / state.canvas.zoom

    return {
      x: (viewLeft - bounds.minX) * scale + MINIMAP_PADDING,
      y: (viewTop - bounds.minY) * scale + MINIMAP_PADDING,
      width: viewportWidth * scale,
      height: viewportHeight * scale
    }
  }, [state.canvas, bounds, scale, settings.showSidebar])

  // Handle click on minimap to navigate
  const handleMinimapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left - MINIMAP_PADDING
    const clickY = e.clientY - rect.top - MINIMAP_PADDING

    // Convert click position to canvas coordinates
    const canvasX = clickX / scale + bounds.minX
    const canvasY = clickY / scale + bounds.minY

    // Calculate pan to center this point in viewport
    const sidebarWidth = settings.showSidebar ? 240 : 0
    const headerHeight = 32
    const viewportWidth = window.innerWidth - sidebarWidth
    const viewportHeight = window.innerHeight - headerHeight

    const panX = sidebarWidth + viewportWidth / 2 - canvasX * state.canvas.zoom
    const panY = headerHeight + viewportHeight / 2 - canvasY * state.canvas.zoom

    dispatch({ type: 'SET_PAN', payload: { panX, panY } })
  }, [scale, bounds, state.canvas.zoom, settings.showSidebar, dispatch])

  // Hide minimap if setting is off, no windows, or in hideAllMode
  if (!settings.showMinimap || state.windows.length === 0 || state.modes.hideAllMode) {
    return null
  }

  return (
    <div className={styles.minimapContainer}>
      <div
        className={styles.minimap}
        onClick={handleMinimapClick}
        title="Click to navigate"
      >
        {/* Window rectangles */}
        {state.windows.map(win => (
          <div
            key={win.id}
            className={`${styles.windowRect} ${win.id === state.activeWindowId ? styles.active : ''} ${win.isHidden ? styles.hidden : ''}`}
            style={{
              left: (win.x - bounds.minX) * scale + MINIMAP_PADDING,
              top: (win.y - bounds.minY) * scale + MINIMAP_PADDING,
              width: Math.max(win.width * scale, 2),
              height: Math.max(win.height * scale, 2),
              borderColor: win.windowColor || undefined
            }}
          />
        ))}

        {/* Viewport indicator - shows current view area */}
        <div
          className={styles.viewport}
          style={{
            left: viewport.x,
            top: viewport.y,
            width: Math.max(viewport.width, 4),
            height: Math.max(viewport.height, 4)
          }}
        />
      </div>
    </div>
  )
}
