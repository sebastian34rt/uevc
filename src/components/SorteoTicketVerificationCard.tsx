import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Trophy, 
  AlertTriangle, 
  Copy, 
  Check, 
  Calendar, 
  User, 
  Phone, 
  Mail,
  Tag, 
  Printer, 
  RotateCcw, 
  FileText, 
  Lock, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Trash2, 
  Edit3,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { Sorteo, SorteoTicket } from '../types/sorteo';
import { formatTicketCodeDisplay, normalizeTicketCode } from '../utils/sorteoSecurity';
import { useSorteos } from '../context/SorteoContext';
import { SorteoTicketCard } from './SorteoTicketCard';

interface SorteoTicketVerificationCardProps {
  ticket: SorteoTicket;
  sorteo?: Sorteo;
  onResetSearch?: () => void;
  onPrintTicket?: (ticket: SorteoTicket) => void;
  onEditTicket?: (ticket: SorteoTicket) => void;
  onDeleteTicket?: (ticket: SorteoTicket) => void;
  isAdmin?: boolean;
}

export const SorteoTicketVerificationCard: React.FC<SorteoTicketVerificationCardProps> = ({
  ticket,
  sorteo,
  onResetSearch,
  onPrintTicket,
  onEditTicket,
  onDeleteTicket,
  isAdmin = false
}) => {
  const { registerTicket } = useSorteos();
  const [copied, setCopied] = useState(false);
  const [showFullPhysicalTicket, setShowFullPhysicalTicket] = useState(false);
  const [isEditingRegistration, setIsEditingRegistration] = useState(false);

  // Estados del formulario de registro único
  const [regName, setRegName] = useState(ticket.participantName === 'Al Portador' ? '' : (ticket.participantName || ''));
  const [regPhone, setRegPhone] = useState(ticket.participantPhone || '');
  const [regEmail, setRegEmail] = useState(ticket.participantEmail || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState(false);

  const cleanCode = normalizeTicketCode(ticket.ticketCode);
  const formattedCode = formatTicketCodeDisplay(ticket.ticketCode);

  const isWinner = ticket.status === 'winner' || 
    (sorteo?.winnerTicketCode && normalizeTicketCode(sorteo.winnerTicketCode) === cleanCode);

  // Un boleto se considera registrado si tiene isRegistered o si tiene un nombre real asignado
  const isRegistered = Boolean(
    ticket.isRegistered || 
    (ticket.participantName && ticket.participantName.trim() !== '' && ticket.participantName.trim() !== 'Al Portador')
  );

  const handleCopyCode = () => {
    navigator.clipboard.writeText(ticket.ticketCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    const name = regName.trim();
    const phone = regPhone.trim();
    const email = regEmail.trim();

    if (!name || name.length < 3) {
      setRegError('Por favor ingresa tu nombre y apellido completos.');
      return;
    }

    if (!phone || phone.length < 7) {
      setRegError('Por favor ingresa un número de teléfono o celular válido (mínimo 7 dígitos).');
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setRegError('Por favor ingresa una dirección de correo electrónico válida.');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerTicket(ticket.id, {
        participantName: name,
        participantPhone: phone,
        participantEmail: email
      });
      setRegSuccess(true);
      setIsEditingRegistration(false);
    } catch (err: any) {
      setRegError(err.message || 'Error al registrar los datos del boleto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const registeredDateStr = ticket.registeredAt 
    ? new Date(ticket.registeredAt).toLocaleDateString('es-EC', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date(ticket.createdAt).toLocaleDateString('es-EC', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* TARJETA PRINCIPAL DE VERIFICACIÓN DE BOLETO */}
      <div className={`relative overflow-hidden rounded-3xl bg-white border shadow-xl transition-all ${
        isWinner 
          ? 'border-amber-400/80 shadow-amber-500/10' 
          : 'border-emerald-500/30 shadow-emerald-500/5'
      }`}>
        {/* ENCABEZADO SUPERIOR INSTITUCIONAL */}
        <div className={`px-6 py-4 border-b flex items-center justify-between gap-3 ${
          isWinner 
            ? 'bg-linear-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border-amber-200' 
            : 'bg-linear-to-r from-emerald-50 via-slate-50 to-emerald-50 border-emerald-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              isWinner 
                ? 'bg-amber-500 text-white shadow-amber-500/30' 
                : 'bg-emerald-600 text-white shadow-emerald-600/30'
            }`}>
              {isWinner ? <Trophy className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <span className="block text-[11px] font-black uppercase tracking-wider text-slate-500">
                Certificado Institucional
              </span>
              <h3 className="font-serif font-black text-slate-900 text-base sm:text-lg leading-tight">
                Verificación de Boleto
              </h3>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/90 border border-slate-200 shadow-2xs text-slate-700">
              <span className={`w-2 h-2 rounded-full ${isWinner ? 'bg-amber-500 animate-bounce' : 'bg-emerald-500 animate-pulse'}`} />
              {isWinner ? 'Ganador' : (isRegistered ? 'Registrado' : 'Válido')}
            </span>
          </div>
        </div>

        {/* CUERPO DEL RESULTADO DE VERIFICACIÓN */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* BANNER DE ESTADO */}
          {isWinner ? (
            <div className="p-5 rounded-2xl bg-linear-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 border-2 border-amber-400 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-amber-800 block">
                    ¡Felicitaciones!
                  </span>
                  <h4 className="text-xl font-serif font-black text-amber-950">
                    ¡BOLETO OFICIAL GANADOR!
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    {sorteo?.winnerPrize ? `Premio asignado: ${sorteo.winnerPrize}` : 'Boleto premiado en el sorteo institucional'}
                  </p>
                </div>
              </div>
            </div>
          ) : ticket.status === 'cancelled' ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-rose-950">Boleto Anulado o Inactivo</h4>
                <p className="text-xs text-rose-700">Este boleto figura como cancelado y no participa en el sorteo.</p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-950 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm sm:text-base text-emerald-950 leading-tight">
                  Boleto Oficial Registrado y Válido
                </h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Autenticidad comprobada en los servidores oficiales de la U.E. Virgen del Cisne.
                </p>
              </div>
            </div>
          )}

          {/* CÓDIGO DESTACADO DE 9 DÍGITOS */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 text-center relative overflow-hidden">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
              Código de Seguridad del Boleto
            </span>
            <div className="inline-flex items-center justify-center gap-3 bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-2xs max-w-full">
              <span className="font-mono text-2xl sm:text-3xl font-black text-slate-900 tracking-wider">
                {formattedCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1.5 text-slate-400 hover:text-primario hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Copiar código del boleto"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="mt-2 flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Estándar de 9 Dígitos Criptográficos</span>
              <span>•</span>
              <span>ID: #{ticket.id.slice(-6)}</span>
            </div>
          </div>

          {/* NOTIFICACIÓN DE ÉXITO DE REGISTRO */}
          {regSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center gap-3 shadow-sm animate-fade-in">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div className="flex-1 text-xs">
                <strong className="block font-black text-sm text-emerald-900">¡Boleto Registrado Exitosamente!</strong>
                <span>Tus datos han quedado vinculados como único titular de este boleto para el sorteo institucional.</span>
              </div>
            </div>
          )}

          {/* SECCIÓN DE REGISTRO DE DATOS ÚNICOS */}
          {(!isRegistered || isEditingRegistration) ? (
            <div className="p-6 rounded-2xl bg-amber-50/70 border-2 border-amber-300 text-slate-800 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-black text-base text-amber-950">
                    {isEditingRegistration ? 'Actualizar Datos del Boleto Único' : 'Registrar este Boleto a tu Nombre (Único e Intransferible)'}
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                    Ingresa tu <strong>nombre completo</strong>, <strong>número de celular</strong> y <strong>correo electrónico</strong> para asegurar tu participación única en el sorteo.
                  </p>
                </div>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Nombre Completo del Participante *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="ej. Carlos Mendoza"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Número de Celular / WhatsApp *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="ej. 0991234567"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Correo Electrónico *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="ej. carlos.mendoza@gmail.com"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>
                </div>

                {regError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{regError}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Guardando Registro Único...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Registrar y Asegurar Boleto Único</span>
                      </>
                    )}
                  </button>

                  {isEditingRegistration && (
                    <button
                      type="button"
                      onClick={() => setIsEditingRegistration(false)}
                      className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          ) : (
            /* FICHA DE DATOS DEL BOLETO YA REGISTRADO Y ÚNICO */
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Sorteo Asociado */}
                <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/70">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase mb-1">
                    <Tag className="w-3.5 h-3.5 text-primario" />
                    <span>Sorteo Asociado</span>
                  </div>
                  <p className="font-bold text-slate-900 text-sm truncate">
                    {sorteo?.title || 'Sorteo Institucional'}
                  </p>
                  {sorteo?.drawDate && (
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Fecha: {sorteo.drawDate}
                    </p>
                  )}
                </div>

                {/* Participante Registrado */}
                <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/70">
                  <div className="flex items-center justify-between gap-2 text-slate-500 text-xs font-bold uppercase mb-1">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Titular Registrado</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-full">
                      Único
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 text-sm truncate">
                    {ticket.participantName}
                  </p>
                  <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                    {ticket.participantPhone && (
                      <p className="flex items-center gap-1 text-[11px] truncate">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>Celular: {ticket.participantPhone}</span>
                      </p>
                    )}
                    {ticket.participantEmail && (
                      <p className="flex items-center gap-1 text-[11px] truncate">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>Correo: {ticket.participantEmail}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Emisión y Talonario */}
                {ticket.sellerName && (
                  <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/70">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase mb-1">
                      <FileText className="w-3.5 h-3.5 text-primario" />
                      <span>Vendedor / Responsable</span>
                    </div>
                    <p className="font-bold text-slate-900 text-sm truncate">
                      {ticket.sellerName}
                    </p>
                  </div>
                )}

                {/* Sello de Seguridad y Registro Único */}
                <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200/70 sm:col-span-2">
                  <div className="flex items-center justify-between text-emerald-800 text-xs font-bold uppercase mb-1">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Registro Único Asegurado
                    </span>
                    <span className="text-[10px] text-emerald-700 font-mono">REG-{ticket.id.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Registrado de forma única e intransferible el <strong>{registeredDateStr}</strong>. Este boleto está protegido en la base de datos oficial.
                  </p>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setIsEditingRegistration(true)}
                      className="mt-2 text-[11px] font-bold text-primario hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Modificar datos registrados del titular (Admin)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* BOTONES DE ACCIÓN */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            {onResetSearch && (
              <button
                type="button"
                onClick={onResetSearch}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Verificar Otro Boleto</span>
              </button>
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {onPrintTicket && (
                <button
                  type="button"
                  onClick={() => onPrintTicket(ticket)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primario text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primario/90 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Boleto</span>
                </button>
              )}

              {isAdmin && onEditTicket && (
                <button
                  type="button"
                  onClick={() => onEditTicket(ticket)}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  title="Editar datos"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}

              {isAdmin && onDeleteTicket && (
                <button
                  type="button"
                  onClick={() => onDeleteTicket(ticket)}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  title="Eliminar boleto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* OPCIÓN COLAPSABLE: VER TALONARIO FÍSICO COMPLETO */}
          <div className="pt-2 text-center border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowFullPhysicalTicket(!showFullPhysicalTicket)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primario transition-colors cursor-pointer"
            >
              <span>{showFullPhysicalTicket ? 'Ocultar cupón físico recortable' : '¿Deseas ver el talón físico completo?'}</span>
              {showFullPhysicalTicket ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showFullPhysicalTicket && (
              <div className="mt-4 pt-4 border-t border-dashed border-slate-200 text-left">
                <SorteoTicketCard
                  ticket={ticket}
                  sorteo={sorteo}
                  onPrint={() => onPrintTicket?.(ticket)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
