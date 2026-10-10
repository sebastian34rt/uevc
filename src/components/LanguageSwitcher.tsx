import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LanguageSwitcherProps {
  variant?: 'compact' | 'full' | 'dropdown';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  variant = 'compact',
  className = '' 
}) => {
  const { i18n, t } = useTranslation();
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'es';
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const toggleLanguage = () => {
    const nextLang = currentLang === 'es' ? 'en' : 'es';
    i18n.changeLanguage(nextLang);
  };

  const selectLanguage = (lang: 'es' | 'en') => {
    i18n.changeLanguage(lang);
    setIsOpen(false);
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'full') {
    return (
      <div className={`inline-flex items-center p-1 bg-primario/10 rounded-xl border border-primario/20 ${className}`}>
        <button
          type="button"
          onClick={() => selectLanguage('es')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            currentLang === 'es'
              ? 'bg-primario text-white shadow-xs'
              : 'text-texto/70 hover:text-primario hover:bg-white/60'
          }`}
          aria-label="Seleccionar idioma Español"
        >
          <span className="text-sm">🇪🇨</span>
          <span>ES</span>
        </button>
        <button
          type="button"
          onClick={() => selectLanguage('en')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            currentLang === 'en'
              ? 'bg-primario text-white shadow-xs'
              : 'text-texto/70 hover:text-primario hover:bg-white/60'
          }`}
          aria-label="Select English language"
        >
          <span className="text-sm">🇺🇸</span>
          <span>EN</span>
        </button>
      </div>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primario/20 bg-fondo/80 hover:bg-primario/10 text-texto text-xs font-bold transition-colors cursor-pointer"
          aria-haspopup="true"
          aria-expanded={isOpen}
          aria-label={t('common.language')}
        >
          <Globe className="w-4 h-4 text-primario" />
          <span className="uppercase">{currentLang}</span>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-1.5 w-36 rounded-xl bg-white shadow-xl border border-primario/15 p-1.5 z-50 origin-top-right ring-1 ring-black/5"
            >
              <button
                type="button"
                onClick={() => selectLanguage('es')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  currentLang === 'es' ? 'bg-primario/10 text-primario' : 'text-texto/80 hover:bg-primario/5 hover:text-primario'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>🇪🇨</span>
                  <span>Español</span>
                </div>
                {currentLang === 'es' && <Check className="w-3.5 h-3.5 text-primario" />}
              </button>
              <button
                type="button"
                onClick={() => selectLanguage('en')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors mt-0.5 ${
                  currentLang === 'en' ? 'bg-primario/10 text-primario' : 'text-texto/80 hover:bg-primario/5 hover:text-primario'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>🇺🇸</span>
                  <span>English</span>
                </div>
                {currentLang === 'en' && <Check className="w-3.5 h-3.5 text-primario" />}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Default compact toggle button
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleLanguage}
      title={currentLang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
      aria-label={currentLang === 'es' ? 'Switch language to English' : 'Cambiar idioma a Español'}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold border border-primario/25 bg-primario/5 hover:bg-primario/15 text-primario transition-all shadow-2xs cursor-pointer ${className}`}
    >
      <Globe className="w-3.5 h-3.5" />
      <span className="uppercase tracking-wider">{currentLang}</span>
      <span className="text-[10px] text-texto/40 font-normal">|</span>
      <span className="text-[10px] text-texto/60 font-semibold uppercase">{currentLang === 'es' ? 'EN' : 'ES'}</span>
    </motion.button>
  );
};
