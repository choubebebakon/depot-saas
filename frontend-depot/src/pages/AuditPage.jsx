import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, AlertCircle, Ban, CheckCircle, Download, FileText, RefreshCw, Search, ShieldCheck, XCircle, Fingerprint, TriangleAlert, BarChart3 } from 'lucide-react';
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
  const [hours, setHours] = useState('24');

  const queryParams = useMemo(() => {
    const params = {};
    if (depotId) params.depotId = depotId;
    Object.entries(filters).forEach(([key, value]) => { if (value !== '') params[key] = value; });
    params.limit = '500';
    return params;
  }, [depotId, filters]);

  const periodParams = useMemo(() => ({ hours }), [hours]);

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

  const dashboardQuery = useQuery({
    queryKey: ['audit-dashboard', tenantId, hours],
    queryFn: async () => (await api.get('/audit/dashboard', { params: periodParams })).data,
    enabled: !!tenantId,
    staleTime: 10000,
  });

  const anomaliesQuery = useQuery({
    queryKey: ['audit-anomalies', tenantId, hours],
    queryFn: async () => (await api.get('/audit/anomalies', { params: periodParams })).data,
    enabled: !!tenantId,
    staleTime: 10000,
  });

  const integrityQuery = useQuery({
    queryKey: ['audit-integrity', tenantId],
    queryFn: async () => (await api.get('/audit/integrity')).data,
    enabled: !!tenantId,
    staleTime: 0,
  });

  useEffect(() => {
    const onVisibility = () => { if (document.visibilityState === 'visible') { refetch(); dashboardQuery.refetch(); anomaliesQuery.refetch(); } };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [refetch, dashboardQuery, anomaliesQuery]);

  const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const refreshSecurity = async () => {
    await Promise.all([refetch(), dashboardQuery.refetch(), anomaliesQuery.refetch(), integrityQuery.refetch()]);
  };

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

  const dashboard = dashboardQuery.data;
  const anomalies = anomaliesQuery.data?.unusual || [];
  const integrity = integrityQuery.data;

  return <div className="space-y-6">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <div className="flex flex-wrap items-center gap-3"><Activity size={28} className="text-indigo-400" /><h1 className="text-2xl font-black text-white">Journal d’Audit</h1><span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-400"><ShieldCheck size={13} />Patron sécurisé</span>{isFetching && <RefreshCw size={14} className="animate-spin text-indigo-400" />}</div>
        <p className="text-slate-400 text-sm mt-1">Traçabilité des opérations sensibles du tenant et du dépôt actif.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={refreshSecurity} disabled={isFetching || dashboardQuery.isFetching || anomaliesQuery.isFetching || integrityQuery.isFetching} className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2.5 text-sm font-bold text-indigo-300 hover:bg-indigo-500/20 disabled:opacity-50"><RefreshCw size={15} className={dashboardQuery.isFetching || anomaliesQuery.isFetching || integrityQuery.isFetching ? 'animate-spin' : ''} />Actualiser sécurité</button>
        <button onClick={() => downloadExport('csv')} disabled={!!exporting} className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-slate-700 disabled:opacity-50"><Download size={15} />{exporting === 'csv' ? 'Export…' : 'CSV'}</button>
        <button onClick={() => downloadExport('pdf')} disabled={!!exporting} className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-slate-700 disabled:opacity-50"><FileText size={15} />{exporting === 'pdf' ? 'Export…' : 'PDF'}</button>
      </div>
    </div>

    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-widest text-slate-500">Événements</span><BarChart3 size={18} className="text-indigo-400" /></div><div className="mt-2 text-2xl font-black text-white">{dashboard?.total ?? '—'}</div><p className="mt-1 text-xs text-slate-500">sur les {hours} dernières heures</p></div>
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-widest text-slate-500">Taux de succès</span><CheckCircle size={18} className="text-emerald-400" /></div><div className="mt-2 text-2xl font-black text-white">{dashboard ? `${dashboard.successRate}%` : '—'}</div><p className="mt-1 text-xs text-slate-500">{dashboard?.failures ?? '—'} échec(s)</p></div>
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-widest text-slate-500">Criticité</span><TriangleAlert size={18} className="text-amber-400" /></div><div className="mt-2 text-2xl font-black text-white">{dashboard?.severity?.critical ?? '—'}</div><p className="mt-1 text-xs text-slate-500">{dashboard?.severity?.attention ?? '—'} attention · {dashboard?.severity?.info ?? '—'} info</p></div>
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-widest text-slate-500">Anomalies</span><AlertCircle size={18} className="text-red-400" /></div><div className="mt-2 text-2xl font-black text-white">{dashboard?.anomalyCount ?? '—'}</div><p className="mt-1 text-xs text-slate-500">{dashboard?.activeActors ?? '—'} acteur(s) actif(s)</p></div>
    </section>

    <section className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5 shadow-xl shadow-black/20">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div><p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Sécurité avancée</p><p className="mt-1 text-sm text-slate-500">Contrôle d’intégrité et détection d’activité inhabituelle.</p></div>
        <div className="flex flex-wrap items-center gap-2"><label className="text-xs font-bold text-slate-500">Période</label><select value={hours} onChange={(e) => setHours(e.target.value)} className="rounded-xl border border-slate-600 bg-slate-800/60 px-3 py-2 text-sm font-bold text-white"><option value="1">1 h</option><option value="6">6 h</option><option value="24">24 h</option><option value="48">48 h</option><option value="72">72 h</option><option value="168">7 jours</option></select></div>
      </div>
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`rounded-xl border p-4 ${integrity?.intact ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
          <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><Fingerprint size={22} className={integrity?.intact ? 'text-emerald-400' : 'text-red-400'} /><div><p className="font-black text-white">Chaîne d’intégrité</p><p className="text-xs text-slate-400">{integrity ? `${integrity.protectedEntries} entrée(s) protégée(s)` : 'Vérification en cours…'}</p></div></div><span className="text-xs font-black uppercase">{integrity ? (integrity.intact ? 'Intacte' : 'ALERTE') : '—'}</span></div>
          {integrity && integrity.unprotectedEntries > 0 && <p className="mt-3 text-xs text-amber-300">{integrity.unprotectedEntries} entrée(s) ne disposent pas encore d’une empreinte.</p>}
          {integrity?.failures?.length > 0 && <p className="mt-3 text-xs text-red-300">{integrity.failures.length} anomalie(s) d’intégrité détectée(s).</p>}
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4">
          <div className="flex items-center gap-3"><TriangleAlert size={22} className={anomalies.length ? 'text-red-400' : 'text-emerald-400'} /><div><p className="font-black text-white">Activité inhabituelle</p><p className="text-xs text-slate-400">{anomalies.length ? `${anomalies.length} alerte(s)` : 'Aucune alerte détectée'}</p></div></div>
          {anomalies.length > 0 && <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">{anomalies.slice(0, 5).map((item, index) => <div key={`${item.type}-${index}`} className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2"><div className="flex justify-between gap-2 text-xs"><span className="font-black text-red-300">{item.type}</span><span className="font-bold text-slate-500">Score {item.score}</span></div><p className="mt-1 text-xs text-slate-400">{item.detail}</p></div>)}</div>}
        </div>
      </div>
    </section>

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
