import { ReactNode } from 'react'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  variant?: 'default' | 'primary' | 'success' | 'warning'
}

export function StatsCard({ title, value, subtitle, icon, trend, variant = 'default' }: StatsCardProps) {
  const variantStyles = {
    default: 'from-slate-800/50 to-slate-800/30 border-slate-700/50',
    primary: 'from-violet-600/20 to-purple-600/20 border-violet-500/30',
    success: 'from-emerald-600/20 to-green-600/20 border-emerald-500/30',
    warning: 'from-amber-600/20 to-yellow-600/20 border-amber-500/30',
  }

  const iconStyles = {
    default: 'bg-slate-700/50 text-slate-400',
    primary: 'bg-violet-500/20 text-violet-400',
    success: 'bg-emerald-500/20 text-emerald-400',
    warning: 'bg-amber-500/20 text-amber-400',
  }

  return (
    <div className={`bg-gradient-to-br ${variantStyles[variant]} rounded-2xl p-6 border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${iconStyles[variant]}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trend.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
        {subtitle && (
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
