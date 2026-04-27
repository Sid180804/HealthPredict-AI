import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import DiagnosisDoctorSuggestion from '../components/DiagnosisDoctorSuggestion';

const API = import.meta.env.VITE_API_BASE;

const ZONES = [
  { id: 'head', label: 'Head', icon: '??', cx: 200, cy: 52, r: 38, symptoms: ['Headache', 'Dizziness', 'High Fever', 'Blurred Vision'], desc: 'Head, brain, eyes, ears' },
  { id: 'throat', label: 'Throat', icon: '???', cx: 200, cy: 112, r: 18, symptoms: ['Throat Pain', 'Neck Pain', 'Stiff Neck', 'Cough'], desc: 'Throat, neck, lymph nodes' },
  { id: 'chest', label: 'Chest', icon: '??', cx: 200, cy: 188, r: 46, symptoms: ['Chest Pain', 'Breathlessness', 'Cough', 'Sweating'], desc: 'Heart, lungs, ribs' },
  { id: 'left_shoulder', label: 'L. Shoulder', icon: '??', cx: 132, cy: 158, r: 22, symptoms: ['Joint Pain', 'Muscle Weakness', 'Back Pain'], desc: 'Left shoulder joint' },
  { id: 'right_shoulder', label: 'R. Shoulder', icon: '??', cx: 268, cy: 158, r: 22, symptoms: ['Joint Pain', 'Muscle Weakness', 'Back Pain'], desc: 'Right shoulder joint' },
  { id: 'left_arm', label: 'L. Arm', icon: '??', cx: 102, cy: 228, r: 20, symptoms: ['Muscle Weakness', 'Joint Pain', 'Skin Rash'], desc: 'Left upper arm' },
  { id: 'right_arm', label: 'R. Arm', icon: '??', cx: 298, cy: 228, r: 20, symptoms: ['Muscle Weakness', 'Joint Pain', 'Skin Rash'], desc: 'Right upper arm' },
  { id: 'left_hand', label: 'L. Hand', icon: '?', cx: 82, cy: 300, r: 16, symptoms: ['Joint Pain', 'Itching', 'Swelling'], desc: 'Left hand and wrist' },
  { id: 'right_hand', label: 'R. Hand', icon: '?', cx: 318, cy: 300, r: 16, symptoms: ['Joint Pain', 'Itching', 'Swelling'], desc: 'Right hand and wrist' },
  { id: 'abdomen', label: 'Abdomen', icon: '??', cx: 200, cy: 258, r: 40, symptoms: ['Abdominal Pain', 'Nausea', 'Vomiting', 'Constipation'], desc: 'Stomach, intestines, liver' },
  { id: 'lower_abdomen', label: 'Lower Belly', icon: '??', cx: 200, cy: 320, r: 30, symptoms: ['Abdominal Pain', 'Constipation', 'Diarrhoea', 'Dehydration'], desc: 'Lower abdomen, bladder' },
  { id: 'left_thigh', label: 'L. Thigh', icon: '??', cx: 170, cy: 400, r: 26, symptoms: ['Joint Pain', 'Muscle Weakness', 'Fatigue'], desc: 'Left thigh and hip' },
  { id: 'right_thigh', label: 'R. Thigh', icon: '??', cx: 230, cy: 400, r: 26, symptoms: ['Joint Pain', 'Muscle Weakness', 'Fatigue'], desc: 'Right thigh and hip' },
  { id: 'left_knee', label: 'L. Knee', icon: '??', cx: 168, cy: 465, r: 20, symptoms: ['Joint Pain', 'Swelling', 'Back Pain'], desc: 'Left knee joint' },
  { id: 'right_knee', label: 'R. Knee', icon: '??', cx: 232, cy: 465, r: 20, symptoms: ['Joint Pain', 'Swelling', 'Back Pain'], desc: 'Right knee joint' },
  { id: 'left_foot', label: 'L. Foot', icon: '??', cx: 165, cy: 555, r: 18, symptoms: ['Joint Pain', 'Swelling', 'Fatigue'], desc: 'Left foot and ankle' },
  { id: 'right_foot', label: 'R. Foot', icon: '??', cx: 235, cy: 555, r: 18, symptoms: ['Joint Pain', 'Swelling', 'Fatigue'], desc: 'Right foot and ankle' },
  { id: 'back', label: 'Back', icon: '??', cx: 200, cy: 592, r: 0, symptoms: ['Back Pain', 'Muscle Weakness', 'Joint Pain'], desc: 'Spine and lower back' },
];

