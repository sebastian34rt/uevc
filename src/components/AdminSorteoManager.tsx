import React, { useState } from 'react';
import { useSorteos } from '../context/SorteoContext';
import { Sorteo, SorteoTicket } from '../types/sorteo';
import { SorteoTicketCard } from './SorteoTicketCard';
import { SorteoRouletteModal } from './SorteoRouletteModal';
import { SorteoPrintModal } from './SorteoPrintModal';
import { 
  Trophy, 
  Plus, 
  Trash2, 
  Edit3, 
  Printer, 
  Search, 
  RotateCcw, 
  Ticket as TicketIcon, 
  Sparkles, 
  Calendar, 
  UserCheck, 
  Hash, 
  CheckCircle2, 
  X, 
  AlertCircle, 
  AlertTriangle,
  ShieldCheck, 
  ShieldAlert,
  RefreshCw,
  Copy,
  Check,
  Filter,
  List,
  LayoutGrid,
  ExternalLink,
  Tag,
  CheckSquare,
  Square,
  Layers,
  ArrowRight,
  User,
  Phone,
  Mail,
  FileSpreadsheet,
  Upload
} from 'lucide-react';
import { AdminSorteoCsvManager } from './AdminSorteoCsvManager';
import { useSiteContent } from '../context/SiteContentContext';
import { QRCodeSVG } from 'qrcode.react';
import { 
  generateSecure9DigitCode, 
  normalizeTicketCode, 
  formatTicketCodeDisplay, 
  is9DigitCode 
} from '../utils/sorteoSecurity';
import { getSorteoQrUrl, getPublicSiteUrl } from '../utils/domainConfig';

