# AntiTabs Admin Panel - Complete Setup Guide

## 🎯 Overview

This guide provides a complete, production-ready admin panel implementation for AntiTabs with:

- **Multi-role access control** (SuperAdmin, Admin, Support, Finance)
- **Advanced coupon system** (percentage, fixed amount, trial extension, plan-specific)
- **Comprehensive analytics** (MRR, ARR, conversion rates, churn analysis)
- **Manual user management** (extend trials, grant access, manage subscriptions)
- **Real-time deployment** (create & activate coupons within minutes)
- **Separate subdomain** (admin.antitabs.in)

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    AntiTabs Ecosystem                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Main Website (antitabs.in)                                 │
│  ├─ User signup/login                                       │
│  ├─ Pricing page with coupon input                          │
│  └─ Subscription management                                 │
│                                                              │
│  Admin Panel (admin.antitabs.in)                            │
│  ├─ Separate React application                             │
│  ├─ Role-based authentication                               │
│  ├─ User & subscription management                          │
│  ├─ Coupon creation & analytics                             │
│  └─ Revenue dashboard                                       │
│                                                              │
│  Supabase Backend                                           │
│  ├─ Database (users, subscriptions, coupons, admin)        │
│  ├─ Edge Functions (admin APIs, webhooks)                  │
│  └─ Row Level Security (RLS)                                │
│                                                              │
│  Razorpay Integration                                       │
│  ├─ Subscription creation                                   │
│  ├─ Coupon application                                      │
│  └─ Webhook sync                                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Phase 1: Database Schema Setup

### Step 1.1: Create Admin Tables

Run these SQL commands in **Supabase SQL Editor**:

