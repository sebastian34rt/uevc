import { motion } from 'motion/react';
import { Target, Heart, Lightbulb, Users, Compass, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSiteContent } from '../context/SiteContentContext';

export default function About() {
  const { t } = useTranslation();
  const { content } = useSiteContent();
  const values = [
    {
      icon: <Target className="w-6 h-6" />,
      title: t('about.valAcademic'),
      description: t('about.valAcademicDesc')
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: t('about.valHuman'),
      description: t('about.valHumanDesc')
    },
    {
      icon: <Lightbulb className="w-6 h-6" />,
      title: t('about.valInnovation'),
      description: t('about.valInnovationDesc')
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: t('about.valCommunity'),
      description: t('about.valCommunityDesc')
    }
  ];

  const EASE_OUT = [0.23, 1, 0.32, 1] as const;

  return (
    <motion.section 
      id="nosotros" 
      className="py-24 bg-fondo border-y border-primario/10"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease: EASE_OUT }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <h2 className="text-alerta font-bold tracking-widest text-xs uppercase mb-4">{t('about.badge')}</h2>
          <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight text-texto leading-[1.1] mb-6">{t('about.heading')}</h3>
          <p className="text-lg text-texto/60 leading-relaxed font-medium">
            {content.aboutPrincipalRole || t('about.principalRole')}: <span className="text-primario font-bold">{content.aboutPrincipalAuthority || 'Marjorie Cecibell Floreano Mateo'}</span>
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: EASE_OUT }}
            className="bg-primario/5 p-8 md:p-10 rounded-3xl border border-primario/10 flex flex-col justify-start relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primario/20"
          >
            <div className="w-14 h-14 bg-primario text-white rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-transform duration-300 group-hover:scale-105">
              <Compass className="w-7 h-7" />
            </div>
            <h4 className="text-2xl font-extrabold text-texto mb-4">{t('about.missionTitle')}</h4>
            <p className="text-texto/70 leading-relaxed font-sans">
              {content.aboutMission || t('about.missionDefault')}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.1, ease: EASE_OUT }}
            className="bg-secundario/5 p-8 md:p-10 rounded-3xl border border-secundario/10 flex flex-col justify-start relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-secundario/20"
          >
            <div className="w-14 h-14 bg-secundario text-white rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-transform duration-300 group-hover:scale-105">
              <Eye className="w-7 h-7" />
            </div>
            <h4 className="text-2xl font-extrabold text-texto mb-4">{t('about.visionTitle')}</h4>
            <p className="text-texto/70 leading-relaxed font-sans">
              {content.aboutVision || (
                <>{t('about.visionDefaultPrefix')} <span className="font-quote italic font-semibold text-secundario">“{content.aboutSlogan || t('about.visionDefaultSlogan')}”</span>{t('about.visionDefaultSuffix')}</>
              )}
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.07, ease: EASE_OUT }}
              className="bg-fondo p-6 rounded-3xl border border-primario/10 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between group cursor-default"
            >
              <div className="w-10 h-10 bg-primario/10 rounded-xl flex items-center justify-center mb-4 text-primario group-hover:bg-primario group-hover:text-white transition-colors duration-200">
                {value.icon}
              </div>
              <h4 className="font-bold text-lg leading-tight mb-2 text-texto">{value.title}</h4>
              <p className="text-sm text-texto/60 leading-relaxed font-sans">{value.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
