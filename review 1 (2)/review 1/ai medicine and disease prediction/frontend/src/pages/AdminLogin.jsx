import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const FLASK_AUTH = import.meta.env.VITE_API_BASE;
const ALLOWED_ADMINS = [
  'tomarsiddhanttomar@gmail.com',
  'shivanshthakra0311@gmail.com',
];

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
const IconWarn   = (p) => <Icon {...p} d={<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>}/>;
const IconCheck  = (p) => <Icon {...p} s={2.5} d={<path d="M20 6 9 17l-5-5"/>}/>;
const IconShield = (p) => <Icon {...p} d={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}/>;

const PasswordField = ({ label, value, onChange, show, setShow, placeholder, hint }) => (
  <div className="hp-field">
    <label>{label}</label>
    <div style={{ position: 'relative' }}>
      <span style={{
        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
        color: '#94a3b8', pointerEvents: 'none',
      }}><IconLock size={16}/></span>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
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
    {hint && <div style={{ fontSize: 11, color: '#94a3b8' }}>{hint}</div>}
  </div>
);

export default function AdminLogin() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const { t } = useTranslation();

  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '' });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }
    if (!ALLOWED_ADMINS.includes(form.email.trim().toLowerCase())) {
      setError('Unauthorized admin email. Access denied.'); return;
    }
    setLoading(true);
    ['auth_token','auth_role','auth_user','token','role','user','email'].forEach(k => localStorage.removeItem(k));
    try {
      const res = await axios.post(`${FLASK_AUTH}/api/admin/login`, {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      const { token, role } = res.data;
      if (role !== 'admin' || !token) {
        setError('Access denied. Invalid server response.');
        setLoading(false); return;
      }
      const email = form.email.trim().toLowerCase();
      setSession(token, { id: email, name: 'Admin', email, role: 'admin' });
      navigate('/admin/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg === 'Please create password first') {
        setError('No password set yet. Please create your admin password first.');
        setMode('create-password');
      } else if (msg === 'Unauthorized admin email') setError('Unauthorized admin email. Access denied.');
      else if (msg === 'Invalid password')           setError('Invalid password. Please try again.');
      else if (err.code === 'ERR_NETWORK')           setError('Cannot reach the auth server (port 5002).');
      else                                            setError(msg || 'Login failed. Access denied.');
    }
    setLoading(false);
  };

  const handleCreatePassword = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const email = form.email.trim().toLowerCase();
    if (!email) { setError('Please enter your admin email first.'); return; }
    if (!ALLOWED_ADMINS.includes(email)) { setError('Unauthorized admin email. Access denied.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      await axios.post(`${FLASK_AUTH}/api/admin/set-password`, { email, password: newPassword });
      setSuccess('Password created successfully! You can now log in.');
      setNewPassword(''); setConfirmPassword('');
      setMode('login');
    } catch (err) {
      const msg = err.response?.data?.message;
      if (err.code === 'ERR_NETWORK') setError('Cannot reach the auth server (port 5002).');
      else setError(msg || 'Failed to create password. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px',
      background: 'linear-gradient(180deg,#f8fafc 0%,#f5f3ff 100%)',
    }}>
      <div className="hp-fade-up" style={{ width: '100%', maxWidth: 460 }}>
        <a
          onClick={() => navigate('/select-role')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontWeight: 600, color: '#7c3aed',
            cursor: 'pointer', marginBottom: 20,
          }}
        >
          <IconBack size={14}/> {t('auth_back_to_role')}
        </a>

        <div className="hp-card" style={{ padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', boxShadow: '0 4px 6px -1px rgba(124,58,237,.22)',
            }}><IconShield size={24}/></div>
            <div>
              <div className="hp-eyebrow" style={{ color: '#6d28d9' }}>Admin</div>
              <h1 className="hp-sh" style={{ fontSize: 22 }}>
                {mode === 'login' ? t('admin_login') : 'Create Admin Password'}
              </h1>
            </div>
          </div>

          {/* Restricted banner */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 12, marginBottom: 16,
            background: '#f5f3ff', border: '1px solid #ddd6fe',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#7c3aed' }}/>
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#6d28d9',
              letterSpacing: '.08em', textTransform: 'uppercase',
            }}>Restricted Access Zone — Authorized Personnel Only</span>
          </div>

          {error && (
            <div style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: 14, borderRadius: 14, marginBottom: 14,
              background: 'linear-gradient(135deg,#fef2f2,#fee2e2)',
              border: '1.5px solid #fecaca', color: '#991b1b',
            }}>
              <IconWarn size={18}/>
              <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{error}</span>
            </div>
          )}
          {success && (
            <div style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: 14, borderRadius: 14, marginBottom: 14,
              background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)',
              border: '1.5px solid #a7f3d0', color: '#047857',
            }}>
              <IconCheck size={18}/>
              <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{success}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                    onChange={e => set('email', e.target.value)}
                    placeholder="admin@example.com"
                    style={{ paddingLeft: 40 }}
                    required
                  />
                </div>
              </div>

              <PasswordField
                label={t('common_password')}
                value={form.password}
                onChange={e => set('password', e.target.value)}
                show={showPass}
                setShow={setShowPass}
                placeholder="Enter admin password"
              />

              <button
                type="submit"
                disabled={loading}
                className="hp-btn hp-btn-lg hp-btn-block"
                style={{
                  marginTop: 6,
                  background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                  color: '#fff',
                  boxShadow: '0 4px 6px -1px rgba(124,58,237,.22)',
                }}
              >
                {loading ? 'Verifying Access…' : <>Access Admin Panel <IconArrowR size={14}/></>}
              </button>

              <button
                type="button"
                onClick={() => { setError(''); setSuccess(''); setMode('create-password'); }}
                className="hp-btn hp-btn-ghost hp-btn-block"
                style={{ color: '#7c3aed' }}
              >
                First time? Create Admin Password
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreatePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                    onChange={e => set('email', e.target.value)}
                    placeholder="admin@example.com"
                    style={{ paddingLeft: 40 }}
                    required
                  />
                </div>
              </div>
              <PasswordField
                label="New Password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                show={showNewPass}
                setShow={setShowNewPass}
                placeholder="Min 6 characters"
                hint="Store this somewhere safe — there is no reset flow."
              />
              <div className="hp-field">
                <label>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    color: '#94a3b8', pointerEvents: 'none',
                  }}><IconLock size={16}/></span>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    style={{ paddingLeft: 40 }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="hp-btn hp-btn-lg hp-btn-block"
                style={{
                  marginTop: 6,
                  background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                  color: '#fff',
                  boxShadow: '0 4px 6px -1px rgba(124,58,237,.22)',
                }}
              >
                {loading ? 'Creating…' : <>Create Password <IconArrowR size={14}/></>}
              </button>

              <button
                type="button"
                onClick={() => { setError(''); setSuccess(''); setMode('login'); }}
                className="hp-btn hp-btn-ghost hp-btn-block"
                style={{ color: '#7c3aed' }}
              >
                ? Back to Login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