```sql
-- ============================================
-- ADMIN USERS TABLE
-- ============================================
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin', 'support', 'finance')),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all admin users
CREATE POLICY "Admins can view admin users"
ON admin_users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE auth_user_id = auth.uid()
    AND is_active = true
  )
);

-- Policy: Only superadmins can create/modify admins
CREATE POLICY "Superadmins can manage admins"
ON admin_users FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE auth_user_id = auth.uid()
    AND role = 'superadmin'
    AND is_active = true
  )
);

-- ============================================
-- ADMIN AUDIT LOG TABLE
-- ============================================
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL, -- 'user', 'subscription', 'coupon', etc.
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: All admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON admin_audit_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE auth_user_id = auth.uid()
    AND is_active = true
  )
);

-- Policy: System can insert audit logs (via Edge Functions)
CREATE POLICY "System can insert audit logs"
ON admin_audit_log FOR INSERT
WITH CHECK (true); -- Edge Functions will use service role

-- Create index for performance
CREATE INDEX idx_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX idx_audit_log_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX idx_audit_log_resource ON admin_audit_log(resource_type, resource_id);

-- ============================================
-- COUPON CODES TABLE
-- ============================================
CREATE TABLE coupon_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,

  -- Discount type
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'trial_extension')),

  -- Discount values (only one should be set based on discount_type)
  discount_percent INTEGER CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_amount INTEGER CHECK (discount_amount >= 0), -- Amount in paise (₹100 = 10000)
  trial_extension_days INTEGER CHECK (trial_extension_days > 0),

  -- Plan restrictions
  applicable_plans TEXT[] DEFAULT ARRAY['monthly', 'yearly'], -- Empty array = all plans

  -- Usage limits
  max_uses INTEGER, -- NULL = unlimited
  current_uses INTEGER DEFAULT 0,
  max_uses_per_user INTEGER DEFAULT 1,

  -- Validity period
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Razorpay coupon ID (if synced)
  razorpay_coupon_id TEXT UNIQUE
);

-- Enable RLS
ALTER TABLE coupon_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view active coupons (for validation)
CREATE POLICY "Public can view active coupons"
ON coupon_codes FOR SELECT
USING (
  is_active = true
  AND (valid_from IS NULL OR valid_from <= NOW())
  AND (valid_until IS NULL OR valid_until >= NOW())
);

-- Policy: Admins can manage coupons
CREATE POLICY "Admins can manage coupons"
ON coupon_codes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE auth_user_id = auth.uid()
    AND role IN ('superadmin', 'admin')
    AND is_active = true
  )
);

-- Create indexes
CREATE INDEX idx_coupon_code ON coupon_codes(code);
CREATE INDEX idx_coupon_active ON coupon_codes(is_active);
CREATE INDEX idx_coupon_validity ON coupon_codes(valid_from, valid_until);

-- ============================================
-- COUPON REDEMPTIONS TABLE
-- ============================================
CREATE TABLE coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID REFERENCES coupon_codes(id) ON DELETE CASCADE,
  coupon_code TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,

  -- Redemption details
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  plan_type TEXT NOT NULL,

  -- Discount applied
  discount_type TEXT NOT NULL,
  discount_value NUMERIC NOT NULL, -- Percentage, amount, or days
  original_amount INTEGER, -- In paise
  discounted_amount INTEGER, -- In paise
  savings_amount INTEGER, -- In paise

  -- Metadata
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own redemptions
CREATE POLICY "Users can view own redemptions"
ON coupon_redemptions FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Admins can view all redemptions
CREATE POLICY "Admins can view all redemptions"
ON coupon_redemptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE auth_user_id = auth.uid()
    AND is_active = true
  )
);

-- Policy: System can insert redemptions
CREATE POLICY "System can insert redemptions"
ON coupon_redemptions FOR INSERT
WITH CHECK (true); -- Edge Functions with service role

-- Create indexes
CREATE INDEX idx_redemption_coupon_id ON coupon_redemptions(coupon_id);
CREATE INDEX idx_redemption_user_id ON coupon_redemptions(user_id);
CREATE INDEX idx_redemption_date ON coupon_redemptions(redeemed_at DESC);

-- ============================================
-- MANUAL TRIAL EXTENSIONS TABLE
-- ============================================
CREATE TABLE manual_trial_extensions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,

  -- Extension details
  original_trial_end TIMESTAMPTZ NOT NULL,
  new_trial_end TIMESTAMPTZ NOT NULL,
  extension_days INTEGER NOT NULL,
  reason TEXT,

  -- Admin who granted extension
  granted_by UUID REFERENCES admin_users(id),
  granted_by_email TEXT NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE manual_trial_extensions ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view extensions
CREATE POLICY "Admins can view extensions"
ON manual_trial_extensions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE auth_user_id = auth.uid()
    AND is_active = true
  )
);

-- Policy: Admins can grant extensions
CREATE POLICY "Admins can grant extensions"
ON manual_trial_extensions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE auth_user_id = auth.uid()
    AND role IN ('superadmin', 'admin', 'support')
    AND is_active = true
  )
);

-- Create indexes
CREATE INDEX idx_manual_extension_user_id ON manual_trial_extensions(user_id);
CREATE INDEX idx_manual_extension_granted_at ON manual_trial_extensions(granted_at DESC);

-- ============================================
-- SUBSCRIPTION NOTES TABLE
-- ============================================
CREATE TABLE subscription_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  note_type TEXT NOT NULL CHECK (note_type IN ('internal', 'customer_request', 'payment_issue', 'cancellation', 'refund', 'other')),
  note TEXT NOT NULL,

  -- Admin who created note
  created_by UUID REFERENCES admin_users(id),
  created_by_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscription_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view notes
CREATE POLICY "Admins can view notes"
ON subscription_notes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE auth_user_id = auth.uid()
    AND is_active = true
  )
);

-- Policy: Admins can create notes
CREATE POLICY "Admins can create notes"
ON subscription_notes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE auth_user_id = auth.uid()
    AND is_active = true
  )
);

-- Create indexes
CREATE INDEX idx_notes_user_id ON subscription_notes(user_id);
CREATE INDEX idx_notes_subscription_id ON subscription_notes(subscription_id);
CREATE INDEX idx_notes_created_at ON subscription_notes(created_at DESC);

-- ============================================
-- UPDATE EXISTING PROFILES TABLE
-- ============================================
-- Add column for lifetime free access
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_lifetime_free BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lifetime_free_granted_by UUID REFERENCES admin_users(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lifetime_free_granted_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_notes TEXT;
```

