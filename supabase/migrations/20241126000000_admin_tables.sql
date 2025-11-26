-- ============================================
-- AntiTabs Admin Panel - Database Migration
-- Run this migration with: supabase db push
-- ============================================

-- ============================================
-- ADMIN USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
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
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
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
WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON admin_audit_log(resource_type, resource_id);

-- ============================================
-- COUPON CODES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS coupon_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'trial_extension')),
  discount_percent INTEGER CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_amount INTEGER CHECK (discount_amount >= 0),
  trial_extension_days INTEGER CHECK (trial_extension_days > 0),
  applicable_plans TEXT[] DEFAULT ARRAY['monthly', 'yearly'],
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  max_uses_per_user INTEGER DEFAULT 1,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
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
CREATE INDEX IF NOT EXISTS idx_coupon_code ON coupon_codes(code);
CREATE INDEX IF NOT EXISTS idx_coupon_active ON coupon_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_coupon_validity ON coupon_codes(valid_from, valid_until);

-- ============================================
-- COUPON REDEMPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID REFERENCES coupon_codes(id) ON DELETE CASCADE,
  coupon_code TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  plan_type TEXT NOT NULL,
  discount_type TEXT NOT NULL,
  discount_value NUMERIC NOT NULL,
  original_amount INTEGER,
  discounted_amount INTEGER,
  savings_amount INTEGER,
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
WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_redemption_coupon_id ON coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_redemption_user_id ON coupon_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemption_date ON coupon_redemptions(redeemed_at DESC);

-- ============================================
-- MANUAL TRIAL EXTENSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS manual_trial_extensions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  original_trial_end TIMESTAMPTZ NOT NULL,
  new_trial_end TIMESTAMPTZ NOT NULL,
  extension_days INTEGER NOT NULL,
  reason TEXT,
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
CREATE INDEX IF NOT EXISTS idx_manual_extension_user_id ON manual_trial_extensions(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_extension_granted_at ON manual_trial_extensions(granted_at DESC);

-- ============================================
-- SUBSCRIPTION NOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS subscription_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  note_type TEXT NOT NULL CHECK (note_type IN ('internal', 'customer_request', 'payment_issue', 'cancellation', 'refund', 'other')),
  note TEXT NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON subscription_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_subscription_id ON subscription_notes(subscription_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON subscription_notes(created_at DESC);

-- ============================================
-- UPDATE EXISTING PROFILES TABLE
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_lifetime_free BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lifetime_free_granted_by UUID REFERENCES admin_users(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lifetime_free_granted_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function: Validate Coupon Code
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
  SELECT * INTO v_coupon
  FROM coupon_codes
  WHERE code = p_code
  AND is_active = true;

  IF v_coupon.id IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, 'Invalid coupon code';
    RETURN;
  END IF;

  IF v_coupon.valid_from IS NOT NULL AND v_coupon.valid_from > NOW() THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, 'Coupon not yet valid';
    RETURN;
  END IF;

  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < NOW() THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, 'Coupon expired';
    RETURN;
  END IF;

  IF v_coupon.max_uses IS NOT NULL AND v_coupon.current_uses >= v_coupon.max_uses THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, 'Coupon usage limit reached';
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_user_redemption_count
  FROM coupon_redemptions
  WHERE coupon_id = v_coupon.id
  AND user_id = p_user_id;

  IF v_coupon.max_uses_per_user IS NOT NULL AND v_user_redemption_count >= v_coupon.max_uses_per_user THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, 'You have already used this coupon';
    RETURN;
  END IF;

  IF NOT (p_plan_type = ANY(v_coupon.applicable_plans)) THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, 'Coupon not applicable to this plan';
    RETURN;
  END IF;

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

-- Function: Increment Coupon Usage
CREATE OR REPLACE FUNCTION increment_coupon_usage(p_coupon_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE coupon_codes
  SET current_uses = current_uses + 1,
      updated_at = NOW()
  WHERE id = p_coupon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get Admin Role
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

-- Function: Check Admin Permission
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
