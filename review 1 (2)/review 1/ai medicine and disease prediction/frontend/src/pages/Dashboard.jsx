import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

/* ── Inline icons (match kit) ─────────────────────────────── */
const Icon = ({ d, size = 20, s = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const IconArrowR = (p) => <Icon {...p} d={<><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></>}/>;
const IconCheck  = (p) => <Icon {...p} d={<path d="M20 6 9 17l-5-5"/>}/>;

/* ── Sub-components (verbatim from kit) ───────────────────── */
function StatCard({ icon, bg, label, value, unit, delta, deltaDir = 'up' }) {
  const c = deltaDir === 'up' ? '#047857' : '#b91c1c';
  return (
    <div className="hp-card hp-card-lift">
      <div style={{
        width: 40, height: 40, borderRadius: 12, background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, marginBottom: 12,
      }}>{icon}</div>
      <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 13, color: '#0f172a' }}>{label}</div>
      <div style={{
        fontFamily: 'Outfit', fontWeight: 900, fontSize: 28, color: '#0f172a',
        lineHeight: 1, letterSpacing: '-.02em', marginTop: 4,
      }}>
        {value}
        {unit && <span style={{ fontSize: 13, color: '#94a3b8', marginLeft: 4 }}>{unit}</span>}
      </div>
      {delta && (
        <div style={{ fontSize: 11, fontWeight: 700, color: c, marginTop: 8 }}>
          {deltaDir === 'up' ? '↑' : '↓'} {delta}
        </div>
      )}
    </div>
  );
}

function QuickAction({ icon, title, subtitle, grad, onClick }) {
  return (
    <div
      className="hp-card hp-card-lift"
      onClick={onClick}
      style={{ cursor: 'pointer', padding: 18 }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 14, background: grad,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, color: '#fff', marginBottom: 12,
      }}>{icon}</div>
      <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{title}</div>
      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>{subtitle}</div>
    </div>
  );
}

