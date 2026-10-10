import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Key, 
  Lock, 
  ExternalLink, 
  ShieldAlert, 
  User, 
  Check, 
  Send, 
  Info,
  Calendar,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function AdminSecurityVerification() {
  const { 
    currentUser, 
    isMasterAdmin, 
    loginWithGoogle, 
    sendVerification, 
    sendPasswordReset, 
    reloadUser 
  } = useAuth();

  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const isGoogleProvider = currentUser?.providerData?.some(p => p.providerId === 'google.com');
  const isEmailVerified = !!currentUser?.emailVerified;
  const isFullyVerified = isGoogleProvider || isEmailVerified;

  const handleGoogleVerify = async () => {
    setIsLoadingGoogle(true);
    setFeedback(null);
    try {
      await loginWithGoogle();
      setFeedback({
        type: 'success',
        message: '¡Verificación completada exitosamente con tu cuenta de Google!'
      });
    } catch (err: any) {
      console.warn('Google verify notice:', err?.code || err?.message);
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'este dominio';
        setFeedback({
          type: 'error',
          message: `Dominio no autorizado para Google OAuth: "${domain}". Para validar tu cuenta, usa la opción "Enviar Correo de Verificación" o agrega este dominio en Firebase Console.`
        });
      } else {
        setFeedback({
          type: 'error',
          message: err?.message || 'Error al conectar con Google. Por favor intenta de nuevo.'
        });
      }
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handleSendVerificationEmail = async () => {
    if (!currentUser) return;
    setIsSendingVerification(true);
    setFeedback(null);
    try {
      await sendVerification();
      setFeedback({
        type: 'success',
        message: `Se ha enviado un enlace de verificación a ${currentUser.email}. Abre el correo y haz clic en el enlace para validar tu cuenta.`
      });
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/too-many-requests') {
        setFeedback({
          type: 'error',
          message: 'Se enviaron demasiadas solicitudes. Espera un par de minutos antes de reenviar.'
        });
      } else {
        setFeedback({
          type: 'error',
          message: 'No se pudo enviar el correo de verificación: ' + (err?.message || 'Intente de nuevo')
        });
      }
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handleCheckVerificationStatus = async () => {
    setIsCheckingStatus(true);
    setFeedback(null);
    try {
      const refreshedUser = await reloadUser();
      if (refreshedUser?.emailVerified) {
        setFeedback({
          type: 'success',
          message: '¡Confirmado! Tu correo electrónico ha sido verificado con éxito.'
        });
      } else {
        setFeedback({
          type: 'info',
          message: 'Tu correo aún figura como no verificado. Asegúrate de hacer clic en el enlace que enviamos a tu buzón y luego vuelve a presionar este botón.'
        });
      }
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: 'error',
        message: 'Error al actualizar el estado: ' + (err?.message || 'Intente de nuevo')
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleSendPasswordReset = async () => {
    const targetEmail = currentUser?.email;
    if (!targetEmail) {
      setFeedback({
        type: 'error',
        message: 'No hay un correo electrónico asociado a esta sesión.'
      });
      return;
    }

    setIsSendingReset(true);
    setFeedback(null);
    try {
      await sendPasswordReset(targetEmail);
      setFeedback({
        type: 'success',
        message: `Enlace de restablecimiento de contraseña enviado a ${targetEmail}. Revisa tu buzón.`
      });
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: 'error',
        message: 'Error al enviar enlace de contraseña: ' + (err?.message || 'Intente de nuevo')
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primario/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-primario mb-1">
            <ShieldCheck className="w-5 h-5 text-primario" />
            <span className="text-xs font-bold uppercase tracking-wider">Centro de Seguridad Administrativa</span>
          </div>
          <h2 className="text-2xl font-black text-texto">Verificación y Acceso de Administrador</h2>
          <p className="text-xs text-texto/60 mt-1">
            Gestiona los métodos de verificación oficial con Google, correo electrónico o credenciales institucionales.
          </p>
        </div>

        {/* Badge general de estado */}
        <div className="flex items-center gap-2">
          {isFullyVerified ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-2xl text-xs font-bold shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Identidad Verificada</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-2xl text-xs font-bold shadow-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Verificación Pendiente</span>
            </div>
          )}
        </div>
      </div>

      {/* Retroalimentación de acciones */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl text-xs font-semibold flex items-start gap-3 border ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
              : feedback.type === 'error'
              ? 'bg-red-50 text-red-900 border-red-200'
              : 'bg-blue-50 text-blue-900 border-blue-200'
          }`}
        >
          {feedback.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />}
          {feedback.type === 'error' && <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />}
          {feedback.type === 'info' && <Info className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />}
          <div className="flex-1">
            <p>{feedback.message}</p>
          </div>
          <button 
            type="button" 
            onClick={() => setFeedback(null)} 
            className="text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </motion.div>
      )}

      {/* Tarjeta de Resumen de Sesión Actual */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-primario/10 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {currentUser?.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt="Foto de perfil" 
                className="w-16 h-16 rounded-2xl object-cover border-2 border-primario/20 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-primario/10 text-primario flex items-center justify-center font-bold text-xl shadow-xs">
                {isMasterAdmin ? <Key className="w-8 h-8" /> : <User className="w-8 h-8" />}
              </div>
            )}
            
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-extrabold text-base text-texto">
                  {currentUser?.displayName || (isMasterAdmin ? 'Administrador Institucional' : (currentUser?.email ? currentUser.email.split('@')[0] : 'Sesión Activa'))}
                </h3>
                {isGoogleProvider && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">
                    <svg className="w-3 h-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    Google
                  </span>
                )}
                {isMasterAdmin && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200">
                    Clave Institucional
                  </span>
                )}
              </div>

              <p className="text-xs text-texto/60 font-mono">
                {currentUser?.email || 'Acceso por clave maestra institucional'}
              </p>

              <div className="flex items-center gap-3 pt-1 text-[11px] text-texto/50">
                <span>Método: {isGoogleProvider ? 'Google OAuth 2.0' : isMasterAdmin ? 'Clave Maestra' : 'Correo y Contraseña'}</span>
                <span>•</span>
                <span className="font-semibold text-emerald-700">
                  {isFullyVerified ? '✓ Autenticación Verificada' : '⚠️ Pendiente de Confirmar Correo'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {currentUser && !isGoogleProvider && (
              <button
                type="button"
                onClick={handleCheckVerificationStatus}
                disabled={isCheckingStatus}
                className="flex items-center gap-2 bg-primario/10 hover:bg-primario/15 text-primario px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                <span>{isCheckingStatus ? 'Comprobando...' : 'Comprobar Estado'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid con las 2 formas principales de verificación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 1. Verificación por Google */}
        <div className={`p-6 sm:p-7 rounded-3xl border transition-all ${
          isGoogleProvider 
            ? 'bg-gradient-to-br from-blue-50/50 via-white to-white border-blue-200 shadow-xs' 
            : 'bg-white border-neutral-200 shadow-xs hover:border-primario/30'
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 shadow-xs flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </div>

            {isGoogleProvider ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Activo y Verificado
              </span>
            ) : (
              <span className="text-xs font-bold text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">
                Disponible
              </span>
            )}
          </div>

          <h3 className="font-extrabold text-lg text-texto mb-1.5">Verificación con Google</h3>
          <p className="text-xs text-texto/60 leading-relaxed mb-6">
            Autenticación segura respaldada por Google OAuth 2.0. Proporciona verificación automática e instantánea del correo institucional o personal, con protección contra robo de identidad.
          </p>

          <div className="space-y-3 pt-4 border-t border-neutral-100 text-xs text-texto/70">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Verificación de correo sin esperas de confirmación</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Protección avanzada de cuenta institucional</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Ingreso con un solo clic desde cualquier equipo</span>
            </div>
          </div>

          <div className="mt-6 pt-2">
            {isGoogleProvider ? (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-blue-900 font-semibold truncate">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate">{currentUser?.email}</span>
                </div>
                <span className="text-[10px] font-extrabold text-blue-700 bg-white px-2 py-0.5 rounded-md shrink-0">
                  Google OK
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleVerify}
                disabled={isLoadingGoogle}
                className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-neutral-50 text-neutral-800 font-bold py-3 px-4 rounded-xl border border-neutral-300 shadow-xs hover:shadow transition-all text-xs cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>{isLoadingGoogle ? 'Conectando con Google...' : 'Verificar e Iniciar con Google'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Verificación por Correo Electrónico */}
        <div className={`p-6 sm:p-7 rounded-3xl border transition-all ${
          isEmailVerified 
            ? 'bg-gradient-to-br from-emerald-50/40 via-white to-white border-emerald-200 shadow-xs' 
            : 'bg-white border-neutral-200 shadow-xs hover:border-primario/30'
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primario/10 text-primario flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>

            {isEmailVerified ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Correo Confirmado
              </span>
            ) : currentUser?.email ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Pendiente de Enlace
              </span>
            ) : (
              <span className="text-xs font-bold text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">
                No registrado
              </span>
            )}
          </div>

          <h3 className="font-extrabold text-lg text-texto mb-1.5">Verificación por Correo</h3>
          <p className="text-xs text-texto/60 leading-relaxed mb-6">
            Envía un correo seguro con enlace firmado a tu dirección de administrador para comprobar la pertenencia del buzón institucional.
          </p>

          <div className="space-y-3 pt-4 border-t border-neutral-100 text-xs text-texto/70">
            <div className="flex items-center justify-between">
              <span className="text-texto/60">Buzón actual:</span>
              <span className="font-mono font-bold text-texto truncate max-w-[200px]">
                {currentUser?.email || 'Sin correo asociado'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-texto/60">Estado de verificación:</span>
              <span className={`font-bold ${isEmailVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
                {isEmailVerified ? '✓ Verificado en Firebase Auth' : '⚠️ Pendiente de confirmación'}
              </span>
            </div>
          </div>

          <div className="mt-6 pt-2 space-y-2.5">
            {currentUser?.email ? (
              <>
                <button
                  type="button"
                  onClick={handleSendVerificationEmail}
                  disabled={isSendingVerification}
                  className="w-full flex items-center justify-center gap-2 bg-primario hover:bg-primario/90 text-white font-bold py-3 px-4 rounded-xl shadow-xs transition-all text-xs cursor-pointer disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${isSendingVerification ? 'animate-spin' : ''}`} />
                  <span>
                    {isSendingVerification 
                      ? 'Enviando enlace...' 
                      : isEmailVerified 
                      ? 'Reenviar Enlace de Confirmación' 
                      : 'Enviar Correo de Verificación'}
                  </span>
                </button>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCheckVerificationStatus}
                    disabled={isCheckingStatus}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-texto text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                    <span>Comprobar Verificación</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendPasswordReset}
                    disabled={isSendingReset}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-texto text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <Lock className="w-3 h-3 text-texto/60" />
                    <span>{isSendingReset ? 'Enviando...' : 'Cambiar Clave'}</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="p-3 bg-neutral-50 rounded-xl text-center text-xs text-texto/60">
                Inicia sesión con correo electrónico o con Google para verificar tu buzón.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Tarjeta de Clave Institucional y Auditoría */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-primario/10 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-texto">Acceso con Clave Institucional (Modo Emergencia)</h4>
            <p className="text-xs text-texto/60">
              Uso reservado para emergencias o personal directivo con clave maestra de la Unidad Educativa Virgen del Cisne.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/70">
            <div className="text-[10px] font-bold uppercase tracking-wider text-texto/50 mb-1">Cifrado de Sesión</div>
            <div className="font-mono font-bold text-xs text-texto flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>TLS 1.3 / HTTPS</span>
            </div>
          </div>

          <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/70">
            <div className="text-[10px] font-bold uppercase tracking-wider text-texto/50 mb-1">Base de Datos</div>
            <div className="font-mono font-bold text-xs text-texto flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Firestore Conectado</span>
            </div>
          </div>

          <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/70">
            <div className="text-[10px] font-bold uppercase tracking-wider text-texto/50 mb-1">Nivel de Protección</div>
            <div className="font-mono font-bold text-xs text-texto flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primario" />
              <span>{isFullyVerified ? 'Máximo (Verificado)' : 'Básico (Requiere verificar)'}</span>
            </div>
          </div>
        </div>

        <div className="pt-2 text-xs text-texto/60 leading-relaxed">
          <p>
            <strong>Recomendación institucional:</strong> Para evitar que varias personas compartan una misma contraseña, cada directivo o docente a cargo debe verificar su cuenta de Google o correo individual. Esto asegura un registro de cambios transparente en las noticias, eventos, galería e inventario escolar.
          </p>
        </div>
      </div>
    </div>
  );
}
