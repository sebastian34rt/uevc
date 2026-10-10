import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Radio, ArrowLeft, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from './SEO';

export default function LiveStream() {
  const { t } = useTranslation();
  const [liveData, setLiveData] = useState<{ isLive?: boolean; enabled?: boolean; embedUrl?: string; title?: string }>({ isLive: false, enabled: false, embedUrl: '', title: '' });

  const getCleanUrl = (url: string) => {
    if (!url) return '';
    let str = url.trim();
    const iframeMatch = str.match(/src=["']([^"']+)["']/i);
    if (iframeMatch) {
      str = iframeMatch[1];
    }
    if (str.includes('facebook.com') && !str.includes('plugins/video.php')) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(str)}&show_text=false`;
    }
    return str;
  };

  const getDirectLink = (url: string) => {
    if (!url) return '';
    try {
      const match = url.match(/href=([^&]+)/);
      if (match) {
        return decodeURIComponent(match[1]);
      }
    } catch {}
    if (url.startsWith('http') && !url.includes('plugins/video.php')) {
      return url;
    }
    return '';
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'siteConfig', 'liveStream'), (docSnap) => {
      if (docSnap.exists()) {
        setLiveData(docSnap.data() as any);
      } else {
        setLiveData({ isLive: false, enabled: false, embedUrl: '', title: '' });
      }
    });
    return () => unsub();
  }, []);

  const cleanUrl = getCleanUrl(liveData.embedUrl || '');
  const directLink = getDirectLink(liveData.embedUrl || '');

  return (
    <div className="min-h-screen bg-fondo pt-28 pb-16 px-4">
      <SEO 
        title={t('liveStream.title')}
        description={t('liveStream.subtitle')}
        path="/en-vivo"
      />
      <div className="max-w-5xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-primario font-bold mb-8 hover:underline">
          <ArrowLeft className="w-4 h-4" /> {t('liveStream.backHome')}
        </Link>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-primario/10"
        >
          {liveData.enabled === false ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-neutral-100 text-neutral-400 flex items-center justify-center mb-4">
                <Radio className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-texto mb-2">{t('liveStream.offlineTitle')}</h2>
              <p className="text-texto/60 text-sm max-w-md mb-6">
                {t('liveStream.offlineDesc')}
              </p>
              <Link 
                to="/" 
                className="bg-primario text-white px-6 py-2.5 rounded-full font-bold text-xs hover:bg-primario/90 transition-all shadow-md"
              >
                {t('liveStream.backHome')}
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-8">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${liveData.isLive ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-neutral-100 text-neutral-400'}`}>
                  <Radio className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-texto">{liveData.title || t('liveStream.title')}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${liveData.isLive ? 'bg-red-500 animate-pulse' : 'bg-neutral-400'}`}></span>
                    <span className={`text-sm font-bold uppercase tracking-wider ${liveData.isLive ? 'text-red-600' : 'text-texto/60'}`}>
                      {liveData.isLive ? t('liveStream.isLiveNow') : t('liveStream.offlineTitle')}
                    </span>
                  </div>
                </div>
              </div>

              {liveData.isLive && liveData.embedUrl ? (
                <div className="space-y-4">
                  <div className="w-full rounded-2xl overflow-hidden bg-black shadow-lg flex items-center justify-center min-h-[360px] md:min-h-[500px]">
                    <iframe
                      src={cleanUrl}
                      className="w-full min-h-[360px] md:min-h-[500px] border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen={true}
                    ></iframe>
                  </div>

                  {directLink && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-primario/5 rounded-2xl border border-primario/10">
                      <p className="text-xs sm:text-sm text-texto/70 text-center sm:text-left">
                        {t('liveStream.subtitle')}
                      </p>
                      <a
                        href={directLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-[#1877F2] hover:bg-[#166fe5] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all shrink-0"
                      >
                        <ExternalLink className="w-4 h-4" /> {t('liveStream.watchOnFacebook')}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video w-full rounded-2xl bg-neutral-50 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-neutral-200">
                  <Radio className="w-16 h-16 text-neutral-300 mb-4" />
                  <h3 className="text-xl font-bold text-texto/50">{t('liveStream.offlineTitle')}</h3>
                  <p className="text-texto/40 mt-2 max-w-md">{t('liveStream.offlineDesc')}</p>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
