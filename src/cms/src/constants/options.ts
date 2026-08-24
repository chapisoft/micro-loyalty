import { t } from 'i18next';

import { ELanguages } from '.';

const LanguageOption = [
  { name: t('haitian_creole'), id: ELanguages.HT },
  { name: t('english'), id: ELanguages.EN },
  { name: t('french'), id: ELanguages.FR },
];

const OPTIONS = {
  LanguageOption,
};

export default OPTIONS;
