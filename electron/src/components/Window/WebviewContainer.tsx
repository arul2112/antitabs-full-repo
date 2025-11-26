import { useRef, useEffect, useState } from 'react'
import { useWindowManager } from '@/contexts/WindowManagerContext'
import type { TabState } from '@/types'
import styles from './WebviewContainer.module.css'

declare global {
  interface HTMLWebViewElement extends HTMLElement {
    src: string
    canGoBack?: () => boolean
    canGoForward?: () => boolean
    goBack?: () => void
    goForward?: () => void
    reload?: () => void
    stop?: () => void
    getURL?: () => string
  }
}

interface WebviewContainerProps {
  tab: TabState
  windowId: string
  tabIndex: number
  isActive: boolean
}

export default function WebviewContainer({ tab, windowId, tabIndex, isActive }: WebviewContainerProps) {
  const webviewRef = useRef<HTMLWebViewElement>(null)
  const [isReady, setIsReady] = useState(false)
  const { state, updateTab } = useWindowManager()

  const { windowCursorMode } = state.modes

  // Set up webview event listeners
  useEffect(() => {
    const webview = webviewRef.current
    if (!webview) return

    const handleDomReady = () => {
      setIsReady(true)
    }

    const handleDidStartLoading = () => {
      updateTab(windowId, tabIndex, { isLoading: true })
    }

    const handleDidStopLoading = () => {
      updateTab(windowId, tabIndex, { isLoading: false })
    }

    const handleDidNavigate = (event: Event) => {
      const e = event as any
      try {
        updateTab(windowId, tabIndex, {
          url: e.url,
          canGoBack: webview.canGoBack?.() ?? false,
          canGoForward: webview.canGoForward?.() ?? false
        })
      } catch {
        updateTab(windowId, tabIndex, { url: e.url })
      }
    }

    const handleDidNavigateInPage = (event: Event) => {
      const e = event as any
      if (e.isMainFrame) {
        try {
          updateTab(windowId, tabIndex, {
            url: e.url,
            canGoBack: webview.canGoBack?.() ?? false,
            canGoForward: webview.canGoForward?.() ?? false
          })
        } catch {
          updateTab(windowId, tabIndex, { url: e.url })
        }
      }
    }

    const handlePageTitleUpdated = (event: Event) => {
      const e = event as any
      updateTab(windowId, tabIndex, { title: e.title })
    }

    const handlePageFaviconUpdated = (event: Event) => {
      const e = event as any
      if (e.favicons && e.favicons.length > 0) {
        updateTab(windowId, tabIndex, { favicon: e.favicons[0] })
      }
    }

    const handleDidFailLoad = (event: Event) => {
      const e = event as any
      // Only handle main frame errors
      if (e.isMainFrame && e.errorCode !== -3) { // -3 is aborted
        console.error('Webview load failed:', e.errorDescription)
        updateTab(windowId, tabIndex, { isLoading: false })
      }
    }

    const handleNewWindow = (event: Event) => {
      const e = event as any
      // Open in same tab by default
      if (webview) {
        webview.src = e.url
      }
    }

    // Add event listeners
    webview.addEventListener('dom-ready', handleDomReady)
    webview.addEventListener('did-start-loading', handleDidStartLoading)
    webview.addEventListener('did-stop-loading', handleDidStopLoading)
    webview.addEventListener('did-navigate', handleDidNavigate)
    webview.addEventListener('did-navigate-in-page', handleDidNavigateInPage)
    webview.addEventListener('page-title-updated', handlePageTitleUpdated)
    webview.addEventListener('page-favicon-updated', handlePageFaviconUpdated)
    webview.addEventListener('did-fail-load', handleDidFailLoad)
    webview.addEventListener('new-window', handleNewWindow)

    return () => {
      webview.removeEventListener('dom-ready', handleDomReady)
      webview.removeEventListener('did-start-loading', handleDidStartLoading)
      webview.removeEventListener('did-stop-loading', handleDidStopLoading)
      webview.removeEventListener('did-navigate', handleDidNavigate)
      webview.removeEventListener('did-navigate-in-page', handleDidNavigateInPage)
      webview.removeEventListener('page-title-updated', handlePageTitleUpdated)
      webview.removeEventListener('page-favicon-updated', handlePageFaviconUpdated)
      webview.removeEventListener('did-fail-load', handleDidFailLoad)
      webview.removeEventListener('new-window', handleNewWindow)
    }
  }, [windowId, tabIndex, updateTab])

  // Handle URL changes from navigation bar
  useEffect(() => {
    const webview = webviewRef.current
    if (!webview || !tab.url) return

    // Only update URL if webview is ready and URL changed
    if (isReady) {
      try {
        const currentUrl = webview.getURL?.() || webview.src
        if (currentUrl !== tab.url) {
          webview.src = tab.url
        }
      } catch {
        // Fallback to direct src comparison
        if (webview.src !== tab.url) {
          webview.src = tab.url
        }
      }
    }
  }, [tab.url, isReady])

  return (
    <div
      className={`${styles.webviewContainer} ${isActive ? styles.active : ''}`}
    >
      <webview
        ref={webviewRef as any}
        id={`webview-${tab.id}`}
        className={`${styles.webview} ${windowCursorMode ? styles.cursorModeActive : ''}`}
        src={tab.url || 'about:blank'}
        partition="persist:webview"
        // @ts-ignore - Electron webview attributes
        allowpopups="true"
        // @ts-ignore - Electron webview attributes
        webpreferences="contextIsolation=yes"
      />
      {tab.isLoading && (
        <div className={styles.loadingBar}>
          <div className={styles.loadingProgress} />
        </div>
      )}
    </div>
  )
}
