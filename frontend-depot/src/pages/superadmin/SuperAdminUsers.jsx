import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSuperAdminRealtime } from '../../shared/realtime/useSuperAdminRealtime';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, MoreVertical, Shield, UserCheck, UserX, Trash2, Crown, RefreshCw, ChevronLeft, ChevronRight, KeyRound, Loader2 } from 'lucide-react';
import api from '../../api/axios';

const ROLE_LABELS = {
  ADMIN: 'Admin',
  GERANT: 'Gérant',
  CAISSIER: 'Caissier',
  COMMERCIAL: 'Commercial',
  MAGASINIER: 'Magasinier',
  PATRON: 'Patron',
};

const ROLE_COLORS = {
  ADMIN: 'bg-red-500/10 text-red-400 border-red-500/30',
  GERANT: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  CAISSIER: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  COMMERCIAL: 'bg-green-500/10 text-green-400 border-green-500/30',
  MAGASINIER: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  PATRON: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
};

const METIER_LABELS = {
  DEPOT_BOISSONS: 'Dépôt Boissons', SUPERMARCHE: 'Supermarché', BOUTIQUE: 'Boutique', PHARMACIE: 'Pharmacie', HOTEL: 'Hôtel', RESTAURANT: 'Restaurant', CLINIQUE: 'Clinique', ELEVAGE: 'Élevage', GARAGE_AUTOMOBILE: 'Garage', IMMOBILIER: 'Immobilier', TRANSPORT: 'Transport', BOULANGERIE: 'Boulangerie', PRESSING: 'Pressing', CIMENT_BTP: 'Ciment BTP',
};

const getErrorMessage = (error, fallback) => error?.response?.data?.message || fallback;

