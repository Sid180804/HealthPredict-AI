import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';

/* Inline Lucide-style arrow — matches kit exactly */
const IconArrowR = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
  </svg>
);

export default function RoleSelector() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const roles = [
    {
      k: 'patient',
      icon: '🩺',
      titleKey: 'role_patient_title',
      copyKey: 'role_patient_copy',
      path: '/login/patient',
      grad: 'linear-gradient(135deg,#059669,#047857)',
    },
    {
      k: 'doctor',
      icon: '👨‍⚕️',
      titleKey: 'role_doctor_title',
      copyKey: 'role_doctor_copy',
      path: '/login/doctor',
      grad: 'linear-gradient(135deg,#0ea5e9,#0284c7)',
    },
    {
      k: 'admin',
      icon: '🛡️',
      titleKey: 'role_admin_title',
      copyKey: 'role_admin_copy',
      path: '/login/admin',
      grad: 'linear-gradient(135deg,#7c3aed,#a855f7)',
    },
  ];

  return (
    <div
      className="hp-fade-up"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        background: 'linear-gradient(135deg,#0f172a 0%,#064e3b 50%,#0f172a 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Language selector — absolute top-right */}
      <LanguageSelector className="absolute top-4 right-4 z-30" />

      {/* Glow orbs */}
      <div style={{
        position: 'absolute', top: -120, left: '10%', width: 480, height: 480,
        borderRadius: '50%',
        background: 'radial-gradient(circle,rgba(16,185,129,.3),transparent 70%)',
      }}/>
      <div style={{
        position: 'absolute', bottom: -120, right: '10%', width: 480, height: 480,
        borderRadius: '50%',
        background: 'radial-gradient(circle,rgba(124,58,237,.22),transparent 70%)',
      }}/>

      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage:
          'linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),' +
          'linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)',
        backgroundSize: '40px 40px',
      }}/>

      {/* Content */}
      <div style={{ position: 'relative', maxWidth: 960, width: '100%', textAlign: 'center', color: '#fff' }}>
        {/* Eyebrow pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', borderRadius: 9999,
          background: 'rgba(16,185,129,.15)', border: '1px solid rgba(16,185,129,.3)',
          fontSize: 11, fontWeight: 700, color: '#6ee7b7',
          letterSpacing: '.1em', textTransform: 'uppercase',
          marginBottom: 20,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}/>
          {t('landing_eyebrow')}
        </div>

        {/* Hero headline with gradient span */}
        <h1 style={{
          fontFamily: 'Outfit', fontWeight: 900,
          fontSize: 'clamp(2.4rem,5vw,3.8rem)',
          lineHeight: 1.05, letterSpacing: '-.02em', margin: 0,
        }}>
          {t('landing_hero_pre')}{' '}
          <span style={{
            background: 'linear-gradient(135deg,#34d399,#10b981)',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}>
            {t('landing_hero_accent')}
          </span>{' '}
          {t('landing_hero_post')}
        </h1>

        <p style={{
          color: '#cbd5e1', fontSize: 17, marginTop: 14,
          maxWidth: 640, marginInline: 'auto',
        }}>
          {t('landing_hero_subtitle')}
        </p>

        {/* Role cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
          gap: 16, marginTop: 40,
        }}>
          {roles.map(r => (
            <div
              key={r.k}
              onClick={() => navigate(r.path)}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(16,185,129,.6)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)';
              }}
              style={{
                cursor: 'pointer', padding: 28, borderRadius: 24,
                background: 'rgba(255,255,255,.07)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,.12)',
                textAlign: 'left', transition: 'all .25s',
              }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: 16, background: r.grad,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, marginBottom: 16,
              }}>{r.icon}</div>
              <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 18, marginBottom: 4 }}>
                {t(r.titleKey)}
              </div>
              <div style={{ fontSize: 13.5, color: '#94a3b8', lineHeight: 1.5 }}>
                {t(r.copyKey)}
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                marginTop: 16, fontSize: 12.5, fontWeight: 700, color: '#6ee7b7',
              }}>
                {t('common_continue')} <IconArrowR size={14}/>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 28, fontSize: 11.5, color: '#64748b' }}>
          {t('landing_disclaimer')}
        </div>
      </div>
    </div>
  );
}
