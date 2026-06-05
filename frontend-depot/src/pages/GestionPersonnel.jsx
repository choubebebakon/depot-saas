import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, UserPlus, CheckCircle2, AlertTriangle,
  RefreshCw, Mail, Lock, ShieldCheck,
  MapPin, Calendar, Eye, EyeOff, MoreVertical,
  Building2, UserX, UserCheck, X,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useDepot } from '../contexts/DepotContext';
import { ROLES } from '../utils/rbac';

const ROLE_OPTIONS = [
  { value: 'GERANT', label: 'Gérant' },
  { value: 'CAISSIER', label: 'Caissier' },
  { value: 'MAGASINIER', label: 'Magasinier' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'COMPTABLE', label: 'Comptable' },
  { value: 'MANUTENTIONNAIRE', label: 'Manutentionnaire (Personnel sans accès application)' },
];

const ROLE_BADGE = {
  ADMIN: { label: 'Admin', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
  PATRON: { label: 'Patron', cls: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  GERANT: { label: 'Gérant', cls: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
  CAISSIER: { label: 'Caissier', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  MAGASINIER: { label: 'Magasinier', cls: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  COMMERCIAL: { label: 'Commercial', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  COMPTABLE: { label: 'Comptable', cls: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  MANUTENTIONNAIRE: { label: 'Manutentionnaire', cls: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
};

const ROLES_WITH_DEPOT = ['GERANT', 'CAISSIER', 'MAGASINIER', 'COMMERCIAL', 'MANUTENTIONNAIRE'];
const FORM_EMPTY = { nom: '', email: '', password: '', role: 'GERANT', depotId: '' };

function RoleBadge({ role }) {
  const badge = ROLE_BADGE[role] || { label: role, cls: 'bg-slate-500/15 text-slate-400 border-slate-500/30' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-widest border ${badge.cls}`}>
      {badge.label}
    </span>
  );
}

function FieldLabel({ children }) {
  return <label className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 block">{children}</label>;
}

function InputField({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />}
      <input
        className={`w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 text-white text-sm font-medium
          placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20
          transition-all ${Icon ? 'pl-10 pr-4' : 'px-4'}`}
        {...props}
      />
    </div>
  );
}

// ── Dropdown Menu Actions ────────────────────────────────────
function ActionsMenu({ emp, onTransfer, onToggleStatus, isOwn }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (isOwn) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="p-2 rounded-xl hover:bg-slate-700/50 text-slate-500 hover:text-slate-200 transition-all"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 w-52 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl py-1 overflow-hidden">
          <button
            onClick={() => { setOpen(false); onTransfer(emp); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <Building2 size={15} className="text-indigo-400" />
            Transférer d'établissement
          </button>
          <div className="border-t border-slate-700/50 my-1" />
          <button
            onClick={() => { setOpen(false); onToggleStatus(emp); }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
              emp.isActive
                ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                : 'text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300'
            }`}
          >
            {emp.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
            {emp.isActive ? 'Désactiver le compte' : 'Réactiver le compte'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Modal Transfert ──────────────────────────────────────────
function TransferModal({ emp, depots, onConfirm, onClose, loading }) {
  const [selectedDepotId, setSelectedDepotId] = useState(emp.depotId || '');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20} /></button>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center">
            <Building2 size={20} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="text-white font-black">Transfert d'établissement</h3>
            <p className="text-slate-500 text-xs">{emp.nom || emp.email}</p>
          </div>
        </div>
        <div className="mb-6">
          <FieldLabel>Nouveau Dépôt</FieldLabel>
          <select
            value={selectedDepotId}
            onChange={e => setSelectedDepotId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
          >
            <option value="">— Aucun dépôt spécifique —</option>
            {depots.map(d => (
              <option key={d.id} value={d.id}>{d.nom}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-700 transition-all">
            Annuler
          </button>
          <button
            onClick={() => onConfirm(selectedDepotId)}
            disabled={loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all"
          >
            {loading ? <RefreshCw size={16} className="animate-spin mx-auto" /> : '✅ Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Composant Principal ──────────────────────────────────────
export default function GestionPersonnel() {
  const { tenantId, role, user: currentUser } = useAuth();
  const { depotId: globalDepotId } = useDepot();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState(FORM_EMPTY);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [transferTarget, setTransferTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const successTimeoutRef = useRef(null);
  const errorTimeoutRef = useRef(null);

  const clearFlashTimeouts = () => {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearFlashTimeouts();
  }, []);

  const flash = useCallback((msg, isError = false) => {
    clearFlashTimeouts();
    if (isError) {
      setError(msg);
      errorTimeoutRef.current = setTimeout(() => setError(null), 5000);
    } else {
      setSuccess(msg);
      successTimeoutRef.current = setTimeout(() => setSuccess(null), 5000);
    }
  }, []);

  const { data: employes = [], isLoading: loadingEmployes } = useQuery({
    queryKey: ['employes', tenantId, globalDepotId],
    queryFn: async () => {
      const res = await api.get('/users', { params: { depotId: globalDepotId } });
      return res.data;
    },
    enabled: !!tenantId,
  });

  const { data: depots = [] } = useQuery({
    queryKey: ['depots', tenantId],
    queryFn: async () => {
      const res = await api.get('/depots', { params: { tenantId } });
      return res.data;
    },
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/users/employees', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['employes', tenantId, globalDepotId]);
      setFormData(FORM_EMPTY);
      flash('Employé créé avec succès !');
      setError(null);
    },
    onError: (err) => {
      const msg = err.response?.data?.message;
      flash(Array.isArray(msg) ? msg.join(' • ') : msg || 'Une erreur est survenue.', true);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    createMutation.mutate({
      nom: formData.nom.trim() || undefined,
      email: formData.email.trim(),
      password: formData.password,
      role: formData.role.toUpperCase(),
      depotId: formData.depotId || undefined,
    });
  };

  const handleTransfer = async (depotId) => {
    setActionLoading(true);
    try {
      await api.patch(`/users/${transferTarget.id}/transfer`, { depotId });
      queryClient.invalidateQueries(['employes', tenantId, globalDepotId]);
      flash(`${transferTarget.nom || transferTarget.email} transféré avec succès.`);
      
      // Si on s'est transféré soi-même, on met à jour le dépôt actif et on recharge
      if (transferTarget.id === currentUser?.id) {
        localStorage.setItem('depot_actif_id', depotId || 'all');
        window.location.reload();
      }

      setTransferTarget(null);
    } catch (err) {
      flash(err.response?.data?.message || 'Erreur lors du transfert.', true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (emp) => {
    if (emp.isActive) {
      const ok = window.confirm(`Êtes-vous sûr de vouloir suspendre l'accès de ${emp.nom || emp.email} ?\n\nL'employé sera automatiquement déconnecté.`);
      if (!ok) return;
    }
    setActionLoading(true);
    try {
      await api.patch(`/users/${emp.id}/status`, { isActive: !emp.isActive });
      queryClient.invalidateQueries(['employes', tenantId, globalDepotId]);
      flash(emp.isActive ? `Compte de ${emp.nom || emp.email} désactivé.` : `Compte de ${emp.nom || emp.email} réactivé.`);
    } catch (err) {
      flash(err.response?.data?.message || 'Erreur.', true);
    } finally {
      setActionLoading(false);
    }
  };

  const field = (key) => ({
    name: key,
    value: formData[key],
    onChange: (e) => setFormData((p) => ({ ...p, [key]: e.target.value })),
  });

  const showDepotSelect = ROLES_WITH_DEPOT.includes(formData.role);
  const isAdmin = role === ROLES.PATRON || role === 'GERANT';

  return (
    <div className="p-6 space-y-8 bg-slate-900 min-h-screen text-slate-200">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Users className="text-indigo-400" size={32} />
            Gestion du Personnel
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {loadingEmployes ? 'Chargement…' : `Total : ${employes.length} employé${employes.length > 1 ? 's' : ''} dans votre organisation`}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {Object.entries(employes.reduce((acc, e) => { acc[e.role] = (acc[e.role] || 0) + 1; return acc; }, {})).map(([r, count]) => (
            <div key={r} className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs font-bold ${ROLE_BADGE[r]?.cls || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
              <span>{ROLE_BADGE[r]?.label || r}</span>
              <span className="bg-white/10 px-1.5 py-0.5 rounded-full">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl flex items-center gap-3">
          <CheckCircle2 size={20} className="shrink-0" />
          <span className="font-bold">{success}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl flex items-center gap-3">
          <AlertTriangle size={20} className="shrink-0" />
          <span className="font-bold">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Formulaire de création */}
        {isAdmin && (
          <div className="xl:col-span-1">
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-700/50 flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center">
                  <UserPlus size={18} className="text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-white font-black text-sm">Nouvel Employé</h2>
                  <p className="text-slate-500 text-xs">Ajout sécurisé avec hash bcrypt</p>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <FieldLabel>Nom complet</FieldLabel>
                  <InputField id="personnel-nom" icon={Users} type="text" placeholder="ex : Jean Dupont" {...field('nom')} />
                </div>
                <div>
                  <FieldLabel>Email *</FieldLabel>
                  <InputField id="personnel-email" icon={Mail} type="email" placeholder="jean@depot.cm" required {...field('email')} />
                </div>
                <div>
                  <FieldLabel>Mot de passe *</FieldLabel>
                  <div className="relative">
                    <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      id="personnel-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 6 caractères"
                      required minLength={6}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-10 pr-12 text-white text-sm font-medium placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                      {...field('password')}
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <FieldLabel>Rôle *</FieldLabel>
                  <div className="relative">
                    <ShieldCheck size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <select id="personnel-role" required
                      className="w-full appearance-none bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-10 pr-4 text-white text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all cursor-pointer"
                      {...field('role')}>
                      {ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                  {formData.role === 'MANUTENTIONNAIRE' && (
                    <p className="mt-2 text-xs font-bold text-amber-300">Personnel sans accès application : aucun token de session ne sera délivré.</p>
                  )}
                </div>
                {showDepotSelect && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <FieldLabel>Dépôt assigné</FieldLabel>
                    <div className="relative">
                      <MapPin size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      <select id="personnel-depot"
                        className="w-full appearance-none bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-10 pr-4 text-white text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all cursor-pointer"
                        {...field('depotId')}>
                        <option value="">— Aucun dépôt spécifique —</option>
                        {depots.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
                      </select>
                    </div>
                  </div>
                )}
                <button id="personnel-submit" type="submit" disabled={createMutation.isPending}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 uppercase tracking-widest text-sm mt-2">
                  {createMutation.isPending ? <><RefreshCw size={18} className="animate-spin" /> Création…</> : <><UserPlus size={18} /> Créer l'Employé</>}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tableau des employés */}
        <div className={isAdmin ? 'xl:col-span-2' : 'xl:col-span-3'}>
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-700/50 border border-slate-600/30 rounded-xl flex items-center justify-center">
                  <Users size={18} className="text-slate-400" />
                </div>
                <div>
                  <h2 className="text-white font-black text-sm">Liste du Personnel</h2>
                  <p className="text-slate-500 text-xs">Tous les membres de votre organisation</p>
                </div>
              </div>
              {(loadingEmployes || actionLoading) && <RefreshCw size={16} className="text-indigo-400 animate-spin" />}
            </div>
            <div className="overflow-x-auto">
              {loadingEmployes ? (
                <div className="p-8 space-y-3">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-14 bg-slate-800/50 rounded-2xl animate-pulse" />)}
                </div>
              ) : employes.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users size={28} className="text-slate-600" />
                  </div>
                  <p className="text-slate-500 font-bold">Aucun employé trouvé</p>
                  <p className="text-slate-600 text-sm mt-1">Utilisez le formulaire pour ajouter votre premier membre</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Membre</th>
                      <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Email</th>
                      <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Rôle</th>
                      <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Dépôt</th>
                      <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Depuis</th>
                      {isAdmin && <th className="text-right px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {employes.map(emp => {
                      const depot = depots.find(d => d.id === emp.depotId);
                      const initials = (emp.nom || emp.email || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                      const dateStr = emp.createdAt ? new Date(emp.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                      const isOwn = emp.email === currentUser?.email;
                      const inactive = emp.isActive === false;

                      return (
                        <tr key={emp.id} className={`hover:bg-slate-800/30 transition-colors group ${inactive ? 'opacity-60' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${inactive ? 'bg-slate-700/30 border border-slate-600/20 text-slate-500' : 'bg-indigo-600/20 border border-indigo-500/20 text-indigo-400'}`}>
                                {initials}
                              </div>
                              <div>
                                <span className="text-white font-bold text-sm truncate max-w-[120px] block">
                                  {emp.nom || <span className="text-slate-500 italic">Sans nom</span>}
                                </span>
                                {inactive && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-md mt-0.5">
                                    <UserX size={9} /> Inactif
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                              <Mail size={13} className="text-slate-600 shrink-0" />
                              <span className="truncate max-w-[200px]">{emp.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4"><RoleBadge role={emp.role} /></td>
                          <td className="px-6 py-4">
                            {depot ? (
                              <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                                <MapPin size={13} className="text-slate-600 shrink-0" />
                                <span>{depot.nom}</span>
                              </div>
                            ) : (
                              <span className="text-slate-600 text-sm">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                              <Calendar size={12} className="shrink-0" />
                              {dateStr}
                            </div>
                          </td>
                          {isAdmin && (
                            <td className="px-6 py-4 text-right">
                              <ActionsMenu
                                emp={emp}
                                onTransfer={setTransferTarget}
                                onToggleStatus={handleToggleStatus}
                                isOwn={isOwn}
                              />
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Transfert */}
      {transferTarget && (
        <TransferModal
          emp={transferTarget}
          depots={depots}
          onConfirm={handleTransfer}
          onClose={() => setTransferTarget(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
