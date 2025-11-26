import { useState, useEffect } from 'react'
import { BarChart3 } from 'lucide-react'
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
        <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
        <p className="text-red-400">{error}</p>
        <button onClick={loadAnalytics} className="mt-2 text-sm text-primary-400 hover:underline">
          Try again
        </button>
      </div>
    )
  }

  if (!analytics) return null

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary-400" />
        Detailed Analytics
      </h2>

      {/* User Funnel */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-4">User Funnel</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-slate-400">Total Users</span>
                <span className="font-semibold">{analytics.overview.totalUsers}</span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full">
                <div className="h-full bg-primary-500 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-slate-400">Trial Users</span>
                <span className="font-semibold">{analytics.overview.trialUsers}</span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full">
                <div
                  className="h-full bg-yellow-500 rounded-full"
                  style={{
                    width: `${(analytics.overview.trialUsers / analytics.overview.totalUsers) * 100}%`
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-slate-400">Active Subscribers</span>
                <span className="font-semibold">{analytics.overview.activeSubscribers}</span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{
                    width: `${(analytics.overview.activeSubscribers / analytics.overview.totalUsers) * 100}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-4">Revenue Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-slate-400 mb-2">Monthly Recurring Revenue</p>
            <p className="text-4xl font-bold text-primary-400">{formatCurrency(analytics.revenue.mrr)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-2">Annual Recurring Revenue</p>
            <p className="text-4xl font-bold text-green-400">{formatCurrency(analytics.revenue.arr)}</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-700">
          <h4 className="text-sm font-medium text-slate-300 mb-4">Subscriber Distribution</h4>
          <div className="flex gap-8">
            <div>
              <p className="text-2xl font-bold">{analytics.revenue.monthlySubscribers}</p>
              <p className="text-sm text-slate-400">Monthly ({formatCurrency(199)}/mo)</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{analytics.revenue.yearlySubscribers}</p>
              <p className="text-sm text-slate-400">Yearly ({formatCurrency(1999)}/yr)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Metrics */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-4">Conversion Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-700/50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-green-400">{analytics.conversion.conversionRate}%</p>
            <p className="text-sm text-slate-400 mt-1">Conversion Rate</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-red-400">{analytics.conversion.churnRate}%</p>
            <p className="text-sm text-slate-400 mt-1">Churn Rate</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold">{analytics.conversion.cancelledThisMonth}</p>
            <p className="text-sm text-slate-400 mt-1">Cancelled This Month</p>
          </div>
        </div>
      </div>

      {/* This Month Stats */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-4">This Month</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-2xl font-bold text-primary-400">{analytics.overview.newSignupsThisMonth}</p>
            <p className="text-sm text-slate-400 mt-1">New Signups</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-2xl font-bold text-green-400">{analytics.overview.conversionsThisMonth}</p>
            <p className="text-sm text-slate-400 mt-1">Conversions</p>
          </div>
        </div>
      </div>
    </div>
  )
}
