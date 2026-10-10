import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wrench, QrCode, CheckCircle2, Clock, AlertTriangle, Search, 
  ArrowLeft, ArrowRight, Send, Sparkles, Laptop, Check, 
  ExternalLink, Copy, AlertCircle, RefreshCw, Lock, HelpCircle, Camera,
  Phone, Mail, Building2, ShieldAlert
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { db } from '../firebase';
import { 
  collection, doc, onSnapshot, setDoc, updateDoc, 
  query, orderBy 
} from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import ImageUploader from './ImageUploader';
import QrCameraScanner from './QrCameraScanner';
import { HelpDeskTutorialModal, HelpDeskTutorialTab } from './HelpDeskTutorial';
import { DEFAULT_HELPDESK_CONFIG, HelpdeskConfigData } from './AdminHelpdeskConfig';
import SEO from './SEO';

export interface HelpdeskAsset {
  id: string;
  assetCode: string;
  name: string;
  category: 'computacion' | 'proyector_audio' | 'mobiliario' | 'red_internet' | 'electrico' | 'otro';
  location: string;
  brandModel?: string;
  status?: 'operativo' | 'en_reparacion' | 'baja';
  createdAt?: number;
}

export interface HelpdeskTicket {
  id: string;
  ticketCode: string;
  assetCode: string;
  assetName: string;
  location: string;
  category: string;
  priority: 'baja' | 'media' | 'alta' | 'urgente';
  status: 'pendiente' | 'en_proceso' | 'resuelto' | 'cancelado';
  problemType: string;
  description: string;
  reportedBy: string;
  reportedRole: 'estudiante' | 'docente' | 'administrativo' | 'mantenimiento';
  contactInfo?: string;
  photoUrl?: string;
  createdAt: number;
  resolvedAt?: number;
  technicianNotes?: string;
  technicianName?: string;
}

const COMMON_ISSUES = [
  { label: '🖥️ Computadora no enciende / Pantalla negra', category: 'computacion' },
  { label: '🌐 Sin conexión a Internet / WiFi caído', category: 'red_internet' },
  { label: '🖱️ Mouse, teclado o cables dañados', category: 'computacion' },
  { label: '❄️ Aire acondicionado no enfría / gotea', category: 'electrico' },
  { label: '⚡ Tomacorriente dañado o con chispas', category: 'electrico' },
];

