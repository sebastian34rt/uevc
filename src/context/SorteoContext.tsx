import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { Sorteo, SorteoTicket } from '../types/sorteo';
import { normalizeTicketCode } from '../utils/sorteoSecurity';

const LOCAL_STORAGE_SORTEOS_KEY = 'uevc_sorteos_cache_v2';
const LOCAL_STORAGE_TICKETS_KEY = 'uevc_sorteo_tickets_cache_v2';

/**
 * Sanitiza un objeto eliminando cualquier propiedad con valor 'undefined',
 * previniendo errores fatales de Firebase: "Unsupported field value: undefined"
 */
function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Partial<T> {
  const clean: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      clean[key] = val;
    }
  }
  return clean;
}

interface SorteoContextType {
  sorteos: Sorteo[];
  tickets: SorteoTicket[];
  loading: boolean;
  syncStatus?: 'synced' | 'syncing' | 'offline';
  createSorteo: (sorteo: Omit<Sorteo, 'id' | 'createdAt'>) => Promise<string>;
  updateSorteo: (id: string, updates: Partial<Sorteo>) => Promise<void>;
  deleteSorteo: (id: string) => Promise<void>;
  createTicket: (ticket: Omit<SorteoTicket, 'id' | 'createdAt'>) => Promise<string>;
  batchCreateTickets: (tickets: Array<Omit<SorteoTicket, 'id' | 'createdAt'>>) => Promise<void>;
  updateTicket: (id: string, updates: Partial<SorteoTicket>) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  clearTicketsForSorteo: (sorteoId: string) => Promise<void>;
  setSorteoWinner: (sorteoId: string, ticketCode: string, participantName: string, prize: string, phone?: string, email?: string) => Promise<void>;
  registerTicket: (ticketId: string, data: { participantName: string; participantPhone: string; participantEmail: string }) => Promise<void>;
}

const SorteoContext = createContext<SorteoContextType | undefined>(undefined);