### Step 1.2: Create Helper Functions

```sql
-- ============================================
-- FUNCTION: Validate Coupon Code
-- ============================================
CREATE OR REPLACE FUNCTION validate_coupon(
  p_code TEXT,
  p_user_id UUID,
  p_plan_type TEXT
)
RETURNS TABLE (
  is_valid BOOLEAN,
  coupon_id UUID,
  discount_type TEXT,
  discount_value NUMERIC,
  error_message TEXT
) AS $$
DECLARE
  v_coupon coupon_codes%ROWTYPE;
  v_user_redemption_count INTEGER;
BEGIN
  -- Get coupon
  SELECT * INTO v_coupon
  FROM coupon_codes
  WHERE code = p_code
  AND is_active = true;

  -- Check if coupon exists
  IF v_coupon.id IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, 'Invalid coupon code';
    RETURN;
  END IF;

  -- Check validity period
  IF v_coupon.valid_from IS NOT NULL AND v_coupon.valid_from > NOW() THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, 'Coupon not yet valid';
    RETURN;
  END IF;

  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < NOW() THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, 'Coupon expired';
    RETURN;
  END IF;

  -- Check max uses
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.current_uses >= v_coupon.max_uses THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, 'Coupon usage limit reached';
    RETURN;
  END IF;

  -- Check user redemption limit
  SELECT COUNT(*) INTO v_user_redemption_count
  FROM coupon_redemptions
  WHERE coupon_id = v_coupon.id
  AND user_id = p_user_id;

  IF v_coupon.max_uses_per_user IS NOT NULL AND v_user_redemption_count >= v_coupon.max_uses_per_user THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, 'You have already used this coupon';
    RETURN;
  END IF;

  -- Check plan applicability
  IF NOT (p_plan_type = ANY(v_coupon.applicable_plans)) THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, 'Coupon not applicable to this plan';
    RETURN;
  END IF;

  -- Return valid coupon
  RETURN QUERY SELECT
    true,
    v_coupon.id,
    v_coupon.discount_type,
    CASE
      WHEN v_coupon.discount_type = 'percentage' THEN v_coupon.discount_percent::NUMERIC
      WHEN v_coupon.discount_type = 'fixed_amount' THEN v_coupon.discount_amount::NUMERIC
      WHEN v_coupon.discount_type = 'trial_extension' THEN v_coupon.trial_extension_days::NUMERIC
    END,
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Increment Coupon Usage
-- ============================================
CREATE OR REPLACE FUNCTION increment_coupon_usage(p_coupon_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE coupon_codes
  SET current_uses = current_uses + 1,
      updated_at = NOW()
  WHERE id = p_coupon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Get Admin Role
-- ============================================
CREATE OR REPLACE FUNCTION get_admin_role(p_auth_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM admin_users
  WHERE auth_user_id = p_auth_user_id
  AND is_active = true;

  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Check Admin Permission
-- ============================================
CREATE OR REPLACE FUNCTION has_admin_permission(
  p_auth_user_id UUID,
  p_required_roles TEXT[]
)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM admin_users
  WHERE auth_user_id = p_auth_user_id
  AND is_active = true;

  RETURN v_role = ANY(p_required_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Step 1.3: Create Your First SuperAdmin

```sql
-- Replace with your email and auth.users ID
-- First, create a user in Supabase Auth, then:

