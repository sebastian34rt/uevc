import { Facebook, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useSiteContent } from '../context/SiteContentContext';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { LanguageSwitcher } from './LanguageSwitcher';

export default function Footer() {
  const { t } = useTranslation();
  const { content } = useSiteContent();
  const [showLiveOption, setShowLiveOption] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'siteConfig', 'liveStream'), (snap) => {
      if (snap.exists()) {
        setShowLiveOption(snap.data().enabled === true);
      } else {
        setShowLiveOption(false);
      }
    }, (error) => {
      console.warn('Footer liveStream listener notice:', error?.message);
    });
    return () => unsub();
  }, []);

  const scrollToSection = (hash: string) => {
    if (window.location.pathname === '/') {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
  };

  const EASE_OUT = [0.23, 1, 0.32, 1] as const;

  return (
    <motion.footer 
      className="bg-primario/5 border-t border-primario/10 py-16 text-[11px] text-texto/60 font-medium uppercase tracking-wider overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: EASE_OUT }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <motion.div 
            className="col-span-1 md:col-span-2"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
          >
            <Link 
              to="/" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-3 mb-6 group cursor-pointer"
            >
              <img 
                src="/logo.png" 
                alt="Logo Virgen del Cisne" 
                className="w-10 h-10 object-contain group-hover:scale-105 transition-transform" 
                onError={(e) => { 
                  e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%231e3a8a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>'; 
                  e.currentTarget.className = "w-10 h-10 object-contain p-2 bg-primario/10 rounded-xl";
                }} 
              />
              <div className="flex flex-col">
                <span className="font-bold tracking-tight text-lg text-texto normal-case leading-none group-hover:text-primario transition-colors">{content.shortName || 'Virgen del Cisne'}</span>
                <span className="text-[9px] text-alerta font-bold tracking-wider uppercase mt-1">{t('common.officialInstitution')}</span>
              </div>
            </Link>
            <p className="max-w-sm normal-case text-sm leading-relaxed text-texto/50">
              {content.institutionBadge || t('hero.defaultBadge')}
            </p>
            <div className="mt-6 flex items-center gap-4">
              <motion.a 
                whileHover={{ scale: 1.15, rotate: 6 }}
                whileTap={{ scale: 0.9 }}
                href={content.facebookUrl || "https://www.facebook.com/virgen.cisne.961"} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-full bg-primario/10 flex items-center justify-center text-primario hover:bg-primario hover:text-white transition-all cursor-pointer shadow-xs" 
                title="Facebook Oficial"
              >
                <Facebook className="w-4 h-4" />
              </motion.a>
              <div className="normal-case">
                <LanguageSwitcher variant="full" />
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: EASE_OUT }}
          >
            <h4 className="text-texto font-bold mb-6 tracking-widest">{t('footer.quickLinks')}</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/" onClick={() => scrollToSection('#inicio')} className="hover:text-primario transition-colors inline-block hover:translate-x-1 duration-200">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link to="/#nosotros" onClick={() => scrollToSection('#nosotros')} className="hover:text-primario transition-colors inline-block hover:translate-x-1 duration-200">
                  {t('nav.about')}
                </Link>
              </li>
              <li>
                <Link to="/directorio" className="hover:text-primario transition-colors inline-block hover:translate-x-1 duration-200">
                  {t('nav.staffDirectory')}
                </Link>
              </li>
              <li>
                <Link to="/galeria" className="hover:text-primario transition-colors inline-block hover:translate-x-1 duration-200">
                  {t('nav.institutionalGallery')}
                </Link>
              </li>
              <li>
                <Link to="/inscripcion" className="hover:text-primario transition-colors inline-block hover:translate-x-1 duration-200">
                  {t('nav.admissions')}
                </Link>
              </li>
              <li>
                <Link to="/sorteos" className="hover:text-primario transition-colors inline-block hover:translate-x-1 duration-200">
                  {t('nav.sorteos')}
                </Link>
              </li>
              {showLiveOption && (
                <li>
                  <Link to="/en-vivo" className="hover:text-primario transition-colors inline-block hover:translate-x-1 duration-200">
                    {t('nav.liveStream')}
                  </Link>
                </li>
              )}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2, ease: EASE_OUT }}
          >
            <h4 className="text-texto font-bold mb-6 tracking-widest">{t('footer.legalAndPrivacy')}</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/privacidad" className="hover:text-primario transition-colors inline-block hover:translate-x-1 duration-200">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/terminos" className="hover:text-primario transition-colors inline-block hover:translate-x-1 duration-200">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link to="/helpdesk" className="hover:text-primario transition-colors font-semibold text-texto/80 flex items-center gap-1.5 hover:translate-x-1 duration-200">
                  <span>{t('nav.helpdesk')}</span>
                </Link>
              </li>
              <li>
                <a 
                  href="/exposicion.html" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-primario transition-colors font-semibold text-amber-700 flex items-center gap-1.5 hover:translate-x-1 duration-200"
                  title="Documento de exposición y defensa de proyecto listo para imprimir"
                >
                  <span>📄 Guion Exposición (PDF)</span>
                </a>
              </li>
              <li>
                <Link to="/login" className="hover:text-primario transition-colors font-bold text-primario inline-block hover:translate-x-1 duration-200">
                  {t('footer.adminAccess')}
                </Link>
              </li>
            </ul>
          </motion.div>
        </div>

        <div className="pt-8 border-t border-primario/10 flex flex-col md:flex-row justify-between items-center gap-4 text-texto/50">
          <div className="flex gap-6">
            <span>T: {content.contactPhone || '0981179375'}</span>
            <span className="hidden sm:inline">&bull;</span>
            <span className="lowercase">{t('footer.internationalAccessibility')}</span>
          </div>
          <p>&copy; {new Date().getFullYear()} {content.institutionName || 'Unidad Educativa Virgen del Cisne'} &bull; Salinas, Santa Elena, Ecuador</p>
        </div>
      </div>
    </motion.footer>
  );
}
