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
  'en';

i18next.use(initReactI18next).init({
  debug: false,
  lng: initialLang,
  fallbackLng: 'en',
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

const LOCALE_MAP: Record<string, string> = {
  vi: 'vi-VN',
  en: 'en-US',
  fr: 'fr-FR',
  ht: 'fr-HT',
};

const SUFFIX_ORDER: Record<string, string[]> = {
  vi: ['Vi', 'En', 'Fr', 'Ht'],
  en: ['En', 'Fr', 'Ht', 'Vi'],
  fr: ['Fr', 'En', 'Ht', 'Vi'],
  ht: ['Ht', 'Fr', 'En', 'Vi'],
};

export const normalizeLang = (lng?: string): string => {
  const short = (lng || i18next.language || 'en').split('-')[0].toLowerCase();
  return validLangs.includes(short) ? short : 'en';
};

export const toDateLocale = (lng?: string): string => LOCALE_MAP[normalizeLang(lng)] || 'en-US';

export const pickLocalizedField = (
  item: unknown,
  baseField: string,
  lng?: string,
  fallbackFields: string[] = [],
): string => {
  if (!item || typeof item !== 'object') return '';
  const rec = item as Record<string, unknown>;
  const lang = normalizeLang(lng);
  const order = SUFFIX_ORDER[lang] || SUFFIX_ORDER.en;
  const keys = [
    ...order.map((suf) => `${baseField}${suf}`),
    baseField,
    ...fallbackFields,
  ];
  for (const k of keys) {
    const val = rec[k];
    if (typeof val === 'string' && val.trim()) {
      return val.trim();
    }
  }
  return '';
};

export const changeLanguage = (lng: string) => {
  if (validLangs.includes(lng)) {
    i18next.changeLanguage(lng);
    localStorage.setItem('loyalty_webview_lng', lng);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lng;
    }
  }
};

if (typeof document !== 'undefined') {
  document.documentElement.lang = normalizeLang(initialLang);
}

export const SUPPORTED_LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', short: 'VI', flag: '🇻🇳' },
  { code: 'en', label: 'English', short: 'EN', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', short: 'FR', flag: '🇫🇷' },
  { code: 'ht', label: 'Kreyòl', short: 'HT', flag: '🇭🇹' },
];

export default i18next;
