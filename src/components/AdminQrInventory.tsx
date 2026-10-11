import React, { useState, useEffect, useMemo } from 'react';
import { 
  QrCode, Printer, Plus, Trash2, Search, Filter, Layers, 
  ExternalLink, CheckSquare, Square, AlertTriangle, CheckCircle2, 
  Download, RefreshCw, Eye, Sparkles, Laptop, Projector, 
  Armchair, Wifi, Zap, HelpCircle, X, Check, Copy, Wrench, 
  Clock, UserCheck, MessageSquare, Phone, ArrowRight, BarChart3,
  Box, Tag, FolderPlus, Edit2, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { 
  collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc, 
  query, orderBy 
} from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router-dom';
import AdminCustomMaterials, { HelpdeskMaterial } from './AdminCustomMaterials';
import { useSiteContent } from '../context/SiteContentContext';
import { getHelpdeskAssetQrUrl, getPublicSiteUrl } from '../utils/domainConfig';

export interface InventoryAsset {
  id: string;
  assetCode: string;
  name: string;
  category: 'computacion' | 'proyector_audio' | 'mobiliario' | 'red_internet' | 'electrico' | 'otro';
  location: string;
  brandModel?: string;
  serialNumber?: string;
  status?: 'operativo' | 'en_reparacion' | 'baja';
  createdAt?: number;
}

export interface InventoryTicket {
  id: string;
  ticketCode: string;
  assetCode: string;
  assetName: string;
  location: string;
  category: string;
  priority: 'baja' | 'media' | 'alta' | 'urgente';
  status: 'pendiente' | 'en_proceso' | 'resuelto' | 'cancelado';
  problemType: string;
  description: string;
  reportedBy: string;
  reportedRole?: string;
  contactInfo?: string;
  photoUrl?: string;
  createdAt: number;
  resolvedAt?: number;
  technicianNotes?: string;
  technicianName?: string;
}

export interface CustomMaterialItem {
  id: string;
  name: string;
  category: InventoryAsset['category'];
  suggestedQty: number;
  prefixCode: string;
}

export default function AdminQrInventory() {
  const { content } = useSiteContent();
  const [assets, setAssets] = useState<InventoryAsset[]>([]);
  const [tickets, setTickets] = useState<InventoryTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeSubTab, setActiveSubTab] = useState<'tickets' | 'catalog' | 'batch' | 'materials' | 'single'>('tickets');
  const [customMaterials, setCustomMaterials] = useState<HelpdeskMaterial[]>([]);

  const [ticketFilterStatus, setTicketFilterStatus] = useState<'todos' | 'pendiente' | 'en_proceso' | 'resuelto'>('todos');
  const [technicianNameInput, setTechnicianNameInput] = useState('');
  const [technicianNoteInput, setTechnicianNoteInput] = useState('');
  const [activeTicketIdForAction, setActiveTicketIdForAction] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('todos');
  const [filterLocation, setFilterLocation] = useState<string>('todos');

  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printTarget, setPrintTarget] = useState<'selected' | 'all' | 'single'>('all');
  const [singlePrintAsset, setSinglePrintAsset] = useState<InventoryAsset | null>(null);
  const [stickerFormat, setStickerFormat] = useState<'standard' | 'compact' | 'badge'>('standard');

  const [singleCode, setSingleCode] = useState('');
  const [singleName, setSingleName] = useState('');
  const [singleCategory, setSingleCategory] = useState<InventoryAsset['category']>('computacion');
  const [singleLocation, setSingleLocation] = useState('');
  const [singleBrand, setSingleBrand] = useState('');
  const [singleSerial, setSingleSerial] = useState('');
  const [isSavingSingle, setIsSavingSingle] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingAssetToModify, setEditingAssetToModify] = useState<InventoryAsset | null>(null);

  const [labsList, setLabsList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('school_labs_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return ['Laboratorio 1'];
  });
  const [batchLocation, setBatchLocation] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('school_labs_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      }
    } catch {}
    return 'Laboratorio 1';
  });
  const [newLabInput, setNewLabInput] = useState('');
  const [isAddingLabOpen, setIsAddingLabOpen] = useState(false);

  const [userCustomMaterials, setUserCustomMaterials] = useState<CustomMaterialItem[]>(() => {
    try {
      const saved = localStorage.getItem('school_user_materials');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [materialInputName, setMaterialInputName] = useState('');
  const [batchPrefix, setBatchPrefix] = useState('LAB1-MAT-');
  const [batchStartNum, setBatchStartNum] = useState(1);
  const [batchCount, setBatchCount] = useState(50);
  const [batchNameTemplate, setBatchNameTemplate] = useState('Equipo #{N}');
  const [batchCategory, setBatchCategory] = useState<InventoryAsset['category']>('computacion');
  const [batchBrand, setBatchBrand] = useState('');
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState<number>(0);
  const [lastGeneratedBatch, setLastGeneratedBatch] = useState<{ count: number; ids: string[]; nameTemplate: string; location: string } | null>(null);

  // sincronizacion con firebase
  useEffect(() => {
    const unsubAssets = onSnapshot(collection(db, 'helpdesk_assets'), (snap) => {
      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as InventoryAsset[];
      setAssets(list.sort((a, b) => a.assetCode.localeCompare(b.assetCode)));
      setIsLoading(false);
    });

    const qTickets = query(collection(db, 'helpdesk_tickets'), orderBy('createdAt', 'desc'));
    const unsubTickets = onSnapshot(qTickets, (snap) => {
      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as InventoryTicket[];
      setTickets(list);
    });

    const qMaterials = query(collection(db, 'helpdesk_materials'), orderBy('name', 'asc'));
    const unsubMaterials = onSnapshot(qMaterials, (snap) => {
      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as HelpdeskMaterial[];
      setCustomMaterials(list);
    });

    const unsubConfig = onSnapshot(doc(db, 'helpdesk_settings', 'config'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.laboratories) && data.laboratories.length > 0) {
          setLabsList(data.laboratories);
        }
      }
    });

    return () => {
      unsubAssets();
      unsubTickets();
      unsubMaterials();
      unsubConfig();
    };
  }, []);

  const openTicketsByAsset = useMemo(() => {
    const map = new Map<string, InventoryTicket[]>();
    tickets.forEach(t => {
      if (t.status === 'pendiente' || t.status === 'en_proceso') {
        const code = t.assetCode.toUpperCase();
        const existing = map.get(code) || [];
        existing.push(t);
        map.set(code, existing);
      }
    });
    return map;
  }, [tickets]);

  const uniqueLocations = useMemo(() => {
    const set = new Set<string>();
    assets.forEach(a => {
      if (a.location) set.add(a.location);
    });
    return Array.from(set).sort();
  }, [assets]);

  // metricas por laboratorio
  const labStatistics = useMemo(() => {
    const labs: Record<string, { total: number; items: Record<string, number>; openIncidents: number }> = {};
    
    assets.forEach(a => {
      const loc = a.location || 'Sin Ubicación';
      if (!labs[loc]) {
        labs[loc] = { total: 0, items: {}, openIncidents: 0 };
      }
      labs[loc].total += 1;
      
      const cleanName = a.name.replace(/#\d+.*$/, '').trim() || a.category;
      labs[loc].items[cleanName] = (labs[loc].items[cleanName] || 0) + 1;

      if (openTicketsByAsset.has(a.assetCode.toUpperCase())) {
        labs[loc].openIncidents += 1;
      }
    });

    return labs;
  }, [assets, openTicketsByAsset]);

  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchesSearch = !searchQuery.trim() || 
        a.assetCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = filterCategory === 'todos' || a.category === filterCategory;
      const matchesLocation = filterLocation === 'todos' || a.location === filterLocation;

      return matchesSearch && matchesCategory && matchesLocation;
    });
  }, [assets, searchQuery, filterCategory, filterLocation]);

  const filteredTickets = useMemo(() => {
    if (ticketFilterStatus === 'todos') return tickets;
    return tickets.filter(t => t.status === ticketFilterStatus);
  }, [tickets, ticketFilterStatus]);

  const pendingCount = tickets.filter(t => t.status === 'pendiente').length;
  const inProgressCount = tickets.filter(t => t.status === 'en_proceso').length;
  const resolvedCount = tickets.filter(t => t.status === 'resuelto').length;

  const labAssociatedMaterials = useMemo(() => {
    return customMaterials.filter(m => {
      if (!m.assignedLabs || m.assignedLabs.length === 0 || m.assignedLabs.includes('todos')) {
        return true;
      }
      return m.assignedLabs.includes(batchLocation);
    });
  }, [customMaterials, batchLocation]);

  const toggleSelectAsset = (id: string) => {
    const next = new Set(selectedAssetIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedAssetIds(next);
  };

  const handleSelectAll = () => {
    if (selectedAssetIds.size === filteredAssets.length) {
      setSelectedAssetIds(new Set());
    } else {
      setSelectedAssetIds(new Set(filteredAssets.map(a => a.id)));
    }
  };

  const getAssetHelpDeskUrl = (code: string) => {
    return getHelpdeskAssetQrUrl(code, content.publicDomain);
  };

  const computePrefix = (lab: string, mat: string) => {
    const cleanLab = lab.toUpperCase().replace(/\s+/g, '').substring(0, 4) || 'LAB1';
    const cleanMat = mat.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3) || 'ITM';
    return `${cleanLab}-${cleanMat}-`;
  };

  const handleSelectLab = (lab: string) => {
    setBatchLocation(lab);
    if (materialInputName.trim()) {
      setBatchPrefix(computePrefix(lab, materialInputName));
    }
  };

  const handleAddNewLab = () => {
    const trimmed = newLabInput.trim();
    if (!trimmed) return;
    if (labsList.includes(trimmed)) {
      setBatchLocation(trimmed);
      setNewLabInput('');
      setIsAddingLabOpen(false);
      return;
    }
    const updated = [...labsList, trimmed];
    setLabsList(updated);
    setBatchLocation(trimmed);
    localStorage.setItem('school_labs_list', JSON.stringify(updated));
    setNewLabInput('');
    setIsAddingLabOpen(false);
    if (materialInputName.trim()) {
      setBatchPrefix(computePrefix(trimmed, materialInputName));
    }
  };

  const handleRemoveLab = (labToRemove: string) => {
    if (labsList.length <= 1) {
      alert('Debe existir al menos un aula o laboratorio.');
      return;
    }
    const updated = labsList.filter(l => l !== labToRemove);
    setLabsList(updated);
    localStorage.setItem('school_labs_list', JSON.stringify(updated));
    if (batchLocation === labToRemove) {
      setBatchLocation(updated[0]);
    }
  };

  const handleMaterialNameChange = (name: string) => {
    setMaterialInputName(name);
    setBatchNameTemplate(name.trim() ? `${name.trim()} #{N}` : 'Equipo #{N}');
    setBatchPrefix(computePrefix(batchLocation, name));
  };

  const handleSaveCustomMaterial = () => {
    const trimmed = materialInputName.trim();
    if (!trimmed) {
      alert('Por favor escribe el nombre del material antes de guardarlo.');
      return;
    }
    const existing = userCustomMaterials.find(m => m.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      alert('Este material ya está en tu lista de materiales guardados.');
      return;
    }
    const newItem: CustomMaterialItem = {
      id: `mat_${Date.now()}`,
      name: trimmed,
      category: batchCategory,
      suggestedQty: batchCount,
      prefixCode: batchPrefix
    };
    const updated = [...userCustomMaterials, newItem];
    setUserCustomMaterials(updated);
    localStorage.setItem('school_user_materials', JSON.stringify(updated));
  };

  const handleRemoveCustomMaterial = (id: string) => {
    const updated = userCustomMaterials.filter(m => m.id !== id);
    setUserCustomMaterials(updated);
    localStorage.setItem('school_user_materials', JSON.stringify(updated));
  };

  const handleSelectUserMaterial = (mat: CustomMaterialItem) => {
    setMaterialInputName(mat.name);
    setBatchNameTemplate(`${mat.name} #{N}`);
    setBatchCategory(mat.category);
    setBatchCount(mat.suggestedQty || 50);
    setBatchPrefix(computePrefix(batchLocation, mat.name));
  };

  const handleUpdateTicketStatus = async (
    ticket: InventoryTicket, 
    newStatus: 'pendiente' | 'en_proceso' | 'resuelto' | 'cancelado'
  ) => {
    try {
      const updates: Partial<InventoryTicket> = {
        status: newStatus
      };
      if (technicianNameInput.trim()) {
        updates.technicianName = technicianNameInput.trim();
      }
      if (technicianNoteInput.trim()) {
        updates.technicianNotes = technicianNoteInput.trim();
      }
      if (newStatus === 'resuelto') {
        updates.resolvedAt = Date.now();
      }

      await updateDoc(doc(db, 'helpdesk_tickets', ticket.id), updates);

      if (newStatus === 'resuelto' && ticket.assetCode) {
        const matchingAsset = assets.find(a => a.assetCode.toUpperCase() === ticket.assetCode.toUpperCase());
        if (matchingAsset) {
          await updateDoc(doc(db, 'helpdesk_assets', matchingAsset.id), {
            status: 'operativo'
          });
        }
      }

      setActiveTicketIdForAction(null);
      setTechnicianNoteInput('');
    } catch (err) {
      console.error(err);
      alert('Error al actualizar el ticket.');
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('¿Estás seguro de eliminar este ticket?')) return;
    try {
      await deleteDoc(doc(db, 'helpdesk_tickets', ticketId));
    } catch (err) {
      console.error(err);
      alert('Error al eliminar ticket.');
    }
  };

  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = singleCode.trim().toUpperCase();
    if (!cleanCode || !singleName.trim() || !singleLocation.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Por favor completa el código, nombre y ubicación.' });
      return;
    }

    setIsSavingSingle(true);
    setFeedbackMessage(null);
    try {
      await setDoc(doc(db, 'helpdesk_assets', cleanCode), {
        assetCode: cleanCode,
        name: singleName.trim(),
        category: singleCategory,
        location: singleLocation.trim(),
        brandModel: singleBrand.trim() || '',
        serialNumber: singleSerial.trim() || '',
        status: 'operativo',
        createdAt: Date.now()
      });

      setFeedbackMessage({ type: 'success', text: `¡Equipo ${cleanCode} registrado con su código QR!` });
      setSingleCode('');
      setSingleName('');
      setSingleBrand('');
      setSingleSerial('');
      setActiveSubTab('catalog');
    } catch (err: any) {
      console.error(err);
      setFeedbackMessage({ type: 'error', text: 'Error al registrar el equipo en la base de datos.' });
    } finally {
      setIsSavingSingle(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const prefix = batchPrefix.trim().toUpperCase();
    if (!prefix || batchCount < 1 || batchCount > 150) {
      alert('Ingresa un prefijo válido y una cantidad entre 1 y 150 equipos.');
      return;
    }
    if (!materialInputName.trim()) {
      alert('Por favor ingresa el nombre del material o equipo.');
      return;
    }

    setIsGeneratingBatch(true);
    setBatchProgress(0);
    setLastGeneratedBatch(null);

    const generatedIds: string[] = [];

    try {
      for (let i = 0; i < batchCount; i++) {
        const num = batchStartNum + i;
        const paddedNum = num < 10 ? `0${num}` : `${num}`;
        const code = `${prefix}${paddedNum}`;
        const name = batchNameTemplate.replace('{N}', paddedNum).replace('{n}', `${num}`);

        await setDoc(doc(db, 'helpdesk_assets', code), {
          assetCode: code,
          name: name,
          category: batchCategory,
          location: batchLocation.trim(),
          brandModel: batchBrand.trim() || '',
          status: 'operativo',
          createdAt: Date.now()
        });

        generatedIds.push(code);

        const currentPercent = Math.round(((i + 1) / batchCount) * 100);
        setBatchProgress(currentPercent);
      }

      setLastGeneratedBatch({
        count: batchCount,
        ids: generatedIds,
        nameTemplate: batchNameTemplate,
        location: batchLocation.trim()
      });

      setSelectedAssetIds(new Set(generatedIds));
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al generar el lote de equipos.');
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  const handleDeleteAsset = async (asset: InventoryAsset) => {
    if (!confirm(`¿Eliminar el equipo "${asset.assetCode} - ${asset.name}" del inventario?`)) return;
    try {
      await deleteDoc(doc(db, 'helpdesk_assets', asset.id));
      setSelectedAssetIds(prev => {
        const next = new Set(prev);
        next.delete(asset.id);
        return next;
      });
    } catch (err) {
      console.error(err);
      alert('Error al eliminar el activo.');
    }
  };

  const handleSaveModifiedAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssetToModify) return;

    try {
      await updateDoc(doc(db, 'helpdesk_assets', editingAssetToModify.id), {
        name: editingAssetToModify.name.trim(),
        location: editingAssetToModify.location.trim(),
        category: editingAssetToModify.category,
        brandModel: editingAssetToModify.brandModel?.trim() || '',
        status: editingAssetToModify.status,
      });
      setFeedbackMessage({ type: 'success', text: `¡Equipo ${editingAssetToModify.assetCode} modificado exitosamente!` });
      setTimeout(() => setFeedbackMessage(null), 3500);
      setEditingAssetToModify(null);
    } catch (err: any) {
      console.error(err);
      alert('Error al modificar los datos del equipo.');
    }
  };

  const assetsToPrint = useMemo(() => {
    if (printTarget === 'single' && singlePrintAsset) {
      return [singlePrintAsset];
    }
    if (printTarget === 'selected') {
      return assets.filter(a => selectedAssetIds.has(a.id));
    }
    return filteredAssets;
  }, [printTarget, singlePrintAsset, selectedAssetIds, assets, filteredAssets]);

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-primario/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-primario font-extrabold text-xs uppercase tracking-wider mb-1">
            <Wrench className="w-4 h-4" />
            <span>Centro Técnico & Soporte de Infraestructura</span>
          </div>
          <h2 className="text-2xl font-black text-texto tracking-tight flex items-center gap-2">
            <span>HelpDesk & Inventario QR (Panel de Control)</span>
          </h2>
          <p className="text-xs sm:text-sm text-texto/60 mt-1">
            Atiende incidencias reportadas por estudiantes y genera códigos QR físicos correlativos para todo el inventario escolar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-neutral-100 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-700">
            <Clock className="w-3.5 h-3.5" />
            <span>{pendingCount} Pendientes</span>
          </div>
          <div className="flex items-center gap-2 bg-neutral-100 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{resolvedCount} Resueltos</span>
          </div>
          <Link
            to="/helpdesk"
            target="_blank"
            className="bg-white hover:bg-neutral-50 text-texto border border-primario/20 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
            title="Abrir formulario público de reporte de alumnos"
          >
            <ExternalLink className="w-3.5 h-3.5 text-primario" />
            <span>Vista de Alumnos</span>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-neutral-100 p-1.5 rounded-2xl max-w-2xl overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('tickets')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeSubTab === 'tickets' 
              ? 'bg-white text-primario shadow-xs' 
              : 'text-texto/60 hover:text-texto'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Cola de Incidencias ({pendingCount + inProgressCount})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('catalog')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeSubTab === 'catalog' 
              ? 'bg-white text-primario shadow-xs' 
              : 'text-texto/60 hover:text-texto'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Catálogo & QR ({assets.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('batch')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeSubTab === 'batch' 
              ? 'bg-white text-primario shadow-xs' 
              : 'text-texto/60 hover:text-texto'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Generar Lote Correlativo</span>
        </button>

        <button
          onClick={() => setActiveSubTab('materials')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeSubTab === 'materials' 
              ? 'bg-white text-primario shadow-xs' 
              : 'text-texto/60 hover:text-texto'
          }`}
        >
          <Box className="w-4 h-4 text-primario" />
          <span>Materiales ({customMaterials.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('single')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeSubTab === 'single' 
              ? 'bg-white text-primario shadow-xs' 
              : 'text-texto/60 hover:text-texto'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Registrar 1 Equipo</span>
        </button>
      </div>

      {activeSubTab === 'tickets' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-base text-texto flex items-center gap-2">
                <Wrench className="w-4 h-4 text-primario" />
                <span>Reportes de Avería Recibidos ({filteredTickets.length})</span>
              </h3>
              <p className="text-xs text-texto/60">
                Incidencias enviadas por estudiantes y docentes a través de las etiquetas QR o la web.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl text-xs font-semibold">
              {(['todos', 'pendiente', 'en_proceso', 'resuelto'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setTicketFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                    ticketFilterStatus === st ? 'bg-white text-primario shadow-xs font-bold' : 'text-texto/60 hover:text-texto'
                  }`}
                >
                  {st === 'en_proceso' ? 'En Proceso' : st}
                </button>
              ))}
            </div>
          </div>

          {filteredTickets.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-neutral-200 rounded-3xl bg-neutral-50/50">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-bold text-texto/70">Bandeja Vacía &bull; Sin Averías Pendientes</p>
              <p className="text-xs text-texto/40 mt-1">
                No hay reportes de alumnos ni averías en este estado. Todo el equipamiento está al día.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    ticket.status === 'resuelto'
                      ? 'bg-neutral-50/50 border-neutral-200 opacity-80'
                      : ticket.status === 'en_proceso'
                      ? 'bg-blue-50/30 border-blue-200 shadow-xs'
                      : 'bg-white border-primario/20 shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-primario/10 text-primario">
                        {ticket.ticketCode}
                      </span>
                      <span className="font-mono text-xs font-bold text-texto">
                        {ticket.assetCode}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        ticket.priority === 'urgente' ? 'bg-red-100 text-red-800' :
                        ticket.priority === 'alta' ? 'bg-orange-100 text-orange-800' :
                        ticket.priority === 'media' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        Prioridad {ticket.priority}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-texto/50">
                        {new Date(ticket.createdAt).toLocaleDateString()} &bull; {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteTicket(ticket.id)}
                        className="text-texto/30 hover:text-red-600 p-1 cursor-pointer"
                        title="Eliminar ticket"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div className="md:col-span-2">
                      <h5 className="font-bold text-sm text-texto">{ticket.assetName}</h5>
                      <p className="text-xs text-texto/60 mb-2">{ticket.location}</p>
                      <p className="text-xs text-texto/85 bg-neutral-100/70 p-3 rounded-xl font-medium leading-relaxed">
                        {ticket.description}
                      </p>
                      {ticket.photoUrl && (
                        <div className="mt-2">
                          <img
                            src={ticket.photoUrl}
                            alt="Evidencia"
                            className="max-h-36 rounded-xl border border-neutral-200 object-cover"
                          />
                        </div>
                      )}
                    </div>

                    <div className="text-xs space-y-1.5 bg-fondo p-3 rounded-xl border border-neutral-100 h-fit">
                      <div className="text-texto/50 text-[10px] uppercase font-bold">Reportado por:</div>
                      <div className="font-bold text-texto">{ticket.reportedBy}</div>
                      {ticket.reportedRole && (
                        <div className="text-texto/60 capitalize text-[11px]">Rol: {ticket.reportedRole}</div>
                      )}
                      {ticket.contactInfo && (
                        <div className="text-primario text-[11px] font-medium flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{ticket.contactInfo}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-200/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-texto/60 font-semibold">Estado actual:</span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
                        ticket.status === 'resuelto' ? 'bg-emerald-100 text-emerald-800' :
                        ticket.status === 'en_proceso' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {ticket.status === 'en_proceso' ? 'En Proceso' : ticket.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {ticket.status !== 'en_proceso' && ticket.status !== 'resuelto' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateTicketStatus(ticket, 'en_proceso')}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Tomar Caso (En Proceso)
                        </button>
                      )}

                      {ticket.status !== 'resuelto' && (
                        <button
                          type="button"
                          onClick={() => setActiveTicketIdForAction(ticket.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Marcar como Resuelto</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {activeTicketIdForAction === ticket.id && (
                    <div className="mt-4 p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-3">
                      <h6 className="text-xs font-bold text-emerald-900">Registrar Solución Técnica al Alumno</h6>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={technicianNameInput}
                          onChange={(e) => setTechnicianNameInput(e.target.value)}
                          placeholder="Nombre del técnico responsable"
                          className="px-3 py-2 rounded-lg bg-white border border-emerald-200 text-xs outline-none"
                        />
                        <input
                          type="text"
                          value={technicianNoteInput}
                          onChange={(e) => setTechnicianNoteInput(e.target.value)}
                          placeholder="Ej: Se reemplazó el cable HDMI y el equipo quedó operativo."
                          className="px-3 py-2 rounded-lg bg-white border border-emerald-200 text-xs outline-none"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveTicketIdForAction(null)}
                          className="px-3 py-1.5 text-xs text-texto/60 hover:text-texto cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateTicketStatus(ticket, 'resuelto')}
                          className="px-4 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 cursor-pointer"
                        >
                          Confirmar y Cerrar Caso
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'catalog' && (
        <div className="space-y-6">
          
          <div className="bg-white p-4 rounded-2xl border border-primario/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-texto/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por código (ej. LAB1-MOU-01), nombre o laboratorio..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-primario/20 text-xs bg-fondo outline-none focus:ring-2 focus:ring-primario/20 font-mono"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 rounded-xl border border-primario/20 text-xs bg-fondo outline-none"
              >
                <option value="todos">Todas las categorías</option>
                <option value="computacion">Computación / Informática</option>
                <option value="proyector_audio">Proyectores / Audio</option>
                <option value="mobiliario">Mobiliario / Estructura</option>
                <option value="red_internet">Redes / Internet</option>
                <option value="electrico">Eléctrico / Clima</option>
                <option value="otro">Otros</option>
              </select>

              {uniqueLocations.length > 0 && (
                <select
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-primario/20 text-xs bg-fondo outline-none"
                >
                  <option value="todos">Todas las ubicaciones</option>
                  {uniqueLocations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              )}

              <button
                onClick={() => {
                  setPrintTarget(selectedAssetIds.size > 0 ? 'selected' : 'all');
                  setShowPrintModal(true);
                }}
                disabled={assets.length === 0}
                className="bg-primario text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs hover:bg-primario/90 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>
                  {selectedAssetIds.size > 0 
                    ? `Imprimir (${selectedAssetIds.size})` 
                    : 'Imprimir Pliego QR'}
                </span>
              </button>

              {filteredAssets.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-texto/70 hover:bg-neutral-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {selectedAssetIds.size === filteredAssets.length ? (
                    <>
                      <CheckSquare className="w-4 h-4 text-primario" />
                      <span>Deseleccionar</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4" />
                      <span>Seleccionar Todo</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {filteredAssets.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-neutral-200 rounded-3xl bg-neutral-50/50">
              <div className="w-16 h-16 rounded-2xl bg-primario/10 text-primario flex items-center justify-center mx-auto mb-3">
                <QrCode className="w-8 h-8" />
              </div>
              <h3 className="text-base font-extrabold text-texto mb-1">
                {assets.length === 0 ? 'Inventario sin equipos todavía' : 'No se encontraron equipos'}
              </h3>
              <p className="text-xs text-texto/60 max-w-md mx-auto mb-6">
                {assets.length === 0 
                  ? 'Genera tu primer lote para el Laboratorio 1 con códigos correlativos en 1 solo clic.' 
                  : 'Prueba cambiando los filtros o el término de búsqueda.'}
              </p>
              {assets.length === 0 && (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => setActiveSubTab('batch')}
                    className="bg-primario text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-primario/90 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Generar Lote Correlativo</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Asset Grid with Live QR Preview */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssets.map((asset) => {
                const isSelected = selectedAssetIds.has(asset.id);
                const openTickets = openTicketsByAsset.get(asset.assetCode.toUpperCase()) || [];
                const hasPendingTickets = openTickets.length > 0;

                return (
                  <div
                    key={asset.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between bg-white ${
                      isSelected 
                        ? 'border-primario ring-2 ring-primario/15 shadow-sm' 
                        : 'border-neutral-200 hover:border-primario/30 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleSelectAsset(asset.id)}
                            className="text-texto/40 hover:text-primario transition-colors cursor-pointer"
                            title={isSelected ? 'Deseleccionar' : 'Seleccionar para imprimir'}
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-primario" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                          <span className="font-mono text-xs font-black text-primario px-2.5 py-0.5 rounded-md bg-primario/10">
                            {asset.assetCode}
                          </span>
                        </div>

                        {hasPendingTickets ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>{openTickets.length} Avería(s)</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Operativo</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="bg-white p-2 rounded-xl border border-neutral-200 shrink-0 text-center shadow-xs">
                          <QRCodeSVG
                            value={getAssetHelpDeskUrl(asset.assetCode)}
                            size={72}
                            level="M"
                            includeMargin={true}
                          />
                          <span className="block text-[8px] font-mono text-texto/40 mt-1 uppercase">
                            Escaneable
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm text-texto truncate">{asset.name}</h4>
                          <p className="text-xs text-texto/60 mt-0.5 truncate">{asset.location}</p>
                          {asset.brandModel && (
                            <p className="text-[11px] text-texto/40 italic mt-0.5 truncate">{asset.brandModel}</p>
                          )}
                          <div className="mt-2 text-[10px] text-texto/50 font-medium">
                            Categoría: <span className="capitalize font-semibold text-texto/70">{asset.category.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </div>

                      {hasPendingTickets && (
                        <div className="mt-3 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                          <span className="font-bold">Ticket Activo:</span> {openTickets[0].problemType || openTickets[0].description}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSinglePrintAsset(asset);
                            setPrintTarget('single');
                            setShowPrintModal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-primario/10 text-primario font-bold hover:bg-primario hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                          title="Imprimir etiqueta individual de este activo"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Etiqueta</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingAssetToModify(asset)}
                          className="p-1.5 rounded-lg text-texto/50 hover:text-primario hover:bg-neutral-100 transition-colors cursor-pointer"
                          title="Modificar datos del equipo (nombre, ubicación, estado)"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={getAssetHelpDeskUrl(asset.assetCode)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-texto/40 hover:text-primario hover:bg-neutral-100 transition-colors"
                          title="Probar enlace de reporte del HelpDesk"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteAsset(asset)}
                        className="p-1.5 rounded-lg text-texto/30 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Eliminar activo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {activeSubTab === 'batch' && (
        <div className="space-y-6">
          
          <div className="max-w-3xl bg-white p-6 sm:p-8 rounded-3xl border border-primario/10 shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Generador Correlativo de Lotes</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-texto">
                Generador de Equipos por Lotes
              </h3>
              <p className="text-xs sm:text-sm text-texto/60 mt-1 leading-relaxed">
                Selecciona o agrega tu aula/laboratorio, añade el material o componente deseado y la cantidad. 
                El sistema generará automáticamente los códigos correlativos <strong>#01, #02, #03 hasta terminar en la cantidad establecida</strong> con sus códigos QR listos para imprimir.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-texto/70 uppercase tracking-wider">
                  1. Aula o Laboratorio:
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingLabOpen(!isAddingLabOpen)}
                  className="text-xs text-primario font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Aula / Laboratorio</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                {labsList.map((lab) => (
                  <div
                    key={lab}
                    onClick={() => handleSelectLab(lab)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      batchLocation === lab
                        ? 'bg-primario text-white shadow-xs'
                        : 'bg-fondo border border-neutral-200 text-texto hover:border-primario/40'
                    }`}
                  >
                    <span>{lab}</span>
                    {labsList.length > 1 && lab !== 'Laboratorio 1' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveLab(lab);
                        }}
                        className={`p-0.5 rounded-full hover:bg-black/10 transition-colors ${batchLocation === lab ? 'text-white' : 'text-texto/40 hover:text-red-500'}`}
                        title="Eliminar esta aula/laboratorio"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {isAddingLabOpen && (
                <div className="mt-3 p-3 bg-primario/5 border border-primario/20 rounded-2xl flex flex-col sm:flex-row gap-2 items-center">
                  <input
                    type="text"
                    value={newLabInput}
                    onChange={(e) => setNewLabInput(e.target.value)}
                    placeholder="Ej: Laboratorio 2, Laboratorio 3, Aula 1B..."
                    className="w-full sm:flex-1 px-3 py-2 text-xs bg-white rounded-xl border border-primario/20 outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewLab();
                      }
                    }}
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleAddNewLab}
                      className="flex-1 sm:flex-none px-4 py-2 bg-primario text-white rounded-xl text-xs font-bold hover:bg-primario/90 transition-all cursor-pointer"
                    >
                      Agregar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingLabOpen(false);
                        setNewLabInput('');
                      }}
                      className="px-3 py-2 text-xs text-texto/60 hover:text-texto cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-texto/70 uppercase tracking-wider">
                  2. Material / Equipo a Registrar:
                </label>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('materials')}
                  className="text-xs text-primario font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>Gestionar Materiales ({customMaterials.length})</span>
                </button>
              </div>

              {labAssociatedMaterials.length > 0 && (
                <div className="p-3 bg-primario/5 border border-primario/15 rounded-2xl mb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-primario flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Materiales vinculados a {batchLocation}:</span>
                    </span>
                    <span className="text-[10px] text-texto/40">Haz clic para autocompletar</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {labAssociatedMaterials.map((mat) => (
                      <button
                        key={mat.id}
                        type="button"
                        onClick={() => {
                          setMaterialInputName(mat.name);
                          setBatchCategory(mat.category);
                          setBatchCount(mat.defaultQty || 50);
                          setBatchBrand(mat.brandModel || '');
                          setBatchPrefix(computePrefix(batchLocation, mat.name));
                          setBatchNameTemplate(`${mat.name} #{N}`);
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          materialInputName.toLowerCase() === mat.name.toLowerCase()
                            ? 'bg-primario text-white border-primario shadow-xs'
                            : 'bg-white border-primario/25 text-primario hover:bg-primario/10'
                        }`}
                      >
                        <Tag className="w-3 h-3" />
                        <span>{mat.name}</span>
                        <span className="text-[10px] opacity-75">({mat.defaultQty} uds)</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {userCustomMaterials.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {userCustomMaterials.map((mat) => (
                    <div
                      key={mat.id}
                      onClick={() => handleSelectUserMaterial(mat)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        materialInputName.toLowerCase() === mat.name.toLowerCase()
                          ? 'bg-primario/10 border-primario text-primario shadow-xs'
                          : 'bg-fondo border-neutral-200 text-texto hover:border-primario/30'
                      }`}
                    >
                      <Tag className="w-3 h-3 text-primario" />
                      <span>{mat.name}</span>
                      <span className="text-[10px] text-texto/40">({mat.suggestedQty} uds)</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCustomMaterial(mat.id);
                        }}
                        className="text-texto/30 hover:text-red-500 p-0.5 cursor-pointer"
                        title="Eliminar de mi lista de materiales"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-4 rounded-2xl bg-neutral-50/70 border border-neutral-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-texto/70 mb-1">
                      Nombre del Material / Equipo: *
                    </label>
                    <input
                      type="text"
                      value={materialInputName}
                      onChange={(e) => handleMaterialNameChange(e.target.value)}
                      placeholder="Ej: Mouse, Teclado, Proyector, Cable HDMI, Monitor..."
                      required
                      className="w-full px-3.5 py-2 text-xs bg-white rounded-xl border border-primario/20 outline-none focus:ring-2 focus:ring-primario/20 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-texto/70 mb-1">
                      Cantidad a Generar: *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={150}
                      value={batchCount}
                      onChange={(e) => setBatchCount(parseInt(e.target.value) || 1)}
                      className="w-full px-3.5 py-2 text-xs bg-white rounded-xl border border-primario/20 outline-none font-bold text-texto"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-texto/70 mb-1">
                      Categoría:
                    </label>
                    <select
                      value={batchCategory}
                      onChange={(e) => setBatchCategory(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-neutral-200 outline-none"
                    >
                      <option value="computacion">Computación / Informática</option>
                      <option value="proyector_audio">Audio / Proyección</option>
                      <option value="red_internet">Redes / Conectividad</option>
                      <option value="mobiliario">Mobiliario / Estructura</option>
                      <option value="electrico">Eléctrico / Climatización</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-texto/70 mb-1">
                      Prefijo del Código QR:
                    </label>
                    <input
                      type="text"
                      value={batchPrefix}
                      onChange={(e) => setBatchPrefix(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2 text-xs bg-white rounded-xl border border-neutral-200 font-mono uppercase outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-texto/70 mb-1">
                      Marca / Modelo (Opcional):
                    </label>
                    <input
                      type="text"
                      value={batchBrand}
                      onChange={(e) => setBatchBrand(e.target.value)}
                      placeholder="Ej: Genius USB / HP"
                      className="w-full px-3.5 py-2 text-xs bg-white rounded-xl border border-neutral-200 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleSaveCustomMaterial}
                    disabled={!materialInputName.trim()}
                    className="py-1.5 px-3 rounded-xl border border-primario/30 bg-white text-primario hover:bg-primario hover:text-white transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                    title="Guardar este material para seleccionarlo rápidamente en el futuro"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Guardar en Mis Materiales</span>
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4 pt-2 border-t border-neutral-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-texto/70 mb-1">
                    Plantilla de Nombre en la Etiqueta:
                  </label>
                  <input
                    type="text"
                    value={batchNameTemplate}
                    onChange={(e) => setBatchNameTemplate(e.target.value)}
                    placeholder="Ej: Mouse #{N}"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-primario/20 text-xs bg-fondo outline-none"
                  />
                  <span className="text-[10px] text-texto/40 mt-1 block">{'{N}'} se convertirá en 01, 02, 03...</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-texto/70 mb-1">
                    Ubicación Confirmada: *
                  </label>
                  <input
                    type="text"
                    value={batchLocation}
                    onChange={(e) => setBatchLocation(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-primario/20 text-xs bg-fondo outline-none font-semibold text-texto"
                  />
                </div>
              </div>

              {isGeneratingBatch && (
                <div className="p-4 rounded-2xl bg-primario/5 border border-primario/20 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-primario">
                    <span>Generando Códigos QR y Registrando en Inventario...</span>
                    <span>{batchProgress}%</span>
                  </div>
                  <div className="w-full bg-neutral-200 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-primario h-full transition-all duration-200 rounded-full" 
                      style={{ width: `${batchProgress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-texto/50 text-center">
                    Creando activo y vinculando al portal HelpDesk de alumnos...
                  </p>
                </div>
              )}

              {lastGeneratedBatch && !isGeneratingBatch && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="font-extrabold text-sm text-emerald-900">
                        ¡Se generaron exitosamente los {lastGeneratedBatch.count} activos (del 01 al {lastGeneratedBatch.count < 10 ? `0${lastGeneratedBatch.count}` : lastGeneratedBatch.count})!
                      </h4>
                      <p className="text-xs text-emerald-800/80">
                        Ubicación: <strong>{lastGeneratedBatch.location}</strong> &bull; Plantilla: <strong>{lastGeneratedBatch.nameTemplate}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPrintTarget('selected');
                        setShowPrintModal(true);
                      }}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>🖨️ Imprimir Pliego de las {lastGeneratedBatch.count} Etiquetas QR Ahora</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveSubTab('catalog')}
                      className="bg-white hover:bg-neutral-50 text-emerald-900 border border-emerald-300 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer"
                    >
                      Ver en Catálogo
                    </button>
                  </div>
                </motion.div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isGeneratingBatch || !materialInputName.trim()}
                  className="w-full bg-primario text-white py-3.5 rounded-2xl font-bold text-xs shadow-md hover:bg-primario/90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingBatch ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>
                    Generar {batchCount} {materialInputName || 'Equipos'} en {batchLocation} ({batchPrefix}01 al {batchPrefix}{batchCount < 10 ? `0${batchCount}` : batchCount})
                  </span>
                </button>
              </div>
            </form>
          </div>

          <div className="max-w-3xl bg-white p-6 sm:p-8 rounded-3xl border border-primario/10 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-primario font-extrabold text-xs uppercase tracking-wider">
              <BarChart3 className="w-4 h-4" />
              <span>Porcentajes y Distribución Actual por Laboratorio / Aula</span>
            </div>
            <h3 className="text-base font-extrabold text-texto">
              Resumen de Materiales y Equipos en Existencia
            </h3>

            {Object.keys(labStatistics).length === 0 ? (
              <p className="text-xs text-texto/50 italic">
                Aún no hay equipos registrados. Cuando generes el primer lote aparecerán aquí sus porcentajes automáticos.
              </p>
            ) : (
              <div className="space-y-4">
                {Object.entries(labStatistics).map(([labName, rawStats]) => {
                  const stats = rawStats as { total: number; items: Record<string, number>; openIncidents: number };
                  const itemEntries = Object.entries(stats.items);
                  const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500'];

                  return (
                    <div key={labName} className="p-4 rounded-2xl bg-fondo border border-neutral-200 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <h4 className="font-extrabold text-sm text-texto">{labName}</h4>
                          <span className="text-[11px] text-texto/60">Total: <strong>{stats.total} activos registrados</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          {stats.openIncidents > 0 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              {stats.openIncidents} con avería reportada
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              100% Operativo
                            </span>
                          )}
                        </div>
                      </div>

                      {stats.total > 0 && itemEntries.length > 0 && (
                        <div className="w-full bg-neutral-200 h-2.5 rounded-full overflow-hidden flex">
                          {itemEntries.map(([itemName, rawCount], i) => {
                            const count = rawCount as number;
                            const pct = Math.round((count / stats.total) * 100);
                            const colorClass = colors[i % colors.length];
                            return (
                              <div
                                key={itemName}
                                style={{ width: `${pct}%` }}
                                className={`${colorClass} h-full`}
                                title={`${itemName}: ${count} (${pct}%)`}
                              />
                            );
                          })}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3 text-[11px]">
                        {itemEntries.map(([itemName, rawCount], i) => {
                          const count = rawCount as number;
                          const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                          const dotColor = colors[i % colors.length];
                          return (
                            <span key={itemName} className="flex items-center gap-1.5 font-semibold text-texto/80">
                              <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`}></span>
                              <span>{count} {itemName} ({pct}%)</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {activeSubTab === 'materials' && (
        <AdminCustomMaterials
          onSelectForBatch={(mat, targetLab) => {
            if (targetLab) setBatchLocation(targetLab);
            setMaterialInputName(mat.name);
            setBatchCategory(mat.category);
            setBatchCount(mat.defaultQty || 50);
            setBatchBrand(mat.brandModel || '');
            setBatchPrefix(computePrefix(targetLab || batchLocation, mat.name));
            setBatchNameTemplate(`${mat.name} #{N}`);
            setActiveSubTab('batch');
          }}
        />
      )}

      {activeSubTab === 'single' && (
        <div className="max-w-2xl bg-white p-6 sm:p-8 rounded-3xl border border-primario/10 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Plus className="w-5 h-5 text-primario" />
            <h3 className="text-lg font-bold text-texto">Registrar 1 Equipo Individual</h3>
          </div>
          <p className="text-xs text-texto/60 mb-6">
            Añade un equipo específico (ej. un proyector de aula, switch de red, pupitres o PC de rectoría) para generar su código QR físico.
          </p>

          {feedbackMessage && (
            <div className={`p-4 rounded-xl text-xs font-bold mb-6 border ${
              feedbackMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-red-50 text-red-800 border-red-200'
            }`}>
              {feedbackMessage.text}
            </div>
          )}

          <form onSubmit={handleCreateSingle} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-texto/70 mb-1">
                  Código de Identificación Único: *
                </label>
                <input
                  type="text"
                  value={singleCode}
                  onChange={(e) => setSingleCode(e.target.value.toUpperCase())}
                  required
                  placeholder="Ej: AULA-3A-PROY, LAB1-PC01"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-primario/20 text-xs font-mono uppercase bg-fondo outline-none focus:ring-2 focus:ring-primario/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-texto/70 mb-1">
                  Nombre Descriptivo del Equipo: *
                </label>
                <input
                  type="text"
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  required
                  placeholder="Ej: Proyector Epson Interactivo"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-primario/20 text-xs bg-fondo outline-none focus:ring-2 focus:ring-primario/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-texto/70 mb-1">
                  Categoría del Activo:
                </label>
                <select
                  value={singleCategory}
                  onChange={(e) => setSingleCategory(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-primario/20 text-xs bg-fondo outline-none"
                >
                  <option value="computacion">Computación / PCs / Laptops</option>
                  <option value="proyector_audio">Proyector / Parlantes / Audio</option>
                  <option value="mobiliario">Mobiliario / Pupitres / Mesas</option>
                  <option value="red_internet">Redes / WiFi / Switch</option>
                  <option value="electrico">Climatización / Aire / Eléctrico</option>
                  <option value="otro">Otro tipo de infraestructura</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-texto/70 mb-1">
                  Ubicación Física en la Escuela: *
                </label>
                <input
                  type="text"
                  value={singleLocation}
                  onChange={(e) => setSingleLocation(e.target.value)}
                  required
                  placeholder="Ej: Laboratorio 1, Aula 3ro BGU 'A', Auditorio"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-primario/20 text-xs bg-fondo outline-none focus:ring-2 focus:ring-primario/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-texto/70 mb-1">
                  Marca y Modelo (Opcional):
                </label>
                <input
                  type="text"
                  value={singleBrand}
                  onChange={(e) => setSingleBrand(e.target.value)}
                  placeholder="Ej: Epson PowerLite / HP ProDesk"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-primario/20 text-xs bg-fondo outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-texto/70 mb-1">
                  Número de Serie (Opcional):
                </label>
                <input
                  type="text"
                  value={singleSerial}
                  onChange={(e) => setSingleSerial(e.target.value)}
                  placeholder="Ej: SN-9812401824"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-primario/20 text-xs bg-fondo outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingSingle}
                className="bg-primario text-white px-6 py-3 rounded-xl font-bold text-xs shadow-md hover:bg-primario/90 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSavingSingle ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Registrar y Generar Código QR</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {showPrintModal && (
        <div 
          id="inventory-print-modal-container"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center animate-fade-in print:p-0 print:bg-white print:static"
        >
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 border border-neutral-300 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto print:max-w-none print:max-h-none print:shadow-none print:border-none print:p-0">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 print:hidden">
              <div>
                <h3 className="text-lg font-black text-texto flex items-center gap-2">
                  <Printer className="w-5 h-5 text-primario" />
                  <span>Impresión de Etiquetas con Códigos QR</span>
                </h3>
                <p className="text-xs text-texto/60">
                  {assetsToPrint.length} etiqueta(s) listas para imprimir en hojas adhesivas A4/Carta o cartulina.
                </p>
                <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Escaneable hacia: {getPublicSiteUrl(content.publicDomain)}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setStickerFormat('standard')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${stickerFormat === 'standard' ? 'bg-white text-primario shadow-xs font-bold' : 'text-texto/60'}`}
                  >
                    Estándar (3 Col)
                  </button>
                  <button
                    onClick={() => setStickerFormat('compact')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${stickerFormat === 'compact' ? 'bg-white text-primario shadow-xs font-bold' : 'text-texto/60'}`}
                  >
                    Compacto (4 Col)
                  </button>
                  <button
                    onClick={() => setStickerFormat('badge')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${stickerFormat === 'badge' ? 'bg-white text-primario shadow-xs font-bold' : 'text-texto/60'}`}
                  >
                    Ficha Grande
                  </button>
                </div>

                <button
                  onClick={() => window.print()}
                  className="bg-primario text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-primario/90 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Ahora</span>
                </button>

                <button
                  onClick={() => setShowPrintModal(false)}
                  className="text-texto/40 hover:text-texto p-2 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className={`grid gap-4 print:gap-3 ${
              stickerFormat === 'compact' 
                ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-4' 
                : stickerFormat === 'badge'
                ? 'grid-cols-1 sm:grid-cols-2 print:grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3'
            }`}>
              {assetsToPrint.map((asset) => (
                <div
                  key={asset.id}
                  className="border-2 border-dashed border-neutral-800 rounded-2xl p-4 bg-white text-center flex flex-col items-center justify-between page-break-inside-avoid print:border-solid print:border-neutral-900"
                >
                  <div className="w-full border-b border-neutral-300 pb-1.5 mb-2">
                    <div className="text-[8px] font-black uppercase tracking-widest text-neutral-800">
                      U.E. VIRGEN DEL CISNE
                    </div>
                    <div className="text-[9px] font-bold text-primario">
                      SISTEMA HELPDESK & MANTENIMIENTO
                    </div>
                  </div>

                  <div className="text-xs font-black text-neutral-900 leading-tight uppercase truncate max-w-[210px]">
                    {asset.name}
                  </div>

                  <div className="my-2 p-2 bg-white rounded-xl shadow-xs border border-neutral-200">
                    <QRCodeSVG
                      value={getAssetHelpDeskUrl(asset.assetCode)}
                      size={stickerFormat === 'compact' ? 85 : stickerFormat === 'badge' ? 140 : 110}
                      level="M"
                      includeMargin={true}
                    />
                  </div>

                  <div className="font-mono font-black text-sm text-neutral-900 tracking-wider bg-neutral-100 px-3 py-0.5 rounded-md border border-neutral-300">
                    {asset.assetCode}
                  </div>

                  <div className="mt-1.5 w-full">
                    <div className="text-[9px] font-semibold text-neutral-600 truncate max-w-[200px] mx-auto">
                      {asset.location}
                    </div>
                    <div className="text-[7.5px] text-neutral-500 font-bold uppercase tracking-tight mt-1 border-t border-neutral-200 pt-1">
                      📱 Escanea con tu celular para reportar averías
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 text-[11px] text-texto/60 border border-neutral-200 print:hidden flex items-center justify-between">
              <span>
                💡 <strong>Consejo para imprimir:</strong> En la ventana de impresión de tu navegador, asegúrate de activar la casilla <em>"Gráficos de fondo"</em> y ajustar los márgenes a <em>"Mínimos"</em>.
              </span>
              <button
                onClick={() => window.print()}
                className="text-primario font-bold hover:underline shrink-0 ml-4 cursor-pointer"
              >
                Abrir Diálogo de Impresión &rarr;
              </button>
            </div>

          </div>
        </div>
      )}

      {editingAssetToModify && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-primario" />
                <h4 className="font-extrabold text-sm text-texto">
                  Modificar Equipo: {editingAssetToModify.assetCode}
                </h4>
              </div>
              <button
                onClick={() => setEditingAssetToModify(null)}
                className="p-1 rounded-lg text-texto/40 hover:text-texto cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModifiedAsset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-texto/70 mb-1">Nombre del Equipo:</label>
                <input
                  type="text"
                  value={editingAssetToModify.name}
                  onChange={(e) => setEditingAssetToModify(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs outline-none focus:ring-2 focus:ring-primario/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-texto/70 mb-1">Laboratorio o Aula:</label>
                <select
                  value={editingAssetToModify.location}
                  onChange={(e) => setEditingAssetToModify(prev => prev ? ({ ...prev, location: e.target.value }) : null)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs outline-none font-semibold text-texto"
                >
                  {labsList.map(lab => (
                    <option key={lab} value={lab}>{lab}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-texto/70 mb-1">Categoría:</label>
                  <select
                    value={editingAssetToModify.category}
                    onChange={(e) => setEditingAssetToModify(prev => prev ? ({ ...prev, category: e.target.value as any }) : null)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs outline-none"
                  >
                    <option value="computacion">Computación</option>
                    <option value="proyector_audio">Proyector / Audio</option>
                    <option value="mobiliario">Mobiliario</option>
                    <option value="red_internet">Redes / WiFi</option>
                    <option value="electrico">Eléctrico</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-texto/70 mb-1">Estado:</label>
                  <select
                    value={editingAssetToModify.status}
                    onChange={(e) => setEditingAssetToModify(prev => prev ? ({ ...prev, status: e.target.value as any }) : null)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs outline-none font-bold"
                  >
                    <option value="operativo">Operativo</option>
                    <option value="en_reparacion">En Reparación</option>
                    <option value="baja">Dado de Baja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-texto/70 mb-1">Marca / Modelo:</label>
                <input
                  type="text"
                  value={editingAssetToModify.brandModel || ''}
                  onChange={(e) => setEditingAssetToModify(prev => prev ? ({ ...prev, brandModel: e.target.value }) : null)}
                  placeholder="Ej: Logitech B100 USB"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setEditingAssetToModify(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-texto/60 hover:bg-neutral-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-primario text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-primario/90 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Modificaciones</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
