import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import vi from './locales/vi';
import en from './locales/en';
import fr from './locales/fr';
import ht from './locales/ht';

// Detect language from URL search param (?lang=vi|en|fr|ht) or localStorage
const urlParams = new URLSearchParams(window.location.search);
const queryLang = urlParams.get('lang')?.toLowerCase();
const validLangs = ['vi', 'en', 'fr', 'ht'];
const initialLang =
  (queryLang && validLangs.includes(queryLang) ? queryLang : null) ||
  localStorage.getItem('loyalty_webview_lng') ||
  'vi';

i18next.use(initReactI18next).init({
  lng: initialLang,
  fallbackLng: 'vi',
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  resources: {
    vi: { translation: vi },
    en: { translation: en },
    fr: { translation: fr },
    ht: { translation: ht },
  },
});

export const changeLanguage = (lng: string) => {
  if (validLangs.includes(lng)) {
    i18next.changeLanguage(lng);
    localStorage.setItem('loyalty_webview_lng', lng);
  }
};

export const SUPPORTED_LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', short: 'VI', flag: '🇻🇳' },
  { code: 'en', label: 'English', short: 'EN', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', short: 'FR', flag: '🇫🇷' },
  { code: 'ht', label: 'Kreyòl', short: 'HT', flag: '🇭🇹' },
];

export default i18next;
