import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Users, GraduationCap, Briefcase, Mail } from 'lucide-react';
import SEO from './SEO';

export type StaffMember = {
  id?: string;
  name: string;
  role: string;
  category: string;
  image: string;
  email?: string;
  createdAt?: number;
};

export default function StaffDirectory() {
  const { t } = useTranslation();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('todos');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'staff'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StaffMember));
      setStaff(data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    }, (error) => {
      console.warn('Staff onSnapshot notice:', error?.message);
    });
    return () => unsub();
  }, []);

  const categories = [
    { id: 'todos', label: t('directory.all') },
    { id: 'autoridades', label: t('directory.authorities') },
    { id: 'docentes', label: t('directory.faculty') },
    { id: 'administrativos', label: t('directory.administrative') }
  ];

  const filteredStaff = activeCategory === 'todos'
    ? staff
    : staff.filter(member => member.category === activeCategory);

  return (
    <main className="flex-1 w-full pt-32 pb-24 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto min-h-screen">
      <SEO 
        title={t('directory.title')}
        description={t('directory.subtitle')}
        path="/directorio"
      />
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="text-center mb-12"
      >
        <div className="w-16 h-16 bg-primario/10 text-primario rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          <Users className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-texto leading-[1.1] mb-6">
          {t('directory.title')}
        </h1>
        <p className="text-lg text-texto/60 max-w-2xl mx-auto leading-relaxed mb-10">
          {t('directory.subtitle')}
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold capitalize transition-all duration-300 ${
                activeCategory === cat.id 
                  ? 'bg-primario text-white shadow-md scale-105' 
                  : 'bg-primario/10 text-primario hover:bg-primario/20'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </motion.div>

      {staff.length === 0 ? (
        <div className="text-center py-20 text-texto/50 font-medium">
          {t('directory.noStaff')}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {filteredStaff.map((member, index) => (
            <motion.div 
              key={member.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="bg-white rounded-3xl overflow-hidden border border-primario/10 shadow-sm hover:shadow-md transition-shadow group flex flex-col"
            >
              <div className="aspect-[4/5] w-full bg-primario/5 overflow-hidden relative flex items-center justify-center">
                {member.image ? (
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primario/10 text-primario flex items-center justify-center font-bold text-2xl">
                    {member.name.charAt(0)}
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-sm text-primario">
                  {member.category === 'autoridades' && <Briefcase className="w-4 h-4" />}
                  {member.category === 'docentes' && <GraduationCap className="w-4 h-4" />}
                  {member.category === 'administrativos' && <Users className="w-4 h-4" />}
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <span className="text-[10px] font-bold text-secundario uppercase tracking-wider mb-2 block">{member.category}</span>
                <h3 className="font-bold text-lg text-texto leading-snug mb-1">{member.name}</h3>
                <p className="text-sm text-texto/60 font-medium mb-4">{member.role}</p>
                
                {member.email && (
                  <a href={`mailto:${member.email}`} className="mt-auto inline-flex items-center gap-2 text-xs font-bold text-primario hover:text-primario/80 transition-colors">
                    <Mail className="w-3.5 h-3.5" /> {member.email}
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </main>
  );
}
