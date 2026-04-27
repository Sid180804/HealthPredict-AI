import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ── Icons ─────────────────────────────────────────────────────────────────── */
const UserIcon    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const MailIcon    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const LockIcon    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const MedIcon     = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
const BriefIcon   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const BldgIcon    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
const ArrowIcon   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>;
const ChevronIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;
const GoogleIcon  = () => <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>;
const AppleIcon   = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>;

function EyeToggle({ open, onClick }) {
  return (
    <button type="button" onClick={onClick} aria-label={open ? 'Hide' : 'Show'}
      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-150">
      {open
        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
        : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
      }
    </button>
  );
}

const SPECIALIZATIONS = [
  'General Physician','Cardiologist','Dermatologist','Endocrinologist',
  'Gastroenterologist','Neurologist','Oncologist','Orthopedic Surgeon',
  'Pediatrician','Psychiatrist','Pulmonologist','Ophthalmologist',
  'ENT Specialist','Gynecologist','Urologist','Allergist','Surgeon',
];

const TRUST_ITEMS = [
  { label: 'HIPAA Inspired', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>, color: 'text-emerald-500' },
  { label: 'End-to-End Encrypted', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>, color: 'text-teal-500' },
  { label: 'Privacy Protected', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>, color: 'text-green-500' },
];

