import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const Icon = ({ d, size = 16, s = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const IconBack   = (p) => <Icon {...p} d={<><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></>}/>;
const IconArrowR = (p) => <Icon {...p} d={<><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></>}/>;
const IconMail   = (p) => <Icon {...p} d={<><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></>}/>;
const IconLock   = (p) => <Icon {...p} d={<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>}/>;
const IconEye    = (p) => <Icon {...p} d={<><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/><circle cx="12" cy="12" r="3"/></>}/>;
const IconEyeOff = (p) => <Icon {...p} d={<><path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411"/></>}/>;
const IconCheck  = (p) => <Icon {...p} s={2.5} d={<path d="M20 6 9 17l-5-5"/>}/>;
const IconWarn   = (p) => <Icon {...p} d={<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>}/>;

export default function DoctorLogin() {
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
    if (!form.email || !form.password) { setError(t('auth_fill_all_fields')); return; }
    setLoading(true); setError(''); setRoleMismatch(null);
    const result = await login(form.email, form.password, 'doctor');
    if (result.success) {
      navigate('/doctor/dashboard');
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
      background: 'linear-gradient(180deg,#f8fafc 0%,#e0f2fe 100%)',
    }}>
      <div className="hp-fade-up" style={{ width: '100%', maxWidth: 440 }}>
        <a
          onClick={() => navigate('/select-role')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontWeight: 600, color: '#0284c7',
            cursor: 'pointer', marginBottom: 20,
          }}
        >
          <IconBack size={14}/> {t('auth_back_to_role')}
        </a>

        <div className="hp-card" style={{ padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: 'linear-gradient(135deg,#0ea5e9,#0284c7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, boxShadow: '0 4px 6px -1px rgba(14,165,233,.22)',
            }}>👨‍⚕️</div>
            <div>
              <div className="hp-eyebrow" style={{ color: '#0369a1' }}>Doctor</div>
              <h1 className="hp-sh" style={{ fontSize: 22 }}>{t('doctor_login')}</h1>
            </div>
          </div>

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
                    color: '#0284c7',
                  }}><IconCheck size={14}/></span>
                )}
              </div>
            </div>

            <div className="hp-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ marginBottom: 0 }}>{t('common_password')}</label>
                <a style={{ fontSize: 11, fontWeight: 600, color: '#0284c7', cursor: 'pointer' }}>
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
              className="hp-btn hp-btn-lg hp-btn-block"
              style={{
                marginTop: 6,
                background: 'linear-gradient(135deg,#0ea5e9,#0284c7)',
                color: '#fff',
                boxShadow: '0 4px 6px -1px rgba(14,165,233,.22)',
              }}
            >
              {loading ? t('auth_signing_in') : <>{t('auth_sign_in_securely')} <IconArrowR size={14}/></>}
            </button>
          </form>

          <div style={{ marginTop: 22, textAlign: 'center', fontSize: 13, color: '#64748b' }}>
            {t('auth_no_account')}{' '}
            <Link to="/signup/doctor" style={{ color: '#0284c7', fontWeight: 700 }}>
              {t('auth_create_one_free')}
            </Link>
          </div>
          <div style={{ marginTop: 6, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
            {t('auth_not_doctor')}{' '}
            <a onClick={() => navigate('/select-role')} style={{ cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
              {t('auth_switch_role')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