export const SorteoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicialización inmediata desde almacenamiento local para evitar parpadeos y desincronización
  const [sorteos, setSorteos] = useState<Sorteo[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_SORTEOS_KEY);
        if (cached) return JSON.parse(cached);
      } catch (e) {
        console.warn('Error reading sorteos cache:', e);
      }
    }
    return [];
  });

  const [tickets, setTickets] = useState<SorteoTicket[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
        if (cached) return JSON.parse(cached);
      } catch (e) {
        console.warn('Error reading tickets cache:', e);
      }
    }
    return [];
  });

  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('syncing');

  // Guardar en caché local de forma reactiva y segura
  const saveSorteosCache = (items: Sorteo[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_SORTEOS_KEY, JSON.stringify(items));
      } catch (e) {
        console.warn('LocalStorage quota or error saving sorteos:', e);
      }
    }
  };

  const saveTicketsCache = (items: SorteoTicket[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(items));
      } catch (e) {
        console.warn('LocalStorage quota or error saving tickets:', e);
      }
    }
  };

  // Escuchar sorteos en tiempo real con Firestore y fallback a caché
  useEffect(() => {
    const unsubSorteos = onSnapshot(
      collection(db, 'sorteos'),
      (snapshot) => {
        const items: Sorteo[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() } as Sorteo);
        });
        setSorteos(items);
        saveSorteosCache(items);
        setLoading(false);
        setSyncStatus('synced');
      },
      (error) => {
        console.warn('Notice listening to sorteos (using local cache):', error);
        setLoading(false);
        setSyncStatus('offline');
      }
    );

    const unsubTickets = onSnapshot(
      collection(db, 'sorteo_tickets'),
      (snapshot) => {
        const items: SorteoTicket[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() } as SorteoTicket);
        });
        setTickets(items);
        saveTicketsCache(items);
        setLoading(false);
        setSyncStatus('synced');
      },
      (error) => {
        console.warn('Notice listening to sorteo_tickets (using local cache):', error);
        setLoading(false);
        setSyncStatus('offline');
      }
    );

    return () => {
      unsubSorteos();
      unsubTickets();
    };
  }, []);

  const createSorteo = async (data: Omit<Sorteo, 'id' | 'createdAt'>): Promise<string> => {
    const id = 'sorteo_' + Date.now();
    const newSorteo: Sorteo = {
      ...data,
      id,
      createdAt: new Date().toISOString()
    };

    // Actualización optimista local
    setSorteos(prev => {
      const updated = [newSorteo, ...prev.filter(s => s.id !== id)];
      saveSorteosCache(updated);
      return updated;
    });

    const cleanData = sanitizeForFirestore(newSorteo);
    await setDoc(doc(db, 'sorteos', id), cleanData);
    return id;
  };

  const updateSorteo = async (id: string, updates: Partial<Sorteo>) => {
    // Actualización optimista
    setSorteos(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, ...updates } : s);
      saveSorteosCache(updated);
      return updated;
    });

    const cleanUpdates = sanitizeForFirestore(updates);
    await updateDoc(doc(db, 'sorteos', id), cleanUpdates);
  };

  const deleteSorteo = async (id: string) => {
    // Actualización optimista
    setSorteos(prev => {
      const updated = prev.filter(s => s.id !== id);
      saveSorteosCache(updated);
      return updated;
    });

    const ticketsToDelete = tickets.filter(t => t.sorteoId === id);
    if (ticketsToDelete.length > 0) {
      setTickets(prev => {
        const updated = prev.filter(t => t.sorteoId !== id);
        saveTicketsCache(updated);
        return updated;
      });
    }

    await deleteDoc(doc(db, 'sorteos', id));

    // Eliminar tickets asociados a este sorteo en Firestore por lotes
    if (ticketsToDelete.length > 0) {
      const CHUNK_SIZE = 300;
      for (let i = 0; i < ticketsToDelete.length; i += CHUNK_SIZE) {
        const chunk = ticketsToDelete.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        chunk.forEach(t => {
          batch.delete(doc(db, 'sorteo_tickets', t.id));
        });
        await batch.commit();
      }
    }
  };

  const createTicket = async (data: Omit<SorteoTicket, 'id' | 'createdAt'>): Promise<string> => {
    const id = 'tkt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const cleanCode = normalizeTicketCode(data.ticketCode);
    const newTicket: SorteoTicket = {
      ...data,
      id,
      ticketCode: cleanCode,
      participantName: (data.participantName || '').trim(),
      status: data.status || 'active',
      createdAt: new Date().toISOString()
    };

    // Actualización optimista inmediata para respuesta instantánea en UI
    setTickets(prev => {
      const updated = [newTicket, ...prev.filter(t => t.id !== id)];
      saveTicketsCache(updated);
      return updated;
    });

    const cleanDoc = sanitizeForFirestore(newTicket);
    await setDoc(doc(db, 'sorteo_tickets', id), cleanDoc);
    return id;
  };

  const batchCreateTickets = async (items: Array<Omit<SorteoTicket, 'id' | 'createdAt'>>) => {
    if (!items || items.length === 0) return;

    const now = new Date().toISOString();
    const newTicketsList: SorteoTicket[] = items.map((item, index) => {
      const id = 'tkt_' + Date.now() + '_' + index + '_' + Math.random().toString(36).substring(2, 6);
      return {
        ...item,
        id,
        ticketCode: normalizeTicketCode(item.ticketCode),
        participantName: (item.participantName || '').trim(),
        status: item.status || 'active',
        createdAt: now
      };
    });

    // 1. Guardado optimista inmediato en memoria y LocalStorage
    setTickets(prev => {
      const updated = [...prev, ...newTicketsList];
      saveTicketsCache(updated);
      return updated;
    });

    // 2. Guardado en Firestore en bloques seguros (máximo 300 por WriteBatch)
    const CHUNK_SIZE = 300;
    for (let i = 0; i < newTicketsList.length; i += CHUNK_SIZE) {
      const chunk = newTicketsList.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((ticket) => {
        const cleanDoc = sanitizeForFirestore(ticket);
        batch.set(doc(db, 'sorteo_tickets', ticket.id), cleanDoc);
      });
      await batch.commit();
    }
  };

  const updateTicket = async (id: string, updates: Partial<SorteoTicket>) => {
    const cleanUpdates = { ...updates };
    if (cleanUpdates.ticketCode) {
      cleanUpdates.ticketCode = normalizeTicketCode(cleanUpdates.ticketCode);
    }

    // Actualización optimista
    setTickets(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...cleanUpdates } : t);
      saveTicketsCache(updated);
      return updated;
    });

    const sanitized = sanitizeForFirestore(cleanUpdates);
    await updateDoc(doc(db, 'sorteo_tickets', id), sanitized);
  };

  const deleteTicket = async (id: string) => {
    // Actualización optimista
    setTickets(prev => {
      const updated = prev.filter(t => t.id !== id);
      saveTicketsCache(updated);
      return updated;
    });

    await deleteDoc(doc(db, 'sorteo_tickets', id));
  };

  const clearTicketsForSorteo = async (sorteoId: string) => {
    const toDelete = tickets.filter(t => t.sorteoId === sorteoId);
    if (toDelete.length === 0) return;

    // Actualización optimista
    setTickets(prev => {
      const updated = prev.filter(t => t.sorteoId !== sorteoId);
      saveTicketsCache(updated);
      return updated;
    });

    const CHUNK_SIZE = 300;
    for (let i = 0; i < toDelete.length; i += CHUNK_SIZE) {
      const chunk = toDelete.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach(t => {
        batch.delete(doc(db, 'sorteo_tickets', t.id));
      });
      await batch.commit();
    }
  };

  const setSorteoWinner = async (
    sorteoId: string, 
    ticketCode: string, 
    participantName: string, 
    prize: string,
    phone?: string,
    email?: string
  ) => {
    const cleanTargetCode = normalizeTicketCode(ticketCode);
    
    // Actualización optimista del sorteo
    setSorteos(prev => {
      const updated = prev.map(s => s.id === sorteoId ? {
        ...s,
        status: 'completed' as const,
        winnerTicketCode: cleanTargetCode,
        winnerParticipantName: participantName || 'Al Portador',
        winnerPrize: prize,
        winnerPhone: phone || '',
        winnerEmail: email || ''
      } : s);
      saveSorteosCache(updated);
      return updated;
    });

    // Actualización optimista del boleto
    setTickets(prev => {
      const updated = prev.map(t => {
        if (t.sorteoId === sorteoId && normalizeTicketCode(t.ticketCode) === cleanTargetCode) {
          return { ...t, status: 'winner' as const };
        }
        return t;
      });
      saveTicketsCache(updated);
      return updated;
    });

    // Actualizar en Firestore
    await updateDoc(doc(db, 'sorteos', sorteoId), sanitizeForFirestore({
      status: 'completed',
      winnerTicketCode: cleanTargetCode,
      winnerParticipantName: participantName || 'Al Portador',
      winnerPrize: prize,
      winnerPhone: phone || '',
      winnerEmail: email || ''
    }));

    const foundTicket = tickets.find(
      t => t.sorteoId === sorteoId && normalizeTicketCode(t.ticketCode) === cleanTargetCode
    );
    if (foundTicket) {
      await updateDoc(doc(db, 'sorteo_tickets', foundTicket.id), {
        status: 'winner'
      });
    }
  };

  const registerTicket = async (
    ticketId: string, 
    data: { participantName: string; participantPhone: string; participantEmail: string }
  ) => {
    const target = tickets.find(t => t.id === ticketId);
    if (!target) {
      throw new Error('Boleto no encontrado en el sistema');
    }

    const cleanName = (data.participantName || '').trim();
    const cleanPhone = (data.participantPhone || '').trim();
    const cleanEmail = (data.participantEmail || '').trim().toLowerCase();

    if (!cleanName) {
      throw new Error('El nombre completo es obligatorio para registrar el boleto');
    }
    if (!cleanPhone) {
      throw new Error('El número de contacto (celular/teléfono) es obligatorio');
    }
    if (!cleanEmail) {
      throw new Error('El correo electrónico es obligatorio');
    }

    const updates: Partial<SorteoTicket> = {
      participantName: cleanName,
      participantPhone: cleanPhone,
      participantEmail: cleanEmail,
      isRegistered: true,
      registeredAt: new Date().toISOString()
    };

    // Actualización optimista inmediata en estado y caché
    setTickets(prev => {
      const updated = prev.map(t => t.id === ticketId ? { ...t, ...updates } : t);
      saveTicketsCache(updated);
      return updated;
    });

    const sanitized = sanitizeForFirestore(updates);
    await updateDoc(doc(db, 'sorteo_tickets', ticketId), sanitized);
  };

  return (
    <SorteoContext.Provider
      value={{
        sorteos,
        tickets,
        loading,
        syncStatus,
        createSorteo,
        updateSorteo,
        deleteSorteo,
        createTicket,
        batchCreateTickets,
        updateTicket,
        deleteTicket,
        clearTicketsForSorteo,
        setSorteoWinner,
        registerTicket
      }}
    >
      {children}
    </SorteoContext.Provider>
  );
};

export const useSorteos = () => {
  const context = useContext(SorteoContext);
  if (!context) {
    throw new Error('useSorteos must be used within a SorteoProvider');
  }
  return context;
};
