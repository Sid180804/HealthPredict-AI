import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import useIsDark from '../hooks/useIsDark';

export default function Profile() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const isDark = useIsDark();
  const P = {
    page:    isDark ? '#0f172a'  : '#f1f5f9',
    card:    isDark ? '#1e293b'  : '#ffffff',
    cardBdr: isDark ? '#334155'  : '#f1f5f9',
    inner:   isDark ? '#0f172a'  : '#f8fafc',
    innerBdr:isDark ? '#334155'  : '#f1f5f9',
    text:    isDark ? '#f1f5f9'  : '#0f172a',
    sub:     isDark ? '#94a3b8'  : '#94a3b8',
    muted:   isDark ? '#64748b'  : '#475569',
    input:   isDark ? '#0f172a'  : '#ffffff',
    inputBdr:isDark ? '#475569'  : '#e2e8f0',
    inputTxt:isDark ? '#f1f5f9'  : '#0f172a',
  };

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    city: user?.city || '',
    age: user?.age || '',
    height: user?.height || '',
    weight: user?.weight || '',
    allergies: Array.isArray(user?.allergies) ? user.allergies.join(', ') : (user?.allergies || ''),
    existing_conditions: Array.isArray(user?.existing_conditions) ? user.existing_conditions.join(', ') : (user?.existing_conditions || ''),
    is_smoker: user?.is_smoker || false,
    is_alcohol: user?.is_alcohol || false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const bmi = user?.height && user?.weight
    ? (user.weight / ((user.height / 100) ** 2)).toFixed(1)
    : null;
  const bmiCategory = bmi
    ? bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese'
    : null;
  const bmiColor = bmi
    ? bmi < 18.5 ? '#0ea5e9' : bmi < 25 ? '#059669' : bmi < 30 ? '#f59e0b' : '#ef4444'
    : '#64748b';

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      name: form.name,
      city: form.city,
      age: form.age ? +form.age : undefined,
      height: form.height ? +form.height : undefined,
      weight: form.weight ? +form.weight : undefined,
      allergies: form.allergies ? form.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
      existing_conditions: form.existing_conditions ? form.existing_conditions.split(',').map(s => s.trim()).filter(Boolean) : [],
      is_smoker: form.is_smoker,
      is_alcohol: form.is_alcohol,
    };
    const res = await updateProfile(payload);
    setSaving(false);
    if (res.success) { setSaved(true); setEditing(false); setTimeout(() => setSaved(false), 3000); }
  };

  const inputStyle = { width: '100%', padding: '0.75rem 0.875rem', border: `1.5px solid ${P.inputBdr}`, borderRadius: 10, fontSize: '0.875rem', outline: 'none', color: P.inputTxt, background: P.input, boxSizing: 'border-box', fontFamily: 'inherit' };
  const labelStyle = { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: P.sub, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' };

  const conditions = Array.isArray(user?.existing_conditions) ? user.existing_conditions : (user?.existing_conditions ? [user.existing_conditions] : []);
  const allergies  = Array.isArray(user?.allergies) ? user.allergies : (user?.allergies ? [user.allergies] : []);

  return (
    <div style={{ minHeight: '100vh', background: P.page, fontFamily: "'Inter',system-ui,sans-serif", transition: 'background 0.3s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800;900&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        input:focus,select:focus,textarea:focus{border-color:#059669!important;box-shadow:0 0 0 3px rgba(5,150,105,0.1)}
      `}</style>

      <Header title="My Profile" />

      {saved && (
        <div style={{ position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 2000, padding: '0.875rem 1.25rem', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
          Profile updated successfully!
        </div>
      )}

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem', animation: 'fadeUp 0.4s ease' }}>

        {/* ── Profile Hero Card ─────────────────────────── */}
        <div style={{ background: 'linear-gradient(135deg,#0f172a 0%,#064e3b 60%,#0f172a 100%)', borderRadius: 22, padding: '2.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(5,150,105,0.15) 0%,transparent 70%)', top: -100, right: 50 }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)', backgroundSize: '30px 30px' }} />

          {/* Avatar */}
          <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg,#059669,#047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '2.25rem', flexShrink: 0, boxShadow: '0 0 0 4px rgba(5,150,105,0.3)', position: 'relative' }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
            <div style={{ position: 'absolute', bottom: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: '#22c55e', border: '2px solid #fff' }} />
          </div>

          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 900, color: '#fff', fontFamily: "'Outfit',sans-serif" }}>{user?.name}</h1>
              <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(5,150,105,0.25)', border: '1px solid rgba(5,150,105,0.4)', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, color: '#34d399', textTransform: 'capitalize' }}>{user?.role}</span>
            </div>
            <p style={{ margin: '0 0 1rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>{user?.email} · {user?.city || 'Location not set'}</p>
            <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Age', value: user?.age ? `${user.age} yrs` : '—' },
                { label: 'Height', value: user?.height ? `${user.height} cm` : '—' },
                { label: 'Weight', value: user?.weight ? `${user.weight} kg` : '—' },
              ].map(s => (
                <div key={s.label} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '0.5rem 1rem' }}>
                  <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', fontFamily: "'Outfit',sans-serif" }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', position: 'relative' }}>
            <button onClick={() => setEditing(!editing)}
              style={{ padding: '0.75rem 1.4rem', background: editing ? 'rgba(255,255,255,0.15)' : 'linear-gradient(135deg,#059669,#047857)', color: '#fff', border: editing ? '1.5px solid rgba(255,255,255,0.25)' : 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', boxShadow: editing ? 'none' : '0 6px 18px rgba(5,150,105,0.4)' }}>
              {editing ? '← Cancel Edit' : '✏️ Edit Profile'}
            </button>
            <button onClick={() => navigate('/health-score')}
              style={{ padding: '0.75rem 1.4rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
              📊 Health Score
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', alignItems: 'start' }}>

          {/* ── Left ─────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {editing ? (
              /* EDIT MODE */
              <div style={{ background: P.card, borderRadius: 20, padding: '1.75rem', border: `1.5px solid ${P.cardBdr}`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <h3 style={{ margin: '0 0 1.5rem', fontSize: '1rem', fontWeight: 800, color: P.text, fontFamily: "'Outfit',sans-serif" }}>Edit Your Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.1rem' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Full Name</label>
                    <input value={form.name} onChange={e => set('name', e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Age</label>
                    <input type="number" value={form.age} onChange={e => set('age', e.target.value)} placeholder="e.g. 28" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>City</label>
                    <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Mumbai" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Height (cm)</label>
                    <input type="number" value={form.height} onChange={e => set('height', e.target.value)} placeholder="170" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Weight (kg)</label>
                    <input type="number" value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="70" style={inputStyle} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Known Allergies (comma separated)</label>
                    <input value={form.allergies} onChange={e => set('allergies', e.target.value)} placeholder="Penicillin, Aspirin" style={inputStyle} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Existing Conditions (comma separated)</label>
                    <input value={form.existing_conditions} onChange={e => set('existing_conditions', e.target.value)} placeholder="Diabetes, Hypertension" style={inputStyle} />
                  </div>
                  <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1.5rem' }}>
                    {[['is_smoker','Smoker'],['is_alcohol','Alcohol Consumer']].map(([key, label]) => (
                      <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)} style={{ width: 18, height: 18, accentColor: '#059669' }} />
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: P.muted }}>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.875rem', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: `1px solid ${P.cardBdr}` }}>
                  <button onClick={() => setEditing(false)} style={{ padding: '0.75rem 1.4rem', border: `1.5px solid ${P.inputBdr}`, borderRadius: 12, background: P.card, color: P.muted, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleSave} disabled={saving} style={{ padding: '0.75rem 1.75rem', background: saving ? '#d1fae5' : 'linear-gradient(135deg,#059669,#047857)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 6px 18px rgba(5,150,105,0.3)' }}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              /* VIEW MODE */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Health information */}
                <div style={{ background: P.card, borderRadius: 20, padding: '1.75rem', border: `1.5px solid ${P.cardBdr}`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 800, color: P.text, fontFamily: "'Outfit',sans-serif" }}>Health Information</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                    {[
                      ['Age', user?.age ? `${user.age} years` : '—'],
                      ['Gender', user?.gender || '—'],
                      ['Height', user?.height ? `${user.height} cm` : '—'],
                      ['Weight', user?.weight ? `${user.weight} kg` : '—'],
                      ['City', user?.city || '—'],
                      ['Smoker', user?.is_smoker ? 'Yes' : 'No'],
                      ['Alcohol', user?.is_alcohol ? 'Yes' : 'No'],
                    ].map(([label, val]) => (
                      <div key={label} style={{ padding: '0.875rem 1rem', background: P.inner, border: `1px solid ${P.innerBdr}`, borderRadius: 12 }}>
                        <div style={{ fontSize: '0.68rem', color: P.sub, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{label}</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: P.text }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Allergies & Conditions */}
                <div style={{ background: P.card, borderRadius: 20, padding: '1.75rem', border: `1.5px solid ${P.cardBdr}`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 800, color: P.text, fontFamily: "'Outfit',sans-serif" }}>Medical History</h3>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.625rem' }}>Known Allergies</div>
                    {allergies.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {allergies.map(a => <span key={a} style={{ padding: '0.35rem 0.875rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 99, fontSize: '0.82rem', fontWeight: 700, color: '#dc2626' }}>{a}</span>)}
                      </div>
                    ) : <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem' }}>No known allergies recorded</p>}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.625rem' }}>Existing Conditions</div>
                    {conditions.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {conditions.map(c => <span key={c} style={{ padding: '0.35rem 0.875rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 99, fontSize: '0.82rem', fontWeight: 700, color: '#1d4ed8' }}>{c}</span>)}
                      </div>
                    ) : <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem' }}>No existing conditions recorded</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Right ─────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* BMI Card */}
            {bmi && (
              <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 20, padding: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Body Mass Index</div>
                    <div style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', fontFamily: "'Outfit',sans-serif", lineHeight: 1 }}>{bmi}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: bmiColor, marginTop: '0.3rem' }}>{bmiCategory}</div>
                  </div>
                  <div style={{ fontSize: '2.5rem' }}>⚖️</div>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden', marginBottom: '0.625rem' }}>
                  <div style={{ width: `${Math.min(((bmi - 10) / 30) * 100, 100)}%`, height: '100%', background: `linear-gradient(90deg,#38bdf8,${bmiColor})`, borderRadius: 99 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>
                  <span>Underweight</span><span>Normal</span><span>Obese</span>
                </div>
              </div>
            )}

            {/* Quick stats */}
            <div style={{ background: P.card, borderRadius: 20, padding: '1.75rem', border: `1.5px solid ${P.cardBdr}`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 800, color: P.text, fontFamily: "'Outfit',sans-serif" }}>Account Activity</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { icon: '🔬', label: 'AI Predictions', value: '5', color: '#059669', path: '/predict' },
                  { icon: '💬', label: 'Chat Sessions', value: '12', color: '#7c3aed', path: '/chat' },
                  { icon: '📦', label: 'Orders Placed', value: '3', color: '#0ea5e9', path: '/orders' },
                  { icon: '📊', label: 'Health Scores', value: '2', color: '#f59e0b', path: '/health-score' },
                ].map(s => (
                  <div key={s.label} onClick={() => navigate(s.path)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', background: P.inner, border: `1px solid ${P.innerBdr}`, borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>{s.icon}</div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: P.muted }}>{s.label}</span>
                    </div>
                    <span style={{ fontSize: '1.2rem', fontWeight: 900, color: s.color, fontFamily: "'Outfit',sans-serif" }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div style={{ background: P.card, borderRadius: 20, padding: '1.75rem', border: `1.5px solid ${P.cardBdr}`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 800, color: P.text, fontFamily: "'Outfit',sans-serif" }}>Quick Links</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {[
                  { label: 'Run AI Prediction', icon: '🔬', path: '/predict', color: '#059669' },
                  { label: 'Chat with AI', icon: '💬', path: '/chat', color: '#7c3aed' },
                  { label: 'Scan Prescription', icon: '📄', path: '/ocr', color: '#0ea5e9' },
                  { label: 'Order Medicines', icon: '💊', path: '/orders', color: '#f59e0b' },
                ].map(a => (
                  <button key={a.label} onClick={() => navigate(a.path)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: P.inner, border: `1px solid ${P.innerBdr}`, borderRadius: 11, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                    <span style={{ fontSize: '1rem' }}>{a.icon}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: a.color }}>{a.label}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={a.color} strokeWidth="2.5" strokeLinecap="round" style={{ marginLeft: 'auto' }}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Danger zone */}
            <div style={{ background: '#fef2f2', borderRadius: 20, padding: '1.5rem', border: '1.5px solid #fecaca' }}>
              <h3 style={{ margin: '0 0 0.875rem', fontSize: '0.9rem', fontWeight: 800, color: '#dc2626' }}>Account</h3>
              <button onClick={logout} style={{ width: '100%', padding: '0.75rem', background: '#fff', border: '1.5px solid #fecaca', borderRadius: 11, color: '#dc2626', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
