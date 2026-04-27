import { useState } from 'react';

const ML_API = import.meta.env.VITE_API_BASE;

const QUICK_OPTIONS = [
  { label: '3 Days', days: 3 },
  { label: '7 Days', days: 7 },
  { label: '14 Days', days: 14 },
  { label: '1 Month', days: 30 },
  { label: '2 Months', days: 60 },
  { label: '3 Months', days: 90 },
];

export default function FollowUpScheduler({ appointment, doctorName, onClose, onSaved }) {
  const [reason, setReason] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const setQuickDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setFollowUpDate(d.toISOString().split('T')[0]);
  };

  const handleSave = async () => {
    if (!followUpDate || !reason.trim()) return;
    setSaving(true);
    try {
      await fetch(`${ML_API}/api/followups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_name: doctorName,
          patient_name: appointment?.user_name || '',
          patient_email: appointment?.user_email || '',
          booking_id: appointment?.booking_id || '',
          reason,
          follow_up_date: followUpDate,
        }),
      });
      setSaved(true);
      onSaved?.();
      setTimeout(() => onClose?.(), 1500);
    } catch {}
    setSaving(false);
  };

  if (saved) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '2.5rem', textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>??</div>
          <h3 style={{ margin: '0 0 0.5rem', fontWeight: 800, color: '#059669', fontFamily: "'Outfit',sans-serif" }}>Follow-Up Scheduled</h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{new Date(followUpDate + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>
      <div style={{ background: '#fff', borderRadius: 20, width: 460, maxWidth: '95vw', animation: 'fadeUp 0.3s ease', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif" }}>?? Schedule Follow-Up</h2>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
              Patient: <strong>{appointment?.user_name}</strong>
            </p>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>?</button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem 1.75rem' }}>

          {/* Quick date selectors */}
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Select</p>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {QUICK_OPTIONS.map(opt => (
              <button key={opt.days} onClick={() => setQuickDate(opt.days)}
                style={{ padding: '0.4rem 0.75rem', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {opt.label}
              </button>
            ))}
          </div>

          {/* Date picker */}
          <p style={{ margin: '0 0 0.4rem', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Follow-Up Date</p>
          <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit', color: '#0f172a', marginBottom: '1rem' }} />

          {/* Reason */}
          <p style={{ margin: '0 0 0.4rem', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reason</p>
          <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g., Review blood test results, check BP improvement..." rows={3}
            style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.5, color: '#0f172a' }} />
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.75rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '0.6rem 1.25rem', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || !followUpDate || !reason.trim()}
            style={{ padding: '0.6rem 1.5rem', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Scheduling...' : '?? Schedule Follow-Up'}
          </button>
        </div>
      </div>
    </div>
  );
}
