import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  Radio, 
  Terminal, 
  RefreshCw, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle,
  Server,
  ZapOff,
  Unlock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCybersecurity } from '../context/CybersecurityContext';
import { useAuth } from '../context/AuthContext';
import { ATTACK_TYPE_LABELS } from '../types/cybersecurity';

export default function EmergencyBlackoutScreen() {
  const { lockdownState, restoreNormalService } = useCybersecurity();
  const { isSuperAdmin, loginWithMaster } = useAuth();
  const [showAdminUnlock, setShowAdminUnlock] = useState(false);
  const [masterUser, setMasterUser] = useState('');
  const [masterPass, setMasterPass] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  const attackInfo = ATTACK_TYPE_LABELS[lockdownState.attackType] || {
    label: 'Ataque Informático Detectado',
    description: lockdownState.reason
  };

  const handleAdminUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError('');

    if (isSuperAdmin) {
      setIsRestoring(true);
      await restoreNormalService('Super Administrador (Desbloqueo Directo)');
      setIsRestoring(false);
      return;
    }

    const success = loginWithMaster(masterUser, masterPass);
    if (success) {
      setIsRestoring(true);
      await restoreNormalService(`Super Administrador (${masterUser})`);
      setIsRestoring(false);
    } else {
      setUnlockError('Credenciales maestras inválidas para el desbloqueo de emergencia.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-mono select-none">
      {/* Fondo de Matriz y Luces de Alerta */}
      <div className="absolute inset-0 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-2xl w-full bg-neutral-900/95 border border-red-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md relative z-10 space-y-6"
      >
        {/* Cabecera de Alerta */}
        <div className="flex items-center justify-between border-b border-red-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500 animate-pulse">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block">
                Protocolo de Ciberdefensa Perimetral
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Servidores en Modo Aislamiento
              </h1>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-neutral-400 block uppercase font-bold">Estado</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950 border border-red-800 text-red-400 text-xs font-bold">
              <ZapOff className="w-3.5 h-3.5" /> Servidores Apagados
            </span>
          </div>
        </div>

        {/* Notificación Central de Protección */}
        <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-5 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <div className="font-bold text-red-200 text-sm">
                Ataque Mitigado: {attackInfo.label}
              </div>
              <p className="text-neutral-300 leading-relaxed font-sans text-xs">
                {lockdownState.reason || 'Se detectó una actividad maliciosa anómala contra la infraestructura. Para proteger la base de datos de la Unidad Educativa Virgen del Cisne y los registros de los estudiantes, el sitio web ha entrado en aislamiento de emergencia.'}
              </p>
            </div>
          </div>

          {lockdownState.lockdownCode && (
            <div className="pt-2 border-t border-red-500/20 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
              <span>Código de Incidente: <strong className="text-red-300">{lockdownState.lockdownCode}</strong></span>
              <span>Nivel de Amenaza: <strong className="text-red-400 uppercase">{lockdownState.threatLevel}</strong></span>
            </div>
          )}
        </div>

        {/* Consola de Estado Perimetral */}
        <div className="bg-black/70 border border-neutral-800 rounded-2xl p-4 text-xs font-mono space-y-2 text-neutral-300">
          <div className="flex items-center justify-between text-neutral-500 pb-2 border-b border-neutral-800 text-[10px]">
            <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-red-500" /> Monitoreo de Mitigación WAF</span>
            <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Datos Protegidos</span>
          </div>
          <div className="space-y-1 text-[11px]">
            <p className="text-red-400">&gt; [FIREWALL] Bloqueo masivo de paquetes no autorizados: <span className="text-white">ACTIVO</span></p>
            <p className="text-amber-400">&gt; [DATABASE] Desconexión de endpoints públicos: <span className="text-white">COMPLETADA</span></p>
            <p className="text-emerald-400">&gt; [INTEGRIDAD] Base de datos institucional: <span className="text-white">SIN VULNERAR (100% SEGURA)</span></p>
          </div>
        </div>

        {/* Acciones y Desbloqueo del Super Administrador */}
        <div className="space-y-4 pt-2">
          {isSuperAdmin ? (
            <div className="bg-purple-950/40 border border-purple-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <Unlock className="w-4 h-4 text-detalle" /> Sesión de Super Administrador Activa
                </span>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Puedes restaurar los servidores y normalizar el sitio web en cualquier momento.
                </p>
              </div>

              <button
                type="button"
                onClick={() => restoreNormalService('Super Administrador (Restauración Manual)')}
                disabled={isRestoring}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isRestoring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Restaurar Servicio a la Normalidad</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowAdminUnlock(!showAdminUnlock)}
                  className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-red-400" />
                  <span>¿Eres el Super Administrador? Acceder al Desbloqueo</span>
                </button>

                <span className="text-[11px] text-neutral-500">
                  La página volverá automáticamente una vez mitigada la amenaza.
                </span>
              </div>

              <AnimatePresence>
                {showAdminUnlock && (
                  <motion.form 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAdminUnlock}
                    className="bg-neutral-900 border border-neutral-700 p-4 rounded-2xl space-y-3 text-xs"
                  >
                    <div className="font-bold text-neutral-200 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-detalle" />
                      <span>Autenticación de Super Administrador para Restauración</span>
                    </div>

                    {unlockError && (
                      <p className="text-red-400 text-xs font-bold">{unlockError}</p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Correo institucional / Usuario autorizado"
                        value={masterUser}
                        onChange={(e) => setMasterUser(e.target.value)}
                        className="bg-neutral-950 border border-neutral-700 px-3 py-2 rounded-xl text-white focus:outline-none focus:border-red-500 text-xs font-mono"
                      />
                      <input
                        type="password"
                        placeholder="Contraseña Maestra"
                        value={masterPass}
                        onChange={(e) => setMasterPass(e.target.value)}
                        className="bg-neutral-950 border border-neutral-700 px-3 py-2 rounded-xl text-white focus:outline-none focus:border-red-500 text-xs font-mono"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={isRestoring}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-2 rounded-xl text-xs transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                      >
                        {isRestoring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                        <span>Verificar y Restaurar Servicio</span>
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
