import { useWindowManager } from '@/contexts/WindowManagerContext'
import appIcon from '@/assets/icon.png'
import styles from './AppHeader.module.css'

interface AppHeaderProps {
  onSettingsClick?: () => void
  onHelpClick?: () => void
}

export default function AppHeader({ onSettingsClick, onHelpClick }: AppHeaderProps) {
  const { state } = useWindowManager()

  const handleMinimize = () => {
    window.electronAPI?.minimizeApp()
  }

  const handleMaximize = () => {
    window.electronAPI?.maximizeApp()
  }

  const handleClose = () => {
    window.electronAPI?.closeApp()
  }

  // Hide header in hideAllMode or soloMode
  if (state.modes.hideAllMode || state.modes.soloMode) {
    return null
  }

  return (
    <div className={styles.header}>
      <div className={styles.appBrand}>
        <img src={appIcon} alt="AntiTabs" className={styles.appIcon} />
        <span className={styles.appTitle}>AntiTabs</span>
      </div>
      <div className={styles.headerActions}>
        <button
          className={styles.actionBtn}
          onClick={onHelpClick}
          title="Help & Shortcuts (?)"
          data-tour="help"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </button>
        <button
          className={styles.actionBtn}
          onClick={onSettingsClick}
          title="Settings"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>
      <div className={styles.buttons}>
        <button
          className={styles.btn}
          onClick={handleMinimize}
          title="Minimize"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <rect y="5" width="12" height="2" rx="1"/>
          </svg>
        </button>
        <button
          className={styles.btn}
          onClick={handleMaximize}
          title="Maximize"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="1" width="10" height="10" rx="1"/>
          </svg>
        </button>
        <button
          className={`${styles.btn} ${styles.close}`}
          onClick={handleClose}
          title="Close"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M1.41 0L0 1.41L4.59 6L0 10.59L1.41 12L6 7.41L10.59 12L12 10.59L7.41 6L12 1.41L10.59 0L6 4.59L1.41 0Z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
