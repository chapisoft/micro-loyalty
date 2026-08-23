import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en';
import ht from './locales/ht';
import fr from './locales/fr';
import zh from './locales/zh';
import ja from './locales/ja';
import ko from './locales/ko';
import vi from './locales/vi';

const savedLanguage = localStorage.getItem('lng') || 'vi';

i18next.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  lng: savedLanguage,
  fallbackLng: 'vi',
  debug: true,
  resources: {
    vi: {
      translation: vi,
    },
    en: {
      translation: en,
    },
    zh: {
      translation: zh,
    },
    ja: {
      translation: ja,
    },
    ko: {
      translation: ko,
    },
    ht: {
      translation: ht,
    },
    fr: {
      translation: fr,
    },
  },
});

export default i18next;
