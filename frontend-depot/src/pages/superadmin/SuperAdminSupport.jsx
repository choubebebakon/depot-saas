import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Clock, CheckCircle, AlertCircle, Building2, User, Filter, RefreshCw, Search } from 'lucide-react';
import api from '../../api/axios';

const STATUS_STYLES = {
  OUVERT: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: <CheckCircle size={14} /> },
  EN_COURS: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: <Clock size={14} /> },
  TRAITE: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400', icon: <CheckCircle size={14} /> },
};

const TYPE_STYLES = {
  BUG: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: <AlertCircle size={14} /> },
  SUGGESTION: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', icon: <MessageSquare size={14} /> },
  MESSAGE: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: <MessageSquare size={14} /> },
};

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.OUVERT;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-black ${style.bg} ${style.border} ${style.text}`}>
      {style.icon}
      {(status || 'OUVERT').replace('_', ' ')}
    </span>
  );
}

function TypeBadge({ type }) {
  const style = TYPE_STYLES[type] || TYPE_STYLES.MESSAGE;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-black ${style.bg} ${style.border} ${style.text}`}>
      {style.icon}
      {type || 'MESSAGE'}
    </span>
  );
}

export default function SuperAdminSupport() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: '',
  });

  const { data: tickets = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-support-messages', filters],
    queryFn: async () => {
      const res = await api.get('/support/admin/messages');
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ ticketId, newStatus }) => {
      const res = await api.patch(`/support/admin/messages/${ticketId}/statut`, { statut: newStatus });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-support-messages']);
    },
  });

  const handleStatusChange = (ticketId, newStatus) => {
    updateStatusMutation.mutate({ ticketId, newStatus });
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (filters.status && ticket.statut !== filters.status) return false;
    if (filters.type && ticket.type !== filters.type) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        ticket.message?.toLowerCase().includes(searchLower) ||
        ticket.user?.email?.toLowerCase().includes(searchLower) ||
        ticket.tenant?.name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <MessageSquare size={28} className="text-indigo-400" />
            <h1 className="text-2xl font-black text-white">Support Global</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">Gestion des messages de support de toute la plateforme</p>
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
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5 mb-6 shadow-xl shadow-black/20">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-indigo-400" />
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Filtres</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full bg-slate-800/50 border border-slate-600 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            className="w-full bg-slate-800/50 border border-slate-600 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          >
            <option value="">Tous les statuts</option>
            <option value="OUVERT">Ouvert</option>
            <option value="EN_COURS">En cours</option>
            <option value="TRAITE">Traité</option>
          </select>

          <select
            value={filters.type}
            onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
            className="w-full bg-slate-800/50 border border-slate-600 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          >
            <option value="">Tous les types</option>
            <option value="BUG">Bug</option>
            <option value="SUGGESTION">Suggestion</option>
            <option value="MESSAGE">Message</option>
          </select>

          <button
            onClick={() => setFilters({ status: '', type: '', search: '' })}
            className="rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-2.5 text-sm font-bold text-slate-300 hover:border-slate-500 hover:text-white hover:bg-slate-700/50 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} />
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <MessageSquare size={48} className="mx-auto mb-4 text-slate-600" />
            <p>Aucun message trouvé.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="p-6 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <StatusBadge status={ticket.statut} />
                      <TypeBadge type={ticket.type} />
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                        {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-1">{ticket.message}</h3>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                      <div className="flex items-center gap-1">
                        <Building2 size={14} />
                        <span className="font-bold">{ticket.tenant?.name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User size={14} />
                        <span>{ticket.user?.email || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <select
                      value={ticket.statut}
                      onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                      className="bg-slate-800/50 border border-slate-600 text-white rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-indigo-500 transition-all"
                    >
                      <option value="OUVERT">Ouvert</option>
                      <option value="EN_COURS">En cours</option>
                      <option value="TRAITE">Traité</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
