/**
 * Supabase Edge Function: Create Razorpay Subscription
 *
 * This function creates a Razorpay subscription instance using server-side API.
 * Required because subscription creation needs secret key (can't be done client-side).
 */ import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
const RAZORPAY_PLAN_ID_MONTHLY = Deno.env.get('RAZORPAY_PLAN_ID_MONTHLY');
const RAZORPAY_PLAN_ID_YEARLY = Deno.env.get('RAZORPAY_PLAN_ID_YEARLY');
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // Get authenticated user
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization')
        }
      }
    });
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Parse request body
    const { planType, couponCode } = await req.json();
    if (!planType || ![
      'monthly',
      'yearly'
    ].includes(planType)) {
      return new Response(JSON.stringify({
        error: 'Invalid plan type'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Get plan ID
    const planId = planType === 'monthly' ? RAZORPAY_PLAN_ID_MONTHLY : RAZORPAY_PLAN_ID_YEARLY;
    // Get user profile
    const { data: profile } = await supabaseClient.from('profiles').select('email, full_name').eq('id', user.id).single();
    // Prepare subscription data
    const subscriptionData = {
      plan_id: planId,
      total_count: planType === 'monthly' ? 12 : 1,
      quantity: 1,
      customer_notify: 1,
      notes: {
        user_id: user.id,
        plan_type: planType
      }
    };
    // Add coupon if provided
    if (couponCode) {
      // Validate coupon in database
      const { data: coupon, error: couponError } = await supabaseClient.from('coupons').select('*').eq('code', couponCode.toUpperCase()).eq('is_active', true).single();
      if (!couponError && coupon) {
        // Check if coupon is valid
        const now = new Date();
        const validUntil = new Date(coupon.valid_until);
        const validFrom = new Date(coupon.valid_from);
        if (now >= validFrom && now <= validUntil && coupon.current_uses < coupon.max_uses) {
          // Check if applicable to this plan
          if (coupon.applicable_plans.includes(planType)) {
            // Apply offer/discount (Razorpay supports offer_id)
            subscriptionData.notes.coupon_code = couponCode;
            subscriptionData.notes.discount_type = coupon.discount_type;
            subscriptionData.notes.discount_value = coupon.discount_value;
          }
        }
      }
    }
    // Create subscription via Razorpay API
    const authHeader = 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionData)
    });
    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.json();
      console.error('Razorpay API error:', errorData);
      return new Response(JSON.stringify({
        error: 'Failed to create subscription',
        details: errorData
      }), {
        status: razorpayResponse.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const subscription = await razorpayResponse.json();
    // Return subscription details to frontend
    return new Response(JSON.stringify({
      success: true,
      subscription_id: subscription.id,
      plan_id: subscription.plan_id,
      status: subscription.status,
      razorpay_key_id: RAZORPAY_KEY_ID
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