function HealthScoreHero({ score = 82, label = 'Excellent' }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg,#0f172a,#1e293b)',
      borderRadius: 24, padding: 24, color: '#fff',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -80, right: -80, width: 260, height: 260, borderRadius: '50%',
        background: 'radial-gradient(circle,rgba(16,185,129,.3),transparent 70%)',
      }}/>
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span className="hp-eyebrow" style={{ color: '#6ee7b7' }}>Health Score</span>
          <span style={{
            fontSize: 11, padding: '5px 12px',
            background: 'rgba(16,185,129,.2)', borderRadius: 9999,
            color: '#6ee7b7', fontWeight: 700,
          }}>● {label}</span>
        </div>
        <div style={{
          fontFamily: 'Outfit', fontWeight: 900, fontSize: 72, lineHeight: 1, letterSpacing: '-.02em',
        }}>
          {score}<span style={{ fontSize: 26, color: '#64748b', fontWeight: 700 }}>/100</span>
        </div>
        <div style={{
          height: 8, background: 'rgba(255,255,255,.12)',
          borderRadius: 9999, marginTop: 16, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${score}%`,
            background: 'linear-gradient(90deg,#10b981,#34d399)', borderRadius: 9999,
          }}/>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 12, color: '#94a3b8', marginTop: 10,
        }}>
          <span>7-day avg</span>
          <span><b style={{ color: '#6ee7b7' }}>↑ 2 pts</b> from last week</span>
        </div>
      </div>
    </div>
  );
}

function AITip() {
  const IconSparkle = () => (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z"/>
    </svg>
  );
  return (
    <div style={{
      padding: 18, borderRadius: 20,
      background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)',
      border: '1px solid #ddd6fe',
      display: 'flex', gap: 14,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}><IconSparkle/></div>
      <div>
        <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 13.5, color: '#4c1d95' }}>
          AI Copilot Tip
        </div>
        <div style={{ fontSize: 13, color: '#5b21b6', marginTop: 3, lineHeight: 1.5 }}>
          Your step count improved by 12% this week. Aim for 10,000 steps daily —
          just <b>1,580 more</b> than your current average!
        </div>
      </div>
    </div>
  );
}

function AppointmentRow({ name, spec, when, confirmed }) {
  const initials = name.split(' ').filter(Boolean).map(x => x[0]).slice(-2).join('');
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 0', borderBottom: '1px dashed #e2e8f0',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Outfit', fontWeight: 800, fontSize: 14,
      }}>{initials}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>{name}</div>
        <div style={{ fontSize: 12, color: '#64748b' }}>{spec} · {when}</div>
      </div>
      <span className="hp-chip" style={{
        background: confirmed ? '#ecfdf5' : '#fffbeb',
        color:      confirmed ? '#047857' : '#b45309',
        borderColor:confirmed ? '#a7f3d0' : '#fde68a',
        pointerEvents: 'none',
      }}>{confirmed ? 'Confirmed' : 'Pending'}</span>
    </div>
  );
}

/* ── Main ──────────────────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [greeting, setGreeting] = useState('Good morning');
  const [nextAppt, setNextAppt] = useState(null);

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting('Good morning');
    else if (h < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  useEffect(() => {
    const fetchNext = async () => {
      try {
        const params = new URLSearchParams();
        if (user?.name) params.append('user_name', user.name);
        if (user?.email) params.append('user_email', user.email);
        params.append('status', 'confirmed');
        const res = await fetch(`${import.meta.env.VITE_API_BASE}/appointments?${params}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) setNextAppt(data[0]);
      } catch { /* best-effort */ }
    };
    if (user) fetchNext();
  }, [user]);

  const firstName = (user?.name || '').split(' ')[0] || 'there';
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <>
      <Header/>
      <div className="hp-fade-up" style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px 48px' }}>
        {/* ── Greeting row ─── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          marginBottom: 28, flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <div className="hp-eyebrow">Namaste, {user?.role === 'doctor' ? 'Doctor' : 'Patient'}</div>
            <h1 className="hp-sh" style={{ fontSize: 36, marginTop: 6 }}>
              {greeting}, {firstName}
            </h1>
            <div style={{ color: '#64748b', fontSize: 14.5, marginTop: 4 }}>
              Your health overview for {today} · 2 points since last week
            </div>
          </div>
          <button className="hp-btn hp-btn-primary hp-btn-lg" onClick={() => navigate('/predict')}>
            <span style={{ fontSize: 16 }}>🔬</span> Start New Assessment <IconArrowR size={16}/>
          </button>
        </div>

        {/* ── 2-column body ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
              <StatCard icon="♥"  bg="#fee2e2" label="Heart Rate"  value="72"    unit="bpm" delta="Normal" />
              <StatCard icon="👣" bg="#dbeafe" label="Steps Today" value="8,420"            delta="12% vs last wk" />
              <StatCard icon="🌙" bg="#ede9fe" label="Sleep"       value="7.2"   unit="hrs" delta="0.4 hrs" deltaDir="down" />
              <StatCard icon="💧" bg="#cffafe" label="Hydration"   value="1.8"   unit="L"   delta="On track" />
            </div>

            <AITip/>

            {/* Quick Actions */}
            <div className="hp-card" style={{ padding: 22 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
              }}>
                <h3 className="hp-sh" style={{ fontSize: 18 }}>Quick Actions</h3>
                <span style={{ fontSize: 12, color: '#64748b' }}>Most used</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                <QuickAction icon="🔬" title="Predict Disease"    subtitle="From symptoms" grad="linear-gradient(135deg,#059669,#047857)" onClick={() => navigate('/predict')}/>
                <QuickAction icon="💬" title="AI Copilot"          subtitle="Ask anything"  grad="linear-gradient(135deg,#7c3aed,#a855f7)" onClick={() => navigate('/chat')}/>
                <QuickAction icon="📄" title="Scan Prescription"   subtitle="OCR enabled"   grad="linear-gradient(135deg,#0ea5e9,#0284c7)" onClick={() => navigate('/ocr')}/>
                <QuickAction icon="🚑" title="Emergency"           subtitle="24/7 SOS"      grad="linear-gradient(135deg,#dc2626,#991b1b)" onClick={() => navigate('/emergency')}/>
              </div>
            </div>

            {/* All Features */}
            <div className="hp-card" style={{ padding: 22 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
              }}>
                <h3 className="hp-sh" style={{ fontSize: 18 }}>All Features</h3>
                <span style={{ fontSize: 12, color: '#64748b' }}>Full HealthPredict suite</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                <QuickAction icon="📊" title="Health Score"       subtitle="BMI + diet plan"    grad="linear-gradient(135deg,#f59e0b,#d97706)" onClick={() => navigate('/health-score')}/>
                <QuickAction icon="📋" title="Report Analyzer"    subtitle="Lab report AI"      grad="linear-gradient(135deg,#0369a1,#0c4a6e)" onClick={() => navigate('/report-analyzer')}/>
                <QuickAction icon="💊" title="Medicine Orders"    subtitle="Home delivery"      grad="linear-gradient(135deg,#ef4444,#dc2626)" onClick={() => navigate('/orders')}/>
                <QuickAction icon="🌸" title="Women's Health"     subtitle="Cycle tracker"      grad="linear-gradient(135deg,#ec4899,#8b5cf6)" onClick={() => navigate('/womens-health')}/>
                <QuickAction icon="🧠" title="Mental Wellness"    subtitle="Mood & coping"      grad="linear-gradient(135deg,#6366f1,#4f46e5)" onClick={() => navigate('/mental-wellness')}/>
                <QuickAction icon="💊" title="Drug Interactions"  subtitle="Check safety"       grad="linear-gradient(135deg,#b45309,#92400e)" onClick={() => navigate('/medicine-interactions')}/>
                <QuickAction icon="📅" title="Health Timeline"    subtitle="Full history"       grad="linear-gradient(135deg,#0891b2,#0e7490)" onClick={() => navigate('/health-timeline')}/>
                <QuickAction icon="🌿" title="Lifestyle Coach"    subtitle="AI wellness tips"   grad="linear-gradient(135deg,#047857,#065f46)" onClick={() => navigate('/lifestyle-coach')}/>
                <QuickAction icon="👨‍👩‍👧‍👦" title="Family Health"     subtitle="Manage family"      grad="linear-gradient(135deg,#059669,#0d9488)" onClick={() => navigate('/family-health')}/>
                <QuickAction icon="👨‍⚕️" title="Book Doctor"        subtitle="Find specialists"   grad="linear-gradient(135deg,#7c3aed,#4f46e5)" onClick={() => navigate('/book-doctor')}/>
                <QuickAction icon="📋" title="Appointments"       subtitle="Your bookings"      grad="linear-gradient(135deg,#4338ca,#3730a3)" onClick={() => navigate('/appointments')}/>
                <QuickAction icon="👤" title="My Profile"         subtitle="Health records"     grad="linear-gradient(135deg,#64748b,#475569)" onClick={() => navigate('/profile')}/>
              </div>
            </div>

            {/* Appointments */}
            <div className="hp-card" style={{ padding: 22 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
              }}>
                <h3 className="hp-sh" style={{ fontSize: 18 }}>Upcoming Appointments</h3>
                <a style={{ fontSize: 13, fontWeight: 600, color: '#059669', cursor: 'pointer' }}
                   onClick={() => navigate('/book-doctor')}>Book a doctor →</a>
              </div>
              {nextAppt ? (
                <AppointmentRow
                  name={nextAppt.doctor_name || 'Dr. Anita Kapoor'}
                  spec={nextAppt.specialty   || 'General Physician'}
                  when={nextAppt.scheduled_for || 'Upcoming'}
                  confirmed
                />
              ) : (
                <>
                  <AppointmentRow name="Dr. Rajesh Verma" spec="Cardiologist"      when="Tomorrow · 10:30 AM" confirmed />
                  <AppointmentRow name="Dr. Anita Kapoor" spec="General Physician" when="Fri, Apr 24 · 4:00 PM" />
                </>
              )}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <HealthScoreHero/>

            {/* Medications */}
            <div className="hp-card" style={{ padding: 20 }}>
              <div className="hp-eyebrow" style={{ marginBottom: 10 }}>Current Medications</div>
              {[
                { n: 'Metformin 500mg',   t: 'Twice daily · with meals', c: '#dcfce7' },
                { n: 'Vitamin D3 60K',    t: 'Weekly · Sunday',          c: '#fef3c7' },
                { n: 'Atorvastatin 10mg', t: 'Once daily · bedtime',     c: '#dbeafe' },
              ].map((m, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 10, padding: '10px 0',
                  borderBottom: i < 2 ? '1px dashed #e2e8f0' : 'none',
                  alignItems: 'center',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, background: m.c,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                  }}>💊</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>{m.n}</div>
                    <div style={{ fontSize: 11.5, color: '#64748b' }}>{m.t}</div>
                  </div>
                  <IconCheck size={16}/>
                </div>
              ))}
            </div>

            {/* Emergency card */}
            <div className="hp-card" style={{
              padding: 20,
              background: 'linear-gradient(135deg,#fef2f2,#fee2e2)',
              border: '1.5px solid #fecaca',
            }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, background: '#dc2626', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>🚑</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 14, color: '#7f1d1d' }}>
                    Medical Emergency?
                  </div>
                  <div style={{ fontSize: 12, color: '#991b1b' }}>
                    Call national emergency services immediately.
                  </div>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
              HealthPredict AI is for clinical decision support only.<br/>
              Does not replace professional medical advice.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
