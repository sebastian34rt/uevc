import React, { useState } from 'react';
import { 
  QrCode, Smartphone, Wrench, CheckCircle2, ArrowRight, ArrowLeft, 
  Sparkles, Laptop, ShieldCheck, Clock, Search, ChevronDown, ChevronUp, 
  FileText, AlertTriangle, ThumbsUp, X, Lightbulb, Camera, Check, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HelpDeskTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartReporting: () => void;
}

export function HelpDeskTutorialModal({ isOpen, onClose, onStartReporting }: HelpDeskTutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: '¡Bienvenido al Sistema HelpDesk!',
      subtitle: 'Plataforma oficial de soporte y mantenimiento escolar',
      badge: 'Introducción',
      icon: <Sparkles className="w-8 h-8 text-primario" />,
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-texto/80">
          <p className="leading-relaxed">
            El <strong>HelpDesk</strong> de la <strong>Unidad Educativa Virgen del Cisne</strong> es la herramienta donde estudiantes, docentes y personal pueden reportar de forma inmediata cualquier avería en computadoras, periféricos, proyectores, internet o pupitres.
          </p>
          <div className="p-4 rounded-2xl bg-primario/5 border border-primario/15 space-y-2">
            <div className="font-bold text-primario flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>¿Cuál es el objetivo?</span>
            </div>
            <p className="text-xs text-texto/70 leading-relaxed">
              Mantener todos los laboratorios y aulas 100% operativos, registrando cada falla con transparencia para que los técnicos puedan resolverla rápidamente.
            </p>
          </div>
        </div>
      )
    },
    {
      title: '1. Escanea la Etiqueta QR del Equipo',
      subtitle: 'Identificación automática en segundos',
      badge: 'Paso 1',
      icon: <QrCode className="w-8 h-8 text-primario" />,
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-texto/80">
          <p className="leading-relaxed">
            Cada equipo (mouse, teclado, monitor, PC o proyector) tiene pegado un <strong>sticker físico con su código QR</strong> único.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3.5 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-1">
              <div className="font-bold text-xs text-texto flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-primario" />
                <span>Con tu celular:</span>
              </div>
              <p className="text-[11px] text-texto/60">
                Apunta la cámara de tu teléfono al código QR. Toca la notificación y el formulario se abrirá con el equipo ya seleccionado.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-1">
              <div className="font-bold text-xs text-texto flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-primario" />
                <span>Desde la misma web:</span>
              </div>
              <p className="text-[11px] text-texto/60">
                Usa el botón <em>"Escanear QR con Cámara"</em> o escribe directamente el código (ej. <strong>LAB1-MOU-05</strong>).
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: '2. Describe la Falla Observada',
      subtitle: 'Explica qué problema presenta el activo',
      badge: 'Paso 2',
      icon: <Wrench className="w-8 h-8 text-primario" />,
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-texto/80">
          <p className="leading-relaxed">
            Elige el tipo de problema rápido (ej. <em>"Mouse no hace clic"</em>, <em>"Pantalla negra"</em> o <em>"Sin internet"</em>) y detalla qué ocurre.
          </p>
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-1.5 text-xs text-amber-900">
            <div className="font-bold flex items-center gap-1.5 text-amber-800">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span>Consejo útil:</span>
            </div>
            <p className="text-[11px] text-amber-800/80 leading-relaxed">
              Puedes subir una foto del problema directamente desde tu celular. Esto ayuda al técnico a llevar las herramientas o repuestos exactos antes de ir al laboratorio.
            </p>
          </div>
        </div>
      )
    },
    {
      title: '3. Recibe tu Ticket y Rastrea el Estado',
      subtitle: 'Seguimiento transparente en tiempo real',
      badge: 'Paso 3',
      icon: <CheckCircle2 className="w-8 h-8 text-emerald-600" />,
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-texto/80">
          <p className="leading-relaxed">
            Al enviar el formulario, el sistema genera de inmediato un código de ticket único (ej. <strong>TKT-4892</strong>).
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-neutral-200">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
              <div className="text-xs">
                <strong>Pendiente:</strong> El reporte ha llegado a la bandeja del personal técnico.
              </div>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-neutral-200">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
              <div className="text-xs">
                <strong>En Proceso:</strong> Un técnico está revisando o reparando el equipo en el laboratorio.
              </div>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-neutral-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
              <div className="text-xs">
                <strong>Resuelto:</strong> El equipo quedó operativo y puedes leer la solución técnica aplicada.
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-neutral-200 flex flex-col max-h-[92vh]">
        
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/80">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-primario/10 text-primario uppercase tracking-wider">
              {steps[currentStep].badge} ({currentStep + 1} de {steps.length})
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-texto/40 hover:text-texto hover:bg-neutral-200/50 transition-colors cursor-pointer"
            title="Cerrar tutorial"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-7 overflow-y-auto space-y-4 flex-1">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-primario/10 flex items-center justify-center shrink-0">
              {steps[currentStep].icon}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-texto leading-tight">
                {steps[currentStep].title}
              </h3>
              <p className="text-xs text-texto/60 mt-0.5 font-medium">
                {steps[currentStep].subtitle}
              </p>
            </div>
          </div>

          <div className="pt-2">
            {steps[currentStep].content}
          </div>
        </div>

        <div className="p-5 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentStep === idx ? 'w-6 bg-primario' : 'w-2 bg-neutral-300 hover:bg-neutral-400'
                }`}
                title={`Ir al paso ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-texto/70 hover:bg-neutral-200 transition-colors cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="bg-primario text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primario/90 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <span>Siguiente</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartReporting();
                }}
                className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <span>¡Entendido! Comenzar</span>
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export function HelpDeskTutorialTab({ onStartReporting, onSelectAssetCode }: { onStartReporting: () => void; onSelectAssetCode?: (code: string) => void }) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: '¿Cómo leo el código QR si la cámara de mi computadora no funciona?',
      a: 'Debajo de cada código QR impreso se encuentra el código alfanumérico visible (ej. LAB1-MOU-05). Puedes escribirlo directamente en el buscador de la pestaña "Reportar Avería", o seleccionar el aula y el equipo desde la lista desplegable.'
    },
    {
      q: '¿Quién puede realizar reportes en el sistema HelpDesk?',
      a: 'Cualquier estudiante, docente, personal administrativo o de conserjería de la institución que detecte un equipo dañado, sin internet o con problemas de hardware.'
    },
    {
      q: '¿Qué tipo de materiales o equipos puedo reportar?',
      a: 'Computadoras completas, pantallas, ratones (mouse), teclados, proyectores HDMI, parlantes de audio, cables de red, conexión WiFi, pupitres de estudiantes, iluminación y aires acondicionados de laboratorios y aulas.'
    },
    {
      q: '¿Cuánto tiempo tarda en atenderse una avería reportada?',
      a: 'Las averías con prioridad "Urgente" o "Alta" (como proyectores en clase o fallas eléctricas) son notificadas inmediatamente a los técnicos. El avance se puede consultar en cualquier momento con el número de ticket.'
    },
    {
      q: '¿Qué es el número de ticket y para qué sirve?',
      a: 'Es un código único (ej. TKT-1842) generado automáticamente al enviar el formulario. Te permite consultar el estado en la pestaña "Consultar Mi Ticket" para saber si el técnico ya lo revisó y qué solución aplicó.'
    }
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      
      <div className="bg-gradient-to-br from-primario/15 via-white to-primario/5 rounded-3xl p-6 sm:p-10 border border-primario/20 shadow-sm relative overflow-hidden">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primario/10 text-primario text-xs font-black uppercase tracking-wider">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Guía Rápida de Funcionamiento</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-texto tracking-tight">
            ¿Cómo funciona el Sistema HelpDesk & QR?
          </h2>
          <p className="text-xs sm:text-sm text-texto/70 leading-relaxed">
            Diseñado para que cualquier estudiante o docente reporte una falla en menos de <strong>30 segundos</strong> sin necesidad de trámites en papel ni demoras.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onStartReporting}
              className="bg-primario text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md hover:bg-primario/90 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Hacer un Reporte Ahora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-primario/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-black text-texto flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primario" />
            <span>El Ciclo de Atención en 4 Pasos Sencillos</span>
          </h3>
          <span className="text-xs text-texto/50 font-medium">100% Digital y en Vivo</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs hover:border-primario/40 transition-all flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">
                  01
                </div>
                <QrCode className="w-5 h-5 text-blue-500" />
              </div>
              <h4 className="font-extrabold text-sm text-texto mb-1">Escanear o Identificar</h4>
              <p className="text-xs text-texto/60 leading-relaxed">
                Apunta con tu celular al código QR pegado en la PC, mouse o pupitre, o escribe el código (ej. <code className="bg-neutral-100 px-1 py-0.5 rounded font-mono text-primario">LAB1-MOU-01</code>).
              </p>
            </div>
            <div className="text-[11px] font-bold text-blue-600 pt-2 border-t border-neutral-100 flex items-center gap-1">
              <span>Cero búsqueda manual</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs hover:border-primario/40 transition-all flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-sm">
                  02
                </div>
                <Wrench className="w-5 h-5 text-amber-500" />
              </div>
              <h4 className="font-extrabold text-sm text-texto mb-1">Detallar la Avería</h4>
              <p className="text-xs text-texto/60 leading-relaxed">
                Selecciona la falla con 1 clic (mouse dañado, sin internet, proyector apagado) y opcionalmente adjunta una foto como evidencia.
              </p>
            </div>
            <div className="text-[11px] font-bold text-amber-600 pt-2 border-t border-neutral-100 flex items-center gap-1">
              <span>Rápido y descriptivo</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs hover:border-primario/40 transition-all flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-sm">
                  03
                </div>
                <FileText className="w-5 h-5 text-purple-500" />
              </div>
              <h4 className="font-extrabold text-sm text-texto mb-1">Generación de Ticket</h4>
              <p className="text-xs text-texto/60 leading-relaxed">
                Recibes tu código de ticket (ej. <code className="bg-neutral-100 px-1 py-0.5 rounded font-mono text-purple-700">TKT-8412</code>). El técnico recibe la alerta de inmediato en su panel.
              </p>
            </div>
            <div className="text-[11px] font-bold text-purple-600 pt-2 border-t border-neutral-100 flex items-center gap-1">
              <span>Constancia inmediata</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs hover:border-primario/40 transition-all flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm">
                  04
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <h4 className="font-extrabold text-sm text-texto mb-1">Reparación y Cierre</h4>
              <p className="text-xs text-texto/60 leading-relaxed">
                El técnico soluciona el problema y deja nota de lo realizado (ej. <em>"Se cambió cable HDMI"</em>). Puedes ver la solución ingresando tu código.
              </p>
            </div>
            <div className="text-[11px] font-bold text-emerald-600 pt-2 border-t border-neutral-100 flex items-center gap-1">
              <span>Resolución documentada</span>
            </div>
          </div>

        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-primario/15 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-primario font-extrabold text-xs uppercase tracking-wider">
          <Laptop className="w-4 h-4" />
          <span>Simulador & Prueba Rápida</span>
        </div>
        <h3 className="text-lg font-black text-texto">
          ¿Quieres ver cómo se ve un equipo identificado?
        </h3>
        <p className="text-xs sm:text-sm text-texto/60 max-w-xl">
          Haz clic en uno de los códigos de ejemplo a continuación para cargarlo en el formulario de reporte y comprobar la rapidez del sistema:
        </p>

        <div className="flex flex-wrap gap-2.5 pt-1">
          {[
            { code: 'LAB1-MOU-01', label: '🖱️ Mouse #01 (Lab 1)' },
            { code: 'LAB1-TEC-05', label: '⌨️ Teclado #05 (Lab 1)' },
            { code: 'LAB2-PC-10', label: '🖥️ Computadora #10 (Lab 2)' },
            { code: 'AULA-PROY-01', label: '📽️ Proyector de Aula' }
          ].map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => {
                if (onSelectAssetCode) onSelectAssetCode(item.code);
                onStartReporting();
              }}
              className="px-3.5 py-2 rounded-xl border border-primario/25 bg-primario/5 text-primario font-bold text-xs hover:bg-primario hover:text-white transition-all cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <span>{item.label}</span>
              <span className="font-mono text-[10px] opacity-75">({item.code})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-primario font-bold text-xs uppercase tracking-wider">
          <HelpCircle className="w-4 h-4" />
          <span>Preguntas Frecuentes (FAQ)</span>
        </div>
        <h3 className="text-xl font-black text-texto">
          Dudas Comunes sobre el HelpDesk
        </h3>

        <div className="space-y-2.5 pt-2">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="border border-neutral-200 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-4 text-left font-bold text-xs sm:text-sm text-texto hover:bg-neutral-50 flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-primario shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-texto/40 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="p-4 pt-0 text-xs sm:text-sm text-texto/70 leading-relaxed border-t border-neutral-100 bg-neutral-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
