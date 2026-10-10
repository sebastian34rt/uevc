export interface Sorteo {
  id: string;
  title: string;
  description: string;
  prizes: string[];
  drawDate: string;
  status: 'active' | 'completed' | 'draft';
  createdAt: string;
  winnerTicketCode?: string;
  winnerParticipantName?: string;
  winnerPrize?: string;
  winnerPhone?: string;
  winnerEmail?: string;
}

export interface SorteoTicket {
  id: string;
  sorteoId: string;
  ticketCode: string; // e.g. "TKT-001" o código alfanumérico
  participantName: string; // Puede estar vacío si aún no se asigna
  participantPhone?: string;
  participantEmail?: string;
  status: 'active' | 'winner' | 'cancelled';
  createdAt: string;
  notes?: string;
}
