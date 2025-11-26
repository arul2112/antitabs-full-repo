import { useState, useEffect, useCallback } from 'react'
import { Search, Calendar, RefreshCw } from 'lucide-react'
import { adminAPI, UserProfile } from '@/lib/adminAPI'
import { format } from 'date-fns'

export function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Extend trial modal state
  const [extendModalOpen, setExtendModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [extensionDays, setExtensionDays] = useState(7)
  const [extensionReason, setExtensionReason] = useState('')
  const [isExtending, setIsExtending] = useState(false)

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await adminAPI.listUsers({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
      })
      setUsers(data.users)
      setTotalPages(data.pagination.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleExtendTrial = async () => {
    if (!selectedUser) return

    try {
      setIsExtending(true)
      await adminAPI.extendTrial(selectedUser.email, extensionDays, extensionReason)
      setExtendModalOpen(false)
      setSelectedUser(null)
      setExtensionDays(7)
      setExtensionReason('')
      loadUsers()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to extend trial')
    } finally {
      setIsExtending(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      trial: 'bg-yellow-500/20 text-yellow-400',
      active: 'bg-green-500/20 text-green-400',
      expired: 'bg-red-500/20 text-red-400',
      cancelled: 'bg-slate-500/20 text-slate-400',
      free: 'bg-blue-500/20 text-blue-400',
    }
    return styles[status] || styles.expired
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Statuses</option>
          <option value="trial">Trial</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button
          onClick={loadUsers}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white hover:bg-slate-700 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Trial End</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Subscription</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Joined</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                      Loading users...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{user.full_name || 'No name'}</p>
                        <p className="text-sm text-slate-400">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(user.subscription_status)}`}>
                        {user.subscription_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {user.trial_ends_at
                        ? format(new Date(user.trial_ends_at), 'MMM d, yyyy')
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {user.subscriptions?.[0]?.plan_type || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setSelectedUser(user)
                          setExtendModalOpen(true)
                        }}
                        className="px-3 py-1 text-sm bg-primary-600 hover:bg-primary-700 rounded flex items-center gap-1"
                      >
                        <Calendar className="w-3 h-3" />
                        Extend Trial
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-slate-700/50 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-slate-600 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 bg-slate-600 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Extend Trial Modal */}
      {extendModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-xl font-semibold mb-4">Extend Trial</h2>
            <p className="text-slate-400 mb-4">
              Extending trial for <strong className="text-white">{selectedUser.email}</strong>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Extension Days
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={extensionDays}
                  onChange={(e) => setExtensionDays(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Reason (optional)
                </label>
                <textarea
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Customer request, support case, etc."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setExtendModalOpen(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleExtendTrial}
                disabled={isExtending}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50"
              >
                {isExtending ? 'Extending...' : `Extend ${extensionDays} Days`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
