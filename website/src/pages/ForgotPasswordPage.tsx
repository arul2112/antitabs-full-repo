/**
 * Forgot Password Page
 * User requests password reset link
 */

import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { sendPasswordReset } from "../lib/authHelpers";
import { Button } from "../components/ui/button";
import "../styles/auth.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);

    try {
      await sendPasswordReset(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="auth-title">Reset password</h1>
          <p className="auth-subtitle">Enter your email and we'll send you a reset link</p>
        </div>

        {/* Form */}
        <div className="auth-form-card">
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-black mb-2">Check your email</h3>
              <p className="text-sm text-black/60 mb-6">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <button className="auth-submit-btn">
                <Link to="/login">Back to Login</Link>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="auth-error">
                  {error}
                </div>
              )}

              <div className="auth-form-group">
                <label htmlFor="email" className="auth-form-label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="auth-form-input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="auth-submit-btn"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              <div className="auth-footer">
                <p className="auth-footer-text">
                  Remember your password?{" "}
                  <Link to="/login" className="auth-footer-link">
                    Login
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
