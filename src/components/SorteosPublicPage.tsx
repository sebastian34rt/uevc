import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSorteos } from '../context/SorteoContext';
import { useSiteContent } from '../context/SiteContentContext';
import { SorteoTicketCard } from './SorteoTicketCard';
import { SorteoPrintModal } from './SorteoPrintModal';
import { 
  Trophy, 
  Search, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  ArrowRight,
  ShieldCheck,
  Ticket as TicketIcon,
  Printer,
  Hash,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  Lock,
  Phone,
  QrCode
} from 'lucide-react';
import SEO from './SEO';
import { useAuth } from '../context/AuthContext';
import { normalizeTicketCode, formatTicketCodeDisplay } from '../utils/sorteoSecurity';

export const SorteosPublicPage: React.FC = () => {
  const { t } = useTranslation();
  const { sorteos, tickets, loading, deleteTicket } = useSorteos();
  const { content } = useSiteContent();
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();

  const [ticketSearchCode, setTicketSearchCode] = useState('');
  const [searchedTicket, setSearchedTicket] = useState<any | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Estado del Modal de Impresión
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [ticketsToPrint, setTicketsToPrint] = useState<any[]>([]);
  const [printTitle, setPrintTitle] = useState('Planilla Oficial de Boletos');

  // Estado del Modal de Eliminación
  const [ticketToDelete, setTicketToDelete] = useState<any | null>(null);
  const [isDeletingTicket, setIsDeletingTicket] = useState(false);
  const searchSectionRef = useRef<HTMLDivElement>(null);

  // Auto-búsqueda si viene con parámetro ?ticket= en la URL (por ejemplo escaneando el QR)
  useEffect(() => {
    const codeParam = searchParams.get('ticket');
    if (codeParam) {
      setTicketSearchCode(codeParam);
      handleSearchTicket(codeParam);
      // Desplazamiento suave para que en móviles el usuario vea su boleto de inmediato
      const timer = setTimeout(() => {
        searchSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [searchParams, tickets]);

  const handleSearchTicket = (codeToSearch?: string) => {
    const raw = codeToSearch || ticketSearchCode;
    const clean = normalizeTicketCode(raw);
    if (!clean) return;

    setSearchPerformed(true);
    const found = tickets.find(
      t => normalizeTicketCode(t.ticketCode) === clean || t.ticketCode.toUpperCase() === raw.trim().toUpperCase()
    );
    setSearchedTicket(found || null);
  };

  const handlePrintSingle = (ticket: any) => {
    setTicketsToPrint([ticket]);
    const raffle = sorteos.find(s => s.id === ticket.sorteoId);
    setPrintTitle(`Boleto Oficial #${formatTicketCodeDisplay(ticket.ticketCode)} - ${raffle?.title || 'Sorteo Institucional'}`);
    setIsPrintModalOpen(true);
  };

  const handleConfirmDeleteTicket = async () => {
    if (!ticketToDelete) return;
    setIsDeletingTicket(true);
    try {
      await deleteTicket(ticketToDelete.id);
      if (searchedTicket?.id === ticketToDelete.id) {
        setSearchedTicket(null);
      }
      setTicketToDelete(null);
    } catch (err) {
      console.error('Error deleting ticket:', err);
    } finally {
      setIsDeletingTicket(false);
    }
  };

  const activeSorteos = sorteos.filter(s => s.status === 'active');
  const completedSorteos = sorteos.filter(s => s.status === 'completed');

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 pt-8 sm:pt-12">
      <SEO 
        title="Sorteos & Rifas Institucionales - U.E. Virgen del Cisne"
        description="Portal oficial de verificación de boletos y sorteos institucionales de la Unidad Educativa Virgen del Cisne."
        path="/sorteos"
      />

      {/* HEADER HERO */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-texto border border-primario/15 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primario/10 rounded-full text-xs font-bold uppercase tracking-wider text-primario border border-primario/20 mb-4">
                <Trophy className="w-4 h-4 text-primario" />
                {content.sorteosHeroBadge || t('sorteos.badge')}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black tracking-tight text-texto mb-3">
                {content.sorteosHeroTitle || t('sorteos.title')}
              </h1>
              <p className="text-texto/70 text-sm sm:text-base leading-relaxed">
                {content.sorteosHeroDescription || t('sorteos.description')} {content.institutionName || 'Unidad Educativa Virgen del Cisne'}.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-primario/[4%] p-4 rounded-2xl border border-primario/15">
              <img 
                src="/logo.png" 
                alt="Logo Institucional" 
                className="w-16 h-16 object-contain bg-white rounded-xl p-1.5 shadow-xs border border-primario/10 shrink-0"
                onError={(e) => { 
                  e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%231e3a8a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>'; 
                }}
              />
              <div>
                <span className="text-[10px] text-primario font-bold uppercase tracking-wider block">
                  {t('common.securityAndTransparency')}
                </span>
                <span className="font-bold text-sm text-texto block">
                  {content.shortName || 'Virgen del Cisne'}
                </span>
                <span className="text-xs text-texto/60 flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {t('common.officialDigitalVerification')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* BUSCADOR / VERIFICADOR DE BOLETOS */}
        <div ref={searchSectionRef} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md">
          {searchParams.get('ticket') && (
            <div className="mb-6 p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs font-bold shadow-xs max-w-lg mx-auto">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <QrCode className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="block font-black text-sm text-emerald-950">¡Boleto Detectado por Código QR!</span>
                <span className="font-mono text-emerald-800 text-xs">
                  Verificando autenticidad en tiempo real: #{searchParams.get('ticket')}
                </span>
              </div>
            </div>
          )}

          <div className="text-center max-w-xl mx-auto mb-6">
            <span className="text-xs font-bold text-primario tracking-widest uppercase block mb-1">
              {t('sorteos.searchLabel')}
            </span>
            <h2 className="text-2xl font-serif font-black text-slate-900">
              {content.sorteosHeroTitle || t('sorteos.title')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {content.sorteosSecurityGuarantee || t('sorteos.securityGuarantee')}
            </p>
          </div>

          <form 
            onSubmit={(e) => { e.preventDefault(); handleSearchTicket(); }}
            className="max-w-lg mx-auto flex flex-col sm:flex-row gap-2.5"
          >
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={ticketSearchCode}
                onChange={(e) => setTicketSearchCode(e.target.value.toUpperCase())}
                placeholder={t('sorteos.searchPlaceholder')}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-mono font-bold text-base uppercase focus:outline-none focus:ring-2 focus:ring-primario/20 focus:bg-white transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-primario hover:bg-primario/90 text-white rounded-2xl font-bold text-sm transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
            >
              {t('sorteos.searchButton')}
            </button>
          </form>

          {/* RESULTADO DE LA BÚSQUEDA */}
          {searchPerformed && (
            <div className="mt-8 pt-6 border-t border-slate-100 max-w-2xl mx-auto">
              {searchedTicket ? (
                <div>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {t('sorteos.verifiedSuccess')}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePrintSingle(searchedTicket)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primario text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primario/90 transition-all cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        {t('sorteos.printTickets')}
                      </button>

                      {isAuthenticated && (
                        <button
                          type="button"
                          onClick={() => setTicketToDelete(searchedTicket)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-rose-700 transition-all cursor-pointer"
                          title="Eliminar este boleto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <SorteoTicketCard
                    ticket={searchedTicket}
                    sorteo={sorteos.find(s => s.id === searchedTicket.sorteoId)}
                    onPrint={() => handlePrintSingle(searchedTicket)}
                  />
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-800">
                  <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                  <h4 className="font-bold text-base mb-1">
                    {t('sorteos.notFoundTitle')}
                  </h4>
                  <p className="text-xs text-rose-600 max-w-sm mx-auto">
                    {t('sorteos.notFoundDesc')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* LISTADO DE SORTEOS ACTIVOS */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-serif font-black text-slate-900 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-500" />
                {t('sorteos.activeSorteosTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {t('sorteos.activeSorteosDesc')}
              </p>
            </div>
          </div>

          {activeSorteos.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-slate-200">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mx-auto mb-3">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-1">
                {t('sorteos.noActiveSorteos')}
              </h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeSorteos.map((sorteo) => {
                const sorteoTicketsCount = tickets.filter(t => t.sorteoId === sorteo.id).length;
                return (
                  <div
                    key={sorteo.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          En Curso
                        </span>

                        <span className="text-xs text-slate-400 font-medium">
                          {sorteo.drawDate ? `Fecha: ${sorteo.drawDate}` : 'Fecha por confirmar'}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 mb-2">
                        {sorteo.title}
                      </h3>

                      {sorteo.description && (
                        <p className="text-xs text-slate-600 mb-4 line-clamp-3">
                          {sorteo.description}
                        </p>
                      )}

                      {/* Premios */}
                      {sorteo.prizes && sorteo.prizes.length > 0 && (
                        <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-3 mb-4">
                          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1.5">
                            Premios Oficiales:
                          </span>
                          <ul className="space-y-1">
                            {sorteo.prizes.map((p, idx) => (
                              <li key={idx} className="text-xs text-slate-800 font-semibold flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>{p}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <TicketIcon className="w-4 h-4 text-primario" />
                        {sorteoTicketsCount} boletos emitidos
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          window.scrollTo({ top: 300, behavior: 'smooth' });
                        }}
                        className="font-bold text-primario hover:underline cursor-pointer flex items-center gap-1"
                      >
                        Verificar un boleto
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SORTEOS FINALIZADOS / GANADORES */}
        {completedSorteos.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Award className="w-6 h-6 text-amber-500" />
              <div>
                <h2 className="text-2xl font-serif font-black text-slate-900">
                  Ganadores & Sorteos Concluidos
                </h2>
                <p className="text-xs text-slate-500">
                  Registro histórico y actas de sorteos realizados
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedSorteos.map((s) => (
                <div 
                  key={s.id}
                  className="bg-white rounded-3xl p-6 border border-amber-300 bg-gradient-to-br from-white to-amber-50/30 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-0.5 rounded-full uppercase tracking-wider">
                      Sorteo Finalizado
                    </span>
                    <span className="text-xs text-slate-400">
                      {s.drawDate}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-slate-900 mb-2">
                    {s.title}
                  </h3>

                  <div className="bg-white p-4 rounded-2xl border border-amber-200 mt-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-600 block">
                        Boleto Ganador
                      </span>
                      <span className="font-mono font-black text-xl text-slate-900">
                        {s.winnerTicketCode || 'N/A'}
                      </span>
                      <span className="text-xs font-bold text-slate-700 block mt-0.5">
                        {s.winnerParticipantName || 'Al Portador'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Premio
                      </span>
                      <span className="text-xs font-bold text-amber-800">
                        {s.winnerPrize || s.prizes?.[0] || 'Premio Mayor'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* POLÍTICA DE SEGURIDAD ANTIFRAUDE Y CONFIDENCIALIDAD DE BOLETOS */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-md">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Protocolo Antifraude & Privacidad Institucional</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-black mb-2 text-white">
                Confidencialidad de Boletos y Prevención de Fraudes
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Por estricta política de seguridad institucional y para prevenir fraudes o duplicaciones, los números de boletos <strong>no se publican en listas abiertas</strong>. Cada código de 9 dígitos es estrictamente privado: solo lo posee el comprador al recibir su boleto oficial y la administración en sus registros seguros.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Verificación individual por código o QR
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Registro oficial de ganadores con teléfono y correo
                </span>
                {content.sorteosClaimContact && (
                  <span className="flex items-center gap-1.5 text-amber-300 font-medium">
                    <Phone className="w-3.5 h-3.5 text-amber-400" /> Atención / Ganadores: {content.sorteosClaimContact}
                  </span>
                )}
              </div>
            </div>

            {isAuthenticated && (
              <div className="bg-white/10 backdrop-blur-xs p-5 rounded-2xl border border-white/15 shrink-0 text-center w-full md:w-auto">
                <span className="text-xs font-bold text-amber-300 block mb-1">
                  Acceso Administrativo Privado
                </span>
                <p className="text-[11px] text-slate-300 mb-3 max-w-xs mx-auto">
                  La planilla completa, generación en lote e impresión de boletos se gestiona en privado desde el panel.
                </p>
                <Link
                  to="/admin"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primario hover:bg-primario/90 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-95 w-full"
                >
                  <Lock className="w-4 h-4" />
                  Panel Privado de Boletos
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE IMPRESIÓN OFICIAL DE BOLETOS */}
      {isPrintModalOpen && (
        <SorteoPrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          tickets={ticketsToPrint}
          sorteos={sorteos}
          title={printTitle}
        />
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE BOLETO */}
      {ticketToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs p-4 flex items-center justify-center animate-fade-in print:hidden">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-rose-100 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>

            <h3 className="text-xl font-serif font-black text-slate-900 mb-2">
              ¿Eliminar Boleto #{formatTicketCodeDisplay(ticketToDelete.ticketCode)}?
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
              El código de 9 dígitos ({ticketToDelete.ticketCode}) quedará revocado y eliminado de los registros oficiales de la institución.
            </p>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl mb-6 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-rose-800 font-medium leading-snug">
                Esta acción eliminará permanentemente el registro de Firebase. No se puede deshacer.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setTicketToDelete(null)}
                disabled={isDeletingTicket}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteTicket}
                disabled={isDeletingTicket}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isDeletingTicket ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Sí, Eliminar Boleto</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SorteosPublicPage;
