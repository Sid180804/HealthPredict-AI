import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const inputStyle = {
  width: "100%", padding: "0.75rem 0.875rem",
  border: "1.5px solid #e2e8f0", borderRadius: 9,
  fontSize: "0.9rem", outline: "none", color: "#0f172a",
  background: "#fff", transition: "border-color 0.2s",
  boxSizing: "border-box", fontFamily: "inherit"
};
const labelStyle = {
  display: "block", fontSize: "0.8rem", fontWeight: 600,
  color: "#475569", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.04em"
};

export default function Register() {
  const [formData, setFormData] = useState({
    name: "", email: "", password: "",
    role: "patient",
    age: "", gender: "", height: "", weight: "",
    allergies: "", existing_conditions: "",
    is_smoker: false, is_alcohol: false, city: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const registrationData = {
      ...formData,
      age: formData.age && !isNaN(parseInt(formData.age)) ? parseInt(formData.age) : null,
      height: formData.height && !isNaN(parseFloat(formData.height)) ? parseFloat(formData.height) : null,
      weight: formData.weight && !isNaN(parseFloat(formData.weight)) ? parseFloat(formData.weight) : null,
      allergies: formData.allergies?.trim() ? formData.allergies.split(",").map(a => a.trim()).filter(Boolean) : [],
      existing_conditions: formData.existing_conditions?.trim() ? formData.existing_conditions.split(",").map(c => c.trim()).filter(Boolean) : [],
    };
    const result = await register(registrationData);
    if (result.success) {
      const role = result.user?.role;
      if (role === "doctor") navigate("/doctor/dashboard");
      else navigate("/dashboard");
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const field = (label, name, type = "text", placeholder = "") => (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type} name={name} value={formData[name]}
        onChange={handleChange} placeholder={placeholder}
        style={inputStyle}
        onFocus={e => e.target.style.borderColor = "#059669"}
        onBlur={e => e.target.style.borderColor = "#e2e8f0"}
      />
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      fontFamily: "'Inter', system-ui, sans-serif", background: "#f8fafc"
    }}>
      {/* Left Branding Panel */}
      <div style={{
        width: "40%", background: "linear-gradient(145deg, #059669 0%, #047857 55%, #065f46 100%)",
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "4rem 3rem", position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.05)", top: -60, right: -80 }} />
        <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.04)", bottom: 40, left: -60 }} />

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2.5rem" }}>
          <div style={{ width: 44, height: 44, background: "rgba(255,255,255,0.2)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: "1.35rem", fontWeight: 800, color: "white" }}>HealthPredict</span>
        </div>

        <h1 style={{ color: "white", fontSize: "2.1rem", fontWeight: 800, lineHeight: 1.2, marginBottom: "1rem", fontFamily: "'Outfit',sans-serif" }}>
          Start your health<br />journey today
        </h1>
        <p style={{ color: "rgba(255,255,255,0.78)", fontSize: "1rem", lineHeight: 1.7, marginBottom: "2.5rem" }}>
          Create a personalized profile and get AI-powered health insights tailored specifically to you.
        </p>

        {/* Step indicators */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[
            { n: 1, text: "Account credentials" },
            { n: 2, text: "Personal details" },
            { n: 3, text: "Health information" }
          ].map(s => (
            <div key={s.n} style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: step >= s.n ? "white" : "rgba(255,255,255,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.75rem", fontWeight: 700,
                color: step >= s.n ? "#059669" : "rgba(255,255,255,0.6)"
              }}>
                {step > s.n ? "✓" : s.n}
              </div>
              <span style={{ color: step >= s.n ? "white" : "rgba(255,255,255,0.6)", fontSize: "0.9rem", fontWeight: step === s.n ? 700 : 400 }}>
                {s.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Form Panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem" }}>
        <div style={{ width: "100%", maxWidth: 520 }}>
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#059669", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Step {step} of 3
            </div>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", fontFamily: "'Outfit',sans-serif" }}>
              {step === 1 ? "Create Your Account" : step === 2 ? "Personal Information" : "Health Profile"}
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "0.35rem" }}>
              {step === 1 ? "Enter your login credentials to get started." : step === 2 ? "Tell us a bit about yourself." : "Optional — helps us personalize your experience."}
            </p>
          </div>

          {error && (
            <div style={{ marginBottom: "1.25rem", padding: "0.875rem 1rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, color: "#dc2626", fontSize: "0.875rem" }}>
              {error}
            </div>
          )}

          <form onSubmit={step < 3 ? (e) => { e.preventDefault(); setStep(s => s + 1); } : handleSubmit}>
            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                {field("Full Name *", "name", "text", "e.g. Priya Sharma")}
                {field("Email Address *", "email", "email", "you@example.com")}
                <div>
                  <label style={labelStyle}>Password *</label>
                  <input
                    type="password" name="password" value={formData.password}
                    onChange={handleChange} required minLength={6}
                    placeholder="Minimum 6 characters"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = "#059669"}
                    onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                  />
                </div>
                {/* Role selector */}
                <div>
                  <label style={labelStyle}>I am registering as</label>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    {[["patient", "🙋 Patient"], ["doctor", "👨‍⚕️ Doctor"]].map(([val, label]) => (
                      <button
                        key={val} type="button"
                        onClick={() => setFormData(p => ({ ...p, role: val }))}
                        style={{
                          flex: 1, padding: "0.75rem", borderRadius: 9, cursor: "pointer",
                          border: `2px solid ${formData.role === val ? "#059669" : "#e2e8f0"}`,
                          background: formData.role === val ? "#f0fdf4" : "#fff",
                          color: formData.role === val ? "#047857" : "#64748b",
                          fontWeight: 700, fontSize: "0.9rem",
                          transition: "all 0.15s",
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {formData.role === "doctor" && (
                    <p style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "0.5rem" }}>
                      Your account will be reviewed and verified by our admin team before going live.
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={labelStyle}>Age</label>
                    <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="30" min="1" max="120" style={inputStyle} onFocus={e => e.target.style.borderColor = "#059669"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                  </div>
                  <div>
                    <label style={labelStyle}>Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} style={inputStyle} onFocus={e => e.target.style.borderColor = "#059669"} onBlur={e => e.target.style.borderColor = "#e2e8f0"}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Height (cm)</label>
                    <input type="number" name="height" value={formData.height} onChange={handleChange} placeholder="170" style={inputStyle} onFocus={e => e.target.style.borderColor = "#059669"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                  </div>
                  <div>
                    <label style={labelStyle}>Weight (kg)</label>
                    <input type="number" name="weight" value={formData.weight} onChange={handleChange} placeholder="70" style={inputStyle} onFocus={e => e.target.style.borderColor = "#059669"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                  </div>
                </div>
                {field("City", "city", "text", "Mumbai")}
              </div>
            )}

            {step === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                {field("Known Allergies (comma-separated)", "allergies", "text", "Penicillin, Aspirin")}
                {field("Existing Conditions (comma-separated)", "existing_conditions", "text", "Diabetes, Hypertension")}
                <div style={{ display: "flex", gap: "1.5rem", paddingTop: "0.25rem" }}>
                  {[["is_smoker", "Smoker"], ["is_alcohol", "Alcohol Consumer"]].map(([name, label]) => (
                    <label key={name} style={{ display: "flex", alignItems: "center", gap: "0.625rem", cursor: "pointer" }}>
                      <input
                        type="checkbox" name={name} checked={formData[name]} onChange={handleChange}
                        style={{ width: 17, height: 17, accentColor: "#059669", cursor: "pointer" }}
                      />
                      <span style={{ fontSize: "0.9rem", color: "#475569", fontWeight: 500 }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "0.875rem", marginTop: "2rem" }}>
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(s => s - 1)}
                  style={{
                    flex: 1, padding: "0.875rem", border: "1.5px solid #e2e8f0",
                    borderRadius: 10, background: "white", color: "#475569",
                    fontSize: "0.9rem", fontWeight: 600, cursor: "pointer"
                  }}
                >
                  ← Back
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1, padding: "0.875rem",
                  background: loading ? "#d1fae5" : "linear-gradient(135deg, #059669, #047857)",
                  color: "white", border: "none", borderRadius: 10,
                  fontSize: "0.9rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer"
                }}
              >
                {loading ? "Creating Account…" : step < 3 ? "Continue →" : "Create Account"}
              </button>
            </div>
          </form>

          <p style={{ textAlign: "center", marginTop: "1.75rem", fontSize: "0.875rem", color: "#64748b" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#059669", fontWeight: 700, textDecoration: "none" }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
