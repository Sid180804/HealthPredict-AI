import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import DoctorCard from '../components/DoctorCard';
import AppointmentModal from '../components/AppointmentModal';
import useIsDark from '../hooks/useIsDark';

const API = import.meta.env.VITE_API_BASE;

const SPECIALIZATIONS = [
  'All', 'General Physician', 'Cardiologist', 'Pulmonologist', 'Dermatologist',
  'Gastroenterologist', 'Endocrinologist', 'Neurologist', 'Orthopedist',
  'Gynecologist', 'Pediatrician', 'Allergist', 'Urologist', 'Internal Medicine',
  'Psychologist', 'Psychiatrist',
];

export default function BookDoctor() {
  const isDark = useIsDark();
  const location = useLocation();
  const navigate = useNavigate();

  const initState = location.state || {};
  const initSpecialist = initState.specialist || '';
  const initDisease = initState.disease || '';
  const initSymptoms = initState.symptoms || [];
  const initSeverity = initState.severity || '';

  const isPriority = initSeverity && ['high', 'critical', 'urgent'].includes(initSeverity.toLowerCase());

  const C = {
    page: isDark ? '#0f172a' : '#f1f5f9',
    card: isDark ? '#1e293b' : '#ffffff',
    border: isDark ? '#334155' : '#e2e8f0',
    text: isDark ? '#f1f5f9' : '#0f172a',
    sub: isDark ? '#94a3b8' : '#64748b',
    input: isDark ? '#0f172a' : '#ffffff',
    inpBdr: isDark ? '#475569' : '#e2e8f0',
  };

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [specFilter, setSpecFilter] = useState(initSpecialist || 'All');
  const [ratingFilter, setRatingFilter] = useState(0);
  const [videoOnly, setVideoOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [fetchError, setFetchError] = useState('');

  const fetchDoctors = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const params = new URLSearchParams();
      if (specFilter && specFilter !== 'All') params.append('specialty', specFilter);
      if (ratingFilter) params.append('min_rating', ratingFilter);
      if (videoOnly) params.append('video_only', 'true');
      const res = await fetch(`${API}/api/doctors?${params}`);
      const data = await res.json();
      setDoctors(data.doctors || []);
    } catch (err) {
      setDoctors([]);
      setFetchError('Unable to load doctors. Please check if the server is running and try again.');
    }
    setLoading(false);
  };

  useEffect(() => { fetchDoctors(); }, [specFilter, ratingFilter, videoOnly]);

  const filtered = doctors.filter(d => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return d.name?.toLowerCase().includes(q) || d.specialization?.toLowerCase().includes(q) || d.clinic?.toLowerCase().includes(q);
  });

  const inputStyle = {
    padding: '0.55rem 0.875rem', borderRadius: 10,
    border: `1.5px solid ${C.inpBdr}`, background: C.input, color: C.text,
    fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit',
  };

  return (
    <div style={{ minHeight: '100vh', background: C.page, fontFamily: "'Inter', system-ui, sans-serif", transition: 'background 0.3s' }}>
      <style>{`
        @keyframes bd-fade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        .doc-card:hover{box-shadow:0 8px 30px rgba(0,0,0,0.1)!important;transform:translateY(-2px)}
      `}</style>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem', animation: 'bd-fade 0.5s ease forwards' }}>

        {/* Hero */}
        <div style={{
          background: isPriority
            ? (isDark ? 'linear-gradient(135deg,#7f1d1d,#0f172a)' : 'linear-gradient(135deg,#fef2f2,#fff7ed)')
            : (isDark ? 'linear-gradient(135deg,#064e3b,#0f172a 60%,#1e1b4b)' : 'linear-gradient(135deg,#ecfdf5,#ffffff 50%,#ede9fe)'),
          borderRadius: 24, padding: '2.5rem', marginBottom: '1.75rem',
          border: `1.5px solid ${isPriority ? (isDark ? '#dc2626' : '#fca5a5') : (isDark ? '#047857' : '#a7f3d0')}`,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', width: 250, height: 250, borderRadius: '50%', background: `radial-gradient(circle,${isPriority ? 'rgba(220,38,38,0.1)' : 'rgba(5,150,105,0.1)'}0%,transparent 70%)`, top: -80, right: 80 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', position: 'relative' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '2rem' }}>{isPriority ? '??' : '??'}</span>
                <h1 style={{ margin: 0, fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 900, color: C.text, fontFamily: "'Outfit',sans-serif" }}>
                  {isPriority ? 'Priority Doctor Booking' : 'Book a Doctor'}
                </h1>
              </div>
              <p style={{ margin: 0, color: C.sub, fontSize: '0.9rem', maxWidth: 500 }}>
                {initDisease
                  ? <>Based on diagnosis of <strong style={{ color: isPriority ? '#dc2626' : '#059669' }}>{initDisease}</strong>, we recommend a <strong style={{ color: isPriority ? '#dc2626' : '#059669' }}>{initSpecialist}</strong>.</>
                  : 'Find the right specialist and book an appointment instantly.'}
              </p>
              {isPriority && (
                <div style={{ marginTop: '0.6rem', padding: '0.4rem 0.75rem', background: 'rgba(220,38,38,0.1)', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: '1px solid #fca5a5' }}>
                  <span style={{ fontSize: '0.8rem' }}>?</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626' }}>Priority consultation recommended. Sunday slots highlighted.</span>
                </div>
              )}
            </div>
            {initDisease && (
              <div style={{ background: isPriority ? (isDark ? '#7f1d1d30' : '#fef2f2') : (isDark ? '#05966920' : '#ecfdf5'), padding: '0.75rem 1.25rem', borderRadius: 14, border: `1.5px solid ${isPriority ? '#fca5a5' : '#a7f3d0'}` }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: isPriority ? '#dc2626' : '#059669', textTransform: 'uppercase' }}>AI Diagnosis</div>
                <div style={{ fontWeight: 800, color: C.text, fontSize: '0.9rem' }}>{initDisease}</div>
                <div style={{ fontSize: '0.75rem', color: C.sub }}>Specialist: {initSpecialist}</div>
                {initSeverity && <div style={{ fontSize: '0.68rem', fontWeight: 700, color: isPriority ? '#dc2626' : '#64748b', marginTop: '0.2rem' }}>Severity: {initSeverity}</div>}
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search doctor, specialty, or clinic..."
            style={{ ...inputStyle, flex: '1 1 250px', minWidth: 200 }} />
          <select value={specFilter} onChange={e => setSpecFilter(e.target.value)} style={{ ...inputStyle, minWidth: 160 }}>
            {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={ratingFilter} onChange={e => setRatingFilter(Number(e.target.value))} style={{ ...inputStyle, minWidth: 120 }}>
            <option value={0}>Any Rating</option>
            <option value={4}>4+ Stars</option>
            <option value={4.5}>4.5+ Stars</option>
          </select>
          <button onClick={() => setVideoOnly(v => !v)} style={{
            padding: '0.55rem 0.875rem', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem',
            border: `1.5px solid ${videoOnly ? '#7c3aed' : C.inpBdr}`,
            background: videoOnly ? (isDark ? '#7c3aed20' : '#ede9fe') : C.input,
            color: videoOnly ? '#7c3aed' : C.sub,
          }}>?? Video Only</button>
          <button onClick={() => navigate('/doctors', { state: initState })} style={{
            padding: '0.55rem 0.875rem', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem',
            border: `1.5px solid ${C.inpBdr}`, background: C.input, color: C.sub,
          }}>?? Advanced Search</button>
        </div>

        {/* Doctor grid */}
        {fetchError && (
          <div style={{ textAlign: 'center', padding: '2rem', background: isDark ? '#7f1d1d20' : '#fef2f2', borderRadius: 20, border: '1.5px solid #fca5a5', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '2.5rem' }}>??</span>
            <h3 style={{ margin: '0.75rem 0 0.4rem', color: '#ef4444', fontWeight: 700, fontSize: '1rem' }}>Connection Error</h3>
            <p style={{ color: C.sub, fontSize: '0.85rem', marginBottom: '1rem' }}>{fetchError}</p>
            <button onClick={fetchDoctors} style={{ padding: '0.5rem 1.5rem', borderRadius: 10, border: 'none', background: '#059669', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>Retry</button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: C.sub }}>
            <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#059669', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
            <style>{`@keyframes spin{100%{transform:rotate(360deg)}}`}</style>
            Loading doctors...
          </div>
        ) : filtered.length === 0 && !fetchError ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: C.card, borderRadius: 20, border: `1.5px dashed ${C.border}` }}>
            <span style={{ fontSize: '3rem' }}>??</span>
            <h3 style={{ margin: '1rem 0 0.5rem', color: C.text }}>No doctors found</h3>
            <p style={{ color: C.sub }}>Try adjusting your filters.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: '1.25rem' }}>
            {filtered.map(doc => (
              <DoctorCard key={doc.id} doctor={doc} onBook={setSelectedDoctor} />
            ))}
          </div>
        )}
      </main>

      {selectedDoctor && (
        <AppointmentModal
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          disease={initDisease}
          symptoms={initSymptoms}
          severity={initSeverity}
        />
      )}
    </div>
  );
}
