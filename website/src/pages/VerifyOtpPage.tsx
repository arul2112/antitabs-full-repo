/**
 * OTP Verification Page
 * User enters 6-digit OTP code sent to their email
 */

import { useState, FormEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { verifyOtp, createProfileAfterVerification } from "../lib/authHelpers";
import { supabase } from "../lib/supabaseClient";
import { Button } from "../components/ui/button";
import "../styles/auth.css";

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const fullName = location.state?.fullName || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    if (!email) {
      setError("Email not found. Please sign up again.");
      return;
    }

    setLoading(true);

    try {
      // Verify OTP
      const { session } = await verifyOtp(email, otp);

      if (!session?.user) {
        throw new Error("Verification failed");
      }

      // Create user profile after successful OTP verification
      await createProfileAfterVerification(
        session.user.id,
        session.user.email || email,
        fullName || session.user.user_metadata?.full_name || ''
      );

      // Redirect to pricing page
      navigate("/pricing");
    } catch (err: any) {
      console.error('OTP verification error:', err);
      if (err.message?.includes("Token has expired")) {
        setError("OTP code has expired. Please request a new one.");
      } else if (err.message?.includes("Invalid")) {
        setError("Invalid OTP code. Please try again.");
      } else {
        setError(err.message || "Failed to verify OTP");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      setError("Email not found. Please sign up again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) throw error;
      alert("OTP code resent! Check your email.");
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <section className="relative min-h-screen flex items-center justify-center bg-white py-12 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-purple-600/[0.03] via-pink-500/[0.03] to-orange-500/[0.03] rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-orange-500/[0.03] via-pink-500/[0.03] to-purple-600/[0.03] rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        </div>

        <div className="auth-form-container relative z-10">
          <div className="auth-form-card text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-black mb-3">Email Required</h1>
            <p className="text-black/60 mb-6">Please sign up first to verify your email.</p>
            <button className="auth-submit-btn">
              <Link to="/signup">Go to Sign Up</Link>
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-white py-12 overflow-hidden">
      {/* Subtle animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-purple-600/[0.03] via-pink-500/[0.03] to-orange-500/[0.03] rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-orange-500/[0.03] via-pink-500/[0.03] to-purple-600/[0.03] rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="auth-form-container relative z-10">
        {/* Header */}
        <div className="auth-header">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="auth-title">Verify your email</h1>
          <p className="auth-subtitle mb-2">We've sent a 6-digit code to</p>
          <p className="text-base font-medium text-black">{email}</p>
        </div>

        {/* OTP Form */}
        <div className="auth-form-card">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <div className="auth-form-group">
              <label htmlFor="otp" className="auth-form-label">
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                className="auth-form-input text-center tracking-[0.5em] placeholder:tracking-normal font-mono text-lg"
                placeholder="000000"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setOtp(value);
                }}
              />
              <p className="text-xs text-black/50 mt-2">Enter the 6-digit code from your email</p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="auth-submit-btn"
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>

            <div className="border-t border-black/[0.06] pt-5 mt-6">
              <p className="text-sm text-black/60 mb-3">Didn't receive the code?</p>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="w-full bg-black/5 hover:bg-black/10 text-black rounded-full h-11 text-sm font-semibold transition-all disabled:opacity-50"
              >
                {loading ? "Resending..." : "Resend Code"}
              </button>
            </div>

            <div className="auth-footer">
              <p className="auth-footer-text">
                Wrong email?{" "}
                <Link to="/signup" className="auth-footer-link">
                  Sign up again
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
