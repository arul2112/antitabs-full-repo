import { useWindowManager } from '@/contexts/WindowManagerContext'
import { useSettings } from '@/contexts/SettingsContext'
import styles from './Toolbar.module.css'

export default function ZoomControls() {
  const { state, zoomIn, zoomOut, resetZoom } = useWindowManager()
  const { settings } = useSettings()

  // Hide in hideAllMode or if showZoomControls is false
  if (state.modes.hideAllMode || !settings.showZoomControls) {
    return null
  }

  const zoomPercent = Math.round(state.canvas.zoom * 100)

  return (
    <div className={styles.zoomControls} data-tour="zoom-controls">
      <button
        className={styles.zoomBtn}
        onClick={() => zoomIn()}
        title="Zoom In (Cmd++)"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      <button
        className={styles.zoomLevel}
        onClick={resetZoom}
        title="Reset Zoom (Cmd+0)"
      >
        {zoomPercent}%
      </button>

      <button
        className={styles.zoomBtn}
        onClick={() => zoomOut()}
        title="Zoom Out (Cmd+-)"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    </div>
  )
}
