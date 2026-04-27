import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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

const LOCATIONS = ['All', 'Chennai', 'Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Kolkata', 'Chandigarh', 'Lucknow'];

export default function DoctorList() {
  const isDark = useIsDark();
  const location = useLocation();
  const initState = location.state || {};

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
  };

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [specFilter, setSpecFilter] = useState(initState.specialist || 'All');
  const [ratingFilter, setRatingFilter] = useState(0);
  const [expFilter, setExpFilter] = useState(0);
  const [locFilter, setLocFilter] = useState('All');
  const [videoOnly, setVideoOnly] = useState(false);
  const [sortBy, setSortBy] = useState('rating');

  // Booking modal
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (specFilter && specFilter !== 'All') params.append('specialty', specFilter);
      if (ratingFilter) params.append('min_rating', ratingFilter);
      if (videoOnly) params.append('video_only', 'true');
      if (locFilter && locFilter !== 'All') params.append('location', locFilter);
      if (expFilter) params.append('min_experience', expFilter);
      const res = await fetch(`${API}/api/doctors?${params}`);
      const data = await res.json();
      setDoctors(data.doctors || []);
    } catch { setDoctors([]); }
    setLoading(false);
  };

  useEffect(() => { fetchDoctors(); }, [specFilter, ratingFilter, videoOnly, locFilter, expFilter]);

  // Client-side search filter
  const filtered = doctors.filter(d => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return d.name?.toLowerCase().includes(q) || d.specialization?.toLowerCase().includes(q) || d.clinic?.toLowerCase().includes(q) || d.location?.toLowerCase().includes(q);
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'fee_low') return (a.consultation_fee || 0) - (b.consultation_fee || 0);
    if (sortBy === 'fee_high') return (b.consultation_fee || 0) - (a.consultation_fee || 0);
    if (sortBy === 'experience') return (b.experience_years || 0) - (a.experience_years || 0);
    return 0;
  });

  const inputStyle = {
    padding: '0.55rem 0.875rem', borderRadius: 10,
    border: `1.5px solid ${C.inpBdr}`, background: C.input, color: C.text,
    fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit',
  };

  return (
    <div style={{ minHeight: '100vh', background: C.page, fontFamily: "'Inter', system-ui, sans-serif", transition: 'background 0.3s' }}>
      <style>{`
        @keyframes dl-fade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        .doc-card:hover{box-shadow:0 8px 30px rgba(0,0,0,0.1)!important;transform:translateY(-2px)}
      `}</style>
      <Header />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem', animation: 'dl-fade 0.5s ease forwards' }}>

        {/* Hero */}
        <div style={{
          background: isDark
            ? 'linear-gradient(135deg,#064e3b,#0f172a 60%,#1e1b4b)'
            : 'linear-gradient(135deg,#ecfdf5,#ffffff 50%,#ede9fe)',
          borderRadius: 24, padding: '2.5rem', marginBottom: '1.75rem',
          border: `1.5px solid ${isDark ? '#047857' : '#a7f3d0'}`, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(5,150,105,0.1)0%,transparent 70%)', top: -100, right: 80 }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '2rem' }}>??</span>
              <h1 style={{ margin: 0, fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 900, color: C.text, fontFamily: "'Outfit',sans-serif" }}>
                Find a Doctor
              </h1>
            </div>
            <p style={{ margin: 0, color: C.sub, fontSize: '0.9rem', maxWidth: 550 }}>
              {initState.disease
                ? <>Showing specialists for <strong style={{ color: '#059669' }}>{initState.disease}</strong>. {initState.specialist && <>Recommended: <strong style={{ color: '#059669' }}>{initState.specialist}</strong></>}</>
                : 'Browse our verified doctors directory. Filter by specialty, location, rating, and more.'}
            </p>
            {initState.disease && (
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: 6, background: isDark ? '#05966920' : '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>?? {initState.disease}</span>
                {initState.severity && (
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: 6, background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}>? {initState.severity}</span>
                )}
                {initState.specialist && (
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: 6, background: isDark ? '#7c3aed20' : '#ede9fe', color: '#7c3aed', border: '1px solid #c4b5fd' }}>????? {initState.specialist}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Filters bar */}
        <div style={{ background: C.card, borderRadius: 16, padding: '1.25rem', marginBottom: '1.5rem', border: `1.5px solid ${C.border}` }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search doctor, specialty, clinic..."
              style={{ ...inputStyle, flex: '1 1 250px', minWidth: 180 }} />

            <select value={specFilter} onChange={e => setSpecFilter(e.target.value)} style={{ ...inputStyle, minWidth: 150 }}>
              {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select value={locFilter} onChange={e => setLocFilter(e.target.value)} style={{ ...inputStyle, minWidth: 120 }}>
              {LOCATIONS.map(l => <option key={l} value={l}>{l === 'All' ? 'All Locations' : l}</option>)}
            </select>

            <select value={ratingFilter} onChange={e => setRatingFilter(Number(e.target.value))} style={{ ...inputStyle, minWidth: 110 }}>
              <option value={0}>Any Rating</option>
              <option value={4}>4+ Stars</option>
              <option value={4.5}>4.5+ Stars</option>
            </select>

            <select value={expFilter} onChange={e => setExpFilter(Number(e.target.value))} style={{ ...inputStyle, minWidth: 120 }}>
              <option value={0}>Any Experience</option>
              <option value={5}>5+ Years</option>
              <option value={10}>10+ Years</option>
              <option value={15}>15+ Years</option>
            </select>

            <button onClick={() => setVideoOnly(v => !v)}
              style={{
                padding: '0.55rem 0.875rem', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem',
                border: `1.5px solid ${videoOnly ? '#7c3aed' : C.inpBdr}`,
                background: videoOnly ? (isDark ? '#7c3aed20' : '#ede9fe') : C.input,
                color: videoOnly ? '#7c3aed' : C.sub,
              }}>
              ?? Video Only
            </button>

            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...inputStyle, minWidth: 120 }}>
              <option value="rating">Sort: Rating</option>
              <option value="experience">Sort: Experience</option>
              <option value="fee_low">Sort: Fee (Low)</option>
              <option value="fee_high">Sort: Fee (High)</option>
            </select>
          </div>

          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: C.sub, fontWeight: 600 }}>
              {sorted.length} doctor{sorted.length !== 1 ? 's' : ''} found
            </span>
            {(specFilter !== 'All' || locFilter !== 'All' || ratingFilter > 0 || expFilter > 0 || videoOnly) && (
              <button onClick={() => { setSpecFilter('All'); setLocFilter('All'); setRatingFilter(0); setExpFilter(0); setVideoOnly(false); setSearchQuery(''); }}
                style={{ fontSize: '0.7rem', fontWeight: 700, color: '#dc2626', background: '#fef2f2', border: 'none', padding: '0.2rem 0.5rem', borderRadius: 6, cursor: 'pointer' }}>
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Doctor Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: C.sub }}>
            <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#059669', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
            <style>{`@keyframes spin{100%{transform:rotate(360deg)}}`}</style>
            Loading doctors...
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: C.card, borderRadius: 20, border: `1.5px dashed ${C.border}` }}>
            <span style={{ fontSize: '3.5rem' }}>??</span>
            <h3 style={{ margin: '1rem 0 0.5rem', color: C.text, fontFamily: "'Outfit',sans-serif" }}>No Doctors Found</h3>
            <p style={{ color: C.sub, fontSize: '0.85rem' }}>Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: '1.25rem' }}>
            {sorted.map(doc => (
              <DoctorCard key={doc.id} doctor={doc} onBook={setSelectedDoctor} />
            ))}
          </div>
        )}
      </main>

      {/* Booking Modal */}
      {selectedDoctor && (
        <AppointmentModal
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          disease={initState.disease || ''}
          symptoms={initState.symptoms || []}
          severity={initState.severity || ''}
        />
      )}
    </div>
  );
}
