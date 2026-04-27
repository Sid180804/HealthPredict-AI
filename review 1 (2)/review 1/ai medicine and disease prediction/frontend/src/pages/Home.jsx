import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/* ─── animated counter hook ─────────────────────────────── */
function useCounter(target, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      observer.disconnect();
      let start = 0;
      const step = target / (duration / 16);
      const tick = () => {
        start = Math.min(start + step, target);
        setCount(Math.floor(start));
        if (start < target) ref.current = requestAnimationFrame(tick);
      };
      ref.current = requestAnimationFrame(tick);
    });
    const el = document.getElementById(`counter-${target}`);
    if (el) observer.observe(el);
    return () => { observer.disconnect(); if (ref.current) cancelAnimationFrame(ref.current); };
  }, [target, duration]);
  return count;
}

const FEATURES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
    title: 'AI Disease Prediction',
    desc: '132-symptom ML ensemble (Random Forest + XGBoost + Logistic Regression) with 99% accuracy across 41+ diseases.',
    path: '/predict',
    gradient: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
    glow: 'rgba(5,150,105,0.25)',
    badge: '41+ Diseases',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    title: 'Multilingual Health AI',
    desc: 'Conversational health assistant in 10 Indian languages — Hindi, Tamil, Bengali, Telugu, and more.',
    path: '/chat',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    glow: 'rgba(124,58,237,0.25)',
    badge: '10 Languages',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    title: 'Prescription OCR',
    desc: 'Advanced Tesseract + Gemini Vision analysis — extracts medicines, dosages, contraindications instantly.',
    path: '/ocr',
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
    glow: 'rgba(14,165,233,0.25)',
    badge: 'Instant Scan',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    title: 'Verified Specialists',
    desc: 'Find admin-verified doctors by specialty, book time slots, and get video consultations.',
    path: '/dashboard',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    glow: 'rgba(245,158,11,0.25)',
    badge: 'Book Instantly',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: 'Health Score & Diet',
    desc: 'Personalized BMI, risk assessment, 7-day AI-generated diet plan based on your health profile.',
    path: '/health-score',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
    glow: 'rgba(239,68,68,0.25)',
    badge: '7-Day Plan',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
    title: 'Medicine Delivery',
    desc: 'Order prescribed medicines with AI-powered contraindication checks. Delivered to your doorstep.',
    path: '/orders',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    glow: 'rgba(16,185,129,0.25)',
    badge: 'Home Delivery',
  },
];

const HOW = [
  { step: '01', title: 'Create Your Profile', desc: 'Register as a patient in 3 steps. Add your health history, allergies, and conditions for personalized AI insights.' },
  { step: '02', title: 'Describe Symptoms', desc: 'Select from 132 categorized symptoms or type in natural language. Our AI maps them to our clinical knowledge base.' },
  { step: '03', title: 'Get AI Diagnosis', desc: 'Receive an instant prediction with confidence scores, disease details, specialist recommendations, and medicines.' },
  { step: '04', title: 'Connect & Treat', desc: 'Book a verified specialist, order medicines, or consult our multilingual AI for ongoing support.' },
];

const TESTIMONIALS = [
  { name: 'Priya Sharma', role: 'Patient, Mumbai', text: 'HealthPredict detected early signs of diabetes I had been ignoring for months. The Hindi language support made everything so easy to understand.', avatar: 'PS', color: '#059669' },
  { name: 'Dr. Rajesh Kumar', role: 'Cardiologist, Delhi', text: 'As a doctor, I use HealthPredict to pre-screen patients. The symptom analysis is impressively accurate and saves hours of triage time.', avatar: 'RK', color: '#7c3aed' },
  { name: 'Anita Patel', role: 'Patient, Ahmedabad', text: 'The prescription OCR scan saved me from a dangerous drug interaction. It flagged my allergy in seconds — this app literally saved my life.', avatar: 'AP', color: '#0ea5e9' },
];

