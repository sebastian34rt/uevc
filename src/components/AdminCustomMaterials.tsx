import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, Check, X, Tag, Box, Layers, 
  Sparkles, CheckCircle2, AlertCircle, RefreshCw, ArrowRight,
  FolderPlus, Building2, Search, Sliders, Laptop, ShieldCheck,
  Filter, AlertTriangle
} from 'lucide-react';
import { db } from '../firebase';
import { 
  collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc, 
  query, orderBy 
} from 'firebase/firestore';

export interface HelpdeskMaterial {
  id: string;
  name: string;
  category: 'computacion' | 'proyector_audio' | 'mobiliario' | 'red_internet' | 'electrico' | 'otro';
  prefixCode: string;
  defaultQty: number;
  assignedLabs: string[];
  brandModel?: string;
  description?: string;
  createdAt?: number;
}

export interface LabAsset {
  id: string;
  assetCode: string;
  name: string;
  category: string;
  location: string;
  brandModel?: string;
  status: 'operativo' | 'en_reparacion' | 'baja';
  createdAt?: number;
}

interface AdminCustomMaterialsProps {
  onSelectForBatch?: (material: HelpdeskMaterial, targetLab?: string) => void;
  onOpenConfig?: () => void;
}

export default function AdminCustomMaterials({ onSelectForBatch, onOpenConfig }: AdminCustomMaterialsProps) {
  const [activeTab, setActiveTab] = useState<'materials' | 'labs' | 'assets'>('materials');

  const [materials, setMaterials] = useState<HelpdeskMaterial[]>([]);
  const [assets, setAssets] = useState<LabAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [availableLabs, setAvailableLabs] = useState<string[]>(['Laboratorio 1', 'Laboratorio 2', 'Laboratorio de Ciencias', 'Sala de Profesores']);

  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<HelpdeskMaterial['category']>('computacion');
  const [prefixCode, setPrefixCode] = useState('');
  const [defaultQty, setDefaultQty] = useState(50);
  const [brandModel, setBrandModel] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLabs, setSelectedLabs] = useState<string[]>(['todos']);

  const [newLabName, setNewLabName] = useState('');
  const [editingLabIndex, setEditingLabIndex] = useState<number | null>(null);
  const [editingLabText, setEditingLabText] = useState('');

  const [editingAsset, setEditingAsset] = useState<LabAsset | null>(null);
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  const [assetFilterLab, setAssetFilterLab] = useState('todos');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const qMat = query(collection(db, 'helpdesk_materials'), orderBy('name', 'asc'));
    const unsubMat = onSnapshot(qMat, (snapshot) => {
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as HelpdeskMaterial[];
      setMaterials(list);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching materials:', error);
      setIsLoading(false);
    });

    const unsubLabs = onSnapshot(doc(db, 'helpdesk_settings', 'config'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.laboratories) && data.laboratories.length > 0) {
          setAvailableLabs(data.laboratories);
          localStorage.setItem('school_labs_list', JSON.stringify(data.laboratories));
        }
      }
    });

    const qAssets = query(collection(db, 'helpdesk_assets'), orderBy('assetCode', 'asc'));
    const unsubAssets = onSnapshot(qAssets, (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      })) as LabAsset[];
      setAssets(list);
    });

    return () => {
      unsubMat();
      unsubLabs();
      unsubAssets();
    };
  }, []);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingMaterialId) {
      const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3);
      setPrefixCode(clean ? `${clean}-` : '');
    }
  };

  const toggleLab = (lab: string) => {
    if (lab === 'todos') {
      setSelectedLabs(['todos']);
      return;
    }

    let updated = selectedLabs.filter(l => l !== 'todos');
    if (updated.includes(lab)) {
      updated = updated.filter(l => l !== lab);
    } else {
      updated.push(lab);
    }

    if (updated.length === 0) {
      setSelectedLabs(['todos']);
    } else {
      setSelectedLabs(updated);
    }
  };

  const resetMaterialForm = () => {
    setEditingMaterialId(null);
    setName('');
    setCategory('computacion');
    setPrefixCode('');
    setDefaultQty(50);
    setBrandModel('');
    setDescription('');
    setSelectedLabs(['todos']);
  };

  const handleStartEditMaterial = (mat: HelpdeskMaterial) => {
    setEditingMaterialId(mat.id);
    setName(mat.name);
    setCategory(mat.category);
    setPrefixCode(mat.prefixCode);
    setDefaultQty(mat.defaultQty || 50);
    setBrandModel(mat.brandModel || '');
    setDescription(mat.description || '');
    setSelectedLabs(mat.assignedLabs && mat.assignedLabs.length > 0 ? mat.assignedLabs : ['todos']);
    setActiveTab('materials');
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  const handleSubmitMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setFeedback({ type: 'error', message: 'Por favor ingresa el nombre del material.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const docId = editingMaterialId || `mat_${Date.now()}_${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const payload: Partial<HelpdeskMaterial> = {
        name: cleanName,
        category,
        prefixCode: prefixCode.trim().toUpperCase() || `${cleanName.substring(0, 3).toUpperCase()}-`,
        defaultQty: Number(defaultQty) || 50,
        assignedLabs: selectedLabs.length > 0 ? selectedLabs : ['todos'],
        brandModel: brandModel.trim() || '',
        description: description.trim() || '',
        createdAt: editingMaterialId ? undefined : Date.now()
      };

      await setDoc(doc(db, 'helpdesk_materials', docId), payload, { merge: true });

      setFeedback({ 
        type: 'success', 
        message: editingMaterialId ? `¡Material "${cleanName}" actualizado exitosamente!` : `¡Material "${cleanName}" registrado exitosamente!` 
      });
      resetMaterialForm();
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Error al guardar el material en la base de datos.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMaterial = async (id: string, matName: string) => {
    if (!confirm(`¿Eliminar el material personalizado "${matName}"?`)) return;
    try {
      await deleteDoc(doc(db, 'helpdesk_materials', id));
      if (editingMaterialId === id) resetMaterialForm();
      setFeedback({ type: 'success', message: `Material "${matName}" eliminado.` });
    } catch (err) {
      console.error(err);
      alert('Error al eliminar el material.');
    }
  };

  const handleAddLab = async () => {
    const clean = newLabName.trim();
    if (!clean) return;
    if (availableLabs.includes(clean)) {
      alert('Este laboratorio ya existe en la lista.');
      return;
    }
    const updated = [...availableLabs, clean];
    try {
      await setDoc(doc(db, 'helpdesk_settings', 'config'), { laboratories: updated }, { merge: true });
      setAvailableLabs(updated);
      setNewLabName('');
      setFeedback({ type: 'success', message: `¡Laboratorio "${clean}" agregado exitosamente!` });
    } catch (err) {
      console.error(err);
      alert('Error al guardar el laboratorio.');
    }
  };

  const handleSaveEditLab = async (index: number) => {
    const clean = editingLabText.trim();
    if (!clean) return;
    const oldName = availableLabs[index];
    const updated = [...availableLabs];
    updated[index] = clean;
    try {
      await setDoc(doc(db, 'helpdesk_settings', 'config'), { laboratories: updated }, { merge: true });
      setAvailableLabs(updated);
      setEditingLabIndex(null);
      setFeedback({ type: 'success', message: `¡Laboratorio renombrado de "${oldName}" a "${clean}"!` });
    } catch (err) {
      console.error(err);
      alert('Error al actualizar el laboratorio.');
    }
  };

  const handleDeleteLab = async (index: number) => {
    const labName = availableLabs[index];
    if (availableLabs.length <= 1) {
      alert('Debe existir al menos un laboratorio.');
      return;
    }
    if (!confirm(`¿Eliminar "${labName}" de los laboratorios disponibles?`)) return;
    const updated = availableLabs.filter((_, i) => i !== index);
    try {
      await setDoc(doc(db, 'helpdesk_settings', 'config'), { laboratories: updated }, { merge: true });
      setAvailableLabs(updated);
      setFeedback({ type: 'success', message: `Laboratorio "${labName}" eliminado.` });
    } catch (err) {
      console.error(err);
      alert('Error al eliminar el laboratorio.');
    }
  };

  const handleSaveAssetEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;

    try {
      await updateDoc(doc(db, 'helpdesk_assets', editingAsset.id), {
        name: editingAsset.name.trim(),
        location: editingAsset.location.trim(),
        brandModel: editingAsset.brandModel?.trim() || '',
        status: editingAsset.status,
      });
      setFeedback({ type: 'success', message: `¡Equipo ${editingAsset.assetCode} actualizado exitosamente!` });
      setEditingAsset(null);
    } catch (err) {
      console.error(err);
      alert('Error al actualizar el equipo.');
    }
  };

  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchesSearch = !assetSearchQuery.trim() || 
        a.assetCode.toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
        a.name.toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
        a.location.toLowerCase().includes(assetSearchQuery.toLowerCase());
      const matchesLab = assetFilterLab === 'todos' || a.location === assetFilterLab;
      return matchesSearch && matchesLab;
    });
  }, [assets, assetSearchQuery, assetFilterLab]);

  return (
    <div className="space-y-8 animate-fade-in">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primario/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-primario font-extrabold text-xs uppercase tracking-wider mb-1">
            <Box className="w-4 h-4" />
            <span>Gestión Total de Equipamiento & Espacios</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-texto tracking-tight flex items-center gap-2">
            <span>Materiales & Laboratorios</span>
          </h3>
          <p className="text-xs sm:text-sm text-texto/60 mt-1">
            Modifica los tipos de materiales (mouse, teclados, pupitres), administra los nombres de laboratorios y edita equipos registrados.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('materials')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'materials' 
                ? 'bg-white text-primario shadow-xs' 
                : 'text-texto/60 hover:text-texto'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Materiales ({materials.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('labs')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'labs' 
                ? 'bg-white text-primario shadow-xs' 
                : 'text-texto/60 hover:text-texto'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Laboratorios ({availableLabs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('assets')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'assets' 
                ? 'bg-white text-primario shadow-xs' 
                : 'text-texto/60 hover:text-texto'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Editar Equipos ({assets.length})</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center justify-between animate-fade-in ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs font-black opacity-60 hover:opacity-100 cursor-pointer">✕</button>
        </div>
      )}

      {activeTab === 'materials' && (
        <div className="space-y-8">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-primario/15 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primario/10 text-primario flex items-center justify-center">
                  {editingMaterialId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base text-texto">
                    {editingMaterialId ? 'Editar Material Personalizado' : 'Registrar Nuevo Material o Componente'}
                  </h4>
                  <p className="text-[11px] text-texto/50">
                    {editingMaterialId ? 'Modifica los parámetros y laboratorios asociados' : 'Define el nombre, prefijo y a qué laboratorios pertenece'}
                  </p>
                </div>
              </div>

              {editingMaterialId && (
                <button
                  type="button"
                  onClick={resetMaterialForm}
                  className="text-xs font-bold text-texto/50 hover:text-texto bg-neutral-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar Edición
                </button>
              )}
            </div>

            <form onSubmit={handleSubmitMaterial} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-texto/70 mb-1">
                    Nombre del Material / Equipo: *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                    placeholder="Ej: Mouse Óptico USB, Teclado Multimedia, Pupitre Metálico, Proyector HDMI..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-primario/20 text-xs sm:text-sm bg-fondo outline-none focus:ring-2 focus:ring-primario/20 font-medium text-texto"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-texto/70 mb-1">
                    Cantidad Habitual por Lote: *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={defaultQty}
                    onChange={(e) => setDefaultQty(parseInt(e.target.value) || 1)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-primario/20 text-xs sm:text-sm bg-fondo outline-none font-bold text-texto"
                  />
                  <span className="text-[10px] text-texto/40 mt-1 block">Ej: 50 unidades</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div>
                  <label className="block text-xs font-bold text-texto/70 mb-1">
                    Categoría del Material:
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-primario/20 text-xs bg-fondo outline-none font-medium"
                  >
                    <option value="computacion">Computación / PCs / Mouse / Teclados</option>
                    <option value="proyector_audio">Proyectores / Audio / Micrófonos</option>
                    <option value="mobiliario">Mobiliario / Pupitres / Mesas</option>
                    <option value="red_internet">Redes / WiFi / Switch / Cables</option>
                    <option value="electrico">Eléctrico / Climatización</option>
                    <option value="otro">Otro tipo de infraestructura</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-texto/70 mb-1">
                    Prefijo Sugerido de Código:
                  </label>
                  <input
                    type="text"
                    value={prefixCode}
                    onChange={(e) => setPrefixCode(e.target.value.toUpperCase())}
                    placeholder="Ej: MOU-, TEC-, PUP-, PROY-"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-primario/20 text-xs font-mono uppercase bg-fondo outline-none font-bold"
                  />
                  <span className="text-[10px] text-texto/40 mt-1 block">Se antepondrá al correlativo #01, #02...</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-texto/70 mb-1">
                    Marca / Modelo (Opcional):
                  </label>
                  <input
                    type="text"
                    value={brandModel}
                    onChange={(e) => setBrandModel(e.target.value)}
                    placeholder="Ej: Genius DX-120 / HP USB"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-primario/20 text-xs bg-fondo outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-texto/70 uppercase tracking-wider">
                    Asociación Dinámica a Laboratorios o Aulas:
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('labs')}
                    className="text-[11px] font-bold text-primario hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Building2 className="w-3 h-3" />
                    <span>Administrar o Agregar Laboratorios</span>
                  </button>
                </div>
                <p className="text-[11px] text-texto/50 mb-3">
                  Selecciona en qué laboratorios se utiliza este material. Al entrar a ese laboratorio en el generador de QR, este material aparecerá vinculado automáticamente:
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleLab('todos')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedLabs.includes('todos')
                        ? 'bg-primario text-white border-primario shadow-xs'
                        : 'bg-fondo border-neutral-200 text-texto hover:border-primario/30'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>🌐 Todos los Laboratorios</span>
                  </button>

                  {availableLabs.map((lab) => {
                    const isSelected = selectedLabs.includes(lab) && !selectedLabs.includes('todos');
                    return (
                      <button
                        key={lab}
                        type="button"
                        onClick={() => toggleLab(lab)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-primario text-white border-primario shadow-xs'
                            : 'bg-fondo border-neutral-200 text-texto hover:border-primario/30'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{lab}</span>
                        {isSelected && <Check className="w-3 h-3 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-neutral-100">
                <span className="text-[11px] text-texto/50 italic">
                  Sincronizado en tiempo real para todos los administradores.
                </span>

                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="bg-primario text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md hover:bg-primario/90 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{editingMaterialId ? 'Guardar Cambios del Material' : 'Registrar Material'}</span>
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-base text-texto flex items-center gap-2">
                <Layers className="w-4 h-4 text-primario" />
                <span>Catálogo de Materiales ({materials.length})</span>
              </h4>
              <span className="text-xs text-texto/50 font-medium">
                Listos para generar códigos QR correlativos
              </span>
            </div>

            {materials.length === 0 && !isLoading ? (
              <div className="py-12 text-center border-2 border-dashed border-neutral-200 rounded-3xl bg-neutral-50/50 p-6">
                <Box className="w-12 h-12 text-neutral-400 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-bold text-texto/70">Aún no hay materiales registrados</p>
                <p className="text-xs text-texto/40 max-w-sm mx-auto mt-1">
                  Usa el formulario superior para registrar tus primeros materiales (ej: Mouse, Teclados, Pupitres, etc.).
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {materials.map((mat) => {
                  const isEditingThis = editingMaterialId === mat.id;
                  const hasAllLabs = mat.assignedLabs?.includes('todos') || !mat.assignedLabs || mat.assignedLabs.length === 0;

                  return (
                    <div
                      key={mat.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between bg-white ${
                        isEditingThis 
                          ? 'border-primario ring-2 ring-primario/20 shadow-md' 
                          : 'border-neutral-200 hover:border-primario/30 shadow-xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h5 className="font-extrabold text-sm text-texto leading-tight">{mat.name}</h5>
                            {mat.brandModel && (
                              <p className="text-[11px] text-texto/50 italic mt-0.5">{mat.brandModel}</p>
                            )}
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primario/10 text-primario capitalize whitespace-nowrap">
                            {mat.category.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 my-3 text-[11px]">
                          <span className="font-mono font-bold bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded-md border border-neutral-200">
                            Prefijo: {mat.prefixCode}
                          </span>
                          <span className="font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-md">
                            {mat.defaultQty || 50} uds / lote
                          </span>
                        </div>

                        <div className="mt-2 pt-2 border-t border-neutral-100">
                          <span className="text-[10px] font-bold text-texto/50 uppercase tracking-wider block mb-1.5">
                            Laboratorios Asociados:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {hasAllLabs ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                🌐 Todos los Laboratorios
                              </span>
                            ) : (
                              mat.assignedLabs.map((l) => (
                                <span key={l} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700">
                                  {l}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEditMaterial(mat)}
                            className="px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-texto font-bold transition-colors flex items-center gap-1 cursor-pointer"
                            title="Editar datos del material"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-texto/60" />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteMaterial(mat.id, mat.name)}
                            className="p-1.5 rounded-lg text-texto/30 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Eliminar material"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {onSelectForBatch && (
                          <button
                            type="button"
                            onClick={() => onSelectForBatch(mat, hasAllLabs ? availableLabs[0] : mat.assignedLabs[0])}
                            className="bg-primario text-white px-2.5 py-1.5 rounded-lg font-bold text-[11px] hover:bg-primario/90 transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                            title="Usar este material para generar códigos QR"
                          >
                            <span>Generar Lote QR</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'labs' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-primario/15 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primario/10 text-primario flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-texto">
                  Modificar Laboratorios y Aulas
                </h4>
                <p className="text-xs text-texto/50">
                  Agrega, renombra o elimina los laboratorios escolares disponibles en el sistema
                </p>
              </div>
            </div>

            <span className="text-xs font-bold bg-primario/10 text-primario px-3 py-1.5 rounded-xl">
              {availableLabs.length} Laboratorios Registrados
            </span>
          </div>

          <div className="flex items-center gap-2 max-w-lg">
            <input
              type="text"
              value={newLabName}
              onChange={(e) => setNewLabName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddLab(); } }}
              placeholder="Ej: Laboratorio 3, Robótica, Sala Audiovisuales..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm bg-fondo outline-none focus:ring-2 focus:ring-primario/20"
            />
            <button
              type="button"
              onClick={handleAddLab}
              disabled={!newLabName.trim()}
              className="bg-primario text-white px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-primario/90 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Laboratorio</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {availableLabs.map((lab, index) => {
              const isEditing = editingLabIndex === index;

              return (
                <div
                  key={index}
                  className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 hover:bg-white hover:border-primario/30 transition-all flex items-center justify-between gap-2 shadow-2xs"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 w-full">
                      <input
                        type="text"
                        value={editingLabText}
                        onChange={(e) => setEditingLabText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveEditLab(index); } }}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-primario text-xs bg-white outline-none font-bold"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEditLab(index)}
                        className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                        title="Guardar nombre"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingLabIndex(null)}
                        className="p-1.5 rounded-lg bg-neutral-200 text-texto/60 hover:bg-neutral-300 cursor-pointer"
                        title="Cancelar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <Building2 className="w-4 h-4 text-primario shrink-0" />
                        <span className="font-extrabold text-xs text-texto truncate">{lab}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLabIndex(index);
                            setEditingLabText(lab);
                          }}
                          className="p-1.5 rounded-lg text-texto/40 hover:text-texto hover:bg-neutral-200 transition-colors cursor-pointer"
                          title="Renombrar laboratorio"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLab(index)}
                          className="p-1.5 rounded-lg text-texto/30 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Eliminar laboratorio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'assets' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-primario/15 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-extrabold text-base text-texto flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-primario" />
                  <span>Modificar Equipos Registrados en el Laboratorio ({filteredAssets.length})</span>
                </h4>
                <p className="text-xs text-texto/50 mt-0.5">
                  Cambia de laboratorio un equipo, actualiza su estado operativo o edita su modelo.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-texto/40 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={assetSearchQuery}
                    onChange={(e) => setAssetSearchQuery(e.target.value)}
                    placeholder="Buscar código o nombre..."
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-neutral-300 text-xs bg-fondo outline-none focus:ring-2 focus:ring-primario/20"
                  />
                </div>

                <select
                  value={assetFilterLab}
                  onChange={(e) => setAssetFilterLab(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-neutral-300 text-xs bg-fondo outline-none font-semibold text-texto"
                >
                  <option value="todos">Todos los Laboratorios</option>
                  {availableLabs.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredAssets.length === 0 ? (
              <div className="py-12 text-center text-xs text-texto/50">
                No se encontraron equipos registrados con ese criterio.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                {filteredAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="p-4 rounded-2xl border border-neutral-200 bg-white hover:border-primario/30 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-xs font-black text-primario bg-primario/10 px-2 py-0.5 rounded-md">
                          {asset.assetCode}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          asset.status === 'operativo' ? 'bg-emerald-100 text-emerald-800' :
                          asset.status === 'en_reparacion' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {asset.status === 'en_reparacion' ? 'En Reparación' : asset.status}
                        </span>
                      </div>

                      <h5 className="font-bold text-xs text-texto truncate">{asset.name}</h5>
                      <p className="text-[11px] text-texto/60 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-texto/40" />
                        <span>{asset.location}</span>
                      </p>
                      {asset.brandModel && (
                        <p className="text-[10px] text-texto/40 italic mt-0.5">{asset.brandModel}</p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-neutral-100 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => setEditingAsset(asset)}
                        className="bg-neutral-100 hover:bg-neutral-200 text-texto px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-texto/60" />
                        <span>Modificar Equipo</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {editingAsset && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-primario" />
                    <h4 className="font-extrabold text-sm text-texto">
                      Modificar Equipo: {editingAsset.assetCode}
                    </h4>
                  </div>
                  <button
                    onClick={() => setEditingAsset(null)}
                    className="p-1 rounded-lg text-texto/40 hover:text-texto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveAssetEdit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-texto/70 mb-1">Nombre del Equipo:</label>
                    <input
                      type="text"
                      value={editingAsset.name}
                      onChange={(e) => setEditingAsset(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs outline-none focus:ring-2 focus:ring-primario/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-texto/70 mb-1">Laboratorio / Ubicación:</label>
                    <select
                      value={editingAsset.location}
                      onChange={(e) => setEditingAsset(prev => prev ? ({ ...prev, location: e.target.value }) : null)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs outline-none"
                    >
                      {availableLabs.map(lab => (
                        <option key={lab} value={lab}>{lab}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-texto/70 mb-1">Marca / Modelo:</label>
                    <input
                      type="text"
                      value={editingAsset.brandModel || ''}
                      onChange={(e) => setEditingAsset(prev => prev ? ({ ...prev, brandModel: e.target.value }) : null)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-texto/70 mb-1">Estado del Equipo:</label>
                    <select
                      value={editingAsset.status}
                      onChange={(e) => setEditingAsset(prev => prev ? ({ ...prev, status: e.target.value as any }) : null)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs outline-none font-bold"
                    >
                      <option value="operativo">Operativo (En uso normal)</option>
                      <option value="en_reparacion">En Reparación / Mantenimiento</option>
                      <option value="baja">Dado de Baja / Desecho</option>
                    </select>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100">
                    <button
                      type="button"
                      onClick={() => setEditingAsset(null)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-texto/60 hover:bg-neutral-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-primario text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-primario/90 flex items-center gap-1.5"
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
      )}

    </div>
  );
}
