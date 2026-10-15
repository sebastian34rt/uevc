import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LogOut, 
  Image as ImageIcon, 
  FileText, 
  Calendar, 
  Plus, 
  Trash2, 
  Cloud, 
  CloudOff, 
  Database, 
  BarChart3, 
  Radio, 
  Users, 
  Globe, 
  RefreshCw, 
  Wrench, 
  QrCode, 
  Box,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Key,
  User as UserIcon,
  ExternalLink,
  Crown,
  ChevronDown,
  Ticket,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ImageUploader from './ImageUploader';
import AdminPageEditor from './AdminPageEditor';
import AdminQrInventory from './AdminQrInventory';
import AdminCustomMaterials from './AdminCustomMaterials';
import AdminSecurityVerification from './AdminSecurityVerification';
import AdminAccessControl from './AdminAccessControl';
import AdminCybersecuritySOC from './AdminCybersecuritySOC';
import AdminHelpdeskConfig from './AdminHelpdeskConfig';
import { AdminSorteoManager } from './AdminSorteoManager';
import CybersecurityAlertBanner from './CybersecurityAlertBanner';
import AnimatedText from './AnimatedText';
import SEO from './SEO';
import { useAuth } from '../context/AuthContext';
import { useCybersecurity } from '../context/CybersecurityContext';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { defaultImages } from './Gallery';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { 
    currentUser, 
    isMasterAdmin, 
    isSuperAdmin,
    userRole,
    assignedName,
    isAuthenticated, 
    logout, 
    sendVerification, 
    reloadUser, 
    loginWithGoogle 
  } = useAuth();
  const { lockdownState, simulateAttack, restoreNormalService } = useCybersecurity();

  const [activeTab, setActiveTab] = useState<'accessControl' | 'cybersecurity' | 'pageEditor' | 'hero' | 'news' | 'gallery' | 'calendar' | 'staff' | 'live' | 'inventoryQr' | 'materials' | 'security' | 'helpdeskConfig' | 'sorteos'>('pageEditor');
  const [isVerifyingBanner, setIsVerifyingBanner] = useState(false);
  const [bannerFeedback, setBannerFeedback] = useState<string | null>(null);
  const [dismissBanner, setDismissBanner] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const [dbStats, setDbStats] = useState({ news: 0, gallery: 0, events: 0 });
  const DB_LIMIT = 500;
  
  const [heroUrl, setHeroUrl] = useState('');
  
  const [newsTitle, setNewsTitle] = useState('');
  const [newsDate, setNewsDate] = useState('');
  const [newsCategory, setNewsCategory] = useState('');
  const [newsImage, setNewsImage] = useState('');
  
  const [galleryUrl, setGalleryUrl] = useState('');
  const [galleryCategory, setGalleryCategory] = useState('eventos');
  const [galleryShowInIndex, setGalleryShowInIndex] = useState(true);
  
  const [calTitle, setCalTitle] = useState('');
  const [calDate, setCalDate] = useState('');
  const [calType, setCalType] = useState('academico');
  const [calDesc, setCalDesc] = useState('');

  const [isLive, setIsLive] = useState(false);
  const [showLiveOption, setShowLiveOption] = useState(false);
  const [liveUrl, setLiveUrl] = useState('');
  const [liveTitle, setLiveTitle] = useState('');
  const [isSavingLive, setIsSavingLive] = useState(false);
  const [liveFeedback, setLiveFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isHelpdeskActive, setIsHelpdeskActive] = useState(true);
  
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('');
  const [staffCategory, setStaffCategory] = useState('docentes');
  const [staffImage, setStaffImage] = useState('');
  const [staffEmail, setStaffEmail] = useState('');

  const [isSavingHero, setIsSavingHero] = useState(false);
  const [heroFeedback, setHeroFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [isSavingNews, setIsSavingNews] = useState(false);
  const [newsFeedback, setNewsFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [isSavingGallery, setIsSavingGallery] = useState(false);
  const [galleryFeedback, setGalleryFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [isSavingStaff, setIsSavingStaff] = useState(false);
  const [staffFeedback, setStaffFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [heroImage, setHeroImage] = useState('/1.jpg');
  const [news, setNews] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);

  const canAccess = (tab: string): boolean => {
    if (isSuperAdmin) return true;
    if (userRole === 'admin') return tab !== 'accessControl';
    if (userRole === 'editor') return ['news', 'gallery', 'calendar', 'security', 'sorteos'].includes(tab);
    if (userRole === 'helpdesk') return ['inventoryQr', 'materials', 'security', 'helpdeskConfig'].includes(tab);
    return false;
  };

  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    superadmin: true,
    principal: true,
    complementario: true,
    infraestructura: true,
    sistema: true
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Mantener abierta la sección activa automáticamente
  useEffect(() => {
    if (['pageEditor', 'hero', 'news', 'gallery'].includes(activeTab)) {
      setOpenSections(prev => ({ ...prev, principal: true }));
    } else if (['calendar', 'staff', 'live'].includes(activeTab)) {
      setOpenSections(prev => ({ ...prev, complementario: true }));
    } else if (['inventoryQr', 'materials', 'helpdeskConfig'].includes(activeTab)) {
      setOpenSections(prev => ({ ...prev, infraestructura: true }));
    } else if (['security'].includes(activeTab)) {
      setOpenSections(prev => ({ ...prev, sistema: true }));
    } else if (['accessControl'].includes(activeTab)) {
      setOpenSections(prev => ({ ...prev, superadmin: true }));
    }
  }, [activeTab]);

  useEffect(() => {
    if (!canAccess(activeTab)) {
      if (userRole === 'editor') setActiveTab('news');
      else if (userRole === 'helpdesk') setActiveTab('inventoryQr');
      else setActiveTab('pageEditor');
    }
  }, [userRole, isSuperAdmin, activeTab]);

  useEffect(() => {
    if (!isAuthenticated && localStorage.getItem('isAuthenticated') !== 'true') {
      navigate('/login');
    }
    
    const unsubHero = onSnapshot(doc(db, 'siteConfig', 'hero'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().imageUrl) {
        setHeroImage(docSnap.data().imageUrl);
      }
    });

    const unsubLive = onSnapshot(doc(db, 'siteConfig', 'liveStream'), (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        setShowLiveOption(d.enabled === true);
        setIsLive(d.isLive || false);
        setLiveUrl(d.embedUrl || '');
        setLiveTitle(d.title || '');
      }
    });

    const unsubNews = onSnapshot(collection(db, 'news'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNews(data.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0)));
      setDbStats(prev => ({ ...prev, news: data.length }));
      setIsSyncing(true);
    }, (error) => {
      console.warn('News listener notice:', error?.message);
      setIsSyncing(false);
    });

    const unsubGallery = onSnapshot(collection(db, 'gallery'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sortedData = data.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
      setImages(sortedData);
      setDbStats(prev => ({ ...prev, gallery: data.length }));
      setIsSyncing(true);
    }, (error) => {
      setIsSyncing(false);
    });

    const unsubEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(data.sort((a: any, b: any) => (a.date || '').localeCompare(b.date || '')));
      setDbStats(prev => ({ ...prev, events: data.length }));
      setIsSyncing(true);
    }, (error) => {
      setIsSyncing(false);
    });

    const unsubStaff = onSnapshot(collection(db, 'staff'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStaff(data.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0)));
    });

    const unsubHelpdesk = onSnapshot(doc(db, 'helpdesk_settings', 'config'), (docSnap) => {
      if (docSnap.exists()) {
        setIsHelpdeskActive(docSnap.data().isActive !== false);
      }
    });

    return () => {
      unsubHero();
      unsubLive();
      unsubNews();
      unsubGallery();
      unsubEvents();
      unsubStaff();
      unsubHelpdesk();
    };
  }, [navigate, isAuthenticated]);

  const isGoogleUser = currentUser?.providerData?.some(p => p.providerId === 'google.com');
  const isEmailVerified = !!currentUser?.emailVerified;
  const isSecurityFullyVerified = isGoogleUser || isEmailVerified;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    }
    navigate('/login');
  };

  const handleBannerSendVerification = async () => {
    setIsVerifyingBanner(true);
    setBannerFeedback(null);
    try {
      await sendVerification();
      setBannerFeedback('✓ Enlace enviado a tu correo. Revisa tu buzón y carpeta de spam.');
    } catch (err: any) {
      setBannerFeedback('Error al enviar correo de verificación.');
    } finally {
      setIsVerifyingBanner(false);
    }
  };

  const handleBannerCheckStatus = async () => {
    setIsVerifyingBanner(true);
    setBannerFeedback(null);
    try {
      const refreshed = await reloadUser();
      if (refreshed?.emailVerified) {
        setBannerFeedback('¡Excelente! Tu correo ha sido verificado con éxito.');
      } else {
        setBannerFeedback('Aún no detectamos la verificación. Haz clic en el enlace recibido en tu buzón.');
      }
    } catch (err: any) {
      setBannerFeedback('Error al comprobar estado.');
    } finally {
      setIsVerifyingBanner(false);
    }
  };

  const handleBannerVerifyGoogle = async () => {
    setIsVerifyingBanner(true);
    setBannerFeedback(null);
    try {
      await loginWithGoogle();
      setBannerFeedback('¡Identidad verificada con Google exitosamente!');
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'este dominio';
        setBannerFeedback(`Dominio (${domain}) no autorizado para Google en Firebase Console. Usa el botón "Reenviar Enlace de Correo" para verificar tu cuenta.`);
      } else {
        setBannerFeedback('Error al verificar con Google.');
      }
    } finally {
      setIsVerifyingBanner(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) return;
    setIsSavingStaff(true);
    setStaffFeedback(null);
    try {
      await addDoc(collection(db, 'staff'), { 
        name: staffName.trim(), 
        role: staffRole.trim(), 
        category: staffCategory, 
        image: staffImage || '',
        email: staffEmail.trim(), 
        createdAt: Date.now() 
      });
      setStaffFeedback({ type: 'success', message: '¡Miembro del personal guardado en Firebase exitosamente!' });
      setStaffName(''); setStaffRole(''); setStaffCategory('docentes'); setStaffImage(''); setStaffEmail('');
      setTimeout(() => setStaffFeedback(null), 4000);
    } catch (err: any) {
      console.error('Error guardando personal en Firebase:', err);
      setStaffFeedback({ type: 'error', message: 'Error al guardar en Firebase: ' + (err?.message || 'Inténtelo de nuevo') });
    } finally {
      setIsSavingStaff(false);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'staff', id));
      setStaffFeedback({ type: 'success', message: 'Miembro del personal eliminado correctamente.' });
      setTimeout(() => setStaffFeedback(null), 3000);
    } catch (e: any) {
      console.error(e);
      setStaffFeedback({ type: 'error', message: 'Error al eliminar: ' + (e?.message || 'Inténtelo de nuevo') });
    }
  };

  const handleUpdateHero = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroUrl) return;
    setIsSavingHero(true);
    setHeroFeedback(null);
    try {
      await setDoc(doc(db, 'siteConfig', 'hero'), { 
        imageUrl: heroUrl,
        updatedAt: Date.now() 
      }, { merge: true });
      setHeroFeedback({ type: 'success', message: '¡Portada principal actualizada y guardada en Firebase exitosamente!' });
      setHeroUrl('');
      setTimeout(() => setHeroFeedback(null), 4000);
    } catch (err: any) {
      console.error('Error guardando portada en Firebase:', err);
      setHeroFeedback({ type: 'error', message: 'Error al guardar en Firebase: ' + (err?.message || 'Inténtelo de nuevo') });
    } finally {
      setIsSavingHero(false);
    }
  };

  const handleDeleteHero = async () => {
    setIsSavingHero(true);
    setHeroFeedback(null);
    try {
      await deleteDoc(doc(db, 'siteConfig', 'hero'));
      setHeroImage('/1.jpg');
      setHeroUrl('');
      setHeroFeedback({ type: 'success', message: '¡Foto eliminada! Se ha restablecido la foto predeterminada del colegio.' });
      setTimeout(() => setHeroFeedback(null), 4000);
    } catch (err: any) {
      console.error('Error al eliminar foto de portada:', err);
      setHeroImage('/1.jpg');
      setHeroUrl('');
      setHeroFeedback({ type: 'success', message: '¡Portada restablecida a la fotografía institucional original!' });
      setTimeout(() => setHeroFeedback(null), 4000);
    } finally {
      setIsSavingHero(false);
    }
  };

  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsImage || !newsTitle.trim()) return;
    setIsSavingNews(true);
    setNewsFeedback(null);
    try {
      await addDoc(collection(db, 'news'), { 
        title: newsTitle.trim(), 
        date: newsDate.trim() || new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }), 
        category: newsCategory.trim() || 'NOTICIAS', 
        image: newsImage,
        createdAt: Date.now() 
      });
      setNewsFeedback({ type: 'success', message: '¡Noticia con imagen guardada en Firebase exitosamente!' });
      setNewsTitle(''); setNewsDate(''); setNewsCategory(''); setNewsImage('');
      setTimeout(() => setNewsFeedback(null), 4000);
    } catch (err: any) {
      console.error('Error guardando noticia en Firebase:', err);
      setNewsFeedback({ type: 'error', message: 'Error al guardar en Firebase: ' + (err?.message || 'Inténtelo de nuevo') });
    } finally {
      setIsSavingNews(false);
    }
  };

  const handleDeleteNews = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'news', id));
      setNewsFeedback({ type: 'success', message: 'Noticia eliminada correctamente.' });
      setTimeout(() => setNewsFeedback(null), 3000);
    } catch (e: any) {
      console.error(e);
      setNewsFeedback({ type: 'error', message: 'Error al eliminar: ' + (e?.message || 'Inténtelo de nuevo') });
    }
  };

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryUrl) return;
    setIsSavingGallery(true);
    setGalleryFeedback(null);
    try {
      await addDoc(collection(db, 'gallery'), { 
        src: galleryUrl, 
        category: galleryCategory, 
        showInIndex: galleryShowInIndex,
        createdAt: Date.now() 
      });
      setGalleryFeedback({ type: 'success', message: '¡Foto añadida a la galería y guardada en Firebase exitosamente!' });
      setGalleryUrl('');
      setTimeout(() => setGalleryFeedback(null), 4000);
    } catch (err: any) {
      console.error('Error guardando imagen en Firebase:', err);
      setGalleryFeedback({ type: 'error', message: 'Error al guardar en Firebase: ' + (err?.message || 'Inténtelo de nuevo') });
    } finally {
      setIsSavingGallery(false);
    }
  };

  const handleDeleteImage = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'gallery', id));
      setGalleryFeedback({ type: 'success', message: 'Imagen eliminada de la galería correctamente.' });
      setTimeout(() => setGalleryFeedback(null), 3000);
    } catch (e: any) {
      console.error(e);
      setGalleryFeedback({ type: 'error', message: 'Error al eliminar: ' + (e?.message || 'Inténtelo de nuevo') });
    }
  };

  const handleImportDefaults = async () => {
    try {
      for (const img of defaultImages) {
        await addDoc(collection(db, 'gallery'), {
          src: img.src,
          category: img.category,
          showInIndex: true,
          createdAt: Date.now()
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'events'), { 
      title: calTitle, 
      date: calDate, 
      type: calType, 
      description: calDesc,
      createdAt: Date.now() 
    });
    setCalTitle(''); setCalDate(''); setCalDesc('');
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (e) {
      console.error(e);
    }
  };

  const cleanEmbedUrl = (raw: string) => {
    if (!raw) return '';
    let str = raw.trim();
    const iframeMatch = str.match(/src=["']([^"']+)["']/i);
    if (iframeMatch) {
      str = iframeMatch[1];
    }
    if (str.includes('facebook.com') && !str.includes('plugins/video.php')) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(str)}&show_text=false`;
    }
    const ytMatch = str.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch && !str.includes('/embed/')) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    return str;
  };

  const handleSaveLive = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLive(true);
    setLiveFeedback(null);
    try {
      const cleaned = cleanEmbedUrl(liveUrl);
      await setDoc(doc(db, 'siteConfig', 'liveStream'), {
        enabled: showLiveOption,
        isLive: showLiveOption ? isLive : false,
        embedUrl: cleaned,
        title: liveTitle,
        updatedAt: Date.now()
      }, { merge: true });
      setLiveUrl(cleaned);
      setLiveFeedback({ 
        type: 'success', 
        message: showLiveOption 
          ? (isLive ? '¡Transmisión activada y transmitiendo en vivo en el sitio web!' : '¡Opción de transmisión activada en el sitio web!') 
          : '¡Transmisión guardada como oculta (no aparecerá en el sitio web)!' 
      });
      setTimeout(() => setLiveFeedback(null), 4000);
    } catch (err: any) {
      console.error('Error guardando configuración de transmisión:', err);
      setLiveFeedback({ type: 'error', message: 'Error al guardar en Firebase: ' + (err?.message || 'Inténtelo de nuevo') });
    } finally {
      setIsSavingLive(false);
    }
  };

  const handleQuickDisableLive = async () => {
    setIsSavingLive(true);
    setLiveFeedback(null);
    try {
      setShowLiveOption(false);
      setIsLive(false);
      await setDoc(doc(db, 'siteConfig', 'liveStream'), {
        enabled: false,
        isLive: false,
        updatedAt: Date.now()
      }, { merge: true });
      setLiveFeedback({ type: 'success', message: '¡Listo! La opción de transmisión ha sido eliminada/ocultada de toda la página web.' });
      setTimeout(() => setLiveFeedback(null), 4000);
    } catch (err: any) {
      console.error('Error al ocultar transmisión:', err);
      setLiveFeedback({ type: 'error', message: 'Error: ' + (err?.message || 'Inténtelo de nuevo') });
    } finally {
      setIsSavingLive(false);
    }
  };

  const totalDbItems = dbStats.news + dbStats.gallery + dbStats.events;
  const usagePercentage = Math.min(100, Math.round((totalDbItems / DB_LIMIT) * 100));

  return (
    <div className="min-h-screen bg-primario/5">
      <SEO 
        title="Panel de Administración y Control"
        description="Centro de gestión y administración de contenidos del portal institucional."
        path="/admin"
        noindex={true}
      />
      <header className="bg-white border-b border-primario/10 py-4 px-6 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-serif font-bold text-xl text-primario">Virgen del Cisne</Link>
          <span className="bg-primario/10 text-primario px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider hidden sm:inline-block">Panel de Control</span>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden md:flex items-center gap-4 mr-4 border-r border-primario/10 pr-6">
            <div className="flex items-center gap-2">
              {isSyncing ? (
                <Cloud className="w-4 h-4 text-emerald-500 animate-pulse" />
              ) : (
                <CloudOff className="w-4 h-4 text-alerta" />
              )}
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isSyncing ? 'text-emerald-600' : 'text-alerta'}`}>
                {isSyncing ? 'Sincronizado' : 'Sin Conexión'}
              </span>
            </div>
            
            <div className="flex flex-col gap-1 w-32">
              <div className="flex justify-between items-center text-[10px] font-bold text-texto/60 uppercase tracking-wider">
                <span className="flex items-center gap-1"><Database className="w-3 h-3" /> Base de datos</span>
                <span>{usagePercentage}%</span>
              </div>
              <div className="w-full bg-primario/10 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${usagePercentage > 80 ? 'bg-alerta' : 'bg-primario'}`}
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
            </div>
          </div>

          {isSuperAdmin && (
            <div className="hidden sm:flex items-center gap-2">
              {lockdownState.isActive ? (
                <button
                  type="button"
                  onClick={() => restoreNormalService('Super Administrador (Restauración Rápida Header)')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-black shadow-sm transition-all cursor-pointer"
                  title="Servidores en aislamiento - Haz clic para volver a la normalidad"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Restaurar Web</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    simulateAttack('ddos_flood');
                    setActiveTab('cybersecurity');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[11px] font-extrabold shadow-2xs transition-all cursor-pointer"
                  title="Simular un ciberataque de prueba y verificar el apagado de servidores"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                  <span>🧪 Probar Ataque</span>
                </button>
              )}
            </div>
          )}

          <a
            href="/exposicion.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-extrabold shadow-2xs transition-all cursor-pointer"
            title="Abrir e imprimir el documento maestro de exposición y defensa de proyecto"
          >
            <Printer className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden sm:inline">📄 Guion Exposición</span>
            <span className="sm:hidden">📄 Guion</span>
          </a>

          <button
            type="button"
            onClick={() => setActiveTab(isSuperAdmin ? 'accessControl' : 'security')}
            title={isSuperAdmin ? "Centro de Control & Super Administrador" : "Centro de seguridad y verificación"}
            className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl transition-all text-left cursor-pointer border ${
              isSuperAdmin 
                ? 'bg-purple-50 hover:bg-purple-100 border-purple-200 shadow-2xs' 
                : 'bg-primario/5 hover:bg-primario/10 border-primario/10'
            }`}
          >
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="Foto" className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-purple-300" />
            ) : (
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-extrabold shrink-0 shadow-2xs ${
                isSuperAdmin 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-primario/20 text-primario'
              }`}>
                {isSuperAdmin ? <Crown className="w-4 h-4 text-detalle" /> : isMasterAdmin ? <Key className="w-3.5 h-3.5" /> : <UserIcon className="w-3.5 h-3.5" />}
              </div>
            )}

            <div className="hidden lg:flex flex-col text-left">
              <span className="text-[11px] font-extrabold text-texto truncate max-w-[140px] flex items-center gap-1">
                <span>{assignedName || currentUser?.displayName || (isSuperAdmin ? 'Juan del Pezo' : 'Admin')}</span>
              </span>
              <span className="text-[9px] font-mono text-texto/50 truncate max-w-[140px]">
                {isSuperAdmin ? '🔒 Cuenta Principal Privada' : (currentUser?.email || 'admin@instituto.edu')}
              </span>
            </div>

            {isSuperAdmin ? (
              <span className="flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-primario text-white shadow-2xs shrink-0">
                <Crown className="w-2.5 h-2.5 text-detalle" />
                Super Admin
              </span>
            ) : userRole === 'editor' ? (
              <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                Editor
              </span>
            ) : userRole === 'helpdesk' ? (
              <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                HelpDesk
              </span>
            ) : isGoogleUser ? (
              <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Google
              </span>
            ) : isEmailVerified ? (
              <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Admin
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 animate-pulse shrink-0">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                Verificar
              </span>
            )}
          </button>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-medium text-alerta hover:bg-alerta/10 px-4 py-2 rounded-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Banner de Ciberseguridad y Mitigación de Ataques */}
        <CybersecurityAlertBanner onOpenSOC={() => setActiveTab('cybersecurity')} />

        {/* Banner de verificación de correo o acceso institucional */}
        {currentUser && !currentUser.emailVerified && !isMasterAdmin && !dismissBanner && (
          <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
                <Mail className="w-5 h-5 text-amber-800" />
              </div>
              <div className="space-y-0.5">
                <div className="font-extrabold text-amber-950 text-sm flex items-center gap-2">
                  <span>Verificación de Administrador Pendiente</span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider">
                    Acción recomendada
                  </span>
                </div>
                <p className="text-xs text-amber-900/80">
                  Tu correo <strong className="font-mono text-amber-950">{currentUser.email}</strong> aún no ha sido confirmado. Puedes verificar tu enlace de correo o verificar tu identidad al instante con Google.
                </p>
                {bannerFeedback && (
                  <p className="text-xs font-bold text-emerald-800 pt-1">
                    {bannerFeedback}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0">
              <button
                type="button"
                onClick={handleBannerSendVerification}
                disabled={isVerifyingBanner}
                className="bg-primario hover:bg-primario/90 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isVerifyingBanner ? 'Enviando...' : 'Reenviar Enlace de Correo'}
              </button>
              <button
                type="button"
                onClick={handleBannerCheckStatus}
                disabled={isVerifyingBanner}
                className="bg-white hover:bg-neutral-50 text-amber-950 border border-amber-300 font-bold px-3 py-2 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                Comprobar Estado
              </button>
              <button
                type="button"
                onClick={handleBannerVerifyGoogle}
                disabled={isVerifyingBanner}
                className="bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 font-bold px-3 py-2 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Verificar con Google
              </button>
              <button
                type="button"
                onClick={() => setDismissBanner(true)}
                className="text-amber-800/60 hover:text-amber-950 p-1.5 text-xs font-bold cursor-pointer ml-1"
                title="Cerrar aviso temporalmente"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-64 shrink-0 space-y-3">
            {/* GRUPO EXCLUSIVO: SUPER ADMINISTRADOR */}
            {isSuperAdmin && (
              <div className="rounded-2xl border border-purple-200/90 bg-purple-50/60 overflow-hidden shadow-2xs">
                <button 
                  type="button"
                  onClick={() => toggleSection('superadmin')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-black uppercase tracking-wider text-purple-950 hover:bg-purple-100/70 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    <Crown className="w-3.5 h-3.5 text-detalle shrink-0" />
                    <span>Control Maestro</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-purple-200 text-purple-900 uppercase">
                      Admin
                    </span>
                    <ChevronDown 
                      className={`w-4 h-4 text-purple-700 transition-transform duration-200 ${openSections.superadmin ? 'rotate-180' : ''}`} 
                    />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {openSections.superadmin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                      className="p-2 pt-0 space-y-1"
                    >
                      <button 
                        onClick={() => setActiveTab('accessControl')}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          activeTab === 'accessControl' 
                            ? 'bg-gradient-to-r from-purple-700 via-purple-800 to-primario text-white shadow-md' 
                            : 'text-purple-950 bg-white/80 hover:bg-white border border-purple-200/70'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Crown className={`w-3.5 h-3.5 ${activeTab === 'accessControl' ? 'text-detalle' : 'text-purple-700'}`} /> 
                          <span>Gestión de Accesos</span>
                        </div>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase ${
                          activeTab === 'accessControl' ? 'bg-detalle text-primario' : 'bg-purple-100 text-purple-800'
                        }`}>
                          Usuarios
                        </span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* GRUPO: PRINCIPAL */}
            {(canAccess('pageEditor') || canAccess('hero') || canAccess('news') || canAccess('gallery')) && (
              <div className="rounded-2xl border border-primario/10 bg-white/80 overflow-hidden shadow-2xs">
                <button 
                  type="button"
                  onClick={() => toggleSection('principal')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-black uppercase tracking-wider text-texto/80 hover:text-primario hover:bg-primario/5 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primario" />
                    <span>Principal</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold bg-primario/10 text-primario px-1.5 py-0.2 rounded-full">
                      4
                    </span>
                    <ChevronDown 
                      className={`w-4 h-4 text-texto/50 transition-transform duration-200 ${openSections.principal ? 'rotate-180 text-primario' : ''}`} 
                    />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {openSections.principal && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                      className="p-2 pt-0 space-y-1 border-t border-primario/5"
                    >
                      {canAccess('pageEditor') && (
                        <button 
                          onClick={() => setActiveTab('pageEditor')}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                            activeTab === 'pageEditor' 
                              ? 'bg-primario text-white shadow-md' 
                              : 'text-texto/70 hover:bg-primario/5 hover:text-texto'
                          }`}
                        >
                          <Globe className={`w-4 h-4 ${activeTab === 'pageEditor' ? 'text-white' : 'text-primario'}`} /> 
                          <span>Editor de Página</span>
                        </button>
                      )}

                      {canAccess('hero') && (
                        <button 
                          onClick={() => setActiveTab('hero')}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                            activeTab === 'hero' 
                              ? 'bg-primario text-white shadow-md' 
                              : 'text-texto/60 hover:bg-primario/5 hover:text-texto'
                          }`}
                        >
                          <ImageIcon className="w-4 h-4" /> 
                          <span>Portada Principal</span>
                        </button>
                      )}

                      {canAccess('news') && (
                        <button 
                          onClick={() => setActiveTab('news')}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                            activeTab === 'news' 
                              ? 'bg-primario text-white shadow-md' 
                              : 'text-texto/60 hover:bg-primario/5 hover:text-texto'
                          }`}
                        >
                          <FileText className="w-4 h-4" /> 
                          <span>Noticias</span>
                        </button>
                      )}

                      {canAccess('gallery') && (
                        <button 
                          onClick={() => setActiveTab('gallery')}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                            activeTab === 'gallery' 
                              ? 'bg-primario text-white shadow-md' 
                              : 'text-texto/60 hover:bg-primario/5 hover:text-texto'
                          }`}
                        >
                          <ImageIcon className="w-4 h-4" /> 
                          <span>Galería</span>
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* GRUPO: COMPLEMENTARIO */}
            {(canAccess('calendar') || canAccess('staff') || canAccess('live') || canAccess('sorteos')) && (
              <div className="rounded-2xl border border-primario/10 bg-white/80 overflow-hidden shadow-2xs">
                <button 
                  type="button"
                  onClick={() => toggleSection('complementario')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-black uppercase tracking-wider text-texto/80 hover:text-primario hover:bg-primario/5 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Complementario</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold bg-primario/10 text-primario px-1.5 py-0.2 rounded-full">
                      4
                    </span>
                    <ChevronDown 
                      className={`w-4 h-4 text-texto/50 transition-transform duration-200 ${openSections.complementario ? 'rotate-180 text-primario' : ''}`} 
                    />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {openSections.complementario && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                      className="p-2 pt-0 space-y-1 border-t border-primario/5"
                    >
                      {canAccess('sorteos') && (
                        <button 
                          onClick={() => setActiveTab('sorteos')}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                            activeTab === 'sorteos' 
                              ? 'bg-primario text-white shadow-md' 
                              : 'text-texto/60 hover:bg-primario/5 hover:text-texto'
                          }`}
                        >
                          <Ticket className="w-4 h-4" /> 
                          <span>Sorteos & Boletos</span>
                        </button>
                      )}

                      {canAccess('calendar') && (
                        <button 
                          onClick={() => setActiveTab('calendar')}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                            activeTab === 'calendar' 
                              ? 'bg-primario text-white shadow-md' 
                              : 'text-texto/60 hover:bg-primario/5 hover:text-texto'
                          }`}
                        >
                          <Calendar className="w-4 h-4" /> 
                          <span>Calendario</span>
                        </button>
                      )}

                      {canAccess('staff') && (
                        <button 
                          onClick={() => setActiveTab('staff')}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                            activeTab === 'staff' 
                              ? 'bg-primario text-white shadow-md' 
                              : 'text-texto/60 hover:bg-primario/5 hover:text-texto'
                          }`}
                        >
                          <Users className="w-4 h-4" /> 
                          <span>Personal</span>
                        </button>
                      )}

                      {canAccess('live') && (
                        <button 
                          onClick={() => setActiveTab('live')}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                            activeTab === 'live' 
                              ? 'bg-primario text-white shadow-md' 
                              : 'text-texto/60 hover:bg-primario/5 hover:text-texto'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Radio className={`w-4 h-4 ${isLive && showLiveOption ? 'text-red-500 animate-pulse' : ''}`} /> 
                            <span>Transmisión en Vivo</span>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            showLiveOption ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'
                          }`}>
                            {showLiveOption ? 'Visible' : 'Oculto'}
                          </span>
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* GRUPO: INFRAESTRUCTURA & SOPORTE */}
            {(canAccess('inventoryQr') || canAccess('materials')) && (
              <div className="rounded-2xl border border-primario/10 bg-white/80 overflow-hidden shadow-2xs">
                <button 
                  type="button"
                  onClick={() => toggleSection('infraestructura')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-black uppercase tracking-wider text-texto/80 hover:text-primario hover:bg-primario/5 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Infraestructura & Labs</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full">
                      3
                    </span>
                    <ChevronDown 
                      className={`w-4 h-4 text-texto/50 transition-transform duration-200 ${openSections.infraestructura ? 'rotate-180 text-primario' : ''}`} 
                    />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {openSections.infraestructura && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                      className="p-2 pt-0 space-y-1 border-t border-primario/5"
                    >
                      {canAccess('inventoryQr') && (
                        <button 
                          onClick={() => setActiveTab('inventoryQr')}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            activeTab === 'inventoryQr' 
                              ? 'bg-primario text-white shadow-md' 
                              : 'text-texto/60 hover:bg-primario/5 hover:text-texto'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <QrCode className="w-4 h-4" /> 
                            <span>Inventario & QR</span>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            activeTab === 'inventoryQr' ? 'bg-white text-primario' : 'bg-primario/10 text-primario'
                          }`}>
                            QR
                          </span>
                        </button>
                      )}

                      {canAccess('materials') && (
                        <button 
                          onClick={() => setActiveTab('materials')}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            activeTab === 'materials' 
                              ? 'bg-primario text-white shadow-md' 
                              : 'text-texto/60 hover:bg-primario/5 hover:text-texto'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Box className="w-4 h-4" /> 
                            <span>Materiales & Labs</span>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            activeTab === 'materials' ? 'bg-white text-primario' : 'bg-amber-100 text-amber-800'
                          }`}>
                            Gestor
                          </span>
                        </button>
                      )}

                      {canAccess('helpdeskConfig') && (
                        <button 
                          onClick={() => setActiveTab('helpdeskConfig')}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            activeTab === 'helpdeskConfig' 
                              ? 'bg-primario text-white shadow-md' 
                              : 'text-texto/80 hover:bg-primario/5 hover:text-texto'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Wrench className={`w-4 h-4 ${activeTab === 'helpdeskConfig' ? 'text-white' : 'text-primario'}`} /> 
                            <span>Estado & Soporte QR</span>
                          </div>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            activeTab === 'helpdeskConfig' 
                              ? 'bg-white text-primario' 
                              : isHelpdeskActive 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-amber-100 text-amber-900 animate-pulse'
                          }`}>
                            {isHelpdeskActive ? '🟢 Activo' : '🚧 OFF'}
                          </span>
                        </button>
                      )}

                      <Link
                        to="/helpdesk"
                        target="_blank"
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-semibold text-texto/60 hover:text-primario hover:bg-primario/5 transition-colors border border-dashed border-primario/20 mt-1"
                      >
                        <div className="flex items-center gap-2">
                          <ExternalLink className="w-3.5 h-3.5 text-primario" />
                          <span>Abrir Portal HelpDesk</span>
                        </div>
                        <span className="text-[10px] text-primario font-bold">
                          Ver &rarr;
                        </span>
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* GRUPO: SISTEMA & SEGURIDAD */}
            {(canAccess('security') || canAccess('cybersecurity')) && (
              <div className="rounded-2xl border border-primario/10 bg-white/80 overflow-hidden shadow-2xs">
                <button 
                  type="button"
                  onClick={() => toggleSection('sistema')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-black uppercase tracking-wider text-texto/80 hover:text-primario hover:bg-primario/5 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Sistema & Seguridad</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
                      2
                    </span>
                    <ChevronDown 
                      className={`w-4 h-4 text-texto/50 transition-transform duration-200 ${openSections.sistema ? 'rotate-180 text-primario' : ''}`} 
                    />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {openSections.sistema && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                      className="p-2 pt-0 space-y-1 border-t border-primario/5"
                    >
                      {canAccess('cybersecurity') && (
                        <button 
                          onClick={() => setActiveTab('cybersecurity')}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            activeTab === 'cybersecurity' 
                              ? 'bg-primario text-white shadow-md' 
                              : lockdownState.isActive
                              ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                              : 'text-texto/60 hover:bg-primario/5 hover:text-texto'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <ShieldAlert className={`w-4 h-4 ${lockdownState.isActive ? 'text-red-500 animate-pulse' : 'text-primario'}`} /> 
                            <span>Ciberseguridad & SOC</span>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            lockdownState.isActive 
                              ? 'bg-red-500 text-white animate-bounce' 
                              : activeTab === 'cybersecurity' ? 'bg-white text-primario' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {lockdownState.isActive ? 'Alerta' : 'SOC'}
                          </span>
                        </button>
                      )}

                      {canAccess('security') && (
                        <button 
                          onClick={() => setActiveTab('security')}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            activeTab === 'security' 
                              ? 'bg-primario text-white shadow-md' 
                              : 'text-texto/60 hover:bg-primario/5 hover:text-texto'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <ShieldCheck className="w-4 h-4" /> 
                            <span>Seguridad & Acceso</span>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            isSecurityFullyVerified
                              ? activeTab === 'security' ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'
                              : activeTab === 'security' ? 'bg-white text-amber-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isGoogleUser ? 'Google ✓' : isEmailVerified ? 'Verificado' : 'Pendiente'}
                          </span>
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </aside>

          <section className="flex-1 bg-white p-6 md:p-8 rounded-3xl border border-primario/10 shadow-sm min-h-[500px]">
            {activeTab === 'accessControl' && isSuperAdmin && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <AdminAccessControl />
              </motion.div>
            )}

            {activeTab === 'cybersecurity' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <AdminCybersecuritySOC />
              </motion.div>
            )}

            {activeTab === 'pageEditor' && (
              <AdminPageEditor onNavigateTab={(tab) => setActiveTab(tab as any)} />
            )}

            {activeTab === 'hero' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <h2 className="text-2xl font-bold text-texto mb-6">
                  <AnimatedText text="Gestionar Portada Principal (Hero)" tag="span" />
                </h2>
                
                {heroFeedback && (
                  <div className={`p-4 rounded-xl mb-6 text-sm font-semibold border ${
                    heroFeedback.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}>
                    {heroFeedback.message}
                  </div>
                )}

                <form onSubmit={handleUpdateHero} className="bg-primario/5 p-6 rounded-2xl mb-8 space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-texto/60 mb-2 flex items-center gap-2"><Plus className="w-4 h-4" /> Actualizar Imagen</h3>
                  <ImageUploader 
                    value={heroUrl}
                    onChange={setHeroUrl}
                    label="Seleccionar nueva imagen de portada"
                  />
                  <div className="mt-2">
                    <button 
                      type="submit" 
                      disabled={!heroUrl || isSavingHero} 
                      className="bg-primario text-white px-6 py-2.5 rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                    >
                      {isSavingHero ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Guardando en Firebase...
                        </>
                      ) : (
                        'Actualizar Portada'
                      )}
                    </button>
                  </div>
                </form>

                <div>
                  <div className="flex items-center justify-between max-w-md mb-3">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-texto/60">
                      Imagen Actual en Portada
                    </h3>
                    {heroImage !== '/1.jpg' ? (
                      <span className="text-[11px] font-bold text-primario bg-primario/10 px-2.5 py-0.5 rounded-full border border-primario/20">
                        Foto Personalizada
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-texto/50 bg-neutral-100 px-2.5 py-0.5 rounded-full">
                        Predeterminada
                      </span>
                    )}
                  </div>

                  <div className="relative group aspect-[4/3] rounded-3xl overflow-hidden border border-primario/15 max-w-md bg-neutral-100 shadow-sm">
                    <img src={heroImage} alt="Portada Principal" className="w-full h-full object-cover" />

                    {heroImage !== '/1.jpg' && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                        <button
                          type="button"
                          onClick={handleDeleteHero}
                          disabled={isSavingHero}
                          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xl flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" /> Eliminar esta foto
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 max-w-md space-y-2">
                    <button
                      type="button"
                      onClick={handleDeleteHero}
                      disabled={isSavingHero}
                      className="w-full sm:w-auto bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSavingHero ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Restableciendo portada...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Restablecer foto de portada original
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-texto/60">
                      Elimina cualquier foto personalizada subida y regresa la portada inmediatamente a la fotografía institucional predeterminada.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'news' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <h2 className="text-2xl font-bold text-texto mb-6">
                  <AnimatedText text="Gestionar Noticias y Comunicados" tag="span" />
                </h2>

                {newsFeedback && (
                  <div className={`p-4 rounded-xl mb-6 text-sm font-semibold border ${
                    newsFeedback.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}>
                    {newsFeedback.message}
                  </div>
                )}

                <form onSubmit={handleAddNews} className="bg-primario/5 p-6 rounded-2xl mb-8 space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-texto/60 mb-2 flex items-center gap-2"><Plus className="w-4 h-4" /> Añadir Noticia</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <input type="text" value={newsTitle} onChange={e => setNewsTitle(e.target.value)} placeholder="Título de la noticia" required className="w-full px-4 py-2 rounded-lg border border-primario/20 text-sm bg-white" />
                    <input type="text" value={newsCategory} onChange={e => setNewsCategory(e.target.value)} placeholder="Categoría (ej. NOTICIAS, EVENTOS)" required className="w-full px-4 py-2 rounded-lg border border-primario/20 text-sm bg-white" />
                    <input type="text" value={newsDate} onChange={e => setNewsDate(e.target.value)} placeholder="Fecha (ej. 12 Oct 2026)" required className="w-full px-4 py-2 rounded-lg border border-primario/20 text-sm bg-white" />
                  </div>
                  <ImageUploader 
                    value={newsImage} 
                    onChange={setNewsImage} 
                    label="Foto o portada de la noticia"
                  />
                  <button 
                    type="submit" 
                    disabled={!newsImage || !newsTitle || isSavingNews} 
                    className="bg-primario text-white px-6 py-2.5 rounded-lg text-sm font-bold mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                  >
                    {isSavingNews ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Guardando en Firebase...
                      </>
                    ) : (
                      'Guardar Noticia'
                    )}
                  </button>
                </form>

                <div className="space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-texto/60">Noticias Publicadas ({news.length})</h3>
                  {news.length === 0 ? <p className="text-sm text-texto/50">No hay noticias personalizadas.</p> : null}
                  {news.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border border-primario/10 rounded-xl">
                      <img src={item.image} alt="" className="w-16 h-16 object-cover rounded-lg bg-primario/10" />
                      <div className="flex-1">
                        <span className="text-xs font-bold text-primario">{item.category}</span>
                        <h4 className="font-bold text-texto text-sm">{item.title}</h4>
                        <p className="text-xs text-texto/50">{item.date}</p>
                      </div>
                      <button onClick={() => handleDeleteNews(item.id)} className="p-2 text-alerta hover:bg-alerta/10 rounded-lg transition-colors"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'gallery' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <h2 className="text-2xl font-bold text-texto mb-6">
                  <AnimatedText text="Gestionar Galería Fotográfica" tag="span" />
                </h2>

                {galleryFeedback && (
                  <div className={`p-4 rounded-xl mb-6 text-sm font-semibold border ${
                    galleryFeedback.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}>
                    {galleryFeedback.message}
                  </div>
                )}

                <form onSubmit={handleAddImage} className="bg-primario/5 p-6 rounded-2xl mb-8 space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-texto/60 mb-2 flex items-center gap-2"><Plus className="w-4 h-4" /> Añadir Imagen</h3>
                  
                  <ImageUploader 
                    value={galleryUrl}
                    onChange={setGalleryUrl}
                    label="Seleccionar foto de la galería"
                  />

                  <div className="flex flex-col sm:flex-row gap-4 mt-2">
                    <select value={galleryCategory} onChange={e => setGalleryCategory(e.target.value)} className="sm:w-48 px-4 py-2 rounded-lg border border-primario/20 text-sm bg-white">
                      <option value="eventos">Eventos</option>
                      <option value="vida académica">Vida Académica</option>
                      <option value="deportes">Deportes</option>
                      <option value="reconocimientos">Reconocimientos</option>
                    </select>
                    <label className="flex items-center gap-2 text-sm text-texto/80 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={galleryShowInIndex} 
                        onChange={e => setGalleryShowInIndex(e.target.checked)} 
                        className="rounded border-primario/20 text-primario focus:ring-primario"
                      />
                      Mostrar en inicio
                    </label>
                    <button 
                      type="submit" 
                      disabled={!galleryUrl || isSavingGallery} 
                      className="bg-primario text-white px-6 py-2 rounded-lg text-sm font-bold shrink-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                    >
                      {isSavingGallery ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Subiendo a Firebase...
                        </>
                      ) : (
                        'Subir'
                      )}
                    </button>
                  </div>
                </form>

                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wider text-texto/60 mb-4">Imágenes Publicadas ({images.length})</h3>
                  {images.length === 0 && (
                    <div className="mb-6 p-4 bg-primario/10 rounded-xl flex items-center justify-between gap-4 border border-primario/20">
                      <div>
                        <h4 className="font-bold text-sm text-primario">No hay imágenes en la galería</h4>
                        <p className="text-xs text-texto/70 mt-1">Sube nuevas imágenes usando el formulario superior.</p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((img, i) => (
                      <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-primario/10">
                        <img src={img.src} alt="" className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 bg-white/90 text-primario text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm z-10">
                          {img.category}
                        </div>
                        {img.id && (
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                            <button onClick={() => handleDeleteImage(img.id)} className="p-2 bg-alerta text-white rounded-full hover:scale-110 transition-transform"><Trash2 className="w-5 h-5" /></button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'calendar' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-2xl font-bold text-texto mb-6">Gestionar Calendario Escolar</h2>
                <form onSubmit={handleAddEvent} className="bg-primario/5 p-6 rounded-2xl mb-8 space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-texto/60 mb-2 flex items-center gap-2"><Plus className="w-4 h-4" /> Añadir Evento</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <input type="text" value={calTitle} onChange={e => setCalTitle(e.target.value)} placeholder="Título del evento" required className="w-full px-4 py-2 rounded-lg border border-primario/20 text-sm" />
                    <input type="date" value={calDate} onChange={e => setCalDate(e.target.value)} required className="w-full px-4 py-2 rounded-lg border border-primario/20 text-sm" />
                    <select value={calType} onChange={e => setCalType(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-primario/20 text-sm">
                      <option value="academico">Académico</option>
                      <option value="feriado">Feriado</option>
                      <option value="examen">Examen</option>
                      <option value="evento">Evento General</option>
                    </select>
                    <input type="text" value={calDesc} onChange={e => setCalDesc(e.target.value)} placeholder="Descripción breve" required className="w-full px-4 py-2 rounded-lg border border-primario/20 text-sm" />
                  </div>
                  <button type="submit" className="bg-primario text-white px-6 py-2 rounded-lg text-sm font-bold mt-2">Guardar Evento</button>
                </form>

                <div className="space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-texto/60">Eventos Programados ({events.length})</h3>
                  {events.length === 0 ? <p className="text-sm text-texto/50">No hay eventos personalizados.</p> : null}
                  {events.map((event) => (
                    <div key={event.id} className="flex items-center gap-4 p-4 border border-primario/10 rounded-xl">
                      <div className="flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-primario/10 text-primario rounded-full mb-1 inline-block">{event.type}</span>
                        <h4 className="font-bold text-texto text-sm">{event.title}</h4>
                        <p className="text-xs text-texto/50">{event.date} - {event.description}</p>
                      </div>
                      <button onClick={() => handleDeleteEvent(event.id)} className="p-2 text-alerta hover:bg-alerta/10 rounded-lg transition-colors"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'live' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-texto">Transmisión en Vivo</h2>
                    <p className="text-texto/60 text-sm">Controla la visibilidad y señal de video para transmitir en directo (YouTube o Facebook).</p>
                  </div>
                  {showLiveOption && (
                    <button
                      type="button"
                      onClick={handleQuickDisableLive}
                      disabled={isSavingLive}
                      className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                    >
                      <Radio className="w-3.5 h-3.5 text-red-500" />
                      Ocultar de la Web
                    </button>
                  )}
                </div>

                {liveFeedback && (
                  <div className={`p-4 rounded-xl mb-6 text-sm font-semibold border ${
                    liveFeedback.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}>
                    {liveFeedback.message}
                  </div>
                )}
                
                <form onSubmit={handleSaveLive} className="bg-primario/5 p-6 md:p-8 rounded-2xl border border-primario/10 space-y-6">
                  <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-primario/10 shadow-sm">
                    <div>
                      <h4 className="font-bold text-texto text-base">Mostrar Opción de Transmisión en la Web</h4>
                      <p className="text-xs text-texto/60 mt-1 max-w-lg">
                        {showLiveOption 
                          ? 'Activado: El botón de transmisión es visible en la barra de navegación, menú móvil y pie de página.' 
                          : 'Desactivado: La transmisión está oculta por completo de la página web.'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={showLiveOption} 
                        onChange={(e) => setShowLiveOption(e.target.checked)} 
                      />
                      <div className="w-14 h-7 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {showLiveOption && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-6 pt-2"
                    >
                      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-primario/10">
                        <div>
                          <h4 className="font-bold text-texto text-sm">Estado: Emitiendo en Vivo</h4>
                          <p className="text-xs text-texto/60">
                            {isLive 
                              ? 'La señal parpadeará en rojo ("En Vivo") invitando a los usuarios a conectarse.' 
                              : 'Programada / Señal TV habitual sin alerta roja.'}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={isLive} 
                            onChange={(e) => setIsLive(e.target.checked)} 
                          />
                          <div className="w-14 h-7 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-500"></div>
                        </label>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">
                          Título del Evento
                        </label>
                        <input 
                          type="text" 
                          value={liveTitle} 
                          onChange={e => setLiveTitle(e.target.value)} 
                          placeholder="Ej. Ceremonia de Graduación 2026" 
                          className="w-full px-4 py-3 rounded-xl border border-primario/20 text-sm bg-white focus:ring-2 focus:ring-primario/20 outline-none" 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">
                          Enlace de Integración (Embed URL)
                        </label>
                        <input 
                          type="text" 
                          value={liveUrl} 
                          onChange={e => setLiveUrl(e.target.value)} 
                          placeholder="Pega el enlace o el código <iframe> completo (YouTube o Facebook)" 
                          className="w-full px-4 py-3 rounded-xl border border-primario/20 text-sm bg-white focus:ring-2 focus:ring-primario/20 outline-none font-mono" 
                        />
                        <p className="text-xs text-texto/50 mt-2">
                          Puedes pegar directamente el enlace de YouTube/Facebook o el código <strong>&lt;iframe&gt;</strong> completo; el sistema extraerá automáticamente el enlace de transmisión.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  <div className="flex flex-wrap gap-4 pt-2">
                    <button 
                      type="submit" 
                      disabled={isSavingLive}
                      className="bg-primario hover:bg-primario/90 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSavingLive ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Guardando en Firebase...
                        </>
                      ) : (
                        'Guardar Configuración'
                      )}
                    </button>
                    {showLiveOption && (
                      <button 
                        type="button" 
                        onClick={handleQuickDisableLive}
                        disabled={isSavingLive}
                        className="bg-white hover:bg-red-50 text-red-600 border border-red-200 px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        Ocultar de la Web
                      </button>
                    )}
                  </div>
                </form>
              </motion.div>
            )}

            {activeTab === 'staff' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-2xl font-bold text-texto mb-6">Directorio de Personal</h2>

                {staffFeedback && (
                  <div className={`p-4 rounded-xl mb-6 text-sm font-semibold border ${
                    staffFeedback.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}>
                    {staffFeedback.message}
                  </div>
                )}

                <form onSubmit={handleAddStaff} className="bg-primario/5 p-6 rounded-2xl mb-8 space-y-4 border border-primario/10">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-texto/60 mb-2 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Añadir Miembro del Personal
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      value={staffName} 
                      onChange={e => setStaffName(e.target.value)} 
                      placeholder="Nombre Completo" 
                      required 
                      className="w-full px-4 py-3 rounded-xl border border-primario/20 text-sm bg-white outline-none focus:ring-2 focus:ring-primario/20" 
                    />
                    <input 
                      type="text" 
                      value={staffRole} 
                      onChange={e => setStaffRole(e.target.value)} 
                      placeholder="Cargo o Puesto" 
                      required 
                      className="w-full px-4 py-3 rounded-xl border border-primario/20 text-sm bg-white outline-none focus:ring-2 focus:ring-primario/20" 
                    />
                    <input 
                      type="email" 
                      value={staffEmail} 
                      onChange={e => setStaffEmail(e.target.value)} 
                      placeholder="Correo Electrónico (Opcional)" 
                      className="w-full px-4 py-3 rounded-xl border border-primario/20 text-sm bg-white outline-none focus:ring-2 focus:ring-primario/20" 
                    />
                    <select 
                      value={staffCategory} 
                      onChange={e => setStaffCategory(e.target.value)} 
                      className="w-full px-4 py-3 rounded-xl border border-primario/20 text-sm bg-white outline-none focus:ring-2 focus:ring-primario/20"
                    >
                      <option value="docentes">Docente</option>
                      <option value="autoridades">Autoridad</option>
                      <option value="administrativos">Administrativo</option>
                    </select>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider mb-2">
                      Fotografía del Personal
                    </label>
                    <ImageUploader value={staffImage} onChange={setStaffImage} />
                  </div>

                  <button 
                    type="submit" 
                    disabled={!staffName || isSavingStaff} 
                    className="w-full sm:w-auto bg-primario text-white px-8 py-3 rounded-xl text-sm font-bold shadow-md hover:bg-primario/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSavingStaff ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Guardando en Firebase...
                      </>
                    ) : (
                      'Guardar Personal'
                    )}
                  </button>
                </form>

                <div className="space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-texto/60">Personal Registrado ({staff.length})</h3>
                  {staff.length === 0 ? <p className="text-sm text-texto/50">No hay personal registrado aún.</p> : null}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {staff.map((member) => (
                      <div key={member.id} className="flex gap-4 p-4 border border-primario/10 rounded-xl bg-white shadow-sm items-center relative group">
                        <img src={member.image || 'https://via.placeholder.com/150'} alt={member.name} className="w-14 h-14 rounded-full object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-primario/10 text-primario rounded-full mb-1 inline-block">{member.category}</span>
                          <h4 className="font-bold text-texto text-sm truncate">{member.name}</h4>
                          <p className="text-xs text-texto/50 truncate">{member.role}</p>
                        </div>
                        <button onClick={() => handleDeleteStaff(member.id)} className="p-2 text-alerta hover:bg-alerta/10 rounded-lg transition-colors absolute right-2 top-2 opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'inventoryQr' && (
              <AdminQrInventory />
            )}

            {activeTab === 'materials' && (
              <AdminCustomMaterials
                onSelectForBatch={(mat, targetLab) => {
                  setActiveTab('inventoryQr');
                }}
                onOpenConfig={() => setActiveTab('pageEditor')}
              />
            )}

            {activeTab === 'security' && (
              <AdminSecurityVerification />
            )}

            {activeTab === 'helpdeskConfig' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <AdminHelpdeskConfig />
              </motion.div>
            )}

            {activeTab === 'sorteos' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <AdminSorteoManager />
              </motion.div>
            )}

          </section>
        </div>
      </main>
    </div>
  );
}
