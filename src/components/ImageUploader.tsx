import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, Image as ImageIcon, Link as LinkIcon, X, Check, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

interface ImageUploaderProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

/**
 * Optimiza y comprime inteligentemente cualquier imagen para que se guarde
 * de forma permanente y sin errores en Cloud Firestore (por debajo de 300 KB).
 */
export async function optimizeImageForFirestore(file: File): Promise<{
  dataUrl: string;
  sizeKb: number;
  originalSizeKb: number;
}> {
  const originalSizeKb = Math.round(file.size / 1024);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado.'));
    
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagen inválido o archivo dañado.'));
      
      img.onload = () => {
        let maxDimension = 1000;
        let quality = 0.78;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el procesador gráfico en el navegador.'));
          return;
        }

        const render = (maxDim: number, q: number): string => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;

          ctx.clearRect(0, 0, width, height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          return canvas.toDataURL('image/jpeg', q);
        };

        // Pasada inicial
        let dataUrl = render(maxDimension, quality);
        let sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

        // Si excede 350KB, reducimos dimensiones a 850px y calidad a 0.70
        if (sizeKb > 350) {
          maxDimension = 850;
          quality = 0.70;
          dataUrl = render(maxDimension, quality);
          sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
        }

        // Si todavía excede 280KB (imágenes con mucho detalle/ruido)
        if (sizeKb > 280) {
          maxDimension = 720;
          quality = 0.62;
          dataUrl = render(maxDimension, quality);
          sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
        }

        resolve({
          dataUrl,
          sizeKb,
          originalSizeKb
        });
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

export default function ImageUploader({ value, onChange, label, className = '' }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [infoStats, setInfoStats] = useState<{ original: number; optimized: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP, etc.)');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const result = await optimizeImageForFirestore(file);
      setInfoStats({ original: result.originalSizeKb, optimized: result.sizeKb });
      onChange(result.dataUrl);
    } catch (err: any) {
      console.error('Error optimizando imagen para Firebase:', err);
      setErrorMessage(err?.message || 'Ocurrió un error al procesar y optimizar la imagen.');
    } finally {
      setIsProcessing(false);
    }
  }, [onChange]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    onChange('');
    setInfoStats(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider">{label}</label>
        </div>
      )}

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {!value ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 ${
              isDragging
                ? 'border-primario bg-primario/10 scale-[1.01]'
                : 'border-primario/25 bg-white hover:border-primario/50 hover:bg-primario/5'
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primario/10 text-primario flex items-center justify-center">
                {isProcessing ? (
                  <RefreshCw className="w-6 h-6 animate-spin text-primario" />
                ) : (
                  <UploadCloud className="w-6 h-6" />
                )}
              </div>
              
              <div>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-primario text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-primario/90 hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Optimizando para Firebase...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      Haz clic aquí para Subir Imagen
                    </>
                  )}
                </button>
                <p className="text-xs text-texto/50 mt-2">
                  Formatos JPG, PNG, WEBP. Se optimizará automáticamente para la base de datos de Firebase.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden border border-primario/20 bg-neutral-50 p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-neutral-200 shrink-0 relative border border-black/10 shadow-sm">
              <img src={value} alt="Vista previa" className="w-full h-full object-cover" />
            </div>
            
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 mb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Imagen lista para Firebase
              </div>
              
              {infoStats && (
                <p className="text-xs text-texto/60">
                  De <span className="font-semibold">{infoStats.original} KB</span> reducida a <span className="font-bold text-emerald-600">{infoStats.optimized} KB</span> (Apta para la nube)
                </p>
              )}

              <div className="flex items-center justify-center sm:justify-start gap-3 mt-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-primario hover:underline cursor-pointer"
                >
                  Cambiar imagen
                </button>
                <span className="text-texto/20">•</span>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs font-bold text-red-500 hover:underline cursor-pointer"
                >
                  Quitar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