export const AdminSorteoManager: React.FC = () => {
  const { 
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
  } = useSorteos();

  const { content } = useSiteContent();

  // Pestaña principal: 'codigos' | 'sorteos' | 'carga-csv' (Carga masiva CSV y organizador de talonarios)
  const [activeTab, setActiveTab] = useState<'codigos' | 'sorteos' | 'carga-csv'>('codigos');

  // Sorteo seleccionado en la pestaña de gestión de sorteos
  const [selectedSorteoId, setSelectedSorteoId] = useState<string>(
    sorteos.length > 0 ? sorteos[0].id : ''
  );

  // Modales
  const [isSorteoModalOpen, setIsSorteoModalOpen] = useState(false);
  const [editingSorteo, setEditingSorteo] = useState<Sorteo | null>(null);

  const [isSingleTicketModalOpen, setIsSingleTicketModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<SorteoTicket | null>(null);

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isRouletteOpen, setIsRouletteOpen] = useState(false);

  // Modal de Impresión dedicado y profesional
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [ticketsToPrint, setTicketsToPrint] = useState<SorteoTicket[]>([]);
  const [printTitle, setPrintTitle] = useState('Planilla de Impresión de Boletos Oficiales');

  // Filtros de la Sección Central de Códigos Generados
  const [codigosSearch, setCodigosSearch] = useState('');
  const [filterSorteoId, setFilterSorteoId] = useState<string>('all');
  const [filterAssignment, setFilterAssignment] = useState<'all' | 'blank' | 'assigned' | 'winner'>('all');
  const [codigosViewMode, setCodigosViewMode] = useState<'table' | 'cards'>('table');

  // Selección múltiple para impresión en lote y eliminación
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal interactivo de confirmación de eliminación (funciona en iframes sin window.confirm)
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    type: 'sorteo' | 'ticket' | 'selectedTickets' | 'clearRaffle';
    targetId?: string;
    title: string;
    description: string;
    confirmButtonText?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Formulario Sorteo
  const [sorteoTitle, setSorteoTitle] = useState('');
  const [sorteoDesc, setSorteoDesc] = useState('');
  const [sorteoPrizesText, setSorteoPrizesText] = useState('');
  const [sorteoDrawDate, setSorteoDrawDate] = useState('');
  const [sorteoStatus, setSorteoStatus] = useState<'active' | 'completed' | 'draft'>('active');

  // Formulario Boleto Individual
  const [targetTicketSorteoId, setTargetTicketSorteoId] = useState('');
  const [tktCode, setTktCode] = useState('');
  const [tktParticipantName, setTktParticipantName] = useState('');
  const [tktPhone, setTktPhone] = useState('');
  const [tktEmail, setTktEmail] = useState('');

  // Formulario Lote de Boletos
  const [targetBatchSorteoId, setTargetBatchSorteoId] = useState('');
  const [batchMode, setBatchMode] = useState<'random9' | 'sequential9'>('random9');
  const [batchPrefix, setBatchPrefix] = useState('');
  const [batchStartNum, setBatchStartNum] = useState(1);
  const [batchCount, setBatchCount] = useState(20);
  const [batchPadDigits, setBatchPadDigits] = useState(9);

  // Mensajes de estado
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const activeSorteo = sorteos.find(s => s.id === selectedSorteoId) || sorteos[0] || null;

  // Mapa de sorteos por ID para búsqueda rápida O(1)
  const sorteoMap = React.useMemo(() => {
    const map: Record<string, Sorteo> = {};
    sorteos.forEach(s => {
      map[s.id] = s;
    });
    return map;
  }, [sorteos]);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleCopyCode = (code: string) => {
    const clean = normalizeTicketCode(code);
    navigator.clipboard.writeText(clean);
    setCopiedCode(clean);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtrar lista global de códigos generados
  const filteredAllTickets = React.useMemo(() => {
    return tickets.filter(t => {
      // Filtro por sorteo de procedencia
      if (filterSorteoId !== 'all' && t.sorteoId !== filterSorteoId) {
        return false;
      }

      // Filtro por asignación o estado
      const isBlank = !t.participantName?.trim();
      if (filterAssignment === 'blank' && !isBlank) return false;
      if (filterAssignment === 'assigned' && isBlank) return false;
      if (filterAssignment === 'winner' && t.status !== 'winner') return false;

      // Filtro por búsqueda
      if (codigosSearch.trim()) {
        const query = codigosSearch.trim().toLowerCase();
        const cleanQuery = normalizeTicketCode(query);
        const cleanCode = normalizeTicketCode(t.ticketCode);
        const sorteoTitle = sorteoMap[t.sorteoId]?.title?.toLowerCase() || '';
        const participant = (t.participantName || '').toLowerCase();
        const phone = (t.participantPhone || '').toLowerCase();

        const matchCode = (cleanQuery && cleanCode.includes(cleanQuery)) || t.ticketCode.toLowerCase().includes(query);
        const matchParticipant = participant.includes(query);
        const matchSorteo = sorteoTitle.includes(query);
        const matchPhone = phone.includes(query);

        if (!matchCode && !matchParticipant && !matchSorteo && !matchPhone) {
          return false;
        }
      }

      return true;
    });
  }, [tickets, filterSorteoId, filterAssignment, codigosSearch, sorteoMap]);

  // Selección múltiple
  const handleToggleSelectTicket = (id: string) => {
    setSelectedTicketIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    if (selectedTicketIds.length === filteredAllTickets.length && filteredAllTickets.length > 0) {
      setSelectedTicketIds([]);
    } else {
      setSelectedTicketIds(filteredAllTickets.map(t => t.id));
    }
  };

  // Acciones de Impresión
  const handlePrintSingle = (ticket: SorteoTicket) => {
    setTicketsToPrint([ticket]);
    const raffle = sorteoMap[ticket.sorteoId];
    setPrintTitle(`Boleto Oficial #${formatTicketCodeDisplay(ticket.ticketCode)} - ${raffle?.title || 'Sorteo Institucional'}`);
    setIsPrintModalOpen(true);
  };

  const handlePrintSelected = () => {
    const selected = tickets.filter(t => selectedTicketIds.includes(t.id));
    if (selected.length === 0) {
      showNotification('Selecciona al menos un boleto para imprimir', true);
      return;
    }
    setTicketsToPrint(selected);
    setPrintTitle(`Planilla de ${selected.length} Boletos Oficiales Seleccionados`);
    setIsPrintModalOpen(true);
  };

  const handlePrintFiltered = () => {
    if (filteredAllTickets.length === 0) {
      showNotification('No hay boletos en el filtro actual para imprimir', true);
      return;
    }
    setTicketsToPrint(filteredAllTickets);
    const raffleName = filterSorteoId !== 'all' ? sorteoMap[filterSorteoId]?.title : 'Todos los Sorteos';
    setPrintTitle(`Planilla Oficial: ${filteredAllTickets.length} Boletos (${raffleName})`);
    setIsPrintModalOpen(true);
  };

  const handlePrintRaffle = (sorteoId: string) => {
    const raffleTickets = tickets.filter(t => t.sorteoId === sorteoId);
    if (raffleTickets.length === 0) {
      showNotification('Este sorteo no tiene boletos registrados para imprimir', true);
      return;
    }
    setTicketsToPrint(raffleTickets);
    const raffle = sorteoMap[sorteoId];
    setPrintTitle(`Planilla Completa: ${raffleTickets.length} Boletos - ${raffle?.title || 'Sorteo'}`);
    setIsPrintModalOpen(true);
  };

  // Manejo de Sorteos
  const handleOpenSorteoModal = (sorteo?: Sorteo) => {
    if (sorteo) {
      setEditingSorteo(sorteo);
      setSorteoTitle(sorteo.title);
      setSorteoDesc(sorteo.description);
      setSorteoPrizesText(sorteo.prizes.join('\n'));
      setSorteoDrawDate(sorteo.drawDate);
      setSorteoStatus(sorteo.status);
    } else {
      setEditingSorteo(null);
      setSorteoTitle('');
      setSorteoDesc('');
      setSorteoPrizesText('');
      setSorteoDrawDate('');
      setSorteoStatus('active');
    }
    setIsSorteoModalOpen(true);
  };

  const handleSaveSorteo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sorteoTitle.trim()) {
      showNotification('Por favor ingresa un título para el sorteo', true);
      return;
    }

    const prizesArray = sorteoPrizesText
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    try {
      if (editingSorteo) {
        await updateSorteo(editingSorteo.id, {
          title: sorteoTitle.trim(),
          description: sorteoDesc.trim(),
          prizes: prizesArray,
          drawDate: sorteoDrawDate,
          status: sorteoStatus
        });
        showNotification('Sorteo actualizado exitosamente');
      } else {
        const newId = await createSorteo({
          title: sorteoTitle.trim(),
          description: sorteoDesc.trim(),
          prizes: prizesArray,
          drawDate: sorteoDrawDate,
          status: sorteoStatus
        });
        setSelectedSorteoId(newId);
        showNotification('Sorteo creado exitosamente');
      }
      setIsSorteoModalOpen(false);
    } catch (err: any) {
      showNotification('Error al guardar el sorteo: ' + err.message, true);
    }
  };

  const handleRequestDeleteSorteo = (sorteoId: string) => {
    const s = sorteoMap[sorteoId];
    const tCount = tickets.filter(t => t.sorteoId === sorteoId).length;
    setDeleteDialog({
      isOpen: true,
      type: 'sorteo',
      targetId: sorteoId,
      title: `¿Eliminar Sorteo "${s?.title || 'Seleccionado'}"?`,
      description: `Esta acción eliminará permanentemente el sorteo y sus ${tCount} boletos asociados. Esta acción no se puede deshacer.`,
      confirmButtonText: 'Sí, Eliminar Sorteo y Boletos'
    });
  };

  const handleRequestDeleteTicket = (ticket: SorteoTicket) => {
    const formatted = formatTicketCodeDisplay(ticket.ticketCode);
    setDeleteDialog({
      isOpen: true,
      type: 'ticket',
      targetId: ticket.id,
      title: `¿Eliminar Boleto #${formatted}?`,
      description: `El código de 9 dígitos (${ticket.ticketCode}) quedará revocado y eliminado del registro oficial de la institución.`,
      confirmButtonText: 'Sí, Eliminar Boleto'
    });
  };

  const handleRequestDeleteSelectedTickets = () => {
    if (selectedTicketIds.length === 0) return;
    setDeleteDialog({
      isOpen: true,
      type: 'selectedTickets',
      title: `¿Eliminar ${selectedTicketIds.length} Boletos Seleccionados?`,
      description: `Se eliminarán permanentemente los ${selectedTicketIds.length} códigos de boletos seleccionados de la base de datos de sorteos.`,
      confirmButtonText: `Sí, Eliminar ${selectedTicketIds.length} Boletos`
    });
  };

  const handleRequestClearRaffleTickets = (sorteoId: string) => {
    const s = sorteoMap[sorteoId];
    const tCount = tickets.filter(t => t.sorteoId === sorteoId).length;
    if (tCount === 0) {
      showNotification('Este sorteo no tiene boletos para eliminar', true);
      return;
    }
    setDeleteDialog({
      isOpen: true,
      type: 'clearRaffle',
      targetId: sorteoId,
      title: `¿Vaciar todos los boletos de "${s?.title}"?`,
      description: `Se eliminarán los ${tCount} boletos registrados para este sorteo, manteniendo el sorteo activo para generar nuevos códigos.`,
      confirmButtonText: `Sí, Vaciar ${tCount} Boletos`
    });
  };

  const handleDeleteSorteo = (sorteoId: string) => {
    handleRequestDeleteSorteo(sorteoId);
  };

  const handleExecuteDelete = async () => {
    if (!deleteDialog) return;
    setIsDeleting(true);
    try {
      if (deleteDialog.type === 'sorteo' && deleteDialog.targetId) {
        const idToDelete = deleteDialog.targetId;
        await deleteSorteo(idToDelete);
        showNotification('Sorteo y boletos eliminados con éxito');
        if (selectedSorteoId === idToDelete) {
          const remaining = sorteos.filter(s => s.id !== idToDelete);
          setSelectedSorteoId(remaining[0]?.id || '');
        }
      } else if (deleteDialog.type === 'ticket' && deleteDialog.targetId) {
        await deleteTicket(deleteDialog.targetId);
        showNotification('Boleto eliminado con éxito');
        setSelectedTicketIds(prev => prev.filter(id => id !== deleteDialog.targetId));
      } else if (deleteDialog.type === 'selectedTickets') {
        for (const id of selectedTicketIds) {
          await deleteTicket(id);
        }
        showNotification(`${selectedTicketIds.length} boletos eliminados con éxito`);
        setSelectedTicketIds([]);
      } else if (deleteDialog.type === 'clearRaffle' && deleteDialog.targetId) {
        await clearTicketsForSorteo(deleteDialog.targetId);
        showNotification('Boletos del sorteo vaciados con éxito');
        setSelectedTicketIds([]);
      }
      setDeleteDialog(null);
    } catch (err: any) {
      showNotification('Error al eliminar: ' + err.message, true);
    } finally {
      setIsDeleting(false);
    }
  };

  // Manejo de Boletos individuales
  const handleOpenTicketModal = (ticket?: SorteoTicket) => {
    if (sorteos.length === 0) {
      showNotification('Crea al menos un sorteo primero', true);
      return;
    }

    if (ticket) {
      setEditingTicket(ticket);
      setTargetTicketSorteoId(ticket.sorteoId);
      setTktCode(ticket.ticketCode);
      setTktParticipantName(ticket.participantName || '');
      setTktPhone(ticket.participantPhone || '');
      setTktEmail(ticket.participantEmail || '');
    } else {
      setEditingTicket(null);
      setTargetTicketSorteoId(activeSorteo?.id || sorteos[0].id);
      setTktCode(generateSecure9DigitCode());
      setTktParticipantName('');
      setTktPhone('');
      setTktEmail('');
    }
    setIsSingleTicketModalOpen(true);
  };

  const handleGenerateNewSingleCode = () => {
    setTktCode(generateSecure9DigitCode());
  };

  const handleSaveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    let cleanCode = normalizeTicketCode(tktCode);
    if (!cleanCode) {
      showNotification('El código de boleto es obligatorio', true);
      return;
    }

    // Si el código es numérico con menos de 9 dígitos, rellenar automáticamente con ceros a la izquierda
    if (/^\d{1,8}$/.test(cleanCode)) {
      cleanCode = cleanCode.padStart(9, '0');
    }

    if (!targetTicketSorteoId) {
      showNotification('Selecciona el sorteo al que pertenece este boleto', true);
      return;
    }

    // Advertencia amigable si no tiene 9 dígitos
    if (cleanCode.length !== 9 || !/^\d{9}$/.test(cleanCode)) {
      showNotification(`Por estándar de seguridad institucional, el código debe tener 9 dígitos numéricos (tiene ${cleanCode.length}).`, true);
      return;
    }

    // Verificar código duplicado en ese sorteo
    const codeExists = tickets.some(
      t => t.sorteoId === targetTicketSorteoId && 
           normalizeTicketCode(t.ticketCode) === cleanCode && 
           (!editingTicket || t.id !== editingTicket.id)
    );
    if (codeExists) {
      showNotification(`El código ${cleanCode} ya existe en este sorteo`, true);
      return;
    }

    try {
      const participant = tktParticipantName.trim() || 'Al Portador';
      const phone = tktPhone.trim();
      const email = tktEmail.trim();

      if (editingTicket) {
        await updateTicket(editingTicket.id, {
          sorteoId: targetTicketSorteoId,
          ticketCode: cleanCode,
          participantName: participant,
          participantPhone: phone,
          participantEmail: email
        });
        showNotification('Datos del boleto actualizados y sincronizados con éxito');
      } else {
        await createTicket({
          sorteoId: targetTicketSorteoId,
          ticketCode: cleanCode,
          participantName: participant,
          participantPhone: phone,
          participantEmail: email,
          status: 'active'
        });
        showNotification('Boleto registrado y guardado exitosamente en la base de datos');
      }
      setIsSingleTicketModalOpen(false);
    } catch (err: any) {
      showNotification('Error al guardar el boleto: ' + (err.message || 'Error de sincronización'), true);
    }
  };

  // Abrir modal de Lote de Boletos
  const handleOpenBatchModal = () => {
    if (sorteos.length === 0) {
      showNotification('Crea al menos un sorteo primero', true);
      return;
    }
    setTargetBatchSorteoId(activeSorteo?.id || sorteos[0].id);
    setIsBatchModalOpen(true);
  };

  // Generación por lote
  const handleGenerateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBatchSorteoId) {
      showNotification('Selecciona el sorteo destino', true);
      return;
    }
    if (batchCount <= 0 || batchCount > 200) {
      showNotification('La cantidad debe estar entre 1 y 200 boletos por lote', true);
      return;
    }

    const items: Array<Omit<SorteoTicket, 'id' | 'createdAt'>> = [];
    const raffleTickets = tickets.filter(t => t.sorteoId === targetBatchSorteoId);
    const existingCodes = new Set(raffleTickets.map(t => normalizeTicketCode(t.ticketCode)));

    if (batchMode === 'random9') {
      let attempts = 0;
      while (items.length < batchCount && attempts < batchCount * 10) {
        attempts++;
        const randomCode = generateSecure9DigitCode();
        if (!existingCodes.has(randomCode)) {
          existingCodes.add(randomCode);
          items.push({
            sorteoId: targetBatchSorteoId,
            ticketCode: randomCode,
            participantName: '', // Se deja vacío para que el admin lo llene o asigne
            status: 'active'
          });
        }
      }
    } else {
      for (let i = 0; i < batchCount; i++) {
        const num = batchStartNum + i;
        const code = batchPrefix 
          ? `${batchPrefix}${String(num).padStart(batchPadDigits, '0')}`.toUpperCase()
          : String(num).padStart(9, '0');
        const clean = normalizeTicketCode(code);
        if (!existingCodes.has(clean)) {
          existingCodes.add(clean);
          items.push({
            sorteoId: targetBatchSorteoId,
            ticketCode: clean,
            participantName: '', // Se deja vacío para que el admin lo llene
            status: 'active'
          });
        }
      }
    }

    if (items.length === 0) {
      showNotification('No se pudieron generar nuevos códigos (posibles duplicados)', true);
      return;
    }

    try {
      await batchCreateTickets(items);
      const raffleName = sorteoMap[targetBatchSorteoId]?.title || 'el sorteo';
      showNotification(`Se generaron ${items.length} boletos de 9 dígitos para "${raffleName}" (listos para imprimir o registrar participantes)`);
      setIsBatchModalOpen(false);
    } catch (err: any) {
      showNotification('Error al generar lote: ' + err.message, true);
    }
  };

  // Dominio público oficial para QR y validaciones
  const siteUrl = getPublicSiteUrl(content.publicDomain);

  // Estadísticas clave
  const totalTicketsCount = tickets.length;
  const blankTicketsCount = tickets.filter(t => !t.participantName?.trim()).length;
  const assignedTicketsCount = tickets.filter(t => !!t.participantName?.trim()).length;
  const winnerTicketsCount = tickets.filter(t => t.status === 'winner').length;

  return (
    <div className="space-y-6">
      {/* Notificaciones de Éxito / Error */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-2xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            {successMsg}
          </span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center justify-between shadow-2xs">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            {errorMsg}
          </span>
          <button onClick={() => setErrorMsg('')} className="text-rose-600 hover:text-rose-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* HEADER PRINCIPAL CON INFORMACIÓN INSTITUCIONAL */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-700 rounded-full text-xs font-black uppercase tracking-wider mb-2">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            Módulo Oficial de Sorteos & Boletos de 9 Dígitos
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
            Gestión de Sorteos & Boletos
          </h2>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            Control de códigos de 9 dígitos de seguridad, origen de sorteos, impresión optimizada sin cédulas en papel y registro de participantes para contactar a los ganadores.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('carga-csv')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Cargar CSV & Talonarios
          </button>

          <button
            type="button"
            onClick={handleOpenBatchModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Hash className="w-4 h-4" />
            Generar Boletos (9 Dígitos)
          </button>

          <button
            type="button"
            onClick={() => handleOpenSorteoModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primario hover:bg-primario/90 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nuevo Sorteo
          </button>
        </div>
      </div>

      {/* NAVEGACIÓN POR PESTAÑAS */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl px-2 pt-2 shadow-2xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('codigos')}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'codigos'
              ? 'border-primario text-primario'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <List className="w-4 h-4" />
          <span>Códigos Generados & Sorteos Asociados</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
            activeTab === 'codigos' ? 'bg-primario text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {totalTicketsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sorteos')}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'sorteos'
              ? 'border-primario text-primario'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Gestión de Sorteos & Ruleta</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
            activeTab === 'sorteos' ? 'bg-primario text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {sorteos.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('carga-csv')}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'carga-csv'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Carga Masiva CSV & Talonarios</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
            activeTab === 'carga-csv' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'
          }`}>
            Avanzado
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN 1: CÓDIGOS GENERADOS Y DE QUÉ SORTEO VIENEN ESOS CÓDIGOS          */}
      {/* ========================================================================= */}
      {activeTab === 'codigos' && (
        <div className="space-y-6">
          {/* TARJETAS RESUMEN DE CÓDIGOS GENERADOS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Códigos
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {totalTicketsCount}
              </p>
              <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                9 dígitos cripto
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Sorteos Activos
              </span>
              <p className="text-2xl font-black text-primario mt-1">
                {sorteos.length}
              </p>
              <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
                Eventos institucionales
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                Con Participante Registrado
              </span>
              <p className="text-2xl font-black text-emerald-800 mt-1">
                {assignedTicketsCount}
              </p>
              <span className="text-[11px] text-emerald-700/80 mt-0.5 block">
                Con teléfono y correo
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Al Portador
              </span>
              <p className="text-2xl font-black text-slate-700 mt-1">
                {blankTicketsCount}
              </p>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Boletos por registrar
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Ganadores
              </span>
              <p className="text-2xl font-black text-amber-600 mt-1">
                {winnerTicketsCount}
              </p>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Premiados en sorteo
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Ganadores
              </span>
              <p className="text-2xl font-black text-amber-600 mt-1">
                {winnerTicketsCount}
              </p>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Premiados en sorteo
              </span>
            </div>
          </div>

          {/* BARRA DE HERRAMIENTAS, FILTROS Y ACCIONES DE IMPRESIÓN */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <TicketIcon className="w-5 h-5 text-primario" />
                  Registro Central de Códigos Generados & Sorteos
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visualiza cada código generado de 9 dígitos, identifica a qué sorteo pertenece, su estado y manda a imprimir.
                </p>
              </div>

              {/* BOTONES DE IMPRESIÓN PROMINENTES */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintFiltered}
                  disabled={filteredAllTickets.length === 0}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-primario hover:bg-primario/90 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Imprimir todos los boletos actualmente filtrados"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Boletos Filtrados ({filteredAllTickets.length})
                </button>

                {selectedTicketIds.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrintSelected}
                      className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      Imprimir Seleccionados ({selectedTicketIds.length})
                    </button>
                    <button
                      type="button"
                      onClick={handleRequestDeleteSelectedTickets}
                      className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                      title="Eliminar los boletos seleccionados"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar ({selectedTicketIds.length})
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => handleOpenTicketModal()}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  title="Añadir un boleto con datos de participante"
                >
                  <Plus className="w-4 h-4" />
                  Añadir Boleto a Usuario
                </button>
              </div>
            </div>

            {/* FILTROS Y CONTROLES */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Buscador de código o sorteo */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={codigosSearch}
                  onChange={(e) => setCodigosSearch(e.target.value)}
                  placeholder="Buscar código de 9 dígitos o sorteo..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primario/20 font-sans"
                />
              </div>

              {/* Filtrar por Sorteo de procedencia */}
              <div>
                <select
                  value={filterSorteoId}
                  onChange={(e) => setFilterSorteoId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primario/20"
                >
                  <option value="all">De qué sorteo: Todos los Sorteos ({tickets.length})</option>
                  {sorteos.map(s => {
                    const count = tickets.filter(t => t.sorteoId === s.id).length;
                    return (
                      <option key={s.id} value={s.id}>
                        {s.title} ({count} boletos)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Filtrar por Estado / Asignación */}
              <div>
                <select
                  value={filterAssignment}
                  onChange={(e) => setFilterAssignment(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primario/20"
                >
                  <option value="all">Participantes: Todos ({tickets.length})</option>
                  <option value="assigned">Con datos de contacto ({assignedTicketsCount})</option>
                  <option value="blank">Al portador sin datos ({blankTicketsCount})</option>
                  <option value="winner">Boletos ganadores ({winnerTicketsCount})</option>
                </select>
              </div>

              {/* Selector de modo de vista */}
              <div className="flex items-center justify-between sm:justify-end gap-2">
                <span className="text-xs text-slate-400 font-medium hidden lg:inline">Vista:</span>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setCodigosViewMode('table')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      codigosViewMode === 'table' ? 'bg-white shadow-2xs text-primario' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    Tabla
                  </button>
                  <button
                    type="button"
                    onClick={() => setCodigosViewMode('cards')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      codigosViewMode === 'cards' ? 'bg-white shadow-2xs text-primario' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    Boletos
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSelectAllVisible}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Seleccionar o deseleccionar todos los visibles"
                >
                  {selectedTicketIds.length === filteredAllTickets.length && filteredAllTickets.length > 0
                    ? 'Deseleccionar'
                    : 'Seleccionar todos'}
                </button>
              </div>
            </div>
          </div>

          {/* LISTA / TABLA DE CÓDIGOS GENERADOS */}
          {tickets.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mx-auto mb-4">
                <TicketIcon className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">
                No hay códigos de boletos generados
              </h4>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                Tal como solicitaste, los datos de tickets están listos para generarse en blanco o con código criptográfico de 9 dígitos.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleOpenBatchModal}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider shadow-md cursor-pointer"
                >
                  Generar Lote de 9 Dígitos
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenTicketModal()}
                  className="px-5 py-2.5 bg-primario hover:bg-primario/90 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer"
                >
                  Añadir Código Individual
                </button>
              </div>
            </div>
          ) : filteredAllTickets.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 text-slate-500 text-sm">
              No se encontraron códigos que coincidan con los filtros aplicados.
            </div>
          ) : codigosViewMode === 'table' ? (
            /* VISTA TABLA DE CONTROL DE CÓDIGOS */
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedTicketIds.length === filteredAllTickets.length && filteredAllTickets.length > 0}
                          onChange={handleSelectAllVisible}
                          className="rounded border-slate-300 text-primario focus:ring-primario cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-4">Código (9 Dígitos)</th>
                      <th className="py-3 px-4">De qué Sorteo viene</th>
                      <th className="py-3 px-4">Participante & Contacto (Tel / Email)</th>
                      <th className="py-3 px-4 text-center">QR Verificación</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAllTickets.map((ticket) => {
                      const raffle = sorteoMap[ticket.sorteoId];
                      const formattedCode = formatTicketCodeDisplay(ticket.ticketCode);
                      const cleanCode = normalizeTicketCode(ticket.ticketCode);
                      const isSelected = selectedTicketIds.includes(ticket.id);
                      const isWinner = ticket.status === 'winner' || raffle?.winnerTicketCode === cleanCode;
                      const isBlank = !ticket.participantName?.trim();
                      const qrUrl = getSorteoQrUrl(cleanCode, content.publicDomain);

                      return (
                        <tr 
                          key={ticket.id} 
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isSelected ? 'bg-primario/5' : ''
                          } ${isWinner ? 'bg-amber-50/40' : ''}`}
                        >
                          {/* Checkbox selección */}
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectTicket(ticket.id)}
                              className="rounded border-slate-300 text-primario focus:ring-primario cursor-pointer"
                            />
                          </td>

                          {/* Código de seguridad de 9 dígitos */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                {formattedCode}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyCode(ticket.ticketCode)}
                                title="Copiar código"
                                className="text-slate-400 hover:text-primario transition-colors p-1 rounded-md cursor-pointer"
                              >
                                {copiedCode === cleanCode ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                              <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                {cleanCode.length === 9 ? '9 Dígitos Válido' : `${cleanCode.length} car.`}
                              </span>
                            </div>
                          </td>

                          {/* De qué sorteo viene */}
                          <td className="py-3 px-4">
                            {raffle ? (
                              <div>
                                <span className="font-bold text-slate-900 block text-xs">
                                  {raffle.title}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                                  <span>{raffle.drawDate ? `Fecha: ${raffle.drawDate}` : 'Fecha pendiente'}</span>
                                  <span className={`px-1.5 py-0.2 rounded-full uppercase font-bold text-[9px] ${
                                    raffle.status === 'active' 
                                      ? 'bg-emerald-100 text-emerald-800' 
                                      : raffle.status === 'completed'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {raffle.status}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-rose-500 font-medium italic">
                                Sorteo no encontrado (ID: {ticket.sorteoId})
                              </span>
                            )}
                          </td>

                          {/* Participante & Contacto */}
                          <td className="py-3 px-4">
                            {ticket.participantName?.trim() ? (
                              <div className="space-y-0.5">
                                <span className="font-bold text-slate-900 block text-xs">
                                  {ticket.participantName}
                                </span>
                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-600">
                                  {ticket.participantPhone && (
                                    <a
                                      href={`tel:${ticket.participantPhone}`}
                                      className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
                                      title="Llamar al participante"
                                    >
                                      <Phone className="w-3 h-3 text-emerald-600" />
                                      {ticket.participantPhone}
                                    </a>
                                  )}
                                  {ticket.participantEmail && (
                                    <a
                                      href={`mailto:${ticket.participantEmail}`}
                                      className="inline-flex items-center gap-1 text-slate-600 hover:text-primario hover:underline"
                                      title="Enviar correo"
                                    >
                                      <Mail className="w-3 h-3 text-blue-500" />
                                      <span className="truncate max-w-[130px]">{ticket.participantEmail}</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                                  Al Portador (Sin datos)
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenTicketModal(ticket)}
                                  className="text-[10px] text-primario font-bold hover:underline block mt-0.5 cursor-pointer"
                                >
                                  + Registrar Datos de Contacto (Tel / Correo)
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Miniatura QR de la página */}
                          <td className="py-3 px-4 text-center">
                            <div className="inline-block p-1 bg-white rounded-lg border border-slate-200 shadow-2xs" title={`Escanea para verificar: ${qrUrl}`}>
                              <QRCodeSVG
                                value={qrUrl}
                                size={38}
                                level="M"
                                includeMargin={true}
                              />
                            </div>
                          </td>

                          {/* Estado */}
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isWinner 
                                ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300' 
                                : ticket.status === 'cancelled'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              <CheckCircle2 className="w-3 h-3" />
                              {isWinner ? 'Ganador' : ticket.status === 'cancelled' ? 'Anulado' : 'Válido'}
                            </span>
                          </td>

                          {/* Acciones */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Botón Imprimir Boleto Individual */}
                              <button
                                type="button"
                                onClick={() => handlePrintSingle(ticket)}
                                className="p-1.5 text-slate-600 hover:text-primario hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Imprimir este boleto"
                              >
                                <Printer className="w-4 h-4" />
                              </button>

                              {/* Editar Datos */}
                              <button
                                type="button"
                                onClick={() => handleOpenTicketModal(ticket)}
                                className="p-1.5 text-slate-600 hover:text-primario hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Editar código o registrar datos del participante"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {/* Eliminar */}
                              <button
                                type="button"
                                onClick={() => handleRequestDeleteTicket(ticket)}
                                className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Eliminar este boleto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* VISTA TARJETAS OFICIALES */
            <div className="grid grid-cols-1 gap-4">
              {filteredAllTickets.map((ticket) => (
                <div key={ticket.id} className="relative group">
                  <SorteoTicketCard
                    ticket={ticket}
                    sorteo={sorteoMap[ticket.sorteoId]}
                    onPrint={() => handlePrintSingle(ticket)}
                  />

                  {/* Acciones flotantes en la parte inferior para no tapar el código del boleto */}
                  <div className="absolute bottom-2.5 right-2 sm:right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur-xs p-1 rounded-xl shadow-xs border border-slate-200 print:hidden z-10">
                    <button
                      type="button"
                      onClick={() => handlePrintSingle(ticket)}
                      title="Imprimir este boleto"
                      className="p-1.5 text-slate-600 hover:text-primario hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenTicketModal(ticket)}
                      title="Editar participante o código"
                      className="p-1.5 text-slate-600 hover:text-primario hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRequestDeleteTicket(ticket)}
                      title="Eliminar este boleto"
                      className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* BARRA FLOTANTE INFERIOR SI HAY ELEMENTOS SELECCIONADOS */}
          {selectedTicketIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-700 animate-bounce-subtle">
              <span className="text-xs font-bold">
                {selectedTicketIds.length} {selectedTicketIds.length === 1 ? 'boleto seleccionado' : 'boletos seleccionados'}
              </span>
              <button
                type="button"
                onClick={handlePrintSelected}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Boletos
              </button>
              <button
                type="button"
                onClick={handleRequestDeleteSelectedTickets}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-colors"
                title="Eliminar los boletos seleccionados de la base de datos"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar ({selectedTicketIds.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedTicketIds([])}
                className="text-xs text-slate-400 hover:text-white cursor-pointer font-medium ml-1"
              >
                Deseleccionar
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECCIÓN 2: GESTIÓN DE SORTEOS & RULETA                                    */}
      {/* ========================================================================= */}
      {activeTab === 'sorteos' && (
        <div className="space-y-6">
          {sorteos.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
              <div className="w-16 h-16 mx-auto bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-4">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No hay sorteos registrados</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                Comienza creando el primer sorteo institucional (por ejemplo: "Gran Sorteo Anual", "Rifa Pro-Fondos").
              </p>
              <button
                type="button"
                onClick={() => handleOpenSorteoModal()}
                className="inline-flex items-center gap-2 px-5 py-3 bg-primario text-white rounded-xl font-bold text-sm shadow-lg hover:bg-primario/90 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Crear Primer Sorteo
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* SELECTOR DE SORTEOS Y DETALLES */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Seleccionar Sorteo:
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={activeSorteo?.id || ''}
                        onChange={(e) => setSelectedSorteoId(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 text-base focus:outline-none focus:ring-2 focus:ring-primario/20 cursor-pointer max-w-md"
                      >
                        {sorteos.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.title} ({s.status.toUpperCase()})
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => activeSorteo && handleOpenSorteoModal(activeSorteo)}
                        className="p-2.5 text-slate-600 hover:text-primario hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                        title="Editar detalles del sorteo"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => activeSorteo && handleRequestDeleteSorteo(activeSorteo.id)}
                        className="p-2.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Eliminar este sorteo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Acciones principales: Ruleta e Imprimir */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsRouletteOpen(true)}
                      disabled={!activeSorteo || tickets.filter(t => t.sorteoId === activeSorteo.id).length === 0}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 rounded-xl font-black text-sm shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Realizar Sorteo / Ruleta
                    </button>

                    <button
                      type="button"
                      onClick={() => activeSorteo && handlePrintRaffle(activeSorteo.id)}
                      disabled={!activeSorteo || tickets.filter(t => t.sorteoId === activeSorteo.id).length === 0}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-primario hover:bg-primario/90 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      Imprimir Boletos de este Sorteo
                    </button>
                  </div>
                </div>

                {/* Resumen del sorteo actual */}
                {activeSorteo && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Premios Oficiales
                      </span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5 truncate">
                        {activeSorteo.prizes?.join(', ') || 'Sin premios especificados'}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Fecha del Sorteo
                      </span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">
                        {activeSorteo.drawDate || 'Por anunciar'}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Boletos de este Sorteo
                      </span>
                      <p className="font-black text-primario text-lg mt-0.5">
                        {tickets.filter(t => t.sorteoId === activeSorteo.id).length} <span className="text-xs font-normal text-slate-500">boletos</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* LISTA DE SORTEOS EXISTENTES */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Todos los Sorteos Institucionales Registrados
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sorteos.map((s) => {
                    const count = tickets.filter(t => t.sorteoId === s.id).length;
                    return (
                      <div 
                        key={s.id}
                        className={`p-5 rounded-2xl border transition-all ${
                          s.id === activeSorteo?.id 
                            ? 'border-primario ring-1 ring-primario/20 bg-primario/[2%]' 
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                            s.status === 'active' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : s.status === 'completed'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {s.status === 'active' ? 'En Curso' : s.status === 'completed' ? 'Finalizado' : 'Borrador'}
                          </span>
                          <span className="text-xs text-slate-400">
                            {s.drawDate || 'Sin fecha'}
                          </span>
                        </div>

                        <h4 className="font-bold text-base text-slate-900 mb-1">
                          {s.title}
                        </h4>
                        {s.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                            {s.description}
                          </p>
                        )}

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="font-bold text-primario">
                            {count} boletos emitidos
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handlePrintRaffle(s.id)}
                              disabled={count === 0}
                              className="inline-flex items-center gap-1 text-slate-700 hover:text-primario font-bold cursor-pointer disabled:opacity-40"
                              title="Imprimir boletos de este sorteo"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Imprimir
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRequestDeleteSorteo(s.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                              title="Eliminar este sorteo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSorteoId(s.id);
                                setFilterSorteoId(s.id);
                                setActiveTab('codigos');
                              }}
                              className="text-primario font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                            >
                              Ver Códigos
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECCIÓN 3: PANEL AVANZADO DE CARGA MASIVA CSV & ORGANIZACIÓN PARA IMPRESIÓN */}
      {/* ========================================================================= */}
      {activeTab === 'carga-csv' && (
        <AdminSorteoCsvManager
          sorteos={sorteos}
          tickets={tickets}
          selectedSorteoId={selectedSorteoId || (sorteos[0]?.id || '')}
          onSelectSorteoId={setSelectedSorteoId}
          onBatchCreateTickets={batchCreateTickets}
          onPrintTickets={(printTicketsList, customTitle) => {
            setTicketsToPrint(printTicketsList);
            setPrintTitle(customTitle);
            setIsPrintModalOpen(true);
          }}
          showNotification={showNotification}
          onOpenCreateSorteo={() => handleOpenSorteoModal()}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREAR / EDITAR SORTEO                                              */}
      {/* ========================================================================= */}
      {isSorteoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="font-serif font-black text-xl text-slate-900">
                {editingSorteo ? 'Editar Sorteo Institucional' : 'Nuevo Sorteo Institucional'}
              </h3>
              <button
                onClick={() => setIsSorteoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSorteo} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Título del Sorteo *
                </label>
                <input
                  type="text"
                  required
                  value={sorteoTitle}
                  onChange={(e) => setSorteoTitle(e.target.value)}
                  placeholder="ej. Gran Sorteo Virgen del Cisne 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primario/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={sorteoDesc}
                  onChange={(e) => setSorteoDesc(e.target.value)}
                  placeholder="Descripción, objetivos y bases del sorteo..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primario/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Premios (uno por línea)
                </label>
                <textarea
                  rows={3}
                  value={sorteoPrizesText}
                  onChange={(e) => setSorteoPrizesText(e.target.value)}
                  placeholder="1er Lugar: Laptop Intel Core i7&#10;2do Lugar: Tablet Samsung Galaxy&#10;3er Lugar: Parlante Bluetooth"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primario/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Fecha del Sorteo
                  </label>
                  <input
                    type="text"
                    value={sorteoDrawDate}
                    onChange={(e) => setSorteoDrawDate(e.target.value)}
                    placeholder="ej. 24 de Mayo de 2026"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primario/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Estado
                  </label>
                  <select
                    value={sorteoStatus}
                    onChange={(e) => setSorteoStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primario/20 bg-white"
                  >
                    <option value="active">Activo</option>
                    <option value="completed">Finalizado</option>
                    <option value="draft">Borrador</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primario hover:bg-primario/90 text-white rounded-xl font-bold text-sm transition-colors cursor-pointer"
                >
                  {editingSorteo ? 'Guardar Cambios' : 'Crear Sorteo'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsSorteoModalOpen(false)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AÑADIR / EDITAR BOLETO INDIVIDUAL                                  */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* MODAL: AÑADIR O EDITAR BOLETO CON DATOS DE PARTICIPANTE                   */}
      {/* ========================================================================= */}
      {isSingleTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-serif font-black text-xl text-slate-900 leading-tight">
                  {editingTicket 
                    ? (editingTicket.participantName ? 'Editar Boleto & Participante' : 'Registrar Participante en Boleto') 
                    : 'Añadir Boleto con Datos de Usuario'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Importante para contactar y proclamar al ganador cuando se realice el sorteo.
                </p>
              </div>
              <button
                onClick={() => setIsSingleTicketModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Aviso de Privacidad y Claridad */}
            <div className="p-3 bg-amber-50/90 rounded-2xl border border-amber-200 text-xs text-amber-950 mb-4 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Datos requeridos para los ganadores:</strong> Se solicitan el nombre, teléfono y correo electrónico para notificar la entrega de premios. <em>No se solicita cédula de identidad ni aparece en los boletos impresos.</em>
              </div>
            </div>

            <form onSubmit={handleSaveTicket} className="space-y-4">
              {/* Sorteo al que pertenece */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Sorteo de Origen *
                </label>
                <select
                  value={targetTicketSorteoId}
                  onChange={(e) => setTargetTicketSorteoId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primario/20 bg-white"
                >
                  {sorteos.map(s => (
                    <option key={s.id} value={s.id}>{s.title} ({s.status.toUpperCase()})</option>
                  ))}
                </select>
              </div>

              {/* Código de 9 dígitos */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Código de Boleto (9 Dígitos de Seguridad) *
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateNewSingleCode}
                    className="text-[11px] font-bold text-primario hover:underline flex items-center gap-1 cursor-pointer"
                    title="Generar nuevo código aleatorio de 9 dígitos"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Generar 9 Dígitos
                  </button>
                </div>
                <input
                  type="text"
                  required
                  maxLength={15}
                  value={tktCode}
                  onChange={(e) => setTktCode(e.target.value.toUpperCase())}
                  placeholder="ej. 849201934"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-primario/20 uppercase"
                />
                <div className="flex items-center justify-between mt-1 text-[11px]">
                  <span className="text-slate-400">
                    Estándar de seguridad: 9 dígitos numéricos
                  </span>
                  {is9DigitCode(tktCode) ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> 9 dígitos correcto
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium">
                      {normalizeTicketCode(tktCode).length}/9 dígitos
                    </span>
                  )}
                </div>
              </div>

              {/* Datos del Participante para cuando se indiquen los ganadores */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 block mb-2">
                  Datos de Contacto del Usuario (Para Ganadores)
                </span>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Nombre Completo del Participante / Usuario *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={tktParticipantName}
                        onChange={(e) => setTktParticipantName(e.target.value)}
                        placeholder="ej. Carlos Mendoza"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primario/20"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Nombre oficial para proclamar al ganador en la ruleta del sorteo.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Número de Teléfono / Celular / WhatsApp *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={tktPhone}
                        onChange={(e) => setTktPhone(e.target.value)}
                        placeholder="ej. 0991234567"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primario/20"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Indispensable para llamar y comunicarse de inmediato con el ganador.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Correo Electrónico (Para Notificación Oficial)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={tktEmail}
                        onChange={(e) => setTktEmail(e.target.value)}
                        placeholder="ej. carlos.mendoza@gmail.com"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primario/20"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Para enviar la notificación oficial del premio por correo electrónico.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primario hover:bg-primario/90 text-white rounded-xl font-bold text-sm transition-colors cursor-pointer shadow-md"
                >
                  {editingTicket ? 'Guardar Cambios' : 'Añadir Boleto a Usuario'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsSingleTicketModalOpen(false)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GENERAR LOTE DE BOLETOS DE 9 DÍGITOS EN BLANCO                    */}
      {/* ========================================================================= */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="font-serif font-black text-xl text-slate-900">
                  Generar Lote de 9 Dígitos
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Genera códigos seguros con datos en blanco listos para imprimir o registrar participantes.
                </p>
              </div>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateBatch} className="space-y-4">
              {/* Sorteo Destino */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Sorteo Destino *
                </label>
                <select
                  value={targetBatchSorteoId}
                  onChange={(e) => setTargetBatchSorteoId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primario/20 bg-white text-slate-800"
                >
                  {sorteos.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.status.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Modalidad de Códigos de Seguridad
                </label>
                <select
                  value={batchMode}
                  onChange={(e) => setBatchMode(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primario/20 bg-white text-slate-800"
                >
                  <option value="random9">
                    9 Dígitos Criptográficos Aleatorios (Recomendado - Anti Fraude)
                  </option>
                  <option value="sequential9">
                    9 Dígitos Numéricos Correlativos (000000001, 000000002...)
                  </option>
                </select>
              </div>

              {batchMode === 'sequential9' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Prefijo Opcional (dejar vacío para solo 9 dígitos)
                  </label>
                  <input
                    type="text"
                    value={batchPrefix}
                    onChange={(e) => setBatchPrefix(e.target.value.toUpperCase())}
                    placeholder="ej. vacío o RIFA-"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-primario/20"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {batchMode === 'sequential9' ? (
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Número Inicial
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={batchStartNum}
                      onChange={(e) => setBatchStartNum(parseInt(e.target.value) || 1)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primario/20"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Longitud
                    </label>
                    <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      9 Dígitos Cripto
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Cantidad a Generar
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={batchCount}
                    onChange={(e) => setBatchCount(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primario/20"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600">
                <span className="font-bold text-slate-700 block mb-1">
                  {batchMode === 'random9' ? 'Ejemplo de códigos de 9 dígitos generados:' : 'Ejemplo de correlativos con 9 cifras:'}
                </span>
                <span className="font-mono text-primario font-bold">
                  {batchMode === 'random9' 
                    ? '849201934, 712948301, 395028471...' 
                    : `${batchPrefix}${String(batchStartNum).padStart(batchPadDigits, '0')} ... ${batchPrefix}${String(batchStartNum + batchCount - 1).padStart(batchPadDigits, '0')}`}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Boletos oficiales con código de seguridad y QR listos para impresión masiva con máximo ahorro de papel.
                </p>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                >
                  Generar {batchCount} Boletos (9 Dígitos)
                </button>
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RULETA INTERACTIVA                                                 */}
      {/* ========================================================================= */}
      {isRouletteOpen && activeSorteo && (
        <SorteoRouletteModal
          isOpen={isRouletteOpen}
          onClose={() => setIsRouletteOpen(false)}
          sorteo={activeSorteo}
          tickets={tickets.filter(t => t.sorteoId === activeSorteo.id)}
          onWinnerSelected={async (ticketCode, participantName, prize, phone, email) => {
            await setSorteoWinner(activeSorteo.id, ticketCode, participantName, prize, phone, email);
            showNotification(`¡Ganador registrado!: ${ticketCode} - ${participantName}`);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: IMPRESIÓN OFICIAL DE BOLETOS                                       */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <SorteoPrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          tickets={ticketsToPrint}
          sorteos={sorteos}
          title={printTitle}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRMACIÓN DE ELIMINACIÓN SEGURA                                  */}
      {/* ========================================================================= */}
      {deleteDialog?.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs p-4 flex items-center justify-center animate-fade-in print:hidden">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-rose-100 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>

            <h3 className="text-xl font-serif font-black text-slate-900 mb-2">
              {deleteDialog.title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
              {deleteDialog.description}
            </p>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl mb-6 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-rose-800 font-medium leading-snug">
                Esta acción eliminará el registro de Firebase Firestore de manera permanente. No se podrá recuperar.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteDialog(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>{deleteDialog.confirmButtonText || 'Sí, Eliminar Permanentemente'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
