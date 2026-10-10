import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, X, Award, RotateCcw, CheckCircle2, Phone, Mail } from 'lucide-react';
import { Sorteo, SorteoTicket } from '../types/sorteo';
import { QRCodeSVG } from 'qrcode.react';
import { formatTicketCodeDisplay } from '../utils/sorteoSecurity';

interface SorteoRouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  sorteo: Sorteo;
  tickets: SorteoTicket[];
  onWinnerSelected: (ticketCode: string, participantName: string, prize: string, phone?: string, email?: string) => Promise<void>;
}

export const SorteoRouletteModal: React.FC<SorteoRouletteModalProps> = ({
  isOpen,
  onClose,
  sorteo,
  tickets,
  onWinnerSelected
}) => {
  const [spinning, setSpinning] = useState(false);
  const [currentDisplayCode, setCurrentDisplayCode] = useState<string>('---');
  const [currentDisplayName, setCurrentDisplayName] = useState<string>('Esperando inicio...');
  const [winner, setWinner] = useState<SorteoTicket | null>(null);
  const [selectedPrize, setSelectedPrize] = useState<string>(
    sorteo.prizes?.[0] || 'Premio Principal'
  );
  const [savingWinner, setSavingWinner] = useState(false);

  // Filtrar boletos válidos para el sorteo
  const eligibleTickets = tickets.filter(
    (t) => t.sorteoId === sorteo.id && t.status !== 'cancelled'
  );

  useEffect(() => {
    if (isOpen) {
      setWinner(null);
      setCurrentDisplayCode(eligibleTickets.length > 0 ? eligibleTickets[0].ticketCode : 'SIN BOLETOS');
      setCurrentDisplayName(
        eligibleTickets.length > 0 
          ? (eligibleTickets[0].participantName || 'Al Portador') 
          : 'No hay boletos registrados'
      );
    }
  }, [isOpen, eligibleTickets.length]);

  if (!isOpen) return null;

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 250);
    } catch (e) {
      console.warn('Confetti error:', e);
    }
  };

  const startSpin = () => {
    if (eligibleTickets.length === 0 || spinning) return;

    setSpinning(true);
    setWinner(null);

    const totalDuration = 4500; // 4.5 segundos
    const startTime = Date.now();
    let speed = 60; // ms por tick

    const intervalId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / totalDuration;

      // Seleccionar un boleto al azar para el ciclo
      const randomIndex = Math.floor(Math.random() * eligibleTickets.length);
      const randomTicket = eligibleTickets[randomIndex];
      setCurrentDisplayCode(randomTicket.ticketCode);
      setCurrentDisplayName(randomTicket.participantName?.trim() || 'Al Portador');

      // Si terminó el tiempo
      if (elapsed >= totalDuration) {
        clearInterval(intervalId);
        // Ganador definitivo al azar
        const winningIndex = Math.floor(Math.random() * eligibleTickets.length);
        const finalWinner = eligibleTickets[winningIndex];
        
        setCurrentDisplayCode(finalWinner.ticketCode);
        setCurrentDisplayName(finalWinner.participantName?.trim() || 'Al Portador');
        setWinner(finalWinner);
        setSpinning(false);
        triggerConfetti();

        // Guardar ganador en la base de datos
        setSavingWinner(true);
        onWinnerSelected(
          finalWinner.ticketCode,
          finalWinner.participantName?.trim() || 'Al Portador',
          selectedPrize,
          finalWinner.participantPhone,
          finalWinner.participantEmail
        ).finally(() => {
          setSavingWinner(false);
        });
      }
    }, speed);
  };

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-xl bg-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl overflow-hidden"
      >
        {/* Glow de fondo */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          disabled={spinning}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-30 cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Cabecera */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Trophy className="w-3.5 h-3.5" />
            Ruleta de Sorteo Institucional
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-white">
            {sorteo.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Total de boletos en juego:{' '}
            <span className="font-bold text-amber-400">{eligibleTickets.length}</span>
          </p>
        </div>

        {/* Selector de premio a sortear si hay varios */}
        {sorteo.prizes && sorteo.prizes.length > 1 && (
          <div className="mb-6 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Premio en juego:
            </label>
            <select
              value={selectedPrize}
              disabled={spinning}
              onChange={(e) => setSelectedPrize(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
            >
              {sorteo.prizes.map((p, i) => (
                <option key={i} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Display Central de la Ruleta */}
        <div className="my-6 relative bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-amber-400/40 rounded-3xl p-6 sm:p-8 text-center shadow-inner">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-widest text-amber-400/70">
            <Sparkles className="w-3 h-3" />
            {spinning ? 'SORTEANDO EN VIVO...' : winner ? '¡GANADOR OFICIAL!' : 'LISTO PARA GIRAR'}
          </div>

          <div className="mt-4">
            <span className="text-xs text-slate-400 uppercase tracking-widest block font-medium">
              Código de Boleto
            </span>
            <div className={`font-mono font-black text-3xl sm:text-5xl my-2 tracking-wider ${
              winner 
                ? 'text-amber-400 animate-bounce' 
                : spinning 
                ? 'text-yellow-200' 
                : 'text-white'
            }`}>
              {formatTicketCodeDisplay(currentDisplayCode)}
            </div>

            <div className="mt-2 text-slate-300 font-bold text-lg sm:text-xl truncate max-w-sm mx-auto">
              {currentDisplayName}
            </div>
          </div>

          {/* Si hay ganador, mostrar tarjeta de felicitaciones con datos de contacto */}
          <AnimatePresence>
            {winner && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 pt-5 border-t border-amber-400/30 flex flex-col gap-3 bg-amber-500/10 p-4 sm:p-5 rounded-2xl"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="text-left flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
                      <Award className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-amber-400 text-xs font-black uppercase tracking-wider block">
                        ¡Ganador Proclamado!
                      </span>
                      <h4 className="font-bold text-lg text-white">
                        {winner.participantName?.trim() || 'Boleto al Portador'}
                      </h4>
                      <span className="text-xs text-amber-200/90 font-semibold block">
                        Premio: <strong>{selectedPrize}</strong> • Boleto #{formatTicketCodeDisplay(winner.ticketCode)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-1.5 rounded-lg shrink-0 self-end sm:self-auto">
                    <QRCodeSVG
                      value={`${siteUrl}/sorteos?ticket=${encodeURIComponent(winner.ticketCode)}`}
                      size={52}
                    />
                  </div>
                </div>

                {/* Datos de contacto del participante ganador para llamarlo o notificarlo al instante */}
                {(winner.participantPhone || winner.participantEmail) && (
                  <div className="pt-3 border-t border-amber-400/20 flex flex-wrap items-center gap-2.5 text-xs">
                    <span className="text-[11px] text-amber-300 font-bold uppercase tracking-wider">
                      Contacto:
                    </span>
                    {winner.participantPhone && (
                      <a
                        href={`tel:${winner.participantPhone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 transition-colors font-bold"
                        title="Llamar al ganador"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Llamar: {winner.participantPhone}</span>
                      </a>
                    )}
                    {winner.participantEmail && (
                      <a
                        href={`mailto:${winner.participantEmail}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-300 hover:bg-blue-500/30 transition-colors font-medium"
                        title="Enviar correo oficial al ganador"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[180px]">{winner.participantEmail}</span>
                      </a>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={startSpin}
            disabled={spinning || eligibleTickets.length === 0}
            className="flex-1 py-3.5 px-6 rounded-2xl font-black text-base uppercase tracking-wider bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {spinning ? (
              <>
                <RotateCcw className="w-5 h-5 animate-spin" />
                Sorteando...
              </>
            ) : winner ? (
              <>
                <RotateCcw className="w-5 h-5" />
                Volver a Sortear
              </>
            ) : (
              <>
                <Trophy className="w-5 h-5" />
                ¡Comenzar Sorteo!
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={spinning}
            className="py-3.5 px-6 rounded-2xl font-bold text-sm bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
          >
            Cerrar
          </button>
        </div>

        {eligibleTickets.length === 0 && (
          <p className="text-center text-xs text-rose-400 mt-4">
            No hay boletos activos registrados en este sorteo. Registra boletos para poder iniciar.
          </p>
        )}
      </motion.div>
    </div>
  );
};
