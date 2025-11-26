import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase } from '@/utils/supabaseClient'
import type { User, Session } from '@supabase/supabase-js'

const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days
const ACCESS_CACHE_KEY = 'access_cache'

export interface UserProfile {
  id: string
  email: string
  subscription_status: 'trial' | 'pro_monthly' | 'pro_yearly' | 'free' | null
  trial_end: string | null
}

interface AuthState {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  hasAccess: boolean
  error: string | null
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  checkAccess: () => Promise<boolean>
  getSubscriptionLabel: () => string
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    hasAccess: false,
    error: null
  })

  // Check cached access for offline use
  const getCachedAccess = useCallback((userId?: string): boolean => {
    try {
      const cache = localStorage.getItem(ACCESS_CACHE_KEY)
      if (!cache) return false

      const { timestamp, userId: cachedUserId } = JSON.parse(cache)
      const now = Date.now()

      if (now - timestamp < CACHE_DURATION && (!userId || cachedUserId === userId)) {
        return true
      }

      localStorage.removeItem(ACCESS_CACHE_KEY)
      return false
    } catch {
      return false
    }
  }, [])

  // Cache access for offline use
  const cacheAccess = useCallback((userId: string) => {
    localStorage.setItem(ACCESS_CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      userId
    }))
  }, [])

  // Check subscription access
  const checkAccess = useCallback(async (): Promise<boolean> => {
    if (!state.user) return false

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', state.user.id)
        .single()

      if (error || !profile) {
        console.error('Profile fetch error:', error)
        return getCachedAccess(state.user.id)
      }

      setState(prev => ({ ...prev, profile }))

      const status = profile.subscription_status
      if (status === 'trial' || status === 'pro_monthly' || status === 'pro_yearly') {
        cacheAccess(state.user.id)
        return true
      }

      return getCachedAccess(state.user.id)
    } catch (error) {
      console.error('Access check error:', error)
      return getCachedAccess(state.user.id)
    }
  }, [state.user, getCachedAccess, cacheAccess])

  // Sign in
  const signIn = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })

      if (error) {
        setState(prev => ({ ...prev, isLoading: false, error: error.message }))
        return { success: false, error: error.message }
      }

      const user = data.user
      setState(prev => ({ ...prev, user, session: data.session }))

      // Check subscription access
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        await supabase.auth.signOut()
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Profile not found. Please contact support.'
        }))
        return { success: false, error: 'Profile not found' }
      }

      const status = profile.subscription_status
      const hasAccess = status === 'trial' || status === 'pro_monthly' || status === 'pro_yearly'

      if (!hasAccess) {
        await supabase.auth.signOut()
        setState(prev => ({
          ...prev,
          user: null,
          session: null,
          profile: null,
          isLoading: false,
          isAuthenticated: false,
          hasAccess: false,
          error: 'No active subscription. Please subscribe at antitabs.in/pricing'
        }))
        return { success: false, error: 'No active subscription' }
      }

      cacheAccess(user.id)
      setState(prev => ({
        ...prev,
        profile,
        isLoading: false,
        isAuthenticated: true,
        hasAccess: true,
        error: null
      }))

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed'
      setState(prev => ({ ...prev, isLoading: false, error: message }))
      return { success: false, error: message }
    }
  }, [cacheAccess])

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      localStorage.removeItem(ACCESS_CACHE_KEY)
      setState({
        user: null,
        profile: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        hasAccess: false,
        error: null
      })
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }, [])

  // Get subscription label
  const getSubscriptionLabel = useCallback((): string => {
    if (!state.profile) return 'Unknown'
    const status = state.profile.subscription_status
    if (status === 'pro_monthly') return 'Pro Monthly'
    if (status === 'pro_yearly') return 'Pro Yearly'
    if (status === 'trial') return 'Trial'
    return 'Free'
  }, [state.profile])

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          setState(prev => ({
            ...prev,
            user: session.user,
            session
          }))

          // Check access
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profile) {
            const status = profile.subscription_status
            const hasAccess = status === 'trial' || status === 'pro_monthly' || status === 'pro_yearly'

            if (hasAccess) {
              cacheAccess(session.user.id)
            }

            setState(prev => ({
              ...prev,
              profile,
              isLoading: false,
              isAuthenticated: true,
              hasAccess: hasAccess || getCachedAccess(session.user.id)
            }))
          } else {
            setState(prev => ({
              ...prev,
              isLoading: false,
              isAuthenticated: true,
              hasAccess: getCachedAccess(session.user.id)
            }))
          }
        } else {
          setState(prev => ({ ...prev, isLoading: false }))
        }
      } catch (error) {
        console.error('Auth init error:', error)
        setState(prev => ({ ...prev, isLoading: false }))
      }
    }

    initAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setState(prev => ({
          ...prev,
          user: session.user,
          session,
          isAuthenticated: true
        }))
      } else if (event === 'SIGNED_OUT') {
        setState({
          user: null,
          profile: null,
          session: null,
          isLoading: false,
          isAuthenticated: false,
          hasAccess: false,
          error: null
        })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [cacheAccess, getCachedAccess])

  const value: AuthContextValue = {
    ...state,
    signIn,
    signOut,
    checkAccess,
    getSubscriptionLabel
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export { AuthContext }
