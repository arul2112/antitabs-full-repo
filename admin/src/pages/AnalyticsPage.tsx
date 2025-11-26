import { useState, useEffect } from 'react'
import { BarChart3, RefreshCw, AlertCircle, TrendingUp, TrendingDown, Users } from 'lucide-react'
import { adminAPI, AnalyticsData } from '@/lib/adminAPI'

export function AnalyticsPage() {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 mt-4">Loading analytics...</p>
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
            <h3 className="font-semibold text-red-400 mb-1">Error Loading Analytics</h3>
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

  // Provide default values
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

  // Calculate percentages for funnel
  const trialPercentage = safeAnalytics.overview.totalUsers > 0
    ? (safeAnalytics.overview.trialUsers / safeAnalytics.overview.totalUsers) * 100
    : 0
  const subscriberPercentage = safeAnalytics.overview.totalUsers > 0
    ? (safeAnalytics.overview.activeSubscribers / safeAnalytics.overview.totalUsers) * 100
    : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-violet-500/20 rounded-xl">
            <BarChart3 className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Detailed Analytics</h2>
            <p className="text-slate-400">In-depth insights into your business metrics</p>
          </div>
        </div>
        <button
          onClick={loadAnalytics}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700/50 transition-all duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* User Funnel */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-violet-500/20 rounded-lg">
            <Users className="w-5 h-5 text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold">User Funnel</h3>
        </div>

        <div className="space-y-6">
          {/* Total Users */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-slate-400">Total Users</span>
              <span className="font-semibold">{safeAnalytics.overview.totalUsers}</span>
            </div>
            <div className="h-4 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-purple-600 rounded-full transition-all duration-500"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Trial Users */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-slate-400">Trial Users</span>
              <span className="font-semibold">{safeAnalytics.overview.trialUsers} ({trialPercentage.toFixed(1)}%)</span>
            </div>
            <div className="h-4 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full transition-all duration-500"
                style={{ width: `${trialPercentage}%` }}
              />
            </div>
          </div>

          {/* Active Subscribers */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-slate-400">Active Subscribers</span>
              <span className="font-semibold">{safeAnalytics.overview.activeSubscribers} ({subscriberPercentage.toFixed(1)}%)</span>
            </div>
            <div className="h-4 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-500"
                style={{ width: `${subscriberPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm">
        <h3 className="text-lg font-semibold mb-6">Revenue Breakdown</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="text-center p-6 bg-gradient-to-br from-violet-600/10 to-purple-600/10 rounded-xl border border-violet-500/20">
            <p className="text-sm text-slate-400 mb-2">Monthly Recurring Revenue</p>
            <p className="text-5xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              {formatCurrency(safeAnalytics.revenue.mrr)}
            </p>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-emerald-600/10 to-green-600/10 rounded-xl border border-emerald-500/20">
            <p className="text-sm text-slate-400 mb-2">Annual Recurring Revenue</p>
            <p className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
              {formatCurrency(safeAnalytics.revenue.arr)}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-700/50 pt-6">
          <h4 className="text-sm font-medium text-slate-400 mb-4">Subscriber Distribution</h4>
          <div className="flex gap-8">
            <div className="flex-1 bg-slate-700/30 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-violet-400">{safeAnalytics.revenue.monthlySubscribers}</p>
              <p className="text-sm text-slate-400 mt-1">Monthly ({formatCurrency(199)}/mo)</p>
            </div>
            <div className="flex-1 bg-slate-700/30 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-emerald-400">{safeAnalytics.revenue.yearlySubscribers}</p>
              <p className="text-sm text-slate-400 mt-1">Yearly ({formatCurrency(1999)}/yr)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Metrics */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm">
        <h3 className="text-lg font-semibold mb-6">Conversion Metrics</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-emerald-600/10 to-green-600/10 rounded-xl p-6 text-center border border-emerald-500/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-slate-400">Conversion Rate</span>
            </div>
            <p className="text-4xl font-bold text-emerald-400">{safeAnalytics.conversion.conversionRate}%</p>
          </div>

          <div className="bg-gradient-to-br from-red-600/10 to-rose-600/10 rounded-xl p-6 text-center border border-red-500/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-red-400" />
              <span className="text-sm text-slate-400">Churn Rate</span>
            </div>
            <p className="text-4xl font-bold text-red-400">{safeAnalytics.conversion.churnRate}%</p>
          </div>

          <div className="bg-slate-700/30 rounded-xl p-6 text-center border border-slate-600/30">
            <span className="text-sm text-slate-400 block mb-2">Cancelled This Month</span>
            <p className="text-4xl font-bold text-slate-300">{safeAnalytics.conversion.cancelledThisMonth}</p>
          </div>
        </div>
      </div>

      {/* This Month Stats */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm">
        <h3 className="text-lg font-semibold mb-6">This Month's Performance</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-violet-600/10 to-purple-600/10 rounded-xl p-6 border border-violet-500/20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-400">New Signups</span>
              <div className="p-2 bg-violet-500/20 rounded-lg">
                <Users className="w-4 h-4 text-violet-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-violet-400">{safeAnalytics.overview.newSignupsThisMonth}</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-600/10 to-green-600/10 rounded-xl p-6 border border-emerald-500/20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-400">New Conversions</span>
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-emerald-400">{safeAnalytics.overview.conversionsThisMonth}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
