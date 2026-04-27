import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import useIsDark from '../hooks/useIsDark';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_BASE;

const STATUS_CFG = {
  confirmed: { color: '#059669', bg: '#ecfdf5', border: '#bbf7d0', label: 'Confirmed', icon: '?' },
  completed: { color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', label: 'Completed', icon: '?' },
  cancelled: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Cancelled', icon: '?' },
  pending:   { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Pending',   icon: '?' },
};

const TABS = [
  { id: 'upcoming', label: 'Upcoming', icon: '??' },
  { id: 'completed', label: 'Completed', icon: '?' },
  { id: 'cancelled', label: 'Cancelled', icon: '?' },
  { id: 'all', label: 'All', icon: '??' },
];

export default function AppointmentHistory() {
  const isDark = useIsDark();
  const navigate = useNavigate();
  const { user } = useAuth();

  const C = {
    page: isDark ? '#0f172a' : '#f1f5f9',
    card: isDark ? '#1e293b' : '#ffffff',
    border: isDark ? '#334155' : '#e2e8f0',
    text: isDark ? '#f1f5f9' : '#0f172a',
    sub: isDark ? '#94a3b8' : '#64748b',
    inner: isDark ? '#0f172a' : '#f8fafc',
    inBdr: isDark ? '#334155' : '#f1f5f9',
    tabBg: isDark ? '#1e293b' : '#f1f5f9',
    tabActive: isDark ? '#0f172a' : '#ffffff',
  };

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState('');

  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (user?.name) params.append('user_name', user.name);
      if (user?.email) params.append('user_email', user.email);
      const res = await fetch(`${API}/api/appointments?${params}`);
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch (err) {
      setAppointments([]);
      setError('Failed to load appointments. Please check your connection and try again.');
    }
    setLoading(false);
  };

  useEffect(() => { fetchAppointments(); }, []);

  const handleCancel = async (bookingId) => {
    setCancellingId(bookingId);
    try {
      const res = await fetch(`${API}/api/appointments/${bookingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to cancel appointment.');
      }
      fetchAppointments();
    } catch (err) {
      setError('Network error — could not cancel appointment. Please try again.');
    }
    setCancellingId(null);
  };

  const today = new Date().toISOString().split('T')[0];
  const filtered = activeTab === 'all' ? appointments
    : activeTab === 'upcoming' ? appointments.filter(a => a.status === 'confirmed' && a.date >= today)
    : appointments.filter(a => a.status === activeTab);

  const upcomingCount = appointments.filter(a => a.status === 'confirmed' && a.date >= today).length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;
  const cancelledCount = appointments.filter(a => a.status === 'cancelled').length;
  const tabCounts = { upcoming: upcomingCount, completed: completedCount, cancelled: cancelledCount, all: appointments.length };

  return (
    <div style={{ minHeight: '100vh', background: C.page, fontFamily: "'Inter', system-ui, sans-serif", transition: 'background 0.3s' }}>
      <style>{`@keyframes ap-fade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}`}</style>
      <Header />
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem', animation: 'ap-fade 0.5s ease forwards' }}>

        {/* Hero */}
        <div style={{
          background: isDark ? 'linear-gradient(135deg,#1e1b4b,#0f172a)' : 'linear-gradient(135deg,#ede9fe,#e0f2fe)',
          borderRadius: 24, padding: '2.5rem', marginBottom: '1.75rem',
          border: `1.5px solid ${isDark ? '#4338ca' : '#c7d2fe'}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '2rem' }}>??</span>
                <h1 style={{ margin: 0, fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 900, color: C.text, fontFamily: "'Outfit',sans-serif" }}>
                  My Appointments
                </h1>
              </div>
              <p style={{ margin: 0, color: C.sub, fontSize: '0.9rem' }}>
                {appointments.length} total &middot; {upcomingCount} upcoming &middot; {completedCount} completed
              </p>
            </div>
            <button onClick={() => navigate('/book-doctor')}
              style={{ padding: '0.65rem 1.25rem', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}>
              + Book New Appointment
            </button>
          </div>
        </div>

        {/* Tab filters */}
        <div style={{ display: 'flex', gap: '0.25rem', background: C.tabBg, padding: '0.3rem', borderRadius: 14, marginBottom: '1.5rem', border: `1px solid ${C.border}` }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: '0.65rem 0.5rem', borderRadius: 11, border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: '0.78rem', fontFamily: 'inherit',
                background: activeTab === tab.id ? C.tabActive : 'transparent',
                color: activeTab === tab.id ? C.text : C.sub,
                boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
              }}>
              <span>{tab.icon}</span>
              {tab.label}
              <span style={{
                fontSize: '0.65rem', fontWeight: 800, padding: '0.08rem 0.35rem', borderRadius: 99, minWidth: 18, textAlign: 'center',
                background: activeTab === tab.id ? '#7c3aed' : (isDark ? '#334155' : '#e2e8f0'),
                color: activeTab === tab.id ? '#fff' : C.sub,
              }}>{tabCounts[tab.id]}</span>
            </button>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ padding: '1rem 1.25rem', background: isDark ? '#7f1d1d20' : '#fef2f2', borderRadius: 14, border: '1.5px solid #fca5a5', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>?? {error}</span>
            <button onClick={() => { setError(''); fetchAppointments(); }} style={{ padding: '0.35rem 0.85rem', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>Retry</button>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: C.sub }}>
            <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
            <style>{`@keyframes spin{100%{transform:rotate(360deg)}}`}</style>
            Loading appointments...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: C.card, borderRadius: 20, border: `1.5px dashed ${C.border}` }}>
            <span style={{ fontSize: '3rem' }}>??</span>
            <h3 style={{ margin: '1rem 0 0.5rem', color: C.text, fontFamily: "'Outfit',sans-serif" }}>
              {activeTab === 'upcoming' ? 'No Upcoming Appointments' : activeTab === 'completed' ? 'No Completed Appointments' : activeTab === 'cancelled' ? 'No Cancelled Appointments' : 'No Appointments Yet'}
            </h3>
            <p style={{ color: C.sub, fontSize: '0.85rem', marginBottom: '1rem' }}>
              {activeTab === 'upcoming' ? 'Book an appointment with a specialist to get started.' : 'Your appointment history will appear here.'}
            </p>
            {activeTab === 'upcoming' && (
              <button onClick={() => navigate('/book-doctor')}
                style={{ padding: '0.65rem 1.25rem', borderRadius: 10, border: 'none', background: '#7c3aed', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                Find a Doctor
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {filtered.map(appt => {
              const sc = STATUS_CFG[appt.status] || STATUS_CFG.pending;
              const isUpcoming = appt.status === 'confirmed' && appt.date >= today;
              const isPriorityAppt = appt.appointment_type === 'priority';
              return (
                <div key={appt.booking_id} style={{
                  background: C.card, borderRadius: 18, overflow: 'hidden',
                  border: `1.5px solid ${isUpcoming ? (isPriorityAppt ? '#fbbf24' : '#7c3aed40') : C.border}`,
                  boxShadow: isUpcoming ? '0 4px 16px rgba(124,58,237,0.08)' : 'none',
                  transition: 'all 0.2s',
                }}>
                  {/* Priority badge strip */}
                  {isPriorityAppt && (
                    <div style={{ background: 'linear-gradient(90deg,#f59e0b,#fbbf24)', padding: '0.3rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.7rem' }}>??</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#78350f' }}>PRIORITY APPOINTMENT</span>
                    </div>
                  )}

                  <div style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      {/* Doctor avatar */}
                      <div style={{
                        width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                        background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 800, fontSize: '1.2rem',
                      }}>
                        {(appt.doctor_name || 'D')[0]}
                      </div>

                      {/* Details */}
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 800, color: C.text, fontSize: '0.95rem' }}>{appt.doctor_name}</span>
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 700, padding: '0.12rem 0.45rem', borderRadius: 99,
                            background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                          }}>{sc.icon} {sc.label}</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600, marginBottom: '0.3rem' }}>
                          {appt.specialization}
                          {appt.clinic && <span style={{ color: C.sub, fontWeight: 500 }}> &middot; {appt.clinic}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.76rem', color: C.sub }}>
                          <span>?? {appt.date ? new Date(appt.date + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                          <span>?? {appt.time || '—'}</span>
                          <span>?? ?{appt.consultation_fee || 0}</span>
                          <span>{appt.consultation_type === 'video' ? '?? Video' : appt.consultation_type === 'chat' ? '?? Chat' : '?? Clinic'}</span>
                        </div>

                        {appt.disease && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.12rem 0.45rem', borderRadius: 6, background: isDark ? '#1e3a5f' : '#eff6ff', color: '#3b82f6' }}>
                              ?? {appt.disease}
                            </span>
                            {appt.severity && (
                              <span style={{ marginLeft: '0.3rem', fontSize: '0.7rem', fontWeight: 700, padding: '0.12rem 0.45rem', borderRadius: 6, background: '#fef2f2', color: '#dc2626' }}>
                                {appt.severity}
                              </span>
                            )}
                          </div>
                        )}

                        {appt.doctor_notes && (
                          <div style={{ marginTop: '0.5rem', padding: '0.55rem 0.75rem', background: C.inner, borderRadius: 10, border: `1px solid ${C.inBdr}` }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase' }}>Doctor Notes</span>
                            <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: C.text, lineHeight: 1.5 }}>{appt.doctor_notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0, alignItems: 'flex-end' }}>
                        {appt.video_link && appt.status === 'confirmed' && (
                          <a href={appt.video_link} target="_blank" rel="noreferrer"
                            style={{ padding: '0.45rem 0.85rem', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'none', textAlign: 'center', boxShadow: '0 2px 8px rgba(5,150,105,0.25)' }}>
                            ?? Join Call
                          </a>
                        )}
                        {appt.status === 'confirmed' && isUpcoming && (
                          <button onClick={() => handleCancel(appt.booking_id)} disabled={cancellingId === appt.booking_id}
                            style={{ padding: '0.45rem 0.85rem', borderRadius: 8, border: '1.5px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
                            {cancellingId === appt.booking_id ? '...' : 'Cancel'}
                          </button>
                        )}
                        <span style={{ fontSize: '0.65rem', color: C.sub }}>#{appt.booking_id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
