import React from 'react';
import { ShieldAlert, Lock, AlertTriangle, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useCybersecurity } from '../context/CybersecurityContext';

export default function BlockedIpScreen() {
  const { clientIp, clientFingerprint } = useCybersecurity();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-mono select-none">
      {/* Background Matrix/Radar effect */}
      <div className="absolute inset-0 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-xl w-full bg-slate-900/95 border border-red-500/40 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-md relative z-10 text-center space-y-6"
      >
        <div className="w-20 h-20 rounded-3xl bg-red-500/15 border border-red-500/40 text-red-500 flex items-center justify-center mx-auto shadow-lg shadow-red-500/20 animate-pulse">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold text-red-400 uppercase tracking-widest px-3 py-1 bg-red-950/80 rounded-full border border-red-800">
            HTTP 403 Forbidden &bull; WAF Perimeter Ban
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight pt-2">
            Acceso Denegado por Seguridad
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed font-sans max-w-md mx-auto">
            Tu dirección IP o identificador de navegación ha sido bloqueado preventivamente por el Firewall de Aplicaciones Web (WAF) institucional tras detectar patrones de ataque o tráfico anómalo.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-400">
            <span>Dirección IP Registrada:</span>
            <code className="text-red-400 font-bold">{clientIp}</code>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Huella Digital del Navegador:</span>
            <code className="text-amber-400 font-bold">{clientFingerprint}</code>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Hora de Bloqueo:</span>
            <span className="text-slate-200">{new Date().toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Estado del Servidor:</span>
            <span className="text-emerald-400 font-bold">Protegido & Operativo</span>
          </div>
        </div>

        <div className="pt-2 text-xs text-slate-500">
          <p>
            Si consideras que este bloqueo es un falso positivo, comunícate con la secretaría o el área técnica de la <strong className="text-slate-300">Unidad Educativa Virgen del Cisne</strong> indicando tu dirección IP.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
