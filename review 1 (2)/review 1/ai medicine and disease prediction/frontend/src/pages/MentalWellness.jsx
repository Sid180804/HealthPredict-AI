import { useState, useEffect } from 'react';
import Header from '../components/Header';
import useIsDark from '../hooks/useIsDark';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_BASE;

const MOOD_OPTIONS = [
  { id: 'happy',    emoji: '??', label: 'Happy',    color: '#059669', bg: '#ecfdf5' },
  { id: 'calm',     emoji: '??', label: 'Calm',     color: '#0ea5e9', bg: '#e0f2fe' },
  { id: 'neutral',  emoji: '??', label: 'Neutral',  color: '#64748b', bg: '#f1f5f9' },
  { id: 'tired',    emoji: '??', label: 'Tired',    color: '#f59e0b', bg: '#fff7ed' },
  { id: 'stressed', emoji: '??', label: 'Stressed', color: '#ef4444', bg: '#fef2f2' },
  { id: 'anxious',  emoji: '??', label: 'Anxious',  color: '#7c3aed', bg: '#faf5ff' },
  { id: 'sad',      emoji: '??', label: 'Sad',      color: '#3b82f6', bg: '#eff6ff' },
  { id: 'angry',    emoji: '??', label: 'Angry',    color: '#dc2626', bg: '#fef2f2' },
];

