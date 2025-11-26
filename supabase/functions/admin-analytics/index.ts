import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify admin user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role')
      .eq('auth_user_id', user?.id)
      .eq('is_active', true)
      .single()

    if (!adminUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get query parameters
    const url = new URL(req.url)
    const period = url.searchParams.get('period') || '30' // days
    const periodDays = parseInt(period)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)
    const startDateStr = startDate.toISOString()

    // Fetch all analytics data in parallel
    const [
      totalUsersResult,
      newUsersResult,
      activeSubscriptionsResult,
      trialUsersResult,
      revenueResult,
      couponRedemptionsResult,
      userGrowthResult,
      subscriptionsByPlanResult,
      recentActivityResult
    ] = await Promise.all([
      // Total users
      supabase.from('profiles').select('*', { count: 'exact', head: true }),

      // New users in period
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDateStr),

      // Active subscriptions
      supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),

      // Trial users
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'trial'),

      // Revenue in period (sum of successful payments)
      supabase
        .from('payment_history')
        .select('amount')
        .eq('status', 'captured')
        .gte('created_at', startDateStr),

      // Coupon redemptions in period
      supabase
        .from('coupon_redemptions')
        .select('*', { count: 'exact', head: true })
        .gte('redeemed_at', startDateStr),

      // User growth by day (last 30 days)
      supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', startDateStr)
        .order('created_at', { ascending: true }),

      // Subscriptions by plan type
      supabase
        .from('subscriptions')
        .select('plan_type')
        .eq('status', 'active'),

      // Recent activity (audit log)
      supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
    ])

    // Calculate revenue
    const totalRevenue = revenueResult.data?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0

    // Process user growth data
    const userGrowthByDay: Record<string, number> = {}
    userGrowthResult.data?.forEach(user => {
      const date = new Date(user.created_at).toISOString().split('T')[0]
      userGrowthByDay[date] = (userGrowthByDay[date] || 0) + 1
    })

    // Process subscriptions by plan
    const subscriptionsByPlan: Record<string, number> = {}
    subscriptionsByPlanResult.data?.forEach(sub => {
      const plan = sub.plan_type || 'unknown'
      subscriptionsByPlan[plan] = (subscriptionsByPlan[plan] || 0) + 1
    })

    // Calculate conversion rate (trial to paid)
    const conversionRate = totalUsersResult.count && activeSubscriptionsResult.count
      ? ((activeSubscriptionsResult.count / totalUsersResult.count) * 100).toFixed(2)
      : '0'

    // Calculate churn (cancelled subscriptions in period)
    const { count: churnedCount } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'cancelled')
      .gte('updated_at', startDateStr)

    const churnRate = activeSubscriptionsResult.count && churnedCount
      ? ((churnedCount / (activeSubscriptionsResult.count + churnedCount)) * 100).toFixed(2)
      : '0'

    return new Response(
      JSON.stringify({
        overview: {
          totalUsers: totalUsersResult.count || 0,
          newUsers: newUsersResult.count || 0,
          activeSubscriptions: activeSubscriptionsResult.count || 0,
          trialUsers: trialUsersResult.count || 0,
          totalRevenue: totalRevenue,
          couponRedemptions: couponRedemptionsResult.count || 0,
          conversionRate: parseFloat(conversionRate),
          churnRate: parseFloat(churnRate)
        },
        charts: {
          userGrowth: Object.entries(userGrowthByDay).map(([date, count]) => ({
            date,
            count
          })),
          subscriptionsByPlan: Object.entries(subscriptionsByPlan).map(([plan, count]) => ({
            plan,
            count
          }))
        },
        recentActivity: recentActivityResult.data || [],
        period: {
          days: periodDays,
          startDate: startDateStr,
          endDate: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
