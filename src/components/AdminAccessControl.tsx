import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  Crown, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Search, 
  Filter, 
  AlertTriangle, 
  Edit3, 
  Save, 
  X,
  Clock,
  KeyRound,
  ExternalLink,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';
import { 
  AuthorizedUser, 
  UserRole, 
  SUPER_ADMIN_EMAIL, 
  ROLE_DEFINITIONS 
} from '../types/accessControl';
import { useAuth } from '../context/AuthContext';

export default function AdminAccessControl() {
  const { currentUser, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState<AuthorizedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('todos');

  // Formulario nuevo usuario
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edición de usuario existente
  const [editingUser, setEditingUser] = useState<AuthorizedUser | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'authorized_users'), (snapshot) => {
      const list = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as AuthorizedUser[];
      
      setUsers(list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
      setIsLoading(false);
    }, (err) => {
      console.warn('Authorized users listener notice:', err?.message);
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newEmail.trim().toLowerCase();
    const cleanName = newName.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFeedback({ type: 'error', message: 'Por favor ingresa un correo electrónico válido.' });
      return;
    }

    if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      setFeedback({ type: 'error', message: 'Este correo es el Super Administrador Principal y ya cuenta con todos los accesos protegidos.' });
      return;
    }

    const alreadyExists = users.some(u => u.email.toLowerCase() === cleanEmail);
    if (alreadyExists) {
      setFeedback({ type: 'error', message: 'Este correo ya se encuentra en la lista de usuarios autorizados.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      await addDoc(collection(db, 'authorized_users'), {
        email: cleanEmail,
        name: cleanName || cleanEmail.split('@')[0],
        role: newRole,
        status: 'active',
        assignedBy: currentUser?.email || SUPER_ADMIN_EMAIL,
        createdAt: Date.now(),
        lastLogin: null
      });

      setFeedback({ 
        type: 'success', 
        message: `¡Usuario ${cleanEmail} autorizado con éxito como ${ROLE_DEFINITIONS[newRole].label}!` 
      });

      setNewEmail('');
      setNewName('');
      setNewRole('admin');
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      console.warn('Error adding authorized user:', err);
      setFeedback({ type: 'error', message: 'Error al autorizar el correo: ' + (err?.message || 'Intente de nuevo') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: AuthorizedUser) => {
    if (!user.id) return;
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await updateDoc(doc(db, 'authorized_users', user.id), {
        status: nextStatus
      });
    } catch (err: any) {
      console.warn('Error toggling status:', err);
    }
  };

  const handleDeleteUser = async (user: AuthorizedUser) => {
    if (!user.id) return;
    if (user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      alert('No es posible eliminar la cuenta del Super Administrador Principal.');
      return;
    }

    const confirmed = window.confirm(`¿Estás seguro de revocar el acceso para ${user.email}? Esta persona no podrá volver a ingresar al panel.`);
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'authorized_users', user.id));
      setFeedback({ type: 'success', message: `Acceso revocado para ${user.email}.` });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      console.warn('Error deleting user:', err);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editingUser.id) return;

    try {
      await updateDoc(doc(db, 'authorized_users', editingUser.id), {
        name: editingUser.name,
        role: editingUser.role,
        status: editingUser.status
      });
      setFeedback({ type: 'success', message: `Permisos actualizados para ${editingUser.email}.` });
      setEditingUser(null);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      console.warn('Error updating user role:', err);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'todos' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8">
      {/* Encabezado Principal y Perfil Super Admin */}
      <div className="bg-gradient-to-r from-primario via-primario/95 to-primario/85 text-white p-6 sm:p-8 rounded-3xl shadow-md border border-primario/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/15 shadow-sm">
              <Crown className="w-8 h-8 text-detalle" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-serif font-black tracking-tight">Centro de Control & Super Administrador</h2>
                <span className="bg-detalle text-primario font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                  Propietario Principal
                </span>
              </div>
              <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed font-sans">
                Tu cuenta como Super Administrador Principal está blindada como la máxima autoridad. Desde aquí puedes autorizar nuevos correos de profesores o personal administrativo y asignarles roles específicos.
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15 shrink-0 text-left sm:text-right">
            <span className="text-[11px] text-white/70 block uppercase font-bold tracking-wider">Usuarios Autorizados</span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-0.5 flex items-center gap-2 sm:justify-end">
              <span>{users.length + 1}</span>
              <span className="text-xs font-normal text-white/70">cuentas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario para Autorizar un Nuevo Correo */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-primario/10 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-primario/10 pb-4">
          <div className="w-10 h-10 rounded-xl bg-primario/10 text-primario flex items-center justify-center shrink-0">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-texto">Autorizar Nuevo Correo para Ingreso</h3>
            <p className="text-xs text-texto/60">Registra el correo electrónico de la persona a quien deseas conceder acceso al panel.</p>
          </div>
        </div>

        {feedback && (
          <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-3 ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleAddUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-texto/70 mb-1.5 uppercase tracking-wider">
                Correo Electrónico *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-texto/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="ejemplo@gmail.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-primario/15 rounded-xl text-sm text-texto focus:outline-none focus:ring-2 focus:ring-primario/20 focus:bg-white transition-all"
                />
              </div>
              <span className="text-[10px] text-texto/40 mt-1 block">Puede ser una cuenta de Google o cualquier correo institucional.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-texto/70 mb-1.5 uppercase tracking-wider">
                Nombre o Identificación *
              </label>
              <input
                type="text"
                required
                placeholder="Lcdo. Juan Pérez / Secretaría"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-50 border border-primario/15 rounded-xl text-sm text-texto focus:outline-none focus:ring-2 focus:ring-primario/20 focus:bg-white transition-all"
              />
              <span className="text-[10px] text-texto/40 mt-1 block">Nombre visible en el registro de administradores.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-texto/70 mb-1.5 uppercase tracking-wider">
                Rol & Nivel de Permisos *
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full px-4 py-2.5 bg-neutral-50 border border-primario/15 rounded-xl text-sm text-texto font-medium focus:outline-none focus:ring-2 focus:ring-primario/20 focus:bg-white transition-all"
              >
                <option value="admin">Administrador General (Contenidos + HelpDesk)</option>
                <option value="editor">Editor de Contenidos (Noticias, Galería, Agenda)</option>
                <option value="helpdesk">Técnico HelpDesk (Laboratorios & QR)</option>
                <option value="superadmin">Super Administrador Delegado</option>
              </select>
              <span className="text-[10px] text-texto/40 mt-1 block">{ROLE_DEFINITIONS[newRole].description}</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primario text-white hover:bg-primario/90 px-6 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-primario/20 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : 'Autorizar y Dar Acceso'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Tabla y Listado de Usuarios Autorizados */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-primario/10 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primario/10 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-texto">Directorio de Accesos Autorizados</h3>
            <p className="text-xs text-texto/60">Gestiona los permisos y el estado activo de cada cuenta registrada.</p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-texto/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por correo o nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-neutral-50 border border-primario/15 rounded-xl text-xs text-texto focus:outline-none focus:ring-1 focus:ring-primario"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 bg-neutral-50 border border-primario/15 rounded-xl text-xs text-texto font-medium focus:outline-none focus:ring-1 focus:ring-primario"
            >
              <option value="todos">Todos los roles</option>
              <option value="superadmin">Super Admin</option>
              <option value="admin">Administrador</option>
              <option value="editor">Editor</option>
              <option value="helpdesk">HelpDesk</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-primario/10 text-texto/50 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Usuario / Correo</th>
                <th className="py-3 px-4">Rol Asignado</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Fecha de Registro</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primario/5">
              {/* Fila Fija e Inmutable: Super Admin Principal */}
              <tr className="bg-purple-50/40 font-medium">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Crown className="w-5 h-5 text-detalle" />
                    </div>
                    <div>
                      <div className="font-bold text-texto text-sm flex items-center gap-1.5">
                        <span>Juan del Pezo (Tú)</span>
                        <span className="text-[10px] bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.2 rounded-full font-bold">
                          Titular
                        </span>
                      </div>
                      <div className="text-texto/60 font-mono text-xs">Cuenta Principal Privada (Protegida)</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                    Super Administrador
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Activo Permanente
                  </span>
                </td>
                <td className="py-4 px-4 text-texto/60">
                  <span>Propietario del Sistema</span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-texto/40 text-[11px] italic">Protegido</span>
                </td>
              </tr>

              {/* Usuarios autorizados dinámicos */}
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primario/10 text-primario flex items-center justify-center shrink-0 font-bold uppercase">
                          {user.name.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-texto text-sm">{user.name}</div>
                          <div className="text-texto/60 font-mono text-xs">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${ROLE_DEFINITIONS[user.role]?.badgeColor || 'bg-gray-100 text-gray-800'}`}>
                        {ROLE_DEFINITIONS[user.role]?.label || user.role}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                          user.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                        }`}
                      >
                        {user.status === 'active' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Activo</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-neutral-500" />
                            <span>Inactivo</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-4 text-texto/60">
                      <div>{new Date(user.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      <div className="text-[10px] text-texto/40">Por: {user.assignedBy}</div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-1.5 rounded-lg text-texto/60 hover:text-primario hover:bg-primario/10 transition-colors cursor-pointer"
                          title="Editar rol"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-1.5 rounded-lg text-texto/60 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Revocar acceso"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-texto/50">
                    {searchQuery ? 'No se encontraron usuarios que coincidan con la búsqueda.' : 'Aún no has agregado correos adicionales. Usa el formulario superior para autorizar profesores o administradores.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Editar Rol de Usuario */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-primario/15 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-primario/10 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-primario" />
                  <h4 className="font-bold text-texto text-base">Modificar Permisos</h4>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-1.5 rounded-full hover:bg-neutral-100 text-texto/50 hover:text-texto"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateRole} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-texto/70 mb-1">Correo Electrónico</label>
                  <input
                    type="text"
                    disabled
                    value={editingUser.email}
                    className="w-full px-3 py-2 bg-neutral-100 rounded-xl text-xs font-mono text-texto/70 border border-neutral-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-texto/70 mb-1">Nombre / Identificación</label>
                  <input
                    type="text"
                    required
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 rounded-xl text-xs text-texto border border-primario/15 focus:outline-none focus:ring-1 focus:ring-primario"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-texto/70 mb-1">Rol Asignado</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 bg-neutral-50 rounded-xl text-xs text-texto border border-primario/15 focus:outline-none focus:ring-1 focus:ring-primario font-medium"
                  >
                    <option value="admin">Administrador General</option>
                    <option value="editor">Editor de Contenidos</option>
                    <option value="helpdesk">Técnico HelpDesk</option>
                    <option value="superadmin">Super Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-texto/70 mb-1">Estado de la Cuenta</label>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-3 py-2 bg-neutral-50 rounded-xl text-xs text-texto border border-primario/15 focus:outline-none focus:ring-1 focus:ring-primario font-medium"
                  >
                    <option value="active">Activo (Puede ingresar)</option>
                    <option value="inactive">Inactivo (Acceso bloqueado)</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-texto/60 hover:bg-neutral-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-primario text-white hover:bg-primario/90 shadow-xs"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
