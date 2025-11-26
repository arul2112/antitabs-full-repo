import { supabase } from './supabaseClient'

// Types
export interface AdminUser {
  id: string
  email: string
  full_name: string
  role: 'superadmin' | 'admin' | 'support' | 'finance'
}

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  subscription_status: string
  trial_ends_at: string | null
  created_at: string
  subscriptions?: {
    id: string
    plan_type: string
    status: string
    current_period_end: string | null
  }[]
}

export interface CouponCode {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed_amount' | 'trial_extension'
  discount_percent: number | null
  discount_amount: number | null
  trial_extension_days: number | null
  applicable_plans: string[]
  max_uses: number | null
  current_uses: number
  max_uses_per_user: number
  valid_from: string
  valid_until: string | null
  is_active: boolean
  created_at: string
}

export interface AnalyticsData {
  overview: {
    totalUsers: number
    trialUsers: number
    activeSubscribers: number
    newSignupsThisMonth: number
    conversionsThisMonth: number
  }
  revenue: {
    mrr: number
    arr: number
    monthlySubscribers: number
    yearlySubscribers: number
  }
  conversion: {
    conversionRate: number
    churnRate: number
    cancelledThisMonth: number
  }
  coupons: {
    uniqueCouponsUsed: number
    totalRedemptions: number
    totalSavings: number
  }
}

// API Functions
export const adminAPI = {
  // Verify admin session and get admin info
  async verifyAdmin(): Promise<AdminUser> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const { data, error } = await supabase.functions.invoke('admin-login', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (error) throw error
    return data.admin
  },

  // List users with pagination and filtering
  async listUsers(params: {
    page?: number
    limit?: number
    search?: string
    status?: string
  }): Promise<{ users: UserProfile[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const queryParams = new URLSearchParams({
      page: String(params.page || 1),
      limit: String(params.limit || 50),
      ...(params.search && { search: params.search }),
      ...(params.status && { status: params.status }),
    })

    const { data, error } = await supabase.functions.invoke(
      `admin-list-users?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    )

    if (error) throw error
    return data
  },

  // Extend user's trial period
  async extendTrial(
    userEmail: string,
    extensionDays: number,
    reason?: string
  ): Promise<{ success: boolean; message: string; new_trial_end: string }> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const { data, error } = await supabase.functions.invoke('admin-extend-trial', {
      body: {
        user_email: userEmail,
        extension_days: extensionDays,
        reason,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (error) throw error
    return data
  },

  // Create a new coupon
  async createCoupon(couponData: {
    code: string
    description?: string
    discount_type: 'percentage' | 'fixed_amount' | 'trial_extension'
    discount_percent?: number
    discount_amount?: number
    trial_extension_days?: number
    applicable_plans?: string[]
    max_uses?: number
    max_uses_per_user?: number
    valid_from?: string
    valid_until?: string
    sync_to_razorpay?: boolean
  }): Promise<{ success: boolean; coupon: CouponCode; message: string }> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const { data, error } = await supabase.functions.invoke('admin-create-coupon', {
      body: couponData,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (error) throw error
    return data
  },

  // Get analytics data
  async getAnalytics(): Promise<AnalyticsData> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const { data, error } = await supabase.functions.invoke('admin-analytics', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (error) throw error
    return data
  },

  // Get all coupons (direct database query)
  async listCoupons(): Promise<CouponCode[]> {
    const { data, error } = await supabase
      .from('coupon_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Toggle coupon active status
  async toggleCoupon(couponId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('coupon_codes')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', couponId)

    if (error) throw error
  },
}
