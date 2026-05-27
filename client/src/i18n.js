import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './i18n/en.json';
import zhTW from './i18n/zh-TW.json';

const savedLang = localStorage.getItem('lang') || 'zh-TW';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      'zh-TW': { translation: zhTW },
    },
    lng: savedLang,
    fallbackLng: 'zh-TW',
    interpolation: { escapeValue: false },
  });

export default i18n;