export default function MentalWellness() {
  const isDark = useIsDark();
  const { user } = useAuth();
  const uid = user?.email || 'default';

  const C = {
    page: isDark ? '#0f172a' : '#f0f4ff',
    card: isDark ? '#1e293b' : '#ffffff',
    border: isDark ? '#334155' : '#e2e8f0',
    text: isDark ? '#f1f5f9' : '#0f172a',
    sub: isDark ? '#94a3b8' : '#64748b',
    inner: isDark ? '#0f172a' : '#f8fafc',
    inBdr: isDark ? '#334155' : '#f1f5f9',
    input: isDark ? '#0f172a' : '#ffffff',
    inpBdr: isDark ? '#475569' : '#e2e8f0',
  };

  const [selectedMood, setSelectedMood] = useState(null);
  const [journal, setJournal] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [stressLevel, setStressLevel] = useState('moderate');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('checkin');

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API}/api/mental/history?user_id=${uid}&days=30`);
      const data = await res.json();
      setHistory(data);
    } catch {}
  };

  const handleCheckIn = async () => {
    if (!selectedMood) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/mental/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: uid, mood: selectedMood,
          journal_note: journal, sleep_hours: sleepHours ? Number(sleepHours) : null,
          stress_level: stressLevel,
        }),
      });
      const data = await res.json();
      setResult(data);
      fetchHistory();
    } catch {}
    setLoading(false);
  };

  const moodInfo = selectedMood ? MOOD_OPTIONS.find(m => m.id === selectedMood) : null;

  const inputStyle = {
    width: '100%', padding: '0.65rem 0.875rem', borderRadius: 10,
    border: `1.5px solid ${C.inpBdr}`, background: C.input, color: C.text,
    fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  };

  return (
    <div style={{ minHeight: '100vh', background: C.page, fontFamily: "'Inter', system-ui, sans-serif", transition: 'background 0.3s' }}>
      <style>{`@keyframes mw-fade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}`}</style>
      <Header />
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem', animation: 'mw-fade 0.5s ease forwards' }}>

        {/* Hero */}
        <div style={{
          background: isDark ? 'linear-gradient(135deg,#1e1b4b,#0f172a)' : 'linear-gradient(135deg,#ede9fe,#e0f2fe)',
          borderRadius: 24, padding: '2.5rem', marginBottom: '1.75rem',
          border: `1.5px solid ${isDark ? '#4c1d95' : '#c7d2fe'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2rem' }}>??</span>
            <h1 style={{ margin: 0, fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 900, color: C.text, fontFamily: "'Outfit',sans-serif" }}>
              Mental Wellness
            </h1>
          </div>
          <p style={{ margin: 0, color: C.sub, fontSize: '0.9rem' }}>Track your mood, get AI-powered coping suggestions, and build resilience.</p>
        </div>

        {/* Tab nav */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: C.card, borderRadius: 14, padding: '0.35rem', border: `1.5px solid ${C.border}` }}>
          {[['checkin','Daily Check-in'],['history','Mood History']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{ flex:1, padding:'0.6rem', borderRadius:10, border:'none', fontWeight:700, fontSize:'0.85rem', cursor:'pointer',
                background: tab===k ? (isDark ? '#334155' : '#f1f5f9') : 'transparent',
                color: tab===k ? C.text : C.sub, transition: 'all 0.2s' }}>
              {l}
            </button>
          ))}
        </div>

        {tab === 'checkin' && (
          <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 380px' : '1fr', gap: '1.75rem', alignItems: 'start' }}>
            {/* Check-in form */}
            <div style={{ background: C.card, borderRadius: 20, padding: '1.75rem', border: `1.5px solid ${C.border}` }}>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif" }}>
                How are you feeling today?
              </h3>
              <p style={{ margin: '0 0 1.25rem', color: C.sub, fontSize: '0.82rem' }}>Select the mood that best describes how you feel right now.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {MOOD_OPTIONS.map(m => (
                  <button key={m.id} onClick={() => setSelectedMood(m.id)}
                    style={{
                      padding: '1rem 0.5rem', borderRadius: 16, cursor: 'pointer',
                      border: `2px solid ${selectedMood === m.id ? m.color : C.border}`,
                      background: selectedMood === m.id ? (isDark ? m.color+'20' : m.bg) : C.inner,
                      transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                    }}>
                    <span style={{ fontSize: '1.8rem' }}>{m.emoji}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: selectedMood === m.id ? m.color : C.sub }}>{m.label}</span>
                  </button>
                ))}
              </div>

              {/* Stress level */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: C.sub, marginBottom: '0.4rem', textTransform: 'uppercase' }}>Stress Level</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['low','moderate','high'].map(lvl => {
                    const colors = { low: '#059669', moderate: '#f59e0b', high: '#ef4444' };
                    return (
                      <button key={lvl} onClick={() => setStressLevel(lvl)}
                        style={{
                          flex:1, padding:'0.5rem', borderRadius:10, border: `1.5px solid ${stressLevel===lvl ? colors[lvl] : C.border}`,
                          background: stressLevel===lvl ? colors[lvl]+'20' : C.inner,
                          color: stressLevel===lvl ? colors[lvl] : C.sub, fontWeight:700, fontSize:'0.8rem', cursor:'pointer',
                          textTransform: 'capitalize',
                        }}>{lvl}</button>
                    );
                  })}
                </div>
              </div>

              {/* Sleep */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: C.sub, marginBottom: '0.4rem', textTransform: 'uppercase' }}>Sleep Hours (last night)</label>
                <input type="number" value={sleepHours} onChange={e => setSleepHours(e.target.value)} placeholder="e.g. 7" min={0} max={16} step={0.5} style={inputStyle} />
              </div>

              {/* Journal */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: C.sub, marginBottom: '0.4rem', textTransform: 'uppercase' }}>Journal (optional)</label>
                <textarea value={journal} onChange={e => setJournal(e.target.value)} rows={3} placeholder="What's on your mind today?"
                  style={{ ...inputStyle, resize: 'none' }} />
              </div>

              <button onClick={handleCheckIn} disabled={!selectedMood || loading}
                style={{
                  width: '100%', padding: '0.75rem', borderRadius: 12, border: 'none', cursor: selectedMood ? 'pointer' : 'not-allowed',
                  background: selectedMood ? 'linear-gradient(135deg,#7c3aed,#3b82f6)' : (isDark ? '#334155' : '#e2e8f0'),
                  color: selectedMood ? '#fff' : C.sub, fontWeight: 700, fontSize: '0.875rem',
                  boxShadow: selectedMood ? '0 4px 14px rgba(124,58,237,0.3)' : 'none',
                }}>
                {loading ? 'Saving...' : 'Save Check-in'}
              </button>
            </div>

            {/* Suggestions panel */}
            {result && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Mood result */}
                <div style={{ background: C.card, borderRadius: 20, padding: '1.5rem', border: `1.5px solid ${C.border}`, textAlign: 'center' }}>
                  <span style={{ fontSize: '3rem' }}>{result.entry?.emoji}</span>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: C.text, marginTop: '0.5rem', fontFamily: "'Outfit',sans-serif" }}>
                    {result.entry?.label}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: C.sub, marginTop: '0.25rem' }}>Logged today</div>
                </div>

                {/* Streak warning */}
                {result.streak_warning && (
                  <div style={{ background: isDark ? '#7f1d1d' : '#fef2f2', borderRadius: 16, padding: '1rem', border: '1.5px solid #fca5a5' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ef4444', marginBottom: '0.3rem' }}>?? Please Seek Help</div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: isDark ? '#fca5a5' : '#991b1b', lineHeight: 1.5 }}>{result.streak_message}</p>
                  </div>
                )}

                {/* AI Suggestions */}
                <div style={{ background: C.card, borderRadius: 20, padding: '1.5rem', border: `1.5px solid ${C.border}` }}>
                  <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif" }}>?? AI Suggestions</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(result.suggestions || []).map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.75rem', background: C.inner, borderRadius: 12, border: `1px solid ${C.inBdr}` }}>
                        <span style={{ fontSize: '1rem', flexShrink: 0 }}>{s.icon}</span>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: C.sub, lineHeight: 1.55 }}>{s.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'history' && history && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.75rem', alignItems: 'start' }}>
            {/* Mood chart */}
            <div style={{ background: C.card, borderRadius: 20, padding: '1.75rem', border: `1.5px solid ${C.border}` }}>
              <h3 style={{ margin: '0 0 1.25rem', fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif" }}>Mood Over Time</h3>
              {history.entries.length === 0 ? (
                <p style={{ color: C.sub, textAlign: 'center', padding: '2rem 0' }}>No check-ins yet. Start tracking your mood!</p>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-end', height: 160, marginBottom: '1rem' }}>
                    {history.entries.slice(-14).map((e, i) => {
                      const h = (e.mood_score / 5) * 140;
                      const colors = { 5: '#059669', 4: '#0ea5e9', 3: '#64748b', 2: '#f59e0b', 1: '#ef4444' };
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ fontSize: '0.85rem' }}>{e.emoji}</span>
                          <div style={{ width: '100%', height: h, background: colors[e.mood_score] || '#64748b', borderRadius: '4px 4px 0 0', transition: 'height 0.5s' }} />
                          <span style={{ fontSize: '0.55rem', color: C.sub }}>{new Date(e.date+'T12:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Journal entries */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {history.entries.filter(e => e.journal_note).slice(-5).reverse().map((e, i) => (
                      <div key={i} style={{ padding: '0.75rem', background: C.inner, borderRadius: 10, border: `1px solid ${C.inBdr}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                          <span>{e.emoji}</span>
                          <span style={{ fontSize: '0.72rem', color: C.sub }}>{e.date}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: C.text, lineHeight: 1.5 }}>{e.journal_note}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Analytics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ background: C.card, borderRadius: 20, padding: '1.5rem', border: `1.5px solid ${C.border}` }}>
                <h4 style={{ margin: '0 0 1rem', fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif" }}>?? Analytics</h4>
                {[
                  ['Check-ins', history.analytics?.total_checkins || 0],
                  ['Avg Score', `${history.analytics?.average_score || 0}/5`],
                  ['Trend', history.analytics?.trend || 'no data'],
                  ['Top Mood', history.analytics?.most_common_mood || '-'],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: `1px solid ${C.inBdr}` }}>
                    <span style={{ fontSize: '0.82rem', color: C.sub }}>{label}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: C.text, textTransform: 'capitalize' }}>{val}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: C.card, borderRadius: 20, padding: '1.5rem', border: `1.5px solid ${C.border}` }}>
                <h4 style={{ margin: '0 0 0.75rem', fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif" }}>Mood Distribution</h4>
                {Object.entries(history.analytics?.mood_distribution || {}).map(([mood, count]) => {
                  const info = MOOD_OPTIONS.find(m => m.id === mood);
                  const pct = history.analytics?.total_checkins > 0 ? (count / history.analytics.total_checkins * 100) : 0;
                  return (
                    <div key={mood} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.9rem' }}>{info?.emoji || '??'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 8, background: C.inBdr, borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: info?.color || '#64748b', borderRadius: 99 }} />
                        </div>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: C.sub, fontWeight: 600, minWidth: 30, textAlign: 'right' }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
