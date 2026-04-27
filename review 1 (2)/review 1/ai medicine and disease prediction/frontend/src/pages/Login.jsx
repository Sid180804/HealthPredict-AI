import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    if (result.success) {
      const role = result.user?.role;
      if (role === "admin")  navigate("/admin/dashboard");
      else if (role === "doctor") navigate("/doctor/dashboard");
      else navigate("/dashboard");
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      fontFamily: "'Inter', system-ui, sans-serif",
      background: "#f8fafc"
    }}>
      {/* Left Panel — Branding */}
      <div style={{
        width: "45%",
        background: "linear-gradient(145deg, #059669 0%, #047857 50%, #065f46 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "4rem",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* decorative circles */}
        <div style={{
          position: "absolute", width: 320, height: 320, borderRadius: "50%",
          background: "rgba(255,255,255,0.06)", top: -80, right: -80
        }} />
        <div style={{
          position: "absolute", width: 220, height: 220, borderRadius: "50%",
          background: "rgba(255,255,255,0.05)", bottom: 60, left: -60
        }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "3rem" }}>
          <div style={{
            width: 44, height: 44, background: "rgba(255,255,255,0.2)",
            borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: "1.35rem", fontWeight: 800, color: "white" }}>
            HealthPredict
          </span>
        </div>

        <h1 style={{ color: "white", fontSize: "2.4rem", fontWeight: 800, lineHeight: 1.2, marginBottom: "1.25rem", fontFamily: "'Outfit',sans-serif" }}>
          Your AI Clinical<br />Decision Partner
        </h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "1.05rem", lineHeight: 1.7, marginBottom: "3rem", maxWidth: 380 }}>
          Access disease prediction, multilingual health AI, prescription analysis, and more — all in one platform.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[
            { icon: "✓", text: "41+ diseases detected with 99% accuracy" },
            { icon: "✓", text: "10 Indian languages supported" },
            { icon: "✓", text: "Secure, HIPAA-aware design" }
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{
                width: 22, height: 22, background: "rgba(255,255,255,0.25)",
                borderRadius: "50%", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "0.7rem", color: "white", fontWeight: 700, flexShrink: 0
              }}>{item.icon}</div>
              <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.9rem" }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Form */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "3rem 4rem"
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "1.9rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem", fontFamily: "'Outfit',sans-serif" }}>
              Welcome back
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
              Sign in to your HealthPredict account
            </p>
          </div>

          {error && (
            <div style={{
              marginBottom: "1.25rem", padding: "0.875rem 1rem",
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 10, color: "#dc2626", fontSize: "0.875rem",
              display: "flex", alignItems: "center", gap: "0.5rem"
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={{
                  width: "100%", padding: "0.8rem 1rem",
                  border: "1.5px solid #e2e8f0", borderRadius: 10,
                  fontSize: "0.95rem", outline: "none", color: "#0f172a",
                  background: "#fff", transition: "border-color 0.2s",
                  boxSizing: "border-box"
                }}
                onFocus={e => e.target.style.borderColor = "#059669"}
                onBlur={e => e.target.style.borderColor = "#e2e8f0"}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: "1.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151" }}>
                  Password
                </label>
                <button type="button" style={{ fontSize: "0.8rem", color: "#059669", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                  Forgot password?
                </button>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  style={{
                    width: "100%", padding: "0.8rem 2.75rem 0.8rem 1rem",
                    border: "1.5px solid #e2e8f0", borderRadius: 10,
                    fontSize: "0.95rem", outline: "none", color: "#0f172a",
                    background: "#fff", transition: "border-color 0.2s",
                    boxSizing: "border-box"
                  }}
                  onFocus={e => e.target.style.borderColor = "#059669"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{
                    position: "absolute", right: "0.875rem", top: "50%",
                    transform: "translateY(-50%)", background: "none",
                    border: "none", cursor: "pointer", color: "#94a3b8", padding: 0
                  }}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "0.9rem",
                background: loading ? "#d1fae5" : "linear-gradient(135deg, #059669, #047857)",
                color: "white", border: "none", borderRadius: 10,
                fontSize: "0.95rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                transition: "opacity 0.2s, transform 0.2s", letterSpacing: "0.01em"
              }}
              onMouseEnter={e => { if (!loading) e.target.style.opacity = "0.92"; }}
              onMouseLeave={e => e.target.style.opacity = "1"}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div style={{
            margin: "2rem 0", display: "flex", alignItems: "center", gap: "1rem"
          }}>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            <span style={{ color: "#94a3b8", fontSize: "0.8rem", whiteSpace: "nowrap" }}>New to HealthPredict?</span>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          </div>

          <Link
            to="/register"
            style={{
              display: "block", textAlign: "center", padding: "0.85rem",
              border: "1.5px solid #059669", borderRadius: 10, color: "#059669",
              fontWeight: 700, fontSize: "0.95rem", textDecoration: "none",
              transition: "background 0.2s"
            }}
            onMouseEnter={e => e.target.style.background = "#f0fdf4"}
            onMouseLeave={e => e.target.style.background = "transparent"}
          >
            Create an Account
          </Link>

          <p style={{ textAlign: "center", marginTop: "2rem", fontSize: "0.78rem", color: "#94a3b8" }}>
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
