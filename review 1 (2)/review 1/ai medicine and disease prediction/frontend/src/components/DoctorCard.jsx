import useIsDark from '../hooks/useIsDark';

function StarRating({ rating, size = '0.72rem' }) {
  return (
    <span style={{ display: 'inline-flex', gap: '1px' }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= Math.round(rating) ? '#f59e0b' : '#cbd5e1', fontSize: size }}>★</span>
      ))}
    </span>
  );
}

const SPEC_ICONS = {
  'Cardiologist': '❤️', 'Pulmonologist': '🫁', 'Pediatrician': '👶',
  'Dermatologist': '🧴', 'Gastroenterologist': '🍽️', 'Endocrinologist': '🧬',
  'Neurologist': '🧠', 'Orthopedist': '🦴', 'Allergist': '🤧',
  'General Physician': '🩺', 'Urologist': '💧', 'Gynecologist': '👩‍⚕️',
  'Psychologist': '🧘', 'Psychiatrist': '🧠', 'Internal Medicine': '🏥',
};

export default function DoctorCard({ doctor, onBook, compact = false }) {
  const isDark = useIsDark();
  const C = {
    card: isDark ? '#1e293b' : '#ffffff',
    border: isDark ? '#334155' : '#e2e8f0',
    text: isDark ? '#f1f5f9' : '#0f172a',
    sub: isDark ? '#94a3b8' : '#64748b',
    inner: isDark ? '#0f172a' : '#f8fafc',
    inBdr: isDark ? '#334155' : '#f1f5f9',
  };

  const specIcon = SPEC_ICONS[doctor.specialization] || '👨‍⚕️';

  if (compact) {
    return (
      <div style={{
        display: 'flex', gap: '0.875rem', alignItems: 'center', padding: '1rem',
        background: C.card, borderRadius: 14, border: `1.5px solid ${C.border}`,
        cursor: 'pointer', transition: 'all 0.2s',
      }} onClick={() => onBook?.(doctor)}>
        <img src={doctor.profile_image} alt={doctor.name}
          style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: C.text, fontSize: '0.88rem' }}>{doctor.name}</div>
          <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>{doctor.specialization}</div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.15rem' }}>
            <StarRating rating={doctor.rating} size="0.65rem" />
            <span style={{ fontSize: '0.68rem', color: C.sub }}>{doctor.rating} · {doctor.experience_years}y exp</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: C.text }}>₹{doctor.consultation_fee}</div>
          <button style={{
            marginTop: '0.3rem', padding: '0.35rem 0.7rem', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff',
            fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer',
          }}>Book →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="doc-card" style={{
      background: C.card, borderRadius: 20, padding: '1.5rem',
      border: `1.5px solid ${C.border}`, transition: 'all 0.25s',
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    }}>
      {/* Doctor header */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img src={doctor.profile_image} alt={doctor.name}
            style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: `2px solid #05966930` }} />
          {doctor.verified && (
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: '50%', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${C.card}` }}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="2 6 5 9 10 3"/></svg>
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, color: C.text, fontSize: '0.95rem', fontFamily: "'Outfit',sans-serif" }}>{doctor.name}</span>
            {doctor.verified && <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.35rem', borderRadius: 4, background: '#ecfdf5', color: '#059669' }}>🛡 Verified</span>}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>{specIcon} {doctor.specialization}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
            <StarRating rating={doctor.rating} />
            <span style={{ fontSize: '0.72rem', color: C.sub, fontWeight: 600 }}>{doctor.rating}</span>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
        {[
          ['🏥', doctor.clinic],
          ['📍', doctor.location || `${doctor.distance_km} km`],
          ['🗓️', `${doctor.experience_years} yrs experience`],
          ['💰', `₹${doctor.consultation_fee}`],
        ].map(([icon, val], i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.72rem' }}>{icon}</span>
            <span style={{ fontSize: '0.72rem', color: C.sub, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</span>
          </div>
        ))}
      </div>

      {/* About preview */}
      {doctor.about && (
        <p style={{ fontSize: '0.72rem', color: C.sub, lineHeight: 1.5, margin: '0 0 0.875rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {doctor.about}
        </p>
      )}

      {/* Tags */}
      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {doctor.video_consultation && (
          <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: 99, background: isDark ? '#7c3aed20' : '#ede9fe', color: '#7c3aed' }}>🎥 Video</span>
        )}
        <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: 99, background: isDark ? '#0ea5e920' : '#f0f9ff', color: '#0ea5e9' }}>⚡ Fast Booking</span>
        {(doctor.languages || []).slice(0, 2).map(lang => (
          <span key={lang} style={{ fontSize: '0.62rem', fontWeight: 600, padding: '0.15rem 0.45rem', borderRadius: 99, background: C.inner, color: C.sub, border: `1px solid ${C.inBdr}` }}>{lang}</span>
        ))}
      </div>

      {/* Book button */}
      <button onClick={() => onBook?.(doctor)}
        style={{
          width: '100%', padding: '0.7rem', borderRadius: 12, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff',
          fontWeight: 700, fontSize: '0.85rem', fontFamily: 'inherit',
          boxShadow: '0 4px 14px rgba(5,150,105,0.25)', transition: 'all 0.2s',
        }}>
        Book Appointment →
      </button>
    </div>
  );
}