INSERT INTO admin_users (email, full_name, role, auth_user_id, is_active)
VALUES (
  'your-email@example.com',  -- Your email
  'Your Name',                -- Your name
  'superadmin',
  'YOUR_AUTH_USER_ID',        -- Get this from auth.users table
  true
);
```

---

## 📋 Phase 2: Supabase Edge Functions

### Step 2.1: Install Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref ezdtnsemaxvnkhivqhrw
```

### Step 2.2: Create Edge Functions Directory Structure

```bash
# Create functions directory
mkdir -p supabase/functions

# Create individual function folders
cd supabase/functions
mkdir admin-login
mkdir admin-list-users
mkdir admin-update-user
mkdir admin-extend-trial
mkdir admin-create-coupon
mkdir admin-validate-coupon
mkdir admin-analytics
mkdir razorpay-webhook
```

### Step 2.3: Edge Function - Admin Login

**File:** `supabase/functions/admin-login/index.ts`

```typescript
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

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is an admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('auth_user_id', user.id)
      .eq('is_active', true)
      .single()

    if (adminError || !adminUser) {
      return new Response(
        JSON.stringify({ error: 'Not an admin user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update last login
    await supabase
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', adminUser.id)

    // Log audit event
    await supabase.from('admin_audit_log').insert({
      admin_id: adminUser.id,
      admin_email: adminUser.email,
      action: 'login',
      resource_type: 'admin',
      resource_id: adminUser.id,
      details: { user_agent: req.headers.get('user-agent') }
    })

    return new Response(
      JSON.stringify({
        admin: {
          id: adminUser.id,
          email: adminUser.email,
          full_name: adminUser.full_name,
          role: adminUser.role,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### Step 2.4: Edge Function - List Users

**File:** `supabase/functions/admin-list-users/index.ts`

```typescript
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
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const search = url.searchParams.get('search') || ''
    const status = url.searchParams.get('status') || ''

    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('profiles')
      .select(`
        *,
        subscriptions (
          id,
          plan_type,
          status,
          current_period_end
        )
      `, { count: 'exact' })

    // Add filters
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }

    if (status) {
      query = query.eq('subscription_status', status)
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false })

    const { data: users, error, count } = await query

    if (error) throw error

    return new Response(
      JSON.stringify({
        users,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### Step 2.5: Edge Function - Extend Trial

**File:** `supabase/functions/admin-extend-trial/index.ts`

```typescript
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
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### Step 2.6: Edge Function - Create Coupon

**File:** `supabase/functions/admin-create-coupon/index.ts`

```typescript
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
        const razorpayAuth = btoa(`${Deno.env.get('RAZORPAY_KEY_ID')}:${Deno.env.get('RAZORPAY_KEY_SECRET')}`)

        const razorpayPayload: any = {
          code: code.toUpperCase(),
          type: discount_type === 'percentage' ? 'percentage' : 'flat',
          notes: {
            description: description || '',
            created_by: adminUser.email
          }
        }

        if (discount_type === 'percentage') {
          razorpayPayload.value = discount_percent * 100 // Razorpay uses basis points
        } else {
          razorpayPayload.value = discount_amount // Amount in paise
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

        if (!razorpayResponse.ok) {
          const error = await razorpayResponse.json()
          throw new Error(`Razorpay API error: ${error.error?.description || 'Unknown error'}`)
        }

        const razorpayData = await razorpayResponse.json()
        razorpay_coupon_id = razorpayData.id
      } catch (razorpayError) {
        console.error('Razorpay sync failed:', razorpayError)
        // Continue without Razorpay sync
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
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### Step 2.7: Edge Function - Validate Coupon

**File:** `supabase/functions/admin-validate-coupon/index.ts`

```typescript
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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '' // Use anon key for user context
    )

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get request body
    const { code, plan_type } = await req.json()

    if (!code || !plan_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use service role for validation function
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Call validation function
    const { data, error } = await supabaseAdmin.rpc('validate_coupon', {
      p_code: code.toUpperCase(),
      p_user_id: user.id,
      p_plan_type: plan_type
    })

    if (error) throw error

    const validation = data[0]

    if (!validation.is_valid) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: validation.error_message
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get full coupon details
    const { data: coupon } = await supabaseAdmin
      .from('coupon_codes')
      .select('*')
      .eq('id', validation.coupon_id)
      .single()

    return new Response(
      JSON.stringify({
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          description: coupon.description,
          discount_type: validation.discount_type,
          discount_value: validation.discount_value,
          razorpay_coupon_id: coupon.razorpay_coupon_id
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### Step 2.8: Edge Function - Admin Analytics

**File:** `supabase/functions/admin-analytics/index.ts`

```typescript
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

    // Get total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Get trial users
    const { count: trialUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'trial')

    // Get active subscribers
    const { count: activeSubscribers } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Get monthly vs yearly breakdown
    const { data: planBreakdown } = await supabase
      .from('subscriptions')
      .select('plan_type')
      .eq('status', 'active')

    const monthlyCount = planBreakdown?.filter(s => s.plan_type === 'monthly').length || 0
    const yearlyCount = planBreakdown?.filter(s => s.plan_type === 'yearly').length || 0

    // Calculate MRR (Monthly Recurring Revenue)
    const monthlyRevenue = monthlyCount * 199
    const yearlyMRR = yearlyCount * Math.floor(1999 / 12)
    const totalMRR = monthlyRevenue + yearlyMRR

    // Calculate ARR (Annual Recurring Revenue)
    const totalARR = totalMRR * 12

    // Get new signups this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: newSignupsThisMonth } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString())

    // Get conversions this month
    const { count: conversionsThisMonth } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('created_at', startOfMonth.toISOString())

    // Calculate conversion rate
    const conversionRate = trialUsers && trialUsers > 0
      ? ((activeSubscribers || 0) / (trialUsers + (activeSubscribers || 0)) * 100).toFixed(2)
      : '0.00'

    // Get coupon usage stats
    const { data: couponStats } = await supabase
      .from('coupon_redemptions')
      .select('coupon_code, savings_amount')

    const totalCouponSavings = couponStats?.reduce((sum, r) => sum + (r.savings_amount || 0), 0) || 0
    const uniqueCouponsUsed = new Set(couponStats?.map(r => r.coupon_code)).size

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentSignups } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    const { data: recentSubscriptions } = await supabase
      .from('subscriptions')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    // Get churn data
    const { count: cancelledSubscriptions } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'cancelled')
      .gte('cancelled_at', startOfMonth.toISOString())

    const churnRate = activeSubscribers && activeSubscribers > 0
      ? ((cancelledSubscriptions || 0) / (activeSubscribers + (cancelledSubscriptions || 0)) * 100).toFixed(2)
      : '0.00'

    return new Response(
      JSON.stringify({
        overview: {
          totalUsers: totalUsers || 0,
          trialUsers: trialUsers || 0,
          activeSubscribers: activeSubscribers || 0,
          newSignupsThisMonth: newSignupsThisMonth || 0,
          conversionsThisMonth: conversionsThisMonth || 0
        },
        revenue: {
          mrr: totalMRR,
          arr: totalARR,
          monthlySubscribers: monthlyCount,
          yearlySubscribers: yearlyCount
        },
        conversion: {
          conversionRate: parseFloat(conversionRate),
          churnRate: parseFloat(churnRate),
          cancelledThisMonth: cancelledSubscriptions || 0
        },
        coupons: {
          uniqueCouponsUsed,
          totalRedemptions: couponStats?.length || 0,
          totalSavings: totalCouponSavings / 100 // Convert paise to rupees
        },
        charts: {
          signupTrend: recentSignups,
          subscriptionTrend: recentSubscriptions
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### Step 2.9: Deploy Edge Functions

```bash
# Deploy all Edge Functions
supabase functions deploy admin-login
supabase functions deploy admin-list-users
supabase functions deploy admin-extend-trial
supabase functions deploy admin-create-coupon
supabase functions deploy admin-validate-coupon
supabase functions deploy admin-analytics

# Set environment variables for Edge Functions
supabase secrets set RAZORPAY_KEY_ID=your_razorpay_key_id
supabase secrets set RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

---

## 📋 Phase 3: Admin Frontend Application

### Step 3.1: Create Admin App Structure

```bash
# Create admin directory
mkdir -p admin/src/{pages,components,lib,styles}

# Initialize admin app
cd admin
npm init -y
npm install react react-dom react-router-dom @supabase/supabase-js
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom
npm install recharts date-fns lucide-react
```

### Step 3.2: Admin App Configuration

**File:** `admin/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/functions': {
        target: 'https://ezdtnsemaxvnkhivqhrw.supabase.co',
        changeOrigin: true,
      }
    }
  }
})
```

**File:** `admin/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Step 3.3: Admin Supabase Client

**File:** `admin/src/lib/adminSupabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: window.localStorage
  }
})

// Admin-specific API calls
export const adminAPI = {
  // Verify admin session
  async verifyAdmin() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const { data, error } = await supabase.functions.invoke('admin-login', {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    })

    if (error) throw error
    return data.admin
  },

  // List users
  async listUsers(params: { page?: number; limit?: number; search?: string; status?: string }) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const queryParams = new URLSearchParams({
      page: String(params.page || 1),
      limit: String(params.limit || 50),
      ...(params.search && { search: params.search }),
      ...(params.status && { status: params.status })
    })

    const { data, error } = await supabase.functions.invoke(
      `admin-list-users?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      }
    )

    if (error) throw error
    return data
  },

  // Extend trial
  async extendTrial(userEmail: string, extensionDays: number, reason?: string) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const { data, error } = await supabase.functions.invoke('admin-extend-trial', {
      body: { user_email: userEmail, extension_days: extensionDays, reason },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    })

    if (error) throw error
    return data
  },

  // Create coupon
  async createCoupon(couponData: any) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const { data, error } = await supabase.functions.invoke('admin-create-coupon', {
      body: couponData,
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    })

    if (error) throw error
    return data
  },

  // Get analytics
  async getAnalytics() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const { data, error } = await supabase.functions.invoke('admin-analytics', {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    })

    if (error) throw error
    return data
  }
}
```

### Step 3.4: Continue in Part 2...

Due to length limitations, the admin frontend implementation continues in a separate section. This covers:

- Admin login page
- Dashboard with analytics
- User management interface
- Coupon creation form
- Subscription management
- Role-based UI components

---

## 🔐 Security Checklist

- [ ] RLS policies applied to all tables
- [ ] Admin authentication working
- [ ] Audit logging enabled
- [ ] Service role key kept secure (never in frontend)
- [ ] CORS configured properly
- [ ] Rate limiting on Edge Functions
- [ ] Admin subdomain with HTTPS

---

## 🚀 Deployment Instructions

### Deploy Main Website
1. Build: `npm run build`
2. Upload to Hostinger `public_html`
3. Ensure `.htaccess` is uploaded

### Deploy Admin Panel
1. Build: `cd admin && npm run build`
2. Upload to Hostinger subdomain folder
3. Configure DNS: `admin.antitabs.in` → subdomain folder
4. Ensure separate `.htaccess` for admin

### Configure Razorpay
1. Create coupons in Razorpay dashboard
2. Enable coupon support in subscription plans
3. Test coupon application

---

## 📞 Support & Maintenance

### Daily Tasks
- Check analytics dashboard
- Monitor failed payments
- Review new signups

### Weekly Tasks
- Review coupon performance
- Check churn rate
- Update trial extensions if needed

### Monthly Tasks
- Revenue reporting
- User growth analysis
- Optimize conversion funnel

---

**Your admin panel is now ready to deploy!** 🎉

Continue to **ADMIN_PANEL_SETUP_PART2.md** for the complete frontend implementation.
