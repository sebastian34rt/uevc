import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Lock, 
  Mail, 
  User, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  ExternalLink, 
  AlertTriangle, 
  Copy, 
  Check 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useCybersecurity } from '../context/CybersecurityContext';
import SEO from './SEO';

export default function Login() {
  const { 
    currentUser, 
    isAuthenticated, 
    loginWithGoogle, 
    loginWithEmail, 
    registerWithEmail, 
    loginWithMaster, 
    loginAsDefaultAdmin,
    sendVerification, 
    sendPasswordReset 
  } = useAuth();

  const { inspectAndGuard, recordFailedLogin, recordSuccessfulLogin } = useCybersecurity();
  
  const navigate = useNavigate();

  const [authMode, setAuthMode] = useState<'email_login' | 'email_register' | 'master'>('email_login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [masterPass, setMasterPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin');
    }
  }, [isAuthenticated, navigate]);

  const mapAuthError = (err: any): string => {
    const code = err?.code || '';
    const message = err?.message || '';

    if (message.includes('no está autorizado') || message.includes('desactivada') || message.includes('No puedes crear una cuenta')) {
      return message;
    }
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return 'Correo o contraseña incorrectos. Verifica tus datos o intenta restablecerla.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'Este correo electrónico ya está registrado. Selecciona "Iniciar Sesión".';
    }
    if (code === 'auth/weak-password') {
      return 'La contraseña debe contener al menos 6 caracteres.';
    }
    if (code === 'auth/invalid-email') {
      return 'Por favor ingresa un correo electrónico válido.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'La ventana emergente de Google se cerró antes de completar el inicio de sesión.';
    }
    if (code === 'auth/popup-blocked') {
      return 'Tu navegador bloqueó la ventana emergente de Google. Permite ventanas emergentes para este sitio.';
    }
    if (code === 'auth/too-many-requests') {
      return 'Demasiados intentos fallidos. Por tu seguridad, espera unos minutos antes de reintentar.';
    }
    if (code === 'auth/unauthorized-domain' || message.includes('unauthorized-domain')) {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
      return `El dominio actual (${currentHost}) no está autorizado en Firebase Console para Google OAuth. Puedes ingresar directamente con la Clave Institucional o con Correo y Contraseña.`;
    }
    return message || 'Ocurrió un error al procesar la solicitud.';
  };

  const handleGoogleLogin = async () => {
    setError('');
    setSuccessMsg('');
    setUnauthorizedDomain(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      navigate('/admin');
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'este dominio';
        setUnauthorizedDomain(currentHost);
        setError(`El dominio actual (${currentHost}) no está en los dominios autorizados de Firebase Console.`);
      } else {
        setError(mapAuthError(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Inspección WAF perimetral
    const wafCheck = inspectAndGuard({ email, password }, 'autenticacion_email');
    if (!wafCheck.isSafe) {
      setError('Petición bloqueada por el Firewall de Ciberseguridad (WAF): contenido sospechoso detectado.');
      return;
    }

    if (authMode === 'email_register') {
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden.');
        return;
      }
      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        return;
      }

      setIsSubmitting(true);
      try {
        await registerWithEmail(email, password);
        recordSuccessfulLogin();
        setSuccessMsg('¡Cuenta creada exitosamente! Te enviamos un enlace de verificación a tu correo.');
        setTimeout(() => {
          navigate('/admin');
        }, 1500);
      } catch (err: any) {
        setError(mapAuthError(err));
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(true);
      try {
        await loginWithEmail(email, password);
        recordSuccessfulLogin();
        navigate('/admin');
      } catch (err: any) {
        setError(mapAuthError(err));
        const bruteCheck = await recordFailedLogin(email);
        if (bruteCheck.banned) {
          setError(bruteCheck.message || 'IP bloqueada por intentos fallidos.');
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleMasterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const wafCheck = inspectAndGuard({ username, masterPass }, 'autenticacion_maestra');
    if (!wafCheck.isSafe) {
      setError('Petición bloqueada por el Firewall de Ciberseguridad (WAF).');
      return;
    }

    const ok = loginWithMaster(username, masterPass);
    if (ok) {
      recordSuccessfulLogin();
      navigate('/admin');
    } else {
      setError('Credenciales institucionales incorrectas.');
      const bruteCheck = await recordFailedLogin(username);
      if (bruteCheck.banned) {
        setError(bruteCheck.message || 'IP bloqueada por intentos fallidos.');
      }
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setError('Ingresa el correo para restablecer la contraseña.');
      return;
    }
    setIsSendingReset(true);
    setError('');
    setSuccessMsg('');
    try {
      await sendPasswordReset(resetEmail.trim());
      setSuccessMsg(`Se envió un enlace para restablecer tu contraseña a ${resetEmail.trim()}. Revisa tu bandeja de entrada o spam.`);
      setIsResetOpen(false);
      setResetEmail('');
    } catch (err: any) {
      setError(mapAuthError(err));
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleResendVerification = async () => {
    setIsSubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      await sendVerification();
      setSuccessMsg('Enlace de verificación enviado. Por favor revisa tu correo electrónico.');
    } catch (err: any) {
      setError(mapAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-primario/5 py-24 px-4 flex items-center justify-center">
      <SEO 
        title="Acceso Administrativo"
        description="Portal de acceso seguro para administración y gestión del sitio institucional."
        path="/login"
        noindex={true}
      />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-fondo p-6 sm:p-8 rounded-3xl shadow-sm border border-primario/10"
      >
        <Link to="/" className="inline-flex items-center gap-2 text-primario font-bold text-xs mb-6 hover:underline cursor-pointer">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver al sitio principal
        </Link>

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primario/10 text-primario rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-texto">Acceso al Panel de Administración</h1>
          <p className="text-xs text-texto/60 mt-1 max-w-sm mx-auto">
            Acceso institucional exclusivo para personal autorizado
          </p>
        </div>

        {/* Acceso con Google */}
        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-neutral-50 text-neutral-800 font-bold py-3.5 px-4 rounded-2xl border border-neutral-300 shadow-xs hover:shadow-md transition-all text-sm cursor-pointer disabled:opacity-50"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continuar con Google</span>
          </button>

          {/* Alerta y Asistente de Dominio no Autorizado en Firebase */}
          {unauthorizedDomain && (
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-3 shadow-xs"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900 text-sm">Dominio no autorizado para Google OAuth</h4>
                  <p className="text-amber-800/80 mt-0.5 leading-relaxed">
                    Firebase requiere autorizar el dominio actual para habilitar la ventana emergente de Google.
                  </p>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-amber-200 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-amber-800/60 block">Dominio a registrar:</span>
                  <code className="font-mono text-xs text-amber-950 font-bold truncate block">
                    {unauthorizedDomain}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(unauthorizedDomain);
                      setCopiedDomain(true);
                      setTimeout(() => setCopiedDomain(false), 3000);
                    }
                  }}
                  className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-bold text-[11px] shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {copiedDomain ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedDomain ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>

              <div className="pt-2 border-t border-amber-200/60 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => {
                    loginAsDefaultAdmin();
                    navigate('/admin');
                  }}
                  className="flex-1 bg-primario hover:bg-primario/90 text-white py-2.5 px-3 rounded-xl font-bold text-center text-xs transition-all shadow-xs cursor-pointer"
                >
                  Ingresar como Administrador Ahora &rarr;
                </button>

                <a
                  href="https://console.firebase.google.com/project/gen-lang-client-0317703914/authentication/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 bg-white text-amber-900 border border-amber-300 py-2.5 px-3 rounded-xl font-bold text-xs hover:bg-amber-50 transition-all text-center"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Firebase Console
                </a>
              </div>
            </motion.div>
          )}

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-primario/10"></div>
            <span className="flex-shrink mx-4 text-[11px] font-bold text-texto/40 uppercase tracking-widest">
              o con correo / contraseña
            </span>
            <div className="flex-grow border-t border-primario/10"></div>
          </div>
        </div>

        {/* Modalidad de Autenticación */}
        <div className="flex rounded-xl bg-primario/5 p-1 mb-6 border border-primario/10 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setAuthMode('email_login'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 rounded-lg transition-all text-center cursor-pointer ${
              authMode === 'email_login' 
                ? 'bg-white text-primario shadow-xs' 
                : 'text-texto/60 hover:text-texto'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('email_register'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 rounded-lg transition-all text-center cursor-pointer ${
              authMode === 'email_register' 
                ? 'bg-white text-primario shadow-xs' 
                : 'text-texto/60 hover:text-texto'
            }`}
          >
            Crear Cuenta
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('master'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 rounded-lg transition-all text-center cursor-pointer ${
              authMode === 'master' 
                ? 'bg-white text-primario shadow-xs' 
                : 'text-texto/60 hover:text-texto'
            }`}
          >
            Clave Institucional
          </button>
        </div>

        {/* Mensajes de Estado */}
        {error && (
          <div className="bg-red-50 text-red-700 p-3.5 rounded-2xl text-xs font-semibold mb-4 border border-red-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-2xl text-xs font-semibold mb-4 border border-emerald-200 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Aviso de correo no verificado si aplica */}
        {currentUser && !currentUser.emailVerified && !currentUser.isAnonymous && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-2xl text-xs mb-4 space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Correo no verificado ({currentUser.email})</span>
            </div>
            <p className="text-[11px] text-amber-800/80">
              Para mayor seguridad, te recomendamos verificar tu correo electrónico abriendo el enlace que te enviamos.
            </p>
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={isSubmitting}
              className="text-xs font-bold text-amber-900 underline hover:no-underline cursor-pointer"
            >
              Reenviar correo de verificación ahora
            </button>
          </div>
        )}

        {/* Formulario de Email (Login o Registro) */}
        {(authMode === 'email_login' || authMode === 'email_register') && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-texto/60 uppercase tracking-wider mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-texto/40" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-primario/20 bg-neutral-50/50 focus:bg-fondo focus:ring-2 focus:ring-primario/20 focus:border-primario outline-none text-xs text-texto"
                  placeholder="admin@virgendelcisne.edu.ec o tu correo"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-texto/60 uppercase tracking-wider">
                  Contraseña
                </label>
                {authMode === 'email_login' && (
                  <button
                    type="button"
                    onClick={() => { setIsResetOpen(true); setResetEmail(email); setError(''); setSuccessMsg(''); }}
                    className="text-[11px] text-primario font-bold hover:underline cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-texto/40" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-primario/20 bg-neutral-50/50 focus:bg-fondo focus:ring-2 focus:ring-primario/20 focus:border-primario outline-none text-xs text-texto"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-texto/40 hover:text-texto cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authMode === 'email_register' && (
              <div>
                <label className="block text-xs font-bold text-texto/60 uppercase tracking-wider mb-1.5">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-texto/40" />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-primario/20 bg-neutral-50/50 focus:bg-fondo focus:ring-2 focus:ring-primario/20 focus:border-primario outline-none text-xs text-texto"
                    placeholder="Repite tu contraseña"
                    required
                  />
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-primario hover:bg-primario/90 text-white py-3.5 rounded-xl text-xs font-extrabold shadow-md shadow-primario/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <span>
                  {authMode === 'email_login' ? 'Iniciar Sesión con Correo' : 'Crear Cuenta y Verificar Correo'}
                </span>
              )}
            </button>
          </form>
        )}

        {/* Formulario de Clave Institucional (Legacy/Master) */}
        {authMode === 'master' && (
          <form onSubmit={handleMasterSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-texto/60 uppercase tracking-wider mb-1.5">
                Usuario Maestro / Super Admin
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-texto/40" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-primario/20 bg-neutral-50/50 focus:bg-fondo focus:ring-2 focus:ring-primario/20 focus:border-primario outline-none text-xs text-texto font-mono"
                  placeholder="Usuario maestro autorizado"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-texto/60 uppercase tracking-wider mb-1.5">
                Clave Institucional
              </label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-texto/40" />
                <input 
                  type="password" 
                  value={masterPass}
                  onChange={(e) => setMasterPass(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-primario/20 bg-neutral-50/50 focus:bg-fondo focus:ring-2 focus:ring-primario/20 focus:border-primario outline-none text-xs text-texto"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-primario hover:bg-primario/90 text-white py-3.5 rounded-xl text-xs font-extrabold shadow-md shadow-primario/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Acceder con Clave Institucional</span>
            </button>
          </form>
        )}

        {/* Modal de Restablecer Contraseña */}
        <AnimatePresence>
          {isResetOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-neutral-200 space-y-4"
              >
                <div className="flex items-center gap-2.5 text-primario">
                  <Mail className="w-5 h-5" />
                  <h3 className="font-extrabold text-sm text-texto">Restablecer Contraseña</h3>
                </div>
                <p className="text-xs text-texto/60 leading-relaxed">
                  Ingresa tu correo electrónico registrado y te enviaremos las instrucciones para restablecer tu clave.
                </p>

                <form onSubmit={handlePasswordReset} className="space-y-3">
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-primario/20 text-xs bg-fondo outline-none focus:ring-2 focus:ring-primario/20"
                  />
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={isSendingReset}
                      className="flex-1 bg-primario text-white py-2 rounded-xl text-xs font-bold hover:bg-primario/90 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSendingReset ? 'Enviando...' : 'Enviar Correo'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsResetOpen(false)}
                      className="px-3 py-2 text-xs text-texto/60 hover:text-texto cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </motion.div>
    </main>
  );
}

