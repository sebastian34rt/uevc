import { Folder, FileText, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useSiteContent } from '../context/SiteContentContext';

export default function Platforms() {
  const { t } = useTranslation();
  const { content } = useSiteContent();

  const EASE_OUT = [0.23, 1, 0.32, 1] as const;

  return (
    <motion.section 
      id="plataformas" 
      className="py-24 bg-fondo border-b border-primario/10 relative overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: EASE_OUT }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
        <motion.div 
          className="text-center mb-20 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <span className="text-alerta font-bold tracking-widest text-xs uppercase mb-3 block">{t('platforms.badge')}</span>
          <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight text-texto leading-[1.1] mb-4">{t('platforms.heading')}</h3>
          <p className="text-sm md:text-base text-texto/60 font-medium leading-relaxed">
            {t('platforms.subtitle')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 max-w-3xl mx-auto pt-6">
          {/* Sistema Académico (Idukay) */}
          <motion.div 
            className="pt-6 overflow-visible"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: EASE_OUT }}
            whileHover={{ y: -8, scale: 1.02, transition: { type: "spring", stiffness: 350, damping: 18 } }}
            whileTap={{ scale: 0.98 }}
          >
            <a 
              href={content.idukayUrl || 'https://idukay.net/'} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="group block bg-[#eb6123] hover:bg-[#d6571f] transition-all duration-300 rounded-[32px] pt-14 pb-10 px-8 flex flex-col items-center justify-center text-white text-center relative shadow-lg hover:shadow-2xl hover:shadow-[#eb6123]/30 cursor-pointer"
            >
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-white w-20 h-20 rounded-full flex items-center justify-center shadow-md border-4 border-[#fff] z-20 group-hover:scale-110 transition-transform duration-300">
                 <div className="text-[#eb6123] group-hover:rotate-6 transition-transform duration-300">
                    <Folder className="w-9 h-9" fill="currentColor" strokeWidth={1} />
                 </div>
              </div>
              <div className="flex flex-col items-center">
                 <h4 className="font-bold text-2xl leading-tight whitespace-pre-line">{t('platforms.idukayTitle')}</h4>
                 <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold bg-white/20 px-4 py-2 rounded-full group-hover:bg-white group-hover:text-[#eb6123] transition-colors">
                   {t('platforms.idukayAction')} <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                 </span>
              </div>
            </a>
          </motion.div>

          {/* Consulta tus facturas */}
          <motion.div 
            className="pt-6 overflow-visible"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.12, ease: EASE_OUT }}
            whileHover={{ y: -8, scale: 1.02, transition: { type: "spring", stiffness: 350, damping: 18 } }}
            whileTap={{ scale: 0.98 }}
          >
            <a 
              href={content.billsUrl && content.billsUrl !== '#' ? content.billsUrl : `https://wa.me/593${(content.contactPhone || '0981179375').replace(/^0/, '')}?text=${encodeURIComponent('Hola, me comunico para consultar una factura o comprobante de pago.')}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="group block bg-[#2ea2ba] hover:bg-[#288c9f] transition-all duration-300 rounded-[32px] pt-14 pb-10 px-8 flex flex-col items-center justify-center text-white text-center relative shadow-lg hover:shadow-2xl hover:shadow-[#2ea2ba]/30 cursor-pointer"
            >
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-white w-20 h-20 rounded-full flex items-center justify-center shadow-md border-4 border-[#fff] z-20 group-hover:scale-110 transition-transform duration-300">
                 <div className="text-[#2ea2ba] group-hover:rotate-6 transition-transform duration-300">
                    <FileText className="w-9 h-9" strokeWidth={2.2} />
                 </div>
              </div>
              <div className="flex flex-col items-center">
                 <h4 className="font-bold text-2xl leading-tight whitespace-pre-line">{t('platforms.colecturiaTitle')}</h4>
                 <p className="text-xs text-white/90 mt-1 font-medium">{content.billsSubtitle || 'Colecturía y Comprobantes'}</p>
                 <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold bg-white/20 px-4 py-2 rounded-full group-hover:bg-white group-hover:text-[#2ea2ba] transition-colors">
                   {t('platforms.colecturiaAction')} <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                 </span>
              </div>
            </a>
          </motion.div>
        </div>

        <div className="mt-20 overflow-hidden opacity-20">
          <div className="w-full h-[6px]" style={{ backgroundImage: 'repeating-linear-gradient(60deg, #1D1D1F, #1D1D1F 2px, transparent 2px, transparent 6px)' }}></div>
        </div>
      </div>
    </motion.section>
  );
}
