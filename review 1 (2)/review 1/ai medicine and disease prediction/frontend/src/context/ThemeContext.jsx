import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    prefersDark ? root.classList.add('dark') : root.classList.remove('dark');
  }
}

const DEFAULT_NOTIF   = { email: true, medicine: true, appointment: true, health: true };
const DEFAULT_ACCESS  = { largeFont: false, highContrast: false, reduceMotion: false };
const DEFAULT_HEALTH  = { language: 'en', weight: 'kg', height: 'cm', temp: 'celsius' };

function safeParse(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem('theme') || 'light');

  const [notifications, setNotifications] = useState(() => safeParse('notif_settings',  DEFAULT_NOTIF));
  const [accessibility, setAccessibility] = useState(() => safeParse('access_settings', DEFAULT_ACCESS));
  const [healthPrefs,   setHealthPrefs]   = useState(() => safeParse('health_prefs',    DEFAULT_HEALTH));

  const setTheme = useCallback((t) => {
    setThemeState(t);
    localStorage.setItem('theme', t);
    applyTheme(t);
  }, []);

  // Apply theme on mount
  useEffect(() => { applyTheme(theme); }, []);

  // Listen for system theme changes when mode is 'system'
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  // Accessibility side-effects
  useEffect(() => {
    document.documentElement.style.fontSize = accessibility.largeFont ? '18px' : '';
    accessibility.highContrast
      ? document.documentElement.classList.add('high-contrast')
      : document.documentElement.classList.remove('high-contrast');
    accessibility.reduceMotion
      ? document.documentElement.classList.add('reduce-motion')
      : document.documentElement.classList.remove('reduce-motion');
    localStorage.setItem('access_settings', JSON.stringify(accessibility));
  }, [accessibility]);

  useEffect(() => { localStorage.setItem('notif_settings', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('health_prefs',   JSON.stringify(healthPrefs));   }, [healthPrefs]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, notifications, setNotifications, accessibility, setAccessibility, healthPrefs, setHealthPrefs }}>
      {children}
    </ThemeContext.Provider>
  );
}
