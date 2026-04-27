import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import SettingsPanel from './SettingsPanel';

/* ── Nav tabs — all 11 patient surfaces ──────────────────── */
const NAV_LINKS = [
  { to: '/dashboard',       key: 'nav_dashboard' },
  { to: '/predict',         key: 'nav_diagnosis' },
  { to: '/chat',            key: 'nav_copilot' },
  { to: '/ocr',             key: 'nav_pharmacy' },
  { to: '/report-analyzer', key: 'nav_reports' },
  { to: '/health-score',    key: 'nav_health_score' },
  { to: '/mental-wellness', key: 'nav_wellness' },
  { to: '/womens-health',   key: 'nav_womens_health' },
  { to: '/health-timeline', key: 'nav_timeline' },
  { to: '/book-doctor',     key: 'nav_doctors' },
  { to: '/emergency',       key: 'nav_sos' },
];

/* ── Inline icons (Lucide-style, matches kit exactly) ────── */
const Icon = ({ d, size = 20, s = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);
const IconSearch = (p) => <Icon {...p} d={<><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>}/>;
const IconBell   = (p) => <Icon {...p} d={<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>}/>;
const IconSettings = (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>}/>;
const IconLogout = (p) => <Icon {...p} s={2.5} d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>}/>;

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Welcome to HealthAssist Clinic!",               time: "Just now",  read: false, icon: "👋", type: "system" },
    { id: 2, text: "New appointment confirmed with Dr. Sharma",      time: "10 min ago",read: false, icon: "📅", type: "appointment" },
    { id: 3, text: "New message from Dr. Patel",                      time: "30 min ago",read: false, icon: "💬", type: "message" },
    { id: 4, text: "Follow-up reminder: Blood test review tomorrow",  time: "1 hr ago",  read: false, icon: "🔔", type: "followup" },
    { id: 5, text: "Health data sync is complete.",                   time: "2 hr ago",  read: true,  icon: "✅", type: "system" },
  ]);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const markAllRead = () => setNotifications(notifications.map(n => ({ ...n, read: true })));

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }
    if (isNotificationsOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationsOpen]);

  // Hide on public routes
  if (['/', '/login', '/register', '/select-role'].includes(location.pathname)
      || location.pathname.startsWith('/login/')
      || location.pathname.startsWith('/signup/')) {
    return null;
  }

  const userInitials = (user?.name || 'User')
    .split(' ').filter(Boolean).map(x => x[0]).slice(-2).join('').toUpperCase() || 'U';

  return (
    <header className="hp-header">
      <div className="hp-header-inner">
        {/* Logo */}
        <div className="hp-logo" onClick={() => navigate('/dashboard')}>
          <div className="mark">
            <svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div>
            <div className="brand">HealthPredict</div>
            <div className="tag">AI · Clinical</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="hp-nav">
          {NAV_LINKS.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              {t(link.key)}
            </NavLink>
          ))}
        </nav>

        {/* Right cluster */}
        <div className="hp-right">
          {user ? (
            <>
              <button className="hp-icon-btn" title="Search">
                <IconSearch />
              </button>

              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <button
                  className="hp-icon-btn"
                  title={t('header_system_alerts')}
                  onClick={() => setIsNotificationsOpen(v => !v)}
                  style={{ position: 'relative' }}
                >
                  <IconBell />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute', top: 6, right: 6, minWidth: 16, height: 16,
                      borderRadius: 9999, background: '#dc2626', border: '2px solid #fff',
                      color: '#fff', fontSize: 9, fontWeight: 800, lineHeight: '12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 3px',
                    }}>{unreadCount}</span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 340,
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
                    boxShadow: '0 20px 60px rgba(0,0,0,.2)', overflow: 'hidden', zIndex: 100,
                  }}>
                    <div style={{
                      padding: 16, borderBottom: '1px solid #e2e8f0',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: '#f8fafc',
                    }}>
                      <h3 className="hp-sh" style={{ fontSize: 14 }}>{t('header_system_alerts')}</h3>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="hp-btn hp-btn-ghost hp-btn-sm" style={{ padding: '4px 10px' }}>
                          {t('header_mark_read')}
                        </button>
                      )}
                    </div>
                    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>
                            {t('header_no_notifications')}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>{t('header_all_caught_up')}</div>
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                            style={{
                              padding: '12px 16px', borderBottom: '1px dashed #e2e8f0',
                              background: n.read ? '#fff' : '#f8fafc',
                              display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer',
                            }}
                          >
                            <div style={{
                              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                              background: n.type === 'appointment' ? '#eff6ff'
                                         : n.type === 'message'    ? '#ecfdf5'
                                         : n.type === 'followup'   ? '#fef3c7'
                                         : '#f1f5f9',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                            }}>{n.icon || '🔔'}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: '#0f172a', lineHeight: 1.4 }}>
                                {n.text}
                              </div>
                              <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>{n.time}</div>
                            </div>
                            {!n.read && (
                              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#059669', marginTop: 6 }} />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                className="hp-icon-btn"
                title={t('common_settings')}
                onClick={() => setIsSettingsOpen(true)}
              >
                <IconSettings />
              </button>

              <button
                className="hp-icon-btn"
                title={t('common_logout')}
                onClick={handleLogout}
                style={{ color: '#dc2626' }}
              >
                <IconLogout size={18} />
              </button>

              <div
                className="hp-avatar"
                title={user.name || t('header_system_user')}
                onClick={() => navigate('/profile')}
                style={{ cursor: 'pointer' }}
              >
                {userInitials}
              </div>
            </>
          ) : (
            <button className="hp-btn hp-btn-primary hp-btn-sm" onClick={() => navigate('/login')}>
              {t('common_secure_login')}
            </button>
          )}
        </div>
      </div>

      <SettingsPanel open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </header>
  );
}
