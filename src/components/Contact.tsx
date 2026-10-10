import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Phone, Mail, Clock, MessageSquare, X, CheckCircle2, Loader2 } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSiteContent } from '../context/SiteContentContext';
import { useCybersecurity } from '../context/CybersecurityContext';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function Contact() {
  const { t } = useTranslation();
  const { content } = useSiteContent();
  const { inspectAndGuard } = useCybersecurity();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setError('');

    const formData = new FormData(form);
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const message = formData.get('message') as string;

    // Inspección de Ciberseguridad WAF en tiempo real
    const wafCheck = inspectAndGuard({ firstName, lastName, email, message }, 'formulario_contacto');
    if (!wafCheck.isSafe) {
      setError('Petición bloqueada por el Firewall de Ciberseguridad (WAF): contenido sospechoso o malicioso interceptado.');
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setError(t('contact.firstNameLabel') + ' & ' + t('contact.lastNameLabel') + ' requeridos.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    if (!message.trim() || message.trim().length < 10) {
      setError('Por favor, ingresa un mensaje detallado (mínimo 10 caracteres).');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, 'messages'), {
        name: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim(),
        message: message.trim(),
        createdAt: Date.now()
      });

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        form.reset();
        setShowForm(false);
      }, 3000);
    } catch (err: any) {
      console.error('Error guardando mensaje:', err);
      setError('No se pudo enviar el mensaje. Por favor intenta llamarnos directamente o por WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const EASE_OUT = [0.23, 1, 0.32, 1] as const;

  const contactItems = [
    {
      icon: <MapPin className="w-5 h-5" />,
      title: t('contact.addressLabel'),
      desc: content.contactAddress || 'Cantón Salinas, Provincia de Santa Elena, Ecuador'
    },
    {
      icon: <Phone className="w-5 h-5" />,
      title: t('contact.phoneLabel'),
      desc: content.contactPhone || '0981179375'
    },
    ...(content.contactEmail ? [{
      icon: <Mail className="w-5 h-5" />,
      title: t('contact.emailLabel'),
      desc: content.contactEmail
    }] : []),
    {
      icon: <Clock className="w-5 h-5" />,
      title: t('contact.scheduleLabel'),
      desc: content.contactSchedule || 'Lunes a Viernes: 8:00 AM - 5:00 PM'
    }
  ];

  return (
    <motion.section 
      id="contacto" 
      className="py-24 bg-fondo border-t border-primario/10"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: EASE_OUT }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: EASE_OUT }}
          >
            <h2 className="text-alerta font-bold tracking-widest text-xs uppercase mb-4">{t('contact.badge')}</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight text-texto leading-[1.1] mb-6">{t('contact.heading')}</h3>
            <p className="text-lg text-texto/60 leading-relaxed mb-10">
              {t('contact.subtitle')}
            </p>

            <div className="space-y-6">
              {contactItems.map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.08, ease: EASE_OUT }}
                  className="flex items-start gap-4 p-3 rounded-2xl hover:bg-primario/5 transition-colors"
                >
                  <div className="w-10 h-10 bg-primario/10 rounded-xl flex items-center justify-center text-primario shrink-0 shadow-xs">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-texto">{item.title}</h4>
                    <p className="text-sm text-texto/60">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2, ease: EASE_OUT }}
              className="mt-8 pt-8 border-t border-primario/10"
            >
              <div className="bg-primario/5 p-6 rounded-3xl border border-primario/10 flex flex-col items-start gap-4">
                <div>
                  <h4 className="font-bold text-texto mb-1">¿Desea continuar en el instituto o inscribir a su hijo/a?</h4>
                  <p className="text-sm text-texto/60">Complete los formularios en línea para agilizar el proceso.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <Link 
                    to="/inscripcion" 
                    className="flex-1 bg-alerta text-white px-6 py-3.5 rounded-full text-sm font-bold shadow-lg shadow-alerta/20 hover:bg-alerta/90 hover:scale-105 active:scale-95 transition-all inline-flex items-center justify-center text-center cursor-pointer"
                  >
                    {t('programs.startAdmission')}
                  </Link>
                  <a 
                    href={content.continueFormUrl && content.continueFormUrl !== '#' ? content.continueFormUrl : `https://wa.me/593${(content.contactPhone || '0981179375').replace(/^0/, '')}?text=${encodeURIComponent('Hola, me comunico para renovar la matrícula / seguir en el instituto.')}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex-1 bg-primario text-white px-6 py-3.5 rounded-full text-sm font-bold shadow-lg shadow-primario/20 hover:bg-primario/90 hover:scale-105 active:scale-95 transition-all inline-flex items-center justify-center text-center cursor-pointer"
                  >
                    Seguir en el Instituto
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: EASE_OUT }}
            className="flex flex-col gap-8"
          >
            {/* Ubicación / Mapa */}
            <motion.div 
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="rounded-3xl overflow-hidden border border-primario/15 shadow-md aspect-video bg-neutral-100"
            >
              <iframe 
                src={`https://maps.google.com/maps?q=${encodeURIComponent(content.mapsEmbedQuery || 'Unidad Educativa Virgen del Cisne,Salinas,Ecuador')}&t=&z=17&ie=UTF8&iwloc=&output=embed`} 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </motion.div>

            {/* Formulario Toggle */}
            {!showForm ? (
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowForm(true)}
                className="w-full bg-primario text-white py-4 rounded-3xl font-bold flex items-center justify-center gap-2 hover:bg-primario/90 transition-all shadow-md cursor-pointer"
              >
                <MessageSquare className="w-5 h-5" /> {t('contact.openFormBtn')}
              </motion.button>
            ) : (
              <AnimatePresence>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ type: "spring", duration: 0.45, bounce: 0.1 }}
                  className="bg-white p-8 rounded-3xl border border-primario/15 shadow-xl relative overflow-hidden"
                >
                  <button 
                    type="button" 
                    onClick={() => setShowForm(false)}
                    className="absolute top-6 right-6 text-texto/40 hover:text-texto transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <div className="mb-6">
                    <h3 className="font-bold text-xl text-texto mb-2">{t('contact.modalTitle')}</h3>
                    <p className="text-sm text-texto/60">{t('contact.subtitle')}</p>
                  </div>
                  {error && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 text-red-800 p-4 rounded-xl mb-6 border border-red-200 text-center text-sm font-medium">{error}</motion.div>)}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="firstName" className="block text-[11px] font-bold text-texto/50 uppercase tracking-wider mb-2">{t('contact.firstNameLabel')}</label>
                        <input type="text" id="firstName" name="firstName" required className="w-full px-4 py-3.5 rounded-xl border border-primario/20 bg-neutral-50 focus:bg-fondo focus:ring-2 focus:ring-primario/20 focus:border-primario outline-none transition-all text-sm" placeholder={t('contact.firstNamePlaceholder')} />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-[11px] font-bold text-texto/50 uppercase tracking-wider mb-2">{t('contact.lastNameLabel')}</label>
                        <input type="text" id="lastName" name="lastName" required className="w-full px-4 py-3.5 rounded-xl border border-primario/20 bg-neutral-50 focus:bg-fondo focus:ring-2 focus:ring-primario/20 focus:border-primario outline-none transition-all text-sm" placeholder={t('contact.lastNamePlaceholder')} />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-[11px] font-bold text-texto/50 uppercase tracking-wider mb-2">{t('contact.emailInputLabel')}</label>
                      <input type="email" id="email" name="email" required className="w-full px-4 py-3.5 rounded-xl border border-primario/20 bg-neutral-50 focus:bg-fondo focus:ring-2 focus:ring-primario/20 focus:border-primario outline-none transition-all text-sm" placeholder={t('contact.emailPlaceholder')} />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-[11px] font-bold text-texto/50 uppercase tracking-wider mb-2">{t('contact.messageLabel')}</label>
                      <textarea id="message" name="message" rows={4} required className="w-full px-4 py-3.5 rounded-xl border border-primario/20 bg-neutral-50 focus:bg-fondo focus:ring-2 focus:ring-primario/20 focus:border-primario outline-none transition-all resize-none text-sm" placeholder={t('contact.messagePlaceholder')}></textarea>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmitting || showSuccess}
                      className={`w-full text-white py-3.5 rounded-full text-sm font-medium shadow-lg transition-colors flex items-center justify-center gap-2 ${showSuccess ? 'bg-green-500 shadow-green-500/20' : 'bg-primario shadow-primario/20 hover:bg-primario/90'} disabled:opacity-90 disabled:cursor-not-allowed`}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" /> {t('contact.submitting')}
                        </>
                      ) : showSuccess ? (
                        <>
                          <CheckCircle2 className="w-5 h-5" /> {t('contact.successTitle')}
                        </>
                      ) : (
                        t('contact.submitBtn')
                      )}
                    </button>
                  </form>
                </motion.div>
              </AnimatePresence>
            )}
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
