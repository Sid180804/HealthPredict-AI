import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

/* Kit-style icons */
const Icon = ({ d, size = 16, s = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const IconBack    = (p) => <Icon {...p} d={<><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></>}/>;
const IconArrowR  = (p) => <Icon {...p} d={<><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></>}/>;
const IconMail    = (p) => <Icon {...p} d={<><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></>}/>;
const IconLock    = (p) => <Icon {...p} d={<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>}/>;
const IconEye     = (p) => <Icon {...p} d={<><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/><circle cx="12" cy="12" r="3"/></>}/>;
const IconEyeOff  = (p) => <Icon {...p} d={<><path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411"/></>}/>;
const IconCheck   = (p) => <Icon {...p} s={2.5} d={<path d="M20 6 9 17l-5-5"/>}/>;
const IconWarn    = (p) => <Icon {...p} d={<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>}/>;
const IconGoogle  = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);
const IconApple   = () => (
  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

export default function PatientLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);
  const [roleMismatch, setRoleMismatch] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError(t('auth_fill_all_fields'));
      return;
    }
    setLoading(true); setError(''); setRoleMismatch(null);
    const result = await login(form.email, form.password, 'patient');
    if (result.success) {
      navigate('/dashboard');
    } else {
      if (result.actualRole && result.correctPortal) {
        setRoleMismatch({ actualRole: result.actualRole, correctPortal: result.correctPortal });
      }
      setError(result.error || t('auth_invalid_credentials'));
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px',
      background: 'linear-gradient(180deg,#f8fafc 0%,#ecfdf5 100%)',
    }}>
      <div className="hp-fade-up" style={{ width: '100%', maxWidth: 440 }}>
        {/* Back link */}
        <a
          onClick={() => navigate('/select-role')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontWeight: 600, color: '#059669',
            cursor: 'pointer', marginBottom: 20,
          }}
        >
          <IconBack size={14}/> {t('auth_back_to_role')}
        </a>

        <div className="hp-card" style={{ padding: 32 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: 'linear-gradient(135deg,#059669,#047857)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, boxShadow: '0 4px 6px -1px rgba(16,185,129,.18)',
            }}>🩺</div>
            <div>
              <div className="hp-eyebrow">Patient</div>
              <h1 className="hp-sh" style={{ fontSize: 22 }}>{t('patient_login')}</h1>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: 14, borderRadius: 14, marginBottom: 16,
              background: 'linear-gradient(135deg,#fef2f2,#fee2e2)',
              border: '1.5px solid #fecaca',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: '#991b1b' }}>
                <IconWarn size={18}/>
                <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{error}</span>
              </div>
              {roleMismatch && (
                <button
                  type="button"
                  onClick={() => navigate(roleMismatch.correctPortal)}
                  className="hp-btn hp-btn-primary hp-btn-sm hp-btn-block"
                >
                  {t('auth_go_to_portal', {
                    role: roleMismatch.actualRole.charAt(0).toUpperCase() + roleMismatch.actualRole.slice(1),
                  })}
                  <IconArrowR size={14}/>
                </button>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="hp-field">
              <label>{t('common_email')}</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: '#94a3b8', pointerEvents: 'none',
                }}><IconMail size={16}/></span>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder={t('auth_email_placeholder')}
                  required
                  style={{ paddingLeft: 40 }}
                />
                {form.email.includes('@') && form.email.includes('.') && (
                  <span style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    color: '#059669',
                  }}><IconCheck size={14}/></span>
                )}
              </div>
            </div>

            <div className="hp-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ marginBottom: 0 }}>{t('common_password')}</label>
                <a style={{ fontSize: 11, fontWeight: 600, color: '#059669', cursor: 'pointer' }}>
                  {t('auth_forgot_password')}
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: '#94a3b8', pointerEvents: 'none',
                }}><IconLock size={16}/></span>
                <input
                  type={show ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder={t('auth_password_placeholder')}
                  required
                  style={{ paddingLeft: 40, paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShow(v => !v)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: '#94a3b8', padding: 6, borderRadius: 8,
                  }}
                >{show ? <IconEyeOff size={16}/> : <IconEye size={16}/>}</button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="hp-btn hp-btn-primary hp-btn-lg hp-btn-block"
              style={{ marginTop: 6 }}
            >
              {loading ? t('auth_signing_in') : <>{t('auth_sign_in_securely')} <IconArrowR size={14}/></>}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            margin: '22px 0 16px',
          }}>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }}/>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '.08em' }}>
              {t('common_or')}
            </span>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }}/>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button type="button" className="hp-btn hp-btn-secondary hp-btn-block">
              <IconGoogle/> {t('common_continue_google')}
            </button>
            <button type="button" className="hp-btn hp-btn-secondary hp-btn-block">
              <IconApple/> {t('common_continue_apple')}
            </button>
          </div>

          {/* Footer links */}
          <div style={{ marginTop: 22, textAlign: 'center', fontSize: 13, color: '#64748b' }}>
            {t('auth_no_account')}{' '}
            <Link to="/signup/patient" style={{ color: '#059669', fontWeight: 700 }}>
              {t('auth_create_one_free')}
            </Link>
          </div>
          <div style={{ marginTop: 6, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
            {t('auth_not_patient')}{' '}
            <a onClick={() => navigate('/select-role')} style={{ cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
              {t('auth_switch_role')}
            </a>
          </div>
        </div>

        {/* Trust strip */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 18,
          marginTop: 18, fontSize: 11, color: '#94a3b8', fontWeight: 600,
        }}>
          <span>🔒 {t('trust_encrypted')}</span>
          <span>•</span>
          <span>🛡️ {t('trust_hipaa')}</span>
          <span>•</span>
          <span>👁️ {t('trust_privacy')}</span>
        </div>
      </div>
    </div>
  );
}
