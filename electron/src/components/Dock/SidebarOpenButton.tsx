import { useWindowManager } from '@/contexts/WindowManagerContext'
import { useSettings } from '@/contexts/SettingsContext'
import styles from './SidebarOpenButton.module.css'

export default function SidebarOpenButton() {
  const { state } = useWindowManager()
  const { settings, setShowSidebar } = useSettings()

  // Only show when sidebar is hidden and not in hideAllMode
  if (settings.showSidebar || state.modes.hideAllMode) {
    return null
  }

  return (
    <button
      className={styles.openButton}
      onClick={() => setShowSidebar(true)}
      title="Show Sidebar"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="13 17 18 12 13 7"/>
        <polyline points="6 17 11 12 6 7"/>
      </svg>
    </button>
  )
}
