/**
 * Profile Page - Manage Subscription
 * Shows user profile and subscription details
 */

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getCurrentUser, getUserProfile, getUserSubscription, UserProfile, Subscription } from "../lib/authHelpers";
import { Button } from "../components/ui/button";
import { Download } from "lucide-react";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        navigate("/login");
        return;
      }

      setUser(currentUser);

      const userProfile = await getUserProfile(currentUser.id);
      setProfile(userProfile);

      const userSubscription = await getUserSubscription(currentUser.id);
      setSubscription(userSubscription);
    } catch (err: any) {
      console.error("Error loading user data:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black/10 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black/60">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white py-20 px-4">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-sm border border-black/10 rounded-3xl p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl tracking-tight text-black mb-4">Error Loading Profile</h2>
          <p className="text-black/60 mb-6">{error || "Please try again later"}</p>
          <Button
            onClick={() => navigate("/login")}
            className="bg-black text-white hover:bg-black/90 rounded-full px-6 h-11 text-base transition-all duration-300 hover:scale-105"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  const userName = profile.full_name || user.email;
  const userEmail = profile.email;

  // Calculate trial time remaining
  let trialTimeRemaining = "";
  if (profile.subscription_status === 'trial' && profile.trial_ends_at) {
    const trialEndsAt = new Date(profile.trial_ends_at);
    const now = new Date();
    const hoursRemaining = Math.max(0, Math.floor((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60)));
    trialTimeRemaining = hoursRemaining > 0 ? `${hoursRemaining} hours remaining` : "Expired";
  }

  return (
    <section className="relative min-h-screen bg-white py-20 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-black/5 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl tracking-tight text-black mb-4">My Account</h1>
            <p className="text-lg text-black/50">Manage your profile and subscription</p>
          </div>

          {/* Profile Card */}
          <div className="bg-white/80 backdrop-blur-sm border border-black/10 rounded-3xl p-8 mb-6">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center text-3xl font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl tracking-tight text-black">{userName}</h2>
                <p className="text-black/60">{userEmail}</p>
              </div>
            </div>

            <div className="border-t border-black/5 pt-6">
              <h3 className="text-lg tracking-tight text-black mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
                <div>
                  <p className="text-black/60 mb-1">Member Since</p>
                  <p className="text-black font-medium">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-black/60 mb-1">Account Status</p>
                  <p className="text-black font-medium">
                    {profile.subscription_status === 'trial' ? '1-Day Trial' :
                     profile.subscription_status === 'active' ? 'Active Subscription' :
                     'No Active Subscription'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Card */}
          <div className="bg-white/80 backdrop-blur-sm border border-black/10 rounded-3xl p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl tracking-tight text-black">Subscription Details</h3>
              {subscription && subscription.status === 'active' && (
                <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-medium">
                  ACTIVE
                </span>
              )}
            </div>

            {subscription && subscription.status === 'active' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-black/5">
                  <span className="text-black/60">Plan</span>
                  <span className="text-black font-medium capitalize">{subscription.plan_type}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-black/5">
                  <span className="text-black/60">Amount</span>
                  <span className="text-black font-medium">
                    ₹{(subscription.amount / 100).toFixed(0)}
                    {subscription.plan_type === 'monthly' ? '/month' : '/year'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-black/5">
                  <span className="text-black/60">Current Period</span>
                  <span className="text-black font-medium text-sm">
                    {new Date(subscription.current_period_start).toLocaleDateString()} - {new Date(subscription.current_period_end).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-black/60">Subscription ID</span>
                  <span className="text-black font-mono text-xs">{subscription.razorpay_subscription_id}</span>
                </div>

                <div className="bg-black/5 border border-black/10 rounded-2xl p-4 mt-6">
                  <p className="text-sm text-black/70">
                    To cancel your subscription, email{" "}
                    <a href="mailto:antitabs.ai@gmail.com" className="font-medium text-black hover:underline">
                      antitabs.ai@gmail.com
                    </a>
                  </p>
                </div>
              </div>
            ) : profile.subscription_status === 'trial' ? (
              <div className="bg-black/5 border border-black/10 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-4">⏱️</div>
                <h4 className="text-lg tracking-tight text-black mb-2">1-Day Free Trial</h4>
                <p className="text-black/60 mb-6">{trialTimeRemaining}</p>
                <Button
                  onClick={() => navigate("/pricing")}
                  className="bg-black text-white hover:bg-black/90 rounded-full px-6 h-11 text-base transition-all duration-300 hover:scale-105"
                >
                  Upgrade Now
                </Button>
              </div>
            ) : (
              <div className="bg-black/5 border border-black/10 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-4">💳</div>
                <h4 className="text-lg tracking-tight text-black mb-2">No Active Subscription</h4>
                <p className="text-black/60 mb-6">Subscribe to unlock unlimited features</p>
                <Button
                  onClick={() => navigate("/pricing")}
                  className="bg-black text-white hover:bg-black/90 rounded-full px-6 h-11 text-base transition-all duration-300 hover:scale-105"
                >
                  View Pricing
                </Button>
              </div>
            )}
          </div>

          {/* Download Section */}
          <div className="bg-black text-white rounded-3xl p-8">
            <h3 className="text-xl tracking-tight mb-4">Download AntiTabs</h3>
            <p className="text-white/70 mb-6">Get the desktop app for your operating system</p>

            <div className="grid md:grid-cols-2 gap-4">
              <a
                href="#"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-2xl p-6 transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-center gap-4">
                  <Download className="w-6 h-6" />
                  <div>
                    <div className="font-medium">macOS</div>
                    <div className="text-sm text-white/60">Intel & Apple Silicon</div>
                  </div>
                </div>
              </a>

              <a
                href="#"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-2xl p-6 transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-center gap-4">
                  <Download className="w-6 h-6" />
                  <div>
                    <div className="font-medium">Windows</div>
                    <div className="text-sm text-white/60">64-bit</div>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
