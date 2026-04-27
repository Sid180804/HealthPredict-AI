import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_API_BASE;

const SPECIALIZATIONS = [
  'General Physician','Cardiologist','Dermatologist','Endocrinologist',
  'Gastroenterologist','Neurologist','Oncologist','Orthopedic Surgeon',
  'Pediatrician','Psychiatrist','Pulmonologist','Radiologist',
  'Rheumatologist','Urologist','Ophthalmologist','ENT Specialist',
  'Gynecologist','Nephrologist','Allergist','Surgeon',
];

const TIME_SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00'];
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const inputStyle = { width: '100%', padding: '0.75rem 0.875rem', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.9rem', outline: 'none', color: '#0f172a', background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s' };
const labelStyle = { display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' };

function SectionCard({ title, desc, icon, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: '1.75rem', border: '1.5px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>{icon}</div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif" }}>{title}</h3>
          {desc && <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>{desc}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function DoctorOnboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    specialization: '',
    experience_years: '',
    fees: '',
    city: user?.city || '',
    bio: '',
    license_number: '',
    hospital_name: '',
    languages: [],
    availability: {},
    education: '',
    achievements: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [availDay, setAvailDay] = useState('Monday');

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/api/doctor/profile`);
        const p = res.data.profile || res.data;
        if (p) {
          setForm(prev => ({
            ...prev,
            specialization: p.specialization || '',
            experience_years: p.experience_years || p.experience || '',
            fees: p.fees || p.consultation_fee || '',
            city: p.city || user?.city || '',
            bio: p.bio || '',
            license_number: p.license_number || '',
            hospital_name: p.hospital_name || '',
            languages: p.languages || [],
            availability: p.availability || {},
            education: p.education || '',
            achievements: p.achievements || '',
          }));
        }
      } catch { /* fresh profile */ }
      setFetchLoading(false);
    })();
  }, [user]);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const toggleSlot = (day, slot) => {
    setForm(prev => {
      const daySlots = prev.availability[day] || [];
      const updated = daySlots.includes(slot) ? daySlots.filter(s => s !== slot) : [...daySlots, slot].sort();
      return { ...prev, availability: { ...prev.availability, [day]: updated } };
    });
  };

  const toggleLanguage = (lang) => {
    setForm(prev => ({
      ...prev,
      languages: prev.languages.includes(lang) ? prev.languages.filter(l => l !== lang) : [...prev.languages, lang],
    }));
  };

  const handleSave = async () => {
    if (!form.specialization) { setError('Specialization is required.'); return; }
    setLoading(true); setError('');
    try {
      await axios.put(`${API}/api/doctor/profile`, {
        specialization: form.specialization,
        experience_years: form.experience_years ? +form.experience_years : undefined,
        fees: form.fees ? +form.fees : undefined,
        city: form.city,
        bio: form.bio,
        license_number: form.license_number,
        hospital_name: form.hospital_name,
        languages: form.languages,
        education: form.education,
        achievements: form.achievements,
      });
      if (Object.keys(form.availability).length > 0) {
        await axios.put(`${API}/api/doctor/availability`, { availability: form.availability });
      }
      setSaved(true);
      setTimeout(() => { setSaved(false); navigate('/doctor/dashboard'); }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save profile. Please try again.');
    }
    setLoading(false);
  };

  // Profile strength
  const fields = [form.specialization, form.experience_years, form.fees, form.city, form.bio, form.license_number];
  const filled = fields.filter(Boolean).length;
  const strength = Math.round((filled / fields.length) * 100);

  if (fetchLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', fontFamily: "'Inter',sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        <p style={{ color: '#64748b', marginTop: '1rem', fontSize: '0.875rem' }}>Loading your profile…</p>
        <style>{`@keyframes spin{100%{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800;900&display=swap');
        @keyframes spin{100%{transform:rotate(360deg)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        input:focus,select:focus,textarea:focus{border-color:#7c3aed!important;box-shadow:0 0 0 3px rgba(124,58,237,0.1)}
        .slot-btn:hover{border-color:#7c3aed!important;background:#faf5ff!important}
      `}</style>

      {/* Success overlay */}
      {saved && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '2.5rem', textAlign: 'center', maxWidth: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ width: 60, height: 60, background: '#ecfdf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.75rem' }}>?</div>
            <h3 style={{ margin: '0 0 0.5rem', fontWeight: 900, color: '#0f172a', fontFamily: "'Outfit',sans-serif", fontSize: '1.25rem' }}>Profile Saved!</h3>
            <p style={{ color: '#64748b', margin: 0, fontSize: '0.875rem' }}>Redirecting to your dashboard…</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', height: 68, padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/doctor/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '0.875rem', fontWeight: 600, padding: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Dashboard
          </button>
          <span style={{ color: '#e2e8f0' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>Edit Doctor Profile</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Strength indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: 100, height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ width: `${strength}%`, height: '100%', background: strength >= 80 ? '#7c3aed' : strength >= 50 ? '#f59e0b' : '#ef4444', borderRadius: 99, transition: 'width 0.5s' }} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: strength >= 80 ? '#7c3aed' : '#f59e0b' }}>{strength}% complete</span>
          </div>
          <button onClick={handleSave} disabled={loading}
            style={{ padding: '0.6rem 1.4rem', background: loading ? '#c4b5fd' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }}>
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem', animation: 'slideUp 0.4s ease', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Page title */}
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 900, color: '#0f172a', fontFamily: "'Outfit',sans-serif" }}>
            Doctor Profile Setup
          </h1>
          <p style={{ margin: '0.3rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>Complete your profile so patients can find and book you easily.</p>
        </div>

        {error && (
          <div style={{ padding: '0.875rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, color: '#dc2626', fontSize: '0.875rem', fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* -- Professional Info ---------------------------- */}
        <SectionCard title="Professional Details" desc="Your credentials and clinical information" icon="??">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Specialization *</label>
              <select value={form.specialization} onChange={e => set('specialization', e.target.value)} style={inputStyle}>
                <option value="">Select your specialization…</option>
                {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Years of Experience</label>
              <input type="number" min="0" max="60" value={form.experience_years} onChange={e => set('experience_years', e.target.value)} placeholder="e.g. 8" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Consultation Fee (?)</label>
              <input type="number" min="0" value={form.fees} onChange={e => set('fees', e.target.value)} placeholder="e.g. 500" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>License / Registration No.</label>
              <input type="text" value={form.license_number} onChange={e => set('license_number', e.target.value)} placeholder="MCI-123456" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>City / Location</label>
              <input type="text" value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Mumbai" style={inputStyle} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Hospital / Clinic Name</label>
              <input type="text" value={form.hospital_name} onChange={e => set('hospital_name', e.target.value)} placeholder="e.g. Apollo Hospital, Fortis Clinic" style={inputStyle} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Education & Qualifications</label>
              <input type="text" value={form.education} onChange={e => set('education', e.target.value)} placeholder="e.g. MBBS (AIIMS), MD - General Medicine" style={inputStyle} />
            </div>
          </div>
        </SectionCard>

        {/* -- Bio ------------------------------------------- */}
        <SectionCard title="About You" desc="Help patients understand your approach and expertise" icon="??">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={labelStyle}>Professional Bio</label>
              <textarea
                value={form.bio}
                onChange={e => set('bio', e.target.value)}
                rows={5}
                placeholder="Tell patients about your background, approach to healthcare, what conditions you specialize in, and what patients can expect during a consultation..."
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.4rem' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{form.bio.length} / 600 characters</span>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Awards & Achievements (optional)</label>
              <input type="text" value={form.achievements} onChange={e => set('achievements', e.target.value)} placeholder="e.g. Best Doctor Award 2022, Published in JAMA..." style={inputStyle} />
            </div>
          </div>
        </SectionCard>

        {/* -- Languages ----------------------------------- */}
        <SectionCard title="Languages Spoken" desc="Patients will see which languages you can consult in" icon="??">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
            {['English','Hindi','Tamil','Telugu','Bengali','Marathi','Gujarati','Kannada','Malayalam','Punjabi','Odia','Urdu'].map(lang => {
              const selected = form.languages.includes(lang);
              return (
                <button key={lang} onClick={() => toggleLanguage(lang)}
                  style={{ padding: '0.5rem 1rem', borderRadius: 99, border: `1.5px solid ${selected ? '#7c3aed' : '#e2e8f0'}`, background: selected ? '#faf5ff' : '#fff', color: selected ? '#7c3aed' : '#475569', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
                  {selected ? '? ' : ''}{lang}
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* -- Availability ------------------------------- */}
        <SectionCard title="Availability Schedule" desc="Select the time slots you're available for consultations" icon="??">
          {/* Day selector */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {DAYS.map(d => {
              const hasSlots = (form.availability[d] || []).length > 0;
              return (
                <button key={d} onClick={() => setAvailDay(d)}
                  style={{ padding: '0.5rem 0.875rem', borderRadius: 10, border: `1.5px solid ${availDay === d ? '#7c3aed' : '#e2e8f0'}`, background: availDay === d ? '#faf5ff' : hasSlots ? '#f0fdf4' : '#fff', color: availDay === d ? '#7c3aed' : hasSlots ? '#059669' : '#64748b', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', position: 'relative' }}>
                  {d.slice(0, 3)}
                  {hasSlots && <span style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: '50%', background: '#059669' }} />}
                </button>
              );
            })}
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 14, padding: '1.25rem', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>{availDay} Slots</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{(form.availability[availDay] || []).length} selected</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {TIME_SLOTS.map(slot => {
                const selected = (form.availability[availDay] || []).includes(slot);
                return (
                  <button key={slot} className="slot-btn" onClick={() => toggleSlot(availDay, slot)}
                    style={{ padding: '0.5rem 0.875rem', borderRadius: 9, border: `1.5px solid ${selected ? '#7c3aed' : '#e2e8f0'}`, background: selected ? '#7c3aed' : '#fff', color: selected ? '#fff' : '#475569', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
                    {slot}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: '1rem' }}>
              <button onClick={() => { TIME_SLOTS.forEach(s => { if (!(form.availability[availDay] || []).includes(s)) toggleSlot(availDay, s); }); }}
                style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Select All for {availDay.slice(0,3)}
              </button>
              <span style={{ color: '#e2e8f0', margin: '0 0.5rem' }}>|</span>
              <button onClick={() => set('availability', { ...form.availability, [availDay]: [] })}
                style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Clear
              </button>
            </div>
          </div>
        </SectionCard>

        {/* Save CTA */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingBottom: '2rem' }}>
          <button onClick={() => navigate('/doctor/dashboard')} style={{ padding: '0.875rem 1.75rem', border: '1.5px solid #e2e8f0', borderRadius: 12, background: '#fff', color: '#475569', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading}
            style={{ padding: '0.875rem 2rem', background: loading ? '#c4b5fd' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 6px 20px rgba(124,58,237,0.35)' }}>
            {loading ? 'Saving Profile…' : 'Save Profile Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
