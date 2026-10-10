import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { SiteContent, defaultSiteContent } from '../types/siteContent';

interface SiteContentContextType {
  content: SiteContent;
  updateContent: (newValues: Partial<SiteContent>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  loading: boolean;
  isSaving: boolean;
}

const SiteContentContext = createContext<SiteContentContextType>({
  content: defaultSiteContent,
  updateContent: async () => {},
  resetToDefaults: async () => {},
  loading: true,
  isSaving: false,
});

export const SiteContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<SiteContent>(defaultSiteContent);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'siteConfig', 'pageContent'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Partial<SiteContent>;
          setContent({
            ...defaultSiteContent,
            ...data,
          });
        } else {
          setContent(defaultSiteContent);
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Notice fetching page content from Firebase:', error?.message);
        setContent(defaultSiteContent);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const updateContent = async (newValues: Partial<SiteContent>) => {
    setIsSaving(true);
    try {
      const merged = { ...content, ...newValues };
      await setDoc(doc(db, 'siteConfig', 'pageContent'), merged, { merge: true });
      setContent(merged);
    } catch (error) {
      console.error('Error updating site content:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'siteConfig', 'pageContent'), defaultSiteContent);
      setContent(defaultSiteContent);
    } catch (error) {
      console.error('Error resetting site content:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SiteContentContext.Provider
      value={{
        content,
        updateContent,
        resetToDefaults,
        loading,
        isSaving,
      }}
    >
      {children}
    </SiteContentContext.Provider>
  );
};

export const useSiteContent = () => useContext(SiteContentContext);
