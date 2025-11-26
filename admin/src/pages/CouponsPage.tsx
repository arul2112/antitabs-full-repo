import { useState, useEffect } from 'react'
import { Plus, Tag, ToggleLeft, ToggleRight } from 'lucide-react'
import { adminAPI, CouponCode } from '@/lib/adminAPI'
import { format } from 'date-fns'

export function CouponsPage() {
  const [coupons, setCoupons] = useState<CouponCode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // New coupon form state
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed_amount' | 'trial_extension',
    discount_percent: 10,
    discount_amount: 5000, // in paise (50 INR)
    trial_extension_days: 7,
    max_uses: '',
    max_uses_per_user: 1,
    valid_until: '',
    sync_to_razorpay: true,
  })

  useEffect(() => {
    loadCoupons()
  }, [])

  const loadCoupons = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await adminAPI.listCoupons()
      setCoupons(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coupons')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleCoupon = async (coupon: CouponCode) => {
    try {
      await adminAPI.toggleCoupon(coupon.id, !coupon.is_active)
      setCoupons(coupons.map(c =>
        c.id === coupon.id ? { ...c, is_active: !c.is_active } : c
      ))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle coupon')
    }
  }

  const handleCreateCoupon = async () => {
    try {
      setIsCreating(true)
      await adminAPI.createCoupon({
        code: newCoupon.code,
        description: newCoupon.description || undefined,
        discount_type: newCoupon.discount_type,
        discount_percent: newCoupon.discount_type === 'percentage' ? newCoupon.discount_percent : undefined,
        discount_amount: newCoupon.discount_type === 'fixed_amount' ? newCoupon.discount_amount : undefined,
        trial_extension_days: newCoupon.discount_type === 'trial_extension' ? newCoupon.trial_extension_days : undefined,
        max_uses: newCoupon.max_uses ? Number(newCoupon.max_uses) : undefined,
        max_uses_per_user: newCoupon.max_uses_per_user,
        valid_until: newCoupon.valid_until || undefined,
        sync_to_razorpay: newCoupon.sync_to_razorpay && newCoupon.discount_type !== 'trial_extension',
      })
      setCreateModalOpen(false)
      setNewCoupon({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_percent: 10,
        discount_amount: 5000,
        trial_extension_days: 7,
        max_uses: '',
        max_uses_per_user: 1,
        valid_until: '',
        sync_to_razorpay: true,
      })
      loadCoupons()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create coupon')
    } finally {
      setIsCreating(false)
    }
  }

  const getDiscountDisplay = (coupon: CouponCode) => {
    switch (coupon.discount_type) {
      case 'percentage':
        return `${coupon.discount_percent}% OFF`
      case 'fixed_amount':
        return `₹${(coupon.discount_amount || 0) / 100} OFF`
      case 'trial_extension':
        return `+${coupon.trial_extension_days} days trial`
      default:
        return '-'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Tag className="w-5 h-5 text-primary-400" />
          Coupon Codes
        </h2>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Coupon
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Code</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Discount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Usage</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Valid Until</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                      Loading coupons...
                    </div>
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No coupons created yet
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-mono font-bold">{coupon.code}</p>
                        {coupon.description && (
                          <p className="text-sm text-slate-400">{coupon.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-primary-600/20 text-primary-400 rounded text-sm">
                        {getDiscountDisplay(coupon)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {coupon.current_uses} / {coupon.max_uses || '∞'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {coupon.valid_until
                        ? format(new Date(coupon.valid_until), 'MMM d, yyyy')
                        : 'No expiry'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        coupon.is_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {coupon.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleCoupon(coupon)}
                        className="p-2 hover:bg-slate-700 rounded"
                        title={coupon.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {coupon.is_active ? (
                          <ToggleRight className="w-5 h-5 text-green-400" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Coupon Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg border border-slate-700 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Create New Coupon</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="SUMMER2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newCoupon.description}
                  onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Summer sale discount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Discount Type *
                </label>
                <select
                  value={newCoupon.discount_type}
                  onChange={(e) => setNewCoupon({ ...newCoupon, discount_type: e.target.value as 'percentage' | 'fixed_amount' | 'trial_extension' })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="percentage">Percentage Discount</option>
                  <option value="fixed_amount">Fixed Amount</option>
                  <option value="trial_extension">Trial Extension</option>
                </select>
              </div>

              {newCoupon.discount_type === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Discount Percentage (%)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={newCoupon.discount_percent}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discount_percent: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}

              {newCoupon.discount_type === 'fixed_amount' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Discount Amount (INR)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newCoupon.discount_amount / 100}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discount_amount: Number(e.target.value) * 100 })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}

              {newCoupon.discount_type === 'trial_extension' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Extension Days
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={newCoupon.trial_extension_days}
                    onChange={(e) => setNewCoupon({ ...newCoupon, trial_extension_days: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Max Uses (leave empty for unlimited)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newCoupon.max_uses}
                    onChange={(e) => setNewCoupon({ ...newCoupon, max_uses: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Unlimited"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Max Uses Per User
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newCoupon.max_uses_per_user}
                    onChange={(e) => setNewCoupon({ ...newCoupon, max_uses_per_user: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Valid Until (leave empty for no expiry)
                </label>
                <input
                  type="date"
                  value={newCoupon.valid_until}
                  onChange={(e) => setNewCoupon({ ...newCoupon, valid_until: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {newCoupon.discount_type !== 'trial_extension' && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sync_razorpay"
                    checked={newCoupon.sync_to_razorpay}
                    onChange={(e) => setNewCoupon({ ...newCoupon, sync_to_razorpay: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <label htmlFor="sync_razorpay" className="text-sm text-slate-300">
                    Sync to Razorpay
                  </label>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setCreateModalOpen(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCoupon}
                disabled={isCreating || !newCoupon.code}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
