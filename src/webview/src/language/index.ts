import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

// Detect language from URL search param (?lang=vi|en|fr|ht) or localStorage
const urlParams = new URLSearchParams(window.location.search);
const queryLang = urlParams.get('lang')?.toLowerCase();
const validLangs = ['vi', 'en', 'fr', 'ht'] as const;
type ValidLang = (typeof validLangs)[number];

const initialLang: ValidLang =
  (queryLang && (validLangs as readonly string[]).includes(queryLang) ? (queryLang as ValidLang) : null) ||
  ((localStorage.getItem('loyalty_webview_lng') || '') as ValidLang) ||
  'en';

const resolvedInitialLang: ValidLang = (validLangs as readonly string[]).includes(initialLang) ? initialLang : 'en';

const LOCALE_LOADERS: Record<ValidLang, () => Promise<{ default: Record<string, unknown> }>> = {
  vi: () => import('./locales/vi'),
  en: () => import('./locales/en'),
  fr: () => import('./locales/fr'),
  ht: () => import('./locales/ht'),
};

i18next.use(initReactI18next).init({
  debug: false,
  lng: resolvedInitialLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  resources: {},
});

const ensureLocaleLoaded = async (lng: ValidLang): Promise<void> => {
  if (i18next.hasResourceBundle(lng, 'translation')) return;
  const mod = await LOCALE_LOADERS[lng]();
  i18next.addResourceBundle(lng, 'translation', mod.default, true, true);
};

let initPromise: Promise<void> | null = null;
export const initI18n = (): Promise<void> => {
  if (!initPromise) {
    initPromise = (async () => {
      await ensureLocaleLoaded(resolvedInitialLang);
      if (resolvedInitialLang !== 'en') {
        void ensureLocaleLoaded('en');
      }
    })();
  }
  return initPromise;
};

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
  return (validLangs as readonly string[]).includes(short) ? short : 'en';
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

export const changeLanguage = async (lng: string) => {
  if ((validLangs as readonly string[]).includes(lng)) {
    const valid = lng as ValidLang;
    await ensureLocaleLoaded(valid);
    await i18next.changeLanguage(valid);
    localStorage.setItem('loyalty_webview_lng', valid);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = valid;
    }
  }
};

if (typeof document !== 'undefined') {
  document.documentElement.lang = normalizeLang(resolvedInitialLang);
}

export const SUPPORTED_LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', short: 'VI', flag: '🇻🇳' },
  { code: 'en', label: 'English', short: 'EN', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', short: 'FR', flag: '🇫🇷' },
  { code: 'ht', label: 'Kreyòl', short: 'HT', flag: '🇭🇹' },
];

export default i18next;
