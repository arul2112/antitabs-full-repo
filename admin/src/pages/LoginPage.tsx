import { useState, FormEvent } from 'react'
import { LogIn, AlertCircle, ArrowLeft, Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>
  error: string | null
  isLoading: boolean
}

type ViewMode = 'login' | 'forgot-password' | 'enter-otp' | 'new-password' | 'success'

export function LoginPage({ onLogin, error, isLoading }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('login')
  const [resetEmail, setResetEmail] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  // OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)

  // New password state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

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

  // Step 1: Send OTP to email
  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!resetEmail) {
      setLocalError('Please enter your email address')
      return
    }

    try {
      setIsResetting(true)

      // Use signInWithOtp for email OTP (this sends an OTP code, not a link)
      const { error } = await supabase.auth.signInWithOtp({
        email: resetEmail,
        options: {
          shouldCreateUser: false, // Don't create new users, only existing ones
        }
      })

      if (error) {
        if (error.message.includes('User not found') || error.message.includes('Signups not allowed')) {
          setLocalError('No account found with this email address')
        } else {
          setLocalError(error.message)
        }
        return
      }

      // Move to OTP entry screen
      setViewMode('enter-otp')
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setIsResetting(false)
    }
  }

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      setLocalError('Please enter the complete 6-digit code')
      return
    }

    try {
      setIsVerifyingOtp(true)

      const { error } = await supabase.auth.verifyOtp({
        email: resetEmail,
        token: otpCode,
        type: 'email'
      })

      if (error) {
        setLocalError('Invalid or expired code. Please try again.')
        return
      }

      // OTP verified, move to new password screen
      setViewMode('new-password')
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to verify code')
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  // Step 3: Set new password
  const handleSetNewPassword = async (e: FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (newPassword !== confirmPassword) {
      setLocalError('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setLocalError('Password must be at least 8 characters')
      return
    }

    try {
      setIsUpdatingPassword(true)

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        setLocalError(error.message)
        return
      }

      // Sign out so they can log in with new password
      await supabase.auth.signOut()

      // Show success
      setViewMode('success')
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('')
      const newOtp = [...otp]
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit
        }
      })
      setOtp(newOtp)
      // Focus last filled or next empty
      const nextIndex = Math.min(index + digits.length, 5)
      document.getElementById(`otp-${nextIndex}`)?.focus()
      return
    }

    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus()
    }
  }

  const resendOtp = async () => {
    setLocalError(null)
    try {
      setIsResetting(true)
      const { error } = await supabase.auth.signInWithOtp({
        email: resetEmail,
        options: {
          shouldCreateUser: false,
        }
      })

      if (error) {
        setLocalError(error.message)
      } else {
        setOtp(['', '', '', '', '', ''])
        setLocalError(null)
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to resend code')
    } finally {
      setIsResetting(false)
    }
  }

  const displayError = error || localError

  // Success View
  if (viewMode === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/20 mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Password Updated!</h1>
            <p className="text-slate-400 mt-2">Your password has been successfully changed</p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-800 shadow-xl">
            <p className="text-slate-300 text-center mb-6">
              You can now sign in with your new password.
            </p>

            <button
              onClick={() => {
                setViewMode('login')
                setResetEmail('')
                setOtp(['', '', '', '', '', ''])
                setNewPassword('')
                setConfirmPassword('')
              }}
              className="w-full px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-violet-500/25"
            >
              <LogIn className="w-5 h-5" />
              Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  // New Password View (Step 3)
  if (viewMode === 'new-password') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Set New Password</h1>
            <p className="text-slate-400 mt-2">Create a strong password for your account</p>
          </div>

          <form onSubmit={handleSetNewPassword} className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-800 shadow-xl">
            {localError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{localError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-slate-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter new password"
                    disabled={isUpdatingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                    placeholder="Confirm new password"
                    disabled={isUpdatingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Password requirements */}
              <div className="p-4 bg-slate-800/30 rounded-xl">
                <p className="text-xs font-medium text-slate-400 mb-2">Password must contain:</p>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li className={newPassword.length >= 8 ? 'text-green-400' : ''}>
                    {newPassword.length >= 8 ? '✓' : '○'} At least 8 characters
                  </li>
                  <li className={newPassword === confirmPassword && newPassword.length > 0 ? 'text-green-400' : ''}>
                    {newPassword === confirmPassword && newPassword.length > 0 ? '✓' : '○'} Passwords match
                  </li>
                </ul>
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdatingPassword || !newPassword || !confirmPassword}
              className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25"
            >
              {isUpdatingPassword ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Update Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Enter OTP View (Step 2)
  if (viewMode === 'enter-otp') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Enter Code</h1>
            <p className="text-slate-400 mt-2">
              We sent a 6-digit code to<br />
              <span className="text-white font-medium">{resetEmail}</span>
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-800 shadow-xl">
            {localError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{localError}</p>
              </div>
            )}

            {/* OTP Input */}
            <div className="flex justify-center gap-3 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                  disabled={isVerifyingOtp}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isVerifyingOtp || otp.join('').length !== 6}
              className="w-full px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25"
            >
              {isVerifyingOtp ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Verify Code'
              )}
            </button>

            <div className="mt-4 text-center">
              <p className="text-sm text-slate-500">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={isResetting}
                  className="text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50"
                >
                  {isResetting ? 'Sending...' : 'Resend'}
                </button>
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setViewMode('forgot-password')
                setOtp(['', '', '', '', '', ''])
                setLocalError(null)
              }}
              className="w-full mt-3 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 text-slate-300 font-medium rounded-xl flex items-center justify-center gap-2 transition-all duration-200 border border-slate-700"
            >
              <ArrowLeft className="w-5 h-5" />
              Change Email
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Forgot Password View (Step 1)
  if (viewMode === 'forgot-password') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 mb-4">
              <span className="text-2xl font-bold text-white">A</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Reset Password</h1>
            <p className="text-slate-400 mt-2">Enter your email to receive a verification code</p>
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
                  Send Code
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
