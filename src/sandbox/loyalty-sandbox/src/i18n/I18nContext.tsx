import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageCode, Translations, SUPPORTED_LANGUAGES } from './types';
import { vi } from './locales/vi';
import { en } from './locales/en';
import { zh } from './locales/zh';
import { ja } from './locales/ja';
import { ko } from './locales/ko';

const translationsMap: Record<LanguageCode, Translations> = {
  vi,
  en,
  zh,
  ja,
  ko,
};

interface I18nContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType>({
  language: 'vi',
  setLanguage: () => {},
  t: vi,
});

const STORAGE_KEY = 'smart_otp_sandbox_lang';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode;
    if (saved && ['vi', 'en', 'zh', 'ja', 'ko'].includes(saved)) {
      return saved;
    }
    // Auto-detect browser language if available
    const browserLang = navigator.language?.toLowerCase() || '';
    if (browserLang.startsWith('en')) return 'en';
    if (browserLang.startsWith('zh')) return 'zh';
    if (browserLang.startsWith('ja')) return 'ja';
    if (browserLang.startsWith('ko')) return 'ko';
    return 'vi';
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const currentTranslations = translationsMap[language] || vi;

  return (
    <I18nContext.Provider value={{ language, setLanguage, t: currentTranslations }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
