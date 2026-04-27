import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

/* ── Small reusable pieces ────────────────────────────────────────────────── */

function SectionTitle({ icon, label }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="text-slate-400 dark:text-slate-500">{icon}</span>
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</h3>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-slate-100 dark:border-slate-700/60 my-5" />;
}

function Toggle({ checked, onChange, label, sub }) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer group py-2">
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{label}</p>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 ${checked ? 'bg-violet-500' : 'bg-slate-200 dark:bg-slate-600'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </label>
  );
}

function SelectRow({ label, value, onChange, options }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</p>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

/* ── Theme pill buttons ───────────────────────────────────────────────────── */
function ThemeButton({ current, value, icon, label, onClick }) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all duration-200 ${
        active
          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 shadow-sm'
          : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-xs font-bold">{label}</span>
      {active && <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />}
    </button>
  );
}

/* ── Main panel ───────────────────────────────────────────────────────────── */
export default function SettingsPanel({ open, onClose }) {
  const { theme, setTheme, notifications, setNotifications, accessibility, setAccessibility, healthPrefs, setHealthPrefs } = useTheme();
  const { user, updateProfile } = useAuth();

  const panelRef = useRef(null);
  const [activeTab, setActiveTab] = useState('theme');

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Trap scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const toggleNotif = (key) => setNotifications(p => ({ ...p, [key]: !p[key] }));
  const toggleAccess = (key) => setAccessibility(p => ({ ...p, [key]: !p[key] }));
  const setHealthPref = (key, val) => setHealthPrefs(p => ({ ...p, [key]: val }));

  /* Profile edit state */
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [profileMsg, setProfileMsg] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg('');
    const res = await updateProfile({ name: editName, email: editEmail });
    setProfileMsg(res.success ? 'Profile updated!' : (res.error || 'Update failed.'));
    setSavingProfile(false);
  };

  const TABS = [
    { id: 'theme',    icon: '🎨', label: 'Theme' },
    { id: 'profile',  icon: '👤', label: 'Profile' },
    { id: 'notif',    icon: '🔔', label: 'Alerts' },
    { id: 'health',   icon: '🩺', label: 'Health' },
    { id: 'privacy',  icon: '🔒', label: 'Privacy' },
    { id: 'access',   icon: '♿', label: 'Access' },
  ];

  const panel = (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ zIndex: 998 }}
      />

      {/* Drawer */}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 h-full w-[420px] max-w-[95vw] flex flex-col bg-white dark:bg-slate-900 shadow-2xl rounded-l-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ zIndex: 999 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700/60 bg-gradient-to-r from-violet-600 to-purple-700 flex-shrink-0">
          <div>
            <h2 className="text-lg font-extrabold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Settings</h2>
            <p className="text-violet-200 text-xs font-medium mt-0.5">Customize your healthcare experience</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 px-4 pt-3 pb-2 overflow-x-auto flex-shrink-0 border-b border-slate-100 dark:border-slate-700/60">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-1">

          {/* ── THEME ── */}
          {activeTab === 'theme' && (
            <div>
              <SectionTitle icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707" /></svg>} label="Display Theme" />
              <div className="flex gap-2 mb-6">
                <ThemeButton current={theme} value="light"  icon="☀️" label="Day"     onClick={setTheme} />
                <ThemeButton current={theme} value="dark"   icon="🌙" label="Night"   onClick={setTheme} />
                <ThemeButton current={theme} value="system" icon="💻" label="System"  onClick={setTheme} />
              </div>

              <div className={`rounded-xl p-4 border transition-all duration-300 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-violet-700' : 'bg-violet-100'}`}>
                    <svg className={`w-4 h-4 ${theme === 'dark' ? 'text-violet-300' : 'text-violet-600'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Preview</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Current theme: {theme === 'light' ? 'Day Mode' : theme === 'dark' ? 'Night Mode' : 'System Default'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {['bg-violet-400', 'bg-blue-400', 'bg-emerald-400', 'bg-amber-400'].map(c => (
                    <div key={c} className={`h-2 rounded-full flex-1 ${c}`} />
                  ))}
                </div>
              </div>

              <div className="mt-5 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-100 dark:border-violet-800/40">
                <p className="text-xs text-violet-600 dark:text-violet-400 font-semibold">Theme is saved automatically and persists across sessions.</p>
              </div>
            </div>
          )}

          {/* ── PROFILE ── */}
          {activeTab === 'profile' && (
            <div>
              <SectionTitle icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} label="Profile Settings" />

              {/* Avatar */}
              <div className="flex items-center gap-4 mb-5">
                <div className="relative">
                  <img
                    src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=7c3aed&color=fff&size=72&rounded=true`}
                    alt="Avatar"
                    className="w-16 h-16 rounded-2xl ring-2 ring-violet-200 dark:ring-violet-700"
                  />
                  <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center shadow-md hover:bg-violet-700 transition-colors">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">{user?.name || 'User'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full">{user?.role || 'patient'}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Display Name</label>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm font-medium outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/30 transition-all"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm font-medium outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/30 transition-all"
                    placeholder="your@email.com"
                    type="email"
                  />
                </div>
              </div>

              {profileMsg && (
                <p className={`mt-3 text-xs font-semibold ${profileMsg.includes('!') ? 'text-emerald-600' : 'text-red-500'}`}>{profileMsg}</p>
              )}

              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="mt-4 w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white text-sm font-bold shadow-md hover:shadow-violet-200 dark:hover:shadow-violet-900/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60"
              >
                {savingProfile ? 'Saving…' : 'Save Changes'}
              </button>

              <Divider />

              <SectionTitle icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>} label="Security" />

              <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors group">
                <span>Change Password</span>
                <svg className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeTab === 'notif' && (
            <div>
              <SectionTitle icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>} label="Notification Preferences" />

              <div className="space-y-1 divide-y divide-slate-100 dark:divide-slate-700/60">
                <Toggle
                  checked={notifications.email}
                  onChange={() => toggleNotif('email')}
                  label="Email Notifications"
                  sub="Receive health summaries and reports via email"
                />
                <Toggle
                  checked={notifications.medicine}
                  onChange={() => toggleNotif('medicine')}
                  label="Medicine Reminders"
                  sub="Get reminded when it's time for your medication"
                />
                <Toggle
                  checked={notifications.appointment}
                  onChange={() => toggleNotif('appointment')}
                  label="Appointment Alerts"
                  sub="Upcoming doctor appointments and check-ups"
                />
                <Toggle
                  checked={notifications.health}
                  onChange={() => toggleNotif('health')}
                  label="Health Alerts"
                  sub="Critical health metrics and AI-detected anomalies"
                />
              </div>

              <div className="mt-5 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/40">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">Push notification permissions are managed in your browser settings.</p>
              </div>
            </div>
          )}

          {/* ── HEALTH PREFERENCES ── */}
          {activeTab === 'health' && (
            <div>
              <SectionTitle icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>} label="Health & Units" />

              <div className="space-y-1 divide-y divide-slate-100 dark:divide-slate-700/60">
                <SelectRow
                  label="Language"
                  value={healthPrefs.language}
                  onChange={v => setHealthPref('language', v)}
                  options={[{ value: 'en', label: 'English' }, { value: 'hi', label: 'Hindi' }, { value: 'es', label: 'Spanish' }, { value: 'fr', label: 'French' }]}
                />
                <SelectRow
                  label="Weight Units"
                  value={healthPrefs.weight}
                  onChange={v => setHealthPref('weight', v)}
                  options={[{ value: 'kg', label: 'Kilograms (kg)' }, { value: 'lbs', label: 'Pounds (lbs)' }]}
                />
                <SelectRow
                  label="Height Units"
                  value={healthPrefs.height}
                  onChange={v => setHealthPref('height', v)}
                  options={[{ value: 'cm', label: 'Centimetres (cm)' }, { value: 'ft', label: 'Feet / Inches' }]}
                />
                <SelectRow
                  label="Temperature"
                  value={healthPrefs.temp}
                  onChange={v => setHealthPref('temp', v)}
                  options={[{ value: 'celsius', label: 'Celsius (°C)' }, { value: 'fahrenheit', label: 'Fahrenheit (°F)' }]}
                />
              </div>

              <div className="mt-5 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/40">
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">All preferences are saved locally and applied instantly.</p>
              </div>
            </div>
          )}

          {/* ── PRIVACY ── */}
          {activeTab === 'privacy' && (
            <div>
              <SectionTitle icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>} label="Privacy & Data" />

              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700 text-left transition-colors group">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Download My Data</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Export all your health records as JSON</p>
                  </div>
                </button>

                <div className="flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-600">
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Anonymous Data Sharing</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Help improve AI models with anonymised data</p>
                  </div>
                  <button className="relative flex-shrink-0 w-11 h-6 rounded-full bg-violet-500 transition-colors duration-300 focus:outline-none">
                    <span className="absolute top-0.5 left-0.5 translate-x-5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300" />
                  </button>
                </div>

                <Divider />

                <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-red-200 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-900/20 text-left transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-600 dark:text-red-400">Delete Account</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Permanently remove all your data</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── ACCESSIBILITY ── */}
          {activeTab === 'access' && (
            <div>
              <SectionTitle icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" /></svg>} label="Accessibility" />

              <div className="space-y-1 divide-y divide-slate-100 dark:divide-slate-700/60">
                <Toggle
                  checked={accessibility.largeFont}
                  onChange={() => toggleAccess('largeFont')}
                  label="Larger Text"
                  sub="Increases base font size to 18px across the app"
                />
                <Toggle
                  checked={accessibility.highContrast}
                  onChange={() => toggleAccess('highContrast')}
                  label="High Contrast Mode"
                  sub="Enhances colour contrast for better readability"
                />
                <Toggle
                  checked={accessibility.reduceMotion}
                  onChange={() => toggleAccess('reduceMotion')}
                  label="Reduce Animations"
                  sub="Minimises motion for users sensitive to movement"
                />
              </div>

              <div className="mt-5 p-3 bg-sky-50 dark:bg-sky-900/20 rounded-xl border border-sky-100 dark:border-sky-800/40">
                <p className="text-xs text-sky-700 dark:text-sky-400 font-semibold">Accessibility settings are applied immediately and saved for future sessions.</p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700/60 flex-shrink-0">
          <p className="text-center text-xs text-slate-400 dark:text-slate-500">
            HealthAssist v2.0 · All settings auto-saved
          </p>
        </div>
      </div>
    </>
  );

  return createPortal(panel, document.body);
}
