import { useState } from 'react';
import Header from '../components/Header';
import useIsDark from '../hooks/useIsDark';

const API = import.meta.env.VITE_API_BASE;

const PRIORITY_CONFIG = {
  high:     { color: '#ef4444', bg: '#fef2f2', darkBg: '#7f1d1d20', label: 'HIGH PRIORITY' },
  moderate: { color: '#f59e0b', bg: '#fff7ed', darkBg: '#78350f20', label: 'MODERATE' },
  low:      { color: '#059669', bg: '#ecfdf5', darkBg: '#064e3b20', label: 'LOW' },
};

export default function LifestyleCoach() {
  const isDark = useIsDark();
  const C = {
    page: isDark ? '#0f172a' : '#f0fdf4',
    card: isDark ? '#1e293b' : '#ffffff',
    border: isDark ? '#334155' : '#e2e8f0',
    text: isDark ? '#f1f5f9' : '#0f172a',
    sub: isDark ? '#94a3b8' : '#64748b',
    inner: isDark ? '#0f172a' : '#f8fafc',
    inBdr: isDark ? '#334155' : '#f1f5f9',
    input: isDark ? '#0f172a' : '#ffffff',
    inpBdr: isDark ? '#475569' : '#e2e8f0',
  };

  const [form, setForm] = useState({
    age: '', gender: 'female', weight: '', height: '',
    sleep_hours: '', exercise_days: '', stress_level: 'moderate',
    diet_quality: 'moderate', conditions: '', mood_trend: 'neutral',
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleGenerate = async () => {
    setLoading(true);
    const w = Number(form.weight) || 0;
    const h = Number(form.height) || 0;
    const bmi = w && h ? w / ((h / 100) ** 2) : 0;
    try {
      const res = await fetch(`${API}/api/lifestyle-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          age: Number(form.age) || 25,
          weight: w, height: h, bmi,
          sleep_hours: Number(form.sleep_hours) || 7,
          exercise_days: Number(form.exercise_days) || 0,
          conditions: form.conditions ? form.conditions.split(',').map(s => s.trim()) : [],
        }),
      });
      const data = await res.json();
      setResults(data);
    } catch {}
    setLoading(false);
  };

  const inputStyle = {
    width: '100%', padding: '0.55rem 0.75rem', borderRadius: 8,
    border: `1.5px solid ${C.inpBdr}`, background: C.input, color: C.text,
    fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  };
  const labelStyle = { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: C.sub, marginBottom: '0.25rem', textTransform: 'uppercase' };

  return (
    <div style={{ minHeight: '100vh', background: C.page, fontFamily: "'Inter', system-ui, sans-serif", transition: 'background 0.3s' }}>
      <style>{`@keyframes lc-fade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}`}</style>
      <Header />
      <main style={{ maxWidth: 1050, margin: '0 auto', padding: '2rem 1.5rem', animation: 'lc-fade 0.5s ease forwards' }}>

        {/* Hero */}
        <div style={{
          background: isDark ? 'linear-gradient(135deg,#064e3b,#0f172a)' : 'linear-gradient(135deg,#ecfdf5,#e0f2fe)',
          borderRadius: 24, padding: '2.5rem', marginBottom: '1.75rem',
          border: `1.5px solid ${isDark ? '#047857' : '#a7f3d0'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2rem' }}>??</span>
            <h1 style={{ margin: 0, fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 900, color: C.text, fontFamily: "'Outfit',sans-serif" }}>
              AI Lifestyle Coach
            </h1>
          </div>
          <p style={{ margin: 0, color: C.sub, fontSize: '0.9rem' }}>Get personalized sleep, diet, exercise, and stress management recommendations based on your health data.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: results ? '380px 1fr' : '1fr', gap: '1.75rem', alignItems: 'start' }}>

          {/* Form */}
          <div style={{ background: C.card, borderRadius: 20, padding: '1.75rem', border: `1.5px solid ${C.border}` }}>
            <h3 style={{ margin: '0 0 1.25rem', fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif" }}>Your Health Profile</h3>

            <div style={{ display: 'grid', gridTemplateColumns: results ? '1fr' : 'repeat(auto-fit,minmax(160px,1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              <div><label style={labelStyle}>Age</label><input type="number" value={form.age} onChange={e=>update('age',e.target.value)} style={inputStyle} min={1} max={120} /></div>
              <div><label style={labelStyle}>Gender</label>
                <select value={form.gender} onChange={e=>update('gender',e.target.value)} style={inputStyle}>
                  <option value="female">Female</option><option value="male">Male</option>
                </select>
              </div>
              <div><label style={labelStyle}>Weight (kg)</label><input type="number" value={form.weight} onChange={e=>update('weight',e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>Height (cm)</label><input type="number" value={form.height} onChange={e=>update('height',e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>Sleep (hrs/night)</label><input type="number" value={form.sleep_hours} onChange={e=>update('sleep_hours',e.target.value)} style={inputStyle} step={0.5} /></div>
              <div><label style={labelStyle}>Exercise (days/week)</label><input type="number" value={form.exercise_days} onChange={e=>update('exercise_days',e.target.value)} style={inputStyle} min={0} max={7} /></div>
              <div><label style={labelStyle}>Stress Level</label>
                <select value={form.stress_level} onChange={e=>update('stress_level',e.target.value)} style={inputStyle}>
                  <option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option>
                </select>
              </div>
              <div><label style={labelStyle}>Diet Quality</label>
                <select value={form.diet_quality} onChange={e=>update('diet_quality',e.target.value)} style={inputStyle}>
                  <option value="poor">Poor</option><option value="moderate">Moderate</option><option value="good">Good</option><option value="excellent">Excellent</option>
                </select>
              </div>
              <div><label style={labelStyle}>Mood Trend</label>
                <select value={form.mood_trend} onChange={e=>update('mood_trend',e.target.value)} style={inputStyle}>
                  <option value="happy">Happy</option><option value="calm">Calm</option><option value="neutral">Neutral</option><option value="stressed">Stressed</option><option value="anxious">Anxious</option><option value="sad">Sad</option>
                </select>
              </div>
              <div><label style={labelStyle}>Conditions</label><input value={form.conditions} onChange={e=>update('conditions',e.target.value)} style={inputStyle} placeholder="e.g. Diabetes, PCOS" /></div>
            </div>

            <button onClick={handleGenerate} disabled={loading}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg,#059669,#0ea5e9)', color: '#fff',
                fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(5,150,105,0.3)',
              }}>
              {loading ? 'Generating...' : '?? Generate Lifestyle Plan'}
            </button>
          </div>

          {/* Results */}
          {results && results.recommendations && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Summary */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {[
                  { label: 'Total', value: results.summary?.total, color: '#3b82f6' },
                  { label: 'High Priority', value: results.summary?.high_priority, color: '#ef4444' },
                  { label: 'Moderate', value: results.summary?.moderate_priority, color: '#f59e0b' },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, background: C.card, borderRadius: 14, padding: '1rem', border: `1.5px solid ${C.border}`, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color, fontFamily: "'Outfit',sans-serif" }}>{s.value}</div>
                    <div style={{ fontSize: '0.7rem', color: C.sub, fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Recommendation cards */}
              {results.recommendations.map((rec, i) => {
                const pCfg = PRIORITY_CONFIG[rec.priority] || PRIORITY_CONFIG.moderate;
                return (
                  <div key={i} style={{ background: C.card, borderRadius: 20, padding: '1.5rem', border: `1.5px solid ${C.border}`, borderLeft: `4px solid ${rec.color}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '1.3rem' }}>{rec.icon}</span>
                      <h4 style={{ margin: 0, fontWeight: 800, color: C.text, flex: 1, fontFamily: "'Outfit',sans-serif" }}>{rec.title}</h4>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: 99, background: pCfg.color + '18', color: pCfg.color, textTransform: 'uppercase' }}>{pCfg.label}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      {rec.tips.map((tip, j) => (
                        <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <span style={{ color: rec.color, fontWeight: 700, flexShrink: 0 }}>•</span>
                          <span style={{ fontSize: '0.82rem', color: C.sub, lineHeight: 1.55 }}>{tip}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: isDark ? rec.color + '15' : rec.color + '08', borderRadius: 8 }}>
                      <span style={{ fontSize: '0.75rem' }}>??</span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: rec.color }}>{rec.target}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
