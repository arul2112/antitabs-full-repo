import { useWindowManager } from '@/contexts/WindowManagerContext'
import styles from './Toolbar.module.css'

export default function RightToolbar() {
  const {
    state,
    toggleSelectionMode,
    toggleWindowCursorMode,
    cascadeWindows,
    tileWindows
  } = useWindowManager()

  // Hide in hideAllMode
  if (state.modes.hideAllMode) {
    return null
  }

  return (
    <div className={styles.rightToolbar}>
      <button
        className={`${styles.toolbarBtn} ${state.modes.windowCursorMode ? styles.active : ''}`}
        onClick={toggleWindowCursorMode}
        title={`Window Cursor Mode - ${state.modes.windowCursorMode ? 'ON' : 'OFF'} (Cmd/Ctrl + 1)`}
        data-tour="cursor-mode"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="4" width="16" height="16" rx="2"/>
          <path d="M8 8l4 7 1.5-3 3-1.5z"/>
        </svg>
      </button>

      <div className={styles.separator} />

      <button
        className={`${styles.toolbarBtn} ${state.modes.selectionMode ? styles.active : ''}`}
        onClick={toggleSelectionMode}
        title="Select Mode (S)"
        data-tour="selection-mode"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
        </svg>
      </button>

      <div className={styles.separator} />

      <button
        className={styles.toolbarBtn}
        onClick={cascadeWindows}
        title="Cascade Windows"
        data-tour="cascade"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="2" width="12" height="12" rx="2"/>
          <rect x="6" y="6" width="12" height="12" rx="2"/>
        </svg>
      </button>

      <button
        className={styles.toolbarBtn}
        onClick={tileWindows}
        title="Tile Windows"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="2" width="6" height="6" rx="1"/>
          <rect x="12" y="2" width="6" height="6" rx="1"/>
          <rect x="2" y="12" width="6" height="6" rx="1"/>
          <rect x="12" y="12" width="6" height="6" rx="1"/>
        </svg>
      </button>
    </div>
  )
}
