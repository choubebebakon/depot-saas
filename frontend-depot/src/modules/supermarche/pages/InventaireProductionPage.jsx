import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ClipboardList, Loader2, RefreshCw, Search } from 'lucide-react';
import { useDepot } from '../../../contexts/DepotContext';
import { useNotif } from '../../../context/NotifContext';
import api from '../../../api';

export default function InventaireProductionPage() {
  const { depotActif, depotId } = useDepot();
  const queryClient = useQueryClient();
  const { success, error: notifyError } = useNotif();
  const [search, setSearch] = useState('');
  const [counts, setCounts] = useState({});
  const [motif, setMotif] = useState('Inventaire physique');

  const selectedDepotId = depotId || depotActif?.id || null;

  const { data = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['supermarche-inventaire-production', selectedDepotId, search],
    queryFn: async () => {
      const response = await api.get('/stocks/inventaire', {
        params: search.trim() ? { search: search.trim() } : {},
      });
      return Array.isArray(response.data) ? response.data : response.data?.data || [];
    },
    enabled: Boolean(selectedDepotId),
  });

  const rows = useMemo(() => data.map((row) => {
    const counted = counts[row.articleId];
    return {
      ...row,
      stockCompte: counted === undefined ? row.quantite : Number(counted),
      ecart: counted === undefined ? 0 : Number(counted) - row.quantite,
    };
  }), [data, counts]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedDepotId) throw new Error('Aucun dépôt actif sélectionné.');
      const lignes = rows
        .filter((row) => counts[row.articleId] !== undefined)
        .map((row) => ({ articleId: row.articleId, quantiteComptee: Number(counts[row.articleId]) }));

      if (lignes.length === 0) throw new Error('Aucune quantité modifiée.');
      return (await api.post('/stocks/inventaire', { motif: motif.trim() || undefined, lignes })).data;
    },
    onSuccess: (result) => {
      setCounts({});
      queryClient.invalidateQueries({ queryKey: ['supermarche-inventaire-production'] });
      queryClient.invalidateQueries({ queryKey: ['supermarche-stock'] });
      queryClient.invalidateQueries({ queryKey: ['supermarche-articles'] });
      queryClient.invalidateQueries({ queryKey: ['supermarche-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      success(`Inventaire ${result?.reference || ''} validé : ${result?.lignesModifiees ?? 0} écart(s) corrigé(s).`);
    },
    onError: (error) => notifyError(error.response?.data?.message || error.message || 'Échec de validation de l’inventaire'),
  });

  if (!selectedDepotId) {
    return <div className="p-8 text-center text-slate-400">Sélectionnez un dépôt actif pour réaliser un inventaire.</div>;
  }

  const modifiedCount = Object.keys(counts).length;
  const positive = rows.filter((row) => row.ecart > 0).length;
  const negative = rows.filter((row) => row.ecart < 0).length;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400"><ClipboardList className="h-6 w-6" /></div>
            <div>
              <h1 className="text-2xl font-black text-white">Inventaire</h1>
              <p className="text-sm text-slate-400">Comptage physique · {depotActif?.nom || 'dépôt actif'}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-300">{rows.length} références</span>
          <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-emerald-400">+{positive}</span>
          <span className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-red-400">-{negative}</span>
        </div>
      </header>

      <section className="flex flex-col gap-3 rounded-2xl border border-slate-700/60 bg-slate-800/40 p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une référence..." className="w-full rounded-xl border border-slate-700 bg-slate-900 px-10 py-2.5 text-sm text-white outline-none focus:border-amber-500" />
        </div>
        <input value={motif} onChange={(event) => setMotif(event.target.value)} maxLength={500} placeholder="Motif" className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500 sm:w-72" />
        <button type="button" onClick={() => refetch()} disabled={isFetching} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Actualiser</button>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-800/40">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Chargement du stock…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/70 text-xs uppercase tracking-wider text-slate-500">
                <tr><th className="px-5 py-4 text-left">Article</th><th className="px-5 py-4 text-right">Stock système</th><th className="px-5 py-4 text-right">Comptage</th><th className="px-5 py-4 text-right">Écart</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {rows.length === 0 ? <tr><td colSpan="4" className="py-16 text-center text-slate-500">Aucun article trouvé.</td></tr> : rows.map((row) => (
                  <tr key={row.articleId} className="hover:bg-slate-700/20">
                    <td className="px-5 py-3"><p className="font-semibold text-white">{row.article?.designation || row.articleId}</p><p className="text-xs text-slate-500">{row.article?.codeBarres || row.article?.format || '—'}</p></td>
                    <td className="px-5 py-3 text-right font-bold text-slate-300">{row.quantite}</td>
                    <td className="px-5 py-3 text-right"><input type="number" min="0" step="1" value={counts[row.articleId] ?? row.quantite} onChange={(event) => setCounts((current) => ({ ...current, [row.articleId]: event.target.value }))} className={`w-28 rounded-lg border bg-slate-900 px-3 py-2 text-right font-mono text-white outline-none ${counts[row.articleId] !== undefined ? 'border-amber-500' : 'border-slate-700 focus:border-amber-500'}`} /></td>
                    <td className={`px-5 py-3 text-right font-black ${row.ecart > 0 ? 'text-emerald-400' : row.ecart < 0 ? 'text-red-400' : 'text-slate-500'}`}>{row.ecart > 0 ? '+' : ''}{row.ecart}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="sticky bottom-4 flex flex-col gap-3 rounded-2xl border border-slate-700 bg-slate-900/95 p-4 shadow-2xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-400">{modifiedCount > 0 ? <span><strong className="text-white">{modifiedCount}</strong> ligne(s) seront enregistrées atomiquement.</span> : 'Modifiez les quantités réellement comptées avant validation.'}</div>
        <button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending || modifiedCount === 0} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-black text-white hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"><CheckCircle2 className="h-4 w-4" /> {mutation.isPending ? 'Validation…' : 'Valider l’inventaire'}</button>
      </footer>
    </div>
  );
}
