import { useCallback } from 'react'
import styles from './HelpModal.module.css'

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
  onStartDemo?: () => void
}

const shortcuts = {
  windowManagement: [
    { key: 'Cmd+N', description: 'New Window' },
    { key: 'Cmd+T', description: 'New Tab' },
    { key: 'Cmd+W', description: 'Close Tab' },
    { key: 'Cmd+Shift+W', description: 'Close Window' },
    { key: 'Cmd+D', description: 'Duplicate Window' },
    { key: 'Cmd+L', description: 'Focus URL Bar' }
  ],
  selectionLayout: [
    { key: 'S', description: 'Toggle Selection Mode' },
    { key: 'Cmd+Click', description: 'Multi-Select Windows' },
    { key: 'Cmd+G', description: 'Grid Arrange Selected' },
    { key: 'V', description: 'Toggle Active Selection' },
    { key: 'Delete', description: 'Delete Selected Windows' }
  ],
  canvasNavigation: [
    { key: 'Space+Scroll', description: 'Zoom Canvas' },
    { key: 'Two-Finger', description: 'Pan Canvas' },
    { key: 'Z', description: 'Zoom to Selected' },
    { key: 'Cmd+0', description: 'Reset Zoom' },
    { key: 'Cmd + / -', description: 'Zoom In/Out' }
  ],
  displayModes: [
    { key: 'Cmd+1', description: 'Window Cursor Mode' },
    { key: 'Cmd+2', description: 'Hide All UI' },
    { key: 'ESC (4x)', description: 'Quick Hide Toggle' },
    { key: 'F11', description: 'Fullscreen Window' }
  ],
  undoRedo: [
    { key: 'Cmd+Z', description: 'Undo' },
    { key: 'Cmd+Shift+Z', description: 'Redo' }
  ]
}

export default function HelpModal({ isOpen, onClose, onStartDemo }: HelpModalProps) {
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }, [onClose])

  if (!isOpen) return null

  return (
    <div className={styles.helpModalOverlay} onClick={handleOverlayClick}>
      <div className={styles.helpModal}>
        <div className={styles.helpModalHeader}>
          <h2 className={styles.helpModalTitle}>Keyboard Shortcuts & Tips</h2>
          <button className={styles.helpModalClose} onClick={onClose}>
            &times;
          </button>
        </div>

        <div className={styles.helpModalContent}>
          <div className={styles.helpSection}>
            <h3 className={styles.helpSectionTitle}>Window Management</h3>
            <div className={styles.helpShortcutsList}>
              {shortcuts.windowManagement.map((shortcut, i) => (
                <div key={i} className={styles.helpShortcutItem}>
                  <span className={styles.helpShortcutKey}>{shortcut.key}</span>
                  <span className={styles.helpShortcutDots} />
                  <span className={styles.helpShortcutDescription}>{shortcut.description}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.helpSection}>
            <h3 className={styles.helpSectionTitle}>Selection & Layout</h3>
            <div className={styles.helpShortcutsList}>
              {shortcuts.selectionLayout.map((shortcut, i) => (
                <div key={i} className={styles.helpShortcutItem}>
                  <span className={styles.helpShortcutKey}>{shortcut.key}</span>
                  <span className={styles.helpShortcutDots} />
                  <span className={styles.helpShortcutDescription}>{shortcut.description}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.helpSection}>
            <h3 className={styles.helpSectionTitle}>Canvas Navigation</h3>
            <div className={styles.helpShortcutsList}>
              {shortcuts.canvasNavigation.map((shortcut, i) => (
                <div key={i} className={styles.helpShortcutItem}>
                  <span className={styles.helpShortcutKey}>{shortcut.key}</span>
                  <span className={styles.helpShortcutDots} />
                  <span className={styles.helpShortcutDescription}>{shortcut.description}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.helpSection}>
            <h3 className={styles.helpSectionTitle}>Display Modes</h3>
            <div className={styles.helpShortcutsList}>
              {shortcuts.displayModes.map((shortcut, i) => (
                <div key={i} className={styles.helpShortcutItem}>
                  <span className={styles.helpShortcutKey}>{shortcut.key}</span>
                  <span className={styles.helpShortcutDots} />
                  <span className={styles.helpShortcutDescription}>{shortcut.description}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.helpSection}>
            <h3 className={styles.helpSectionTitle}>Undo/Redo</h3>
            <div className={styles.helpShortcutsList}>
              {shortcuts.undoRedo.map((shortcut, i) => (
                <div key={i} className={styles.helpShortcutItem}>
                  <span className={styles.helpShortcutKey}>{shortcut.key}</span>
                  <span className={styles.helpShortcutDots} />
                  <span className={styles.helpShortcutDescription}>{shortcut.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.helpModalFooter}>
          <button className={styles.helpDemoButton} onClick={onStartDemo}>
            <span>Start Demo Tour</span>
          </button>
        </div>
      </div>
    </div>
  )
}
