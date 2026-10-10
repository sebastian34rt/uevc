import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  PowerOff, 
  RefreshCw, 
  Terminal, 
  AlertTriangle, 
  Radio, 
  Database, 
  Code, 
  KeyRound, 
  CheckCircle2, 
  Clock, 
  Zap, 
  Activity,
  Server,
  Lock,
  Unlock,
  Play,
  FileText,
  Download,
  Trash2,
  UserX,
  Plus,
  Search,
  Filter,
  Check,
  Globe,
  Eye,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCybersecurity } from '../context/CybersecurityContext';
import { useAuth } from '../context/AuthContext';
import { AttackType, ThreatLevel, ATTACK_TYPE_LABELS, SecurityIncident } from '../types/cybersecurity';

export default function AdminCybersecuritySOC() {
  const { 
    lockdownState, 
    incidents, 
    blockedIps,
    clientIp,
    clientFingerprint,
    wafMetrics,
    triggerEmergencyLockdown, 
    restoreNormalService, 
    simulateAttack,
    banIp,
    unbanIp,
    clearResolvedIncidents,
    exportForensicReport
  } = useCybersecurity();
  
  const { isSuperAdmin, currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'monitor' | 'incidents' | 'blacklist' | 'pentest'>('monitor');
  const [customReason, setCustomReason] = useState('Sospecha de ataque de denegación de servicio y saturación de peticiones');
  const [selectedThreat, setSelectedThreat] = useState<ThreatLevel>('critical');
  const [selectedAttackType, setSelectedAttackType] = useState<AttackType>('ddos_flood');
  const [autoRecoverMinutes, setAutoRecoverMinutes] = useState<number | null>(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Detalle de incidente seleccionado
  const [inspectIncident, setInspectIncident] = useState<SecurityIncident | null>(null);

  // Formulario manual de bloqueo de IP
  const [newBanIp, setNewBanIp] = useState('');
  const [newBanReason, setNewBanReason] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [threatFilter, setThreatFilter] = useState<string>('all');

  const handleManualLockdown = async () => {
    setIsProcessing(true);
    setFeedback(null);
    try {
      await triggerEmergencyLockdown(
        customReason,
        selectedAttackType,
        selectedThreat,
        autoRecoverMinutes
      );
      setFeedback({ 
        type: 'success', 
        message: '¡Cierre de servidores de emergencia activado exitosamente! El sitio público está en modo aislamiento.' 
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Error activando el protocolo: ' + (err?.message || 'Intente de nuevo') });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    setIsProcessing(true);
    setFeedback(null);
    try {
      await restoreNormalService(currentUser?.email || 'Super Administrador');
      setFeedback({ 
        type: 'success', 
        message: '¡Servidores y sitio web restaurados a la normalidad exitosamente!' 
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Error restaurando servicio: ' + (err?.message || 'Intente de nuevo') });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulate = async (type: AttackType) => {
    setIsProcessing(true);
    try {
      await simulateAttack(type);
      setFeedback({ 
        type: 'success', 
        message: `¡Simulación de ataque (${ATTACK_TYPE_LABELS[type].label}) ejecutada! El motor WAF ha respondido aislando la infraestructura.` 
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Error en la simulación: ' + (err?.message || '') });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBanIp.trim() || !newBanReason.trim()) return;
    setIsProcessing(true);
    try {
      await banIp(newBanIp.trim(), newBanReason.trim(), 'manual_killswitch');
      setNewBanIp('');
      setNewBanReason('');
      setFeedback({ type: 'success', message: `¡Dirección IP ${newBanIp} añadida a la lista negra perimetral!` });
      setTimeout(() => setFeedback(null), 4000);
    } catch (e: any) {
      setFeedback({ type: 'error', message: 'Error al banear IP: ' + e?.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredIncidents = incidents.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (item.ipOrigin && item.ipOrigin.toLowerCase().includes(searchFilter.toLowerCase()));
    const matchesThreat = threatFilter === 'all' || item.threatLevel === threatFilter;
    return matchesSearch && matchesThreat;
  });

  return (
    <div className="space-y-8">
      {/* Encabezado Principal del Centro de Ciberseguridad (SOC) */}
      <div className={`p-6 sm:p-8 rounded-3xl text-white shadow-xl border relative overflow-hidden transition-all ${
        lockdownState.isActive 
          ? 'bg-gradient-to-r from-red-950 via-red-900 to-neutral-900 border-red-500/50' 
          : 'bg-gradient-to-r from-slate-900 via-primario to-slate-900 border-primario/30'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
              lockdownState.isActive 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-white/10 text-emerald-400 border border-white/15'
            }`}>
              {lockdownState.isActive ? <ShieldAlert className="w-9 h-9" /> : <ShieldCheck className="w-9 h-9" />}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black font-serif tracking-tight">
                  Centro de Ciberdefensa & Operaciones de Seguridad (SOC)
                </h2>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  lockdownState.isActive 
                    ? 'bg-red-500 text-white animate-bounce' 
                    : 'bg-emerald-400 text-slate-950'
                }`}>
                  {lockdownState.isActive ? '🚨 SERVIDORES EN MODO AISLAMIENTO' : '🛡️ WAF ACTIVO & PROTEGIDO'}
                </span>
              </div>
              <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed font-sans">
                Inspección perimetral en tiempo real contra inyecciones SQL, vectores XSS, ataques DDoS y fuerza bruta. Conectado a Firestore con aislamiento preventivo automático.
              </p>
              <div className="flex items-center gap-3 mt-3 text-[11px] text-white/70 font-mono">
                <span>Tu IP Actual: <strong className="text-white">{clientIp}</strong></span>
                <span>&bull;</span>
                <span>Huella: <strong className="text-white">{clientFingerprint}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {lockdownState.isActive ? (
              <button
                onClick={handleRestore}
                disabled={isProcessing}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3.5 rounded-2xl text-xs shadow-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                <span>Restaurar Servicio Web</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setActiveTab('pentest'); }}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-3 rounded-2xl text-xs shadow-xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>Probar Ataques</span>
                </button>
                <button
                  onClick={handleManualLockdown}
                  disabled={isProcessing}
                  className="bg-red-600 hover:bg-red-700 text-white font-black px-5 py-3 rounded-2xl text-xs shadow-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <PowerOff className="w-4 h-4" />
                  <span>Kill Switch</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-3 ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tarjetas de Métricas de Seguridad Reales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-primario/10 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-texto/60 text-xs font-bold">
            <span>Peticiones Inspeccionadas</span>
            <Activity className="w-4 h-4 text-primario" />
          </div>
          <div className="text-2xl font-black text-texto">
            {wafMetrics.totalInspected.toLocaleString()}
          </div>
          <p className="text-[11px] text-texto/50">Filtro heurístico y firmas WAF</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-primario/10 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-texto/60 text-xs font-bold">
            <span>Amenazas Neutralizadas</span>
            <ShieldAlert className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {wafMetrics.threatsNeutralized}
          </div>
          <p className="text-[11px] text-texto/50">Intentos de inyección bloqueados</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-primario/10 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-texto/60 text-xs font-bold">
            <span>Lista Negra Perimetral</span>
            <UserX className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-600">
            {wafMetrics.activeBans} <span className="text-xs font-normal text-texto/50">IPs bloqueadas</span>
          </div>
          <p className="text-[11px] text-texto/50">Bloqueo HTTP 403 automático</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-primario/10 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-texto/60 text-xs font-bold">
            <span>Estado de Servidores</span>
            <Server className={`w-4 h-4 ${lockdownState.isActive ? 'text-red-500' : 'text-emerald-600'}`} />
          </div>
          <div className="text-lg font-black text-texto flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${lockdownState.isActive ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
            <span>{lockdownState.isActive ? 'Aislamiento Preventivo' : 'En Línea & Seguro'}</span>
          </div>
          <p className="text-[11px] text-texto/50">Firestore en tiempo real</p>
        </div>
      </div>

      {/* Navegación por Pestañas del SOC */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-primario/10 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('monitor')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'monitor'
                ? 'bg-primario text-white shadow-sm'
                : 'bg-primario/5 text-texto/70 hover:bg-primario/10'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Monitor & Kill Switch</span>
          </button>

          <button
            onClick={() => setActiveTab('incidents')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'incidents'
                ? 'bg-primario text-white shadow-sm'
                : 'bg-primario/5 text-texto/70 hover:bg-primario/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Incidentes Forenses ({incidents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('blacklist')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'blacklist'
                ? 'bg-primario text-white shadow-sm'
                : 'bg-primario/5 text-texto/70 hover:bg-primario/10'
            }`}
          >
            <UserX className="w-4 h-4" />
            <span>Lista Negra de IPs ({blockedIps.filter(b => b.status === 'active').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pentest')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'pentest'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Pruebas de Penetración (Pentest)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportForensicReport}
            className="px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-texto text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Descargar informe de auditoría forense en JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Auditoría</span>
          </button>
        </div>
      </div>

      {/* CONTENIDO DE PESTAÑAS */}

      {/* PESTAÑA 1: MONITOR & KILL SWITCH */}
      {activeTab === 'monitor' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-primario/10 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-primario/10 pb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <PowerOff className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-texto">Control del Interruptor de Emergencia (Kill Switch)</h3>
                <p className="text-xs text-texto/60">
                  Apaga preventivamente la cara pública de los servidores ante cualquier incidente severo, protegiendo la base de datos de los estudiantes.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-texto/70 mb-1.5 uppercase tracking-wider">
                  Motivo del Cierre Preventivo
                </label>
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Ej: Sospecha de inyección de código masiva"
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-primario/15 rounded-xl text-xs text-texto focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-texto/70 mb-1.5 uppercase tracking-wider">
                  Tipo de Vector de Ataque
                </label>
                <select
                  value={selectedAttackType}
                  onChange={(e) => setSelectedAttackType(e.target.value as AttackType)}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-primario/15 rounded-xl text-xs text-texto font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="ddos_flood">Ataque DDoS / Flood de Tráfico</option>
                  <option value="sql_injection">Intento de Inyección SQL / NoSQL</option>
                  <option value="xss_injection">Inyección de Scripts (XSS)</option>
                  <option value="brute_force">Fuerza Bruta de Credenciales</option>
                  <option value="path_traversal">Salto de Directorios (Path Traversal)</option>
                  <option value="manual_killswitch">Cierre Manual Preventivo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-texto/70 mb-1.5 uppercase tracking-wider">
                  Tiempo de Auto-Recuperación
                </label>
                <select
                  value={autoRecoverMinutes === null ? 'manual' : autoRecoverMinutes}
                  onChange={(e) => setAutoRecoverMinutes(e.target.value === 'manual' ? null : Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-primario/15 rounded-xl text-xs text-texto font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="5">Auto-restaurar en 5 minutos</option>
                  <option value="15">Auto-restaurar en 15 minutos</option>
                  <option value="30">Auto-restaurar en 30 minutos</option>
                  <option value="manual">Solo restauración manual por Super Admin</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              {lockdownState.isActive ? (
                <button
                  type="button"
                  onClick={handleRestore}
                  disabled={isProcessing}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Restaurar y Reabrir Sitio Web</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleManualLockdown}
                  disabled={isProcessing}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <PowerOff className="w-4 h-4" />
                  <span>Ejecutar Cierre Inmediato (Kill Switch)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: INCIDENTES FORENSES */}
      {activeTab === 'incidents' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-primario/10 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primario/10 pb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-texto">Registro Forense de Incidentes</h3>
              <p className="text-xs text-texto/60">Trazabilidad completa con marcas de tiempo, direcciones IP agresoras y vectores interceptados.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearResolvedIncidents}
                className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Limpiar incidentes que ya han sido resueltos"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar Resueltos</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-texto/40" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Buscar por IP, descripción o tipo de ataque..."
                className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-primario/15 rounded-xl text-xs text-texto outline-none focus:ring-2 focus:ring-primario/20"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-texto/50" />
              <select
                value={threatFilter}
                onChange={(e) => setThreatFilter(e.target.value)}
                className="px-3 py-2 bg-neutral-50 border border-primario/15 rounded-xl text-xs text-texto font-medium outline-none"
              >
                <option value="all">Todas las severidades</option>
                <option value="critical">Solo Críticos</option>
                <option value="high">Solo Altos</option>
                <option value="medium">Solo Medios</option>
                <option value="low">Solo Bajos</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-primario/10 text-texto/50 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">IP Origen</th>
                  <th className="py-3 px-4">Tipo de Amenaza</th>
                  <th className="py-3 px-4">Descripción Forense</th>
                  <th className="py-3 px-4">Severidad</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primario/5">
                {filteredIncidents.length > 0 ? (
                  filteredIncidents.map((incident) => (
                    <tr key={incident.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-4 px-4 font-mono text-texto/70 whitespace-nowrap">
                        {new Date(incident.timestamp).toLocaleString('es-ES', { 
                          day: '2-digit', 
                          month: 'short', 
                          hour: '2-digit', 
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-slate-800">
                        {incident.ipOrigin || 'No registrado'}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-texto">
                          {ATTACK_TYPE_LABELS[incident.type]?.label || incident.type}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-texto/70 max-w-sm truncate" title={incident.description}>
                        {incident.description}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          incident.threatLevel === 'critical' 
                            ? 'bg-red-100 text-red-800 border border-red-200' 
                            : incident.threatLevel === 'high' 
                            ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {incident.threatLevel}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {incident.status === 'active_lockdown' ? (
                          <span className="inline-flex items-center gap-1.5 text-red-600 font-bold animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5" /> En Aislamiento
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Neutralizado
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setInspectIncident(incident)}
                          className="px-2.5 py-1 rounded-lg bg-primario/10 hover:bg-primario/20 text-primario font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Ver Detalle
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-texto/50">
                      No hay incidentes de seguridad que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: LISTA NEGRA DE IPS */}
      {activeTab === 'blacklist' && (
        <div className="space-y-6">
          {/* Formulario para bloquear IP manualmente */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-primario/10 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-primario/10 pb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-texto">Añadir Dirección IP a la Lista Negra</h3>
                <p className="text-xs text-texto/60">Cualquier visitante con esta IP recibirá un bloqueo inmediato 403 WAF.</p>
              </div>
            </div>

            <form onSubmit={handleManualBan} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-texto/70 mb-1.5 uppercase tracking-wider">
                  Dirección IP
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 190.152.44.12 o 45.33.32.156"
                  value={newBanIp}
                  onChange={(e) => setNewBanIp(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-primario/15 rounded-xl text-xs font-mono text-texto focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-texto/70 mb-1.5 uppercase tracking-wider">
                  Motivo de Bloqueo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Intentos sospechosos de inyección SQL"
                  value={newBanReason}
                  onChange={(e) => setNewBanReason(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-primario/15 rounded-xl text-xs text-texto focus:ring-2 focus:ring-red-500"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Bloquear IP en WAF</span>
              </button>
            </form>
          </div>

          {/* Tabla de IPs Bloqueadas */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-primario/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-primario/10 pb-4">
              <h3 className="text-base sm:text-lg font-bold text-texto">Direcciones IP Bloqueadas por el WAF</h3>
              <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                {blockedIps.filter(b => b.status === 'active').length} bloqueos activos
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-primario/10 text-texto/50 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Dirección IP</th>
                    <th className="py-3 px-4">Motivo del Bloqueo</th>
                    <th className="py-3 px-4">Fecha de Bloqueo</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primario/5">
                  {blockedIps.length > 0 ? (
                    blockedIps.map((b) => (
                      <tr key={b.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-red-600">
                          {b.ip}
                        </td>
                        <td className="py-3 px-4 text-texto/80 max-w-sm">
                          {b.reason}
                        </td>
                        <td className="py-3 px-4 font-mono text-texto/60">
                          {new Date(b.blockedAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          {b.status === 'active' ? (
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px] uppercase">
                              Bloqueada
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                              Levantada
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {b.status === 'active' && b.id && (
                            <button
                              type="button"
                              onClick={() => unbanIp(b.id!)}
                              className="px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Desbloquear</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-texto/50">
                        No hay direcciones IP bloqueadas en la lista negra.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 4: PRUEBAS DE PENETRACIÓN (PENTEST WORKBENCH) */}
      {activeTab === 'pentest' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-purple-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-texto">Mesa de Pruebas de Penetración en Vivo</h3>
              <p className="text-xs text-texto/60">
                Ejecuta payloads de ataque reales contra el motor WAF para verificar en vivo cómo la ciberdefensa detecta, registra y mitiga la amenaza en Firestore.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-red-200 bg-red-50/40 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 rounded-xl bg-red-100 text-red-700">
                    <Database className="w-5 h-5" />
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-200 text-red-900 uppercase">
                    Crítico
                  </span>
                </div>
                <h4 className="font-bold text-texto text-sm">Prueba: Inyección SQL (SQLi)</h4>
                <p className="text-xs text-texto/60 mt-1 leading-relaxed">
                  Inyecta: <code className="bg-red-100 text-red-800 px-1 py-0.5 rounded text-[10px] block mt-1 break-all">' OR 1=1 -- UNION SELECT * FROM users</code>
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSimulate('sql_injection')}
                disabled={isProcessing}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Lanzar Test SQLi</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/40 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
                    <Code className="w-5 h-5" />
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 uppercase">
                    Alto
                  </span>
                </div>
                <h4 className="font-bold text-texto text-sm">Prueba: Cross-Site Scripting (XSS)</h4>
                <p className="text-xs text-texto/60 mt-1 leading-relaxed">
                  Inyecta: <code className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded text-[10px] block mt-1 break-all">&lt;script&gt;stealCookies()&lt;/script&gt;</code>
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSimulate('xss_injection')}
                disabled={isProcessing}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Lanzar Test XSS</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/40 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 rounded-xl bg-blue-100 text-blue-800">
                    <Radio className="w-5 h-5" />
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200 text-blue-900 uppercase">
                    Crítico
                  </span>
                </div>
                <h4 className="font-bold text-texto text-sm">Prueba: Ráfaga DDoS Flood</h4>
                <p className="text-xs text-texto/60 mt-1 leading-relaxed">
                  Simula: <code className="bg-blue-100 text-blue-900 px-1 py-0.5 rounded text-[10px] block mt-1">25,000 req/sec rate limit burst</code>
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSimulate('ddos_flood')}
                disabled={isProcessing}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Lanzar Test DDoS</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl border border-purple-200 bg-purple-50/40 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 rounded-xl bg-purple-100 text-purple-800">
                    <KeyRound className="w-5 h-5" />
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 uppercase">
                    Medio
                  </span>
                </div>
                <h4 className="font-bold text-texto text-sm">Prueba: Fuerza Bruta / Credenciales</h4>
                <p className="text-xs text-texto/60 mt-1 leading-relaxed">
                  Simula: <code className="bg-purple-100 text-purple-900 px-1 py-0.5 rounded text-[10px] block mt-1">5+ intentos fallidos consecutivos</code>
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSimulate('brute_force')}
                disabled={isProcessing}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Lanzar Test Brute Force</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl border border-neutral-300 bg-neutral-50/40 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 rounded-xl bg-neutral-200 text-neutral-800">
                    <Terminal className="w-5 h-5" />
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-900 uppercase">
                    Alto
                  </span>
                </div>
                <h4 className="font-bold text-texto text-sm">Prueba: Path Traversal (LFI)</h4>
                <p className="text-xs text-texto/60 mt-1 leading-relaxed">
                  Inyecta: <code className="bg-neutral-200 text-neutral-900 px-1 py-0.5 rounded text-[10px] block mt-1 break-all">../../../../etc/passwd</code>
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSimulate('path_traversal')}
                disabled={isProcessing}
                className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-900 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Lanzar Test Path Traversal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalle Forense del Incidente */}
      <AnimatePresence>
        {inspectIncident && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-primario/15 space-y-5 relative"
            >
              <button
                type="button"
                onClick={() => setInspectIncident(null)}
                className="absolute top-5 right-5 p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-texto/60 hover:text-texto transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-lg text-texto">{inspectIncident.title}</h4>
                  <span className="text-xs font-mono text-texto/50">ID: {inspectIncident.id || 'INC-TEMP'}</span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                  <span className="text-[10px] font-bold text-texto/50 uppercase">Descripción Forense:</span>
                  <p className="text-texto/80 font-sans leading-relaxed">{inspectIncident.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                    <span className="text-[10px] font-bold text-texto/50 uppercase block">IP Origen:</span>
                    <code className="text-red-600 font-bold">{inspectIncident.ipOrigin || 'No especificada'}</code>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                    <span className="text-[10px] font-bold text-texto/50 uppercase block">Severidad:</span>
                    <span className="font-bold text-red-700 uppercase">{inspectIncident.threatLevel}</span>
                  </div>
                </div>

                {inspectIncident.rawPayload && (
                  <div className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] space-y-1 overflow-x-auto">
                    <span className="text-[10px] text-slate-400 font-sans block">Payload Capturado:</span>
                    <pre className="whitespace-pre-wrap break-all">{inspectIncident.rawPayload}</pre>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setInspectIncident(null)}
                  className="px-5 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-texto font-bold text-xs cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
