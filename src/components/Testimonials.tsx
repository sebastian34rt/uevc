import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quote, Plus, X, MessageSquareHeart, CheckCircle2, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

interface TestimonialItem {
  id?: string;
  quote: string;
  author: string;
  role: string;
  createdAt?: any;
}

export default function Testimonials() {
  const { t } = useTranslation();
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [quote, setQuote] = useState('');
  const [author, setAuthor] = useState('');
  const [role, setRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'testimonials'),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TestimonialItem[];
        setTestimonials(data);
        setIsLoading(false);
      },
      (error) => {
        console.warn('Testimonials listener notice:', error?.message);
        // Local fallback
        const stored = localStorage.getItem('custom_testimonials');
        if (stored) {
          try {
            setTestimonials(JSON.parse(stored));
          } catch {
            setTestimonials([]);
          }
        } else {
          setTestimonials([]);
        }
        setIsLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote.trim() || !author.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);

    const newTestimonial: TestimonialItem = {
      quote: quote.trim(),
      author: author.trim(),
      role: role.trim() || 'Comunidad Cisnense',
    };

    try {
      await addDoc(collection(db, 'testimonials'), {
        ...newTestimonial,
        createdAt: serverTimestamp()
      });
      setFeedback('¡Gracias! Tu experiencia ha sido enviada con éxito.');
    } catch (err) {
      console.warn('Direct Firestore write notice, storing locally:', err);
      const updated = [newTestimonial, ...testimonials];
      setTestimonials(updated);
      localStorage.setItem('custom_testimonials', JSON.stringify(updated));
      setFeedback('¡Gracias! Tu experiencia ha sido registrada.');
    } finally {
      setIsSubmitting(false);
      setQuote('');
      setAuthor('');
      setRole('');
      setTimeout(() => {
        setShowForm(false);
        setFeedback(null);
      }, 2500);
    }
  };

  const EASE_OUT = [0.23, 1, 0.32, 1] as const;

  return (
    <motion.section 
      id="testimonios" 
      className="py-24 bg-primario/5 scroll-mt-20 border-t border-primario/10"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: EASE_OUT }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <span className="text-alerta font-bold tracking-widest text-xs uppercase mb-3 block">
            {t('testimonials.badge')}
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-texto leading-[1.1] mb-6">
            {t('testimonials.heading')}
          </h2>
          <p className="text-texto/70 text-base max-w-xl mb-8">
            {t('testimonials.subtitle')}
          </p>
          
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowForm(!showForm)}
            className="bg-primario text-white px-7 py-3.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-primario/90 transition-all shadow-md hover:shadow-xl cursor-pointer"
          >
            {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showForm ? t('common.close') : t('testimonials.leaveTestimonial')}
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {showForm && (
            <motion.div 
              initial={{ opacity: 0, height: 0, scale: 0.96 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.96 }}
              transition={{ type: "spring", duration: 0.45, bounce: 0.1 }}
              className="max-w-2xl mx-auto mb-16 overflow-hidden"
            >
              <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl border border-primario/15 relative">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)}
                  className="absolute top-6 right-6 text-texto/40 hover:text-texto transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
                <h4 className="text-xl font-bold text-texto mb-2">{t('testimonials.formTitle')}</h4>
                <p className="text-xs text-texto/60 mb-6">{t('testimonials.formDesc')}</p>
                
                {feedback && (
                  <motion.div 
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{feedback}</span>
                  </motion.div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-texto uppercase tracking-wider mb-2">{t('testimonials.formQuoteLabel')}</label>
                    <textarea 
                      required
                      rows={4}
                      value={quote}
                      onChange={(e) => setQuote(e.target.value)}
                      placeholder={t('testimonials.formQuotePlaceholder')}
                      className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-2 focus:ring-primario/10 outline-none text-texto text-sm resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-texto uppercase tracking-wider mb-2">{t('testimonials.formAuthorLabel')}</label>
                      <input 
                        type="text" 
                        required
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder={t('testimonials.formAuthorPlaceholder')}
                        className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-2 focus:ring-primario/10 outline-none text-texto text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-texto uppercase tracking-wider mb-2">{t('testimonials.formRoleLabel')}</label>
                      <input 
                        type="text" 
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder={t('testimonials.formRolePlaceholder')}
                        className="w-full px-4 py-3 rounded-xl border border-primario/20 focus:border-primario focus:ring-2 focus:ring-primario/10 outline-none text-texto text-sm"
                      />
                    </div>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-4 bg-primario text-white py-3.5 rounded-xl font-bold hover:bg-primario/90 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? t('testimonials.submitting') : t('testimonials.submitBtn')}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <span className="w-8 h-8 rounded-full border-4 border-primario/20 border-t-primario animate-spin mb-4"></span>
            <p className="text-xs text-texto/50">Cargando experiencias de la comunidad...</p>
          </div>
        ) : testimonials.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="bg-white border border-dashed border-primario/20 rounded-3xl p-12 text-center max-w-2xl mx-auto shadow-sm"
          >
            <div className="w-16 h-16 bg-primario/10 text-primario rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquareHeart className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-texto mb-2">Aún no hay testimonios publicados</h3>
            <p className="text-sm text-texto/60 max-w-md mx-auto mb-6">
              Sé el primero en compartir tu experiencia en la Unidad Educativa Virgen del Cisne haciendo clic en el botón superior.
            </p>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((item, index) => (
              <motion.div 
                key={item.id || index}
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                whileHover={{ y: -6, scale: 1.02, transition: { type: "spring", stiffness: 350, damping: 20 } }}
                transition={{ duration: 0.45, delay: index * 0.08, ease: EASE_OUT }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-primario/10 flex flex-col justify-between relative hover:shadow-xl hover:border-primario/30 transition-all group"
              >
                <div>
                  <Quote className="w-10 h-10 text-primario/20 mb-6 group-hover:text-primario/40 group-hover:scale-110 transition-all" />
                  <p className="text-texto/80 font-normal leading-relaxed text-sm mb-8 italic">
                    "{item.quote}"
                  </p>
                </div>
                <div className="pt-4 border-t border-primario/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primario/10 text-primario flex items-center justify-center font-bold text-sm group-hover:bg-primario group-hover:text-white transition-colors">
                    {item.author.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-texto text-sm">{item.author}</h4>
                    <p className="text-xs text-alerta font-semibold">{item.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}
