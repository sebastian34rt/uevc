import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import SEO from './SEO';

export type GalleryImage = {
  id?: string;
  src: string;
  category: string;
};

export const defaultImages: GalleryImage[] = [
  { src: "/1.jpg", category: "vida académica" },
  { src: "/2.jpg", category: "vida académica" },
  { src: "/3.jpg", category: "deportes" },
  { src: "/4.jpg", category: "vida académica" },
  { src: "/5.jpg", category: "deportes" },
  { src: "/6.jpg", category: "vida académica" },
  { src: "/7.jpg", category: "reconocimientos" },
  { src: "/8.jpg", category: "eventos" },
  { src: "/9.jpg", category: "reconocimientos" },
  { src: "/10.jpg", category: "eventos" },
];

function LazyImage({ src, alt, className }: { src: string, alt: string, className?: string }) {
  const [isLoaded, setIsLoaded] = useState(src.startsWith('data:'));

  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className || ''} aspect-[4/3] w-full`}>
      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsLoaded(true)}
        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          isLoaded ? 'opacity-100 blur-0' : 'opacity-70 blur-sm'
        }`}
        loading="lazy"
      />
    </div>
  );
}

export default function Gallery() {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('todos');
  
  const categoryLabels: Record<string, string> = {
    'todos': t('gallery.all'),
    'eventos': t('gallery.events'),
    'vida académica': t('gallery.academicLife'),
    'deportes': t('gallery.sports'),
    'reconocimientos': t('gallery.awards')
  };

  const categories = ["todos", "eventos", "vida académica", "deportes", "reconocimientos"];

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'gallery'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GalleryImage[];
      const sortedData = data.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
      setImages(sortedData);
    }, (error) => {
      console.warn('Gallery onSnapshot notice:', error?.message);
      setImages(defaultImages);
    });
    return () => unsub();
  }, []);

  const displayImages = images.length > 0 ? images : defaultImages;
  const filteredImages = activeFilter === 'todos' 
    ? displayImages 
    : displayImages.filter(img => img.category === activeFilter);

  return (
    <main className="flex-1 w-full pt-8 pb-24 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
      <SEO 
        title={t('gallery.title')}
        description={t('gallery.subtitle')}
        path="/galeria"
      />
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-texto leading-[1.1] mb-6">
          {t('gallery.title')}
        </h1>
        <p className="text-lg text-texto/60 max-w-2xl mx-auto leading-relaxed mb-6">
          {t('gallery.subtitle')}
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold capitalize transition-all duration-300 ${
                activeFilter === cat 
                  ? 'bg-primario text-white shadow-md scale-105' 
                  : 'bg-primario/10 text-primario hover:bg-primario/20'
              }`}
            >
              {categoryLabels[cat] || cat}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredImages.length === 0 && (
          <div className="col-span-full py-12 text-center text-texto/50">
            {t('gallery.noImages')}
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {filteredImages.map((img, index) => (
            <motion.div 
              key={img.src + index}
              layout
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="relative group rounded-3xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-primario/10 cursor-pointer flex flex-col aspect-[4/3]"
              onClick={() => setSelectedImage(img.src)}
            >
              <LazyImage 
                src={img.src} 
                alt={`Galería ${img.category} ${index + 1}`} 
                className="w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4 pointer-events-none">
                <span className="bg-white/95 backdrop-blur-sm text-primario text-xs font-bold px-3 py-1 rounded-full shadow-sm capitalize">
                  {img.category}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal Visor de Imagen */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out"
          >
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </motion.button>
            <motion.img
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={selectedImage}
              alt="Imagen ampliada"
              className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain cursor-default"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
