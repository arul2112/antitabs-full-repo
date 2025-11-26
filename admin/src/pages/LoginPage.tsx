import { useState, FormEvent } from 'react'
import { LogIn, AlertCircle, ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>
  error: string | null
  isLoading: boolean
}

type ViewMode = 'login' | 'forgot-password' | 'reset-sent'

export function LoginPage({ onLogin, error, isLoading }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('login')
  const [resetEmail, setResetEmail] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!email || !password) {
      setLocalError('Please enter both email and password')
      return
    }

    try {
      await onLogin(email, password)
    } catch {
      // Error is handled by the parent component
    }
  }

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!resetEmail) {
      setLocalError('Please enter your email address')
      return
    }

    try {
      setIsResetting(true)
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setLocalError(error.message)
        return
      }

      setViewMode('reset-sent')
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      setIsResetting(false)
    }
  }

  const displayError = error || localError

  // Reset Password Sent View
  if (viewMode === 'reset-sent') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 mb-4">
              <span className="text-2xl font-bold text-white">A</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Check Your Email</h1>
            <p className="text-slate-400 mt-2">Password reset instructions sent</p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-800 shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-slate-300 mb-4">
                We've sent password reset instructions to:
              </p>
              <p className="font-medium text-white mb-6">{resetEmail}</p>
              <p className="text-sm text-slate-400 mb-6">
                Check your inbox and follow the link to reset your password. The link will expire in 1 hour.
              </p>
            </div>

            <button
              onClick={() => {
                setViewMode('login')
                setResetEmail('')
              }}
              className="w-full px-4 py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Forgot Password View
  if (viewMode === 'forgot-password') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 mb-4">
              <span className="text-2xl font-bold text-white">A</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Reset Password</h1>
            <p className="text-slate-400 mt-2">Enter your email to receive reset instructions</p>
          </div>

          <form onSubmit={handleForgotPassword} className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-800 shadow-xl">
            {localError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{localError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                    placeholder="admin@example.com"
                    disabled={isResetting}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isResetting}
              className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25"
            >
              {isResetting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Send Reset Link
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('login')
                setLocalError(null)
              }}
              className="w-full mt-3 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 text-slate-300 font-medium rounded-xl flex items-center justify-center gap-2 transition-all duration-200 border border-slate-700"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Login View
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 mb-4 shadow-lg shadow-violet-500/30">
            <span className="text-2xl font-bold text-white">A</span>
          </div>
          <h1 className="text-3xl font-bold text-white">AntiTabs Admin</h1>
          <p className="text-slate-400 mt-2">Sign in to access the admin panel</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-800 shadow-xl">
          {displayError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{displayError}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                  placeholder="admin@example.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('forgot-password')
                    setLocalError(null)
                    setResetEmail(email)
                  }}
                  className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign In
              </>
            )}
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-6">
          Only authorized administrators can access this panel
        </p>
      </div>
    </div>
  )
}
