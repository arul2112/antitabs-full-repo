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
      .select('*')
      .eq('auth_user_id', user?.id)
      .eq('is_active', true)
      .single()

    if (!adminUser || !['superadmin', 'admin'].includes(adminUser.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get request body
    const {
      code,
      description,
      discount_type,
      discount_percent,
      discount_amount,
      trial_extension_days,
      applicable_plans,
      max_uses,
      max_uses_per_user,
      valid_from,
      valid_until,
      sync_to_razorpay
    } = await req.json()

    // Validate required fields
    if (!code || !discount_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate discount values
    if (discount_type === 'percentage' && !discount_percent) {
      return new Response(
        JSON.stringify({ error: 'Percentage discount requires discount_percent' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (discount_type === 'fixed_amount' && !discount_amount) {
      return new Response(
        JSON.stringify({ error: 'Fixed amount discount requires discount_amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (discount_type === 'trial_extension' && !trial_extension_days) {
      return new Response(
        JSON.stringify({ error: 'Trial extension requires trial_extension_days' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let razorpay_coupon_id = null

    // Sync to Razorpay if requested and applicable
    if (sync_to_razorpay && discount_type !== 'trial_extension') {
      try {
        const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')
        const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

        if (razorpayKeyId && razorpayKeySecret) {
          const razorpayAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`)

          const razorpayPayload: Record<string, unknown> = {
            code: code.toUpperCase(),
            type: discount_type === 'percentage' ? 'percentage' : 'flat',
            notes: {
              description: description || '',
              created_by: adminUser.email
            }
          }

          if (discount_type === 'percentage') {
            razorpayPayload.value = discount_percent * 100
          } else {
            razorpayPayload.value = discount_amount
          }

          if (valid_from) razorpayPayload.start_at = Math.floor(new Date(valid_from).getTime() / 1000)
          if (valid_until) razorpayPayload.expire_at = Math.floor(new Date(valid_until).getTime() / 1000)
          if (max_uses) razorpayPayload.max_count = max_uses

          const razorpayResponse = await fetch('https://api.razorpay.com/v1/coupons', {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${razorpayAuth}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(razorpayPayload)
          })

          if (razorpayResponse.ok) {
            const razorpayData = await razorpayResponse.json()
            razorpay_coupon_id = razorpayData.id
          }
        }
      } catch (razorpayError) {
        console.error('Razorpay sync failed:', razorpayError)
      }
    }

    // Insert coupon into database
    const { data: coupon, error: couponError } = await supabase
      .from('coupon_codes')
      .insert({
        code: code.toUpperCase(),
        description,
        discount_type,
        discount_percent: discount_type === 'percentage' ? discount_percent : null,
        discount_amount: discount_type === 'fixed_amount' ? discount_amount : null,
        trial_extension_days: discount_type === 'trial_extension' ? trial_extension_days : null,
        applicable_plans: applicable_plans || ['monthly', 'yearly'],
        max_uses,
        max_uses_per_user: max_uses_per_user || 1,
        valid_from: valid_from || new Date().toISOString(),
        valid_until,
        is_active: true,
        created_by: adminUser.id,
        razorpay_coupon_id
      })
      .select()
      .single()

    if (couponError) throw couponError

    // Audit log
    await supabase.from('admin_audit_log').insert({
      admin_id: adminUser.id,
      admin_email: adminUser.email,
      action: 'create_coupon',
      resource_type: 'coupon',
      resource_id: coupon.id,
      details: {
        code: coupon.code,
        discount_type,
        razorpay_synced: !!razorpay_coupon_id
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        coupon,
        message: `Coupon "${code}" created successfully${razorpay_coupon_id ? ' and synced to Razorpay' : ''}`
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
