import { useState } from 'react';
import Header from '../components/Header';
import useIsDark from '../hooks/useIsDark';

const API = import.meta.env.VITE_API_BASE;

const SEVERITY_CONFIG = {
  high:     { color: '#ef4444', bg: '#fef2f2', darkBg: '#7f1d1d20', label: 'AVOID', icon: '??' },
  moderate: { color: '#f59e0b', bg: '#fff7ed', darkBg: '#78350f20', label: 'CAUTION', icon: '??' },
  low:      { color: '#0ea5e9', bg: '#e0f2fe', darkBg: '#0c496320', label: 'MINOR', icon: '??' },
  safe:     { color: '#059669', bg: '#ecfdf5', darkBg: '#064e3b20', label: 'SAFE', icon: '?' },
};

export default function MedicineInteractions() {
  const isDark = useIsDark();
  const C = {
    page: isDark ? '#0f172a' : '#f1f5f9',
    card: isDark ? '#1e293b' : '#ffffff',
    border: isDark ? '#334155' : '#e2e8f0',
    text: isDark ? '#f1f5f9' : '#0f172a',
    sub: isDark ? '#94a3b8' : '#64748b',
    inner: isDark ? '#0f172a' : '#f8fafc',
    inBdr: isDark ? '#334155' : '#f1f5f9',
    input: isDark ? '#0f172a' : '#ffffff',
    inpBdr: isDark ? '#475569' : '#e2e8f0',
  };

  const [medicines, setMedicines] = useState(['', '']);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const updateMed = (i, val) => {
    const copy = [...medicines];
    copy[i] = val;
    setMedicines(copy);
  };

  const addMed = () => setMedicines(prev => [...prev, '']);
  const removeMed = (i) => {
    if (medicines.length <= 2) return;
    setMedicines(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleCheck = async () => {
    const valid = medicines.filter(m => m.trim());
    if (valid.length < 2) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/check-interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicines: valid, use_ai: true }),
      });
      const data = await res.json();
      setResults(data);
    } catch {}
    setLoading(false);
  };

  const inputStyle = {
    flex: 1, padding: '0.65rem 0.875rem', borderRadius: 10,
    border: `1.5px solid ${C.inpBdr}`, background: C.input, color: C.text,
    fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit',
  };

  return (
    <div style={{ minHeight: '100vh', background: C.page, fontFamily: "'Inter', system-ui, sans-serif", transition: 'background 0.3s' }}>
      <style>{`@keyframes mi-fade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}`}</style>
      <Header />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem', animation: 'mi-fade 0.5s ease forwards' }}>

        {/* Hero */}
        <div style={{
          background: isDark ? 'linear-gradient(135deg,#1c1917,#0f172a)' : 'linear-gradient(135deg,#fff7ed,#fef2f2)',
          borderRadius: 24, padding: '2.5rem', marginBottom: '1.75rem',
          border: `1.5px solid ${isDark ? '#78350f' : '#fed7aa'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2rem' }}>??</span>
            <h1 style={{ margin: 0, fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 900, color: C.text, fontFamily: "'Outfit',sans-serif" }}>
              Medicine Interaction Checker
            </h1>
          </div>
          <p style={{ margin: 0, color: C.sub, fontSize: '0.9rem' }}>Enter your medicines to check for drug-drug and drug-food interactions.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: results ? '1fr 1fr' : '1fr', gap: '1.75rem', alignItems: 'start' }}>

          {/* Input panel */}
          <div style={{ background: C.card, borderRadius: 20, padding: '1.75rem', border: `1.5px solid ${C.border}` }}>
            <h3 style={{ margin: '0 0 1.25rem', fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif" }}>Enter Medicines</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              {medicines.map((med, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: C.sub, width: 24 }}>{i+1}.</span>
                  <input value={med} onChange={e => updateMed(i, e.target.value)}
                    placeholder={i === 0 ? 'e.g. Paracetamol 500mg' : i === 1 ? 'e.g. Alcohol' : 'Medicine name'}
                    style={inputStyle}
                    onKeyDown={e => e.key === 'Enter' && handleCheck()}
                  />
                  {medicines.length > 2 && (
                    <button onClick={() => removeMed(i)}
                      style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${C.border}`, background: 'transparent', color: '#ef4444', cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}>
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <button onClick={addMed}
                style={{ flex: 1, padding: '0.55rem', borderRadius: 10, border: `1.5px dashed ${C.border}`, background: 'transparent', color: C.sub, fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
                + Add Another Medicine
              </button>
            </div>

            <button onClick={handleCheck} disabled={medicines.filter(m=>m.trim()).length < 2 || loading}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: 12, border: 'none',
                background: medicines.filter(m=>m.trim()).length >= 2 ? 'linear-gradient(135deg,#f59e0b,#ef4444)' : (isDark ? '#334155' : '#e2e8f0'),
                color: medicines.filter(m=>m.trim()).length >= 2 ? '#fff' : C.sub,
                fontWeight: 700, fontSize: '0.875rem', cursor: medicines.filter(m=>m.trim()).length >= 2 ? 'pointer' : 'not-allowed',
                boxShadow: medicines.filter(m=>m.trim()).length >= 2 ? '0 4px 14px rgba(245,158,11,0.3)' : 'none',
              }}>
              {loading ? 'Checking...' : '?? Check Interactions'}
            </button>

            {/* Common combos */}
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: C.sub, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Quick Examples</div>
              {[
                ['Paracetamol', 'Alcohol'],
                ['Ibuprofen', 'Aspirin'],
                ['Ciprofloxacin', 'Dairy'],
                ['Warfarin', 'Aspirin'],
              ].map(([a, b], i) => (
                <button key={i} onClick={() => { setMedicines([a, b]); setResults(null); }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', marginBottom: '0.35rem', background: C.inner, borderRadius: 8, border: `1px solid ${C.inBdr}`, color: C.text, fontSize: '0.8rem', cursor: 'pointer' }}>
                  {a} + {b}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          {results && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: C.card, borderRadius: 20, padding: '1.5rem', border: `1.5px solid ${C.border}` }}>
                <h3 style={{ margin: '0 0 1.25rem', fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif" }}>Interaction Results</h3>

                {(results.interactions || []).map((r, i) => {
                  const sev = SEVERITY_CONFIG[r.severity] || SEVERITY_CONFIG.safe;
                  return (
                    <div key={i} style={{
                      padding: '1rem', marginBottom: '0.75rem', borderRadius: 14,
                      background: isDark ? sev.darkBg : sev.bg,
                      border: `1.5px solid ${sev.color}30`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>{sev.icon}</span>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 99,
                          background: sev.color + '20', color: sev.color, textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>{sev.label}</span>
                        {r.category && (
                          <span style={{ fontSize: '0.7rem', color: C.sub, fontWeight: 600 }}>({r.category})</span>
                        )}
                      </div>
                      {r.medicine_1 && r.medicine_2 && (
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: C.text, marginBottom: '0.35rem' }}>
                          {r.medicine_1} ? {r.medicine_2}
                        </div>
                      )}
                      <p style={{ margin: 0, fontSize: '0.8rem', color: C.sub, lineHeight: 1.6 }}>{r.warning}</p>
                    </div>
                  );
                })}
              </div>

              <div style={{
                background: isDark ? 'rgba(30,41,59,0.8)' : '#fef3cd',
                borderRadius: 14, padding: '1rem', border: `1.5px solid ${isDark ? '#78350f' : '#f59e0b40'}`,
              }}>
                <p style={{ margin: 0, fontSize: '0.78rem', color: isDark ? '#fcd34d' : '#92400e', lineHeight: 1.6 }}>
                  ?? <strong>Disclaimer:</strong> This tool provides general information only. Always consult your doctor or pharmacist before combining medications. This is not a substitute for professional medical advice.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
