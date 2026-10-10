import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, BookOpen, Flag, GraduationCap, Filter, CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

type EventType = 'todos' | 'academico' | 'feriado' | 'examen' | 'evento';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: Exclude<EventType, 'todos'>;
  description: string;
}

export default function Calendar() {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState<EventType>('todos');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const TYPE_CONFIG = {
    academico: { icon: BookOpen, color: 'text-primario', bg: 'bg-primario/10', label: t('calendar.filterAcademic') },
    feriado: { icon: Flag, color: 'text-alerta', bg: 'bg-alerta/10', label: t('calendar.filterHoliday') },
    examen: { icon: GraduationCap, color: 'text-secundario', bg: 'bg-secundario/10', label: t('calendar.filterExam') },
    evento: { icon: CalendarIcon, color: 'text-detalle', bg: 'bg-detalle/20', label: t('calendar.filterEvent') },
  };

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'events'), 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CalendarEvent[];
        const sorted = (data || []).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        setEvents(sorted);
        setIsLoading(false);
      }, 
      (error) => {
        console.warn('Calendar onSnapshot notice:', error?.message);
        setEvents([]);
        setIsLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const filteredEvents = events.filter(
    (event) => filter === 'todos' || event.type === filter
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        const locale = i18n.language?.startsWith('en') ? 'en-US' : 'es-EC';
        return date.toLocaleDateString(locale, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  const EASE_OUT = [0.23, 1, 0.32, 1] as const;

  return (
    <motion.section 
      id="calendario" 
      className="py-24 bg-fondo border-t border-primario/10 scroll-mt-20"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: EASE_OUT }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <motion.div 
          className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <div>
            <span className="text-alerta font-bold tracking-widest text-xs uppercase mb-3 block">
              {t('calendar.badge')}
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-texto leading-[1.1]">
              {t('calendar.heading')}
            </h2>
            <p className="mt-4 text-texto/70 max-w-xl text-base">
              {t('calendar.subtitle')}
            </p>
          </div>

          {events.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              <Filter className="w-4 h-4 text-texto/50 shrink-0 ml-1 hidden sm:block" />
              {(['todos', 'academico', 'feriado', 'examen', 'evento'] as EventType[]).map((type) => (
                <motion.button
                  key={type}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilter(type)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all shrink-0 cursor-pointer ${
                    filter === type
                      ? 'bg-primario text-white shadow-sm'
                      : 'bg-primario/5 text-texto/70 hover:bg-primario/10 hover:text-texto'
                  }`}
                >
                  {type === 'todos' ? t('calendar.filterAll') : TYPE_CONFIG[type].label}
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <span className="w-8 h-8 rounded-full border-4 border-primario/20 border-t-primario animate-spin mb-4"></span>
            <p className="text-xs text-texto/50">{t('calendar.loading')}</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="bg-primario/5 border border-dashed border-primario/20 rounded-3xl p-12 text-center max-w-2xl mx-auto"
          >
            <div className="w-16 h-16 bg-primario/10 text-primario rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-texto mb-2">{t('calendar.noEvents')}</h3>
            <p className="text-sm text-texto/60 max-w-md mx-auto">
              {i18n.language?.startsWith('en') 
                ? 'School administration will publish official schedules and dates in this portal.' 
                : 'La secretaría y rectorado publicarán las fechas oficiales y actividades extracurriculares a través del portal.'}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredEvents.map((event, idx) => {
                const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.academico;
                const Icon = config.icon;

                return (
                  <motion.div
                    key={event.id}
                    layout
                    initial={{ opacity: 0, y: 16, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -6, scale: 1.01, transition: { type: "spring", stiffness: 350, damping: 20 } }}
                    transition={{ duration: 0.35, delay: idx * 0.05, ease: EASE_OUT }}
                    className="bg-white rounded-3xl p-6 border border-primario/10 hover:border-primario/30 transition-shadow hover:shadow-xl flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${config.bg} ${config.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {config.label}
                        </span>
                        <span className="text-xs font-bold text-texto/40 font-mono">
                          {event.date}
                        </span>
                      </div>

                      <h3 className="font-bold text-lg text-texto group-hover:text-primario transition-colors mb-2 leading-snug">
                        {event.title}
                      </h3>

                      <p className="text-sm text-texto/70 leading-relaxed">
                        {event.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-primario/5 text-xs font-semibold text-texto/50 capitalize">
                      {formatDate(event.date)}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.section>
  );
}
