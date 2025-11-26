/**
 * Pricing Page
 * Subscription plans with Christmas offer banner
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../lib/authHelpers";
import { openRazorpayCheckout } from "../lib/razorpayCheckout";
import { Button } from "../components/ui/button";

export default function PricingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.log("User not authenticated");
    }
  };

  const handleSubscribe = async (planType: 'monthly' | 'yearly') => {
    // Check if user is logged in
    if (!user) {
      navigate("/signup");
      return;
    }

    setLoading(planType);
    setError("");

    try {
      await openRazorpayCheckout(
        planType,
        user.email,
        user.user_metadata?.full_name || user.email
      );

      // Payment successful
      navigate("/success");
    } catch (err: any) {
      console.error("Payment error:", err);
      if (!err.message?.includes("cancelled")) {
        setError(err.message || "Payment failed. Please try again.");
      }
    } finally {
      setLoading("");
    }
  };

  return (
    <section className="relative min-h-screen bg-white py-12 md:py-16 lg:py-24 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-black/[0.02] rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          

          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-5xl md:text-4xl py-8 lg:text-5xl font-semibold tracking-tight text-black mb-2 md:mb-3">
              Choose your plan
            </h1>
            <p className="text-base md:text-lg text-black/60 font-normal">
              Start with a 1-day free trial
            </p>
          </div>

          {/* Christmas Offer Banner */}
          <div className="relative px-4 md:px-6 py-3 md:py-3.5 mb-8 md:mb-12 text-center">
            <p className="text-sm md:text-base lg:text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
              🎄 Christmas Offer — Special pricing until February 2026
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="max-w-2xl mx-auto mb-8 bg-red-500/10 border border-red-500/20 text-red-900 px-4 py-3 rounded-2xl text-sm">
              {error}
            </div>
          )}

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-4 md:gap-6 max-w-5xl mx-auto mb-8 md:mb-12 px-4 md:px-0">
            {/* Monthly Plan */}
            <div className="bg-white border border-black/[0.08] rounded-3xl p-6 md:p-8 hover:border-black/[0.12] hover:shadow-sm transition-all duration-200 flex flex-col">
              <div className="mb-6 md:mb-8">
                <h3 className="text-lg md:text-xl font-semibold text-black mb-3 md:mb-4">Monthly</h3>
                <div className="mb-1">
                  <span className="text-4xl md:text-5xl font-bold text-black tracking-tight">₹199</span>
                  <span className="text-base md:text-lg text-black/50 font-medium ml-1">/month</span>
                </div>
              </div>

              <ul className="space-y-3 md:space-y-3.5 mb-6 md:mb-8 text-sm md:text-[15px] text-black/70 flex-grow">
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-black flex-shrink-0"></div>
                  <span>Unlimited windows</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-black flex-shrink-0"></div>
                  <span>Large canvas</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-black flex-shrink-0"></div>
                  <span>Project management</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-black flex-shrink-0"></div>
                  <span>Priority support</span>
                </li>
              </ul>

              <Button
                onClick={() => handleSubscribe('monthly')}
                disabled={loading === 'monthly'}
                className="w-full bg-black text-white hover:bg-black/90 rounded-full h-10 md:h-11 text-sm md:text-[15px] font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
              >
                {loading === 'monthly' ? 'Processing...' : 'Start Now'}
              </Button>
            </div>

            {/* Yearly Plan */}
            <div className="bg-white border-2 border-black rounded-3xl p-6 md:p-8 hover:border-black/90 hover:shadow-md transition-all duration-200 relative overflow-visible flex flex-col">
              

              <div className="mb-6 md:mb-8">
                <h3 className="text-lg md:text-xl font-semibold text-black mb-3 md:mb-4">Yearly</h3>
                <div className="mb-1">
                  <span className="text-4xl md:text-5xl font-bold text-black tracking-tight">₹1,999</span>
                  <span className="text-base md:text-lg text-black/50 font-medium ml-1">/year</span>
                  
                  
                </div>
                
                </div>
                {/* Save Badge - Moved to right side */}
                <div className="w-fit absolute margin-left: auto; margin-right: 0; top-0 right-0 mt-4">
                <div className="top-6 md:top-8 -right-3 md:-right-4 bg-black text-white px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold shadow-md">
                SAVE ₹389
              </div>
              </div>

              <ul className="space-y-3 md:space-y-3.5 mb-6 md:mb-8 text-sm md:text-[15px] text-black/70 flex-grow">
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-black flex-shrink-0"></div>
                  <span>Unlimited windows</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-black flex-shrink-0"></div>
                  <span>Large canvas</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-black flex-shrink-0"></div>
                  <span>Project management</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-black flex-shrink-0"></div>
                  <span>Priority support</span>
                </li>
                
              </ul>

              <Button
                onClick={() => handleSubscribe('yearly')}
                disabled={loading === 'yearly'}
                className="w-full bg-black text-white hover:bg-black/90 rounded-full h-10 md:h-11 text-sm md:text-[15px] font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
              >
                {loading === 'yearly' ? 'Processing...' : 'Start Now'}
              </Button>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center">
            <p className="text-sm text-black/40 mb-2">
              Secure payment powered by Razorpay
            </p>
            <p className="text-xs text-black/30">
              All subscriptions auto-renew. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
