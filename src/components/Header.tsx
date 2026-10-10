import { Menu, X, Radio, ChevronDown, Users, Calendar, Image as ImageIcon, Wrench, Ticket } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useSiteContent } from '../context/SiteContentContext';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { PWAInstallButton } from './PWAInstallButton';
import { LanguageSwitcher } from './LanguageSwitcher';

export default function Header() {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [showLiveOption, setShowLiveOption] = useState(false);
  const { content } = useSiteContent();
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'siteConfig', 'liveStream'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setShowLiveOption(d.enabled === true);
        setIsLive(d.enabled === true && !!d.isLive);
      } else {
        setShowLiveOption(false);
        setIsLive(false);
      }
    }, (error) => {
      console.warn('liveStream listener notice:', error?.message);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCommunityOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const primaryNavLinks = [
    { name: t('nav.home'), path: '/', hash: '#inicio' },
    { name: t('nav.about'), path: '/', hash: '#nosotros' },
    { name: t('nav.programs'), path: '/', hash: '#oferta' },
    { name: t('nav.news'), path: '/', hash: '#noticias' },
  ];

  interface CommunityLink {
    name: string;
    path: string;
    desc: string;
    icon: any;
    hash?: string;
  }

  const communityLinks: CommunityLink[] = [
    { 
      name: t('nav.staffDirectory'), 
      path: '/directorio',
      desc: t('nav.staffDirectoryDesc'),
      icon: Users 
    },
    { 
      name: t('nav.schoolCalendar'), 
      path: '/', 
      hash: '#calendario',
      desc: t('nav.schoolCalendarDesc'),
      icon: Calendar 
    },
    { 
      name: t('nav.institutionalGallery'), 
      path: '/galeria',
      desc: t('nav.institutionalGalleryDesc'),
      icon: ImageIcon 
    },
    { 
      name: t('nav.helpdesk'), 
      path: '/helpdesk',
      desc: t('nav.helpdeskDesc'),
      icon: Wrench 
    },
    { 
      name: t('nav.sorteos'), 
      path: '/sorteos',
      desc: t('nav.sorteosDesc'),
      icon: Ticket 
    },
  ];

  const handleNavClick = (path: string, hash?: string) => {
    setIsMenuOpen(false);
    setIsCommunityOpen(false);
    if (hash) {
      if (location.pathname === '/') {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        navigate(path + hash);
      }
    } else {
      navigate(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-20 border-b border-primario/10 bg-fondo/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          <Link 
            to="/" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 group cursor-pointer shrink-0"
          >
            <img 
              src="/logo.png" 
              alt="Logo Virgen del Cisne" 
              className="w-11 h-11 sm:w-12 sm:h-12 object-contain group-hover:scale-105 transition-transform" 
              onError={(e) => { 
                e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%231e3a8a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>'; 
                e.currentTarget.className = "w-10 h-10 object-contain p-2 bg-primario/10 rounded-xl";
              }} 
            />
            <div className="flex flex-col">
              <span className="font-serif font-bold tracking-tight text-lg sm:text-xl text-texto leading-none group-hover:text-primario transition-colors">
                {content.shortName || 'Virgen del Cisne'}
              </span>
              <span className="text-[10px] text-alerta font-bold tracking-wider uppercase mt-1">
                {t('common.officialInstitution')}
              </span>
            </div>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-4 xl:gap-5 text-sm font-medium text-texto/80">
            {primaryNavLinks.map((link) => (
              <motion.button 
                key={link.path + (link.hash || '')} 
                whileHover={{ y: -2, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleNavClick(link.path, link.hash)}
                className="hover:text-primario transition-colors cursor-pointer bg-transparent border-0 font-medium py-1 px-2 rounded-lg hover:bg-primario/5"
              >
                {link.name}
              </motion.button>
            ))}

            <div 
              ref={dropdownRef}
              className="relative"
              onMouseEnter={() => setIsCommunityOpen(true)}
              onMouseLeave={() => setIsCommunityOpen(false)}
            >
              <motion.button
                type="button"
                whileHover={{ y: -2, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCommunityOpen(!isCommunityOpen)}
                className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-primario/5 hover:text-primario transition-colors cursor-pointer ${
                  isCommunityOpen ? 'text-primario font-semibold bg-primario/5' : ''
                }`}
                aria-expanded={isCommunityOpen}
              >
                <span>{t('nav.community')}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isCommunityOpen ? 'rotate-180' : ''}`} />
              </motion.button>

              <AnimatePresence>
                {isCommunityOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.96, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -4 }}
                    transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute left-1/2 -translate-x-1/2 top-full pt-2 w-72 z-50 origin-top pointer-events-auto"
                  >
                    <div className="bg-white rounded-2xl p-2.5 shadow-xl border border-primario/15 ring-1 ring-black/5">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-texto/40 uppercase tracking-wider">
                        {t('nav.institutionalResources')}
                      </div>
                      
                      {communityLinks.map((item) => {
                        const IconComponent = item.icon;
                        return (
                          <button
                            key={item.path + (item.hash || '')}
                            onClick={() => handleNavClick(item.path, item.hash)}
                            className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-primario/5 transition-colors text-left group cursor-pointer"
                          >
                            <div className="p-2 rounded-lg bg-primario/10 text-primario group-hover:bg-primario group-hover:text-white transition-colors shrink-0 mt-0.5">
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-texto group-hover:text-primario transition-colors font-sans">
                                {item.name}
                              </div>
                              <div className="text-[11px] text-texto/50 truncate font-sans">
                                {item.desc}
                              </div>
                            </div>
                          </button>
                        );
                      })}

                      {showLiveOption && (
                        <button
                          onClick={() => handleNavClick('/en-vivo')}
                          className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-red-50 transition-colors text-left group cursor-pointer border-t border-primario/5 mt-1"
                        >
                          <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                            isLive ? 'bg-red-500 text-white animate-pulse' : 'bg-red-100 text-red-600'
                          }`}>
                            <Radio className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                              <span>{t('nav.liveStream')}</span>
                              {isLive && (
                                <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.2 rounded-full font-bold uppercase">
                                  {t('nav.liveStreamLive')}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-red-600/70 truncate">
                              {isLive ? t('nav.liveStreamActiveDesc') : t('nav.liveStreamRecordingsDesc')}
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-6 w-px bg-primario/15 mx-0.5" />

            <div className="flex items-center gap-2">
              <LanguageSwitcher />

              <PWAInstallButton />

              <Link 
                to="/inscripcion" 
                className="bg-primario text-white px-4 py-2 rounded-full shadow-md shadow-primario/20 hover:bg-primario/90 hover:scale-[1.02] active:scale-95 transition-all text-xs font-bold tracking-wide"
              >
                {t('nav.admissions')}
              </Link>
            </div>
          </nav>

          <div className="lg:hidden flex items-center gap-2">
            <LanguageSwitcher />
            <button 
              type="button"
              className="p-2 rounded-xl text-texto/70 hover:bg-primario/10 transition-colors cursor-pointer" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            >
              {isMenuOpen ? <X className="h-6 w-6 text-texto" /> : <Menu className="h-6 w-6 text-texto" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -6 }}
            transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
            className="lg:hidden bg-fondo border-t border-primario/10 px-5 py-5 shadow-2xl max-h-[calc(100vh-5rem)] overflow-y-auto space-y-5"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-texto/40 uppercase tracking-widest px-2">
                {t('nav.sections')}
              </span>
              {primaryNavLinks.map((link) => (
                <button 
                  key={link.path + (link.hash || '')} 
                  onClick={() => handleNavClick(link.path, link.hash)}
                  className="block w-full text-left text-texto/90 hover:text-primario font-semibold text-sm py-2 px-2 rounded-lg hover:bg-primario/5 transition-colors"
                >
                  {link.name}
                </button>
              ))}
            </div>

            <div className="space-y-1 pt-2 border-t border-primario/10">
              <span className="text-[10px] font-bold text-texto/40 uppercase tracking-widest px-2">
                {t('nav.communityAndResources')}
              </span>
              <div className="grid grid-cols-1 gap-1 mt-1">
                {communityLinks.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.path + (item.hash || '')}
                      onClick={() => handleNavClick(item.path, item.hash)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-primario/5 text-texto/80 hover:text-primario transition-colors text-left"
                    >
                      <div className="p-1.5 rounded-lg bg-primario/10 text-primario shrink-0">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold">{item.name}</span>
                    </button>
                  );
                })}

                {showLiveOption && (
                  <button
                    onClick={() => handleNavClick('/en-vivo')}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-red-50 text-red-700 transition-colors text-left"
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 ${isLive ? 'bg-red-500 text-white animate-pulse' : 'bg-red-200 text-red-700'}`}>
                      <Radio className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span>{t('nav.liveStream')}</span>
                      {isLive && (
                        <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded-full font-bold uppercase">
                          {t('nav.liveStreamLive')}
                        </span>
                      )}
                    </div>
                  </button>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-primario/10 space-y-2.5">
              <div className="flex items-center justify-between px-2 py-1 bg-primario/5 rounded-xl">
                <span className="text-xs font-medium text-texto/70">{t('common.language')}</span>
                <LanguageSwitcher variant="full" />
              </div>

              <Link 
                to="/inscripcion" 
                onClick={() => setIsMenuOpen(false)} 
                className="block w-full text-center bg-primario text-white px-6 py-3 rounded-full text-xs font-bold shadow-lg shadow-primario/20 hover:bg-primario/90 transition-all active:scale-[0.97]"
              >
                {t('nav.startAdmissions')}
              </Link>
              <PWAInstallButton className="w-full justify-center py-2.5" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
