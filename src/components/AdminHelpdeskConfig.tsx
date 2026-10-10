import React, { useState, useEffect } from 'react';
import { 
  Wrench, Save, RefreshCw, CheckCircle2, AlertCircle, 
  Building2, Plus, Trash2, Edit2, Check, X, ShieldAlert,
  Clock, Phone, Mail, User, Sparkles, MessageSquare, ListPlus
} from 'lucide-react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export interface HelpdeskConfigData {
  title: string;
  subtitle: string;
  announcement: string;
  laboratories: string[];
  technicianName: string;
  technicianPhone: string;
  technicianEmail: string;
  supportHours: string;
  commonIssues: { label: string; category: string }[];
  isActive: boolean;
  maintenanceNotice: string;
}

export const DEFAULT_HELPDESK_CONFIG: HelpdeskConfigData = {
  title: 'HelpDesk & Soporte QR',
  subtitle: 'Unidad Educativa Virgen del Cisne • Reporte rápido de computadoras, proyectores y mobiliario',
  announcement: 'Horario de atención técnica presencial: Lunes a Viernes de 07:00 a 15:30. Para reportes urgentes durante clase comunícate con el laboratorio de cómputo.',
  laboratories: ['Laboratorio 1', 'Laboratorio 2', 'Laboratorio de Ciencias', 'Sala de Profesores'],
  technicianName: 'Soporte Técnico Institucional',
  technicianPhone: '+593 99 999 9999',
  technicianEmail: 'soporte@virgendelcisne.edu.ec',
  supportHours: 'Lunes a Viernes: 07:00 - 15:30',
  commonIssues: [
    { label: '🖥️ Computadora no enciende / Pantalla negra', category: 'computacion' },
    { label: '🌐 Sin conexión a Internet / WiFi caído', category: 'red_internet' },
    { label: '🖱️ Mouse, teclado o cables dañados', category: 'computacion' },
    { label: '📽️ Proyector sin señal HDMI / Lámpara quemada', category: 'proyector_audio' },
    { label: '❄️ Aire acondicionado no enfría / gotea', category: 'electrico' },
    { label: '⚡ Tomacorriente dañado o con chispas', category: 'electrico' },
    { label: '🪑 Pupitre o mesa rota / inestable', category: 'mobiliario' }
  ],
  isActive: true,
  maintenanceNotice: 'El sistema de soporte se encuentra en mantenimiento programado. Los reportes presenciales continúan en el laboratorio.'
};

