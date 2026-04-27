import { useState, useEffect } from 'react';
import Header from '../components/Header';
import useIsDark from '../hooks/useIsDark';

const API = import.meta.env.VITE_API_BASE;

export default function Emergency() {
  const isDark = useIsDark();
  const C = {
    page: isDark ? '#0f172a' : '#fef2f2',
    card: isDark ? '#1e293b' : '#ffffff',
    border: isDark ? '#334155' : '#e2e8f0',
    text: isDark ? '#f1f5f9' : '#0f172a',
    sub: isDark ? '#94a3b8' : '#64748b',
    inner: isDark ? '#0f172a' : '#f8fafc',
    inBdr: isDark ? '#334155' : '#fef2f2',
  };

  const [data, setData] = useState(null);
  const [tab, setTab] = useState('contacts');

  useEffect(() => {
    fetch(`${API}/api/emergency`).then(r => r.json()).then(setData).catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: C.page, fontFamily: "'Inter', system-ui, sans-serif", transition: 'background 0.3s' }}>
      <style>{`@keyframes em-fade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}} @keyframes em-pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      <Header />
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem', animation: 'em-fade 0.5s ease forwards' }}>

        {/* Emergency banner */}
        <div style={{
          background: 'linear-gradient(135deg,#991b1b,#dc2626,#b91c1c)',
          borderRadius: 24, padding: '2.5rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', top: -80, right: 60 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', animation: 'em-pulse 1.5s ease-in-out infinite' }}>??</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 900, color: 'white', fontFamily: "'Outfit',sans-serif" }}>Emergency Help</h1>
              <p style={{ margin: '0.25rem 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Quick access to emergency contacts, hospitals, and first aid guides.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a href="tel:112" style={{
              padding: '0.75rem 1.5rem', borderRadius: 12, background: 'rgba(255,255,255,0.2)',
              border: '1.5px solid rgba(255,255,255,0.3)', color: '#fff', fontWeight: 800,
              fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>?? Call 112 (National Emergency)</a>
            <a href="tel:108" style={{
              padding: '0.75rem 1.5rem', borderRadius: 12, background: 'rgba(255,255,255,0.2)',
              border: '1.5px solid rgba(255,255,255,0.3)', color: '#fff', fontWeight: 800,
              fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>?? Call 108 (Ambulance)</a>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: C.card, borderRadius: 14, padding: '0.35rem', border: `1.5px solid ${C.border}` }}>
          {[['contacts','Emergency Numbers'],['hospitals','Nearby Hospitals'],['firstaid','First Aid Guides']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{ flex:1, padding:'0.6rem', borderRadius:10, border:'none', fontWeight:700, fontSize:'0.82rem', cursor:'pointer',
                background: tab===k ? (isDark ? '#7f1d1d' : '#fef2f2') : 'transparent',
                color: tab===k ? '#ef4444' : C.sub, transition: 'all 0.2s' }}>
              {l}
            </button>
          ))}
        </div>

        {!data ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: C.sub }}>Loading emergency data...</div>
        ) : (
          <>
            {/* Contacts */}
            {tab === 'contacts' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
                {data.contacts.map((c, i) => (
                  <a key={i} href={`tel:${c.number}`} style={{ textDecoration: 'none' }}>
                    <div style={{ background: C.card, borderRadius: 16, padding: '1.25rem', border: `1.5px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: isDark ? '#7f1d1d' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>{c.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: C.text, fontSize: '0.875rem' }}>{c.name}</div>
                        <div style={{ fontSize: '0.75rem', color: C.sub }}>{c.description}</div>
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ef4444', fontFamily: "'Outfit',sans-serif", flexShrink: 0 }}>{c.number}</div>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {/* Hospitals */}
            {tab === 'hospitals' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {data.hospitals.map((h, i) => (
                  <div key={i} style={{ background: C.card, borderRadius: 16, padding: '1.25rem', border: `1.5px solid ${C.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: C.text, fontSize: '1rem', fontFamily: "'Outfit',sans-serif" }}>{h.name}</div>
                        <div style={{ fontSize: '0.78rem', color: C.sub, marginTop: '0.2rem' }}>{h.address}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: 99, background: h.type === 'Government' ? '#ecfdf5' : '#eff6ff', color: h.type === 'Government' ? '#059669' : '#3b82f6' }}>{h.type}</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: 99, background: '#fef2f2', color: '#ef4444' }}>{h.distance}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: C.sub }}>? {h.rating}</span>
                      {h.has_icu && <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.4rem', borderRadius: 6, background: '#ecfdf5', color: '#059669' }}>ICU</span>}
                      {h.has_ambulance && <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.4rem', borderRadius: 6, background: '#eff6ff', color: '#3b82f6' }}>Ambulance</span>}
                      {h.open_24h && <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.4rem', borderRadius: 6, background: '#faf5ff', color: '#7c3aed' }}>24/7</span>}
                      <a href={`tel:${h.phone}`} style={{ marginLeft: 'auto', padding: '0.4rem 0.75rem', borderRadius: 8, background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: '0.78rem', textDecoration: 'none' }}>?? {h.phone}</a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* First Aid */}
            {tab === 'firstaid' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: '1rem' }}>
                {data.first_aid.map((fa, i) => (
                  <div key={i} style={{ background: C.card, borderRadius: 16, padding: '1.25rem', border: `1.5px solid ${C.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '1.3rem' }}>{fa.icon}</span>
                      <h4 style={{ margin: 0, fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif" }}>{fa.title}</h4>
                    </div>
                    <ol style={{ margin: 0, paddingLeft: '1.25rem' }}>
                      {fa.steps.map((step, j) => (
                        <li key={j} style={{ fontSize: '0.82rem', color: C.sub, lineHeight: 1.6, marginBottom: '0.35rem' }}>{step}</li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
