import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, AlertCircle, Ban, CheckCircle, Download, FileText, RefreshCw, Search, ShieldCheck, XCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useDepot } from '../contexts/DepotContext';

const ACTION_LABELS = {
  VENTE_ANNULEE: 'Annulation de vente',
  REMISE_ACCORDEE: 'Remise accordée',
  VALIDATION_STOCK_MAGASINIER: 'Validation stock',
};

function BadgeAction({ action }) {
  const palette = {
    VENTE_ANNULEE: 'bg-red-500/10 border-red-500/30 text-red-400',
    REMISE_ACCORDEE: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    VALIDATION_STOCK_MAGASINIER: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-black ${palette[action] || 'bg-slate-700 border-slate-600 text-slate-300'}`}><Activity size={14} />{ACTION_LABELS[action] || action || 'Événement'}</span>;
}

function BadgeSeverite({ severite }) {
  const palette = { CRITIQUE: 'bg-red-500/10 border-red-500/30 text-red-400', ATTENTION: 'bg-amber-500/10 border-amber-500/30 text-amber-400', INFO: 'bg-sky-500/10 border-sky-500/30 text-sky-400' };
  const Icon = severite === 'CRITIQUE' ? Ban : severite === 'ATTENTION' ? AlertCircle : CheckCircle;
  return <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-black ${palette[severite] || palette.INFO}`}><Icon size={14} />{severite || 'INFO'}</span>;
}

const EMPTY_FILTERS = { action: '', severite: '', resultat: '', metier: '', search: '', startDate: '', endDate: '', montantMin: '', montantMax: '' };

