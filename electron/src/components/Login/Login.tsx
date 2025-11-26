import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import styles from './Login.module.css'

interface LoginProps {
  onLoginSuccess?: () => void
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { signIn } = useAuth()

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim() || !password) {
      setError('Please enter both email and password')
      return
    }

    setIsLoading(true)
    setError(null)

    const result = await signIn(email, password)

    if (result.success) {
      onLoginSuccess?.()
    } else {
      setError(result.error || 'Sign in failed')
      setIsLoading(false)
    }
  }, [email, password, signIn, onLoginSuccess])

  const handleSignupClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()

    // Try to open in external browser via Electron
    if (window.electronAPI?.openExternal) {
      try {
        await window.electronAPI.openExternal('https://antitabs.in/pricing')
      } catch (error) {
        console.error('Failed to open external link:', error)
        window.open('https://antitabs.in/pricing', '_blank')
      }
    } else {
      window.open('https://antitabs.in/pricing', '_blank')
    }
  }, [])

  return (
    <div className={styles.loadingScreen}>
      <div className={styles.loginContainer}>
        <div className={styles.loginBox}>
          <div className={styles.loginHeader}>
            <div className={styles.loginLogo}>A</div>
            <h1 className={styles.loginTitle}>Welcome to AntiTabs</h1>
            <p className={styles.loginSubtitle}>Sign in to continue to your workspace</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.loginForm}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.formLabel}>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className={styles.formInput}
                placeholder="you@example.com"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.formLabel}>
                Password
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className={styles.formInput}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`${styles.loginButton} ${isLoading ? styles.loading : ''}`}
              disabled={isLoading}
            >
              Sign In
            </button>

            {error && (
              <div className={styles.loginError}>
                {error}
              </div>
            )}
          </form>

          <div className={styles.loginFooter}>
            <p className={styles.loginFooterText}>
              Don't have an account?{' '}
              <a
                href="#"
                className={styles.loginFooterLink}
                onClick={handleSignupClick}
              >
                Sign up at antitabs.in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
