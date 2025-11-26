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

    if (!adminUser || !['superadmin', 'admin', 'support'].includes(adminUser.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get request body
    const { user_email, extension_days, reason } = await req.json()

    if (!user_email || !extension_days) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', user_email)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate new trial end date
    const currentTrialEnd = new Date(profile.trial_ends_at || new Date())
    const newTrialEnd = new Date(currentTrialEnd.getTime() + extension_days * 24 * 60 * 60 * 1000)

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        trial_ends_at: newTrialEnd.toISOString(),
        subscription_status: 'trial',
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)

    if (updateError) throw updateError

    // Log extension
    await supabase.from('manual_trial_extensions').insert({
      user_id: profile.id,
      user_email: profile.email,
      original_trial_end: currentTrialEnd.toISOString(),
      new_trial_end: newTrialEnd.toISOString(),
      extension_days,
      reason,
      granted_by: adminUser.id,
      granted_by_email: adminUser.email
    })

    // Audit log
    await supabase.from('admin_audit_log').insert({
      admin_id: adminUser.id,
      admin_email: adminUser.email,
      action: 'extend_trial',
      resource_type: 'user',
      resource_id: profile.id,
      details: {
        user_email,
        extension_days,
        new_trial_end: newTrialEnd.toISOString(),
        reason
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: `Trial extended by ${extension_days} days`,
        new_trial_end: newTrialEnd.toISOString()
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
