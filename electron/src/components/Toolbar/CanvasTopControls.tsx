import { useWindowManager } from '@/contexts/WindowManagerContext'
import styles from './CanvasTopControls.module.css'

export default function CanvasTopControls() {
  const { state, toggleSoloMode, toggleHideAllMode } = useWindowManager()
  const { soloMode, hideAllMode } = state.modes

  return (
    <div className={styles.canvasTopControls}>
      <button
        className={`${styles.canvasControlBtn} ${soloMode ? styles.active : ''}`}
        onClick={toggleSoloMode}
        title="Solo Mode - Hide Header"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
      </button>
      <button
        className={`${styles.canvasControlBtn} ${styles.textBtn} ${hideAllMode ? styles.active : ''}`}
        onClick={toggleHideAllMode}
        title="Hide All UI (Cmd+2)"
        data-tour="hide-all"
      >
        <span className={styles.shortcutText}>Cmd+2</span>
      </button>
    </div>
  )
}
