import React, { createContext, useContext, useState, useEffect } from 'react';
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

interface SorteoContextType {
  sorteos: Sorteo[];
  tickets: SorteoTicket[];
  loading: boolean;
  createSorteo: (sorteo: Omit<Sorteo, 'id' | 'createdAt'>) => Promise<string>;
  updateSorteo: (id: string, updates: Partial<Sorteo>) => Promise<void>;
  deleteSorteo: (id: string) => Promise<void>;
  createTicket: (ticket: Omit<SorteoTicket, 'id' | 'createdAt'>) => Promise<string>;
  batchCreateTickets: (tickets: Array<Omit<SorteoTicket, 'id' | 'createdAt'>>) => Promise<void>;
  updateTicket: (id: string, updates: Partial<SorteoTicket>) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  clearTicketsForSorteo: (sorteoId: string) => Promise<void>;
  setSorteoWinner: (sorteoId: string, ticketCode: string, participantName: string, prize: string, phone?: string, email?: string) => Promise<void>;
}

const SorteoContext = createContext<SorteoContextType | undefined>(undefined);

export const SorteoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sorteos, setSorteos] = useState<Sorteo[]>([]);
  const [tickets, setTickets] = useState<SorteoTicket[]>([]);
  const [loading, setLoading] = useState(true);

  // Escuchar sorteos en tiempo real
  useEffect(() => {
    const unsubSorteos = onSnapshot(
      collection(db, 'sorteos'),
      (snapshot) => {
        const items: Sorteo[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() } as Sorteo);
        });
        setSorteos(items);
        setLoading(false);
      },
      (error) => {
        console.warn('Notice listening to sorteos:', error);
        setLoading(false);
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
      },
      (error) => {
        console.warn('Notice listening to sorteo_tickets:', error);
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
    await setDoc(doc(db, 'sorteos', id), newSorteo);
    return id;
  };

  const updateSorteo = async (id: string, updates: Partial<Sorteo>) => {
    await updateDoc(doc(db, 'sorteos', id), updates);
  };

  const deleteSorteo = async (id: string) => {
    await deleteDoc(doc(db, 'sorteos', id));
    // Eliminar tickets asociados a este sorteo
    const toDelete = tickets.filter(t => t.sorteoId === id);
    if (toDelete.length > 0) {
      const batch = writeBatch(db);
      toDelete.forEach(t => {
        batch.delete(doc(db, 'sorteo_tickets', t.id));
      });
      await batch.commit();
    }
  };

  const createTicket = async (data: Omit<SorteoTicket, 'id' | 'createdAt'>): Promise<string> => {
    const id = 'tkt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newTicket: SorteoTicket = {
      ...data,
      id,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'sorteo_tickets', id), newTicket);
    return id;
  };

  const batchCreateTickets = async (items: Array<Omit<SorteoTicket, 'id' | 'createdAt'>>) => {
    const CHUNK_SIZE = 400;
    const now = new Date().toISOString();
    
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((item, index) => {
        const id = 'tkt_' + Date.now() + '_' + (i + index) + '_' + Math.random().toString(36).substring(2, 6);
        const ticket: SorteoTicket = {
          ...item,
          id,
          createdAt: now
        };
        batch.set(doc(db, 'sorteo_tickets', id), ticket);
      });
      await batch.commit();
    }
  };

  const updateTicket = async (id: string, updates: Partial<SorteoTicket>) => {
    await updateDoc(doc(db, 'sorteo_tickets', id), updates);
  };

  const deleteTicket = async (id: string) => {
    await deleteDoc(doc(db, 'sorteo_tickets', id));
  };

  const clearTicketsForSorteo = async (sorteoId: string) => {
    const toDelete = tickets.filter(t => t.sorteoId === sorteoId);
    if (toDelete.length === 0) return;
    const CHUNK_SIZE = 400;
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
    await updateDoc(doc(db, 'sorteos', sorteoId), {
      status: 'completed',
      winnerTicketCode: ticketCode,
      winnerParticipantName: participantName || 'Al Portador',
      winnerPrize: prize,
      winnerPhone: phone || '',
      winnerEmail: email || ''
    });
    
    // Marcar el ticket como ganador
    const foundTicket = tickets.find(t => t.sorteoId === sorteoId && t.ticketCode === ticketCode);
    if (foundTicket) {
      await updateDoc(doc(db, 'sorteo_tickets', foundTicket.id), {
        status: 'winner'
      });
    }
  };

  return (
    <SorteoContext.Provider
      value={{
        sorteos,
        tickets,
        loading,
        createSorteo,
        updateSorteo,
        deleteSorteo,
        createTicket,
        batchCreateTickets,
        updateTicket,
        deleteTicket,
        clearTicketsForSorteo,
        setSorteoWinner
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
