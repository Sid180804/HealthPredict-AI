import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import hi from './locales/hi.json';
import ta from './locales/ta.json';
import te from './locales/te.json';
import kn from './locales/kn.json';
import ml from './locales/ml.json';
import mr from './locales/mr.json';
import bn from './locales/bn.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import ar from './locales/ar.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English',   native: 'English' },
  { code: 'hi', label: 'Hindi',     native: 'हिन्दी' },
  { code: 'ta', label: 'Tamil',     native: 'தமிழ்' },
  { code: 'te', label: 'Telugu',    native: 'తెలుగు' },
  { code: 'kn', label: 'Kannada',   native: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'mr', label: 'Marathi',   native: 'मराठी' },
  { code: 'bn', label: 'Bengali',   native: 'বাংলা' },
  { code: 'es', label: 'Spanish',   native: 'Español' },
  { code: 'fr', label: 'French',    native: 'Français' },
  { code: 'ar', label: 'Arabic',    native: 'العربية' },
];

const STORAGE_KEY = 'app_language';
const saved = (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY)) || 'en';

const RTL_LANGS = ['ar'];
const applyDir = (code) => {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = code;
  document.documentElement.dir = RTL_LANGS.includes(code) ? 'rtl' : 'ltr';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      ta: { translation: ta },
      te: { translation: te },
      kn: { translation: kn },
      ml: { translation: ml },
      mr: { translation: mr },
      bn: { translation: bn },
      es: { translation: es },
      fr: { translation: fr },
      ar: { translation: ar },
    },
    lng: saved,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

applyDir(saved);
i18n.on('languageChanged', applyDir);

export default i18n;
