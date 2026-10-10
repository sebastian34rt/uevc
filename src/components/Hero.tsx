import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Sparkles, Ticket } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSiteContent } from '../context/SiteContentContext';
import AnimatedText from './AnimatedText';

const defaultGalleryImages = [
  "/1.jpg",
  "/2.jpg",

  "/3.jpg",
  "/4.jpg",
  "/5.jpg",
  "/6.jpg",
  "/7.jpg",
  "/8.jpg",
  "/9.jpg",
  "/10.jpg",
];

export default function Hero() {
  const { t } = useTranslation();
  const { content } = useSiteContent();
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const unsubHero = onSnapshot(doc(db, 'siteConfig', 'hero'), (heroSnap) => {
      let heroAdminImage: string | null = null;
      if (heroSnap.exists() && heroSnap.data().imageUrl) {
        heroAdminImage = heroSnap.data().imageUrl;
      }

      const unsubGallery = onSnapshot(collection(db, 'gallery'), (gallerySnap) => {
        const data = gallerySnap.docs.map(doc => doc.data());
        let finalImages: string[] = [];

        const filtered = data.filter((item: any) => item.showInIndex !== false);
        const mapped = filtered.map((item: any) => item.src);
        if (mapped.length > 0) {
          finalImages = mapped;
        }
        
        if (heroAdminImage) {
          setImages([heroAdminImage, ...finalImages.filter(img => img !== heroAdminImage)]);
        } else if (finalImages.length > 0) {
          setImages(finalImages);
        } else {
          setImages(defaultGalleryImages);
        }
      }, (err) => {
        console.warn('Gallery onSnapshot notice:', err?.message);
        setImages(defaultGalleryImages);
      });
      
      return () => unsubGallery();
    }, (err) => {
      console.warn('Hero onSnapshot notice:', err?.message);
      setImages(defaultGalleryImages);
    });

    return () => unsubHero();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const EASE_OUT = [0.23, 1, 0.32, 1] as const;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.09,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.55,
        ease: EASE_OUT,
      },
    },
  };

  return (
    <section id="inicio" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 bg-primario/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-2xl"
          >
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-2.5 mb-4">
              <span className="text-alerta font-bold tracking-widest text-[11px] uppercase flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>{content.institutionBadge || t('hero.defaultBadge')}</span>
              </span>
              <span className="text-texto/30 text-xs hidden sm:inline">•</span>
              <Link 
                to="/sorteos" 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 text-xs font-bold uppercase tracking-wider border border-amber-500/20 transition-all hover:scale-105"
              >
                <Ticket className="w-3.5 h-3.5 text-amber-600" />
                <span>{t('hero.sorteosBadge')}</span>
              </Link>
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl lg:text-6xl font-serif font-extrabold leading-[1.15] mb-6 tracking-tight text-texto">
              {content.heroTitle ? (
                <AnimatedText text={content.heroTitle} tag="span" />
              ) : (
                <>
                  <AnimatedText text={t('hero.titlePrefix')} tag="span" /> <br className="hidden sm:block"/>
                  <span className="text-primario">
                    <AnimatedText text={t('hero.titleSuffix')} delay={0.35} tag="span" />
                  </span>
                </>
              )}
            </motion.h1>

            <motion.p variants={itemVariants} className="text-lg text-texto/70 max-w-xl leading-relaxed mb-8 font-sans select-text">
              {content.heroSubtitle || t('hero.defaultSubtitle')}
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
              <motion.a 
                href="#contacto" 
                whileHover={{ scale: 1.04, y: -3 }}
                whileTap={{ scale: 0.96 }}
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('#contacto')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 bg-alerta text-white px-7 py-3.5 rounded-full text-sm font-bold shadow-lg shadow-alerta/20 hover:bg-alerta/90 transition-all cursor-pointer"
              >
                {t('hero.requestInfo')} <ArrowRight className="w-4 h-4" />
              </motion.a>
              <motion.a 
                href="#oferta" 
                whileHover={{ scale: 1.04, y: -3 }}
                whileTap={{ scale: 0.96 }}
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('#oferta')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 text-texto bg-fondo border border-primario/15 px-6 py-3.5 rounded-full text-sm font-semibold hover:bg-primario/5 transition-all shadow-sm cursor-pointer"
              >
                {t('hero.explorePrograms')}
              </motion.a>
            </motion.div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE_OUT }}
            className="relative"
          >
            <div className="aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden shadow-sm border border-primario/10 relative group bg-black/5">
              <AnimatePresence mode="popLayout">
                {images.length > 0 ? (
                  <motion.img 
                    key={currentIndex}
                    src={images[currentIndex]} 
                    alt={`Galería ${currentIndex + 1}`} 
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7, ease: EASE_OUT }}
                    className="w-full h-full object-cover absolute inset-0 z-0 will-change-transform"
                    fetchPriority="high"
                  />
                ) : (
                  <div className="w-full h-full absolute inset-0 bg-primario/10 flex items-center justify-center z-0">
                    <BookOpen className="w-12 h-12 text-primario/30" />
                  </div>
                )}
              </AnimatePresence>
              
              <div className="absolute inset-0 z-10 flex items-center justify-between p-3 sm:p-4 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                <button 
                  onClick={handlePrev} 
                  className="p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm transition-all cursor-pointer hover:scale-110 active:scale-95" 
                  aria-label="Anterior imagen"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button 
                  onClick={handleNext} 
                  className="p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm transition-all cursor-pointer hover:scale-110 active:scale-95" 
                  aria-label="Siguiente imagen"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
              
              <div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-10 flex gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                {images.map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setCurrentIndex(i)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${i === currentIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80 w-2'}`}
                    aria-label={`Ir a imagen ${i + 1}`}
                  />
                ))}
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5, ease: EASE_OUT }}
                className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-[280px] bg-fondo/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl flex items-center gap-3.5 shadow-lg border border-primario/10 z-10"
              >
                <div className="w-12 h-12 bg-detalle/10 rounded-xl flex items-center justify-center text-detalle font-bold text-xl shrink-0 font-serif">
                  {content.experienceYears || '+20'}
                </div>
                <div>
                  <p className="font-bold text-sm text-texto font-serif">{content.experienceLabel || 'Años de excelencia'}</p>
                  <p className="text-xs text-texto/60">{content.experienceSublabel || 'Formando generaciones'}</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
