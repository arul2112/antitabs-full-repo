import { useWindowManager } from '@/contexts/WindowManagerContext'
import type { WindowState } from '@/types'
import styles from './TabBar.module.css'

interface TabBarProps {
  window: WindowState
}

export default function TabBar({ window }: TabBarProps) {
  const { addTab, closeTab, switchTab } = useWindowManager()

  return (
    <div className={styles.tabBar}>
      <div className={styles.tabs}>
        {window.tabs.map((tab, index) => (
          <div
            key={tab.id}
            className={`${styles.tab} ${index === window.activeTabIndex ? styles.active : ''}`}
            onClick={() => switchTab(window.id, index)}
          >
            {tab.favicon && (
              <img src={tab.favicon} alt="" className={styles.favicon} />
            )}
            <span className={styles.tabTitle}>{tab.title || 'New Tab'}</span>
            {window.tabs.length > 1 && (
              <button
                className={styles.closeTab}
                onClick={(e) => {
                  e.stopPropagation()
                  closeTab(window.id, index)
                }}
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M1.41 0L0 1.41L4.59 6L0 10.59L1.41 12L6 7.41L10.59 12L12 10.59L7.41 6L12 1.41L10.59 0L6 4.59L1.41 0Z"/>
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        className={styles.newTabBtn}
        onClick={() => addTab(window.id)}
        title="New Tab (Cmd+T)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    </div>
  )
}
