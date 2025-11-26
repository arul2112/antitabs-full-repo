import { Routes, Route, Navigate } from 'react-router-dom'
import { useAdmin } from '@/hooks/useAdmin'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { UsersPage } from '@/pages/UsersPage'
import { CouponsPage } from '@/pages/CouponsPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'

function App() {
  const { admin, isLoading, error, isAuthenticated, login, logout } = useAdmin()

  // Show loading state
  if (isLoading && !admin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={login} error={error} isLoading={isLoading} />
  }

  // Show admin layout with routes
  return (
    <AdminLayout admin={admin!} onLogout={logout}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/coupons" element={<CouponsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AdminLayout>
  )
}

export default App
