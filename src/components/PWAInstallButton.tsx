import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`inline-flex items-center gap-1.5 rounded-full border border-primario/20 bg-white hover:bg-primario/5 text-texto/80 hover:text-primario px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-all cursor-pointer ${className}`}
        title="Instalar aplicación en tu dispositivo"
      >
        <Download className="w-3.5 h-3.5 text-primario" />
        <span>Instalar App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center gap-1.5 rounded-full border border-primario/20 bg-white hover:bg-primario/5 text-texto/80 hover:text-primario px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-all cursor-pointer ${className}`}
          title="Instalar en iPhone o iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-primario" />
          <span>Instalar App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-primario/10 relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-2 rounded-full text-texto/50 hover:bg-neutral-100 hover:text-texto transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-primario/10 text-primario flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-texto">Instalar en iPhone o iPad</h3>
              <p className="mt-2 text-sm text-texto/70 leading-relaxed">
                Para instalar la app de la institución y tenerla siempre a mano en tu pantalla de inicio:
              </p>

              <ol className="mt-4 space-y-2 text-xs font-medium text-texto/80 bg-primario/5 p-4 rounded-2xl border border-primario/10 list-decimal list-inside">
                <li>Toca el botón <strong>Compartir</strong> (ícono con flecha hacia arriba) en la barra inferior de Safari.</li>
                <li>Desplázate hacia abajo y selecciona <strong>"Agregar a la pantalla de inicio"</strong>.</li>
                <li>Toca <strong>"Agregar"</strong> en la esquina superior derecha.</li>
              </ol>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-full bg-primario py-2.5 text-xs font-bold text-white hover:bg-primario/90 transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowIOSGuide(true)}
        className={`inline-flex items-center gap-1.5 rounded-full border border-primario/20 bg-white hover:bg-primario/5 text-texto/80 hover:text-primario px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-all cursor-pointer ${className}`}
        title="Instalar en tu dispositivo"
      >
        <Download className="w-3.5 h-3.5 text-primario" />
        <span>Instalar App</span>
      </button>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-primario/10 relative">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-texto/50 hover:bg-neutral-100 hover:text-texto transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-primario/10 text-primario flex items-center justify-center mb-4">
              <Download className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-texto">Instalar Aplicación</h3>
            <p className="mt-2 text-sm text-texto/70 leading-relaxed">
              Puedes instalar esta app directamente desde el menú de tu navegador:
            </p>

            <div className="mt-4 space-y-2 text-xs font-medium text-texto/80 bg-primario/5 p-4 rounded-2xl border border-primario/10">
              <p>• <strong>En Chrome / Edge / Android:</strong> Presiona el menú (tres puntos) y elige <strong>"Instalar aplicación"</strong> o el ícono de instalación en la barra de direcciones.</p>
              <p>• <strong>En iPhone / Safari:</strong> Toca <strong>Compartir</strong> y selecciona <strong>"Agregar a Inicio"</strong>.</p>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-full bg-primario py-2.5 text-xs font-bold text-white hover:bg-primario/90 transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
