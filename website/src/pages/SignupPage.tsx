/**
 * Signup Page - Professional minimal design
 */

import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signUp } from "../lib/authHelpers";
import { Button } from "../components/ui/button";
import "../styles/auth.css";

export default function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await signUp(formData.email, formData.password, formData.fullName);
      // Redirect to OTP verification page with email and fullName
      navigate("/verify-otp", {
        state: {
          email: formData.email,
          fullName: formData.fullName
        }
      });
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen flex items-top justify-center bg-white py-12 overflow-hidden">

      <div className="auth-form-container relative z-10">
        {/* Header */}
        <div className="auth-header">
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Start with a 1-day free trial</p>
        </div>

        {/* Form */}
        <div className="auth-form-card">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <div className="auth-form-group">
              <label htmlFor="fullName" className="auth-form-label">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                className="auth-form-input"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="email" className="auth-form-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="auth-form-input"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="password" className="auth-form-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                className="auth-form-input"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="confirmPassword" className="auth-form-label">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="auth-form-input"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="auth-submit-btn"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>

            <div className="auth-footer">
              <p className="auth-footer-text">
                Already have an account?{" "}
                <Link to="/login" className="auth-footer-link">
                  Login
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
