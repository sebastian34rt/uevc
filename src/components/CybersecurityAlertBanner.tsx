import React from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  RefreshCw, 
  X, 
  Radio, 
  ExternalLink,
  Unlock,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCybersecurity } from '../context/CybersecurityContext';
import { useAuth } from '../context/AuthContext';
import { ATTACK_TYPE_LABELS } from '../types/cybersecurity';

interface CybersecurityAlertBannerProps {
  onOpenSOC?: () => void;
}

export default function CybersecurityAlertBanner({ onOpenSOC }: CybersecurityAlertBannerProps) {
  const { lockdownState, activeAlert, dismissAlert, restoreNormalService } = useCybersecurity();
  const { isSuperAdmin } = useAuth();

  if (!lockdownState.isActive && !activeAlert) {
    return null;
  }

  const attackInfo = activeAlert 
    ? ATTACK_TYPE_LABELS[activeAlert.type] 
    : ATTACK_TYPE_LABELS[lockdownState.attackType];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        className={`mb-6 p-4 sm:p-5 rounded-3xl border text-xs shadow-md transition-all ${
          lockdownState.isActive 
            ? 'bg-gradient-to-r from-red-950 via-red-900 to-red-950 border-red-500 text-white' 
            : 'bg-gradient-to-r from-amber-950 via-amber-900 to-neutral-900 border-amber-500 text-white'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              lockdownState.isActive ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-500 text-slate-950'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap font-bold">
                <span className="text-sm tracking-tight text-white font-serif">
                  {lockdownState.isActive ? '¡ALERTA CRÍTICA DE CIBERSEGURIDAD!' : 'Notificación de Seguridad Mitigada'}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  lockdownState.isActive ? 'bg-red-500 text-white' : 'bg-amber-400 text-slate-950'
                }`}>
                  {lockdownState.isActive ? 'Servidores en Aislamiento' : 'Amenaza Contenida'}
                </span>
              </div>

              <p className="text-xs text-neutral-200 leading-relaxed font-sans">
                {lockdownState.isActive 
                  ? `Se activó el protocolo de defensa. Motivo: ${lockdownState.reason || attackInfo?.label || 'Ataque informático detectado'}. El sitio público está cerrado preventivamente.`
                  : activeAlert?.description || 'Se detectó y contuvo un patrón anómalo de tráfico en el firewall perimetral.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0">
            {onOpenSOC && (
              <button
                type="button"
                onClick={onOpenSOC}
                className="bg-white/15 hover:bg-white/25 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-colors border border-white/20 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Ver Centro SOC</span>
              </button>
            )}

            {lockdownState.isActive && isSuperAdmin && (
              <button
                type="button"
                onClick={() => restoreNormalService('Super Administrador (Restauración Rápida desde Banner)')}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Restaurar Servicio</span>
              </button>
            )}

            {!lockdownState.isActive && (
              <button
                type="button"
                onClick={dismissAlert}
                className="text-white/60 hover:text-white p-1 text-xs cursor-pointer ml-1"
                title="Descartar notificación"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
