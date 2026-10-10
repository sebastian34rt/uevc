import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Calendar, Radio, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import ShareButtons from './ShareButtons';

export default function News() {
  const { t } = useTranslation();
  const [news, setNews] = useState<{category: string, title: string, date: string, image: string}[]>([]);
  const [liveData, setLiveData] = useState({ isLive: false, enabled: false });
  const [selectedNews, setSelectedNews] = useState<{category: string, title: string, date: string, image: string} | null>(null);

  useEffect(() => {
    const unsubNews = onSnapshot(collection(db, 'news'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNews(data.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0)));
    }, (error) => {
      console.warn('News onSnapshot notice:', error?.message);
    });

    const unsubLive = onSnapshot(doc(db, 'siteConfig', 'liveStream'), (docSnap) => {
      if (docSnap.exists()) {
        setLiveData(docSnap.data() as any);
      }
    }, (error) => {
      console.warn('News liveStream onSnapshot notice:', error?.message);
    });

    return () => {
      unsubNews();
      unsubLive();
    };
  }, []);

  return (
    <motion.section 
      id="noticias" 
      className="py-24 bg-fondo border-y border-primario/10"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-alerta font-bold tracking-widest text-xs uppercase mb-4">{t('news.badge')}</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight text-texto leading-[1.1]">{t('news.heading')}</h3>
          </div>
          <a href="#noticias" className="shrink-0 text-sm font-bold text-alerta hover:text-alerta-hover transition-colors inline-flex items-center gap-2">
            {t('news.viewAll')} <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {news.length > 0 ? (
            news.map((item, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08, ease: [0.23, 1, 0.32, 1] }}
                className="group flex flex-col cursor-pointer"
                onClick={() => setSelectedNews(item)}
              >
                <div className="aspect-[4/3] rounded-3xl overflow-hidden mb-6 bg-neutral-100 relative shadow-sm border border-primario/10">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-4 left-4 bg-fondo/95 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm border border-primario/10">
                    <Calendar className="w-3.5 h-3.5 text-texto/50" />
                    <span className="text-[10px] font-bold text-texto uppercase tracking-wider">{item.date}</span>
                  </div>
                </div>
                <div className="px-2 flex flex-col flex-1">
                  <span className="text-[10px] font-bold text-secundario uppercase tracking-wider mb-2 block">{item.category}</span>
                  <h4 className="font-bold text-lg text-texto leading-snug group-hover:text-primario transition-colors line-clamp-2 mb-3">
                    {item.title}
                  </h4>
                  <div className="mt-auto pt-2 flex items-center justify-between" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => setSelectedNews(item)} 
                      className="text-xs font-bold text-primario hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      {t('news.readMore')} &rarr;
                    </button>
                    <ShareButtons title={`Noticia: ${item.title}`} text={`Mira esta noticia: ${item.title}`} />
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-texto/50 font-medium">
              {t('news.noNews')}
            </div>
          )}
        </div>

        {/* Modal de Detalle de Noticia */}
        <AnimatePresence>
          {selectedNews && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            >
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => setSelectedNews(null)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ type: "spring", duration: 0.45, bounce: 0.12 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-primario/15 p-6 sm:p-8 relative z-10 my-auto"
              >
                <button
                  onClick={() => setSelectedNews(null)}
                  className="absolute top-5 right-5 p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-texto/60 hover:text-texto transition-colors cursor-pointer"
                  aria-label={t('common.close')}
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-neutral-100 mb-6 shadow-sm border border-black/5">
                  <img src={selectedNews.image} alt={selectedNews.title} className="w-full h-full object-cover" />
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[11px] font-bold text-secundario uppercase tracking-wider bg-secundario/10 px-3 py-1 rounded-full">
                    {selectedNews.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-texto/60">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{selectedNews.date}</span>
                  </div>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-texto leading-tight mb-6">
                  {selectedNews.title}
                </h3>

                <p className="text-base text-texto/80 leading-relaxed mb-8">
                  Publicación oficial de la Unidad Educativa Particular Virgen del Cisne. Mantente informado sobre nuestras actividades, reconocimientos y cronograma institucional.
                </p>

                <div className="pt-6 border-t border-primario/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-xs font-semibold text-texto/60">{t('news.share')}:</span>
                  <ShareButtons title={`Noticia: ${selectedNews.title}`} text={`Mira esta noticia: ${selectedNews.title}`} />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {liveData?.enabled && liveData?.isLive && (
          <div className="mt-16 max-w-2xl mx-auto">
            <Link 
              to="/en-vivo" 
              className="flex items-center justify-between p-5 md:p-6 rounded-3xl border bg-red-50 border-red-200 shadow-md hover:shadow-lg transition-all group"
            >
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-red-500 text-white animate-pulse shadow-inner">
                   <Radio className="w-6 h-6" />
                 </div>
                 <div>
                   <h4 className="font-extrabold text-lg text-red-700">
                     {t('nav.liveStream')}
                   </h4>
                   <p className="text-sm text-texto/60 mt-0.5">
                     {t('news.liveBroadcastActive')}
                   </p>
                 </div>
              </div>
              <span className="text-sm font-bold text-red-600 group-hover:translate-x-2 transition-transform bg-white px-4 py-2 rounded-full shadow-sm">
                &rarr;
              </span>
            </Link>
          </div>
        )}

      </div>
    </motion.section>
  );
}
