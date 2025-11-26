import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Tag,
  BarChart3,
  LogOut,
  Menu,
  X,
  Settings
} from 'lucide-react'
import { useState } from 'react'
import { AdminUser } from '@/lib/adminAPI'

interface AdminLayoutProps {
  children: ReactNode
  admin: AdminUser
  onLogout: () => void
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/users', label: 'Users', icon: Users },
  { path: '/coupons', label: 'Coupons', icon: Tag },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export function AdminLayout({ children, admin, onLogout }: AdminLayoutProps) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/10 to-slate-950 text-white">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 bg-slate-900/95 backdrop-blur-md border-r border-slate-800/50 transform transition-transform duration-300 ease-out
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo Section */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <span className="text-lg font-bold text-white">A</span>
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">AntiTabs</span>
              <span className="text-xs text-slate-500 block">Admin Panel</span>
            </div>
          </div>
          <button
            className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-2">Menu</p>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive
                    ? 'bg-gradient-to-r from-violet-600/20 to-purple-600/20 text-violet-300 border border-violet-500/30 shadow-lg shadow-violet-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-violet-400' : ''}`} />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Admin info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800/50">
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                <span className="text-sm font-bold">{admin.full_name?.charAt(0) || 'A'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{admin.full_name}</p>
                <p className="text-xs text-violet-400 capitalize">{admin.role}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full px-4 py-2 bg-slate-700/50 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm text-slate-400"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-72">
        {/* Top header */}
        <header className="sticky top-0 z-30 h-20 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50 flex items-center px-6">
          <button
            className="lg:hidden p-2 hover:bg-slate-800 rounded-lg mr-4 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6 text-slate-400" />
          </button>

          <div className="flex-1">
            <h1 className="text-xl font-semibold">
              {navItems.find(item => item.path === location.pathname)?.label || 'Admin Panel'}
            </h1>
            <p className="text-sm text-slate-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
