import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../i18n';

const STORAGE_KEY = 'app_language';

export default function LanguageSelector({ className = '' }) {
  const { i18n, t } = useTranslation();

  const onChange = (e) => {
    const code = e.target.value;
    i18n.changeLanguage(code);
    localStorage.setItem(STORAGE_KEY, code);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-slate-500 text-xs font-medium hidden sm:inline-flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM3.6 9h16.8M3.6 15h16.8M12 3a14.5 14.5 0 010 18M12 3a14.5 14.5 0 000 18" />
        </svg>
        {t('language')}
      </span>
      <select
        value={i18n.language}
        onChange={onChange}
        aria-label={t('language')}
        className="text-xs font-semibold text-slate-700 bg-white/90 backdrop-blur
                   border border-slate-200 rounded-lg px-2.5 py-1.5
                   shadow-sm hover:border-slate-300 focus:outline-none
                   focus:ring-2 focus:ring-blue-400/40 cursor-pointer"
      >
        {SUPPORTED_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>{l.native}</option>
        ))}
      </select>
    </div>
  );
}
