import { motion } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import SEO from './SEO';

export default function Enrollment() {
  const { t } = useTranslation();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    
    const studentFirstName = formData.get('studentFirstName') as string;
    const studentLastName = formData.get('studentLastName') as string;
    const dob = formData.get('dob') as string;
    const level = formData.get('level') as string;
    const parentName = formData.get('parentName') as string;
    const parentEmail = formData.get('parentEmail') as string;
    const parentPhone = formData.get('parentPhone') as string;

    // Validaciones básicas para que no envíen vacío
    if (!studentFirstName.trim() || !studentLastName.trim() || !parentName.trim()) {
      setError('Por favor, ingresa nombres y apellidos válidos.');
      setIsSubmitting(false);
      return;
    }

    if (!level) {
      setError('Por favor, selecciona un nivel a postular.');
      setIsSubmitting(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(parentEmail)) {
      setError('Por favor, ingresa un correo electrónico válido.');
      setIsSubmitting(false);
      return;
    }

    const phoneRegex = /^[0-9+\s-]{8,15}$/;
    if (!phoneRegex.test(parentPhone)) {
      setError('Por favor, ingresa un número de teléfono válido (entre 8 y 15 dígitos).');
      setIsSubmitting(false);
      return;
    }

    const data = {
      studentFirstName,
      studentLastName,
      dob,
      level,
      parentName,
      parentEmail,
      parentPhone,
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, 'enrollments'), data);
      setIsSubmitted(true);
      e.currentTarget.reset();
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch (err) {
      console.error('Error adding document: ', err);
      setError('Hubo un error al enviar la solicitud. Por favor, inténtelo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-primario/5 py-24 px-4 sm:px-6 lg:px-10 flex items-center justify-center">
      <SEO 
        title={t('enrollment.title')}
        description={t('enrollment.subtitle')}
        path="/inscripcion"
      />
      <motion.div 
        className="w-full max-w-3xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Link to="/" className="inline-flex items-center gap-2 text-primario hover:text-primario/80 font-bold mb-8 text-sm transition-colors cursor-pointer">
          <ChevronLeft className="w-4 h-4" /> {t('enrollment.backHome')}
        </Link>
        
        <div className="bg-fondo p-8 md:p-12 rounded-[2rem] border border-primario/10 shadow-sm">
          <div className="mb-10 text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-texto leading-[1.1] mb-4">
              {t('enrollment.title')}
            </h1>
            <p className="text-texto/60 text-lg">
              {t('enrollment.subtitle')}
            </p>
          </div>

          {isSubmitted && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 text-emerald-800 p-6 rounded-2xl mb-8 border border-emerald-200 text-center"
            >
              <h3 className="font-bold text-lg mb-2 text-emerald-900">{t('enrollment.successTitle')}</h3>
              <p className="text-sm text-emerald-800 mb-4">
                {t('enrollment.successDesc')}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Registrar otro estudiante
                </button>
                <Link
                  to="/"
                  className="bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-5 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  {t('enrollment.backHome')}
                </Link>
              </div>
            </motion.div>
          )}

          {error && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 text-red-800 p-4 rounded-xl mb-8 border border-red-200 text-center text-sm font-medium">{error}</motion.div>)}
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <h3 className="font-bold text-lg text-texto border-b border-primario/10 pb-2">{t('enrollment.studentInfo')}</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="studentFirstName" className="block text-[11px] font-bold text-texto/50 uppercase tracking-wider mb-2">{t('enrollment.studentFirstName')}</label>
                  <input type="text" id="studentFirstName" name="studentFirstName" required className="w-full px-4 py-3.5 rounded-xl border border-primario/20 bg-neutral-50 focus:bg-fondo focus:ring-2 focus:ring-primario/20 focus:border-primario outline-none transition-all text-sm" placeholder="Ej. Carlos" />
                </div>
                <div>
                  <label htmlFor="studentLastName" className="block text-[11px] font-bold text-texto/50 uppercase tracking-wider mb-2">{t('enrollment.studentLastName')}</label>
                  <input type="text" id="studentLastName" name="studentLastName" required className="w-full px-4 py-3.5 rounded-xl border border-primario/20 bg-neutral-50 focus:bg-fondo focus:ring-2 focus:ring-primario/20 focus:border-primario outline-none transition-all text-sm" placeholder="Ej. Gómez" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="dob" className="block text-[11px] font-bold text-texto/50 uppercase tracking-wider mb-2">{t('enrollment.dob')}</label>
                  <input type="date" id="dob" name="dob" required className="w-full px-4 py-3.5 rounded-xl border border-primario/20 bg-neutral-50 focus:bg-fondo focus:ring-2 focus:ring-primario/20 focus:border-primario outline-none transition-all text-sm text-texto/80" />
                </div>
                <div>
                  <label htmlFor="level" className="block text-[11px] font-bold text-texto/50 uppercase tracking-wider mb-2">{t('enrollment.level')}</label>
                  <select id="level" name="level" required className="w-full px-4 py-3.5 rounded-xl border border-primario/20 bg-neutral-50 focus:bg-fondo focus:ring-2 focus:ring-primario/20 focus:border-primario outline-none transition-all text-sm appearance-none cursor-pointer">
                    <option value="">{t('enrollment.selectLevel')}</option>
                    <option value="inicial">{t('enrollment.levelInicial')}</option>
                    <option value="preparatoria">{t('enrollment.levelPreparatoria')}</option>
                    <option value="elemental">{t('enrollment.levelElemental')}</option>
                    <option value="media">{t('enrollment.levelMedia')}</option>
                    <option value="superior">{t('enrollment.levelSuperior')}</option>
                    <option value="bachillerato">{t('enrollment.levelBachillerato')}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="font-bold text-lg text-texto border-b border-primario/10 pb-2">{t('enrollment.parentInfo')}</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="parentName" className="block text-[11px] font-bold text-texto/50 uppercase tracking-wider mb-2">{t('enrollment.parentName')}</label>
                  <input type="text" id="parentName" name="parentName" required className="w-full px-4 py-3.5 rounded-xl border border-primario/20 bg-neutral-50 focus:bg-fondo focus:ring-2 focus:ring-primario/20 focus:border-primario outline-none transition-all text-sm" placeholder="Nombre completo" />
                </div>
                <div>
                  <label htmlFor="parentEmail" className="block text-[11px] font-bold text-texto/50 uppercase tracking-wider mb-2">{t('enrollment.parentEmail')}</label>
                  <input type="email" id="parentEmail" name="parentEmail" required className="w-full px-4 py-3.5 rounded-xl border border-primario/20 bg-neutral-50 focus:bg-fondo focus:ring-2 focus:ring-primario/20 focus:border-primario outline-none transition-all text-sm" placeholder="correo@ejemplo.com" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="parentPhone" className="block text-[11px] font-bold text-texto/50 uppercase tracking-wider mb-2">{t('enrollment.parentPhone')}</label>
                  <input type="tel" id="parentPhone" name="parentPhone" required className="w-full px-4 py-3.5 rounded-xl border border-primario/20 bg-neutral-50 focus:bg-fondo focus:ring-2 focus:ring-primario/20 focus:border-primario outline-none transition-all text-sm" placeholder="+593 XXX XXX XXX" />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button type="submit" disabled={isSubmitting} className="w-full bg-alerta text-white py-4 rounded-xl text-sm font-bold shadow-lg shadow-alerta/20 hover:bg-alerta/90 transition-colors uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 cursor-pointer">
                {isSubmitting ? (
                  <>
                    <span className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
                    {t('enrollment.submitting')}
                  </>
                ) : (
                  t('enrollment.submit')
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </main>
  );
}
