import { useState, useEffect } from 'react';

const ML_API = import.meta.env.VITE_API_BASE;

const SEV_COLORS = { urgent: '#dc2626', high: '#dc2626', critical: '#dc2626', moderate: '#d97706', low: '#059669', normal: '#059669' };

export default function PatientOverviewPanel({ patient, onClose }) {
  const [timeline, setTimeline] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patient) return;
    const load = async () => {
      setLoading(true);
      try {
        const [tlRes, rxRes] = await Promise.all([
          fetch(`${ML_API}/api/timeline?user_id=${encodeURIComponent(patient.user_email || patient.user_name || 'default')}&limit=10`),
          fetch(`${ML_API}/api/prescriptions?patient_name=${encodeURIComponent(patient.user_name || '')}`),
        ]);
        const tlData = await tlRes.json();
        const rxData = await rxRes.json();
        setTimeline(tlData.events || []);
        setPrescriptions(rxData.prescriptions || []);
      } catch {}
      setLoading(false);
    };
    load();
  }, [patient]);

  if (!patient) return null;

  const severity = patient.severity || 'moderate';
  const sevColor = SEV_COLORS[severity.toLowerCase()] || '#64748b';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', width: 480, maxWidth: '100%', background: '#fff', height: '100vh', overflowY: 'auto', boxShadow: '-8px 0 30px rgba(0,0,0,0.15)', animation: 'slideIn 0.3s ease' }}>
        <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:none}}`}</style>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', padding: '1.75rem', position: 'sticky', top: 0, zIndex: 10 }}>
          <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 32, height: 32, color: '#fff', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>?</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '1.4rem' }}>
              {(patient.user_name || 'P')[0].toUpperCase()}
            </div>
            <div>
              <h2 style={{ margin: 0, color: '#fff', fontSize: '1.15rem', fontWeight: 800, fontFamily: "'Outfit',sans-serif" }}>{patient.user_name || 'Patient'}</h2>
              <p style={{ margin: '0.15rem 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                {patient.user_email || '—'}
              </p>
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.12rem 0.45rem', borderRadius: 99, background: `${sevColor}20`, color: sevColor, border: `1px solid ${sevColor}40` }}>
                  {severity.toUpperCase()}
                </span>
                {patient.appointment_type === 'priority' && (
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.12rem 0.45rem', borderRadius: 99, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>? PRIORITY</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Appointment Info */}
        <div style={{ padding: '1.25rem 1.75rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.82rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Appointment</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            {[
              ['?? Date', patient.date || '—'],
              ['?? Time', patient.time || '—'],
              ['?? Type', patient.consultation_type === 'video' ? '?? Video' : patient.consultation_type === 'chat' ? '?? Chat' : '?? Clinic'],
              ['?? Fee', `?${patient.consultation_fee || 0}`],
            ].map(([label, val]) => (
              <div key={label} style={{ padding: '0.6rem 0.75rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                <p style={{ margin: 0, fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>{label}</p>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>{val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Diagnosis */}
        {patient.disease && (
          <div style={{ padding: '0 1.75rem 1.25rem' }}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.82rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Diagnosis</h3>
            <div style={{ background: 'linear-gradient(135deg,#f0f9ff,#faf5ff)', borderRadius: 14, padding: '1rem', border: '1.5px solid #bae6fd' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>?? {patient.disease}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 99, background: `${sevColor}15`, color: sevColor }}>{severity}</span>
              </div>
              {patient.symptoms?.length > 0 && (
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                  {patient.symptoms.map(s => (
                    <span key={s} style={{ fontSize: '0.68rem', fontWeight: 600, padding: '0.15rem 0.45rem', borderRadius: 6, background: '#fff7ed', color: '#d97706', border: '1px solid #fde68a' }}>{s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prescription History */}
        <div style={{ padding: '0 1.75rem 1.25rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.82rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prescription History</h3>
          {loading ? (
            <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Loading...</p>
          ) : prescriptions.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', fontStyle: 'italic' }}>No prescriptions yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {prescriptions.slice(0, 5).map(rx => (
                <div key={rx.id} style={{ padding: '0.6rem 0.75rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>?? {rx.disease || 'General'}</span>
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{new Date(rx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: '#64748b' }}>{rx.medicines?.map(m => m.name).join(', ') || 'No medicines listed'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Health Timeline */}
        <div style={{ padding: '0 1.75rem 1.75rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.82rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Health Timeline</h3>
          {loading ? (
            <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Loading...</p>
          ) : timeline.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', fontStyle: 'italic' }}>No timeline events</p>
          ) : (
            <div style={{ position: 'relative', paddingLeft: '1.25rem' }}>
              <div style={{ position: 'absolute', left: 4, top: 4, bottom: 4, width: 2, background: '#e2e8f0' }} />
              {timeline.slice(0, 8).map((ev, i) => (
                <div key={ev.id || i} style={{ position: 'relative', paddingBottom: '0.875rem', paddingLeft: '0.75rem' }}>
                  <div style={{ position: 'absolute', left: -3, top: 4, width: 10, height: 10, borderRadius: '50%', background: i === 0 ? '#7c3aed' : '#cbd5e1', border: '2px solid #fff' }} />
                  <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>{ev.title}</p>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.7rem', color: '#94a3b8' }}>
                    {ev.detail && <span>{ev.detail} · </span>}
                    {new Date(ev.timestamp || ev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
