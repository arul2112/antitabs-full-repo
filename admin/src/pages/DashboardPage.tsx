import { useState, useEffect } from 'react'
import { Users, CreditCard, TrendingUp, Tag, IndianRupee, UserCheck } from 'lucide-react'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { adminAPI, AnalyticsData } from '@/lib/adminAPI'

export function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await adminAPI.getAnalytics()
      setAnalytics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
        <p className="text-red-400">{error}</p>
        <button
          onClick={loadAnalytics}
          className="mt-2 text-sm text-primary-400 hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!analytics) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Users"
          value={analytics.overview.totalUsers}
          subtitle={`${analytics.overview.newSignupsThisMonth} new this month`}
          icon={<Users className="w-6 h-6" />}
        />
        <StatsCard
          title="Trial Users"
          value={analytics.overview.trialUsers}
          icon={<UserCheck className="w-6 h-6" />}
        />
        <StatsCard
          title="Active Subscribers"
          value={analytics.overview.activeSubscribers}
          subtitle={`${analytics.overview.conversionsThisMonth} conversions this month`}
          icon={<CreditCard className="w-6 h-6" />}
        />
        <StatsCard
          title="Conversion Rate"
          value={`${analytics.conversion.conversionRate}%`}
          subtitle={`${analytics.conversion.churnRate}% churn rate`}
          icon={<TrendingUp className="w-6 h-6" />}
        />
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard
          title="Monthly Recurring Revenue"
          value={formatCurrency(analytics.revenue.mrr)}
          icon={<IndianRupee className="w-6 h-6" />}
        />
        <StatsCard
          title="Annual Recurring Revenue"
          value={formatCurrency(analytics.revenue.arr)}
          icon={<IndianRupee className="w-6 h-6" />}
        />
        <StatsCard
          title="Subscriber Breakdown"
          value={`${analytics.revenue.monthlySubscribers} / ${analytics.revenue.yearlySubscribers}`}
          subtitle="Monthly / Yearly"
          icon={<Users className="w-6 h-6" />}
        />
      </div>

      {/* Coupon Stats */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Tag className="w-5 h-5 text-primary-400" />
          Coupon Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-sm text-slate-400">Unique Coupons Used</p>
            <p className="text-2xl font-bold">{analytics.coupons.uniqueCouponsUsed}</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-sm text-slate-400">Total Redemptions</p>
            <p className="text-2xl font-bold">{analytics.coupons.totalRedemptions}</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-sm text-slate-400">Total Savings Given</p>
            <p className="text-2xl font-bold">{formatCurrency(analytics.coupons.totalSavings)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
