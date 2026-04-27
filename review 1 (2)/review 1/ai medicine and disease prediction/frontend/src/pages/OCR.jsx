import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

const API_BASE = import.meta.env.VITE_API_BASE;
const PRESCRIPTION_ENDPOINT = `${API_BASE}/api/ai/prescription`;

const EMPTY_MED = { name: "", dosage: "", frequency: "", duration: "", instructions: "" };

function formatMethod(method) {
  if (!method) return "";
  if (method.startsWith("gpt-")) return `OpenAI ${method.toUpperCase()} Vision`;
  if (method === "tesseract") return "Tesseract fallback";
  if (method === "vision+tesseract_merge") return "GPT-4o + Tesseract (merged)";
  return method;
}

/* Kit-style inline icons */
const Icon = ({ d, size = 20, s = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const IconUpload = (p) => <Icon {...p} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>}/>;
const IconScan   = (p) => <Icon {...p} d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></>}/>;
const IconCheck  = (p) => <Icon {...p} d={<path d="M20 6 9 17l-5-5"/>}/>;
const IconWarn   = (p) => <Icon {...p} d={<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>}/>;
const IconArrowR = (p) => <Icon {...p} d={<><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></>}/>;

export default function OCR() {
  const navigate = useNavigate();

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState(null);
  const [meta, setMeta] = useState({ doctor_name: "", hospital_name: "", patient_name: "", date: "", notes: "" });
  const [meds, setMeds] = useState([]);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const hasMeds = meds.length > 0;
  const methodLabel = useMemo(() => formatMethod(result?.method_used), [result]);

  const runOCR = useCallback(async (file) => {
    if (!file) return;
    setLoading(true); setError(""); setResult(null); setMeds([]);
    setMeta({ doctor_name: "", hospital_name: "", patient_name: "", date: "", notes: "" });
    setStatus("Uploading…");
    setPreview(URL.createObjectURL(file));

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("file", file);
      setStatus("Enhancing image & extracting with GPT-4o…");
      const res = await fetch(PRESCRIPTION_ENDPOINT, { method: "POST", body: formData });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with ${res.status}`);
      }
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Extraction failed.");

      const ex = data.extracted || {};
      setResult({
        success: true,
        readable: !!data.readable,
        method_used: data.method_used || "openai_vision",
        prescription_id: data.prescription_id,
        confidence: ex.confidence ?? null,
        low_confidence: !!data.low_confidence,
      });
      setMeta({
        doctor_name: ex.doctor_name || "",
        hospital_name: ex.hospital_name || "",
        patient_name: ex.patient_name || "",
        date: ex.date || "",
        notes: ex.notes || "",
      });
      setMeds((ex.medicines || []).map(m => ({
        name: m.name || "", dosage: m.dosage || "", frequency: m.frequency || "",
        duration: m.duration || "", instructions: m.instructions || "",
        side_effects: m.side_effects || [], drug_class: m.drug_class || "",
      })));
    } catch (e) {
      setError(e.message || "OCR failed. Please try a clearer image.");
    } finally {
      setLoading(false); setStatus("");
    }
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f && f.type.startsWith("image/")) runOCR(f);
    else if (f) setError("Please upload a JPG, PNG, or WEBP image.");
  };
  const handleDrop = (e) => {
    e.preventDefault(); setDragActive(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) runOCR(f);
    else setError("Please upload a JPG, PNG, or WEBP image.");
  };
  const updateMed = (i, field, value) =>
    setMeds(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  const removeMed = (i) => setMeds(prev => prev.filter((_, idx) => idx !== i));
  const addMed = () => setMeds(prev => [...prev, { ...EMPTY_MED }]);

  const handleOrder = () => {
    const finalMeds = meds.filter(m => m.name.trim());
    if (!finalMeds.length) { setError("Please add at least one medicine before continuing."); return; }
    navigate("/orders", {
      state: {
        prescription: {
          success: true, readable: true,
          extracted: { ...meta, medicines: finalMeds },
          prescription_id: result?.prescription_id,
          method_used: result?.method_used,
        },
      },
    });
  };

  return (
    <>
      <Header/>
      <div className="hp-fade-up" style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 32px 48px" }}>
        {/* Eyebrow + hero heading */}
        <div style={{ marginBottom: 24 }}>
          <div className="hp-eyebrow">Pharmacy · AI Prescription Extraction</div>
          <h1 className="hp-sh" style={{ fontSize: 32, marginTop: 6 }}>Prescription Scanner</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4, maxWidth: 720 }}>
            Upload a prescription — handwritten, printed, multilingual, or blurry. Powered by GPT-4o Vision
            with OpenCV preprocessing and a Tesseract safety net. Edit any field before ordering.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 420px) 1fr", gap: 24, alignItems: "start" }}>
          {/* -- Upload column --- */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              onDragOver={e => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className="hp-card"
              style={{
                border: `2px dashed ${dragActive ? "#059669" : "#e2e8f0"}`,
                background: dragActive ? "#ecfdf5" : "#fff",
                padding: "36px 24px", textAlign: "center",
              }}
            >
              <input type="file" accept="image/*" onChange={handleFileChange} id="rx-upload" style={{ display: "none" }}/>
              <label htmlFor="rx-upload" style={{ cursor: "pointer", display: "block" }}>
                <div style={{
                  width: 64, height: 64, margin: "0 auto 16px",
                  borderRadius: 18, background: "linear-gradient(135deg,#0ea5e9,#0284c7)",
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <IconUpload size={28}/>
                </div>
                <h3 className="hp-sh" style={{ fontSize: 16, marginBottom: 4 }}>Upload Prescription</h3>
                <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
                  Drag &amp; drop, or click to browse
                </p>
                <div style={{
                  display: "inline-flex", gap: 6,
                  background: "#f1f5f9", padding: "6px 14px",
                  borderRadius: 9999,
                  fontSize: 11, fontWeight: 700, color: "#475569",
                }}>
                  <span>JPG</span><span>·</span><span>PNG</span><span>·</span><span>WEBP</span>
                </div>
              </label>
            </div>

            {loading && (
              <div className="hp-card" style={{ padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="hp-spin" style={{
                    width: 18, height: 18,
                    border: "2px solid #059669", borderTopColor: "transparent",
                    borderRadius: "50%",
                  }}/>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{status}</span>
                </div>
              </div>
            )}

            {error && (
              <div style={{
                padding: "12px 16px",
                background: "linear-gradient(135deg,#fef2f2,#fee2e2)",
                border: "1.5px solid #fecaca", borderRadius: 14,
                color: "#991b1b", fontSize: 13, fontWeight: 600,
              }}>{error}</div>
            )}

            {preview && (
              <div className="hp-card" style={{ padding: 16 }}>
                <div className="hp-eyebrow" style={{ marginBottom: 8 }}>Source Image</div>
                <div style={{
                  borderRadius: 12, overflow: "hidden",
                  border: "1px solid #e2e8f0", background: "#f8fafc",
                }}>
                  <img src={preview} alt="Prescription" style={{
                    width: "100%", height: "auto", display: "block",
                    maxHeight: 360, objectFit: "contain",
                  }}/>
                </div>
                {result && (
                  <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
                    Method: <b style={{ color: "#0f172a" }}>{methodLabel}</b>
                    {typeof result.confidence === "number" && (
                      <> · Confidence: <b style={{ color: "#0f172a" }}>{Math.round(result.confidence * 100)}%</b></>
                    )}
                    {result.low_confidence && <> · <span style={{ color: "#d97706" }}>low confidence — please verify</span></>}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* -- Results column --- */}
          <div>
            {!result && !loading && (
              <div className="hp-card" style={{
                padding: "56px 24px", textAlign: "center",
                border: "2px dashed #e2e8f0",
              }}>
                <div style={{
                  width: 56, height: 56, margin: "0 auto 14px",
                  borderRadius: 16, background: "#f1f5f9",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#64748b",
                }}>
                  <IconScan size={26}/>
                </div>
                <h3 className="hp-sh" style={{ fontSize: 16 }}>Awaiting Prescription</h3>
                <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
                  Upload an image to begin extraction with GPT-4o Vision.
                </p>
              </div>
            )}

            {result && (
              <div className="hp-card" style={{ padding: 24 }}>
                {/* Result header */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 12,
                  marginBottom: 20, paddingBottom: 16,
                  borderBottom: "1px dashed #e2e8f0",
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: hasMeds ? "#ecfdf5" : "#fef3c7",
                    color:      hasMeds ? "#059669" : "#d97706",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {hasMeds ? <IconCheck size={22} s={2.5}/> : <IconWarn size={22} s={2.5}/>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 className="hp-sh" style={{ fontSize: 17 }}>
                      {hasMeds ? "Extraction Complete — Edit Before Ordering" : "No Medicines Detected"}
                    </h3>
                    <p style={{ fontSize: 12.5, color: "#64748b", margin: "2px 0 0" }}>
                      {hasMeds
                        ? `${meds.length} medicine${meds.length === 1 ? "" : "s"} identified · edit any field below`
                        : "Try a sharper image, or add medicines manually."}
                    </p>
                  </div>
                </div>

                {/* Meta */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  {[
                    ["Doctor",             "doctor_name"],
                    ["Hospital / Clinic",  "hospital_name"],
                    ["Patient",            "patient_name"],
                    ["Date",               "date"],
                  ].map(([label, key]) => (
                    <div className="hp-field" key={key}>
                      <label>{label}</label>
                      <input value={meta[key]} onChange={e => setMeta({ ...meta, [key]: e.target.value })}/>
                    </div>
                  ))}
                </div>
                <div className="hp-field" style={{ marginBottom: 20 }}>
                  <label>Notes</label>
                  <textarea
                    rows={2}
                    value={meta.notes}
                    onChange={e => setMeta({ ...meta, notes: e.target.value })}
                    style={{ resize: "vertical", fontFamily: "inherit" }}
                  />
                </div>

                {/* Medicines table */}
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10,
                }}>
                  <h4 className="hp-sh" style={{ fontSize: 14 }}>Medicines</h4>
                  <button className="hp-btn hp-btn-secondary hp-btn-sm" onClick={addMed}>+ Add Row</button>
                </div>
                <div style={{
                  border: "1.5px solid #f1f5f9", borderRadius: 14,
                  overflow: "hidden", marginBottom: 20,
                }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                        {["Medicine", "Dosage", "Frequency", "Duration", "Instructions", ""].map((h, i) => (
                          <th key={i} style={{
                            padding: "10px 12px", textAlign: "left",
                            color: "#475569", fontWeight: 700, fontSize: 11,
                            textTransform: "uppercase", letterSpacing: ".06em",
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {meds.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{
                            padding: 24, textAlign: "center",
                            color: "#64748b", fontSize: 13,
                          }}>
                            No medicines — click &quot;Add Row&quot; to enter them manually.
                          </td>
                        </tr>
                      )}
                      {meds.map((m, i) => (
                        <tr key={i} style={{
                          borderBottom: i < meds.length - 1 ? "1px dashed #e2e8f0" : "none",
                        }}>
                          <td style={{ padding: "8px 10px", minWidth: 160 }}>
                            <input className="hp-row-input" value={m.name}
                                   onChange={e => updateMed(i, "name", e.target.value)}
                                   placeholder="e.g. Paracetamol 500mg"
                                   style={{ fontWeight: 600 }}/>
                            {m.drug_class && (
                              <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 3 }}>{m.drug_class}</div>
                            )}
                          </td>
                          <td style={{ padding: "8px 10px", minWidth: 80 }}>
                            <input className="hp-row-input" value={m.dosage}
                                   onChange={e => updateMed(i, "dosage", e.target.value)} placeholder="500mg"/>
                          </td>
                          <td style={{ padding: "8px 10px", minWidth: 90 }}>
                            <input className="hp-row-input" value={m.frequency}
                                   onChange={e => updateMed(i, "frequency", e.target.value)} placeholder="BD / 1-0-1"/>
                          </td>
                          <td style={{ padding: "8px 10px", minWidth: 80 }}>
                            <input className="hp-row-input" value={m.duration}
                                   onChange={e => updateMed(i, "duration", e.target.value)} placeholder="5 days"/>
                          </td>
                          <td style={{ padding: "8px 10px", minWidth: 140 }}>
                            <input className="hp-row-input" value={m.instructions}
                                   onChange={e => updateMed(i, "instructions", e.target.value)} placeholder="After food"/>
                          </td>
                          <td style={{ padding: "8px 6px", width: 28 }}>
                            <button onClick={() => removeMed(i)} title="Remove" style={{
                              background: "transparent", color: "#dc2626", border: "none",
                              cursor: "pointer", fontSize: 18, padding: "4px 8px",
                            }}>×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={handleOrder}
                  disabled={!meds.some(m => m.name.trim())}
                  className="hp-btn hp-btn-primary hp-btn-lg hp-btn-block"
                >
                  Confirm &amp; Transfer to Fulfillment <IconArrowR size={16}/>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes hp-spin { to { transform: rotate(360deg); } }
        .hp-spin { animation: hp-spin .8s linear infinite; }
        .hp-row-input {
          width: 100%; padding: 8px 10px; font: inherit; font-size: 13px;
          border: 1.5px solid #e2e8f0; border-radius: 10px; background: #fff; color: #0f172a;
          transition: all .15s;
        }
        .hp-row-input:focus { outline: none; border-color: #059669; box-shadow: 0 0 0 3px rgba(16,185,129,.15); }
      `}</style>
    </>
  );
}
