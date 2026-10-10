import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { es } from './locales/es';
import { en } from './locales/en';

const getInitialLanguage = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('app_language') || localStorage.getItem('i18nextLng');
    if (saved && (saved === 'es' || saved === 'en')) {
      return saved;
    }
    // Check browser language
    const browserLang = navigator.language?.toLowerCase() || '';
    if (browserLang.startsWith('en')) {
      return 'en';
    }
  }
  return 'es';
};

const initialLang = getInitialLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    lng: initialLang,
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

// Keep <html> lang attribute and localStorage updated on language changes
if (typeof window !== 'undefined') {
  document.documentElement.lang = i18n.language || 'es';

  i18n.on('languageChanged', (lng) => {
    document.documentElement.lang = lng;
    localStorage.setItem('app_language', lng);
    localStorage.setItem('i18nextLng', lng);
  });
}

export default i18n;
