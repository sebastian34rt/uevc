import React, { useState, useEffect, useRef } from 'react';
import { Sorteo, SorteoTicket } from '../types/sorteo';
import { SorteoTicketCard, TicketDensity } from './SorteoTicketCard';
import { 
  Printer, 
  X, 
  Scissors, 
  ShieldCheck, 
  SlidersHorizontal,
  FileText,
  Sparkles,
  Layers,
  Download
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSiteContent } from '../context/SiteContentContext';
import { getPublicSiteUrl } from '../utils/domainConfig';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface SorteoPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: SorteoTicket[];
  sorteos: Sorteo[];
  title?: string;
  defaultLayout?: TicketDensity;
}

export const SorteoPrintModal: React.FC<SorteoPrintModalProps> = ({
  isOpen,
  onClose,
  tickets,
  sorteos,
  title = 'Planilla Oficial de Impresión de Boletos',
  defaultLayout = 'ultra'
}) => {
  const { t } = useTranslation();
  const { content } = useSiteContent();

  // Densidad predeterminada en 'ultra' para máximo ahorro de papel
  const [density, setDensity] = useState<TicketDensity>(defaultLayout);
  const [columns, setColumns] = useState<'auto' | '2' | '3' | '4'>('auto');
  const [inkSaver, setInkSaver] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = () => {
    // Usamos el diálogo de impresión nativo del navegador, el cual soporta oklch()
    // y permite guardar directamente como PDF vectorial con máxima nitidez.
    window.print();
  };

  // Mapeo rápido de sorteos por ID
  const sorteoMap = React.useMemo(() => {
    const map: Record<string, Sorteo> = {};
    sorteos.forEach(s => {
      map[s.id] = s;
    });
    return map;
  }, [sorteos]);

  // Cálculo de hojas estimadas según la densidad elegida
  const capacityPerSheet: Record<TicketDensity, number> = {
    ultra: columns === '4' ? 24 : 18,
    micro: 12,
    compact: 8,
    standard: 4,
    large: 2
  };

  const estimatedSheets = Math.ceil(tickets.length / capacityPerSheet[density]);
  const maxSheets = Math.ceil(tickets.length / capacityPerSheet['large']);
  const savedSheets = Math.max(0, maxSheets - estimatedSheets);

  // Manejo de teclado (Escape para cerrar, Ctrl+P para imprimir)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || tickets.length === 0) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:static print:bg-white print:p-0 print:overflow-visible print:backdrop-blur-none"
      id="sorteo-print-modal-container"
    >
      <div 
        className={`bg-white rounded-3xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden print:max-h-none print:max-w-none print:border-none print:shadow-none print:rounded-none print:w-full ${
          inkSaver ? 'ink-saver-mode' : ''
        }`}
      >
        {/* CABECERA DEL MODAL (OCULTA AL IMPRIMIR) */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-primario/10 text-primario rounded-2xl flex items-center justify-center shrink-0 shadow-2xs">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-serif font-black text-lg sm:text-xl text-slate-900 leading-tight">
                  {title}
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  <ShieldCheck className="w-3 h-3 text-amber-700" />
                  {tickets.length} {tickets.length === 1 ? 'boleto' : 'boletos'}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <FileText className="w-3 h-3 text-emerald-700" />
                  ≈ {estimatedSheets} {estimatedSheets === 1 ? 'hoja' : 'hojas'}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200" title="Dominio web al que ingresan las personas al escanear el código QR">
                  📱 QR destino: {getPublicSiteUrl(content.publicDomain)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Boletos oficiales con logo institucional, código de seguridad de 9 dígitos y código QR de validación. Formato compacto de máximo ahorro de papel para no sacar muchas hojas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'Generando PDF...' : 'Descargar PDF'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primario hover:bg-primario/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Ahora</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Cerrar vista de impresión"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BARRA DE CONTROL DE DENSIDAD Y AHORRO DE PAPEL (OCULTA AL IMPRIMIR) */}
        <div className="px-4 sm:px-6 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          {/* Selector de Tamaño de Boleto para caber más por hoja */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              Tamaño & Ahorro de Hojas:
            </span>
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 flex-wrap gap-0.5">
              <button
                type="button"
                onClick={() => setDensity('ultra')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  density === 'ultra'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="18 a 24 boletos por hoja en 3 o 4 columnas: ultra compacto para no sacar muchas hojas"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ultra Mini (18-24 por hoja)</span>
              </button>

              <button
                type="button"
                onClick={() => setDensity('micro')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  density === 'micro'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="10 a 12 boletos por hoja en 2 columnas: formato micro"
              >
                <span>Micro (10-12 por hoja)</span>
              </button>

              <button
                type="button"
                onClick={() => setDensity('compact')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  density === 'compact'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="6 a 8 boletos por hoja en 2 columnas"
              >
                Económico (6-8)
              </button>

              <button
                type="button"
                onClick={() => setDensity('standard')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  density === 'standard'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="4 boletos por hoja"
              >
                Estándar (4)
              </button>

              <button
                type="button"
                onClick={() => setDensity('large')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  density === 'large'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="1 a 2 boletos grandes con talón perforado"
              >
                Grande (1-2)
              </button>
            </div>
          </div>

          {/* Opciones Adicionales de Columnas y Tinta */}
          <div className="flex items-center gap-3 flex-wrap">
            {density === 'ultra' && (
              <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                <span className="text-[11px] font-bold text-slate-600">Columnas:</span>
                <button
                  type="button"
                  onClick={() => setColumns('auto')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                    columns === 'auto' ? 'bg-primario text-white' : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  3 Col
                </button>
                <button
                  type="button"
                  onClick={() => setColumns('4')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                    columns === '4' ? 'bg-primario text-white' : 'text-slate-600 hover:bg-slate-200'
                  }`}
                  title="4 columnas para que quepan hasta 24 boletos por hoja"
                >
                  4 Col (Máx)
                </button>
              </div>
            )}

            <label className="inline-flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={inkSaver}
                onChange={(e) => setInkSaver(e.target.checked)}
                className="w-4 h-4 rounded text-primario focus:ring-primario/20 border-slate-300"
              />
              <span>Ahorro de Tinta</span>
            </label>
          </div>
        </div>

        {/* NOTA DE RESUMEN DE HOJAS ESTIMADAS (OCULTA AL IMPRIMIR) */}
        <div className="px-4 sm:px-6 py-2.5 bg-emerald-50/90 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-950 print:hidden">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong>Ahorro activo de papel:</strong> Con formato <strong>{density === 'ultra' ? 'Ultra Mini' : density.toUpperCase()}</strong> entran aprox. <strong>{capacityPerSheet[density]} boletos por hoja</strong>. Solo gastarás <strong>{estimatedSheets} {estimatedSheets === 1 ? 'hoja de papel' : 'hojas de papel'}</strong> para imprimir los {tickets.length} boletos sin sacar muchas hojas.
            </span>
          </div>
          {savedSheets > 0 && (
            <span className="hidden sm:inline font-bold bg-emerald-200 text-emerald-950 px-2.5 py-0.5 rounded-full text-[11px] border border-emerald-300">
              Ahorras {savedSheets} {savedSheets === 1 ? 'hoja' : 'hojas'}
            </span>
          )}
        </div>

        {/* ÁREA DE VISTA PREVIA Y CONTENEDOR IMPRIMIBLE */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-slate-100/70 print:p-0 print:bg-white print:overflow-visible">
          {/* CONTENEDOR DE IMPRESIÓN */}
          <div 
            ref={printableRef}
            className={`printable-tickets-wrapper mx-auto max-w-5xl print:w-full print:max-w-none ${
              density === 'ultra'
                ? columns === '4'
                  ? 'grid grid-cols-2 sm:grid-cols-4 gap-1.5 print-grid-ultra-4col'
                  : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 print-grid-ultra'
                : density === 'micro' 
                ? 'grid grid-cols-1 sm:grid-cols-2 gap-2.5 print-grid-micro' 
                : density === 'compact'
                ? 'grid grid-cols-1 sm:grid-cols-2 gap-3 print-grid-compact'
                : density === 'standard'
                ? 'grid grid-cols-1 sm:grid-cols-2 gap-4 print-grid-standard'
                : 'space-y-4 print-grid-large'
            }`}
          >
            {tickets.map((tkt, idx) => {
              const raffle = sorteoMap[tkt.sorteoId];
              return (
                <div 
                  key={tkt.id || idx}
                  className="print-ticket-item relative"
                >
                  <SorteoTicketCard
                    ticket={tkt}
                    sorteo={raffle}
                    density={density}
                    onPrint={() => handlePrint()}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* PIE DEL MODAL (OCULTO AL IMPRIMIR) */}
        <div className="p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              {tickets.length} {tickets.length === 1 ? 'boleto listo' : 'boletos listos'} en {estimatedSheets} {estimatedSheets === 1 ? 'hoja' : 'hojas'} ({density === 'micro' ? 'Máximo Ahorro' : density === 'compact' ? 'Económico' : density === 'standard' ? 'Estándar' : 'Grande'})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2 bg-primario hover:bg-primario/90 text-white font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir {tickets.length} Boletos ({estimatedSheets} {estimatedSheets === 1 ? 'Hoja' : 'Hojas'})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