export default function AuditPage() {
  const { tenantId } = useAuth();
  const { depotId } = useDepot();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [exporting, setExporting] = useState('');

  const queryParams = useMemo(() => {
    const params = {};
    if (depotId) params.depotId = depotId;
    Object.entries(filters).forEach(([key, value]) => { if (value !== '') params[key] = value; });
    params.limit = '500';
    return params;
  }, [depotId, filters]);

  const { data: rows = [], isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['audit-journal', tenantId, depotId, queryParams],
    queryFn: async () => {
      if (!tenantId) return [];
      const res = await api.get('/audit/journal', { params: queryParams });
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!tenantId,
    refetchInterval: 10000,
    refetchIntervalInBackground: false,
    staleTime: 5000,
  });

  useEffect(() => {
    const onVisibility = () => { if (document.visibilityState === 'visible') refetch(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [refetch]);

  const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const downloadExport = async (format) => {
    setExporting(format);
    try {
      const res = await api.get(`/audit/export/${format}`, { params: queryParams, responseType: 'blob' });
      const blob = new Blob([res.data], { type: res.headers?.['content-type'] || (format === 'pdf' ? 'application/pdf' : 'text/csv;charset=utf-8') });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `journal-audit-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error(`[Audit] Export ${format} impossible`, err);
    } finally { setExporting(''); }
  };

  return <div className="space-y-6">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <div className="flex flex-wrap items-center gap-3"><Activity size={28} className="text-indigo-400" /><h1 className="text-2xl font-black text-white">Journal d’Audit</h1><span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-400"><ShieldCheck size={13} />Patron sécurisé</span>{isFetching && <RefreshCw size={14} className="animate-spin text-indigo-400" />}</div>
        <p className="text-slate-400 text-sm mt-1">Traçabilité des opérations sensibles du tenant et du dépôt actif.</p>
      </div>
      <div className="flex gap-2"><button onClick={() => downloadExport('csv')} disabled={!!exporting} className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-slate-700 disabled:opacity-50"><Download size={15} />{exporting === 'csv' ? 'Export…' : 'CSV'}</button><button onClick={() => downloadExport('pdf')} disabled={!!exporting} className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-slate-700 disabled:opacity-50"><FileText size={15} />{exporting === 'pdf' ? 'Export…' : 'PDF'}</button></div>
    </div>

    <section className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5 shadow-xl shadow-black/20">
      <div className="flex items-center justify-between mb-4"><p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Recherche et filtres</p><button onClick={() => setFilters(EMPTY_FILTERS)} className="text-xs font-bold text-slate-400 hover:text-white">Réinitialiser</button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="relative lg:col-span-2"><Search size={16} className="absolute left-3 top-3 text-slate-500" /><input value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} placeholder="Recherche : acteur, référence, description…" maxLength={120} className="w-full bg-slate-800/50 border border-slate-600 text-white rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500" /></label>
        <select value={filters.action} onChange={(e) => updateFilter('action', e.target.value)} className="bg-slate-800/50 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm"><option value="">Toutes les actions</option>{Object.entries(ACTION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <select value={filters.severite} onChange={(e) => updateFilter('severite', e.target.value)} className="bg-slate-800/50 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm"><option value="">Toutes les sévérités</option><option value="CRITIQUE">Critique</option><option value="ATTENTION">Attention</option><option value="INFO">Info</option></select>
        <select value={filters.resultat} onChange={(e) => updateFilter('resultat', e.target.value)} className="bg-slate-800/50 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm"><option value="">Tous les résultats</option><option value="SUCCES">Succès</option><option value="ECHEC">Échec</option></select>
        <input value={filters.metier} onChange={(e) => updateFilter('metier', e.target.value)} placeholder="Métier" maxLength={80} className="bg-slate-800/50 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm" />
        <input type="date" value={filters.startDate} onChange={(e) => updateFilter('startDate', e.target.value)} className="bg-slate-800/50 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm" />
        <input type="date" value={filters.endDate} onChange={(e) => updateFilter('endDate', e.target.value)} className="bg-slate-800/50 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm" />
        <input type="number" min="0" step="0.01" value={filters.montantMin} onChange={(e) => updateFilter('montantMin', e.target.value)} placeholder="Montant min" className="bg-slate-800/50 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm" />
        <input type="number" min="0" step="0.01" value={filters.montantMax} onChange={(e) => updateFilter('montantMax', e.target.value)} placeholder="Montant max" className="bg-slate-800/50 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm" />
      </div>
    </section>

    {error && <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"><XCircle size={18} className="mt-0.5 shrink-0" /><span>{error.response?.data?.message || error.message || 'Impossible de charger le journal.'}</span></div>}

    <section className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50"><span className="text-sm font-bold text-slate-300">{rows.length} événement(s) affiché(s)</span><button onClick={() => refetch()} disabled={isFetching} className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white disabled:opacity-50"><RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />Actualiser</button></div>
      {isLoading ? <div className="flex items-center justify-center h-48"><RefreshCw size={28} className="animate-spin text-indigo-400" /></div> : rows.length === 0 ? <div className="py-16 text-center text-slate-500"><Activity size={48} className="mx-auto mb-4 text-slate-600" /><p>Aucun événement d’audit trouvé.</p></div> : <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="text-slate-500 text-xs uppercase tracking-widest border-b border-slate-700/50 bg-slate-800/30"><th className="px-6 py-4">Action</th><th className="px-6 py-4">Sévérité</th><th className="px-6 py-4">Résultat</th><th className="px-6 py-4">Référence</th><th className="px-6 py-4">Description</th><th className="px-6 py-4">Acteur</th><th className="px-6 py-4">Date</th></tr></thead><tbody className="divide-y divide-slate-700/50">{rows.map((row) => <tr key={row.id} className="hover:bg-slate-800/50 transition-colors"><td className="px-6 py-4"><BadgeAction action={row.action} /></td><td className="px-6 py-4"><BadgeSeverite severite={row.severite} /></td><td className="px-6 py-4 text-xs font-bold text-slate-400">{row.resultat || '—'}</td><td className="px-6 py-4 text-indigo-400 font-black text-sm">{row.reference || '—'}</td><td className="px-6 py-4 text-slate-300 text-sm min-w-[320px]"><div>{row.description}</div>{row.metadata?.motif && <div className="mt-1 text-xs text-slate-500">Motif : {row.metadata.motif}</div>}{Number(row.montant) > 0 && <div className="mt-1 text-xs text-slate-500">Montant : {Number(row.montant).toLocaleString('fr-FR')} FCFA</div>}</td><td className="px-6 py-4 text-sm text-slate-400"><div>{row.actorEmail || 'Système'}</div><div className="text-xs text-slate-600 mt-1">{row.actorRole || '—'}</div></td><td className="px-6 py-4 text-sm text-slate-400 whitespace-nowrap">{new Date(row.createdAt).toLocaleString('fr-FR')}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
