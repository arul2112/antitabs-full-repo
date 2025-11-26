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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role')
      .eq('auth_user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!adminUser) {
      return new Response(
        JSON.stringify({ error: 'Not an admin user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get current month start date
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthStartStr = monthStart.toISOString()

    // Fetch all analytics data in parallel with error handling
    const [
      totalUsersResult,
      trialUsersResult,
      activeSubscriptionsResult,
      newSignupsResult,
      monthlySubsResult,
      yearlySubsResult,
      cancelledResult,
      couponRedemptionsResult,
      totalSavingsResult
    ] = await Promise.all([
      // Total users
      supabase.from('profiles').select('*', { count: 'exact', head: true }),

      // Trial users
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'trial'),

      // Active subscriptions
      supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),

      // New signups this month
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStartStr),

      // Monthly subscribers
      supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('plan_type', 'monthly'),

      // Yearly subscribers
      supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('plan_type', 'yearly'),

      // Cancelled this month
      supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'cancelled')
        .gte('updated_at', monthStartStr),

      // Unique coupons used
      supabase
        .from('coupon_redemptions')
        .select('coupon_id', { count: 'exact', head: true }),

      // Total savings from coupons
      supabase
        .from('coupon_redemptions')
        .select('savings_amount')
    ])

    // Calculate values with fallbacks
    const totalUsers = totalUsersResult.count || 0
    const trialUsers = trialUsersResult.count || 0
    const activeSubscribers = activeSubscriptionsResult.count || 0
    const newSignupsThisMonth = newSignupsResult.count || 0
    const monthlySubscribers = monthlySubsResult.count || 0
    const yearlySubscribers = yearlySubsResult.count || 0
    const cancelledThisMonth = cancelledResult.count || 0
    const totalRedemptions = couponRedemptionsResult.count || 0

    // Calculate total savings
    const totalSavings = totalSavingsResult.data?.reduce(
      (sum, r) => sum + (r.savings_amount || 0), 0
    ) || 0

    // Calculate conversion rate (active subscribers / total users)
    const conversionRate = totalUsers > 0
      ? parseFloat(((activeSubscribers / totalUsers) * 100).toFixed(2))
      : 0

    // Calculate churn rate
    const totalWithCancelled = activeSubscribers + cancelledThisMonth
    const churnRate = totalWithCancelled > 0
      ? parseFloat(((cancelledThisMonth / totalWithCancelled) * 100).toFixed(2))
      : 0

    // Calculate MRR and ARR
    const monthlyPrice = 199 // INR
    const yearlyPrice = 1999 // INR
    const mrr = (monthlySubscribers * monthlyPrice) + Math.round((yearlySubscribers * yearlyPrice) / 12)
    const arr = mrr * 12

    // Get conversions this month (new active subscriptions this month)
    const { count: conversionsThisMonth } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('created_at', monthStartStr)

    // Get unique coupons count
    const { data: uniqueCoupons } = await supabase
      .from('coupon_redemptions')
      .select('coupon_id')

    const uniqueCouponsUsed = new Set(uniqueCoupons?.map(c => c.coupon_id) || []).size

    // Return data in the format expected by the frontend
    return new Response(
      JSON.stringify({
        overview: {
          totalUsers,
          trialUsers,
          activeSubscribers,
          newSignupsThisMonth,
          conversionsThisMonth: conversionsThisMonth || 0
        },
        revenue: {
          mrr,
          arr,
          monthlySubscribers,
          yearlySubscribers
        },
        conversion: {
          conversionRate,
          churnRate,
          cancelledThisMonth
        },
        coupons: {
          uniqueCouponsUsed,
          totalRedemptions,
          totalSavings
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Analytics error:', error)
    return new Response(
      JSON.stringify({
        error: (error as Error).message,
        // Return default values so the UI doesn't crash
        overview: {
          totalUsers: 0,
          trialUsers: 0,
          activeSubscribers: 0,
          newSignupsThisMonth: 0,
          conversionsThisMonth: 0
        },
        revenue: {
          mrr: 0,
          arr: 0,
          monthlySubscribers: 0,
          yearlySubscribers: 0
        },
        conversion: {
          conversionRate: 0,
          churnRate: 0,
          cancelledThisMonth: 0
        },
        coupons: {
          uniqueCouponsUsed: 0,
          totalRedemptions: 0,
          totalSavings: 0
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
