import { useState } from 'react';
import useIsDark from '../../hooks/useIsDark';

const SYMPTOM_GROUPS = [
  {
    category: 'Physical',
    icon: '🩺',
    color: '#ec4899',
    symptoms: ['Cramps', 'Bloating', 'Breast tenderness', 'Back pain', 'Headache', 'Fatigue', 'Nausea', 'Spotting', 'Heavy flow', 'Clots'],
  },
  {
    category: 'Mood & Energy',
    icon: '💭',
    color: '#8b5cf6',
    symptoms: ['Irritability', 'Anxiety', 'Sadness', 'Mood swings', 'Brain fog', 'Low energy', 'Restlessness', 'Crying spells'],
  },
  {
    category: 'Lifestyle',
    icon: '🌿',
    color: '#059669',
    symptoms: ['Acne', 'Food cravings', 'Insomnia', 'Increased appetite', 'Hot flashes', 'Night sweats', 'Decreased libido'],
  },
];

const INTENSITY = ['Mild', 'Moderate', 'Severe'];

/**
 * SymptomTracker
 * Props: { date, onSave, existing }
 * existing = { symptoms: string[], notes: string, intensity: string }
 */
export default function SymptomTracker({ date, onSave, existing = {} }) {
  const isDark = useIsDark();
  const [selected, setSelected]   = useState(existing.symptoms || []);
  const [intensity, setIntensity] = useState(existing.intensity || 'Mild');
  const [notes, setNotes]         = useState(existing.notes || '');
  const [saved, setSaved]         = useState(false);

  const C = {
    bg:     isDark ? '#1e293b' : '#ffffff',
    inner:  isDark ? '#0f172a' : '#f8fafc',
    border: isDark ? '#334155' : '#f1f5f9',
    text:   isDark ? '#f1f5f9' : '#0f172a',
    sub:    isDark ? '#94a3b8' : '#64748b',
    input:  isDark ? '#0f172a' : '#ffffff',
    inpBdr: isDark ? '#475569' : '#e2e8f0',
  };

  const toggle = (sym) =>
    setSelected(prev => prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]);

  const handleSave = () => {
    onSave && onSave({ date, symptoms: selected, intensity, notes });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ background: C.bg, borderRadius: 20, padding: '1.5rem', border: `1.5px solid ${C.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif" }}>
          Symptom Tracker
        </h3>
        {date && (
          <span style={{ fontSize: '0.72rem', color: C.sub, fontWeight: 600, background: C.inner, padding: '0.25rem 0.6rem', borderRadius: 8, border: `1px solid ${C.border}` }}>
            {new Date(date + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>

      {/* Symptom groups */}
      {SYMPTOM_GROUPS.map(group => (
        <div key={group.category} style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
            <span>{group.icon}</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: group.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{group.category}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {group.symptoms.map(sym => {
              const active = selected.includes(sym);
              return (
                <button key={sym} onClick={() => toggle(sym)}
                  style={{
                    padding: '0.35rem 0.85rem', borderRadius: 99, fontSize: '0.78rem', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.18s', border: `1.5px solid ${active ? group.color : C.border}`,
                    background: active ? group.color + '20' : C.inner,
                    color: active ? group.color : C.sub,
                  }}>
                  {active && '✓ '}{sym}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Intensity selector */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: C.sub, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Overall Intensity</div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {INTENSITY.map(lvl => {
            const colors = { Mild: '#059669', Moderate: '#f59e0b', Severe: '#ef4444' };
            const active = intensity === lvl;
            return (
              <button key={lvl} onClick={() => setIntensity(lvl)}
                style={{
                  flex: 1, padding: '0.5rem', borderRadius: 10, border: `1.5px solid ${active ? colors[lvl] : C.border}`,
                  background: active ? colors[lvl] + '20' : C.inner, color: active ? colors[lvl] : C.sub,
                  fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.18s',
                }}>
                {lvl}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: C.sub, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Notes</div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="How are you feeling today?"
          rows={3}
          style={{
            width: '100%', padding: '0.75rem', borderRadius: 12, border: `1.5px solid ${C.inpBdr}`,
            background: C.input, color: C.text, fontSize: '0.85rem', resize: 'none',
            outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s',
          }}
        />
      </div>

      {/* Save */}
      <button onClick={handleSave}
        style={{
          width: '100%', padding: '0.75rem', borderRadius: 12, border: 'none', cursor: 'pointer',
          background: saved ? '#059669' : 'linear-gradient(135deg, #ec4899, #8b5cf6)',
          color: '#fff', fontWeight: 700, fontSize: '0.875rem', transition: 'all 0.25s',
          boxShadow: saved ? '0 4px 14px rgba(5,150,105,0.3)' : '0 4px 14px rgba(236,72,153,0.3)',
        }}>
        {saved ? '✓ Saved!' : `Save ${selected.length > 0 ? `(${selected.length} symptoms)` : 'Log'}`}
      </button>
    </div>
  );
}
