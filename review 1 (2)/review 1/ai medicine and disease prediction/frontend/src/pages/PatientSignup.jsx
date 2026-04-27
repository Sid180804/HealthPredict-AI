import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ── Icons ─────────────────────────────────────────────────────────────────── */
const UserIcon   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const MailIcon   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const LockIcon   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const ArrowIcon  = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>;
const GoogleIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>;
const AppleIcon  = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>;

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

function calcStrength(p) {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 6)         s++;
  if (p.length >= 10)        s++;
  if (/[A-Z]/.test(p))      s++;
  if (/[0-9]/.test(p))      s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}
const STR_LABEL = ['', 'Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
const STR_BAR   = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-400', 'bg-emerald-500'];
const STR_TEXT  = ['', 'text-red-500', 'text-orange-500', 'text-yellow-600', 'text-blue-500', 'text-emerald-600'];

const TRUST_ITEMS = [
  { label: 'HIPAA Inspired', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>, color: 'text-blue-500' },
  { label: 'End-to-End Encrypted', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>, color: 'text-indigo-500' },
  { label: 'Privacy Protected', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>, color: 'text-sky-500' },
];

const MEDICAL_CONDITIONS = [
  { key: 'diabetes',      label: 'Diabetes' },
  { key: 'hypertension',  label: 'Hypertension' },
  { key: 'asthma',        label: 'Asthma' },
  { key: 'thyroid',       label: 'Thyroid' },
  { key: 'heart_disease', label: 'Heart Disease' },
];

const GENDER_OPTIONS  = ['Male', 'Female', 'Other', 'Prefer not to say'];
const BLOOD_GROUPS    = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const ACTIVITY_LEVELS = ['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active'];

export default function PatientSignup() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [step, setStep] = useState(1); // 1=Account, 2=Health+Lifestyle+Medical+Location
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '',
    // Personal Health
    age: '', gender: '', height: '', weight: '', blood_group: '',
    // Lifestyle
    is_smoker: false, is_alcohol: false, physical_activity: 'Moderate', sleep_hours: '',
    // Medical Background
    existing_conditions: [],
    // Location
    country: 'India', state: '', city: '', pincode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [showCf, setShowCf]   = useState(false);
  const [shake, setShake]     = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const strength = calcStrength(form.password);
  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 500); };

  const toggleCondition = (key) => {
    setForm(p => {
      if (key === 'none') return { ...p, existing_conditions: [] };
      const cur = p.existing_conditions;
      return { ...p, existing_conditions: cur.includes(key) ? cur.filter(c => c !== key) : [...cur, key] };
    });
  };

  const validateStep1 = () => {
    if (!form.name || !form.email || !form.password || !form.confirm) { setError('Please fill in all required fields.'); triggerShake(); return false; }
    if (form.password.length < 6)       { setError('Password must be at least 6 characters.'); triggerShake(); return false; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); triggerShake(); return false; }
    setError('');
    return true;
  };

  const goToStep2 = () => { if (validateStep1()) setStep(2); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate step 2 required fields
    if (!form.age || form.age < 1 || form.age > 120)  { setError('Please enter a valid age (1-120).'); triggerShake(); return; }
    if (!form.gender)                                   { setError('Please select your gender.'); triggerShake(); return; }
    if (!form.city.trim())                              { setError('Please enter your city.'); triggerShake(); return; }

    setLoading(true); setError('');
    const result = await register({
      name: form.name, email: form.email, password: form.password, role: 'patient',
      age: Number(form.age),
      gender: form.gender,
      height: form.height ? Number(form.height) : undefined,
      weight: form.weight ? Number(form.weight) : undefined,
      blood_group: form.blood_group || undefined,
      is_smoker: form.is_smoker,
      is_alcohol: form.is_alcohol,
      physical_activity: form.physical_activity,
      sleep_hours: form.sleep_hours ? Number(form.sleep_hours) : undefined,
      existing_conditions: form.existing_conditions,
      country: form.country || undefined,
      state: form.state || undefined,
      city: form.city.trim(),
      pincode: form.pincode || undefined,
    });
    if (result.success) navigate('/dashboard');
    else { setError(result.error || 'Registration failed. Please try again.'); triggerShake(); }
    setLoading(false);
  };

  const emailValid = form.email.includes('@') && form.email.includes('.');
  const pwValid    = form.password.length >= 6;
  const nameValid  = form.name.trim().length >= 2;

  const inputCls = (valid, hasVal, extraPr = false) =>
    `w-full h-14 pl-11 ${extraPr ? 'pr-12' : 'pr-4'} rounded-xl text-gray-900 text-sm font-medium placeholder-gray-400 outline-none border transition-all duration-200 ${
      hasVal && valid
        ? 'bg-blue-50/40 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
        : 'bg-gray-50 border-gray-200 focus:bg-blue-50/30 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
    }`;

  const CheckMark = ({ show }) => show ? (
    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
    </span>
  ) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-200 rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-indigo-200 rounded-full opacity-20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-sky-100 rounded-full opacity-30 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      </div>

      <div className={`relative w-full ${step === 1 ? 'max-w-md' : 'max-w-2xl'} animate-[fadeUp_0.45s_cubic-bezier(0.16,1,0.3,1)_both] transition-all duration-500`}>

        <button onClick={() => step === 2 ? setStep(1) : navigate('/select-role')}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 mb-5 text-sm font-semibold transition-all group">
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {step === 2 ? 'Back to Account Info' : 'Back to Role Selection'}
        </button>

        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-900/8 border border-white p-9 hover:shadow-[0_32px_64px_rgba(59,130,246,0.12)] transition-shadow duration-500">

          {/* Header */}
          <div className="flex items-start gap-4 mb-7">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 opacity-20 blur-md scale-110" />
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-300/50">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900" style={{ fontFamily: "'Outfit',sans-serif" }}>
                  Create Patient Account
                </h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  Secure
                </span>
              </div>
              <p className="text-gray-500 text-sm mt-1 leading-snug">
                {step === 1 ? 'Start your AI-powered health journey' : 'Tell us about your health profile'}
              </p>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-3 mb-6">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  step >= s ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-300/40' : 'bg-gray-100 text-gray-400'
                }`}>{s}</div>
                <span className={`text-xs font-semibold hidden sm:block ${step >= s ? 'text-gray-700' : 'text-gray-400'}`}>
                  {s === 1 ? 'Account Info' : 'Health Profile'}
                </span>
                {s === 1 && <div className={`flex-1 h-0.5 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-blue-400' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {error && (
            <div className={`mb-5 flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl ${shake ? 'animate-[shake_0.45s_ease]' : ''}`}>
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              </div>
              <p className="text-red-700 text-sm font-medium leading-snug">{error}</p>
            </div>
          )}

          {/* ── STEP 1: Account Info ────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4 animate-[fadeUp_0.3s_ease_both]">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><UserIcon /></span>
                  <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder="e.g. Priya Sharma" className={inputCls(nameValid, !!form.name)} />
                  <CheckMark show={!!form.name && nameValid} />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><MailIcon /></span>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="you@example.com" className={inputCls(emailValid, !!form.email)} />
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
                {form.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i <= strength ? STR_BAR[strength] : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <p className={`text-xs font-semibold ${STR_TEXT[strength]}`}>{STR_LABEL[strength]}</p>
                  </div>
                )}
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
                          ? 'bg-blue-50/40 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                          : 'bg-red-50/40 border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                        : 'bg-gray-50 border-gray-200 focus:bg-blue-50/30 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
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

              {/* Next Step Button */}
              <button type="button" onClick={goToStep2}
                className="w-full h-[52px] mt-2 rounded-xl text-white text-sm font-semibold tracking-wide bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.015] active:scale-[0.985] transition-all duration-200 flex items-center justify-center gap-2.5">
                Continue to Health Profile <ArrowIcon />
              </button>

              {/* Divider */}
              <div className="my-5">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                  <span className="text-xs text-gray-400 font-semibold px-1">OR</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                </div>
                <p className="text-center text-xs text-gray-400 font-medium mt-3">Quick sign in</p>
              </div>

              {/* Social */}
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

              <div className="mt-6 text-center space-y-1.5">
                <p className="text-gray-500 text-sm">
                  Already have an account?{' '}
                  <Link to="/login/patient" className="text-blue-600 font-bold hover:underline underline-offset-2">Sign in</Link>
                </p>
                <p className="text-gray-400 text-xs">
                  Not a patient?{' '}
                  <button onClick={() => navigate('/select-role')} className="text-gray-500 font-semibold hover:text-gray-800 hover:underline transition-colors">Switch role</button>
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 2: Health Profile ──────────────────────────────────────── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="animate-[fadeUp_0.3s_ease_both]">

              {/* Section: Personal Health */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  </div>
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Personal Health</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Age <span className="text-red-400">*</span></label>
                    <input type="number" min="1" max="120" value={form.age} onChange={e => set('age', e.target.value)}
                      placeholder="e.g. 28" className={inputCls(form.age >= 1 && form.age <= 120, !!form.age)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Gender <span className="text-red-400">*</span></label>
                    <select value={form.gender} onChange={e => set('gender', e.target.value)}
                      className={`w-full h-14 pl-4 pr-4 rounded-xl text-sm font-medium outline-none border transition-all duration-200 cursor-pointer ${
                        form.gender ? 'bg-blue-50/40 border-blue-300 text-gray-900' : 'bg-gray-50 border-gray-200 text-gray-400'
                      } focus:border-blue-400 focus:ring-2 focus:ring-blue-100`}>
                      <option value="">Select gender</option>
                      {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Height (cm)</label>
                    <input type="number" min="50" max="300" value={form.height} onChange={e => set('height', e.target.value)}
                      placeholder="e.g. 170" className={inputCls(true, !!form.height)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Weight (kg)</label>
                    <input type="number" min="10" max="500" value={form.weight} onChange={e => set('weight', e.target.value)}
                      placeholder="e.g. 65" className={inputCls(true, !!form.weight)} />
                  </div>
                  <div className="sm:col-span-2 sm:max-w-[calc(50%-0.5rem)]">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Blood Group</label>
                    <select value={form.blood_group} onChange={e => set('blood_group', e.target.value)}
                      className={`w-full h-14 pl-4 pr-4 rounded-xl text-sm font-medium outline-none border transition-all duration-200 cursor-pointer ${
                        form.blood_group ? 'bg-blue-50/40 border-blue-300 text-gray-900' : 'bg-gray-50 border-gray-200 text-gray-400'
                      } focus:border-blue-400 focus:ring-2 focus:ring-blue-100`}>
                      <option value="">Select blood group</option>
                      {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-6" />

              {/* Section: Lifestyle */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Lifestyle</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-blue-50/30 hover:border-blue-200 transition-all">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Smoking</p>
                      <p className="text-xs text-gray-400">Do you smoke?</p>
                    </div>
                    <button type="button" onClick={() => set('is_smoker', !form.is_smoker)}
                      className={`relative w-12 h-7 rounded-full transition-all duration-300 ${form.is_smoker ? 'bg-blue-500' : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${form.is_smoker ? 'left-[22px]' : 'left-0.5'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-blue-50/30 hover:border-blue-200 transition-all">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Alcohol</p>
                      <p className="text-xs text-gray-400">Do you consume alcohol?</p>
                    </div>
                    <button type="button" onClick={() => set('is_alcohol', !form.is_alcohol)}
                      className={`relative w-12 h-7 rounded-full transition-all duration-300 ${form.is_alcohol ? 'bg-blue-500' : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${form.is_alcohol ? 'left-[22px]' : 'left-0.5'}`} />
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Physical Activity</label>
                    <select value={form.physical_activity} onChange={e => set('physical_activity', e.target.value)}
                      className="w-full h-14 pl-4 pr-4 rounded-xl text-sm font-medium text-gray-900 outline-none border border-gray-200 bg-gray-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200 cursor-pointer">
                      {ACTIVITY_LEVELS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sleep Hours (per day)</label>
                    <input type="number" min="1" max="24" value={form.sleep_hours} onChange={e => set('sleep_hours', e.target.value)}
                      placeholder="e.g. 7" className={inputCls(true, !!form.sleep_hours)} />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-6" />

              {/* Section: Medical Background */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Medical Background</h2>
                </div>
                <p className="text-xs text-gray-400 mb-3">Select any existing conditions (leave empty if none)</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {MEDICAL_CONDITIONS.map(({ key, label }) => (
                    <button key={key} type="button" onClick={() => toggleCondition(key)}
                      className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                        form.existing_conditions.includes(key)
                          ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-blue-50/30 hover:border-blue-200'
                      }`}>
                      {form.existing_conditions.includes(key) && (
                        <svg className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      )}
                      {label}
                    </button>
                  ))}
                  <button type="button" onClick={() => toggleCondition('none')}
                    className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                      form.existing_conditions.length === 0
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-emerald-50/30 hover:border-emerald-200'
                    }`}>
                    {form.existing_conditions.length === 0 && (
                      <svg className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    )}
                    None
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-6" />

              {/* Section: Location */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Location</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Country</label>
                    <input type="text" value={form.country} onChange={e => set('country', e.target.value)}
                      placeholder="e.g. India" className={inputCls(true, !!form.country)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">State</label>
                    <input type="text" value={form.state} onChange={e => set('state', e.target.value)}
                      placeholder="e.g. Maharashtra" className={inputCls(true, !!form.state)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">City <span className="text-red-400">*</span></label>
                    <input type="text" value={form.city} onChange={e => set('city', e.target.value)}
                      placeholder="e.g. Mumbai" className={inputCls(!!form.city.trim(), !!form.city)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pincode</label>
                    <input type="text" value={form.pincode} onChange={e => set('pincode', e.target.value)}
                      placeholder="e.g. 400001" maxLength={6} className={inputCls(true, !!form.pincode)} />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full h-[52px] mt-2 rounded-xl text-white text-sm font-semibold tracking-wide bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.015] active:scale-[0.985] transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none">
                {loading
                  ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Creating Account...</>
                  : <>Create Account <ArrowIcon /></>
                }
              </button>

              <p className="text-center text-xs text-gray-400 mt-4">
                Already have an account?{' '}
                <Link to="/login/patient" className="text-blue-600 font-bold hover:underline underline-offset-2">Sign in</Link>
              </p>
            </form>
          )}
        </div>

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
