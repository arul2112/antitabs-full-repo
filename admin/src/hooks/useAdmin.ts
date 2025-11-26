import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { adminAPI, AdminUser } from '@/lib/adminAPI'

interface UseAdminReturn {
  admin: AdminUser | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshAdmin: () => Promise<void>
}

export function useAdmin(): UseAdminReturn {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const verifyAndSetAdmin = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // First check if there's an active session
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        // No session, just show login page
        setAdmin(null)
        setIsLoading(false)
        return
      }

      // Session exists, verify admin status
      const adminData = await adminAPI.verifyAdmin()
      setAdmin(adminData)
    } catch (err) {
      setAdmin(null)
      // Don't set error for unauthenticated state
      if (err instanceof Error && !err.message.includes('Not authenticated')) {
        console.error('Admin verification error:', err)
        setError(err.message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Check initial auth state
    verifyAndSetAdmin()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_IN') {
          await verifyAndSetAdmin()
        } else if (event === 'SIGNED_OUT') {
          setAdmin(null)
          setIsLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [verifyAndSetAdmin])

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      // Verify admin status
      await verifyAndSetAdmin()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      await supabase.auth.signOut()
      setAdmin(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    admin,
    isLoading,
    error,
    isAuthenticated: !!admin,
    login,
    logout,
    refreshAdmin: verifyAndSetAdmin,
  }
}
