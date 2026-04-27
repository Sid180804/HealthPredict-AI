import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorCard from './DoctorCard';
import AppointmentModal from './AppointmentModal';

const API = import.meta.env.VITE_API_BASE;

export default function DiagnosisDoctorSuggestion({ disease, severity, symptoms = [] }) {
  const navigate = useNavigate();
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const isPriority = severity && ['high', 'critical', 'urgent'].includes(severity.toLowerCase());

  useEffect(() => {
    if (!disease) return;
    const fetchRec = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/ai/recommend-specialist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ disease }),
        });
        const data = await res.json();
        setRecommendation(data);
      } catch {}
      setLoading(false);
    };
    fetchRec();
  }, [disease]);

  if (!disease) return null;
  if (loading) return (
    <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg,#f0f9ff,#faf5ff)', borderRadius: 20, border: '1.5px solid #bae6fd', textAlign: 'center' }}>
      <div style={{ width: 24, height: 24, border: '3px solid #e2e8f0', borderTopColor: '#059669', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
      <style>{`@keyframes spin{100%{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const specialist = recommendation?.specialist || 'General Physician';
  const topDocs = recommendation?.top_doctors || [];

  return (
    <>
      <div style={{
        borderRadius: 20, overflow: 'hidden',
        border: isPriority ? '2px solid #fca5a5' : '1.5px solid #bae6fd',
      }}>
        {/* Header section */}
        <div style={{
          background: isPriority
            ? 'linear-gradient(135deg,#7f1d1d,#991b1b)'
            : 'linear-gradient(135deg,#059669,#047857)',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '1.5rem' }}>{isPriority ? '??' : '?????'}</span>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '1.05rem', fontWeight: 900, fontFamily: "'Nunito',sans-serif" }}>
              {isPriority ? 'Urgent: Priority Consultation' : 'Recommended Specialist'}
            </h3>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Predicted Condition</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>{disease}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Severity</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: isPriority ? '#fbbf24' : '#a7f3d0' }}>{severity || 'Moderate'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommended Doctor</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>{specialist}</div>
            </div>
          </div>

          {isPriority && (
            <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.15)', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.85rem' }}>?</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24' }}>Priority consultation recommended. Sunday slots available.</span>
            </div>
          )}
        </div>

        {/* Top 3 doctors */}
        <div style={{ padding: '1.25rem', background: '#fff' }}>
          {topDocs.length > 0 ? (
            <>
              <p style={{ margin: '0 0 0.875rem', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Top {specialist} Specialists
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {topDocs.slice(0, 3).map(doc => (
                  <DoctorCard key={doc.id} doctor={doc} compact onBook={setSelectedDoctor} />
                ))}
              </div>
            </>
          ) : (
            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', padding: '1rem 0' }}>
              No {specialist.toLowerCase()} doctors available right now.
            </p>
          )}

          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
            <button onClick={() => navigate('/doctors', { state: { disease, specialist, symptoms, severity } })}
              style={{
                flex: 1, padding: '0.7rem', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff',
                fontWeight: 700, fontSize: '0.85rem', fontFamily: 'inherit',
                boxShadow: '0 4px 14px rgba(5,150,105,0.25)',
              }}>
              ?? View All {specialist} Doctors
            </button>
            <button onClick={() => navigate('/appointments')}
              style={{
                padding: '0.7rem 1rem', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                border: '1.5px solid #e2e8f0', background: 'transparent', color: '#475569',
                fontWeight: 700, fontSize: '0.82rem',
              }}>
              ?? Appointments
            </button>
          </div>
        </div>
      </div>

      {/* Inline booking modal */}
      {selectedDoctor && (
        <AppointmentModal
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          disease={disease}
          symptoms={symptoms}
          severity={severity}
        />
      )}
    </>
  );
}
