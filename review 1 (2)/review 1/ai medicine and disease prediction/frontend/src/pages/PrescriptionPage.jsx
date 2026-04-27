import React, { useState, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function PrescriptionPage() {
  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const processFile = useCallback(async (fileObj) => {
    if (!fileObj) return;
    setLoading(true);
    setError("");
    setResult(null);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result;
        const res = await axios.post(
          `${API_BASE}/api/ai/prescription/extract`,
          { base64: base64 },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token || localStorage.getItem("auth_token")}`,
            },
          }
        );
        setResult(res.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to process prescription. Please ensure the image is clear.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(fileObj);
  }, [token]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.type.startsWith("image/") || f.type === "application/pdf")) {
      setFile(f);
      if (f.type.startsWith("image/")) {
        setPreview(URL.createObjectURL(f));
        processFile(f);
      } else {
        setPreview(null);
        setError("PDF support coming soon. Please upload an image (JPG, PNG).");
      }
    } else {
      setError("Please upload a valid image file (JPG, PNG)");
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      if (f.type.startsWith("image/")) {
        setPreview(URL.createObjectURL(f));
        processFile(f);
      }
    }
  };

  const handleOrder = async () => {
    if (!result?.prescription_id || !result?.extracted?.medicines?.length) {
      setError("No valid prescription data found to order.");
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post(
        `${API_BASE}/api/orders`,
        {
          prescription_id: result.prescription_id,
          medicines: result.extracted.medicines,
          address: "Default delivery address",
        },
        { headers: { Authorization: `Bearer ${token || localStorage.getItem("auth_token")}` } }
      );
      setResult({ ...result, order: res.data.order });
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to place order securely.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      <Header />

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "3rem 2rem" }}>
        {/* Header Section */}
        <div style={{ marginBottom: "2.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669" }} />
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Pharmacy Services
              </span>
            </div>
            <h1 style={{ fontSize: "2.25rem", fontWeight: 800, color: "#0f172a", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>
              Intelligent Prescription Analysis
            </h1>
            <p style={{ color: "#64748b", fontSize: "1.05rem", marginTop: "0.5rem", maxWidth: 600 }}>
              Upload a clear image of your doctor's prescription. Our OCR engine accurately extracts medications, dosages, and regimen instructions for secure ordering.
            </p>
          </div>
        </div>

        {/* Disclaimer Alert */}
        <div style={{
          display: "flex", alignItems: "flex-start", gap: "1rem", padding: "1.25rem 1.5rem",
          background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, marginBottom: "2.5rem"
        }}>
          <svg style={{ flexShrink: 0, marginTop: 2 }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <h4 style={{ color: "#b45309", fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.25rem" }}>Professional Disclaimer</h4>
            <p style={{ color: "#92400e", fontSize: "0.85rem", lineHeight: 1.5, margin: 0 }}>
              This automated system is for convenience and does not substitute professional pharmaceutical advice. We rigorously verify all prescriptions before dispensing medicines.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start", flexWrap: "wrap" }}>
          
          {/* Left Column: Upload Area */}
          <div style={{ flex: "1 1 400px" }}>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragActive ? "#059669" : "#cbd5e1"}`,
                background: dragActive ? "#ecfdf5" : "#ffffff",
                borderRadius: 16, padding: "3rem 2rem", textAlign: "center",
                transition: "all 0.2s ease", position: "relative",
                boxShadow: dragActive ? "0 0 0 4px rgba(16, 185, 129, 0.1)" : "0 1px 3px rgba(0,0,0,0.05)"
              }}
            >
              <input
                type="file" accept="image/*" onChange={handleFileChange}
                style={{ display: "none" }} id="prescription-upload"
              />
              <label htmlFor="prescription-upload" style={{ cursor: "pointer", display: "block" }}>
                <div style={{
                  width: 64, height: 64, background: "#f1f5f9", borderRadius: 16,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 1.5rem", color: "#64748b"
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2-2.4-3.5-4.4-3.5h-1.2c-.7-3-3.2-5.2-6.2-5.6-3-.3-5.9 1.3-7.3 4-1.2 2.5-1 6.5.5 8.8m8.7-1.6V21"/><path d="M16 16l-4-4-4 4"/>
                  </svg>
                </div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#1e293b", marginBottom: "0.5rem" }}>
                  Upload valid prescription
                </h3>
                <p style={{ fontSize: "0.9rem", color: "#64748b", marginBottom: "1.5rem" }}>
                  Drag and drop your image here, or click to browse files
                </p>
                <div style={{
                  display: "inline-flex", background: "#f1f5f9", padding: "0.4rem 1rem",
                  borderRadius: 20, fontSize: "0.75rem", fontWeight: 600, color: "#475569", gap: "0.5rem"
                }}>
                  <span>JPG</span><span>•</span><span>PNG</span>
                </div>
              </label>
            </div>

            {error && (
              <div style={{ marginTop: "1.5rem", padding: "1rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, color: "#dc2626", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                {error}
              </div>
            )}
            
            {loading && (
              <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: 40, height: 40, border: "3px solid #e2e8f0", borderTopColor: "#059669", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: 500 }}>Analyzing document via OCR framework...</span>
              </div>
            )}
          </div>

          {/* Right Column: Preview & Results */}
          <div style={{ flex: "1 1 400px" }}>
            {!result && preview && !loading && (
               <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "1.5rem", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                 <h4 style={{ fontSize: "1rem", fontWeight: 600, color: "#0f172a", marginBottom: "1rem" }}>Document Preview</h4>
                 <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0", background: "#f8fafc" }}>
                   <img src={preview} alt="Prescription preview" style={{ width: "100%", height: "auto", display: "block", maxHeight: 400, objectFit: "contain" }} />
                 </div>
               </div>
            )}

            {result && !loading && result.extracted && (
              <div style={{
                background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16,
                padding: "2rem", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid #e2e8f0" }}>
                  <div style={{ width: 40, height: 40, background: "#ecfdf5", color: "#059669", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>Analysis Complete</h3>
                    <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>Data successfully extracted from document.</p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
                  <div>
                    <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Prescribing Doctor</span>
                    <div style={{ fontSize: "0.95rem", fontWeight: 500, color: "#334155" }}>
                      {result.extracted.doctor_name || "Not specified"}
                    </div>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Patient Name</span>
                    <div style={{ fontSize: "0.95rem", fontWeight: 500, color: "#334155" }}>
                      {result.extracted.patient_name || "Not specified"}
                    </div>
                  </div>
                </div>

                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem" }}>Extracted Medications</h4>
                <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 10, marginBottom: "2rem" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                        <th style={{ padding: "0.8rem 1rem", textAlign: "left", color: "#475569", fontWeight: 600 }}>Medicine</th>
                        <th style={{ padding: "0.8rem 1rem", textAlign: "left", color: "#475569", fontWeight: 600 }}>Dosage</th>
                        <th style={{ padding: "0.8rem 1rem", textAlign: "left", color: "#475569", fontWeight: 600 }}>Frequency</th>
                        <th style={{ padding: "0.8rem 1rem", textAlign: "left", color: "#475569", fontWeight: 600 }}>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(result.extracted.medicines || []).map((med, i) => (
                        <tr key={i} style={{ borderBottom: i === result.extracted.medicines.length - 1 ? "none" : "1px solid #e2e8f0" }}>
                          <td style={{ padding: "0.8rem 1rem", color: "#0f172a", fontWeight: 500 }}>{med.name}</td>
                          <td style={{ padding: "0.8rem 1rem", color: "#64748b" }}>{med.dosage}</td>
                          <td style={{ padding: "0.8rem 1rem", color: "#64748b" }}>{med.frequency}</td>
                          <td style={{ padding: "0.8rem 1rem", color: "#64748b" }}>{med.duration}</td>
                        </tr>
                      ))}
                      {(!result.extracted.medicines || result.extracted.medicines.length === 0) && (
                         <tr><td colSpan="4" style={{ padding: "1rem", textAlign: "center", color: "#64748b" }}>No medicines detected. Please try uploading a clearer image.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {result.extracted.medicines?.length > 0 && !result.order && (
                  <button
                    onClick={handleOrder}
                    style={{
                      width: "100%", padding: "1rem", background: "linear-gradient(135deg, #0f172a, #1e293b)",
                      color: "white", border: "none", borderRadius: 10, fontSize: "0.95rem", fontWeight: 600,
                      cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s",
                      boxShadow: "0 4px 6px -1px rgba(15, 23, 42, 0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem"
                    }}
                    onMouseEnter={e => e.target.style.transform = "translateY(-1px)"}
                    onMouseLeave={e => e.target.style.transform = "translateY(0)"}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Proceed to Order Formulation
                  </button>
                )}

                {result.order && (
                  <div style={{
                    padding: "1rem 1.25rem", background: "#f0fdf4", border: "1px solid #bbf7d0",
                    borderRadius: 10, color: "#166534", display: "flex", alignItems: "center", gap: "1rem"
                  }}>
                    <div style={{ width: 24, height: 24, background: "#22c55e", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div>
                      <strong style={{ display: "block", fontSize: "0.9rem", marginBottom: "0.15rem" }}>Order Authorized Successfully</strong>
                      <span style={{ fontSize: "0.85rem", opacity: 0.9 }}>Ref ID: #{result.order.id.substring(0, 8).toUpperCase()}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <style>
              {`
                @keyframes spin { 100% { transform: rotate(360deg); } }
              `}
            </style>
            
          </div>
        </div>
      </main>
    </div>
  );
}
