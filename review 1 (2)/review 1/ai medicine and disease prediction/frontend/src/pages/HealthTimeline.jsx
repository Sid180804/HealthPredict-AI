import { useState, useEffect } from 'react';
import Header from '../components/Header';
import useIsDark from '../hooks/useIsDark';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_BASE;

const TYPE_CONFIG = {
  prediction:  { icon: '??', color: '#059669', label: 'Prediction' },
  appointment: { icon: '???', color: '#3b82f6', label: 'Appointment' },
  symptom:     { icon: '??', color: '#f59e0b', label: 'Symptom' },
  medication:  { icon: '??', color: '#7c3aed', label: 'Medication' },
  report:      { icon: '??', color: '#0ea5e9', label: 'Report' },
  cycle:       { icon: '??', color: '#ec4899', label: 'Cycle' },
  mental:      { icon: '??', color: '#8b5cf6', label: 'Mental' },
  reminder:    { icon: '??', color: '#f97316', label: 'Reminder' },
  custom:      { icon: '??', color: '#64748b', label: 'Note' },
};

export default function HealthTimeline() {
  const isDark = useIsDark();
  const { user } = useAuth();
  const uid = user?.email || 'default';

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
    line: isDark ? '#334155' : '#e2e8f0',
  };

  const [timeline, setTimeline] = useState(null);
  const [filter, setFilter] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newEvent, setNewEvent] = useState({ type: 'custom', title: '', detail: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTimeline = async () => {
    setLoading(true);
    setError('');
    try {
      let url = `${API}/api/timeline?user_id=${uid}&limit=100`;
      if (filter) url += `&type=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setTimeline(data);
    } catch (err) {
      setError('Failed to load health timeline. Please try again.');
    }
    setLoading(false);
  };

  useEffect(() => { fetchTimeline(); }, [filter]);

  const handleAdd = async () => {
    if (!newEvent.title.trim()) return;
    try {
      await fetch(`${API}/api/timeline/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: uid, ...newEvent }),
      });
      setNewEvent({ type: 'custom', title: '', detail: '' });
      setShowAdd(false);
      fetchTimeline();
    } catch (err) {
      setError('Failed to add event. Please try again.');
    }
  };

  const inputStyle = {
    width: '100%', padding: '0.65rem 0.875rem', borderRadius: 10,
    border: `1.5px solid ${C.inpBdr}`, background: C.input, color: C.text,
    fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  };

  return (
    <div style={{ minHeight: '100vh', background: C.page, fontFamily: "'Inter', system-ui, sans-serif", transition: 'background 0.3s' }}>
      <style>{`@keyframes tl-fade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}`}</style>
      <Header />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem', animation: 'tl-fade 0.5s ease forwards' }}>

        {/* Hero */}
        <div style={{
          background: isDark ? 'linear-gradient(135deg,#0c4a6e,#0f172a)' : 'linear-gradient(135deg,#e0f2fe,#ede9fe)',
          borderRadius: 24, padding: '2.5rem', marginBottom: '1.75rem',
          border: `1.5px solid ${isDark ? '#0369a1' : '#bae6fd'}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '2rem' }}>??</span>
                <h1 style={{ margin: 0, fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 900, color: C.text, fontFamily: "'Outfit',sans-serif" }}>
                  Health Timeline
                </h1>
              </div>
              <p style={{ margin: 0, color: C.sub, fontSize: '0.9rem' }}>Your complete health history in one place.</p>
            </div>
            <button onClick={() => setShowAdd(s => !s)}
              style={{ padding: '0.6rem 1.25rem', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
              + Add Event
            </button>
          </div>
        </div>

        {/* Add event */}
        {showAdd && (
          <div style={{ background: C.card, borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', border: `1.5px solid ${C.border}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: C.sub, marginBottom: '0.3rem', textTransform: 'uppercase' }}>Type</label>
                <select value={newEvent.type} onChange={e => setNewEvent(p => ({...p, type: e.target.value}))} style={inputStyle}>
                  {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.icon} {v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: C.sub, marginBottom: '0.3rem', textTransform: 'uppercase' }}>Title</label>
                <input value={newEvent.title} onChange={e => setNewEvent(p => ({...p, title: e.target.value}))} placeholder="What happened?" style={inputStyle} />
              </div>
            </div>
            <textarea value={newEvent.detail} onChange={e => setNewEvent(p => ({...p, detail: e.target.value}))} placeholder="Details (optional)" rows={2} style={{ ...inputStyle, resize: 'none', marginBottom: '0.75rem' }} />
            <button onClick={handleAdd}
              style={{ padding: '0.55rem 1.5rem', borderRadius: 10, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
              Save
            </button>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => setFilter(null)}
            style={{ padding: '0.35rem 0.75rem', borderRadius: 99, border: `1.5px solid ${!filter ? '#3b82f6' : C.border}`, background: !filter ? '#3b82f620' : 'transparent', color: !filter ? '#3b82f6' : C.sub, fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>
            All
          </button>
          {Object.entries(TYPE_CONFIG).map(([k, v]) => (
            <button key={k} onClick={() => setFilter(k)}
              style={{ padding: '0.35rem 0.75rem', borderRadius: 99, border: `1.5px solid ${filter===k ? v.color : C.border}`, background: filter===k ? v.color+'20' : 'transparent', color: filter===k ? v.color : C.sub, fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '1rem 1.25rem', background: isDark ? '#7f1d1d20' : '#fef2f2', borderRadius: 14, border: '1.5px solid #fca5a5', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>?? {error}</span>
            <button onClick={fetchTimeline} style={{ padding: '0.35rem 0.85rem', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>Retry</button>
          </div>
        )}

        {/* Timeline */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: C.sub }}>Loading...</div>
        ) : !timeline || timeline.total === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: C.card, borderRadius: 20, border: `1.5px dashed ${C.border}` }}>
            <span style={{ fontSize: '3rem' }}>??</span>
            <h3 style={{ margin: '1rem 0 0.5rem', color: C.text, fontFamily: "'Outfit',sans-serif" }}>No Events Yet</h3>
            <p style={{ color: C.sub, fontSize: '0.85rem' }}>Your health timeline will populate as you use predictions, appointments, and other features.</p>
          </div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: '2.5rem' }}>
            {/* Vertical line */}
            <div style={{ position: 'absolute', left: 15, top: 0, bottom: 0, width: 2, background: C.line }} />

            {Object.entries(timeline.grouped || {}).map(([date, events]) => (
              <div key={date} style={{ marginBottom: '1.5rem' }}>
                {/* Date header */}
                <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                  <div style={{ position: 'absolute', left: -22, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, borderRadius: '50%', background: '#3b82f6', border: `3px solid ${C.page}` }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#3b82f6' }}>
                    {new Date(date + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                {events.map((ev) => {
                  const cfg = TYPE_CONFIG[ev.type] || TYPE_CONFIG.custom;
                  return (
                    <div key={ev.id} style={{ position: 'relative', marginBottom: '0.6rem' }}>
                      <div style={{ position: 'absolute', left: -22, top: 16, width: 8, height: 8, borderRadius: '50%', background: cfg.color, border: `2px solid ${C.page}` }} />
                      <div style={{ background: C.card, borderRadius: 14, padding: '1rem', border: `1.5px solid ${C.border}`, marginLeft: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '1rem' }}>{cfg.icon}</span>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.12rem 0.4rem', borderRadius: 99, background: cfg.color + '20', color: cfg.color, textTransform: 'uppercase' }}>{cfg.label}</span>
                          <span style={{ fontSize: '0.7rem', color: C.sub, marginLeft: 'auto' }}>
                            {new Date(ev.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: C.text }}>{ev.title}</div>
                        {ev.detail && <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: C.sub, lineHeight: 1.5 }}>{ev.detail}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