export default function SuperAdminUsers() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  useSuperAdminRealtime({ token: user?.isSuperAdmin ? localStorage.getItem('depot_token') : null, queryClient, enabled: !!user?.isSuperAdmin });
  const [filters, setFilters] = useState({ tenantId: '', role: '', isActive: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [showMenu, setShowMenu] = useState(null);
  const [actionError, setActionError] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [reason, setReason] = useState('');
  const [nextRole, setNextRole] = useState('');
  const [modalError, setModalError] = useState('');

  const { data: usersData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-users', filters, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.tenantId) params.append('tenantId', filters.tenantId);
      if (filters.role) params.append('role', filters.role);
      if (filters.isActive !== '') params.append('isActive', filters.isActive);
      params.append('limit', String(limit));
      params.append('offset', String(page * limit));
      const res = await api.get(`/admin/users?${params.toString()}`);
      return res.data;
    },
    staleTime: 15000,
    retry: 2,
  });

  const mutationOptions = (request, fallback) => ({
    mutationFn: request,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowMenu(null);
      setActionError('');
    },
    onError: (error) => setActionError(getErrorMessage(error, fallback)),
  });

  const toggleActiveMutation = useMutation(mutationOptions(async ({ userId, reason }) => {
    const res = await api.post(`/admin/users/${userId}/toggle-active`, { reason });
    return res.data;
  }, 'Impossible de modifier le statut de cet utilisateur.'));

  const roleMutation = useMutation(mutationOptions(async ({ userId, role, reason }) => {
    const res = await api.post(`/admin/users/${userId}/role`, { role, reason });
    return res.data;
  }, 'Impossible de modifier le rôle de cet utilisateur.'));

  const superAdminMutation = useMutation(mutationOptions(async ({ userId, reason }) => {
    const res = await api.post(`/admin/users/${userId}/super-admin`, { reason });
    return res.data;
  }, 'Impossible de modifier le statut SuperAdmin.'));

  const deleteMutation = useMutation(mutationOptions(async ({ userId, reason }) => {
    const res = await api.delete(`/admin/users/${userId}`, { params: { reason } });
    return res.data;
  }, 'Impossible de supprimer cet utilisateur.'));

  const openAction = (type, item) => {
    setShowMenu(null);
    setActionError('');
    setModalError('');
    setReason('');
    setNextRole(type === 'role' ? item.role : '');
    setPendingAction({ type, user: item });
  };

  const closeActionModal = () => {
    setPendingAction(null);
    setReason('');
    setNextRole('');
    setModalError('');
  };

  const confirmPendingAction = () => {
    const item = pendingAction.user;
    const normalized = reason.trim();
    if (normalized.length < 5) {
      setModalError('Un motif d’au moins 5 caractères est requis (exigé pour la piste d’audit).');
      return;
    }
    if (pendingAction.type === 'role') {
      if (!nextRole) { setModalError('Sélectionnez le nouveau rôle.'); return; }
      if (nextRole === item.role) { setModalError('Cet utilisateur possède déjà ce rôle.'); return; }
    }
    const onDone = () => closeActionModal();
    switch (pendingAction.type) {
      case 'toggle-active': toggleActiveMutation.mutate({ userId: item.id, reason: normalized }, { onSuccess: onDone }); break;
      case 'role': roleMutation.mutate({ userId: item.id, role: nextRole, reason: normalized }, { onSuccess: onDone }); break;
      case 'super-admin': superAdminMutation.mutate({ userId: item.id, reason: normalized }, { onSuccess: onDone }); break;
      case 'delete': deleteMutation.mutate({ userId: item.id, reason: normalized }, { onSuccess: onDone }); break;
      default: break;
    }
  };

  const filteredUsers = usersData?.users?.filter((item) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return item.email?.toLowerCase().includes(q) || item.nom?.toLowerCase().includes(q) || item.tenant?.name?.toLowerCase().includes(q);
  }) || [];

  const totalPages = Math.ceil((usersData?.total || 0) / limit);
  const busy = toggleActiveMutation.isPending || roleMutation.isPending || superAdminMutation.isPending || deleteMutation.isPending;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3"><Shield size={28} className="text-indigo-400" /><h1 className="text-2xl font-black text-white">Gestion des Utilisateurs</h1></div>
          <p className="text-slate-400 text-sm mt-1">Administration globale des utilisateurs GesTock</p>
        </div>
        <button onClick={() => refetch()} disabled={isFetching} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl transition-all border border-slate-600">
          <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} /> {isFetching ? 'Actualisation...' : 'Actualiser'}
        </button>
      </div>

      {actionError && <div role="alert" className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{actionError}</div>}

      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500" /></div>
          <select value={filters.role} onChange={(e) => { setPage(0); setFilters({ ...filters, role: e.target.value }); }} className="bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"><option value="">Tous les rôles</option>{Object.entries(ROLE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
          <select value={filters.isActive} onChange={(e) => { setPage(0); setFilters({ ...filters, isActive: e.target.value }); }} className="bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"><option value="">Tous les statuts</option><option value="true">Actif</option><option value="false">Inactif</option></select>
          <button onClick={() => { setPage(0); setFilters({ tenantId: '', role: '', isActive: '' }); setSearch(''); }} className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all border border-slate-600"><Filter size={18} /> Réinitialiser</button>
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-slate-700/50">
          {['Utilisateur', 'Tenant', 'Rôle', 'Statut', 'Métier', 'Dépôt', 'Actions'].map((h) => <th key={h} className="text-left px-6 py-4 text-slate-400 text-xs font-bold uppercase tracking-wider">{h}</th>)}
        </tr></thead><tbody>
          {isLoading ? <tr><td colSpan={7} className="px-6 py-12 text-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr> : filteredUsers.length === 0 ? <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">Aucun utilisateur trouvé</td></tr> : filteredUsers.map((item) => (
            <tr key={item.id} className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors">
              <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">{item.nom?.[0] || item.email?.[0] || '?'}</div><div className="min-w-0"><p className="text-white font-semibold truncate">{item.nom || 'N/A'}</p><p className="text-slate-400 text-xs truncate">{item.email}</p></div>{item.isSuperAdmin && <Crown size={16} className="text-yellow-400 shrink-0" title="SuperAdmin" />}</div></td>
              <td className="px-6 py-4"><div className="text-white text-sm">{item.tenant?.name || 'N/A'}</div><div className="text-slate-400 text-xs">{item.tenant?.status || 'N/A'}</div></td>
              <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold border ${ROLE_COLORS[item.role] || 'bg-slate-500/10 text-slate-400 border-slate-500/30'}`}>{ROLE_LABELS[item.role] || item.role}</span></td>
              <td className="px-6 py-4"><div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${item.isActive ? 'bg-green-400' : 'bg-red-400'}`} /><span className={`text-sm font-semibold ${item.isActive ? 'text-green-400' : 'text-red-400'}`}>{item.isActive ? 'Actif' : 'Inactif'}</span></div></td>
              <td className="px-6 py-4"><span className="text-white text-sm">{METIER_LABELS[item.tenant?.metier] || item.tenant?.metier || 'N/A'}</span></td>
              <td className="px-6 py-4"><span className="text-white text-sm">{item.depot?.nom || 'N/A'}</span></td>
              <td className="px-6 py-4"><div className="relative"><button onClick={() => { setActionError(''); setShowMenu(showMenu === item.id ? null : item.id); }} disabled={busy} className="p-2 hover:bg-slate-700 disabled:opacity-50 rounded-lg transition-colors"><MoreVertical size={18} className="text-slate-400" /></button>
                {showMenu === item.id && <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-600 rounded-xl shadow-xl z-20">
                  <button disabled={busy} onClick={() => openAction('toggle-active', item)} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-white hover:bg-slate-700 disabled:opacity-50 rounded-t-xl">{item.isActive ? <UserX size={16} className="text-red-400" /> : <UserCheck size={16} className="text-green-400" />}{item.isActive ? 'Désactiver' : 'Activer'}</button>
                  <button disabled={busy} onClick={() => openAction('role', item)} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-white hover:bg-slate-700 disabled:opacity-50"><KeyRound size={16} className="text-indigo-400" /> Modifier le rôle</button>
                  <button disabled={busy} onClick={() => openAction('super-admin', item)} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-white hover:bg-slate-700 disabled:opacity-50"><Crown size={16} className="text-yellow-400" />{item.isSuperAdmin ? 'Retirer SuperAdmin' : 'Rendre SuperAdmin'}</button>
                  <button disabled={busy} onClick={() => openAction('delete', item)} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50 rounded-b-xl"><Trash2 size={16} />Supprimer définitivement</button>
                </div>}
              </div></td>
            </tr>
          ))}
        </tbody></table></div>
        {totalPages > 1 && <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/50"><p className="text-slate-400 text-sm">Affichage de {page * limit + 1} à {Math.min((page + 1) * limit, usersData?.total || 0)} sur {usersData?.total || 0} utilisateurs</p><div className="flex items-center gap-2"><button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || isFetching} className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg"><ChevronLeft size={18} className="text-white" /></button><span className="text-white text-sm font-semibold px-3">{page + 1} / {totalPages}</span><button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1 || isFetching} className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg"><ChevronRight size={18} className="text-white" /></button></div></div>}
      </div>

      {pendingAction && (() => {
        const item = pendingAction.user;
        const isDanger = pendingAction.type === 'delete' || (pendingAction.type === 'toggle-active' && item.isActive);
        const modalContent = {
          'toggle-active': { title: item.isActive ? 'Désactiver cet utilisateur' : 'Activer cet utilisateur', desc: `Vous êtes sur le point de ${item.isActive ? 'désactiver' : 'réactiver'} le compte ${item.email}. ${item.isActive ? 'Il ne pourra plus se connecter immédiatement.' : 'Il retrouvera l’accès à son espace.'}` },
          'role': { title: 'Modifier le rôle', desc: `Changement de rôle pour ${item.email} (rôle actuel : ${ROLE_LABELS[item.role] || item.role}).` },
          'super-admin': { title: item.isSuperAdmin ? 'Retirer le statut SuperAdmin' : 'Accorder le statut SuperAdmin', desc: `${item.isSuperAdmin ? 'Retrait' : 'Attribution'} du statut SuperAdmin pour ${item.email}. Ce statut donne un accès administrateur à toute la plateforme.` },
          'delete': { title: 'Supprimer définitivement', desc: `ATTENTION : la suppression de ${item.email} est irréversible. Toutes les données associées à ce compte seront perdues.` },
        }[pendingAction.type] || { title: 'Action', desc: '' };
        return (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { if (!busy) closeActionModal(); }} />
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-600 rounded-2xl shadow-2xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDanger ? 'bg-red-500/10' : 'bg-indigo-500/10'}`}>
                  {pendingAction.type === 'delete' ? <Trash2 size={20} className="text-red-400" /> : pendingAction.type === 'role' ? <KeyRound size={20} className="text-indigo-400" /> : pendingAction.type === 'super-admin' ? <Crown size={20} className="text-yellow-400" /> : item.isActive ? <UserX size={20} className="text-red-400" /> : <UserCheck size={20} className="text-green-400" />}
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-bold text-lg">{modalContent.title}</h3>
                  <p className="text-slate-400 text-sm mt-1">{modalContent.desc}</p>
                </div>
              </div>

              {pendingAction.type === 'role' && (
                <div className="mb-4">
                  <label htmlFor="next-role" className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Nouveau rôle</label>
                  <select id="next-role" value={nextRole} onChange={(e) => { setNextRole(e.target.value); setModalError(''); }} className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500">
                    {Object.entries(ROLE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                </div>
              )}

              <div className="mb-4">
                <label htmlFor="action-reason" className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Motif de sécurité <span className="text-red-400">*</span></label>
                <textarea id="action-reason" rows={3} value={reason} onChange={(e) => { setReason(e.target.value); setModalError(''); }} placeholder="Ex. : demande du gérant, compte partagé détecté, fin de contrat…" className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none" />
                <p className="text-slate-500 text-xs mt-1">Ce motif est enregistré dans la piste d’audit (minimum 5 caractères).</p>
              </div>

              {(modalError || actionError) && <div role="alert" className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{modalError || actionError}</div>}

              <div className="flex items-center justify-end gap-3">
                <button onClick={closeActionModal} disabled={busy} className="px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-xl border border-slate-600 transition-colors">Annuler</button>
                <button onClick={confirmPendingAction} disabled={busy} className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-colors disabled:opacity-50 ${isDanger ? 'bg-red-600 hover:bg-red-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}>
                  {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                  {busy ? 'Traitement...' : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
