import { useEffect, useCallback } from 'react'
import styles from './ContextMenu.module.css'

interface ContextMenuProps {
  isOpen: boolean
  x: number
  y: number
  onClose: () => void
  onNewWindow: () => void
  onCascade: () => void
  onTile: () => void
}

export default function ContextMenu({
  isOpen,
  x,
  y,
  onClose,
  onNewWindow,
  onCascade,
  onTile
}: ContextMenuProps) {
  // Close on click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = () => {
      onClose()
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleAction = useCallback((action: () => void) => {
    action()
    onClose()
  }, [onClose])

  if (!isOpen) return null

  // Adjust position to stay within viewport
  const menuWidth = 180
  const menuHeight = 150
  const adjustedX = x + menuWidth > window.innerWidth ? x - menuWidth : x
  const adjustedY = y + menuHeight > window.innerHeight ? y - menuHeight : y

  return (
    <div
      className={styles.contextMenu}
      style={{ left: adjustedX, top: adjustedY }}
      onClick={e => e.stopPropagation()}
    >
      <div
        className={styles.contextMenuItem}
        onClick={() => handleAction(onNewWindow)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
        New Window
      </div>
      <div className={styles.contextMenuSeparator} />
      <div
        className={styles.contextMenuItem}
        onClick={() => handleAction(onCascade)}
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="2" width="12" height="12" rx="2"/>
          <rect x="6" y="6" width="12" height="12" rx="2"/>
        </svg>
        Cascade Windows
      </div>
      <div
        className={styles.contextMenuItem}
        onClick={() => handleAction(onTile)}
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="2" width="6" height="6" rx="1"/>
          <rect x="12" y="2" width="6" height="6" rx="1"/>
          <rect x="2" y="12" width="6" height="6" rx="1"/>
          <rect x="12" y="12" width="6" height="6" rx="1"/>
        </svg>
        Tile Windows
      </div>
    </div>
  )
}
