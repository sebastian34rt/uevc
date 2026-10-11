import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { SorteoTicket, Sorteo } from '../types/sorteo';
import { useSiteContent } from '../context/SiteContentContext';
import { Trophy, Printer, CheckCircle2, Award, Sparkles, Copy, Check, ShieldCheck, Calendar, Scissors } from 'lucide-react';
import { formatTicketCodeDisplay, normalizeTicketCode, is9DigitCode } from '../utils/sorteoSecurity';
import { getSorteoQrUrl } from '../utils/domainConfig';

export type TicketDensity = 'ultra' | 'micro' | 'compact' | 'standard' | 'large';

interface SorteoTicketCardProps {
  ticket: SorteoTicket;
  sorteo?: Sorteo;
  compact?: boolean;
  density?: TicketDensity;
  showPrintFields?: boolean;
  onPrint?: (ticket: SorteoTicket) => void;
}

export const SorteoTicketCard: React.FC<SorteoTicketCardProps> = ({
  ticket,
  sorteo,
  compact = false,
  density,
  onPrint
}) => {
  const { t } = useTranslation();
  const { content } = useSiteContent();
  const [copied, setCopied] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  // Normalizar y formatear código de seguridad de 9 dígitos
  const cleanCode = normalizeTicketCode(ticket.ticketCode);
  const formattedDisplayCode = formatTicketCodeDisplay(ticket.ticketCode);
  const isSecure9 = is9DigitCode(ticket.ticketCode);

  // Determinar densidad efectiva
  const effectiveDensity: TicketDensity = density || (compact ? 'compact' : 'standard');

  // URL del QR oficial de la página institucional para verificar el ticket escaneable desde celulares
  const qrVerificationUrl = getSorteoQrUrl(cleanCode, content.publicDomain);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(cleanCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintSingle = () => {
    if (onPrint) {
      onPrint(ticket);
      return;
    }
    window.print();
  };

  const isWinner = ticket.status === 'winner' || sorteo?.winnerTicketCode === cleanCode || sorteo?.winnerTicketCode === ticket.ticketCode;

  /* ========================================================================= */
  /* 0. DISEÑO ULTRA MINI: MÁXIMO AHORRO TOTAL (18 a 24 BOLETOS POR HOJA)      */
  /* ========================================================================= */
  if (effectiveDensity === 'ultra') {
    return (
      <div 
        ref={ticketRef}
        className={`relative bg-white rounded border ${
          isWinner ? 'border-amber-400 bg-amber-50/20' : 'border-slate-300'
        } text-slate-900 font-sans overflow-hidden flex w-full h-full box-border shadow-none text-[8px] leading-tight select-none`}
      >
        {/* PARTE 1: TALÓN DE DATOS (Ánfora / Organizador) */}
        <div className="w-[38%] min-w-0 p-1 flex flex-col justify-between bg-slate-50/70 border-r border-dashed border-slate-300 text-[6.5px]">
          <div>
            <div className="flex items-center justify-between pb-0.5 border-b border-slate-200">
              <span className="font-black text-[6.5px] uppercase tracking-wider text-slate-800">TALÓN</span>
              <span className="text-[5.5px] text-primario font-bold uppercase">Ánfora</span>
            </div>
            <div className="font-mono font-black text-[7.5px] text-slate-900 mt-0.5 truncate">
              #{cleanCode.slice(-5) || cleanCode}
            </div>
            <div className="mt-0.5 space-y-0.5">
              <div>
                <span className="text-[5px] text-slate-400 block">Nombre:</span>
                <span className="font-bold text-[6.5px] text-slate-900 block truncate" title={ticket.participantName}>
                  {ticket.participantName || '_____________'}
                </span>
              </div>
              <div>
                <span className="text-[5px] text-slate-400 block">Teléf:</span>
                <span className="font-bold text-[6.5px] text-slate-900 block truncate">
                  {ticket.participantPhone || '_____________'}
                </span>
              </div>
            </div>
          </div>
          <div className="text-[5px] text-slate-400 font-medium">Institución</div>
        </div>

        {/* LÍNEA DE CORTE CON TIJERITA */}
        <div className="relative w-2.5 flex items-center justify-center shrink-0 -mx-[1px] z-10">
          <span className="text-[7.5px] text-slate-400 select-none font-sans" title="Recortar y entregar al comprador">
            ✂
          </span>
        </div>

        {/* PARTE 2: BOLETO DEL COMPRADOR (Entregar al Comprador con QR y Código) */}
        <div className="flex-1 min-w-0 p-1 flex flex-col justify-between text-[7.5px] leading-tight bg-white">
          <div>
            <div className="flex items-center gap-1 mb-0.5">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-3.5 h-3.5 object-contain rounded p-0.5 bg-white border border-slate-200 shrink-0"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div className="min-w-0">
                <span className="font-serif font-black text-[8px] text-slate-900 block truncate leading-none">
                  {content.shortName || 'U.E. Virgen del Cisne'}
                </span>
                <span className="text-[6px] text-primario font-bold uppercase tracking-wider block truncate">
                  {sorteo?.title || 'Sorteo Oficial'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[6px] text-slate-600 gap-1 mt-0.5">
              {sorteo?.drawDate && (
                <span className="truncate">Fecha: {sorteo.drawDate}</span>
              )}
              {sorteo?.prizes && sorteo.prizes[0] && (
                <span className="text-amber-900 font-bold bg-amber-100/70 px-0.5 rounded truncate max-w-[65px]">
                  🏆 {sorteo.prizes[0]}
                </span>
              )}
            </div>
          </div>

          {/* Código de 9 Dígitos y QR del Comprador */}
          <div className="flex items-end justify-between gap-1 pt-0.5 border-t border-slate-100 mt-0.5">
            <div className="min-w-0 flex-1">
              <span className="text-[5px] font-bold text-slate-400 uppercase tracking-wider block">
                9 Dígitos
              </span>
              <span className="font-mono font-black text-[8.5px] text-slate-950 bg-slate-100 border border-slate-200 px-1 py-0.2 rounded tracking-wider block truncate">
                {formattedDisplayCode}
              </span>
              <span className="text-[5.5px] text-emerald-700 font-bold block mt-0.5">
                ✓ Comprador
              </span>
            </div>

            <div className="p-0.5 bg-white border border-slate-200 rounded shrink-0">
              <QRCodeSVG
                value={qrVerificationUrl}
                size={30}
                level="M"
                includeMargin={true}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* 1. DISEÑO MICRO: TALONARIO AHORRO (10 a 12 BOLETOS POR HOJA - 2 COLUMNAS) */
  /* ========================================================================= */
  if (effectiveDensity === 'micro') {
    return (
      <div 
        ref={ticketRef}
        className={`relative bg-white rounded-lg border ${
          isWinner ? 'border-amber-400 bg-amber-50/15' : 'border-slate-300'
        } text-slate-900 font-sans overflow-hidden flex w-full h-full box-border shadow-none text-xs leading-tight print-ticket-item print-density-micro select-none`}
      >
        {/* PARTE 1: TALÓN DE DATOS (Ánfora / Organizador) */}
        <div className="w-[35%] min-w-0 p-2 flex flex-col justify-between bg-slate-50/80 border-r border-dashed border-slate-300">
          <div>
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <span className="font-serif font-black text-[9px] uppercase tracking-wider text-slate-800">
                TALÓN DE CONTROL
              </span>
              <span className="text-[7px] text-primario font-bold uppercase">
                Ánfora
              </span>
            </div>

            <div className="mt-1">
              <span className="text-[7px] text-slate-400 uppercase block font-semibold">Boleto Nº</span>
              <span className="font-mono font-black text-[10px] text-slate-900 bg-white border border-slate-200 px-1 py-0.2 rounded block tracking-wide truncate">
                {formattedDisplayCode}
              </span>
            </div>

            <div className="mt-1.5 space-y-1 text-[8px]">
              <div>
                <span className="text-[6.5px] text-slate-500 block">Nombre del Comprador:</span>
                <span className="font-bold text-[8.5px] text-slate-900 block truncate" title={ticket.participantName}>
                  {ticket.participantName || '______________________'}
                </span>
              </div>
              <div>
                <span className="text-[6.5px] text-slate-500 block">Teléfono / Celular:</span>
                <span className="font-bold text-[8.5px] text-slate-900 block truncate">
                  {ticket.participantPhone || '______________________'}
                </span>
              </div>
              <div>
                <span className="text-[6.5px] text-slate-500 block">Cédula:</span>
                <span className="text-[7.5px] text-slate-400 font-mono block">
                  ______________________
                </span>
              </div>
            </div>
          </div>

          <div className="text-[6.5px] text-slate-400 italic pt-1 border-t border-slate-100">
            Queda en poder del organizador
          </div>
        </div>

        {/* LÍNEA DE PERFORACIÓN CON RECORTAR Y TIJERAS */}
        <div className="relative w-3 flex flex-col items-center justify-center shrink-0 -mx-[1px] bg-slate-100/50 z-10 border-l border-r border-dashed border-slate-200">
          <Scissors className="w-2.5 h-2.5 text-slate-400 rotate-90" />
          <span className="text-[6px] text-slate-400 [writing-mode:vertical-lr] font-bold uppercase tracking-wider my-0.5 select-none">
            CORTAR
          </span>
          <Scissors className="w-2.5 h-2.5 text-slate-400 rotate-90" />
        </div>

        {/* PARTE 2: BOLETO DEL COMPRADOR (Entregar al Comprador con QR y Código) */}
        <div className="flex-1 min-w-0 p-2 sm:p-2.5 flex flex-col justify-between bg-white">
          <div>
            {/* Cabecera institucional */}
            <div className="flex items-center gap-1.5 mb-1">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-5 h-5 object-contain rounded p-0.5 bg-white border border-slate-200 shrink-0"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div className="min-w-0 leading-tight">
                <span className="font-serif font-black text-[10px] text-slate-900 block truncate">
                  {content.shortName || 'U.E. Virgen del Cisne'}
                </span>
                <span className="text-[7.5px] text-primario font-bold uppercase tracking-wider block">
                  Boleto Oficial de Sorteo
                </span>
              </div>
            </div>

            <h4 className="font-bold text-[10px] text-slate-900 truncate leading-snug">
              {sorteo?.title || 'Sorteo Institucional'}
            </h4>

            <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[8px] text-slate-600">
              {sorteo?.drawDate && (
                <span className="font-semibold text-slate-700">
                  Fecha: {sorteo.drawDate}
                </span>
              )}
              {sorteo?.prizes && sorteo.prizes[0] && (
                <span className="text-amber-900 font-bold bg-amber-100/70 border border-amber-200 px-1 py-0.2 rounded truncate max-w-[140px]">
                  🏆 {sorteo.prizes[0]}
                </span>
              )}
            </div>
          </div>

          {/* Lado inferior: Código y QR para el comprador */}
          <div className="flex items-end justify-between gap-2 pt-1 border-t border-slate-100 mt-1">
            <div className="min-w-0">
              <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider block">
                Código Oficial 9 Dígitos
              </span>
              <span className="font-mono font-black text-xs text-slate-950 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded tracking-wider block">
                {formattedDisplayCode}
              </span>
              <span className="text-[7px] text-emerald-700 font-bold uppercase block mt-0.5">
                ✓ Boleto del Comprador
              </span>
            </div>

            <div className="shrink-0 flex flex-col items-center">
              <div className="p-0.5 bg-white border border-slate-200 rounded shrink-0">
                <QRCodeSVG
                  value={qrVerificationUrl}
                  size={42}
                  level="M"
                  includeMargin={true}
                />
              </div>
              <span className="text-[5.5px] text-slate-400 mt-0.5 text-center leading-none">
                Escanea para verificar
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* 2. DISEÑO COMPACTO: TALONARIO ECONÓMICO (6 a 8 BOLETOS POR HOJA - 66mm)   */
  /* ========================================================================= */
  if (effectiveDensity === 'compact') {
    return (
      <div 
        ref={ticketRef}
        className={`relative bg-white rounded-xl border ${
          isWinner ? 'border-amber-400 bg-amber-50/20' : 'border-slate-300'
        } text-slate-900 font-sans overflow-hidden flex w-full h-full box-border shadow-none print-ticket-item print-density-compact select-none`}
      >
        {/* PARTE 1: TALÓN DE DATOS (Ánfora / Organizador) */}
        <div className="w-[36%] min-w-0 p-3 flex flex-col justify-between bg-slate-50/90 border-r border-dashed border-slate-300 text-xs">
          <div>
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <span className="font-serif font-black text-xs uppercase tracking-wider text-slate-900">
                TALÓN DE CONTROL
              </span>
              <span className="text-[8px] bg-primario/10 text-primario font-bold px-1.5 py-0.5 rounded uppercase">
                Ánfora
              </span>
            </div>

            <div className="mt-2">
              <span className="text-[8px] font-bold text-slate-400 uppercase block tracking-wider">
                Boleto Oficial Nº
              </span>
              <span className="font-mono font-black text-xs text-slate-950 bg-white border border-slate-200 px-2 py-0.5 rounded-md block tracking-wider truncate">
                {formattedDisplayCode}
              </span>
            </div>

            <div className="mt-2.5 space-y-1.5 text-[9px]">
              <div>
                <span className="text-[7.5px] text-slate-500 font-semibold block">Nombre:</span>
                <span className="font-bold text-slate-900 block truncate" title={ticket.participantName}>
                  {ticket.participantName || '___________________________'}
                </span>
              </div>
              <div>
                <span className="text-[7.5px] text-slate-500 font-semibold block">Teléfono / WhatsApp:</span>
                <span className="font-bold text-slate-900 block truncate">
                  {ticket.participantPhone || '___________________________'}
                </span>
              </div>
              <div>
                <span className="text-[7.5px] text-slate-500 font-semibold block">Cédula:</span>
                <span className="text-slate-400 font-mono block">
                  ___________________________
                </span>
              </div>
              <div>
                <span className="text-[7.5px] text-slate-500 font-semibold block">Firma:</span>
                <span className="text-slate-400 font-mono block">
                  ___________________________
                </span>
              </div>
            </div>
          </div>

          <div className="text-[7.5px] text-slate-400 pt-1.5 border-t border-slate-200">
            Conservar en ánfora institucional
          </div>
        </div>

        {/* LÍNEA DE PERFORACIÓN CON RECORTAR Y TIJERAS */}
        <div className="relative w-4 flex flex-col items-center justify-center shrink-0 -mx-[1px] bg-slate-100/60 z-10 border-l border-r border-dashed border-slate-300">
          <Scissors className="w-3 h-3 text-slate-500 rotate-90" />
          <span className="text-[7px] text-slate-500 [writing-mode:vertical-lr] font-bold uppercase tracking-widest my-1 select-none">
            RECORTAR AQUÍ
          </span>
          <Scissors className="w-3 h-3 text-slate-500 rotate-90" />
        </div>

        {/* PARTE 2: BOLETO DEL COMPRADOR (Entregar al Comprador con QR y Código) */}
        <div className="flex-1 min-w-0 p-3 sm:p-3.5 flex flex-col justify-between bg-white">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-7 h-7 object-contain rounded-md p-0.5 bg-white border border-slate-200 shrink-0"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div className="min-w-0">
                <h4 className="font-serif font-black text-xs sm:text-sm text-slate-900 leading-tight truncate">
                  {content.institutionName || 'Unidad Educativa Particular Virgen del Cisne'}
                </h4>
                <span className="text-[8.5px] text-primario font-bold uppercase tracking-wider block">
                  Boleto Oficial de Sorteo
                </span>
              </div>
            </div>

            <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug truncate">
              {sorteo?.title || 'Sorteo Institucional'}
            </h3>

            {sorteo?.prizes && sorteo.prizes.length > 0 && (
              <p className="text-[9.5px] text-slate-600 mt-1 truncate">
                <strong className="text-slate-800">Premios:</strong> {sorteo.prizes.slice(0, 3).join(' • ')}
              </p>
            )}

            <div className="flex items-center gap-3 mt-1 text-[9.5px] text-slate-500">
              <span>Fecha del Sorteo: <strong className="text-slate-800">{sorteo?.drawDate || 'Por anunciar'}</strong></span>
              <span className="text-emerald-700 font-bold uppercase flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Válido Oficial
              </span>
            </div>
          </div>

          {/* Lado derecho: Código y QR */}
          <div className="flex items-end justify-between gap-3 pt-2 border-t border-slate-100 mt-2">
            <div>
              <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">
                Código de 9 Dígitos (Comprador)
              </span>
              <span className="font-mono font-black text-xs sm:text-sm text-slate-950 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg tracking-wider block">
                {formattedDisplayCode}
              </span>
              <span className="text-[8px] text-slate-500 block mt-0.5">
                Conserve este boleto para reclamar el premio
              </span>
            </div>

            <div className="shrink-0 flex flex-col items-center">
              <div className="p-1 bg-white border border-slate-200 rounded-lg shrink-0">
                <QRCodeSVG
                  value={qrVerificationUrl}
                  size={52}
                  level="M"
                  includeMargin={true}
                />
              </div>
              <span className="text-[7px] text-slate-400 mt-0.5">
                Escanea para verificar
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* 3. DISEÑO ESTÁNDAR / GRANDE: TALONARIO COMPLETO CON MUESCAS DE CORTE      */
  /* ========================================================================= */
  return (
    <div 
      ref={ticketRef}
      className={`relative bg-white rounded-2xl border ${
        isWinner 
          ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-xl' 
          : 'border-slate-200/90 shadow-md hover:shadow-lg'
      } transition-all duration-300 overflow-hidden flex flex-col md:flex-row text-slate-800 font-sans print-ticket-item print-density-standard print:shadow-none print:border-slate-400`}
    >
      {/* CINTA DE GANADOR SI APLICA */}
      {isWinner && (
        <div className="absolute top-0 right-0 z-20 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs px-5 py-1 rounded-bl-xl shadow-md uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
          <Award className="w-4 h-4 text-slate-950" />
          {t('sorteos.statusWinner')}
        </div>
      )}

      {/* PARTE 1: TALÓN DE DATOS (Lado Izquierdo - Matriz para el ánfora) */}
      <div className="w-full md:w-64 p-4 sm:p-5 bg-slate-50/95 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200 shrink-0">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest block">
                TALÓN DE CONTROL
              </span>
              <span className="text-[9px] text-primario font-bold">
                Ánfora Oficial Institucional
              </span>
            </div>
            <span className="text-[9px] font-bold bg-primario/10 text-primario px-2 py-0.5 rounded-full border border-primario/20">
              Matriz
            </span>
          </div>

          <div className="mt-3">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              Boleto Oficial Nº
            </span>
            <span className="font-mono font-black text-sm text-slate-950 bg-white border border-slate-300 px-2 py-1 rounded-lg block tracking-wider mt-0.5">
              {formattedDisplayCode}
            </span>
          </div>

          <div className="mt-3.5 space-y-2 text-xs">
            <div>
              <span className="text-[9px] font-bold text-slate-500 block uppercase">Nombre del Participante:</span>
              <span className="font-bold text-slate-900 block truncate" title={ticket.participantName}>
                {ticket.participantName || '_____________________________'}
              </span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-500 block uppercase">Teléfono / WhatsApp:</span>
              <span className="font-bold text-slate-900 block truncate">
                {ticket.participantPhone || '_____________________________'}
              </span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-500 block uppercase">Cédula de Identidad:</span>
              <span className="text-slate-400 font-mono block">
                _____________________________
              </span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-500 block uppercase">Firma del Comprador:</span>
              <span className="text-slate-400 font-mono block">
                _____________________________
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-200 text-[9px] text-slate-400">
          Este talón debe depositarse en el ánfora antes del sorteo.
        </div>
      </div>

      {/* LÍNEA DE PERFORACIÓN CON MUESCAS DE CORTE Y TIJERAS */}
      <div className="relative flex md:flex-col items-center justify-center bg-slate-100/90 px-3 py-2 md:py-4 border-t md:border-t-0 md:border-l border-dashed border-slate-300 shrink-0">
        <div className="hidden md:block absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-fondo rounded-full border border-slate-300 z-10" />
        <div className="hidden md:block absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-fondo rounded-full border border-slate-300 z-10" />
        
        <Scissors className="w-4 h-4 text-slate-500 md:rotate-90" />
        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest md:[writing-mode:vertical-lr] my-1 select-none">
          RECORTAR AQUÍ
        </span>
        <Scissors className="w-4 h-4 text-slate-500 md:rotate-90" />
      </div>

      {/* PARTE 2: BOLETO DEL COMPRADOR (Lado Derecho - Se entrega al comprador con QR y Código) */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between relative bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30">
        <div>
          {/* Cabecera Institucional: Logo + Identidad */}
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="Logo Institucional" 
                className="w-11 h-11 object-contain rounded-lg p-1 bg-white border border-slate-100 shadow-2xs shrink-0"
                onError={(e) => { 
                  e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%231e3a8a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>'; 
                }} 
              />
              <div>
                <span className="text-[10px] font-bold text-primario tracking-widest uppercase block">
                  Boleto Oficial de Sorteo Institucional
                </span>
                <h4 className="font-serif font-black text-base text-slate-900 leading-tight">
                  {content.institutionName || 'Unidad Educativa Particular Virgen del Cisne'}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  {content.shortName || 'Virgen del Cisne'}
                </p>
              </div>
            </div>

            {/* Código del Ticket en badge */}
            <div className="text-right shrink-0">
              <div className="flex items-center justify-end gap-1.5 mb-1">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                  Código de 9 Dígitos
                </span>
                {isSecure9 && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                    Cripto
                  </span>
                )}
              </div>
              <div className="inline-flex items-center gap-1.5 bg-primario/10 text-primario px-3 py-1.5 rounded-xl border border-primario/20 shadow-2xs">
                <span className="font-mono font-black text-base sm:text-lg tracking-wider">
                  {formattedDisplayCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  title="Copiar código de boleto"
                  className="text-primario hover:text-primario/80 transition-colors p-0.5 print:hidden cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Nombre del Sorteo & Premios */}
          <div className="mb-3">
            <h3 className="font-bold text-base text-slate-900 mb-1 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{sorteo?.title || t('sorteos.title')}</span>
            </h3>

            {sorteo?.prizes && sorteo.prizes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {sorteo.prizes.map((prize, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 px-2.5 py-0.5 rounded-md"
                  >
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    {prize}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sección de QR & Garantía del Comprador */}
        <div className="bg-white/95 p-3 rounded-xl border border-slate-200 mt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-slate-700">
              <Calendar className="w-4 h-4 text-primario shrink-0" />
              <span>
                Fecha del Sorteo: <strong>{sorteo?.drawDate ? sorteo.drawDate : 'Por anunciar oficialmente'}</strong>
              </span>
            </div>
            <p className="text-[10px] text-slate-500 italic mt-1">
              Conserve este boleto para reclamar el premio en la secretaría de la institución.
            </p>
          </div>

          {/* Código QR oficial escaneable para el comprador */}
          <div className="flex items-center gap-2.5 self-center sm:self-auto shrink-0 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <div className="p-1 bg-white rounded-lg shadow-2xs border border-slate-200">
              <QRCodeSVG
                value={qrVerificationUrl}
                size={58}
                level="M"
                includeMargin={true}
              />
            </div>
            <div className="text-left">
              <span className="text-[9px] font-bold text-slate-600 uppercase block">
                QR Oficial
              </span>
              <span className="text-[8px] text-slate-400 block leading-tight">
                Escanea con celular para verificar
              </span>
              <span className="text-[8px] text-emerald-700 font-bold block mt-0.5">
                ✓ Entregar al Comprador
              </span>
            </div>
          </div>
        </div>

        {/* Barra inferior de estado y acciones */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
              isWinner 
                ? 'bg-amber-100 text-amber-800' 
                : ticket.status === 'cancelled'
                ? 'bg-red-100 text-red-700'
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              <CheckCircle2 className="w-3 h-3" />
              {isWinner ? t('sorteos.statusWinner') : ticket.status === 'cancelled' ? 'Anulado' : 'Boleto Oficial Válido'}
            </span>
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              Registro Oficial Institucional
            </span>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={handlePrintSingle}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-primario hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('sorteos.printTickets')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
