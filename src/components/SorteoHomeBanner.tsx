import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Ticket, Trophy, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useSiteContent } from '../context/SiteContentContext';
import { useSorteos } from '../context/SorteoContext';

export const SorteoHomeBanner: React.FC = () => {
  const { content } = useSiteContent();
  const { sorteos } = useSorteos();

  // Si en el editor se eligió ocultar el banner en el Home
  if (content.sorteosShowHomeBanner === 'false') {
    return null;
  }

  const activeSorteo = sorteos.find(s => s.status === 'active') || sorteos[0];

  return (
    <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 -mt-4 mb-4">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-linear-to-r from-primario via-slate-900 to-primario text-white p-6 sm:p-8 md:p-10 shadow-xl border border-primario/30"
      >
        {/* Decoraciones sutiles de fondo */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-alerta/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-primario/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-alerta/20 text-amber-300 border border-alerta/30 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{content.sorteosHeroBadge || 'Sorteo Institucional Activo'}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-white mb-2">
              {activeSorteo ? activeSorteo.title : (content.sorteosHeroTitle || 'Sorteos & Rifas Virgen del Cisne')}
            </h2>

            <p className="text-slate-200 text-xs sm:text-sm leading-relaxed mb-4">
              {content.sorteosHomeBannerText || '¡Participa en nuestros sorteos benéficos institucionales o verifica la autenticidad de tu boleto con su código único de 9 dígitos!'}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Validación Oficial Digital con Código QR
              </span>
              {activeSorteo?.drawDate && (
                <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Fecha de Sorteo: {activeSorteo.drawDate}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
            <Link
              to="/sorteos"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-alerta hover:bg-alerta/90 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-alerta/30 hover:scale-[1.02] active:scale-95 transition-all text-center cursor-pointer"
            >
              <Ticket className="w-4 h-4" />
              <span>Verificar o Registrar Boleto</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/sorteos"
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 backdrop-blur-xs transition-all text-center cursor-pointer"
            >
              <span>Ver Premios y Detalles</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default SorteoHomeBanner;
