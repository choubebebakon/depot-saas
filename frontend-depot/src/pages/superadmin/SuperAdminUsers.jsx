import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSuperAdminRealtime } from '../../shared/realtime/useSuperAdminRealtime';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, MoreVertical, Shield, UserCheck, UserX, Trash2, Crown, RefreshCw, ChevronLeft, ChevronRight, KeyRound } from 'lucide-react';
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
  DEPOT_BOISSONS: 'Dépôt Boissons', SUPERMARCHE: 'Supermarché', BOUTIQUE: 'Boutique', PHARMACIE: 'Pharmacie', HOTEL: 'Hôtel', RESTAURANT: 'Restaurant', CLINIQUE: 'Clinique', ELEVAGE: 'Élevage', GARAGE_AUTOMOBILE: 'Garage', QUINCAILLERIE: 'Quincaillerie', IMMOBILIER: 'Immobilier', LIBRAIRIE: 'Librairie', TRANSPORT: 'Transport', BOULANGERIE: 'Boulangerie', PARFUMERIE: 'Parfumerie', SALON_BEAUTE: 'Salon Beauté', TELEPHONIE: 'Téléphonie', PRESSING: 'Pressing', CIMENT_BTP: 'Ciment BTP', GLACIER_SNACK: 'Glacier Snack',
};

const getErrorMessage = (error, fallback) => error?.response?.data?.message || fallback;
const askReason = (action, email) => {
  const reason = window.prompt(`Motif de sécurité — ${action} (${email})`, 'Action administrative justifiée');
  if (reason === null) return null;
  const normalized = reason.trim();
  return normalized.length >= 5 ? normalized : null;
};

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

  const runAction = (user, action, callback) => {
    setActionError('');
    const reason = askReason(action, user.email);
    if (!reason) {
      setActionError('Action annulée : un motif d’au moins 5 caractères est requis.');
      return;
    }
    callback(reason);
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
                  <button disabled={busy} onClick={() => { if (!window.confirm(`Voulez-vous vraiment ${item.isActive ? 'désactiver' : 'activer'} ${item.email} ?`)) return; runAction(item, item.isActive ? 'désactivation' : 'activation', (reason) => toggleActiveMutation.mutate({ userId: item.id, reason })); }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-white hover:bg-slate-700 disabled:opacity-50 rounded-t-xl">{item.isActive ? <UserX size={16} className="text-red-400" /> : <UserCheck size={16} className="text-green-400" />}{item.isActive ? 'Désactiver' : 'Activer'}</button>
                  <button disabled={busy} onClick={() => { const nextRole = window.prompt(`Nouveau rôle pour ${item.email}: ${Object.keys(ROLE_LABELS).join(', ')}`, item.role); if (!nextRole || !Object.prototype.hasOwnProperty.call(ROLE_LABELS, nextRole.trim().toUpperCase())) { if (nextRole !== null) setActionError('Rôle invalide.'); return; } const role = nextRole.trim().toUpperCase(); if (role === item.role) return setActionError('Cet utilisateur possède déjà ce rôle.'); if (!window.confirm(`Confirmer le rôle ${ROLE_LABELS[role]} pour ${item.email} ?`)) return; runAction(item, 'changement de rôle', (reason) => roleMutation.mutate({ userId: item.id, role, reason })); }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-white hover:bg-slate-700 disabled:opacity-50"><KeyRound size={16} className="text-indigo-400" /> Modifier le rôle</button>
                  <button disabled={busy} onClick={() => { if (!window.confirm(`Confirmer le ${item.isSuperAdmin ? 'retrait' : 'passage'} SuperAdmin de ${item.email} ?`)) return; runAction(item, item.isSuperAdmin ? 'retrait SuperAdmin' : 'attribution SuperAdmin', (reason) => superAdminMutation.mutate({ userId: item.id, reason })); }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-white hover:bg-slate-700 disabled:opacity-50"><Crown size={16} className="text-yellow-400" />{item.isSuperAdmin ? 'Retirer SuperAdmin' : 'Rendre SuperAdmin'}</button>
                  <button disabled={busy} onClick={() => { if (!window.confirm(`ATTENTION : supprimer définitivement ${item.email} ? Cette opération est irréversible.`)) return; runAction(item, 'suppression définitive', (reason) => deleteMutation.mutate({ userId: item.id, reason })); }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50 rounded-b-xl"><Trash2 size={16} />Supprimer définitivement</button>
                </div>}
              </div></td>
            </tr>
          ))}
        </tbody></table></div>
        {totalPages > 1 && <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/50"><p className="text-slate-400 text-sm">Affichage de {page * limit + 1} à {Math.min((page + 1) * limit, usersData?.total || 0)} sur {usersData?.total || 0} utilisateurs</p><div className="flex items-center gap-2"><button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || isFetching} className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg"><ChevronLeft size={18} className="text-white" /></button><span className="text-white text-sm font-semibold px-3">{page + 1} / {totalPages}</span><button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1 || isFetching} className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg"><ChevronRight size={18} className="text-white" /></button></div></div>}
      </div>
    </div>
  );
}
