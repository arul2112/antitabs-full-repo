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

    // Get request body
    const { code, user_id, plan_type } = await req.json()

    if (!code || !plan_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: code and plan_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the coupon
    const { data: coupon, error: couponError } = await supabase
      .from('coupon_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single()

    if (couponError || !coupon) {
      return new Response(
        JSON.stringify({
          is_valid: false,
          error: 'Invalid coupon code'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check validity period
    const now = new Date()
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return new Response(
        JSON.stringify({
          is_valid: false,
          error: 'Coupon is not yet valid'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return new Response(
        JSON.stringify({
          is_valid: false,
          error: 'Coupon has expired'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check max uses
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return new Response(
        JSON.stringify({
          is_valid: false,
          error: 'Coupon usage limit has been reached'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check per-user limit if user_id provided
    if (user_id && coupon.max_uses_per_user) {
      const { count } = await supabase
        .from('coupon_redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('coupon_id', coupon.id)
        .eq('user_id', user_id)

      if (count && count >= coupon.max_uses_per_user) {
        return new Response(
          JSON.stringify({
            is_valid: false,
            error: 'You have already used this coupon the maximum number of times'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Check applicable plans
    if (!coupon.applicable_plans.includes(plan_type)) {
      return new Response(
        JSON.stringify({
          is_valid: false,
          error: `This coupon is not valid for the ${plan_type} plan`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate discount value
    let discountValue = 0
    let discountDescription = ''

    switch (coupon.discount_type) {
      case 'percentage':
        discountValue = coupon.discount_percent
        discountDescription = `${discountValue}% off`
        break
      case 'fixed_amount':
        discountValue = coupon.discount_amount
        discountDescription = `₹${discountValue} off`
        break
      case 'trial_extension':
        discountValue = coupon.trial_extension_days
        discountDescription = `${discountValue} extra trial days`
        break
    }

    return new Response(
      JSON.stringify({
        is_valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          description: coupon.description,
          discount_type: coupon.discount_type,
          discount_value: discountValue,
          discount_description: discountDescription,
          applicable_plans: coupon.applicable_plans
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
