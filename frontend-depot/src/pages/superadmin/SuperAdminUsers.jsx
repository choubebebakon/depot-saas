import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, MoreVertical, Shield, UserCheck, UserX, Trash2, Crown, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/axios';

const ROLE_LABELS = {
  ADMIN: 'Admin',
  GERANT: 'Gérant',
  CAISSIER: 'Caissier',
  COMMERCIAL: 'Commercial',
  MAGASINIER: 'Magasinier',
};

const ROLE_COLORS = {
  ADMIN: 'bg-red-500/10 text-red-400 border-red-500/30',
  GERANT: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  CAISSIER: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  COMMERCIAL: 'bg-green-500/10 text-green-400 border-green-500/30',
  MAGASINIER: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
};

const METIER_LABELS = {
  DEPOT_BOISSONS: 'Dépôt Boissons',
  SUPERMARCHE: 'Supermarché',
  BOUTIQUE: 'Boutique',
  PHARMACIE: 'Pharmacie',
  HOTEL: 'Hôtel',
  RESTAURANT: 'Restaurant',
  CLINIQUE: 'Clinique',
  ELEVAGE: 'Élevage',
  GARAGE_AUTOMOBILE: 'Garage',
  QUINCAILLERIE: 'Quincaillerie',
  IMMOBILIER: 'Immobilier',
  LIBRAIRIE: 'Librairie',
  TRANSPORT: 'Transport',
  BOULANGERIE: 'Boulangerie',
  PARFUMERIE: 'Parfumerie',
  SALON_BEAUTE: 'Salon Beauté',
  TELEPHONIE: 'Téléphonie',
  PRESSING: 'Pressing',
  CIMENT_BTP: 'Ciment BTP',
  GLACIER_SNACK: 'Glacier Snack',
};

export default function SuperAdminUsers() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    tenantId: '',
    role: '',
    isActive: '',
  });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showMenu, setShowMenu] = useState(null);

  const { data: usersData, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', filters, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.tenantId) params.append('tenantId', filters.tenantId);
      if (filters.role) params.append('role', filters.role);
      if (filters.isActive !== '') params.append('isActive', filters.isActive);
      params.append('limit', limit.toString());
      params.append('offset', (page * limit).toString());
      
      const res = await api.get(`/admin/users?${params.toString()}`);
      return res.data;
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (userId) => {
      const res = await api.post(`/admin/users/${userId}/toggle-active`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      setShowMenu(null);
    },
  });

  const toggleSuperAdminMutation = useMutation({
    mutationFn: async (userId) => {
      const res = await api.post(`/admin/users/${userId}/super-admin`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      setShowMenu(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      const res = await api.delete(`/admin/users/${userId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      setShowMenu(null);
    },
  });

  const filteredUsers = usersData?.users?.filter(user => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        user.email?.toLowerCase().includes(searchLower) ||
        user.nom?.toLowerCase().includes(searchLower) ||
        user.tenant?.name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || [];

  const totalPages = Math.ceil((usersData?.total || 0) / limit);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <Shield size={28} className="text-indigo-400" />
            <h1 className="text-2xl font-black text-white">Gestion des Utilisateurs</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">Administration globale des utilisateurs GesTock</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all border border-slate-600"
        >
          <RefreshCw size={18} />
          Actualiser
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            className="bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">Tous les rôles</option>
            {Object.entries(ROLE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={filters.isActive}
            onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
            className="bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">Tous les statuts</option>
            <option value="true">Actif</option>
            <option value="false">Inactif</option>
          </select>
          <button
            onClick={() => setFilters({ tenantId: '', role: '', isActive: '' })}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all border border-slate-600"
          >
            <Filter size={18} />
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-6 py-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Utilisateur</th>
                <th className="text-left px-6 py-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Tenant</th>
                <th className="text-left px-6 py-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Rôle</th>
                <th className="text-left px-6 py-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Statut</th>
                <th className="text-left px-6 py-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Métier</th>
                <th className="text-left px-6 py-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Dépôt</th>
                <th className="text-left px-6 py-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {user.nom?.[0] || user.email?.[0] || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-semibold truncate">{user.nom || 'N/A'}</p>
                          <p className="text-slate-400 text-xs truncate">{user.email}</p>
                        </div>
                        {user.isSuperAdmin && (
                          <Crown size={16} className="text-yellow-400 shrink-0" title="SuperAdmin" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white text-sm">{user.tenant?.name || 'N/A'}</div>
                      <div className="text-slate-400 text-xs">{user.tenant?.status || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${ROLE_COLORS[user.role] || 'bg-slate-500/10 text-slate-400 border-slate-500/30'}`}>
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                        <span className={`text-sm font-semibold ${user.isActive ? 'text-green-400' : 'text-red-400'}`}>
                          {user.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white text-sm">{METIER_LABELS[user.tenant?.metier] || user.tenant?.metier || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white text-sm">{user.depot?.nom || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button
                          onClick={() => setShowMenu(showMenu === user.id ? null : user.id)}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <MoreVertical size={18} className="text-slate-400" />
                        </button>
                        {showMenu === user.id && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-600 rounded-xl shadow-xl z-10">
                            <button
                              onClick={() => toggleActiveMutation.mutate(user.id)}
                              disabled={toggleActiveMutation.isLoading}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-white hover:bg-slate-700 transition-colors rounded-t-xl"
                            >
                              {user.isActive ? <UserX size={16} className="text-red-400" /> : <UserCheck size={16} className="text-green-400" />}
                              {user.isActive ? 'Désactiver' : 'Activer'}
                            </button>
                            <button
                              onClick={() => toggleSuperAdminMutation.mutate(user.id)}
                              disabled={toggleSuperAdminMutation.isLoading}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-white hover:bg-slate-700 transition-colors"
                            >
                              <Crown size={16} className="text-yellow-400" />
                              {user.isSuperAdmin ? 'Retirer SuperAdmin' : 'Rendre SuperAdmin'}
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Supprimer l'utilisateur ${user.email} ?`)) {
                                  deleteUserMutation.mutate(user.id);
                                }
                              }}
                              disabled={deleteUserMutation.isLoading}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors rounded-b-xl"
                            >
                              <Trash2 size={16} />
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/50">
            <p className="text-slate-400 text-sm">
              Affichage de {page * limit + 1} à {Math.min((page + 1) * limit, usersData?.total || 0)} sur {usersData?.total || 0} utilisateurs
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <ChevronLeft size={18} className="text-white" />
              </button>
              <span className="text-white text-sm font-semibold px-3">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <ChevronRight size={18} className="text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
