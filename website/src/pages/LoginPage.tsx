/**
 * Login Page - Professional minimal design
 */

import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signIn, getSubscriptionStatus } from "../lib/authHelpers";
import { Button } from "../components/ui/button";
import "../styles/auth.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setStatusMessage("");

    if (!formData.email || !formData.password) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      const { user } = await signIn(formData.email, formData.password);

      if (!user) {
        throw new Error("User not found");
      }

      setStatusMessage("Checking subscription...");
      const { status } = await getSubscriptionStatus(user.id);

      if (status === 'monthly_active' || status === 'yearly_active') {
        setStatusMessage("Welcome back!");
        setTimeout(() => navigate("/profile"), 1000);
      } else if (status === 'trial_active') {
        setStatusMessage("Redirecting...");
        setTimeout(() => navigate("/pricing"), 1000);
      } else {
        setStatusMessage("Redirecting...");
        setTimeout(() => navigate("/pricing"), 1000);
      }
    } catch (err: any) {
      if (err.message?.includes("Invalid login credentials")) {
        setError("Invalid email or password.");
      } else {
        setError(err.message || "Failed to login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen flex items-top justify-center bg-white py-20 overflow-hidden">


      <div className="auth-form-container relative z-10">
        {/* Header */}
        <div className="auth-header">
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Login to your account</p>
        </div>

        {/* Form */}
        <div className="auth-form-card">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="auth-error">
                {error}
                {error.includes("Invalid email or password") && (
                  <>
                    <br />
                    <Link to="/signup" className="underline font-semibold mt-2 inline-block hover:text-red-900 transition-colors">
                      Don't have an account? Sign up
                    </Link>
                  </>
                )}
              </div>
            )}

            {statusMessage && (
              <div className="auth-success">
                {statusMessage}
              </div>
            )}

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
              <div className="auth-label-row">
                <label htmlFor="password" className="auth-form-label" style={{ marginBottom: 0 }}>
                  Password
                </label>
                <Link to="/forgot-password" className="auth-forgot-link">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                className="auth-form-input"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="auth-submit-btn"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="auth-footer">
              <p className="auth-footer-text">
                Don't have an account?{" "}
                <Link to="/signup" className="auth-footer-link">
                  Sign Up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
