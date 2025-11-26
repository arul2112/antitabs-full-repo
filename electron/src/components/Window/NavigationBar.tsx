import { useState, useCallback, type KeyboardEvent, type ChangeEvent } from 'react'
import { useWindowManager } from '@/contexts/WindowManagerContext'
import type { WindowState } from '@/types'
import styles from './NavigationBar.module.css'

interface NavigationBarProps {
  window: WindowState
}

export default function NavigationBar({ window }: NavigationBarProps) {
  const { updateTab } = useWindowManager()
  const activeTab = window.tabs[window.activeTabIndex]
  const [urlInput, setUrlInput] = useState(activeTab?.url || '')
  const [isFocused, setIsFocused] = useState(false)

  const handleBack = useCallback(() => {
    // Webview back navigation will be handled via ref
    const webview = document.querySelector(`#webview-${activeTab?.id}`) as any
    if (webview?.canGoBack()) {
      webview.goBack()
    }
  }, [activeTab?.id])

  const handleForward = useCallback(() => {
    const webview = document.querySelector(`#webview-${activeTab?.id}`) as any
    if (webview?.canGoForward()) {
      webview.goForward()
    }
  }, [activeTab?.id])

  const handleReload = useCallback(() => {
    const webview = document.querySelector(`#webview-${activeTab?.id}`) as any
    if (webview) {
      webview.reload()
    }
  }, [activeTab?.id])

  const handleUrlChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setUrlInput(e.target.value)
  }, [])

  const handleUrlSubmit = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && activeTab) {
      let url = urlInput.trim()

      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        // Check if it looks like a URL
        if (url.includes('.') && !url.includes(' ')) {
          url = 'https://' + url
        } else {
          // Treat as search query
          url = `https://www.google.com/search?q=${encodeURIComponent(url)}`
        }
      }

      updateTab(window.id, window.activeTabIndex, { url, isLoading: true })

      // Navigate webview
      const webview = document.querySelector(`#webview-${activeTab.id}`) as any
      if (webview) {
        webview.src = url
      }

      e.currentTarget.blur()
    }
  }, [urlInput, activeTab, window.id, window.activeTabIndex, updateTab])

  const handleFocus = useCallback(() => {
    setIsFocused(true)
    setUrlInput(activeTab?.url || '')
  }, [activeTab?.url])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
  }, [])

  return (
    <div className={styles.navigationBar}>
      <div className={styles.navButtons}>
        <button
          className={styles.navBtn}
          onClick={handleBack}
          disabled={!activeTab?.canGoBack}
          title="Back"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <button
          className={styles.navBtn}
          onClick={handleForward}
          disabled={!activeTab?.canGoForward}
          title="Forward"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        <button
          className={styles.navBtn}
          onClick={handleReload}
          title="Reload"
        >
          {activeTab?.isLoading ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          )}
        </button>
      </div>

      <input
        type="text"
        className={styles.urlBar}
        value={isFocused ? urlInput : (activeTab?.url || '')}
        onChange={handleUrlChange}
        onKeyDown={handleUrlSubmit}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Search or enter URL"
      />
    </div>
  )
}