export default function HelpDesk() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlAssetParam = searchParams.get('asset');

  const [activeTab, setActiveTab] = useState<'report' | 'track' | 'tutorial'>('report');
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);

  // modal de guia la primera vez
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('helpdesk_tutorial_seen');
    if (!hasSeenTutorial && !urlAssetParam) {
      setIsTutorialModalOpen(true);
      localStorage.setItem('helpdesk_tutorial_seen', 'true');
    }
  }, [urlAssetParam]);

  const [assets, setAssets] = useState<HelpdeskAsset[]>([]);
  const [tickets, setTickets] = useState<HelpdeskTicket[]>([]);
  const [config, setConfig] = useState<HelpdeskConfigData>(DEFAULT_HELPDESK_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedAssetCode, setSelectedAssetCode] = useState<string>('');
  const [manualAssetLocation, setManualAssetLocation] = useState<string>('');
  const [searchAssetQuery, setSearchAssetQuery] = useState('');
  const [problemType, setProblemType] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'baja' | 'media' | 'alta' | 'urgente'>('media');
  const [reportedBy, setReportedBy] = useState('');
  const [reportedRole, setReportedRole] = useState<'estudiante' | 'docente' | 'administrativo' | 'mantenimiento'>('estudiante');
  const [contactInfo, setContactInfo] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<HelpdeskTicket | null>(null);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);

  const [trackTicketCode, setTrackTicketCode] = useState('');
  const [trackedTicket, setTrackedTicket] = useState<HelpdeskTicket | null>(null);
  const [trackNotFound, setTrackNotFound] = useState(false);

  // sincronizacion en tiempo real
  useEffect(() => {
    const unsubAssets = onSnapshot(collection(db, 'helpdesk_assets'), (snapshot) => {
      const loaded = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as HelpdeskAsset[];
      setAssets(loaded.sort((a, b) => a.assetCode.localeCompare(b.assetCode)));
      setIsLoading(false);
    });

    const qTickets = query(collection(db, 'helpdesk_tickets'), orderBy('createdAt', 'desc'));
    const unsubTickets = onSnapshot(qTickets, (snapshot) => {
      const loaded = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as HelpdeskTicket[];
      setTickets(loaded);
    });

    const unsubConfig = onSnapshot(doc(db, 'helpdesk_settings', 'config'), (snap) => {
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
      }
    });

    return () => {
      unsubAssets();
      unsubTickets();
      unsubConfig();
    };
  }, []);

  // si viene parametro por qr fisico
  useEffect(() => {
    if (urlAssetParam) {
      setSelectedAssetCode(urlAssetParam.trim().toUpperCase());
      setActiveTab('report');
    }
  }, [urlAssetParam]);

  const currentAsset = useMemo(() => {
    if (!selectedAssetCode) return null;
    return assets.find(a => a.assetCode.toUpperCase() === selectedAssetCode.toUpperCase()) || null;
  }, [assets, selectedAssetCode]);

  const filteredAssets = useMemo(() => {
    if (!searchAssetQuery.trim()) return assets;
    const q = searchAssetQuery.toLowerCase();
    return assets.filter(a => 
      a.assetCode.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.location.toLowerCase().includes(q)
    );
  }, [assets, searchAssetQuery]);

  // enviar reporte
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = selectedAssetCode.trim().toUpperCase();
    if (!cleanCode) {
      alert('Por favor ingresa o selecciona el código del equipo / activo.');
      return;
    }
    if (!description.trim() && !problemType) {
      alert('Por favor describe la falla o selecciona un problema común.');
      return;
    }
    if (!reportedBy.trim()) {
      alert('Por favor ingresa tu nombre completo.');
      return;
    }

    setIsSubmitting(true);
    try {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const ticketCode = `TKT-${randomSuffix}`;
      const docId = `ticket_${Date.now()}`;

      const newTicket: HelpdeskTicket = {
        id: docId,
        ticketCode,
        assetCode: currentAsset?.assetCode || cleanCode,
        assetName: currentAsset?.name || `Equipo ${cleanCode}`,
        location: currentAsset?.location || manualAssetLocation.trim() || 'Ubicación Escolar',
        category: currentAsset?.category || 'computacion',
        priority,
        status: 'pendiente',
        problemType: problemType || 'Incidencia General',
        description: description.trim(),
        reportedBy: reportedBy.trim(),
        reportedRole,
        contactInfo: contactInfo.trim(),
        photoUrl: photoUrl || '',
        createdAt: Date.now()
      };

      await setDoc(doc(db, 'helpdesk_tickets', docId), newTicket);

      // actualizar estado del equipo
      if (currentAsset) {
        await updateDoc(doc(db, 'helpdesk_assets', currentAsset.id), {
          status: 'en_reparacion'
        });
      }

      setCreatedTicket(newTicket);
      setDescription('');
      setProblemType('');
      setPhotoUrl('');
    } catch (err: any) {
      console.error('Error al enviar ticket:', err);
      alert('Error al enviar el reporte. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchTrackTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackNotFound(false);
    const code = trackTicketCode.trim().toUpperCase();
    if (!code) return;

    const found = tickets.find(t => 
      t.ticketCode.toUpperCase() === code || 
      t.assetCode.toUpperCase() === code
    );
    if (found) {
      setTrackedTicket(found);
      setTrackNotFound(false);
    } else {
      setTrackedTicket(null);
      setTrackNotFound(true);
    }
  };

  if (!config.isActive) {
    return (
      <div className="min-h-screen bg-fondo text-texto pt-24 pb-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <SEO 
          title="HelpDesk & Soporte QR"
          description="Portal institucional de soporte técnico y gestión de incidencias para equipos y aulas de la unidad educativa."
          path="/helpdesk"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="max-w-2xl w-full bg-white rounded-3xl border border-amber-200 shadow-2xl p-8 sm:p-12 text-center space-y-6 relative overflow-hidden"
        >
          {/* Decorative Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500" />
          
          <div className="w-20 h-20 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
            <Wrench className="w-10 h-10 animate-bounce" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              Mantenimiento Técnico & Mejoras en Proceso
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              {config.title || 'HelpDesk & Soporte QR'}
            </h1>
            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              {config.maintenanceNotice || 'Por este momento el sistema de HelpDesk y Soporte QR se encuentra temporalmente deshabilitado ya que estamos realizando mejoras y optimizaciones técnicas para brindarte una mejor atención.'}
            </p>
          </div>

          {/* Contact Details Card */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3">
            <div className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-primario" />
              <span>Atención Presencial y Soporte de Emergencia</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Responsable:</span>
                <strong className="text-slate-900">{config.technicianName || 'Soporte Técnico Institucional'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Teléfono / WhatsApp:</span>
                <strong className="text-slate-900">{config.technicianPhone || '+593 99 999 9999'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Correo de Soporte:</span>
                <strong className="text-slate-900">{config.technicianEmail || 'soporte@virgendelcisne.edu.ec'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Horario de Atención:</span>
                <strong className="text-slate-900">{config.supportHours || '07:00 a 15:30'}</strong>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-primario text-white font-extrabold text-xs shadow-md hover:bg-primario/90 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a la Página Principal</span>
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4 text-slate-500" />
              <span>Acceso de Administración</span>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fondo text-texto pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <SEO 
        title="HelpDesk & Soporte QR Institucional"
        description="Sistema de asistencia técnica y escaneo QR para reportar y dar seguimiento al estado de equipos, proyectores e infraestructura institucional."
        path="/helpdesk"
      />
      <div className="max-w-5xl mx-auto">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-primario hover:underline text-xs font-bold uppercase tracking-wider mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Volver al sitio principal
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primario text-white flex items-center justify-center shadow-md shadow-primario/25 shrink-0">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-texto tracking-tight flex items-center gap-2">
                  <span>{config.title || 'HelpDesk & Soporte QR'}</span>
                  <span className="text-xs bg-primario/10 text-primario font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Estudiantes & Docentes
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-texto/60">
                  {config.subtitle || 'Unidad Educativa Virgen del Cisne • Reporte rápido de computadoras, proyectores y mobiliario'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setIsTutorialModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Abrir guía interactiva paso a paso"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>¿Cómo funciona? (Tutorial)</span>
            </button>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-white hover:bg-neutral-50 text-texto/70 hover:text-primario border border-primario/15 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all"
              title="Panel exclusivo para personal técnico y administradores"
            >
              <Lock className="w-3.5 h-3.5 text-primario" />
              <span>Acceso Técnico (Admin)</span>
            </Link>
          </div>
        </div>

        {!config.isActive && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 mb-8 flex items-start gap-3 shadow-xs">
            <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-sm text-amber-900">Aviso de Mantenimiento</h4>
              <p className="text-xs sm:text-sm text-amber-800/90 mt-1 leading-relaxed">
                {config.maintenanceNotice || 'El sistema de soporte se encuentra en mantenimiento programado. Los reportes presenciales continúan en el laboratorio.'}
              </p>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-primario/10 via-primario/5 to-transparent border border-primario/15 rounded-3xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primario font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-primario" />
              <span>Aviso & Información del Soporte Técnico</span>
            </div>
            <p className="text-xs sm:text-sm text-texto/80 leading-relaxed font-medium">
              {config.announcement || 'Cada equipo en los laboratorios de cómputo y aulas cuenta con una etiqueta QR física. Escanéala con tu celular para reportar averías.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('tutorial')}
            className="bg-white hover:bg-neutral-50 text-primario border border-primario/25 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <span>💡 Ver Tutorial & Guía</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-neutral-200/50 rounded-2xl mb-8 max-w-xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('report')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'report' 
                ? 'bg-white text-primario shadow-sm' 
                : 'text-texto/60 hover:text-texto'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Reportar Avería</span>
          </button>

          <button
            onClick={() => setActiveTab('track')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'track' 
                ? 'bg-white text-primario shadow-sm' 
                : 'text-texto/60 hover:text-texto'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Consultar Mi Ticket</span>
          </button>

          <button
            onClick={() => setActiveTab('tutorial')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'tutorial' 
                ? 'bg-white text-primario shadow-sm' 
                : 'text-texto/60 hover:text-texto'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-amber-500" />
            <span>Guía & Tutorial</span>
          </button>
        </div>

        {activeTab === 'report' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-primario/10 shadow-sm">
                <h3 className="text-base font-extrabold text-texto mb-2 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-primario" />
                  <span>1. Identificación del Equipo</span>
                </h3>
                <p className="text-xs text-texto/60 mb-4">
                  Ingresa el código que aparece en la etiqueta pegada en el equipo (o selecciónalo si está en el catálogo).
                </p>

                {currentAsset ? (
                  <div className="p-4 rounded-2xl bg-primario/5 border border-primario/20 mb-4 relative">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primario text-white">
                          {currentAsset.assetCode}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          currentAsset.status === 'en_reparacion' 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {currentAsset.status === 'en_reparacion' ? 'Con Reporte Activo' : 'Operativo'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedAssetCode('')}
                        className="text-xs text-texto/40 hover:text-red-500 font-bold"
                      >
                        Cambiar
                      </button>
                    </div>

                    <h4 className="font-bold text-sm text-texto">{currentAsset.name}</h4>
                    <p className="text-xs text-texto/60 mt-0.5">{currentAsset.location}</p>
                    {currentAsset.brandModel && (
                      <p className="text-[11px] text-texto/50 mt-1 italic">{currentAsset.brandModel}</p>
                    )}

                    <div className="mt-3 pt-3 border-t border-primario/10 flex items-center justify-between">
                      <span className="text-[10px] text-texto/50 font-medium">Equipo Identificado</span>
                      <Check className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => setIsCameraScannerOpen(true)}
                      className="w-full bg-gradient-to-r from-primario to-[#004e92] hover:opacity-95 text-white p-3.5 rounded-2xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer group"
                    >
                      <Camera className="w-4 h-4 group-hover:scale-110 transition-transform text-white" />
                      <span>Escanear Código QR con Cámara</span>
                    </button>

                    <div className="relative flex py-1 items-center">
                      <div className="flex-grow border-t border-neutral-200"></div>
                      <span className="flex-shrink mx-2 text-[10px] text-texto/40 font-bold uppercase tracking-wider">o escribe el código</span>
                      <div className="flex-grow border-t border-neutral-200"></div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-texto/70 mb-1">
                        Código del Equipo (en el sticker): *
                      </label>
                      <input
                        type="text"
                        value={selectedAssetCode}
                        onChange={(e) => setSelectedAssetCode(e.target.value.toUpperCase())}
                        placeholder="Ej: LAB1-PC01, LAB1-MOU-05"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-primario/20 bg-fondo focus:ring-2 focus:ring-primario/20 outline-none uppercase font-mono"
                      />
                    </div>

                    {selectedAssetCode && !currentAsset && (
                      <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Especifica la ubicación</span>
                        </div>
                        <p className="text-[11px] text-amber-700/80">
                          Indica el aula o laboratorio exacto donde se encuentra el equipo:
                        </p>
                        <input
                          type="text"
                          value={manualAssetLocation}
                          onChange={(e) => setManualAssetLocation(e.target.value)}
                          placeholder="Ej: Laboratorio 1 - Mesa central"
                          className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-amber-200 outline-none"
                        />
                        {config.laboratories && config.laboratories.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {config.laboratories.map((lab) => (
                              <button
                                key={lab}
                                type="button"
                                onClick={() => setManualAssetLocation(lab)}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                                  manualAssetLocation === lab
                                    ? 'bg-amber-600 text-white border-amber-600'
                                    : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100'
                                }`}
                              >
                                {lab}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {assets.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-texto/40 uppercase tracking-wider">
                          O elige de la lista escolar ({assets.length}):
                        </div>
                        <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                          {filteredAssets.map((a) => (
                            <button
                              key={a.assetCode}
                              type="button"
                              onClick={() => {
                                setSelectedAssetCode(a.assetCode);
                                setSearchAssetQuery('');
                              }}
                              className="w-full text-left p-2.5 rounded-xl border border-neutral-100 hover:border-primario/30 hover:bg-primario/5 transition-all flex items-center justify-between text-xs cursor-pointer group"
                            >
                              <div className="min-w-0">
                                <span className="font-mono font-bold text-primario">{a.assetCode}</span>
                                <div className="text-texto font-medium truncate">{a.name}</div>
                                <div className="text-[10px] text-texto/50 truncate">{a.location}</div>
                              </div>
                              <span className="text-[10px] font-bold text-primario opacity-0 group-hover:opacity-100 transition-opacity">
                                Elegir &rarr;
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-primario/10 shadow-sm">
                
                {createdTicket ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-texto mb-1">¡Reporte Enviado al Técnico!</h3>
                    <p className="text-sm text-texto/60 max-w-md mx-auto mb-6">
                      El personal técnico de sistemas ha recibido la notificación y acudirá a revisar el equipo. Guarda el código de tu ticket para consultar el avance.
                    </p>

                    <div className="max-w-sm mx-auto p-4 rounded-2xl bg-primario/5 border border-primario/15 text-left mb-6 font-mono text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-texto/60">Código de Ticket:</span>
                        <span className="font-bold text-primario text-sm">{createdTicket.ticketCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-texto/60">Equipo Afectado:</span>
                        <span className="font-bold text-texto">{createdTicket.assetCode} ({createdTicket.assetName})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-texto/60">Ubicación:</span>
                        <span className="text-texto">{createdTicket.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-texto/60">Prioridad:</span>
                        <span className="font-bold uppercase text-amber-600">{createdTicket.priority}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        onClick={() => {
                          setTrackTicketCode(createdTicket.ticketCode);
                          setTrackedTicket(createdTicket);
                          setActiveTab('track');
                          setCreatedTicket(null);
                        }}
                        className="bg-primario text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md hover:bg-primario/90 transition-all cursor-pointer"
                      >
                        Ver Seguimiento en Vivo
                      </button>
                      <button
                        onClick={() => {
                          setCreatedTicket(null);
                          setSelectedAssetCode('');
                        }}
                        className="bg-white hover:bg-neutral-50 text-texto border border-primario/20 px-6 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer"
                      >
                        Reportar Otra Falla
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleReportSubmit} className="space-y-6">
                    <div>
                      <h3 className="text-base font-extrabold text-texto mb-1 flex items-center gap-2">
                        <Send className="w-5 h-5 text-primario" />
                        <span>2. Detalle de la Avería o Falla</span>
                      </h3>
                      <p className="text-xs text-texto/60">
                        Selecciona un problema común o describe lo que observas en el equipo.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">
                        Falla Común (Clic para autocompletar):
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(config.commonIssues && config.commonIssues.length > 0 ? config.commonIssues : COMMON_ISSUES).map((issue) => (
                          <button
                            key={issue.label}
                            type="button"
                            onClick={() => {
                              setProblemType(issue.label);
                              if (!description) {
                                setDescription(issue.label.replace(/^[^\s]+\s*/, ''));
                              }
                            }}
                            className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                              problemType === issue.label
                                ? 'bg-primario text-white border-primario shadow-xs'
                                : 'bg-fondo border-neutral-200 hover:border-primario/30 text-texto'
                            }`}
                          >
                            <span>{issue.label}</span>
                            {problemType === issue.label && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-1">
                        Descripción de lo que ocurre: *
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        rows={3}
                        placeholder="Ej: La pantalla enciende pero se pone azul con rayas, o el teclado no escribe la letra 'E'..."
                        className="w-full px-4 py-3 rounded-xl border border-primario/20 text-xs sm:text-sm bg-fondo focus:ring-2 focus:ring-primario/20 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">
                        Nivel de Urgencia:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { key: 'baja', label: 'Baja', desc: 'No interrumpe clase', color: 'border-emerald-200 text-emerald-800 bg-emerald-50' },
                          { key: 'media', label: 'Media', desc: 'Falla parcial', color: 'border-amber-200 text-amber-800 bg-amber-50' },
                          { key: 'alta', label: 'Alta', desc: 'Impide uso de clase', color: 'border-orange-200 text-orange-800 bg-orange-50' },
                          { key: 'urgente', label: 'Urgente', desc: 'Riesgo / Laboratorio', color: 'border-red-200 text-red-800 bg-red-50' },
                        ].map((p) => (
                          <button
                            key={p.key}
                            type="button"
                            onClick={() => setPriority(p.key as any)}
                            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                              priority === p.key 
                                ? `${p.color} ring-2 ring-primario/20 font-bold` 
                                : 'border-neutral-200 bg-fondo text-texto/70 hover:bg-neutral-100'
                            }`}
                          >
                            <div className="text-xs font-bold capitalize">{p.label}</div>
                            <div className="text-[10px] text-texto/50">{p.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-primario/10">
                      <div>
                        <label className="block text-xs font-bold text-texto/70 mb-1">
                          Tu Nombre Completo: *
                        </label>
                        <input
                          type="text"
                          value={reportedBy}
                          onChange={(e) => setReportedBy(e.target.value)}
                          required
                          placeholder="Ej: David Salazar"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-primario/20 text-xs bg-fondo focus:ring-2 focus:ring-primario/20 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-texto/70 mb-1">
                          Tu Rol:
                        </label>
                        <select
                          value={reportedRole}
                          onChange={(e) => setReportedRole(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-primario/20 text-xs bg-fondo focus:ring-2 focus:ring-primario/20 outline-none"
                        >
                          <option value="estudiante">Estudiante</option>
                          <option value="docente">Docente / Profesor</option>
                          <option value="administrativo">Personal Administrativo</option>
                          <option value="mantenimiento">Conserjería / Mantenimiento</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-texto/70 mb-1">
                          Contacto / Teléfono (Opcional):
                        </label>
                        <input
                          type="text"
                          value={contactInfo}
                          onChange={(e) => setContactInfo(e.target.value)}
                          placeholder="Para avisarte de la solución"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-primario/20 text-xs bg-fondo focus:ring-2 focus:ring-primario/20 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">
                        Fotografía de la Avería (Opcional):
                      </label>
                      <ImageUploader 
                        value={photoUrl} 
                        onChange={setPhotoUrl} 
                        label="Subir foto de evidencia de la falla"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !selectedAssetCode}
                      className="w-full bg-primario hover:bg-primario/90 text-white font-bold py-3.5 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>Transmitiendo Reporte al Técnico...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>Enviar Reporte de Avería</span>
                        </>
                      )}
                    </button>
                    {!selectedAssetCode && (
                      <p className="text-center text-xs text-amber-600 font-semibold">
                        * Ingresa o selecciona el código del equipo en la columna izquierda para continuar.
                      </p>
                    )}
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'track' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-primario/10 shadow-sm">
              <h3 className="text-lg font-extrabold text-texto mb-2 flex items-center gap-2">
                <Search className="w-5 h-5 text-primario" />
                <span>Consultar Avance de Mi Reporte</span>
              </h3>
              <p className="text-xs text-texto/60 mb-6">
                Ingresa el código del ticket que recibiste al enviar tu reporte (ej: <strong>TKT-1042</strong>) o el código del equipo.
              </p>

              <form onSubmit={handleSearchTrackTicket} className="flex gap-2">
                <input
                  type="text"
                  value={trackTicketCode}
                  onChange={(e) => setTrackTicketCode(e.target.value)}
                  placeholder="Ej: TKT-8291 ó LAB1-PC04"
                  className="flex-1 px-4 py-3 rounded-xl border border-primario/20 text-sm bg-fondo font-mono uppercase focus:ring-2 focus:ring-primario/20 outline-none"
                />
                <button
                  type="submit"
                  className="bg-primario text-white px-6 py-3 rounded-xl font-bold text-xs shadow-md hover:bg-primario/90 transition-all cursor-pointer"
                >
                  Buscar
                </button>
              </form>

              {trackNotFound && (
                <div className="mt-4 p-4 rounded-xl bg-red-50 text-red-800 border border-red-200 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>No se encontró ningún ticket con ese código. Verifica el número e intenta nuevamente.</span>
                </div>
              )}
            </div>

            {trackedTicket && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-primario/10 shadow-sm space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-primario/10 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-texto/50">Ticket de Atención</span>
                    <h4 className="text-xl font-mono font-extrabold text-primario">{trackedTicket.ticketCode}</h4>
                  </div>
                  <span className={`self-start sm:self-auto text-xs font-bold px-3 py-1 rounded-full uppercase ${
                    trackedTicket.status === 'resuelto' ? 'bg-emerald-100 text-emerald-800' :
                    trackedTicket.status === 'en_proceso' ? 'bg-blue-100 text-blue-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {trackedTicket.status === 'resuelto' ? 'Resuelto / Reparado' :
                     trackedTicket.status === 'en_proceso' ? 'En Revisión Técnica' :
                     'Pendiente de Atención'}
                  </span>
                </div>

                <div>
                  <h5 className="text-xs font-bold text-texto/60 uppercase tracking-wider mb-4">Progreso del Caso</h5>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-1 text-xs font-bold">1</div>
                      <div className="text-[11px] font-bold text-emerald-900">Reportado</div>
                      <div className="text-[10px] text-emerald-700/60">Recibido en sistema</div>
                    </div>

                    <div className={`p-3 rounded-xl border ${
                      trackedTicket.status === 'en_proceso' || trackedTicket.status === 'resuelto'
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-neutral-50 border-neutral-200 opacity-50'
                    }`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold ${
                        trackedTicket.status === 'en_proceso' || trackedTicket.status === 'resuelto'
                          ? 'bg-blue-600 text-white' 
                          : 'bg-neutral-300 text-neutral-600'
                      }`}>2</div>
                      <div className="text-[11px] font-bold text-texto">En Revisión</div>
                      <div className="text-[10px] text-texto/60">Técnico atendiendo</div>
                    </div>

                    <div className={`p-3 rounded-xl border ${
                      trackedTicket.status === 'resuelto'
                        ? 'bg-emerald-50 border-emerald-200' 
                        : 'bg-neutral-50 border-neutral-200 opacity-50'
                    }`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold ${
                        trackedTicket.status === 'resuelto'
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-neutral-300 text-neutral-600'
                      }`}>3</div>
                      <div className="text-[11px] font-bold text-texto">Solucionado</div>
                      <div className="text-[10px] text-texto/60">Equipo listo</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-fondo space-y-2 text-xs">
                  <div className="flex justify-between border-b border-primario/5 pb-1.5">
                    <span className="text-texto/60">Equipo:</span>
                    <span className="font-bold text-texto">{trackedTicket.assetCode} - {trackedTicket.assetName}</span>
                  </div>
                  <div className="flex justify-between border-b border-primario/5 pb-1.5">
                    <span className="text-texto/60">Ubicación:</span>
                    <span className="text-texto">{trackedTicket.location}</span>
                  </div>
                  <div className="flex justify-between border-b border-primario/5 pb-1.5">
                    <span className="text-texto/60">Reportado por:</span>
                    <span className="text-texto">{trackedTicket.reportedBy} ({trackedTicket.reportedRole})</span>
                  </div>
                  <div className="flex justify-between border-b border-primario/5 pb-1.5">
                    <span className="text-texto/60">Fecha:</span>
                    <span className="text-texto">{new Date(trackedTicket.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="pt-1">
                    <span className="text-texto/60 block mb-1">Descripción:</span>
                    <p className="p-2.5 rounded-lg bg-white border border-neutral-200 text-texto font-medium">
                      {trackedTicket.description}
                    </p>
                  </div>

                  {trackedTicket.photoUrl && (
                    <div className="pt-2">
                      <span className="text-texto/60 block mb-1">Foto de Evidencia:</span>
                      <img 
                        src={trackedTicket.photoUrl} 
                        alt="Evidencia avería" 
                        className="w-full max-h-48 object-cover rounded-xl border border-neutral-200"
                      />
                    </div>
                  )}

                  {trackedTicket.technicianNotes && (
                    <div className="pt-2">
                      <span className="text-emerald-700 font-bold block mb-1">
                        Nota Técnica de Solución:
                      </span>
                      <p className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium">
                        {trackedTicket.technicianNotes}
                        {trackedTicket.technicianName && (
                          <span className="block text-[10px] text-emerald-700/70 mt-1">
                            Atendido por: {trackedTicket.technicianName}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {activeTab === 'tutorial' && (
          <HelpDeskTutorialTab
            onStartReporting={() => setActiveTab('report')}
            onSelectAssetCode={(code) => {
              setSelectedAssetCode(code);
              setSearchParams({ asset: code });
            }}
          />
        )}

        <div className="mt-12 p-6 rounded-3xl bg-white border border-neutral-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primario font-bold text-xs uppercase tracking-wider">
              <Wrench className="w-4 h-4" />
              <span>Soporte Técnico Institucional</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-texto">
              {config.technicianName || 'Responsable de Soporte & Mantenimiento'}
            </p>
            <p className="text-xs text-texto/60 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-texto/40" />
              <span>{config.supportHours || 'Lunes a Viernes: 07:00 - 15:30'}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {config.technicianPhone && (
              <a
                href={`tel:${config.technicianPhone}`}
                className="px-3.5 py-2 rounded-xl bg-primario/5 text-primario hover:bg-primario hover:text-white font-bold transition-all flex items-center gap-1.5 border border-primario/15"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{config.technicianPhone}</span>
              </a>
            )}

            {config.technicianEmail && (
              <a
                href={`mailto:${config.technicianEmail}`}
                className="px-3.5 py-2 rounded-xl bg-neutral-100 text-texto hover:bg-neutral-200 font-bold transition-all flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-texto/50" />
                <span>{config.technicianEmail}</span>
              </a>
            )}
          </div>
        </div>

        <QrCameraScanner
          isOpen={isCameraScannerOpen}
          onClose={() => setIsCameraScannerOpen(false)}
          onScanSuccess={(code) => {
            const clean = code.toUpperCase();
            setSelectedAssetCode(clean);
            setSearchParams({ asset: clean });
            setActiveTab('report');
          }}
        />

        <HelpDeskTutorialModal
          isOpen={isTutorialModalOpen}
          onClose={() => setIsTutorialModalOpen(false)}
          onStartReporting={() => {
            setIsTutorialModalOpen(false);
            setActiveTab('report');
          }}
        />

      </div>
    </div>
  );
}
