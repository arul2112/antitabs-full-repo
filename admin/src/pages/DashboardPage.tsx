import { useState, useEffect } from 'react'
import { Users, CreditCard, TrendingUp, Tag, IndianRupee, UserCheck, RefreshCw, AlertCircle } from 'lucide-react'
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
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 mt-4">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-500/20 rounded-xl">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-400 mb-1">Error Loading Dashboard</h3>
            <p className="text-slate-400 text-sm mb-4">{error}</p>
            <button
              onClick={loadAnalytics}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Provide default values if analytics is null or incomplete
  const safeAnalytics = {
    overview: {
      totalUsers: analytics?.overview?.totalUsers ?? 0,
      trialUsers: analytics?.overview?.trialUsers ?? 0,
      activeSubscribers: analytics?.overview?.activeSubscribers ?? 0,
      newSignupsThisMonth: analytics?.overview?.newSignupsThisMonth ?? 0,
      conversionsThisMonth: analytics?.overview?.conversionsThisMonth ?? 0,
    },
    revenue: {
      mrr: analytics?.revenue?.mrr ?? 0,
      arr: analytics?.revenue?.arr ?? 0,
      monthlySubscribers: analytics?.revenue?.monthlySubscribers ?? 0,
      yearlySubscribers: analytics?.revenue?.yearlySubscribers ?? 0,
    },
    conversion: {
      conversionRate: analytics?.conversion?.conversionRate ?? 0,
      churnRate: analytics?.conversion?.churnRate ?? 0,
      cancelledThisMonth: analytics?.conversion?.cancelledThisMonth ?? 0,
    },
    coupons: {
      uniqueCouponsUsed: analytics?.coupons?.uniqueCouponsUsed ?? 0,
      totalRedemptions: analytics?.coupons?.totalRedemptions ?? 0,
      totalSavings: analytics?.coupons?.totalSavings ?? 0,
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Welcome back!</h2>
          <p className="text-slate-400">Here's what's happening with your business today.</p>
        </div>
        <button
          onClick={loadAnalytics}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700/50 transition-all duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Overview Stats */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-slate-300">Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Users"
            value={safeAnalytics.overview.totalUsers}
            subtitle={`${safeAnalytics.overview.newSignupsThisMonth} new this month`}
            icon={<Users className="w-6 h-6" />}
            variant="primary"
          />
          <StatsCard
            title="Trial Users"
            value={safeAnalytics.overview.trialUsers}
            icon={<UserCheck className="w-6 h-6" />}
            variant="warning"
          />
          <StatsCard
            title="Active Subscribers"
            value={safeAnalytics.overview.activeSubscribers}
            subtitle={`${safeAnalytics.overview.conversionsThisMonth} conversions this month`}
            icon={<CreditCard className="w-6 h-6" />}
            variant="success"
          />
          <StatsCard
            title="Conversion Rate"
            value={`${safeAnalytics.conversion.conversionRate}%`}
            subtitle={`${safeAnalytics.conversion.churnRate}% churn rate`}
            icon={<TrendingUp className="w-6 h-6" />}
            variant="default"
          />
        </div>
      </div>

      {/* Revenue Stats */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-slate-300">Revenue</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-violet-600/20 to-purple-600/20 rounded-2xl p-6 border border-violet-500/30 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-violet-500/20 rounded-xl">
                <IndianRupee className="w-6 h-6 text-violet-400" />
              </div>
              <p className="text-sm font-medium text-slate-400">Monthly Recurring Revenue</p>
            </div>
            <p className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              {formatCurrency(safeAnalytics.revenue.mrr)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-600/20 to-green-600/20 rounded-2xl p-6 border border-emerald-500/30 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-500/20 rounded-xl">
                <IndianRupee className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-sm font-medium text-slate-400">Annual Recurring Revenue</p>
            </div>
            <p className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
              {formatCurrency(safeAnalytics.revenue.arr)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-slate-700/50 rounded-xl">
                <Users className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-400">Subscriber Breakdown</p>
            </div>
            <div className="flex items-end gap-4">
              <div>
                <p className="text-3xl font-bold text-white">{safeAnalytics.revenue.monthlySubscribers}</p>
                <p className="text-sm text-slate-500">Monthly</p>
              </div>
              <div className="text-slate-600 text-2xl font-light">/</div>
              <div>
                <p className="text-3xl font-bold text-white">{safeAnalytics.revenue.yearlySubscribers}</p>
                <p className="text-sm text-slate-500">Yearly</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coupon Stats */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-slate-300">Coupon Performance</h3>
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-violet-500/20 rounded-xl">
              <Tag className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h4 className="font-semibold">Coupons & Discounts</h4>
              <p className="text-sm text-slate-500">Track coupon usage and savings</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
              <p className="text-sm text-slate-400 mb-1">Unique Coupons Used</p>
              <p className="text-2xl font-bold">{safeAnalytics.coupons.uniqueCouponsUsed}</p>
            </div>
            <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
              <p className="text-sm text-slate-400 mb-1">Total Redemptions</p>
              <p className="text-2xl font-bold">{safeAnalytics.coupons.totalRedemptions}</p>
            </div>
            <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
              <p className="text-sm text-slate-400 mb-1">Total Savings Given</p>
              <p className="text-2xl font-bold text-emerald-400">{formatCurrency(safeAnalytics.coupons.totalSavings)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
