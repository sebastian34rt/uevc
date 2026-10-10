import { motion } from 'motion/react';
import { GraduationCap, Brain, FileEdit, BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSiteContent } from '../context/SiteContentContext';
import AnimatedText from './AnimatedText';

export default function Programs() {
  const { t } = useTranslation();
  const { content } = useSiteContent();

  const programs = [
    {
      title: t('programs.bachilleratoTitle'),
      icon: <GraduationCap className="w-5 h-5" />,
      description: content.programBachillerato || t('programs.bachilleratoDefault'),
    },
    {
      title: t('programs.superiorTitle'),
      icon: <Brain className="w-5 h-5" />,
      description: content.programSuperior || t('programs.superiorDefault'),
    },
    {
      title: t('programs.elementalTitle'),
      icon: <FileEdit className="w-5 h-5" />,
      description: content.programElemental || t('programs.elementalDefault'),
    },
    {
      title: t('programs.inicialTitle'),
      icon: <BookOpen className="w-5 h-5" />,
      description: content.programInicial || t('programs.inicialDefault'),
    }
  ];

  const EASE_OUT = [0.23, 1, 0.32, 1] as const;

  return (
    <motion.section 
      id="oferta" 
      className="py-24 bg-primario/5"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease: EASE_OUT }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <motion.div 
          className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <div className="max-w-2xl">
            <h2 className="text-alerta font-bold tracking-widest text-xs uppercase mb-4">{t('programs.badge')}</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight text-texto leading-[1.1] mb-4">
              <AnimatedText text={t('programs.heading')} tag="span" />
            </h3>
            <p className="text-lg text-texto/60 leading-relaxed font-sans select-text">
              {t('programs.subtitle')}
            </p>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {programs.map((program, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              whileHover={{ y: -8, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
              whileTap={{ scale: 0.97 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08, ease: EASE_OUT }}
              className="bg-fondo p-6 rounded-3xl border border-primario/10 shadow-sm hover:shadow-xl hover:border-primario/30 transition-colors duration-300 flex flex-col items-center text-center relative group cursor-pointer"
            >
              <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center text-texto mb-6 border border-primario/5 transition-all duration-300 group-hover:bg-primario/10 group-hover:text-primario group-hover:scale-110 group-hover:rotate-3">
                {program.icon}
              </div>
              <h4 className="font-bold text-lg leading-tight mb-4 text-texto group-hover:text-primario transition-colors">
                {program.title}
              </h4>
              <p className="text-sm text-texto/60 leading-relaxed mb-6 flex-1 font-sans select-text">
                {program.description}
              </p>
              <Link 
                to="/inscripcion"
                className="mt-auto inline-flex items-center gap-1.5 text-xs font-bold text-primario hover:text-primario/90 bg-primario/5 hover:bg-primario/15 px-4 py-2 rounded-full transition-all group-hover:scale-105"
              >
                {t('programs.startAdmission')} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