const PAIN_LEVELS = [
  { level: 1, label: 'Mild', emoji: '??', color: '#16a34a', bg: '#dcfce7', light: '#f0fdf4' },
  { level: 2, label: 'Moderate', emoji: '??', color: '#d97706', bg: '#fef3c7', light: '#fffbeb' },
  { level: 3, label: 'Severe', emoji: '??', color: '#dc2626', bg: '#fee2e2', light: '#fff5f5' },
];

const PAIN_TYPES = [
  { id: 'aching', label: 'Aching', emoji: '??' },
  { id: 'sharp', label: 'Sharp', emoji: '?' },
  { id: 'burning', label: 'Burning', emoji: '??' },
  { id: 'throbbing', label: 'Throbbing', emoji: '??' },
  { id: 'cramping', label: 'Cramping', emoji: '??' },
  { id: 'pressure', label: 'Pressure', emoji: '??' },
];

const DURATIONS = [
  { value: 'just_now', label: 'Just now', emoji: '??' },
  { value: 'hours', label: 'Few hours', emoji: '?' },
  { value: '1_3_days', label: '1–3 days', emoji: '??' },
  { value: '4_7_days', label: '4–7 days', emoji: '???' },
  { value: '1_2_weeks', label: '1–2 weeks', emoji: '??' },
  { value: 'over_2wks', label: '2+ weeks', emoji: '?' },
];

const ALL_SYMPTOMS = [
  'Fever', 'Cough', 'Headache', 'Fatigue', 'Vomiting', 'Nausea', 'Chest Pain', 'Skin Rash',
  'Joint Pain', 'Back Pain', 'Dizziness', 'Diarrhoea', 'Breathlessness', 'Weight Loss',
  'High Fever', 'Chills', 'Sweating', 'Abdominal Pain', 'Itching', 'Constipation',
  'Neck Pain', 'Muscle Weakness', 'Dehydration', 'Dark Urine', 'Yellowish Skin',
  'Throat Pain', 'Swelling', 'Stiff Neck', 'Blurred Vision', 'Loss of Appetite',
];

const sevColor = (s) => ({ high: '#dc2626', medium: '#d97706', low: '#16a34a' }[s] || '#64748b');