export default function AdminHelpdeskConfig() {
  const [config, setConfig] = useState<HelpdeskConfigData>(DEFAULT_HELPDESK_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [newLabName, setNewLabName] = useState('');
  const [editingLabIndex, setEditingLabIndex] = useState<number | null>(null);
  const [editingLabText, setEditingLabText] = useState('');

  const [newIssueLabel, setNewIssueLabel] = useState('');
  const [newIssueCategory, setNewIssueCategory] = useState('computacion');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'helpdesk_settings', 'config'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as HelpdeskConfigData;
        setConfig({
          ...DEFAULT_HELPDESK_CONFIG,
          ...data,
          laboratories: Array.isArray(data.laboratories) && data.laboratories.length > 0 
            ? data.laboratories 
            : DEFAULT_HELPDESK_CONFIG.laboratories,
          commonIssues: Array.isArray(data.commonIssues) && data.commonIssues.length > 0 
            ? data.commonIssues 
            : DEFAULT_HELPDESK_CONFIG.commonIssues
        });
        if (Array.isArray(data.laboratories)) {
          localStorage.setItem('school_labs_list', JSON.stringify(data.laboratories));
        }
      } else {
        setDoc(doc(db, 'helpdesk_settings', 'config'), DEFAULT_HELPDESK_CONFIG).catch(console.error);
      }
      setIsLoading(false);
    }, (err) => {
      console.error('Error fetching helpdesk settings:', err);
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      await setDoc(doc(db, 'helpdesk_settings', 'config'), config, { merge: true });
      localStorage.setItem('school_labs_list', JSON.stringify(config.laboratories));
      setFeedback({ type: 'success', message: '¡Configuración del HelpDesk guardada exitosamente!' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Error al guardar la configuración: ' + (err?.message || 'Intente nuevamente') });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddLab = () => {
    const clean = newLabName.trim();
    if (!clean) return;
    if (config.laboratories.includes(clean)) {
      alert('Ese laboratorio ya está registrado.');
      return;
    }
    const updated = [...config.laboratories, clean];
    setConfig(prev => ({ ...prev, laboratories: updated }));
    setNewLabName('');
  };

  const handleStartEditLab = (index: number) => {
    setEditingLabIndex(index);
    setEditingLabText(config.laboratories[index]);
  };

  const handleSaveEditLab = (index: number) => {
    const clean = editingLabText.trim();
    if (!clean) return;
    const updated = [...config.laboratories];
    updated[index] = clean;
    setConfig(prev => ({ ...prev, laboratories: updated }));
    setEditingLabIndex(null);
  };

  const handleDeleteLab = (index: number) => {
    const labName = config.laboratories[index];
    if (config.laboratories.length <= 1) {
      alert('Debe existir al menos un laboratorio o aula.');
      return;
    }
    if (!confirm(`¿Eliminar "${labName}" de la lista de laboratorios?`)) return;
    const updated = config.laboratories.filter((_, i) => i !== index);
    setConfig(prev => ({ ...prev, laboratories: updated }));
  };

  const handleAddIssue = () => {
    const clean = newIssueLabel.trim();
    if (!clean) return;
    const updated = [...config.commonIssues, { label: clean, category: newIssueCategory }];
    setConfig(prev => ({ ...prev, commonIssues: updated }));
    setNewIssueLabel('');
  };

  const handleDeleteIssue = (index: number) => {
    const updated = config.commonIssues.filter((_, i) => i !== index);
    setConfig(prev => ({ ...prev, commonIssues: updated }));
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center text-texto/60 flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-primario" />
        <span>Cargando configuración del HelpDesk...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primario/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-primario font-extrabold text-xs uppercase tracking-wider mb-1">
            <Wrench className="w-4 h-4" />
            <span>Panel de Control del HelpDesk</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-texto tracking-tight">
            Modificar Configuración del HelpDesk
          </h3>
          <p className="text-xs sm:text-sm text-texto/60 mt-1">
            Personaliza los títulos, avisos a estudiantes, nombres de laboratorios, opciones de fallas rápidas y datos del técnico responsable.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-primario text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md hover:bg-primario/90 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 self-start sm:self-auto shrink-0"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Guardar Configuración</span>
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center justify-between animate-fade-in ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs font-black opacity-60 hover:opacity-100 cursor-pointer">✕</button>
        </div>
      )}

      {/* QUICK STATUS CONTROL CARD */}
      <div className={`p-6 rounded-3xl border-2 transition-all shadow-md ${
        config.isActive
          ? 'bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white border-emerald-300'
          : 'bg-gradient-to-r from-amber-50 via-yellow-50/40 to-white border-amber-400 ring-2 ring-amber-400/20'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${config.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'}`} />
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Estado Público del Servicio HelpDesk & QR
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                config.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-200 text-amber-950 font-black'
              }`}>
                {config.isActive ? '🟢 Servicio Habilitado' : '🚧 Servicio en Mantenimiento / Deshabilitado'}
              </span>
            </div>
            <h4 className="text-lg font-black text-slate-900">
              {config.isActive 
                ? 'El portal de soporte y escaneo QR está 100% visible para estudiantes y docentes' 
                : 'El portal muestra la pantalla de aviso de mejoras y optimizaciones técnicas'}
            </h4>
            <p className="text-xs text-slate-600 max-w-2xl">
              {config.isActive
                ? 'Cualquier usuario puede ingresar a /helpdesk, reportar daños, escanear códigos QR y consultar boletos técnicos.'
                : 'Los visitantes verán el mensaje de mantenimiento informándoles que se están realizando mejoras.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={async () => {
                const nextState = !config.isActive;
                setConfig(prev => ({ ...prev, isActive: nextState }));
                try {
                  await setDoc(doc(db, 'helpdesk_settings', 'config'), { ...config, isActive: nextState }, { merge: true });
                  setFeedback({
                    type: 'success',
                    message: nextState 
                      ? '¡Servicio HelpDesk HABILITADO para todos los usuarios!' 
                      : '¡Servicio HelpDesk puesto en modo DESHABILITADO / MANTENIMIENTO!'
                  });
                  setTimeout(() => setFeedback(null), 4000);
                } catch (err: any) {
                  setFeedback({ type: 'error', message: 'Error al actualizar estado: ' + err?.message });
                }
              }}
              className={`px-5 py-3 rounded-2xl font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center gap-2 ${
                config.isActive
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border border-amber-400 hover:scale-105'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105'
              }`}
            >
              {config.isActive ? (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>Deshabilitar Servicio (Poner en Mantenimiento)</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Habilitar Servicio HelpDesk</span>
                </>
              )}
            </button>

            <a
              href="/helpdesk"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Ver Pantalla Pública &rarr;</span>
            </a>
          </div>
        </div>

        {!config.isActive && (
          <div className="mt-4 pt-4 border-t border-amber-200/60 space-y-2">
            <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider">
              Mensaje de Mantenimiento mostrado en pantalla:
            </label>
            <textarea
              rows={2}
              value={config.maintenanceNotice || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, maintenanceNotice: e.target.value }))}
              placeholder="Por este momento el sistema de HelpDesk y Soporte QR se encuentra temporalmente deshabilitado por mejoras y optimizaciones técnicas..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 text-xs sm:text-sm bg-white outline-none focus:ring-2 focus:ring-amber-400/20 text-slate-800"
            />
            <span className="text-[11px] text-amber-800 block">
              💡 Puedes editar el mensaje y hacer clic en "Guardar Configuración" para actualizarlo en vivo.
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-primario/15 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-primario/10 text-primario flex items-center justify-center font-bold text-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm sm:text-base text-texto">
                1. Textos e Información General del HelpDesk
              </h4>
              <p className="text-[11px] text-texto/50">
                Encabezados visibles para los estudiantes y docentes al entrar al portal
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-texto/70 mb-1">
                Título del HelpDesk: *
              </label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-primario/20 text-xs sm:text-sm bg-fondo outline-none focus:ring-2 focus:ring-primario/20 font-bold text-texto"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-texto/70 mb-1">
                Subtítulo Institucional: *
              </label>
              <input
                type="text"
                value={config.subtitle}
                onChange={(e) => setConfig(prev => ({ ...prev, subtitle: e.target.value }))}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-primario/20 text-xs sm:text-sm bg-fondo outline-none focus:ring-2 focus:ring-primario/20 text-texto font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-texto/70 mb-1">
              Banner / Aviso Destacado a la Comunidad Escolar:
            </label>
            <textarea
              rows={2}
              value={config.announcement}
              onChange={(e) => setConfig(prev => ({ ...prev, announcement: e.target.value }))}
              placeholder="Ej: Horario de atención presencial: 07:00 a 15:30. Para urgencias en clase acudir al laboratorio..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-primario/20 text-xs sm:text-sm bg-fondo outline-none focus:ring-2 focus:ring-primario/20 text-texto"
            />
            <span className="text-[10px] text-texto/40 mt-1 block">
              Este mensaje se muestra en el banner superior de la página principal del HelpDesk.
            </span>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-neutral-100">
            <div>
              <label className="text-xs font-bold text-texto/80 flex items-center gap-2">
                <span>Estado del Servicio HelpDesk:</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${config.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 animate-pulse'}`}>
                  {config.isActive ? '🟢 Activo (Abierto para toda la comunidad)' : '🚧 Deshabilitado / En Mantenimiento'}
                </span>
              </label>
              <p className="text-[11px] text-texto/50 mt-0.5">
                Si desactivas el servicio, los estudiantes y docentes verán la pantalla de mantenimiento con el mensaje configurado.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setConfig(prev => ({ ...prev, isActive: !prev.isActive }))}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                config.isActive 
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {config.isActive ? '🚧 Deshabilitar / Poner en Mantenimiento' : '🟢 Habilitar Servicio'}
            </button>
          </div>

          {!config.isActive && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
              <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider">
                Mensaje de Mantenimiento que verán los usuarios:
              </label>
              <textarea
                rows={2}
                value={config.maintenanceNotice || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, maintenanceNotice: e.target.value }))}
                placeholder="Por este momento el sistema de HelpDesk y Soporte QR se encuentra temporalmente deshabilitado por mejoras y optimización técnica programada..."
                className="w-full px-3.5 py-2 rounded-xl border border-amber-300 text-xs sm:text-sm bg-white outline-none focus:ring-2 focus:ring-amber-400/20 text-slate-800"
              />
            </div>
          )}
        </div>

        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-primario/15 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primario/10 text-primario flex items-center justify-center font-bold text-sm">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm sm:text-base text-texto">
                  2. Modificar Laboratorios y Aulas del Colegio
                </h4>
                <p className="text-[11px] text-texto/50">
                  Agrega, renombra o elimina laboratorios para asociar materiales y generar lotes QR
                </p>
              </div>
            </div>

            <span className="text-xs font-bold bg-primario/10 text-primario px-3 py-1 rounded-xl">
              {config.laboratories.length} Laboratorios
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newLabName}
              onChange={(e) => setNewLabName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddLab(); } }}
              placeholder="Nombre del nuevo laboratorio o aula (ej. Laboratorio 3, Sala Multimedia, Robótica...)"
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm bg-fondo outline-none focus:ring-2 focus:ring-primario/20"
            />
            <button
              type="button"
              onClick={handleAddLab}
              disabled={!newLabName.trim()}
              className="bg-primario text-white px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-primario/90 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Laboratorio</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {config.laboratories.map((lab, index) => {
              const isEditing = editingLabIndex === index;

              return (
                <div
                  key={index}
                  className="p-3.5 rounded-2xl border border-neutral-200 bg-neutral-50/50 hover:bg-white hover:border-primario/30 transition-all flex items-center justify-between gap-2 shadow-2xs"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 w-full">
                      <input
                        type="text"
                        value={editingLabText}
                        onChange={(e) => setEditingLabText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveEditLab(index); } }}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-primario text-xs bg-white outline-none font-bold"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEditLab(index)}
                        className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                        title="Guardar nombre"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingLabIndex(null)}
                        className="p-1.5 rounded-lg bg-neutral-200 text-texto/60 hover:bg-neutral-300 cursor-pointer"
                        title="Cancelar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Building2 className="w-4 h-4 text-primario shrink-0" />
                        <span className="font-extrabold text-xs text-texto truncate">{lab}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditLab(index)}
                          className="p-1 rounded-lg text-texto/40 hover:text-texto hover:bg-neutral-200 transition-colors cursor-pointer"
                          title="Renombrar laboratorio"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLab(index)}
                          className="p-1 rounded-lg text-texto/30 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Eliminar laboratorio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-primario/15 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primario/10 text-primario flex items-center justify-center font-bold text-sm">
                <ListPlus className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm sm:text-base text-texto">
                  3. Problemas Comunes y Opciones Rápidas de Reporte
                </h4>
                <p className="text-[11px] text-texto/50">
                  Botones que aparecen en el formulario para que los estudiantes seleccionen la falla con 1 clic
                </p>
              </div>
            </div>

            <span className="text-xs font-bold bg-primario/10 text-primario px-3 py-1 rounded-xl">
              {config.commonIssues.length} Opciones
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div className="sm:col-span-2">
              <input
                type="text"
                value={newIssueLabel}
                onChange={(e) => setNewIssueLabel(e.target.value)}
                placeholder="Ej: 🎧 Audífonos sin sonido / Cable roto"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs bg-fondo outline-none focus:ring-2 focus:ring-primario/20"
              />
            </div>
            <div>
              <select
                value={newIssueCategory}
                onChange={(e) => setNewIssueCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 text-xs bg-fondo outline-none"
              >
                <option value="computacion">Computación / Periféricos</option>
                <option value="proyector_audio">Audio / Proyector</option>
                <option value="red_internet">Internet / WiFi</option>
                <option value="electrico">Eléctrico / Clima</option>
                <option value="mobiliario">Mobiliario / Pupitres</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <button
                type="button"
                onClick={handleAddIssue}
                disabled={!newIssueLabel.trim()}
                className="w-full bg-primario text-white py-2.5 rounded-xl font-bold text-xs hover:bg-primario/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Opción</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {config.commonIssues.map((issue, index) => (
              <div
                key={index}
                className="p-3 rounded-xl border border-neutral-200 bg-white flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="font-bold text-texto truncate">{issue.label}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 capitalize shrink-0">
                    {issue.category.replace('_', ' ')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteIssue(index)}
                  className="p-1 rounded-lg text-texto/30 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                  title="Eliminar opción"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-primario/15 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-primario/10 text-primario flex items-center justify-center font-bold text-sm">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm sm:text-base text-texto">
                4. Datos del Técnico Responsable y Horarios
              </h4>
              <p className="text-[11px] text-texto/50">
                Información de contacto que los estudiantes y docentes verán en el soporte
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-texto/70 mb-1">
                Nombre del Técnico o Encargado del Laboratorio:
              </label>
              <input
                type="text"
                value={config.technicianName}
                onChange={(e) => setConfig(prev => ({ ...prev, technicianName: e.target.value }))}
                placeholder="Ej: Ing. Carlos Mendoza / Soporte Técnico"
                className="w-full px-3.5 py-2.5 rounded-xl border border-primario/20 text-xs sm:text-sm bg-fondo outline-none focus:ring-2 focus:ring-primario/20 font-bold text-texto"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-texto/70 mb-1">
                Horario de Atención Presencial:
              </label>
              <input
                type="text"
                value={config.supportHours}
                onChange={(e) => setConfig(prev => ({ ...prev, supportHours: e.target.value }))}
                placeholder="Ej: Lunes a Viernes: 07:00 - 15:30"
                className="w-full px-3.5 py-2.5 rounded-xl border border-primario/20 text-xs sm:text-sm bg-fondo outline-none focus:ring-2 focus:ring-primario/20 text-texto"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-texto/70 mb-1">
                Teléfono / WhatsApp de Urgencias:
              </label>
              <input
                type="text"
                value={config.technicianPhone}
                onChange={(e) => setConfig(prev => ({ ...prev, technicianPhone: e.target.value }))}
                placeholder="Ej: +593 99 999 9999"
                className="w-full px-3.5 py-2.5 rounded-xl border border-primario/20 text-xs sm:text-sm bg-fondo outline-none focus:ring-2 focus:ring-primario/20 text-texto"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-texto/70 mb-1">
                Correo Electrónico de Soporte:
              </label>
              <input
                type="email"
                value={config.technicianEmail}
                onChange={(e) => setConfig(prev => ({ ...prev, technicianEmail: e.target.value }))}
                placeholder="Ej: soporte@virgendelcisne.edu.ec"
                className="w-full px-3.5 py-2.5 rounded-xl border border-primario/20 text-xs sm:text-sm bg-fondo outline-none focus:ring-2 focus:ring-primario/20 text-texto"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-neutral-200">
          <span className="text-xs text-texto/50 italic">
            Los cambios se reflejan inmediatamente en la página pública del HelpDesk para alumnos y docentes.
          </span>

          <button
            type="submit"
            disabled={isSaving}
            className="bg-primario text-white px-6 py-3 rounded-xl font-bold text-xs shadow-md hover:bg-primario/90 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Guardar Toda la Configuración</span>
          </button>
        </div>

      </form>

    </div>
  );
}
