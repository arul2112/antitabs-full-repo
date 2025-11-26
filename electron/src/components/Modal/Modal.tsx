import { useState, useCallback, useEffect, useRef, createContext, useContext, type ReactNode } from 'react'
import styles from './Modal.module.css'

// Types
interface PromptModalState {
  type: 'prompt'
  title: string
  defaultValue: string
  resolve: (value: string | null) => void
}

interface ConfirmModalState {
  type: 'confirm'
  title: string
  message: string
  resolve: (value: boolean) => void
}

interface AlertModalState {
  type: 'alert'
  title: string
  message: string
  resolve: () => void
}

type ModalState = PromptModalState | ConfirmModalState | AlertModalState | null

// Context
interface ModalContextType {
  prompt: (title: string, defaultValue?: string) => Promise<string | null>
  confirm: (title: string, message: string) => Promise<boolean>
  alert: (title: string, message: string) => Promise<void>
}

const ModalContext = createContext<ModalContextType | null>(null)

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}

// Provider Component
export function ModalProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<ModalState>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const prompt = useCallback((title: string, defaultValue = ''): Promise<string | null> => {
    return new Promise((resolve) => {
      setModalState({
        type: 'prompt',
        title,
        defaultValue,
        resolve
      })
    })
  }, [])

  const confirm = useCallback((title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({
        type: 'confirm',
        title,
        message,
        resolve
      })
    })
  }, [])

  const alert = useCallback((title: string, message: string): Promise<void> => {
    return new Promise((resolve) => {
      setModalState({
        type: 'alert',
        title,
        message,
        resolve
      })
    })
  }, [])

  // Focus input when prompt modal opens
  useEffect(() => {
    if (modalState?.type === 'prompt' && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 50)
    }
  }, [modalState])

  const handleClose = useCallback(() => {
    if (!modalState) return

    if (modalState.type === 'prompt') {
      modalState.resolve(null)
    } else if (modalState.type === 'confirm') {
      modalState.resolve(false)
    } else if (modalState.type === 'alert') {
      modalState.resolve()
    }
    setModalState(null)
  }, [modalState])

  const handleOk = useCallback(() => {
    if (!modalState) return

    if (modalState.type === 'prompt') {
      const value = inputRef.current?.value || ''
      modalState.resolve(value)
    } else if (modalState.type === 'confirm') {
      modalState.resolve(true)
    } else if (modalState.type === 'alert') {
      modalState.resolve()
    }
    setModalState(null)
  }, [modalState])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleOk()
    } else if (e.key === 'Escape') {
      handleClose()
    }
  }, [handleOk, handleClose])

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }, [handleClose])

  return (
    <ModalContext.Provider value={{ prompt, confirm, alert }}>
      {children}

      {/* Modal UI */}
      {modalState && (
        <div className={styles.modalOverlay} onClick={handleOverlayClick}>
          <div className={styles.modalContent} onKeyDown={handleKeyDown}>
            <h3 className={styles.modalTitle}>{modalState.title}</h3>

            {modalState.type === 'prompt' && (
              <input
                ref={inputRef}
                type="text"
                className={styles.modalInput}
                defaultValue={modalState.defaultValue}
              />
            )}

            {(modalState.type === 'confirm' || modalState.type === 'alert') && (
              <p className={styles.modalMessage}>{modalState.message}</p>
            )}

            <div className={styles.modalButtons}>
              {modalState.type !== 'alert' && (
                <button
                  className={`${styles.modalBtn} ${styles.cancel}`}
                  onClick={handleClose}
                >
                  Cancel
                </button>
              )}
              <button
                className={`${styles.modalBtn} ${styles.ok}`}
                onClick={handleOk}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  )
}

export default ModalProvider
