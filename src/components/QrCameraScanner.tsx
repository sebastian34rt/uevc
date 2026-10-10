import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, X, RefreshCw, AlertCircle, CheckCircle2, Upload, Keyboard, ArrowRight } from 'lucide-react';

interface QrCameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export default function QrCameraScanner({ isOpen, onClose, onScanSuccess }: QrCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isNoDeviceFound, setIsNoDeviceFound] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const handleDetectedCode = (rawCode: string) => {
    const raw = rawCode.trim();
    let detectedAsset = raw;

    try {
      if (raw.includes('asset=')) {
        const url = new URL(raw);
        const param = url.searchParams.get('asset');
        if (param) detectedAsset = param;
      }
    } catch {
      // url sin formato o codigo directo
    }

    if (navigator.vibrate) {
      try {
        navigator.vibrate(100);
      } catch {}
    }

    setScannedResult(detectedAsset);
    stopCamera();

    setTimeout(() => {
      onScanSuccess(detectedAsset);
      onClose();
    }, 500);
  };

  const startCamera = async () => {
    setErrorMessage('');
    setIsNoDeviceFound(false);
    setScannedResult(null);
    setIsScanning(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Navegador sin soporte de cámara web.');
      }

      let stream: MediaStream | null = null;

      // intentar camara trasera primero
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
      } catch (firstErr: any) {
        // si falla usar la camara por defecto
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (secondErr: any) {
          throw secondErr;
        }
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setHasPermission(true);
        scanFrame();
      }
    } catch (err: any) {
      setHasPermission(false);
      setIsScanning(false);

      const errName = err?.name || '';
      const errMsg = err?.message || '';

      if (
        errName === 'NotFoundError' || 
        errName === 'DevicesNotFoundError' || 
        errMsg.toLowerCase().includes('device not found') ||
        errMsg.toLowerCase().includes('not found')
      ) {
        setIsNoDeviceFound(true);
        setErrorMessage('No se encontró ninguna cámara o webcam conectada en este equipo.');
      } else if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setErrorMessage('Permiso de cámara bloqueado. Activa el permiso en la barra del navegador.');
      } else {
        setErrorMessage('No se pudo iniciar la cámara en este dispositivo.');
      }
    }
  };

  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleDetectedCode(code.data);
        return;
      }
    }

    animationFrameId.current = requestAnimationFrame(scanFrame);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleDetectedCode(code.data);
          } else {
            setErrorMessage('No se detectó un código QR en la imagen seleccionada. Prueba con otra foto o escribe el código.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleDetectedCode(manualCode.trim().toUpperCase());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-neutral-200 animate-fade-in">
        
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-neutral-100 bg-neutral-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primario/10 text-primario flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-texto">Escanear Código QR del Equipo</h3>
              <p className="text-[11px] text-texto/60">Apunta la cámara o carga una foto del sticker</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-texto/40 hover:text-texto hover:bg-neutral-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative bg-neutral-900 aspect-[4/3] flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${errorMessage ? 'hidden' : 'block'}`}
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />

          {isScanning && !scannedResult && !errorMessage && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
              <div className="w-48 h-48 border-2 border-primario rounded-2xl relative shadow-lg">
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                <div className="w-full h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] absolute top-0 animate-[scan_2s_ease-in-out_infinite]"></div>
              </div>
            </div>
          )}

          {scannedResult && (
            <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white text-center">
              <CheckCircle2 className="w-14 h-14 text-emerald-400 mb-2 animate-bounce" />
              <div className="text-xs uppercase font-extrabold tracking-wider text-emerald-300">
                ¡Código QR Detectado!
              </div>
              <div className="text-xl font-mono font-black mt-1 text-white bg-white/20 px-4 py-1 rounded-xl">
                {scannedResult}
              </div>
              <div className="text-xs text-white/80 mt-2">Cargando reporte en el HelpDesk...</div>
            </div>
          )}

          {errorMessage && (
            <div className="p-6 flex flex-col items-center justify-center text-center text-white space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <AlertCircle className="w-7 h-7" />
              </div>
              
              <div>
                <p className="text-xs font-bold text-neutral-100 max-w-xs mx-auto leading-relaxed">
                  {errorMessage}
                </p>
                {isNoDeviceFound && (
                  <p className="text-[11px] text-neutral-400 mt-1">
                    (Común si estás en una computadora de escritorio sin webcam conectada)
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 w-full">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-primario text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-primario/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir Foto con QR</span>
                </button>

                <button
                  type="button"
                  onClick={startCamera}
                  className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reintentar</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-neutral-50 border-t border-neutral-100 space-y-3">
          <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Keyboard className="w-3.5 h-3.5 text-texto/40 absolute left-3 top-2.5" />
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="O escribe el código (ej. LAB1-MOU-01)"
                className="w-full pl-8 pr-3 py-1.5 text-xs font-mono uppercase bg-white rounded-xl border border-neutral-300 outline-none focus:ring-2 focus:ring-primario/20"
              />
            </div>
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="bg-primario text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-primario/90 transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1"
            >
              <span>Aplicar</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-texto/50 pt-1 border-t border-neutral-200/60">
            <span>¿Sin cámara? Escribe el código o sube una foto.</span>
            <button
              type="button"
              onClick={onClose}
              className="text-texto/60 hover:text-texto font-bold cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
