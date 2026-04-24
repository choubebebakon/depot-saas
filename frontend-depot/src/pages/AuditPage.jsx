import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useDepot } from '../contexts/DepotContext';

const ACTION_LABELS = {
  VENTE_ANNULEE: 'Annulation',
  REMISE_ACCORDEE: 'Remise',
  VALIDATION_STOCK_MAGASINIER: 'Validation magasinier',
};

function BadgeAction({ action }) {
  const palette = {
    VENTE_ANNULEE: 'bg-red-500/10 border-red-500/30 text-red-400',
    REMISE_ACCORDEE: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    VALIDATION_STOCK_MAGASINIER: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  };

  return (
    <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-black ${palette[action] || 'bg-slate-700 border-slate-600 text-slate-300'}`}>
      {ACTION_LABELS[action] || action}
    </span>
  );
}

export default function AuditPage() {
  const { tenantId } = useAuth();
  const { depotId } = useDepot();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    action: '',
    startDate: '',
    endDate: '',
  });

  const fetchJournal = useCallback(async (isSilent = false) => {
    if (!tenantId) return;
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    setError('');
    try {
      const params = { tenantId, depotId };
      if (filters.action) params.action = filters.action;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const res = await api.get('/audit/journal', { params });
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger le journal.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tenantId, depotId, filters]);

  useEffect(() => {
    fetchJournal();

    const interval = setInterval(() => {
      if (!filters.startDate && !filters.endDate) {
        fetchJournal(true);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchJournal, filters.startDate, filters.endDate]);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white">Journal d audit</h1>
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider transition-all ${refreshing ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${refreshing ? 'bg-indigo-400 animate-pulse' : 'bg-emerald-400'}`} />
              {refreshing ? 'Syncing...' : 'Live Sync'}
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-1">Vue Patron sur les annulations, remises et validations sensibles.</p>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 mb-6">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Filtres</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={filters.action}
            onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value }))}
            className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">Toutes les actions</option>
            <option value="VENTE_ANNULEE">Annulations</option>
            <option value="REMISE_ACCORDEE">Remises</option>
            <option value="VALIDATION_STOCK_MAGASINIER">Validations magasinier</option>
          </select>

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
            className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
          />

          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
            className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
          />

          <button
            onClick={() => setFilters({ action: '', startDate: '', endDate: '' })}
            className="rounded-xl border border-slate-600 bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-300 hover:border-slate-500 hover:text-white transition-all"
          >
            Reinitialiser
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            Aucun evenement d audit trouve.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-xs uppercase tracking-widest border-b border-slate-700">
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Acteur</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-700/30">
                  <td className="px-6 py-4"><BadgeAction action={row.action} /></td>
                  <td className="px-6 py-4 text-indigo-400 font-black text-sm">{row.reference || '-'}</td>
                  <td className="px-6 py-4 text-slate-300 text-sm">
                    <div>{row.description}</div>
                    {row.metadata?.motif && (
                      <div className="mt-1 text-xs text-slate-500">Motif: {row.metadata.motif}</div>
                    )}
                    {row.metadata?.remiseTotale > 0 && (
                      <div className="mt-1 text-xs text-amber-400">
                        Remise: {Number(row.metadata.remiseTotale).toLocaleString('fr-FR')} FCFA
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    <div>{row.actorEmail || 'Systeme'}</div>
                    <div className="text-xs text-slate-600 mt-1">{row.actorRole || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {new Date(row.createdAt).toLocaleString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