/* ── Step dot ──────────────────────────────────────────────────────────────── */
function StepDot({ n, active, done }) {
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
      done || active
        ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md shadow-emerald-200'
        : 'bg-gray-100 text-gray-400'
    }`}>
      {done
        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        : n}
    </div>
  );
}

export default function DoctorSignup() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [step, setStep]       = useState(1);
  const [form, setForm]       = useState({
    name: '', email: '', password: '', confirm: '',
    specialization: '', experience: '', hospital: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [showCf, setShowCf]   = useState(false);
  const [shake, setShake]     = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 500); };

  const validateStep1 = () => {
    if (!form.name)                                    return 'Full name is required.';
    if (!form.email)                                   return 'Email is required.';
    if (!form.password || form.password.length < 6)   return 'Password must be at least 6 characters.';
    if (form.password !== form.confirm)                return 'Passwords do not match.';
    return null;
  };

  const handleNext = () => {
    const err = validateStep1();
    if (err) { setError(err); triggerShake(); return; }
    setError(''); setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.specialization) { setError('Please select your specialization.'); triggerShake(); return; }
    setLoading(true); setError('');
    const result = await register({
      name: form.name, email: form.email, password: form.password, role: 'doctor',
      specialization: form.specialization,
      experience: form.experience ? +form.experience : undefined,
      hospital_name: form.hospital,
    });
    if (result.success) navigate('/doctor/dashboard');
    else { setError(result.error || 'Registration failed. Please try again.'); triggerShake(); }
    setLoading(false);
  };

  const nameValid  = form.name.trim().length >= 2;
  const emailValid = form.email.includes('@') && form.email.includes('.');
  const pwValid    = form.password.length >= 6;

  /* Input class builders */
  const inputCls = (valid, hasVal, extraPr = false) =>
    `w-full h-14 pl-11 ${extraPr ? 'pr-12' : 'pr-4'} rounded-xl text-gray-900 text-sm font-medium placeholder-gray-400 outline-none border transition-all duration-200 ${
      hasVal && valid
        ? 'bg-emerald-50/40 border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
        : 'bg-gray-50 border-gray-200 focus:bg-emerald-50/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'
    }`;

  const selectCls = `w-full h-14 pl-11 pr-10 rounded-xl text-gray-900 text-sm font-medium outline-none border transition-all duration-200 appearance-none ${
    form.specialization
      ? 'bg-emerald-50/40 border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
      : 'bg-gray-50 border-gray-200 focus:bg-emerald-50/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'
  }`;

  const CheckMark = ({ show }) => show ? (
    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
    </span>
  ) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">

      {/* Background depth layers */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-emerald-200 rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-teal-200 rounded-full opacity-20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-100 rounded-full opacity-30 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(circle, #059669 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      </div>

      <div className="relative w-full max-w-md animate-[fadeUp_0.45s_cubic-bezier(0.16,1,0.3,1)_both]">

        {/* Back button */}
        <button onClick={() => step === 1 ? navigate('/select-role') : setStep(1)}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 mb-5 text-sm font-semibold transition-all group">
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {step === 1 ? 'Back to Role Selection' : 'Back to Step 1'}
        </button>

        {/* Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-emerald-900/8 border border-white p-9 hover:shadow-[0_32px_64px_rgba(16,185,129,0.12)] transition-shadow duration-500">

          {/* Header */}
          <div className="flex items-start gap-4 mb-5">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 opacity-20 blur-md scale-110" />
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-300/50">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900" style={{ fontFamily: "'Outfit',sans-serif" }}>
                  Create Doctor Account
                </h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  Secure
                </span>
              </div>
              <p className="text-gray-500 text-sm mt-1 leading-snug">Join platform to manage patients &amp; provide care</p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6 p-3 bg-gray-50 rounded-2xl border border-gray-100">
            <StepDot n={1} active={step === 1} done={step > 1} />
            <div className="flex flex-col">
              <span className={`text-xs font-bold leading-none ${step >= 1 ? 'text-emerald-700' : 'text-gray-400'}`}>Step 1</span>
              <span className={`text-[10px] font-medium ${step >= 1 ? 'text-emerald-600/70' : 'text-gray-400'}`}>Account Details</span>
            </div>
            <div className={`flex-1 h-0.5 mx-1 rounded-full transition-all duration-500 ${step > 1 ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 'bg-gray-200'}`} />
            <div className="flex flex-col items-end">
              <span className={`text-xs font-bold leading-none ${step >= 2 ? 'text-emerald-700' : 'text-gray-400'}`}>Step 2</span>
              <span className={`text-[10px] font-medium ${step >= 2 ? 'text-emerald-600/70' : 'text-gray-400'}`}>Practice Info</span>
            </div>
            <StepDot n={2} active={step === 2} done={false} />
          </div>

          {/* Error */}
          {error && (
            <div className={`mb-5 flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl ${shake ? 'animate-[shake_0.45s_ease]' : ''}`}>
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              </div>
              <p className="text-red-700 text-sm font-medium leading-snug">{error}</p>
            </div>
          )}

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div className="space-y-4">

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><UserIcon /></span>
                  <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder="Dr. Rajesh Kumar" className={inputCls(nameValid, !!form.name)} />
                  <CheckMark show={!!form.name && nameValid} />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><MailIcon /></span>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="doctor@hospital.com" className={inputCls(emailValid, !!form.email)} />
                  <CheckMark show={!!form.email && emailValid} />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><LockIcon /></span>
                  <input type={showPw ? 'text' : 'password'} value={form.password}
                    onChange={e => set('password', e.target.value)} placeholder="Min. 6 characters"
                    className={inputCls(pwValid, !!form.password, true)} />
                  <EyeToggle open={showPw} onClick={() => setShowPw(p => !p)} />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Confirm Password</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><LockIcon /></span>
                  <input type={showCf ? 'text' : 'password'} value={form.confirm}
                    onChange={e => set('confirm', e.target.value)} placeholder="Re-enter password"
                    className={`w-full h-14 pl-11 pr-12 rounded-xl text-gray-900 text-sm font-medium placeholder-gray-400 outline-none border transition-all duration-200 ${
                      form.confirm
                        ? form.confirm === form.password
                          ? 'bg-emerald-50/40 border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                          : 'bg-red-50/40 border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                        : 'bg-gray-50 border-gray-200 focus:bg-emerald-50/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'
                    }`} />
                  <EyeToggle open={showCf} onClick={() => setShowCf(p => !p)} />
                </div>
                {form.confirm && form.confirm !== form.password && (
                  <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    Passwords don't match
                  </p>
                )}
              </div>

              {/* Next button */}
              <button onClick={handleNext}
                className="w-full h-[52px] mt-2 rounded-xl text-white text-sm font-semibold tracking-wide bg-gradient-to-r from-green-500 via-emerald-500 to-emerald-600 hover:from-green-600 hover:via-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.015] active:scale-[0.985] transition-all duration-200 flex items-center justify-center gap-2.5">
                Continue to Practice Details <ArrowIcon />
              </button>

              {/* Divider + social (step 1 only) */}
              <div className="pt-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                  <span className="text-xs text-gray-400 font-semibold px-1">OR</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                </div>
                <p className="text-center text-xs text-gray-400 font-medium mb-3">Quick sign in</p>
                <div className="flex flex-col gap-2.5">
                  {[
                    { label: 'Continue with Google', icon: <GoogleIcon /> },
                    { label: 'Continue with Apple',  icon: <AppleIcon /> },
                  ].map(({ label, icon }) => (
                    <button key={label} type="button"
                      className="w-full h-[52px] flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-md text-gray-700 text-sm font-semibold transition-all duration-200 active:scale-[0.99]">
                      {icon}{label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Specialization */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Specialization <span className="text-red-400">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><MedIcon /></span>
                  <select value={form.specialization} onChange={e => set('specialization', e.target.value)}
                    className={selectCls} required>
                    <option value="">Select your specialization…</option>
                    {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><ChevronIcon /></span>
                </div>
              </div>

              {/* Experience */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Years of Experience</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><BriefIcon /></span>
                  <input type="number" min="0" max="60" value={form.experience}
                    onChange={e => set('experience', e.target.value)} placeholder="e.g. 8"
                    className={inputCls(+form.experience >= 0, !!form.experience)} />
                  {form.experience && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </span>
                  )}
                </div>
              </div>

              {/* Hospital */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Hospital / Clinic Name</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><BldgIcon /></span>
                  <input type="text" value={form.hospital} onChange={e => set('hospital', e.target.value)}
                    placeholder="e.g. Apollo Hospital"
                    className={inputCls(form.hospital.trim().length >= 2, !!form.hospital)} />
                  <CheckMark show={form.hospital.trim().length >= 2} />
                </div>
              </div>

              {/* Admin review notice — enhanced */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-amber-800 text-xs font-bold mb-0.5">Admin Review Required</p>
                  <p className="text-amber-700 text-xs font-medium leading-relaxed">
                    Your account will be reviewed before you can accept patients. This usually takes 24–48 hours.
                  </p>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full h-[52px] mt-1 rounded-xl text-white text-sm font-semibold tracking-wide bg-gradient-to-r from-green-500 via-emerald-500 to-emerald-600 hover:from-green-600 hover:via-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.015] active:scale-[0.985] transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none">
                {loading
                  ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Creating Account…</>
                  : <>Join as Doctor <ArrowIcon /></>
                }
              </button>
            </form>
          )}

          {/* Footer links */}
          <div className="mt-6 text-center space-y-1.5">
            <p className="text-gray-500 text-sm">
              Already registered?{' '}
              <Link to="/login/doctor" className="text-emerald-600 font-bold hover:underline underline-offset-2">Sign in</Link>
            </p>
            <p className="text-gray-400 text-xs">
              Not a doctor?{' '}
              <button onClick={() => navigate('/select-role')} className="text-gray-500 font-semibold hover:text-gray-800 hover:underline transition-colors">Switch role</button>
            </p>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex justify-center flex-wrap gap-4 mt-5">
          {TRUST_ITEMS.map(({ label, icon, color }) => (
            <span key={label} className={`flex items-center gap-1.5 text-xs font-medium ${color}`}>
              {icon}<span className="text-gray-400">{label}</span>
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shake  { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
      `}</style>
    </div>
  );
}
