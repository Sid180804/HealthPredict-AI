import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import useIsDark from '../hooks/useIsDark';
import CycleCalendar from '../components/womens-health/CycleCalendar';
import SymptomTracker from '../components/womens-health/SymptomTracker';
import FertilityInsights from '../components/womens-health/FertilityInsights';

/* ── helpers ─────────────────────────────────────────────── */
function daysBetween(a, b) {
  return Math.round((b - a) / 86400000);
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toDateStr(date) {
  return date.toISOString().split('T')[0];
}

/* ── Phase detection ──────────────────────────────────────── */
function getPhaseInfo(lastPeriodDate, cycleLength, periodDuration) {
  if (!lastPeriodDate) return { phase: 'follicular', cycleDay: 1, ovulationInDays: cycleLength - 14, nextPeriodInDays: cycleLength };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(lastPeriodDate);
  start.setHours(0, 0, 0, 0);

  const daysSinceStart = daysBetween(start, today);
  const cycleDay = (daysSinceStart % cycleLength) + 1;

  const ovulationDay   = cycleLength - 14;
  const fertileStart   = ovulationDay - 5;

  let phase;
  if (cycleDay <= periodDuration)                          phase = 'period';
  else if (cycleDay >= fertileStart && cycleDay < ovulationDay) phase = 'fertile'; // show as follicular outside
  else if (cycleDay === ovulationDay || cycleDay === ovulationDay + 1) phase = 'ovulation';
  else if (cycleDay < fertileStart)                        phase = 'follicular';
  else                                                     phase = 'luteal';

  const ovulationInDays   = ovulationDay - cycleDay;
  const nextPeriodInDays  = cycleLength - cycleDay + 1;

  return { phase, cycleDay, ovulationInDays, nextPeriodInDays };
}

/* ── PHASE display meta ──────────────────────────────────── */
const PHASE_META = {
  period:     { label: 'Menstrual',  color: '#ec4899', bg: '#fce7f3', emoji: '🌸' },
  follicular: { label: 'Follicular', color: '#8b5cf6', bg: '#ede9fe', emoji: '🌱' },
  fertile:    { label: 'Fertile',    color: '#7c3aed', bg: '#ede9fe', emoji: '🌟' },
  ovulation:  { label: 'Ovulation',  color: '#7c3aed', bg: '#f3e8ff', emoji: '✨' },
  luteal:     { label: 'Luteal',     color: '#f59e0b', bg: '#fff7ed', emoji: '🌙' },
};

/* ── HistoryChart sub-component ──────────────────────────── */
function HistoryChart({ history, C, isDark }) {
  if (!history || history.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: C.sub, fontSize: '0.875rem' }}>
        No history yet. Start logging your symptoms to see patterns.
      </div>
    );
  }

  const last7 = [...history].slice(-7);
  const INTENSE = { Mild: 1, Moderate: 2, Severe: 3 };

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', height: 80, marginBottom: '0.75rem' }}>
        {last7.map((entry, i) => {
          const h = (INTENSE[entry.intensity] || 1) / 3 * 70;
          const colors = { Mild: '#34d399', Moderate: '#fbbf24', Severe: '#f87171' };
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
              <div style={{ width: '100%', height: h, background: colors[entry.intensity] || '#34d399', borderRadius: '4px 4px 0 0' }} />
              <span style={{ fontSize: '0.6rem', color: C.sub }}>{new Date(entry.date + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {[['#34d399', 'Mild'], ['#fbbf24', 'Moderate'], ['#f87171', 'Severe']].map(([color, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
            <span style={{ fontSize: '0.7rem', color: C.sub }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────── */
export default function WomensHealthDashboard() {
  const navigate = useNavigate();
  const isDark   = useIsDark();

  const C = {
    page:   isDark ? '#0f172a'  : '#fdf2f8',
    card:   isDark ? '#1e293b'  : '#ffffff',
    border: isDark ? '#334155'  : '#fce7f3',
    text:   isDark ? '#f1f5f9'  : '#0f172a',
    sub:    isDark ? '#94a3b8'  : '#64748b',
    inner:  isDark ? '#0f172a'  : '#fdf2f8',
    inBdr:  isDark ? '#334155'  : '#fce7f3',
    input:  isDark ? '#0f172a'  : '#ffffff',
    inpBdr: isDark ? '#475569'  : '#e2e8f0',
    hero:   isDark ? 'linear-gradient(135deg, #1a0533 0%, #0f172a 50%, #1a0533 100%)'
                   : 'linear-gradient(135deg, #fdf4ff 0%, #fce7f3 50%, #ede9fe 100%)',
  };

  /* ── Persistent state ──────────────────────────────────── */
  const [cycleData, setCycleData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cycleData')) || {};
    } catch { return {}; }
  });

  const [symptomHistory, setSymptomHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('symptomHistory')) || [];
    } catch { return []; }
  });

  const [pregnancyMode, setPregnancyMode] = useState(
    () => localStorage.getItem('pregnancyMode') === 'true'
  );

  /* ── Setup form state ─────────────────────────────────── */
  const [showSetup, setShowSetup]         = useState(!cycleData.lastPeriodDate);
  const [formLastPeriod, setFormLastPeriod] = useState(cycleData.lastPeriodDate || '');
  const [formCycleLen, setFormCycleLen]   = useState(cycleData.cycleLength || 28);
  const [formPeriodDur, setFormPeriodDur] = useState(cycleData.periodDuration || 5);

  /* ── Selected day for symptom tracker ────────────────── */
  const [selectedDay, setSelectedDay] = useState(toDateStr(new Date()));

  /* ── Reminder state ──────────────────────────────────── */
  const [reminders, setReminders] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cycleReminders')) || []; }
    catch { return []; }
  });
  const [newReminder, setNewReminder] = useState('');

  /* ── Derived cycle info ───────────────────────────────── */
  const { phase, cycleDay, ovulationInDays, nextPeriodInDays } = useMemo(
    () => getPhaseInfo(cycleData.lastPeriodDate, cycleData.cycleLength || 28, cycleData.periodDuration || 5),
    [cycleData]
  );

  const phaseMeta = PHASE_META[phase] || PHASE_META.follicular;

  /* ── Computed dates ───────────────────────────────────── */
  const ovulationDate = cycleData.lastPeriodDate
    ? toDateStr(addDays(new Date(cycleData.lastPeriodDate), (cycleData.cycleLength || 28) - 14))
    : null;

  const nextPeriodDate = cycleData.lastPeriodDate
    ? toDateStr(addDays(new Date(cycleData.lastPeriodDate), cycleData.cycleLength || 28))
    : null;

  /* ── Persistence ──────────────────────────────────────── */
  useEffect(() => {
    localStorage.setItem('cycleData', JSON.stringify(cycleData));
  }, [cycleData]);

  useEffect(() => {
    localStorage.setItem('symptomHistory', JSON.stringify(symptomHistory));
  }, [symptomHistory]);

  useEffect(() => {
    localStorage.setItem('pregnancyMode', pregnancyMode);
  }, [pregnancyMode]);

  useEffect(() => {
    localStorage.setItem('cycleReminders', JSON.stringify(reminders));
  }, [reminders]);

  /* ── Handlers ─────────────────────────────────────────── */
  const saveSetup = () => {
    if (!formLastPeriod) return;
    setCycleData({ lastPeriodDate: formLastPeriod, cycleLength: Number(formCycleLen), periodDuration: Number(formPeriodDur) });
    setShowSetup(false);
  };

  const handleSymptomSave = (entry) => {
    setSymptomHistory(prev => {
      const filtered = prev.filter(e => e.date !== entry.date);
      return [...filtered, entry].sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  const existingSymptoms = symptomHistory.find(e => e.date === selectedDay) || {};

  const addReminder = () => {
    if (!newReminder.trim()) return;
    setReminders(prev => [...prev, { text: newReminder.trim(), id: Date.now() }]);
    setNewReminder('');
  };

  /* ── Most common symptoms ─────────────────────────────── */
  const topSymptoms = useMemo(() => {
    const freq = {};
    symptomHistory.forEach(e => (e.symptoms || []).forEach(s => { freq[s] = (freq[s] || 0) + 1; }));
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [symptomHistory]);

  /* ── Input style ──────────────────────────────────────── */
  const inputStyle = {
    width: '100%', padding: '0.65rem 0.875rem', borderRadius: 10,
    border: `1.5px solid ${C.inpBdr}`, background: C.input, color: C.text,
    fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    display: 'block', fontSize: '0.78rem', fontWeight: 700, color: C.sub,
    marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em',
  };

  /* ─────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: C.page, fontFamily: "'Inter', system-ui, sans-serif", transition: 'background 0.3s' }}>
      <style>{`
        @keyframes wh-fade { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        .wh-card { transition: box-shadow 0.2s, background 0.3s; }
        .wh-card:hover { box-shadow: 0 8px 30px rgba(236,72,153,0.1) !important; }
      `}</style>
      <Header />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem', animation: 'wh-fade 0.5s ease forwards' }}>

        {/* ── Hero banner ───────────────────────────────── */}
        <div style={{
          background: isDark
            ? 'linear-gradient(135deg, #2d0a4e 0%, #1a0a3e 40%, #0f172a 100%)'
            : 'linear-gradient(135deg, #fdf4ff 0%, #fce7f3 50%, #ede9fe 100%)',
          borderRadius: 24, padding: '2.5rem', marginBottom: '1.75rem',
          border: `1.5px solid ${isDark ? '#4c1d95' : '#f3e8ff'}`,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* decorative circles */}
          <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)', top: -60, right: 80, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: 150, height: 150, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', bottom: -40, right: 240, pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', position: 'relative' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '2rem' }}>🌸</span>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ec4899', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Women's Health</div>
                  <h1 style={{ margin: 0, fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900, color: C.text, fontFamily: "'Outfit',sans-serif" }}>
                    Menstrual Cycle Tracker
                  </h1>
                </div>
              </div>
              <p style={{ margin: 0, color: C.sub, fontSize: '0.9rem', maxWidth: 480 }}>
                Track your cycle, understand your body, and get personalised health insights every day.
              </p>
            </div>

            {/* Pregnancy mode toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: isDark ? 'rgba(236,72,153,0.1)' : '#fff', padding: '0.75rem 1.25rem', borderRadius: 14, border: `1.5px solid ${isDark ? '#be185d40' : '#fce7f3'}` }}>
                <span style={{ fontSize: '1.1rem' }}>🤰</span>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: C.text }}>Pregnancy Mode</div>
                  <div style={{ fontSize: '0.7rem', color: C.sub }}>Conception tracking tips</div>
                </div>
                <div
                  onClick={() => setPregnancyMode(p => !p)}
                  style={{
                    width: 44, height: 24, borderRadius: 99, background: pregnancyMode ? '#ec4899' : (isDark ? '#334155' : '#e2e8f0'),
                    position: 'relative', cursor: 'pointer', transition: 'background 0.25s',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 3, left: pregnancyMode ? 23 : 3, width: 18, height: 18,
                    borderRadius: '50%', background: '#fff', transition: 'left 0.25s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  }} />
                </div>
              </div>
              <button onClick={() => setShowSetup(s => !s)}
                style={{ padding: '0.55rem 1.25rem', borderRadius: 10, border: `1.5px solid ${isDark ? '#be185d' : '#ec4899'}`, background: 'transparent', color: '#ec4899', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                ⚙️ {showSetup ? 'Close Setup' : 'Edit Cycle Settings'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Setup panel ───────────────────────────────── */}
        {showSetup && (
          <div className="wh-card" style={{ background: C.card, borderRadius: 20, padding: '1.75rem', marginBottom: '1.75rem', border: `1.5px solid ${isDark ? '#4c1d95' : '#f3e8ff'}`, boxShadow: '0 4px 24px rgba(236,72,153,0.08)' }}>
            <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif" }}>
              🗓️ Cycle Settings
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Last Period Start Date</label>
                <input type="date" value={formLastPeriod} onChange={e => setFormLastPeriod(e.target.value)}
                  max={toDateStr(new Date())} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Average Cycle Length (days)</label>
                <input type="number" value={formCycleLen} min={21} max={45}
                  onChange={e => setFormCycleLen(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Period Duration (days)</label>
                <input type="number" value={formPeriodDur} min={2} max={10}
                  onChange={e => setFormPeriodDur(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
              <button onClick={saveSetup}
                style={{ padding: '0.65rem 2rem', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(236,72,153,0.3)' }}>
                Save Settings
              </button>
              {cycleData.lastPeriodDate && (
                <button onClick={() => setShowSetup(false)}
                  style={{ padding: '0.65rem 1.5rem', borderRadius: 10, border: `1.5px solid ${C.inpBdr}`, background: 'transparent', color: C.sub, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Summary cards row ─────────────────────────── */}
        {cycleData.lastPeriodDate && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
            {[
              {
                icon: phaseMeta.emoji,
                label: 'Current Phase',
                value: phaseMeta.label,
                sub: `Day ${cycleDay} of ${cycleData.cycleLength || 28}`,
                color: phaseMeta.color,
                bg: isDark ? phaseMeta.color + '20' : phaseMeta.bg,
              },
              {
                icon: '🩸',
                label: 'Next Period',
                value: nextPeriodInDays === 0 ? 'Today' : nextPeriodInDays < 0 ? `${Math.abs(nextPeriodInDays)}d late` : `${nextPeriodInDays} days`,
                sub: nextPeriodDate ? new Date(nextPeriodDate + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '',
                color: '#ec4899',
                bg: isDark ? '#ec489920' : '#fce7f3',
              },
              {
                icon: '✨',
                label: 'Ovulation',
                value: ovulationInDays === 0 ? 'Today!' : ovulationInDays < 0 ? `${Math.abs(ovulationInDays)}d ago` : `in ${ovulationInDays}d`,
                sub: ovulationDate ? new Date(ovulationDate + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '',
                color: '#7c3aed',
                bg: isDark ? '#7c3aed20' : '#ede9fe',
              },
              {
                icon: '📊',
                label: 'Cycle Length',
                value: `${cycleData.cycleLength || 28} days`,
                sub: `${cycleData.periodDuration || 5} day period`,
                color: '#059669',
                bg: isDark ? '#05966920' : '#ecfdf5',
              },
              {
                icon: '📝',
                label: 'Logs This Month',
                value: symptomHistory.filter(e => {
                  const d = new Date(e.date + 'T12:00:00');
                  const t = new Date();
                  return d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
                }).length,
                sub: 'symptom entries',
                color: '#f59e0b',
                bg: isDark ? '#f59e0b20' : '#fff7ed',
              },
            ].map((s, i) => (
              <div key={i} className="wh-card" style={{ background: C.card, borderRadius: 18, padding: '1.25rem', border: `1.5px solid ${C.border}`, boxShadow: '0 2px 12px rgba(236,72,153,0.05)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', marginBottom: '0.75rem' }}>{s.icon}</div>
                <div style={{ fontSize: '0.72rem', color: C.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>{s.label}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: s.color, fontFamily: "'Outfit',sans-serif", lineHeight: 1.1 }}>{s.value}</div>
                <div style={{ fontSize: '0.72rem', color: C.sub, marginTop: '0.25rem' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── No setup CTA ──────────────────────────────── */}
        {!cycleData.lastPeriodDate && !showSetup && (
          <div style={{ textAlign: 'center', padding: '3rem 2rem', background: C.card, borderRadius: 20, marginBottom: '1.75rem', border: `1.5px dashed ${isDark ? '#4c1d95' : '#f3e8ff'}` }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌸</div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif" }}>Set up your cycle tracker</h3>
            <p style={{ margin: '0 0 1.5rem', color: C.sub, fontSize: '0.875rem' }}>Enter your last period date to get started with personalised insights.</p>
            <button onClick={() => setShowSetup(true)}
              style={{ padding: '0.75rem 2rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(236,72,153,0.3)' }}>
              Get Started →
            </button>
          </div>
        )}

        {/* ── Main grid ─────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.75rem', alignItems: 'start' }}>

          {/* ── LEFT ──────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

            {/* Calendar */}
            <div className="wh-card" style={{ borderRadius: 20, boxShadow: '0 2px 12px rgba(236,72,153,0.06)' }}>
              <CycleCalendar
                lastPeriodDate={cycleData.lastPeriodDate}
                cycleLength={cycleData.cycleLength || 28}
                periodDuration={cycleData.periodDuration || 5}
                onDayClick={(day) => setSelectedDay(day)}
              />
            </div>

            {/* Symptom tracker */}
            <SymptomTracker
              date={selectedDay}
              onSave={handleSymptomSave}
              existing={existingSymptoms}
            />

            {/* Reminders */}
            <div className="wh-card" style={{ background: C.card, borderRadius: 20, padding: '1.5rem', border: `1.5px solid ${C.border}`, boxShadow: '0 2px 12px rgba(236,72,153,0.05)' }}>
              <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif" }}>
                🔔 Reminders
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  value={newReminder} onChange={e => setNewReminder(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addReminder()}
                  placeholder="Add a reminder (e.g. 'Take iron supplement')"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button onClick={addReminder}
                  style={{ padding: '0.65rem 1rem', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                  + Add
                </button>
              </div>
              {reminders.length === 0 ? (
                <div style={{ textAlign: 'center', color: C.sub, fontSize: '0.82rem', padding: '1rem 0' }}>No reminders yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {reminders.map((r) => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: C.inner, borderRadius: 10, border: `1px solid ${C.inBdr}` }}>
                      <span style={{ fontSize: '0.95rem' }}>🔔</span>
                      <span style={{ flex: 1, fontSize: '0.85rem', color: C.text }}>{r.text}</span>
                      <button onClick={() => setReminders(prev => prev.filter(x => x.id !== r.id))}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', padding: '0.1rem 0.3rem', borderRadius: 6 }}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* ── RIGHT ─────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

            {/* Fertility insights */}
            <FertilityInsights
              cycleDay={cycleDay}
              phase={phase}
              ovulationInDays={ovulationInDays}
              nextPeriodInDays={nextPeriodInDays}
              cycleLength={cycleData.cycleLength || 28}
              periodDuration={cycleData.periodDuration || 5}
              pregnancyMode={pregnancyMode}
            />

            {/* Analytics */}
            <div className="wh-card" style={{ background: C.card, borderRadius: 20, padding: '1.5rem', border: `1.5px solid ${C.border}`, boxShadow: '0 2px 12px rgba(236,72,153,0.05)' }}>
              <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif" }}>
                📈 Symptom History
              </h3>
              <HistoryChart history={symptomHistory} C={C} isDark={isDark} />

              {topSymptoms.length > 0 && (
                <div style={{ marginTop: '1.25rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>Most Frequent Symptoms</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {topSymptoms.map(([sym, count]) => (
                      <div key={sym} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ flex: 1, fontSize: '0.82rem', color: C.text, fontWeight: 600 }}>{sym}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 80 }}>
                          <div style={{ flex: 1, height: 6, background: C.inBdr, borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${(count / symptomHistory.length) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #ec4899, #8b5cf6)', borderRadius: 99 }} />
                          </div>
                          <span style={{ fontSize: '0.72rem', color: C.sub, fontWeight: 600, flexShrink: 0 }}>{count}×</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cycle summary mini-card */}
            <div style={{ background: isDark ? 'linear-gradient(135deg, #2d0a4e, #1a0a3e)' : 'linear-gradient(135deg, #fdf4ff, #fce7f3)', borderRadius: 20, padding: '1.5rem', border: `1.5px solid ${isDark ? '#4c1d95' : '#f3e8ff'}` }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ec4899', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>💡 Did You Know?</div>
              <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: C.sub, lineHeight: 1.65 }}>
                The average menstrual cycle is 28 days, but anywhere between 21–35 days is considered normal. Tracking your cycle helps identify patterns and irregularities early.
              </p>
              <button onClick={() => navigate('/chat')}
                style={{ width: '100%', padding: '0.65rem', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(236,72,153,0.3)' }}>
                Ask AI Health Assistant →
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
