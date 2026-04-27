import { useState } from 'react';
import Header from '../components/Header';

const API = import.meta.env.VITE_API_BASE;

const INSIGHT_PALETTE = {
  critical: { color: '#dc2626', bg: 'linear-gradient(135deg,#fef2f2,#fee2e2)', border: '#fecaca', icon: '??' },
  warning:  { color: '#d97706', bg: 'linear-gradient(135deg,#fff7ed,#fef3c7)', border: '#fde68a', icon: '??' },
  success:  { color: '#047857', bg: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', border: '#a7f3d0', icon: '?' },
  info:     { color: '#2563eb', bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)', border: '#bfdbfe', icon: '??' },
};

const STATUS_COLORS = { normal: '#047857', high: '#dc2626', low: '#d97706', unknown: '#64748b' };

/* Kit-style icon */
const IconSparkle = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3 1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z"/>
  </svg>
);

export default function ReportAnalyzer() {
  const [mode, setMode] = useState('upload');        // 'upload' | 'manual'
  const [file, setFile] = useState(null);
  const [gender, setGender] = useState('female');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualTests, setManualTests] = useState([{ name: '', value: '' }]);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('gender', gender);
      const res = await fetch(`${API}/api/ai/analyze-report`, { method: 'POST', body: fd });
      setResults(await res.json());
    } catch { /* noop */ }
    setLoading(false);
  };

  const handleManual = async () => {
    const valid = manualTests.filter(t => t.name && t.value);
    if (!valid.length) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/ai/analyze-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tests: valid, gender }),
      });
      setResults(await res.json());
    } catch { /* noop */ }
    setLoading(false);
  };

  const addTest = () => setManualTests(p => [...p, { name: '', value: '' }]);
  const updateTest = (i, key, val) =>
    setManualTests(prev => prev.map((t, idx) => idx === i ? { ...t, [key]: val } : t));

  const canAnalyzeManual = manualTests.some(t => t.name && t.value);

  return (
    <>
      <Header/>
      <div className="hp-fade-up" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px 48px' }}>
        {/* Eyebrow + heading */}
        <div style={{ marginBottom: 24 }}>
          <div className="hp-eyebrow">Reports · AI Lab Analysis</div>
          <h1 className="hp-sh" style={{ fontSize: 32, marginTop: 6 }}>Medical Report Analyzer</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4, maxWidth: 720 }}>
            Upload a lab report or enter values manually. AI analyzes your results and generates
            health insights with reference ranges, severity, and recommended next steps.
          </p>
        </div>

        {/* Toggles — kit chip style */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <span
              className={`hp-chip ${mode === 'upload' ? 'active' : ''}`}
              onClick={() => { setMode('upload'); setResults(null); }}
            >?? Upload Report</span>
            <span
              className={`hp-chip ${mode === 'manual' ? 'active' : ''}`}
              onClick={() => { setMode('manual'); setResults(null); }}
            >?? Manual Entry</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span
              className={`hp-chip ${gender === 'female' ? 'active' : ''}`}
              onClick={() => setGender('female')}
            >? Female</span>
            <span
              className={`hp-chip ${gender === 'male' ? 'active' : ''}`}
              onClick={() => setGender('male')}
            >? Male</span>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: results ? 'minmax(320px, 460px) 1fr' : '1fr',
          gap: 24,
          alignItems: 'start',
        }}>
          {/* -- Input card --- */}
          <div className="hp-card" style={{ padding: 24 }}>
            {mode === 'upload' ? (
              <>
                <h3 className="hp-sh" style={{ fontSize: 18, marginBottom: 12 }}>Upload Lab Report</h3>
                <div
                  onClick={() => document.getElementById('ra-upload').click()}
                  style={{
                    border: `2px dashed ${file ? '#059669' : '#e2e8f0'}`,
                    background: file ? '#ecfdf5' : '#f8fafc',
                    borderRadius: 16, padding: '36px 24px', textAlign: 'center',
                    cursor: 'pointer', marginBottom: 14, transition: 'all .2s',
                  }}
                >
                  <input
                    id="ra-upload"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={e => setFile(e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                  {file ? (
                    <>
                      <div style={{
                        width: 64, height: 64, margin: '0 auto 12px',
                        borderRadius: 18, background: 'linear-gradient(135deg,#059669,#047857)',
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 28,
                      }}>?</div>
                      <div style={{ fontFamily: 'Outfit', fontWeight: 700, color: '#047857', fontSize: 14 }}>
                        {file.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Ready to analyze</div>
                    </>
                  ) : (
                    <>
                      <div style={{
                        width: 64, height: 64, margin: '0 auto 12px',
                        borderRadius: 18, background: 'linear-gradient(135deg,#0ea5e9,#0284c7)',
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 30,
                      }}>??</div>
                      <div style={{ fontFamily: 'Outfit', fontWeight: 700, color: '#0f172a', fontSize: 14 }}>
                        Click to upload lab report
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                        Blood report, thyroid panel, lipid profile…
                      </div>
                      <div style={{
                        display: 'inline-flex', gap: 6, marginTop: 14,
                        padding: '6px 14px', borderRadius: 9999,
                        background: '#f1f5f9',
                        fontSize: 11, fontWeight: 700, color: '#475569',
                      }}>
                        <span>JPG</span><span>·</span><span>PNG</span><span>·</span><span>PDF</span>
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={handleUpload}
                  disabled={!file || loading}
                  className="hp-btn hp-btn-primary hp-btn-lg hp-btn-block"
                >
                  {loading ? 'Analyzing…' : <>?? Analyze Report</>}
                </button>
              </>
            ) : (
              <>
                <h3 className="hp-sh" style={{ fontSize: 18, marginBottom: 12 }}>Enter Lab Values</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
                  {manualTests.map((t, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8 }}>
                      <div className="hp-field" style={{ flex: 2 }}>
                        <input
                          value={t.name}
                          onChange={e => updateTest(i, 'name', e.target.value)}
                          placeholder="Test name (e.g. hemoglobin)"
                        />
                      </div>
                      <div className="hp-field" style={{ flex: 1 }}>
                        <input
                          type="number"
                          value={t.value}
                          onChange={e => updateTest(i, 'value', e.target.value)}
                          placeholder="Value"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addTest}
                  className="hp-btn hp-btn-secondary hp-btn-block"
                  style={{ marginBottom: 14, borderStyle: 'dashed' }}
                >
                  + Add Another Test
                </button>
                <button
                  onClick={handleManual}
                  disabled={loading || !canAnalyzeManual}
                  className="hp-btn hp-btn-primary hp-btn-lg hp-btn-block"
                >
                  {loading ? 'Analyzing…' : <>?? Analyze Values</>}
                </button>
              </>
            )}
          </div>

          {/* -- Results --- */}
          {results && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {results.tests?.length > 0 && (
                <div className="hp-card" style={{ padding: 20 }}>
                  <div className="hp-eyebrow" style={{ marginBottom: 12 }}>Lab Results</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {results.tests.map((t, i) => {
                      const sc = STATUS_COLORS[t.status] || '#64748b';
                      return (
                        <div
                          key={i}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '12px 14px', borderRadius: 14,
                            background: '#f8fafc', border: '1.5px solid #f1f5f9',
                          }}
                        >
                          <span style={{ fontSize: 18 }}>{t.icon || '??'}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontFamily: 'Outfit', fontWeight: 700, fontSize: 13.5,
                              color: '#0f172a', textTransform: 'capitalize',
                            }}>{t.name}</div>
                            {t.reference_range && (
                              <div style={{ fontSize: 11, color: '#64748b' }}>
                                Ref: {t.reference_range} {t.unit}
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{
                              fontFamily: 'Outfit', fontWeight: 900, fontSize: 16,
                              color: sc, letterSpacing: '-.02em',
                            }}>
                              {t.value}
                              <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 3 }}>{t.unit}</span>
                            </div>
                            <span style={{
                              fontSize: 10, fontWeight: 700,
                              padding: '2px 8px', borderRadius: 9999,
                              background: sc + '18', color: sc,
                              textTransform: 'uppercase', letterSpacing: '.05em',
                            }}>{t.status}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {results.insights?.length > 0 && (
                <div className="hp-card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 10,
                      background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                      color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <IconSparkle size={16}/>
                    </div>
                    <h3 className="hp-sh" style={{ fontSize: 16 }}>AI Health Insights</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {results.insights.map((ins, i) => {
                      const p = INSIGHT_PALETTE[ins.type] || INSIGHT_PALETTE.info;
                      return (
                        <div
                          key={i}
                          style={{
                            padding: 16, borderRadius: 16,
                            background: p.bg, border: `1.5px solid ${p.border}`,
                          }}
                        >
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
                          }}>
                            <span style={{ fontSize: 16 }}>{ins.icon || p.icon}</span>
                            <span style={{
                              fontFamily: 'Outfit', fontWeight: 800, fontSize: 13.5, color: p.color,
                            }}>{ins.title}</span>
                          </div>
                          <p style={{
                            margin: '0 0 6px', fontSize: 13, color: '#334155', lineHeight: 1.6,
                          }}>{ins.detail}</p>
                          {ins.action && (
                            <div style={{ fontSize: 12, fontWeight: 700, color: p.color }}>
                              ? {ins.action}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {results.error && (
                <div style={{
                  padding: 14, borderRadius: 16,
                  background: 'linear-gradient(135deg,#fef2f2,#fee2e2)',
                  border: '1.5px solid #fecaca',
                  fontSize: 13, color: '#991b1b', fontWeight: 600,
                }}>?? {results.error}</div>
              )}
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', lineHeight: 1.5, marginTop: 32 }}>
          HealthPredict AI report analysis is for clinical decision support only.<br/>
          Does not replace professional medical advice.
        </div>
      </div>
    </>
  );
}