// --- Annotation popup --------------------------------------------------------
function Popup({ zone, existing, onSave, onClose }) {
  const [pl, setPl] = useState(existing?.painLevel ?? 1);
  const [pt, setPt] = useState(existing?.painType ?? 'aching');
  const [dur, setDur] = useState(existing?.duration ?? 'just_now');
  const [note, setNote] = useState(existing?.note ?? '');

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, padding: '1.75rem', width: '100%', maxWidth: 430, boxShadow: '0 40px 80px rgba(0,0,0,0.22)', fontFamily: "'Nunito',sans-serif" }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: 36, marginBottom: 4 }}>{zone.icon}</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{zone.label}</h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0' }}>{zone.desc}</p>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        <p style={{ fontSize: '0.78rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.6rem' }}>Pain intensity</p>
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem' }}>
          {PAIN_LEVELS.map(p => (
            <button key={p.level} onClick={() => setPl(p.level)} style={{ flex: 1, padding: '0.75rem 0.4rem', borderRadius: 14, border: `2px solid ${pl === p.level ? p.color : '#e2e8f0'}`, background: pl === p.level ? p.bg : '#f8fafc', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
              <span style={{ fontSize: 22 }}>{p.emoji}</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: pl === p.level ? p.color : '#94a3b8' }}>{p.label}</span>
            </button>
          ))}
        </div>

        <p style={{ fontSize: '0.78rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.6rem' }}>Type of pain</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '1.25rem' }}>
          {PAIN_TYPES.map(t => (
            <button key={t.id} onClick={() => setPt(t.id)} style={{ padding: '0.4rem 0.85rem', borderRadius: 20, border: `1.5px solid ${pt === t.id ? '#0ea5e9' : '#e2e8f0'}`, background: pt === t.id ? '#e0f2fe' : '#f8fafc', color: pt === t.id ? '#0369a1' : '#64748b', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        <p style={{ fontSize: '0.78rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.6rem' }}>How long?</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
          {DURATIONS.map(d => (
            <button key={d.value} onClick={() => setDur(d.value)} style={{ padding: '0.38rem 0.75rem', borderRadius: 20, border: `1.5px solid ${dur === d.value ? '#8b5cf6' : '#e2e8f0'}`, background: dur === d.value ? '#f3e8ff' : '#f8fafc', color: dur === d.value ? '#7c3aed' : '#64748b', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}>
              {d.emoji} {d.label}
            </button>
          ))}
        </div>

        <p style={{ fontSize: '0.78rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>Extra details (optional)</p>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
          placeholder="e.g. gets worse at night, after eating..."
          style={{ width: '100%', padding: '0.7rem', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '0.88rem', resize: 'none', outline: 'none', fontFamily: 'inherit', color: '#0f172a', boxSizing: 'border-box', marginBottom: '1.25rem' }}
        />

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.9rem', borderRadius: 14, border: '1.5px solid #e2e8f0', background: 'transparent', color: '#64748b', fontSize: '0.92rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={() => onSave({ zoneId: zone.id, painLevel: pl, painType: pt, duration: dur, note, symptoms: zone.symptoms })} style={{ flex: 2, padding: '0.9rem', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#0ea5e9,#7c3aed)', color: 'white', fontSize: '0.92rem', fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(14,165,233,0.35)' }}>
            ? Save Pain Point
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Anatomy SVG -------------------------------------------------------------
function BodyMap({ annotations, onZoneClick }) {
  const [hov, setHov] = useState(null);
  const visZones = ZONES.filter(z => z.r > 0);

  const fill = (id) => {
    const a = annotations[id];
    if (hov === id) return 'rgba(14,165,233,0.22)';
    if (!a) return 'rgba(100,116,139,0.07)';
    const f = { 1: 'rgba(22,163,74,0.2)', 2: 'rgba(217,119,6,0.25)', 3: 'rgba(220,38,38,0.28)' };
    return f[a.painLevel] || 'rgba(14,165,233,0.18)';
  };
  const stroke = (id) => {
    const a = annotations[id];
    if (hov === id) return '#0ea5e9';
    if (!a) return 'rgba(148,163,184,0.25)';
    const s = { 1: '#16a34a', 2: '#d97706', 3: '#dc2626' };
    return s[a.painLevel] || '#0ea5e9';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg viewBox="0 0 400 630" width="100%" style={{ maxWidth: 270, overflow: 'visible' }}>
        <defs>
          <filter id="glow2"><feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>

        {/* -- Body silhouette (dark fill) -- */}
        <g fill="#1e293b" opacity="0.14">
          <ellipse cx="200" cy="52" rx="38" ry="44" />
          <rect x="185" y="93" width="30" height="26" rx="5" />
          <path d="M148,116 C128,122 116,140 114,165 L108,252 C106,275 116,288 132,295 L132,362 L268,362 L268,295 C284,288 294,275 292,252 L286,165 C284,140 272,122 252,116 Z" />
          <path d="M116,165 C98,154 82,160 74,176 L60,244 C56,263 62,276 74,279 L94,284 L114,212 Z" />
          <path d="M284,165 C302,154 318,160 326,176 L340,244 C344,263 338,276 326,279 L306,284 L286,212 Z" />
          <path d="M74,279 L62,318 C58,332 62,345 72,348 L90,350 L100,308 Z" />
          <path d="M326,279 L338,318 C342,332 338,345 328,348 L310,350 L300,308 Z" />
          <ellipse cx="80" cy="362" rx="16" ry="20" />
          <ellipse cx="320" cy="362" rx="16" ry="20" />
          <path d="M132,362 L114,458 C108,484 110,505 124,513 L152,517 L168,422 L168,362 Z" />
          <path d="M268,362 L286,458 C292,484 290,505 276,513 L248,517 L232,422 L232,362 Z" />
          <path d="M124,513 L116,588 C114,602 118,613 130,615 L153,616 L159,534 Z" />
          <path d="M276,513 L284,588 C286,602 282,613 270,615 L247,616 L241,534 Z" />
          <ellipse cx="147" cy="617" rx="27" ry="10" />
          <ellipse cx="253" cy="617" rx="27" ry="10" />
        </g>

        {/* -- Skeletal lines -- */}
        <g fill="none" stroke="#334155" strokeWidth="0.6" opacity="0.16">
          <path d="M168,122 Q200,114 232,122" />
          <line x1="200" y1="122" x2="200" y2="294" />
          {[0, 1, 2, 3, 4].map(i => (
            <g key={i}>
              <path d={`M200,${136 + i * 24} Q184,${130 + i * 24} 150,${148 + i * 24}`} />
              <path d={`M200,${136 + i * 24} Q216,${130 + i * 24} 250,${148 + i * 24}`} />
            </g>
          ))}
          <line x1="176" y1="222" x2="224" y2="222" />
          <line x1="176" y1="248" x2="224" y2="248" />
          <line x1="176" y1="274" x2="224" y2="274" />
          <ellipse cx="152" cy="470" rx="13" ry="9" />
          <ellipse cx="248" cy="470" rx="13" ry="9" />
          <line x1="144" y1="482" x2="140" y2="585" />
          <line x1="256" y1="482" x2="260" y2="585" />
        </g>

        {/* -- Clickable zones -- */}
        {visZones.map(zone => {
          const ann = annotations[zone.id];
          const pl = ann ? PAIN_LEVELS.find(p => p.level === ann.painLevel) : null;
          const isHov = hov === zone.id;
          return (
            <g key={zone.id} style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHov(zone.id)} onMouseLeave={() => setHov(null)}
              onClick={() => onZoneClick(zone)}>
              <circle cx={zone.cx} cy={zone.cy} r={zone.r + (isHov ? 5 : 0)}
                fill={fill(zone.id)} stroke={stroke(zone.id)}
                strokeWidth={ann ? 2.5 : isHov ? 2 : 1}
                style={{ transition: 'all 0.2s' }}
                filter={ann ? 'url(#glow2)' : undefined}
              />
              {ann && (
                <>
                  <circle cx={zone.cx + zone.r * 0.62} cy={zone.cy - zone.r * 0.62} r={9} fill={pl?.color || '#dc2626'} />
                  <text x={zone.cx + zone.r * 0.62} y={zone.cy - zone.r * 0.62 + 4} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" style={{ pointerEvents: 'none', fontFamily: 'sans-serif' }}>
                    {'!'.repeat(ann.painLevel)}
                  </text>
                </>
              )}
              {isHov && (
                <g style={{ pointerEvents: 'none' }}>
                  <rect x={zone.cx - 44} y={zone.cy + zone.r + 6} width={88} height={22} rx={7} fill="#0f172a" opacity={0.88} />
                  <text x={zone.cx} y={zone.cy + zone.r + 21} textAnchor="middle" fill="white" fontSize="10" fontWeight="600" style={{ fontFamily: 'sans-serif' }}>{zone.label}</text>
                </g>
              )}
            </g>
          );
        })}

        {/* Back zone */}
        <g style={{ cursor: 'pointer' }} onMouseEnter={() => setHov('back')} onMouseLeave={() => setHov(null)} onClick={() => onZoneClick(ZONES.find(z => z.id === 'back'))}>
          <rect x={152} y={582} width={96} height={28} rx={10}
            fill={fill('back')} stroke={stroke('back')} strokeWidth={annotations['back'] ? 2 : 1} style={{ transition: 'all 0.2s' }} />
          <text x={200} y={601} textAnchor="middle" fill={hov === 'back' ? '#0ea5e9' : '#64748b'} fontSize="11" fontWeight="600" style={{ pointerEvents: 'none', fontFamily: 'sans-serif' }}>
            {annotations['back'] ? '? Back Pain' : '+ Back Pain'}
          </text>
        </g>
      </svg>

      <div style={{ display: 'flex', gap: '0.9rem', marginTop: '0.75rem' }}>
        {PAIN_LEVELS.map(p => (
          <div key={p.level} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color }} />
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>{p.label}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '0.4rem', textAlign: 'center' }}>
        ?? Tap any body part to mark pain
      </p>
    </div>
  );
}

// --- Main component -----------------------------------------------------------
export default function Predict() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [freeText, setFreeText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [annotations, setAnnotations] = useState({});
  const [activeZone, setActiveZone] = useState(null);

  useEffect(() => {
    const bodySyms = Object.values(annotations).flatMap(a => a.symptoms || []);
    setSelectedSymptoms(prev => Array.from(new Set([...prev, ...bodySyms])));
  }, [annotations]);

  const saveAnnotation = (ann) => { setAnnotations(prev => ({ ...prev, [ann.zoneId]: ann })); setActiveZone(null); };
  const removeAnnotation = (zid) => setAnnotations(prev => { const n = { ...prev }; delete n[zid]; return n; });
  const toggle = (s) => setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const filtered = ALL_SYMPTOMS.filter(s =>
    !selectedSymptoms.includes(s) && s.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 36);

  const annCount = Object.keys(annotations).length;
  const canPredict = selectedSymptoms.length > 0 || freeText.trim() || annCount > 0;

  const predict = async () => {
    if (!canPredict) { setError('Please mark body areas or select at least one symptom.'); return; }
    const bodyCtx = Object.entries(annotations).map(([zid, a]) => {
      const zone = ZONES.find(z => z.id === zid);
      const pl = PAIN_LEVELS.find(p => p.level === a.painLevel);
      const pt = PAIN_TYPES.find(t => t.id === a.painType);
      const d = DURATIONS.find(x => x.value === a.duration);
      return `${zone?.label}: ${pt?.label} pain (${pl?.label}) for ${d?.label}${a.note ? ` — ${a.note}` : ''}`;
    }).join('; ');
    const combined = [freeText.trim(), bodyCtx].filter(Boolean).join('. ');
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch(`${API}/api/ai/predict`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: selectedSymptoms, free_text: combined,
          user_profile: { age: parseInt(age) || 30, gender: gender || 'unknown' },
          user_id: user?.email || user?.id || 'default',
          user_email: user?.email || '',
          body_regions: Object.entries(annotations).map(([zid, a]) => ({ region: ZONES.find(z => z.id === zid)?.label, ...a })),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e.message || 'Could not reach server. Please check your connection.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Nunito',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes spin { 100%{transform:rotate(360deg)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .sym-btn:hover { background:#e0f2fe!important; border-color:#0ea5e9!important; color:#0369a1!important; }
        .sel-sym:hover { background:#b91c1c!important; }
        .chip-btn:hover { opacity:0.85; transform:translateY(-1px); }
      `}</style>
      <Header title="Health Diagnosis" />

      {activeZone && (
        <Popup zone={activeZone} existing={annotations[activeZone.id]} onSave={saveAnnotation} onClose={() => setActiveZone(null)} />
      )}

      <main style={{ maxWidth: 1300, margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>

        {/* Progress bar */}
        <div style={{ background: 'white', borderRadius: 16, padding: '1rem 1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>How to use:</span>
          {[['1??', 'Tap body parts to mark pain'], ['2??', 'Add more symptoms below'], ['3??', 'Hit Analyse — get results!']].map(([n, t], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>{n} {t}</span>
              {i < 2 && <span style={{ color: '#cbd5e1', fontSize: '1.1rem' }}>›</span>}
            </div>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            {annCount > 0 && <span style={{ fontSize: '0.78rem', fontWeight: 800, background: '#fef3c7', color: '#d97706', padding: '0.3rem 0.7rem', borderRadius: 20 }}>{annCount} area{annCount > 1 ? 's' : ''} marked</span>}
            {selectedSymptoms.length > 0 && <span style={{ fontSize: '0.78rem', fontWeight: 800, background: '#dbeafe', color: '#1d4ed8', padding: '0.3rem 0.7rem', borderRadius: 20 }}>{selectedSymptoms.length} symptom{selectedSymptoms.length > 1 ? 's' : ''}</span>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* -- Body map -- */}
          <div style={{ width: 290, flexShrink: 0, background: 'white', borderRadius: 20, padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>?? Body Map</h2>
              {annCount > 0 && <button onClick={() => setAnnotations({})} style={{ fontSize: '0.72rem', color: '#dc2626', background: '#fee2e2', border: 'none', borderRadius: 6, padding: '0.25rem 0.5rem', cursor: 'pointer', fontWeight: 800, fontFamily: 'inherit' }}>Clear all</button>}
            </div>

            <BodyMap annotations={annotations} onZoneClick={setActiveZone} />

            {annCount > 0 && (
              <div style={{ marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>Marked areas</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {Object.entries(annotations).map(([zid, ann]) => {
                    const zone = ZONES.find(z => z.id === zid);
                    const pl = PAIN_LEVELS.find(p => p.level === ann.painLevel);
                    const pt = PAIN_TYPES.find(t => t.id === ann.painType);
                    return (
                      <div key={zid} className="chip-btn" onClick={() => setActiveZone(zone)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: pl.bg, border: `1.5px solid ${pl.color}40`, borderRadius: 10, padding: '0.5rem 0.65rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                        <span style={{ fontSize: 16 }}>{zone?.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>{zone?.label}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{pt?.emoji} {pt?.label} · {pl.emoji} {pl.label}</div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); removeAnnotation(zid) }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px 4px', fontSize: '0.95rem', lineHeight: 1 }}>×</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* -- Inputs -- */}
          <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>

            {/* Profile */}
            <div style={{ background: 'white', borderRadius: 20, padding: '1.25rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.9rem' }}>?? Patient Info</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                  { label: 'Age', el: <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 35" style={{ width: '100%', padding: '0.6rem 0.8rem', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, color: '#0f172a', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} /> },
                  { label: 'Sex', el: <select value={gender} onChange={e => setGender(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.8rem', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, color: gender ? '#0f172a' : '#94a3b8', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }}><option value="">Select...</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select> },
                ].map(({ label, el }) => (
                  <div key={label}>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>{label}</label>
                    {el}
                  </div>
                ))}
              </div>
            </div>

            {/* Symptom picker */}
            <div style={{ background: 'white', borderRadius: 20, padding: '1.25rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.9rem' }}>?? Symptoms</h3>

              <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>??</span>
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search symptoms..."
                  style={{ width: '100%', padding: '0.6rem 0.8rem 0.6rem 2.1rem', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#0f172a' }}
                />
              </div>

              {selectedSymptoms.length > 0 && (
                <div style={{ marginBottom: '0.75rem', padding: '0.7rem', background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>? Selected ({selectedSymptoms.length})</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {selectedSymptoms.map(s => (
                      <button key={s} onClick={() => toggle(s)} className="sel-sym" style={{ padding: '0.28rem 0.6rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: 20, fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                        {s} ×
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: 155, overflowY: 'auto' }}>
                {filtered.map(s => (
                  <button key={s} onClick={() => toggle(s)} className="sym-btn" style={{ padding: '0.32rem 0.7rem', background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#64748b', borderRadius: 20, fontSize: '0.79rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                    + {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Free text */}
            <div style={{ background: 'white', borderRadius: 20, padding: '1.25rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.75rem' }}>?? Describe in your words</h3>
              <textarea value={freeText} onChange={e => setFreeText(e.target.value)} rows={3}
                placeholder="Tell us more — when it started, what makes it better or worse, other issues..."
                style={{ width: '100%', padding: '0.75rem', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, color: '#0f172a', fontSize: '0.88rem', resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            {error && <div style={{ padding: '0.9rem 1rem', background: '#fee2e2', borderLeft: '4px solid #dc2626', borderRadius: 12, color: '#dc2626', fontSize: '0.88rem', fontWeight: 700 }}>{error}</div>}

            <button onClick={predict} disabled={loading || !canPredict} style={{
              padding: '1.1rem 2rem', borderRadius: 16, border: 'none', fontSize: '1.05rem', fontWeight: 900,
              cursor: (loading || !canPredict) ? 'not-allowed' : 'pointer',
              background: (loading || !canPredict) ? '#e2e8f0' : 'linear-gradient(135deg,#0ea5e9 0%,#7c3aed 100%)',
              color: (loading || !canPredict) ? '#94a3b8' : 'white',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem',
              boxShadow: (loading || !canPredict) ? 'none' : '0 6px 24px rgba(14,165,233,0.4)',
              transition: 'all 0.2s', fontFamily: 'inherit',
            }}>
              {loading ? <><div style={{ width: 20, height: 20, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Analysing your symptoms...</> : '? Run Health Analysis'}
            </button>

            <div style={{ textAlign: 'center', padding: '0.75rem', background: '#fff7ed', borderRadius: 12, border: '1px solid #fed7aa' }}>
              <p style={{ fontSize: '0.78rem', color: '#92400e', margin: 0, lineHeight: 1.5 }}>
                ?? AI guidance only — not a substitute for a doctor.<br />
                <strong style={{ color: '#dc2626' }}>Emergency? Call 108 immediately.</strong>
              </p>
            </div>
          </div>

          {/* -- Results -- */}
          <div style={{ flex: '1 1 300px', minWidth: 0 }}>
            {!result && !loading && (
              <div style={{ background: 'white', borderRadius: 20, padding: '3rem 2rem', border: '2px dashed #e2e8f0', textAlign: 'center', minHeight: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 60, marginBottom: '1rem' }}>??</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem' }}>Ready to analyse</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: 270, lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  Mark pain areas on the body map, then tap Run Health Analysis.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', textAlign: 'left' }}>
                  {['Tap a body part to mark pain', 'Choose pain type & how long', 'Add symptoms or describe freely', 'Hit Run Health Analysis'].map((tip, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: '#475569' }}>
                      <div style={{ width: 24, height: 24, background: 'linear-gradient(135deg,#0ea5e9,#7c3aed)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.72rem', fontWeight: 900, flexShrink: 0 }}>{i + 1}</div>
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div style={{ background: 'white', borderRadius: 20, padding: '3rem 2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', textAlign: 'center', minHeight: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 56, height: 56, border: '4px solid #f1f5f9', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '1.5rem' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem' }}>Analysing your symptoms...</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '1.5rem' }}>Cross-referencing clinical database</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#0ea5e9', animation: `pulse 1.4s infinite ${i * 0.2}s` }} />)}
                </div>
              </div>
            )}

            {result && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'slideUp 0.4s ease-out' }}>

                {result.has_emergency && (
                  <div style={{ background: '#fee2e2', border: '2px solid #fca5a5', borderRadius: 20, padding: '1.25rem', borderLeft: '5px solid #dc2626' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 28, flexShrink: 0 }}>??</span>
                      <div>
                        <h4 style={{ color: '#dc2626', fontSize: '1rem', fontWeight: 900, margin: '0 0 0.2rem' }}>Emergency Detected</h4>
                        <p style={{ color: '#991b1b', fontSize: '0.86rem', margin: '0 0 0.75rem' }}>Please seek immediate medical help.</p>
                        <a href="tel:108" style={{ background: '#dc2626', color: 'white', padding: '0.6rem 1.25rem', borderRadius: 10, fontSize: '0.9rem', fontWeight: 900, textDecoration: 'none', display: 'inline-block' }}>?? Dial 108 Now</a>
                      </div>
                    </div>
                  </div>
                )}

                {annCount > 0 && (
                  <div style={{ background: 'white', borderRadius: 14, padding: '0.9rem 1.1rem', border: '1px solid #f1f5f9', display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Body data included:</span>
                    {Object.entries(annotations).map(([zid, ann]) => {
                      const zone = ZONES.find(z => z.id === zid);
                      const pl = PAIN_LEVELS.find(p => p.level === ann.painLevel);
                      return <span key={zid} style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem', borderRadius: 20, background: pl.bg, color: pl.color, fontWeight: 800, border: `1px solid ${pl.color}35` }}>{zone?.icon} {zone?.label}</span>;
                    })}
                  </div>
                )}

                <div style={{ background: 'white', borderRadius: 20, padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                    <h3 style={{ fontSize: '1.02rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>?? Diagnosis Results</h3>
                    <span style={{ fontSize: '0.7rem', fontWeight: 900, background: '#f0fdf4', color: '#16a34a', padding: '0.25rem 0.55rem', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {result.model_used?.replace('_', ' ') || 'AI Model'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {(result.predictions || []).map((pred, i) => {
                      const pct = pred.confidence_pct || Math.round((pred.prob || 0) * 100);
                      const sc = sevColor(pred.severity);
                      const isPrimary = i === 0;
                      return (
                        <div key={i} style={{ padding: isPrimary ? '1.2rem' : '0.7rem 0', background: isPrimary ? 'linear-gradient(135deg,#f0f9ff,#faf5ff)' : 'transparent', border: isPrimary ? '1.5px solid #bae6fd' : 'none', borderRadius: isPrimary ? 16 : 0, borderBottom: !isPrimary && i < (result.predictions.length - 1) ? '1px solid #f1f5f9' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.7rem' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                                {isPrimary && <span style={{ background: 'linear-gradient(135deg,#0ea5e9,#7c3aed)', color: 'white', fontSize: '0.64rem', fontWeight: 900, padding: '0.15rem 0.5rem', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Most Likely</span>}
                                <h4 style={{ fontSize: isPrimary ? '1.08rem' : '0.92rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{pred.disease}</h4>
                              </div>
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: sc, background: `${sc}18`, padding: '0.18rem 0.48rem', borderRadius: 20, textTransform: 'uppercase', border: `1px solid ${sc}30` }}>{pred.severity} severity</span>
                            </div>
                            <div style={{ fontSize: isPrimary ? '1.7rem' : '1.1rem', fontWeight: 900, color: isPrimary ? '#0ea5e9' : '#94a3b8', letterSpacing: '-0.03em', flexShrink: 0 }}>{pct}%</div>
                          </div>
                          <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden', marginBottom: '0.7rem' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: isPrimary ? 'linear-gradient(90deg,#0ea5e9,#7c3aed)' : '#cbd5e1', borderRadius: 3, transition: 'width 1s ease-out' }} />
                          </div>
                          {pred.description && <p style={{ fontSize: '0.83rem', color: '#64748b', margin: 0, lineHeight: 1.6, marginBottom: pred.specialist ? '0.55rem' : 0 }}>{pred.description}</p>}
                          {pred.specialist && <span style={{ fontSize: '0.74rem', fontWeight: 800, background: '#f1f5f9', color: '#475569', padding: '0.22rem 0.55rem', borderRadius: 6 }}>????? Consult: {pred.specialist}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {result.feature_importance?.length > 0 && (
                  <div style={{ background: 'white', borderRadius: 20, padding: '1.25rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0f172a', margin: '0 0 1rem' }}>?? Key Factors</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                      {result.feature_importance.map((f, i) => (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.28rem' }}>
                            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#334155' }}>{f.symptom}</span>
                            <span style={{ fontSize: '0.84rem', fontWeight: 900, color: '#0f172a' }}>{Math.round(f.importance * 100)}%</span>
                          </div>
                          <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${f.importance * 100}%`, background: 'linear-gradient(90deg,#0ea5e9,#7c3aed)', borderRadius: 3, transition: 'width 0.8s ease-out' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.explainable_reason && (
                  <div style={{ background: 'linear-gradient(135deg,#f0f9ff,#faf5ff)', borderRadius: 20, padding: '1.25rem', border: '1.5px solid #bae6fd' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.7rem' }}>
                      <span style={{ fontSize: 18 }}>??</span>
                      <h3 style={{ fontSize: '0.82rem', fontWeight: 900, color: '#0369a1', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Explanation</h3>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.65, margin: 0 }}>{result.explainable_reason}</p>
                  </div>
                )}

                <div style={{ background: '#fff7ed', borderRadius: 16, padding: '1rem 1.2rem', border: '1.5px solid #fed7aa', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>??</span>
                  <div>
                    <p style={{ fontSize: '0.8rem', fontWeight: 900, color: '#92400e', margin: '0 0 0.2rem' }}>Important reminder</p>
                    <p style={{ fontSize: '0.78rem', color: '#78350f', margin: 0, lineHeight: 1.5 }}>
                      This is AI-generated guidance. Visit your nearest health centre or doctor for proper diagnosis and treatment.
                    </p>
                  </div>
                </div>

                {/* Doctor Suggestion with inline booking */}
                {result.predictions?.length > 0 && (
                  <DiagnosisDoctorSuggestion
                    disease={result.predictions[0].disease}
                    severity={result.predictions[0].severity}
                    symptoms={selectedSymptoms}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
