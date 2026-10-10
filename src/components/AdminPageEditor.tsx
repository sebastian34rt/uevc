import React, { useState, useEffect } from 'react';
import { useSiteContent } from '../context/SiteContentContext';
import { SiteContent, defaultSiteContent } from '../types/siteContent';
import { 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  Building2, 
  BookOpen, 
  GraduationCap, 
  Phone, 
  Globe, 
  ExternalLink,
  AlertCircle,
  Ticket,
  Sparkles,
  ShieldCheck,
  QrCode,
  Link2
} from 'lucide-react';
import { motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { cleanDomainUrl, getPublicSiteUrl, DEFAULT_PUBLIC_DOMAIN } from '../utils/domainConfig';

interface AdminPageEditorProps {
  onNavigateTab?: (tab: string) => void;
}

export default function AdminPageEditor({ onNavigateTab }: AdminPageEditorProps = {}) {
  const { content, updateContent, resetToDefaults, isSaving } = useSiteContent();
  const [formData, setFormData] = useState<SiteContent>(content);
  const [activeSection, setActiveSection] = useState<'identity' | 'about' | 'programs' | 'contact' | 'platforms' | 'sorteos'>('identity');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setFormData(content);
  }, [content]);

  const handleChange = (field: keyof SiteContent, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await updateContent(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setErrorMsg('Error al guardar los cambios: ' + (err?.message || 'Inténtelo de nuevo'));
    }
  };

  const handleReset = async () => {
    try {
      await resetToDefaults();
      setFormData(defaultSiteContent);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setErrorMsg('Error al restablecer: ' + (err?.message || 'Inténtelo de nuevo'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-primario/10">
        <div>
          <h2 className="text-2xl font-bold text-texto">Administrador de Contenido de la Página</h2>
          <p className="text-sm text-texto/60 mt-1">
            Modifica la información, textos institucionales, teléfonos, enlaces y descripciones que se muestran en el sitio web.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-texto/60 hover:text-red-600 hover:bg-red-50 border border-primario/10 transition-colors disabled:opacity-50"
            title="Restablecer textos a los valores originales"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restablecer
          </button>

          <a 
            href="/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-primario bg-primario/5 hover:bg-primario/10 border border-primario/10 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Ver Sitio Web
          </a>
        </div>
      </div>

      {saveSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 shadow-sm"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-sm font-semibold">
            ¡Información guardada con éxito! Los cambios ya se reflejan en tiempo real en la página web.
          </div>
        </motion.div>
      )}

      {errorMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-center gap-3 shadow-sm"
        >
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <div className="text-sm font-semibold">{errorMsg}</div>
        </motion.div>
      )}

      <div className="flex flex-wrap gap-2 p-1.5 bg-primario/5 rounded-2xl border border-primario/10">
        <button
          type="button"
          onClick={() => setActiveSection('identity')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'identity' 
              ? 'bg-white text-primario shadow-sm' 
              : 'text-texto/60 hover:text-texto hover:bg-white/50'
          }`}
        >
          <Building2 className="w-4 h-4" /> Portada e Identidad
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('about')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'about' 
              ? 'bg-white text-primario shadow-sm' 
              : 'text-texto/60 hover:text-texto hover:bg-white/50'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Sobre Nosotros
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('programs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'programs' 
              ? 'bg-white text-primario shadow-sm' 
              : 'text-texto/60 hover:text-texto hover:bg-white/50'
          }`}
        >
          <GraduationCap className="w-4 h-4" /> Oferta Educativa
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('contact')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'contact' 
              ? 'bg-white text-primario shadow-sm' 
              : 'text-texto/60 hover:text-texto hover:bg-white/50'
          }`}
        >
          <Phone className="w-4 h-4" /> Contacto y Admisiones
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('platforms')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'platforms' 
              ? 'bg-white text-primario shadow-sm' 
              : 'text-texto/60 hover:text-texto hover:bg-white/50'
          }`}
        >
          <Globe className="w-4 h-4" /> Plataformas y Redes
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('sorteos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'sorteos' 
              ? 'bg-white text-alerta shadow-sm ring-1 ring-alerta/20' 
              : 'text-texto/60 hover:text-texto hover:bg-white/50'
          }`}
        >
          <Ticket className="w-4 h-4 text-alerta" /> Sorteos & Rifas
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
          {activeSection === 'identity' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 bg-white p-6 md:p-8 rounded-3xl border border-primario/10 shadow-sm">
            <div className="border-b border-primario/10 pb-4">
              <h3 className="text-lg font-bold text-texto">Portada Principal e Identidad</h3>
              <p className="text-xs text-texto/60">Configura los textos principales que ven los visitantes al entrar al sitio web.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* TARJETA DE CONFIGURACIÓN DEL DOMINIO PARA CÓDIGOS QR */}
              <div className="md:col-span-2 p-5 bg-gradient-to-r from-blue-50/90 to-indigo-50/70 rounded-2xl border-2 border-blue-200/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-primario text-white shrink-0 shadow-xs">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-slate-900">
                          Dominio Oficial para Códigos QR e Impresiones
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Escaneo Móvil Activo
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Este es el enlace al que ingresan automáticamente los usuarios al escanear los códigos QR de los <strong>boletos de sorteos</strong> o los <strong>equipos de HelpDesk</strong> con la cámara de su celular.
                      </p>
                    </div>
                  </div>

                  {/* Previsualización en Vivo del QR */}
                  <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-blue-200 shrink-0 self-start">
                    <QRCodeSVG 
                      value={formData.publicDomain || DEFAULT_PUBLIC_DOMAIN}
                      size={58}
                      level="M"
                      includeMargin={true}
                    />
                    <div className="text-[10px] space-y-0.5">
                      <span className="font-bold text-slate-800 block">QR de Prueba</span>
                      <span className="text-slate-500 text-[9px] block">Apunta tu cámara</span>
                      <a
                        href={formData.publicDomain || DEFAULT_PUBLIC_DOMAIN}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primario font-bold hover:underline inline-flex items-center gap-1 mt-1 text-[10px]"
                      >
                        <ExternalLink className="w-3 h-3" /> Abrir enlace
                      </a>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    URL / Dominio Público (HTTPS)
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={formData.publicDomain || ''}
                      onChange={(e) => handleChange('publicDomain', e.target.value)}
                      placeholder="https://uevc.vercel.app"
                      className="w-full pl-4 pr-24 py-3 rounded-xl border border-blue-300 focus:border-primario focus:ring-2 focus:ring-primario/20 outline-none text-sm font-mono text-slate-900 bg-white font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const origin = typeof window !== 'undefined' ? window.location.origin : '';
                        if (origin && !origin.includes('localhost') && !origin.includes('ais-dev-')) {
                          handleChange('publicDomain', origin);
                        } else {
                          handleChange('publicDomain', 'https://uevc.vercel.app');
                        }
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Detectar
                    </button>
                  </div>
                </div>

                {/* Botones de Selección Rápida */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="text-[11px] font-bold text-slate-500">Accesos rápidos:</span>
                  <button
                    type="button"
                    onClick={() => handleChange('publicDomain', 'https://uevc.vercel.app')}
                    className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      formData.publicDomain === 'https://uevc.vercel.app'
                        ? 'bg-primario text-white border-primario shadow-2xs font-bold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🌐 Vercel (https://uevc.vercel.app)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChange('publicDomain', 'https://virgendelcisne.edu.ec')}
                    className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      formData.publicDomain === 'https://virgendelcisne.edu.ec'
                        ? 'bg-primario text-white border-primario shadow-2xs font-bold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🏫 Institucional (https://virgendelcisne.edu.ec)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Nombre Oficial de la Institución</label>
                <input
                  type="text"
                  value={formData.institutionName}
                  onChange={(e) => handleChange('institutionName', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="Ej: Unidad Educativa Virgen del Cisne"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Nombre Corto / Marca</label>
                <input
                  type="text"
                  value={formData.shortName}
                  onChange={(e) => handleChange('shortName', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="Ej: Virgen del Cisne"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Lema Superior (Insignia)</label>
                <input
                  type="text"
                  value={formData.institutionBadge}
                  onChange={(e) => handleChange('institutionBadge', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="Ej: Educamos mentes, formamos corazones"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Título de la Portada (Hero)</label>
                <input
                  type="text"
                  value={formData.heroTitle}
                  onChange={(e) => handleChange('heroTitle', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="Ej: Unidad Educativa Virgen del Cisne."
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Descripción de Bienvenida (Hero)</label>
                <textarea
                  rows={3}
                  value={formData.heroSubtitle}
                  onChange={(e) => handleChange('heroSubtitle', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="Describe la propuesta de valor educativa..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Años de Trayectoria (Insignia Flotante)</label>
                <input
                  type="text"
                  value={formData.experienceYears}
                  onChange={(e) => handleChange('experienceYears', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="Ej: +20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Etiqueta de Años</label>
                <input
                  type="text"
                  value={formData.experienceLabel}
                  onChange={(e) => handleChange('experienceLabel', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="Ej: Años de excelencia"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Subtexto de Años</label>
                <input
                  type="text"
                  value={formData.experienceSublabel}
                  onChange={(e) => handleChange('experienceSublabel', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="Ej: Formando generaciones"
                />
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === 'about' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 bg-white p-6 md:p-8 rounded-3xl border border-primario/10 shadow-sm">
            <div className="border-b border-primario/10 pb-4">
              <h3 className="text-lg font-bold text-texto">Sección "Sobre Nosotros"</h3>
              <p className="text-xs text-texto/60">Actualiza las autoridades institucionales, la misión, visión y principios rectores.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Autoridad Principal (Nombre)</label>
                <input
                  type="text"
                  value={formData.aboutPrincipalAuthority}
                  onChange={(e) => handleChange('aboutPrincipalAuthority', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="Ej: Marjorie Cecibell Floreano Mateo"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Cargo / Título de la Autoridad</label>
                <input
                  type="text"
                  value={formData.aboutPrincipalRole}
                  onChange={(e) => handleChange('aboutPrincipalRole', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="Ej: Autoridad Principal / Rectora"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Lema Institucional</label>
                <input
                  type="text"
                  value={formData.aboutSlogan}
                  onChange={(e) => handleChange('aboutSlogan', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="Ej: Educar con profesionalismo y calidad humana"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Nuestra Misión</label>
                <textarea
                  rows={4}
                  value={formData.aboutMission}
                  onChange={(e) => handleChange('aboutMission', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto leading-relaxed"
                  placeholder="Escribe la misión institucional..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Nuestra Visión</label>
                <textarea
                  rows={4}
                  value={formData.aboutVision}
                  onChange={(e) => handleChange('aboutVision', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto leading-relaxed"
                  placeholder="Escribe la visión institucional..."
                />
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === 'programs' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 bg-white p-6 md:p-8 rounded-3xl border border-primario/10 shadow-sm">
            <div className="border-b border-primario/10 pb-4">
              <h3 className="text-lg font-bold text-texto">Niveles Educativos y Oferta</h3>
              <p className="text-xs text-texto/60">Describe las características y enfoques de cada nivel académico de la institución.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Bachillerato</label>
                <textarea
                  rows={3}
                  value={formData.programBachillerato}
                  onChange={(e) => handleChange('programBachillerato', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="Descripción para Bachillerato..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Básica Superior</label>
                <textarea
                  rows={3}
                  value={formData.programSuperior}
                  onChange={(e) => handleChange('programSuperior', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="Descripción para Básica Superior..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Básica Elemental</label>
                <textarea
                  rows={3}
                  value={formData.programElemental}
                  onChange={(e) => handleChange('programElemental', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="Descripción para Básica Elemental..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Inicial</label>
                <textarea
                  rows={3}
                  value={formData.programInicial}
                  onChange={(e) => handleChange('programInicial', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="Descripción para Inicial..."
                />
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === 'contact' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 bg-white p-6 md:p-8 rounded-3xl border border-primario/10 shadow-sm">
            <div className="border-b border-primario/10 pb-4">
              <h3 className="text-lg font-bold text-texto">Contacto, Ubicación y Admisiones</h3>
              <p className="text-xs text-texto/60">Configura los números de atención, dirección física y los enlaces a formularios de Google.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Dirección / Ubicación Física</label>
                <input
                  type="text"
                  value={formData.contactAddress}
                  onChange={(e) => handleChange('contactAddress', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="Ej: Cantón Salinas, Provincia de Santa Elena, Ecuador"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Teléfono de Contacto / Celular</label>
                <input
                  type="text"
                  value={formData.contactPhone}
                  onChange={(e) => handleChange('contactPhone', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="Ej: 0981179375"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Correo Electrónico Institucional</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleChange('contactEmail', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="Ej: contacto@virgendelcisne.edu.ec"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Horario de Atención</label>
                <input
                  type="text"
                  value={formData.contactSchedule}
                  onChange={(e) => handleChange('contactSchedule', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="Ej: Lunes a Viernes: 8:00 AM - 5:00 PM"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Enlace a Formulario de Inscripción (Nuevos)</label>
                <input
                  type="url"
                  value={formData.enrollmentFormUrl}
                  onChange={(e) => handleChange('enrollmentFormUrl', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="https://docs.google.com/forms/..."
                />
                <span className="text-[11px] text-texto/50 mt-1 block">El botón 'Inscripción' en la sección de contacto llevará a este enlace.</span>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Enlace a Formulario 'Seguir en el Instituto'</label>
                <input
                  type="url"
                  value={formData.continueFormUrl}
                  onChange={(e) => handleChange('continueFormUrl', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="https://docs.google.com/forms/..."
                />
                <span className="text-[11px] text-texto/50 mt-1 block">El botón 'Seguir en el Instituto' en la sección de contacto llevará a este enlace.</span>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Ubicación en Google Maps (Búsqueda o Coordenadas)</label>
                <input
                  type="text"
                  value={formData.mapsEmbedQuery}
                  onChange={(e) => handleChange('mapsEmbedQuery', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="Unidad Educativa Virgen del Cisne,Salinas,Ecuador"
                />
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === 'platforms' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 bg-white p-6 md:p-8 rounded-3xl border border-primario/10 shadow-sm">
            <div className="border-b border-primario/10 pb-4">
              <h3 className="text-lg font-bold text-texto">Plataformas Virtuales y Redes Sociales</h3>
              <p className="text-xs text-texto/60">Configura los accesos a los sistemas escolares y perfiles sociales oficiales.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Enlace a Sistema Académico (Idukay / Moodle)</label>
                <input
                  type="url"
                  value={formData.idukayUrl}
                  onChange={(e) => handleChange('idukayUrl', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="https://idukay.net/"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Enlace a Consulta de Facturas</label>
                <input
                  type="text"
                  value={formData.billsUrl}
                  onChange={(e) => handleChange('billsUrl', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Página Oficial de Facebook</label>
                <input
                  type="url"
                  value={formData.facebookUrl}
                  onChange={(e) => handleChange('facebookUrl', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="https://www.facebook.com/..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Instagram (Opcional)</label>
                <input
                  type="text"
                  value={formData.instagramUrl}
                  onChange={(e) => handleChange('instagramUrl', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="https://www.instagram.com/..."
                />
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === 'sorteos' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 bg-white p-6 md:p-8 rounded-3xl border border-primario/10 shadow-sm">
            <div className="border-b border-primario/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold bg-alerta/10 text-alerta border border-alerta/20 mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  Módulo de Sorteos 100% Integrado
                </div>
                <h3 className="text-lg font-bold text-texto">Portal de Sorteos & Rifas Institucionales (/sorteos)</h3>
                <p className="text-xs text-texto/60">Configura los textos, insignias, garantías de transparencia y el banner destacado en la portada principal.</p>
              </div>

              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('sorteos')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-alerta hover:bg-alerta/90 text-white font-bold text-xs shadow-sm transition-all shrink-0 cursor-pointer"
                >
                  <Ticket className="w-4 h-4" />
                  Abrir Gestor de Boletos y Ruleta
                </button>
              )}
            </div>

            {/* Banner de acceso operativo */}
            <div className="p-4 bg-primario/[4%] border border-primario/15 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-primario shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-texto">¿Deseas crear sorteos, añadir boletos con datos de ganador o girar la ruleta?</div>
                  <div className="text-[11px] text-texto/60">
                    La creación de rifas, registro de participantes (para notificar a ganadores), impresión masiva en 5 densidades y la ruleta se controlan en el módulo especializado.
                  </div>
                </div>
              </div>
              <a
                href="/sorteos"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primario/20 text-primario hover:bg-primario/10 text-xs font-bold shrink-0 self-start sm:self-auto"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Ver Portal Público
              </a>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Insignia / Badge Superior</label>
                <input
                  type="text"
                  value={formData.sorteosHeroBadge || ''}
                  onChange={(e) => handleChange('sorteosHeroBadge', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="Ej: Transparencia & Verificación Oficial"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Título Principal de la Sección</label>
                <input
                  type="text"
                  value={formData.sorteosHeroTitle || ''}
                  onChange={(e) => handleChange('sorteosHeroTitle', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="Ej: Sorteos & Rifas Institucionales"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Descripción Institucional del Portal</label>
                <textarea
                  rows={2}
                  value={formData.sorteosHeroDescription || ''}
                  onChange={(e) => handleChange('sorteosHeroDescription', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="Portal oficial de verificación digital y transparencia de sorteos de la..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Garantía de Seguridad y Verificación Antifraude</label>
                <textarea
                  rows={2}
                  value={formData.sorteosSecurityGuarantee || ''}
                  onChange={(e) => handleChange('sorteosSecurityGuarantee', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="Cada boleto cuenta con un código único de 9 dígitos y código QR de validación..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Teléfono / WhatsApp Oficial para Ganadores</label>
                <input
                  type="text"
                  value={formData.sorteosClaimContact || ''}
                  onChange={(e) => handleChange('sorteosClaimContact', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="Ej: 0981179375"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Banner Promocional en Portada Principal (Home)</label>
                <select
                  value={formData.sorteosShowHomeBanner === 'false' ? 'false' : 'true'}
                  onChange={(e) => handleChange('sorteosShowHomeBanner', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto bg-white"
                >
                  <option value="true">Activado (Mostrar banner en la página de inicio)</option>
                  <option value="false">Desactivado (Ocultar banner en la página de inicio)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">Texto Destacado del Banner en Portada Principal</label>
                <input
                  type="text"
                  value={formData.sorteosHomeBannerText || ''}
                  onChange={(e) => handleChange('sorteosHomeBannerText', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-1 focus:ring-primario outline-none text-sm text-texto"
                  placeholder="¡Participa en nuestros sorteos benéficos o verifica la autenticidad de tu boleto con su código de 9 dígitos!"
                />
              </div>
            </div>
          </motion.div>
        )}

          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-primario/10 shadow-sm">
            <div className="text-xs text-texto/60 font-medium hidden sm:block">
              Guarda los cambios para que se actualicen inmediatamente en todo el sitio web.
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primario hover:bg-primario/90 text-white font-bold px-8 py-3 rounded-xl text-sm transition-all shadow-md shadow-primario/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Guardando cambios...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Guardar Todos los Cambios
                </>
              )}
            </button>
          </div>
        </form>
    </div>
  );
}
