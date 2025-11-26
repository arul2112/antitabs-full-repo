/**
 * Razorpay Checkout Integration
 * Handles payment processing for monthly and yearly subscriptions
 */

import { supabase } from './supabaseClient';

interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  image?: string;
  prefill: {
    name: string;
    email: string;
  };
  theme: {
    color: string;
  };
  handler: (response: any) => void;
  modal: {
    ondismiss: () => void;
  };
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

/**
 * Load Razorpay script dynamically
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Create Razorpay subscription via Supabase Edge Function
 */
async function createRazorpaySubscription(
  planType: 'monthly' | 'yearly',
  couponCode?: string
): Promise<{ subscription_id: string; razorpay_key_id: string }> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Call Supabase Edge Function to create subscription
  const { data, error } = await supabase.functions.invoke('create-razorpay-subscription', {
    body: {
      planType,
      couponCode,
    },
  });

  if (error) {
    if (import.meta.env.DEV) {
      console.error('Error creating subscription:', error);
    }
    throw new Error(error.message || 'Failed to create subscription');
  }

  if (!data || !data.subscription_id) {
    throw new Error('Invalid response from server');
  }

  return {
    subscription_id: data.subscription_id,
    razorpay_key_id: data.razorpay_key_id,
  };
}

/**
 * Open Razorpay checkout for subscription
 */
export async function openRazorpayCheckout(
  planType: 'monthly' | 'yearly',
  userEmail: string,
  userName: string,
  couponCode?: string
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // Load Razorpay script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      // Create subscription
      const { subscription_id, razorpay_key_id } = await createRazorpaySubscription(
        planType,
        couponCode
      );

      // Razorpay options
      const options: RazorpayOptions = {
        key: razorpay_key_id,
        subscription_id: subscription_id,
        name: 'AntiTabs',
        description: `AntiTabs ${planType === 'monthly' ? 'Monthly' : 'Yearly'} Subscription`,
        image: '/logo.png',
        prefill: {
          name: userName,
          email: userEmail,
        },
        theme: {
          color: '#0066cc',
        },
        handler: function (response: any) {
          if (import.meta.env.DEV) {
            console.log('✅ Payment successful:', response);
          }

          // Payment successful
          if (response.razorpay_payment_id && response.razorpay_subscription_id) {
            // Store payment details in sessionStorage for success page (cleared on browser close)
            sessionStorage.setItem('antitabs_payment_success', JSON.stringify({
              payment_id: response.razorpay_payment_id,
              subscription_id: response.razorpay_subscription_id,
              plan_type: planType,
              timestamp: new Date().toISOString(),
            }));

            resolve();
          } else {
            reject(new Error('Payment response incomplete'));
          }
        },
        modal: {
          ondismiss: function () {
            if (import.meta.env.DEV) {
              console.log('Payment modal closed by user');
            }
            reject(new Error('Payment cancelled by user'));
          },
        },
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error opening Razorpay checkout:', error);
      }
      reject(error);
    }
  });
}

/**
 * Get payment details from sessionStorage
 */
export function getPaymentDetails(): {
  payment_id: string;
  subscription_id: string;
  plan_type: string;
  timestamp: string;
} | null {
  const data = sessionStorage.getItem('antitabs_payment_success');
  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Clear payment details from sessionStorage
 */
export function clearPaymentDetails() {
  sessionStorage.removeItem('antitabs_payment_success');
}
