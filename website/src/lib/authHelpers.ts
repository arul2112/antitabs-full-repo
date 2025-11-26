/**
 * Authentication Helper Functions
 * Handles user authentication and profile management
 */

import { supabase } from './supabaseClient';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  trial_started_at?: string;
  trial_ends_at?: string;
  subscription_status: 'trial' | 'active' | 'expired' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  razorpay_subscription_id: string;
  razorpay_payment_id?: string;
  plan_type: 'monthly' | 'yearly';
  amount: number;
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  cancelled_at?: string;
  created_at: string;
}

/**
 * Sign up a new user (DO NOT create profile yet - wait for email verification)
 */
export async function signUp(email: string, password: string, fullName: string) {
  const { data, error} = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${window.location.origin}/verify-otp`,
    },
  });

  if (error) throw error;

  // Do NOT create profile here - wait for email verification
  // Profile will be created after email is verified

  return data;
}

/**
 * Verify OTP code sent to email during signup
 */
export async function verifyOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup',
  });

  if (error) throw error;
  return data;
}

/**
 * Create user profile after OTP verification
 */
export async function createProfileAfterVerification(userId: string, email: string, fullName: string) {
  await createUserProfile(userId, email, fullName);
}

/**
 * Sign in existing user
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get current user session
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

/**
 * Create user profile with 1-day trial
 */
async function createUserProfile(userId: string, email: string, fullName: string) {
  const trialStartedAt = new Date();
  const trialEndsAt = new Date(trialStartedAt.getTime() + 24 * 60 * 60 * 1000); // 1 day from now

  const { error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email,
      full_name: fullName,
      trial_started_at: trialStartedAt.toISOString(),
      trial_ends_at: trialEndsAt.toISOString(),
      subscription_status: 'trial',
    });

  if (error) {
    if (import.meta.env.DEV) {
      console.error('Error creating user profile:', error);
    }
    throw error;
  }

  if (import.meta.env.DEV) {
    console.log('✅ User profile created with 1-day trial');
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (import.meta.env.DEV) {
      console.error('Error fetching user profile:', error);
    }
    return null;
  }

  return data as UserProfile;
}

/**
 * Get user's active subscription
 */
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Error fetching subscription:', error);
    return null;
  }

  return data as Subscription;
}

/**
 * Check if user has access (trial or active subscription)
 */
export async function hasAccess(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId);
  if (!profile) return false;

  // Check for active subscription
  const subscription = await getUserSubscription(userId);
  if (subscription && subscription.status === 'active') {
    return true;
  }

  // Check for active trial
  if (profile.subscription_status === 'trial' && profile.trial_ends_at) {
    const trialEndsAt = new Date(profile.trial_ends_at);
    const now = new Date();
    if (now < trialEndsAt) {
      return true;
    }
  }

  return false;
}

/**
 * Get subscription status for routing
 */
export async function getSubscriptionStatus(userId: string): Promise<{
  status: 'trial_active' | 'monthly_active' | 'yearly_active' | 'trial_expired' | 'no_subscription';
  profile: UserProfile | null;
  subscription: Subscription | null;
}> {
  const profile = await getUserProfile(userId);
  const subscription = await getUserSubscription(userId);

  if (subscription && subscription.status === 'active') {
    return {
      status: subscription.plan_type === 'monthly' ? 'monthly_active' : 'yearly_active',
      profile,
      subscription,
    };
  }

  if (profile?.subscription_status === 'trial' && profile.trial_ends_at) {
    const trialEndsAt = new Date(profile.trial_ends_at);
    const now = new Date();
    if (now < trialEndsAt) {
      return {
        status: 'trial_active',
        profile,
        subscription: null,
      };
    } else {
      return {
        status: 'trial_expired',
        profile,
        subscription: null,
      };
    }
  }

  return {
    status: 'no_subscription',
    profile,
    subscription: null,
  };
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;
}
