import { useCallback } from 'react'
import { useSettings, type Theme } from '@/contexts/SettingsContext'
import { useAuth } from '@/contexts/AuthContext'
import styles from './Settings.module.css'

interface SettingsProps {
  isOpen: boolean
  onClose: () => void
}

const themes: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'blue', label: 'Blue' },
  { value: 'purple', label: 'Purple' },
  { value: 'green', label: 'Green' }
]

export default function Settings({ isOpen, onClose }: SettingsProps) {
  const { settings, setTheme, setAccentColor, setShowZoomControls, setShowMinimap } = useSettings()
  const { user, signOut, getSubscriptionLabel } = useAuth()

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }, [onClose])

  const handleThemeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value as Theme)
  }, [setTheme])

  const handleAccentColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAccentColor(e.target.value)
  }, [setAccentColor])

  const handleZoomControlsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setShowZoomControls(e.target.checked)
  }, [setShowZoomControls])

  const handleMinimapChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setShowMinimap(e.target.checked)
  }, [setShowMinimap])

  const handleSignOut = useCallback(async () => {
    await signOut()
    onClose()
  }, [signOut, onClose])

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Settings</h2>
          <button className={styles.closeButton} onClick={onClose}>
            &times;
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Account Section */}
          {user && (
            <div className={styles.settingGroup}>
              <h3 className={styles.settingGroupTitle}>Account</h3>
              <div className={styles.accountInfo}>
                <div className={styles.accountAvatar}>
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className={styles.accountDetails}>
                  <p className={styles.accountEmail}>{user.email}</p>
                  <p className={styles.accountPlan}>{getSubscriptionLabel()}</p>
                </div>
              </div>
              <button className={styles.signOutButton} onClick={handleSignOut}>
                Sign Out
              </button>
            </div>
          )}

          {/* Appearance Section */}
          <div className={styles.settingGroup}>
            <h3 className={styles.settingGroupTitle}>Appearance</h3>
            <div className={styles.settingItem}>
              <span className={styles.settingLabel}>Theme</span>
              <select
                className={styles.settingSelect}
                value={settings.theme}
                onChange={handleThemeChange}
              >
                {themes.map((theme) => (
                  <option key={theme.value} value={theme.value}>
                    {theme.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.settingItem}>
              <span className={styles.settingLabel}>Accent Color</span>
              <input
                type="color"
                className={styles.colorPicker}
                value={settings.accentColor}
                onChange={handleAccentColorChange}
              />
            </div>
          </div>

          {/* Interface Section */}
          <div className={styles.settingGroup}>
            <h3 className={styles.settingGroupTitle}>Interface</h3>
            <div className={styles.settingItem}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={settings.showZoomControls}
                  onChange={handleZoomControlsChange}
                />
                <span className={styles.checkboxLabel}>Show Zoom Controls</span>
              </label>
            </div>
            <div className={styles.settingItem}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={settings.showMinimap}
                  onChange={handleMinimapChange}
                />
                <span className={styles.checkboxLabel}>Show Minimap</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