function StatBlock({ value, suffix, label, id }) {
  const count = useCounter(value);
  return (
    <div id={`counter-${value}`} style={{ textAlign: 'center', padding: '1.5rem' }}>
      <div style={{ fontSize: '3rem', fontWeight: 900, color: 'white', fontFamily: "'Outfit',sans-serif", lineHeight: 1 }}>
        {count}{suffix}
      </div>
      <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', fontWeight: 500, marginTop: '0.5rem', letterSpacing: '0.02em' }}>{label}</div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [hoveredStep, setHoveredStep] = useState(null);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#f8fafc', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.4);opacity:0} }
        @keyframes slide-up { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow-pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
        .hero-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(5,150,105,0.35) !important; }
        .feature-card-hp:hover { transform: translateY(-6px); }
        .step-card:hover { transform: translateY(-4px); }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(248,250,252,0.92)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 2rem', height: 68,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#059669,#047857)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>HealthPredict</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={() => navigate('/login')} style={{ padding: '0.55rem 1.25rem', border: '1.5px solid #e2e8f0', borderRadius: 9, background: '#fff', color: '#475569', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>Sign In</button>
          <button onClick={() => navigate('/register')} style={{ padding: '0.55rem 1.25rem', border: 'none', borderRadius: 9, background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}>Get Started Free</button>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #064e3b 50%, #0f172a 100%)',
        padding: '6rem 2rem 5rem',
        position: 'relative', overflow: 'hidden', minHeight: '92vh',
        display: 'flex', alignItems: 'center',
      }}>
        {/* Background orbs */}
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(5,150,105,0.15) 0%, transparent 70%)', top: -200, right: -100, animation: 'glow-pulse 4s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)', bottom: -100, left: -50 }} />
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)', top: '30%', left: '30%' }} />

        {/* Grid pattern overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '4rem', flexWrap: 'wrap' }}>

          {/* Left content */}
          <div style={{ flex: '1 1 520px', animation: 'slide-up 0.8s ease forwards' }}>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
              {['Rural-First Healthcare', 'AI-Powered', 'HIPAA-Aware'].map(tag => (
                <span key={tag} style={{ padding: '0.35rem 0.875rem', background: 'rgba(5,150,105,0.2)', border: '1px solid rgba(5,150,105,0.4)', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700, color: '#34d399', letterSpacing: '0.04em' }}>{tag}</span>
              ))}
            </div>
            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, color: 'white', lineHeight: 1.1, fontFamily: "'Outfit',sans-serif", marginBottom: '1.5rem' }}>
              Your AI{' '}
              <span style={{ background: 'linear-gradient(90deg, #34d399, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Clinical Decision</span>
              {' '}Partner
            </h1>
            <p style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: '2.5rem', maxWidth: 520 }}>
              Professional healthcare intelligence powered by ML ensembles. Detect 41+ diseases, consult in 10 Indian languages, scan prescriptions, and connect with verified specialists — all in one platform.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
              <button
                className="hero-btn"
                onClick={() => navigate('/register')}
                style={{ padding: '1rem 2rem', background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.25s', boxShadow: '0 8px 25px rgba(5,150,105,0.3)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                Start Free Assessment
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
              <button
                onClick={() => navigate('/login')}
                style={{ padding: '1rem 2rem', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 12, fontWeight: 700, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.25s', backdropFilter: 'blur(10px)' }}
              >
                Sign In →
              </button>
            </div>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              {[['✓', '41+ diseases detected'], ['✓', '10 Indian languages'], ['✓', 'No data sold, ever']].map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                  <span style={{ color: '#34d399', fontWeight: 800 }}>{icon}</span>{text}
                </div>
              ))}
            </div>
          </div>

          {/* Right — floating dashboard card */}
          <div style={{ flex: '1 1 380px', display: 'flex', justifyContent: 'center', animation: 'float 6s ease-in-out infinite' }}>
            <div style={{
              background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24,
              padding: '2rem', width: '100%', maxWidth: 420,
              boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
            }}>
              {/* Mini dashboard preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#059669,#047857)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                </div>
                <div>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>Live Health Score</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Updated 2 min ago</div>
                </div>
                <div style={{ marginLeft: 'auto', width: 10, height: 10, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 0 4px rgba(52,211,153,0.2)' }} />
              </div>
              {/* Health ring */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative', width: 140, height: 140 }}>
                  <svg viewBox="0 0 140 140" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
                    <circle cx="70" cy="70" r="56" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12"/>
                    <circle cx="70" cy="70" r="56" fill="none" stroke="url(#heroGrad)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${0.82 * 351.86} ${351.86}`}/>
                    <defs>
                      <linearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#34d399"/>
                        <stop offset="100%" stopColor="#059669"/>
                      </linearGradient>
                    </defs>
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white', fontFamily: "'Outfit',sans-serif", lineHeight: 1 }}>82</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: '0.2rem' }}>HEALTH SCORE</div>
                  </div>
                </div>
              </div>
              {/* Mini metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                  { label: 'Heart Rate', value: '72 bpm', color: '#f87171', icon: '♥' },
                  { label: 'Steps Today', value: '8,420', color: '#34d399', icon: '👣' },
                  { label: 'Sleep', value: '7.2 hrs', color: '#818cf8', icon: '🌙' },
                  { label: 'Hydration', value: '2.1 L', color: '#38bdf8', icon: '💧' },
                ].map(m => (
                  <div key={m.label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '0.875rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>{m.label}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: m.color, fontFamily: "'Outfit',sans-serif" }}>{m.icon} {m.value}</div>
                  </div>
                ))}
              </div>
              {/* Prediction result preview */}
              <div style={{ marginTop: '0.75rem', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 12, padding: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>AI Prediction Complete</div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.1rem' }}>No high-risk conditions detected</div>
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#34d399' }}>99%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(135deg,#059669,#047857,#064e3b)', padding: '3.5rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {[
            { value: 41, suffix: '+', label: 'Diseases Detected' },
            { value: 132, suffix: '', label: 'Symptoms Analyzed' },
            { value: 10, suffix: '', label: 'Indian Languages' },
            { value: 99, suffix: '%', label: 'Prediction Accuracy' },
            { value: 5000, suffix: '+', label: 'Patients Helped' },
          ].map(s => (
            <StatBlock key={s.value} value={s.value} suffix={s.suffix} label={s.label} />
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section style={{ padding: '6rem 2rem', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <span style={{ display: 'inline-block', padding: '0.4rem 1rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 99, fontSize: '0.78rem', fontWeight: 700, color: '#047857', letterSpacing: '0.06em', marginBottom: '1rem' }}>PLATFORM CAPABILITIES</span>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, color: '#0f172a', fontFamily: "'Outfit',sans-serif", lineHeight: 1.15, margin: '0 0 1rem' }}>
              Six AI modules,{' '}
              <span style={{ background: 'linear-gradient(90deg,#059669,#0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>one platform</span>
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#64748b', maxWidth: 550, margin: '0 auto', lineHeight: 1.7 }}>
              World-class healthcare AI built for India — from rural villages to urban hospitals.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="feature-card-hp"
                onClick={() => navigate(f.path)}
                onMouseEnter={() => setHoveredFeature(i)}
                onMouseLeave={() => setHoveredFeature(null)}
                style={{
                  background: '#fff', borderRadius: 20, padding: '2rem',
                  border: '1.5px solid', borderColor: hoveredFeature === i ? 'transparent' : '#f1f5f9',
                  cursor: 'pointer', transition: 'all 0.3s',
                  boxShadow: hoveredFeature === i ? `0 20px 60px ${f.glow}` : '0 2px 8px rgba(0,0,0,0.04)',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                {hoveredFeature === i && (
                  <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${f.glow} 0%, transparent 60%)`, pointerEvents: 'none' }} />
                )}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', position: 'relative' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: f.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, boxShadow: `0 8px 20px ${f.glow}` }}>
                    {f.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0, fontFamily: "'Outfit',sans-serif" }}>{f.title}</h3>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: 99, background: f.glow, color: '#0f172a', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>{f.badge}</span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6, margin: '0 0 1.25rem' }}>{f.desc}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: '#059669' }}>
                      Try it now
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section style={{ padding: '6rem 2rem', background: '#0f172a', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(5,150,105,0.06) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <span style={{ display: 'inline-block', padding: '0.4rem 1rem', background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)', borderRadius: 99, fontSize: '0.78rem', fontWeight: 700, color: '#34d399', letterSpacing: '0.06em', marginBottom: '1rem' }}>HOW IT WORKS</span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: 'white', fontFamily: "'Outfit',sans-serif", margin: '0 0 1rem' }}>
              From symptoms to solution{' '}
              <span style={{ color: '#34d399' }}>in minutes</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '1rem', maxWidth: 480, margin: '0 auto' }}>Our clinical AI pipeline processes your data through multiple verification layers.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {HOW.map((s, i) => (
              <div
                key={i}
                className="step-card"
                onMouseEnter={() => setHoveredStep(i)}
                onMouseLeave={() => setHoveredStep(null)}
                style={{
                  background: hoveredStep === i ? 'rgba(5,150,105,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${hoveredStep === i ? 'rgba(5,150,105,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 20, padding: '2rem',
                  transition: 'all 0.3s', cursor: 'default',
                }}
              >
                <div style={{ fontSize: '3rem', fontWeight: 900, color: 'rgba(5,150,105,0.3)', fontFamily: "'Outfit',sans-serif", lineHeight: 1, marginBottom: '1.25rem' }}>{s.step}</div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'white', marginBottom: '0.75rem', fontFamily: "'Outfit',sans-serif" }}>{s.title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
                {i < HOW.length - 1 && (
                  <div style={{ marginTop: '1.5rem', fontSize: '1.5rem', color: 'rgba(5,150,105,0.4)' }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section style={{ padding: '6rem 2rem', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{ display: 'inline-block', padding: '0.4rem 1rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 99, fontSize: '0.78rem', fontWeight: 700, color: '#047857', letterSpacing: '0.06em', marginBottom: '1rem' }}>TESTIMONIALS</span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 900, color: '#0f172a', fontFamily: "'Outfit',sans-serif", margin: 0 }}>Trusted by patients and doctors</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{
                background: '#fff', borderRadius: 20, padding: '2rem',
                border: '1.5px solid #f1f5f9',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              }}>
                <div style={{ fontSize: '2rem', color: '#059669', marginBottom: '1rem', lineHeight: 1 }}>"</div>
                <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.75, margin: '0 0 1.5rem', fontStyle: 'italic' }}>{t.text}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, ${t.color}, ${t.color}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>{t.name}</div>
                    <div style={{ fontSize: '0.775rem', color: '#94a3b8' }}>{t.role}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', color: '#f59e0b', fontSize: '0.9rem' }}>★★★★★</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EMERGENCY BANNER ─────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(135deg,#7f1d1d,#991b1b)', padding: '3rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fca5a5', animation: 'pulse-ring 1.5s infinite' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Emergency Protocol Active</span>
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', fontFamily: "'Outfit',sans-serif", margin: '0 0 0.35rem' }}>Medical Emergency?</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', margin: 0 }}>Call national emergency services immediately. HealthPredict AI is a support tool, not a substitute for emergency care.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
            {[['🚑 Ambulance', '108'], ['🆘 Emergency', '112'], ['📞 Health Helpline', '104']].map(([label, num]) => (
              <a key={num} href={`tel:${num}`} style={{ padding: '0.875rem 1.5rem', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', backdropFilter: 'blur(10px)' }}>
                {label} ({num})
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section style={{ padding: '6rem 2rem', background: 'linear-gradient(135deg,#f0fdf4,#ecfdf5,#f0fdf4)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, color: '#0f172a', fontFamily: "'Outfit',sans-serif", marginBottom: '1rem' }}>
            Ready to take control of your health?
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#64748b', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            Join thousands of patients and doctors using HealthPredict for smarter, faster, more accurate healthcare.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')} style={{ padding: '1rem 2.5rem', background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 8px 25px rgba(5,150,105,0.3)', transition: 'all 0.25s' }}>
              Create Free Account
            </button>
            <button onClick={() => navigate('/login')} style={{ padding: '1rem 2.5rem', background: '#fff', color: '#059669', border: '2px solid #059669', borderRadius: 12, fontWeight: 700, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.25s' }}>
              Sign In
            </button>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '1.5rem' }}>No credit card required. Free forever for patients.</p>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer style={{ background: '#0f172a', padding: '3rem 2rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#059669,#047857)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>HealthPredict</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.8, maxWidth: 600, margin: 0 }}>
            <strong style={{ color: 'rgba(255,255,255,0.5)' }}>Medical Disclaimer:</strong> HealthPredict AI systems are for clinical decision support and informational purposes only. They do not replace professional medical diagnosis, treatment, or advice. Always consult a qualified healthcare professional for medical decisions.
          </p>
        </div>
      </footer>
    </div>
  );
}
