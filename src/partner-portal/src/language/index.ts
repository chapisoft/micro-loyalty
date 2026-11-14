import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { KeyStorage, PARTNER_PORTAL_CONSTANTS } from '@/constants';
import en from '@/language/locales/en';
import fr from '@/language/locales/fr';
import ht from '@/language/locales/ht';
import vi from '@/language/locales/vi';
import { LocalStorage } from '@/utils/localStorage';

const resources = {
  vi: { translation: vi },
  en: { translation: en },
  fr: { translation: fr },
  ht: { translation: ht },
};

const savedLanguage = LocalStorage.get<string>(KeyStorage.LANGUAGE) || PARTNER_PORTAL_CONSTANTS.DEFAULT_LANGUAGE;

i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage,
  fallbackLng: PARTNER_PORTAL_CONSTANTS.DEFAULT_LANGUAGE,
  debug: false,
  interpolation: {
    escapeValue: false,
  },
});

export async function loadExternalLocaleOverrides(): Promise<void> {
  const supported = Object.keys(resources);
  await Promise.all(
    supported.map(async (lng) => {
      try {
        const res = await fetch(`/locales/${lng}.json`, { cache: 'no-store' });
        if (res.ok) {
          const override = await res.json();
          i18n.addResourceBundle(lng, 'translation', override, true, true);
        }
      } catch {
        // Optional external localization override not present
      }
    })
  );
}

export default i18n;
