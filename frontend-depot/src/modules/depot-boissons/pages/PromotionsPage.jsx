import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { depotApi } from '../services/depotApi';
import { useDepot } from '../../../contexts/DepotContext';

const EMPTY = { articleId: '', nom: '', type: 'POURCENTAGE', valeur: 0, prixPromo: 0, dateDebut: '', dateFin: '', actif: true };
const ARTCILE_LIMIT = 500;

export default function PromotionsPage() {
  const { depotActif } = useDepot();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const queryKey = ['depot-boissons', 'promotions', depotActif?.id];
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => depotApi.getPromotions().then((r) => r.data),
    enabled: Boolean(depotActif?.id),
  });

  // Articles du dépôt actif — la promotion est toujours liée à un article réel,
  // jamais à un ID saisi à la main (UX production).
  const articlesQ = useQuery({
    queryKey: ['depot-articles', 'promotions', depotActif?.id],
    queryFn: async () => {
      const res = await depotApi.getArticles({ page: 1, limit: ARTCILE_LIMIT, depotId: depotActif?.id });
      return res.data?.data || res.data || [];
    },
    enabled: Boolean(depotActif?.id),
  });
  const articles = Array.isArray(articlesQ.data) ? articlesQ.data : (articlesQ.data?.data || []);
  const articleOptions = (editingId && form.articleId && !articles.some((a) => a.id === form.articleId))
    ? [{ id: form.articleId, designation: '(Article actuel)' }, ...articles]
    : articles;

  const save = useMutation({
    mutationFn: (payload) => editingId ? depotApi.updatePromotion(editingId, payload) : depotApi.createPromotion(payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); setForm(EMPTY); setEditingId(null); setError(''); },
    onError: (err) => setError(err?.response?.data?.message || 'Enregistrement impossible.'),
  });

  const remove = useMutation({
    mutationFn: (id) => depotApi.deletePromotion(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (err) => setError(err?.response?.data?.message || 'Suppression impossible.'),
  });

  const submit = (e) => {
    e.preventDefault();
    if (!depotActif?.id) return setError('Sélectionnez un dépôt actif.');
    if (!form.articleId || !form.nom.trim()) return setError('Article et nom obligatoires.');
    if (!Number.isFinite(Number(form.valeur)) || Number(form.valeur) < 0) return setError('Valeur invalide.');
    if (form.valeur > 100 && form.type === 'POURCENTAGE') return setError('Un pourcentage ne peut pas dépasser 100.');
    save.mutate({ ...form, depotId: depotActif.id });
  };

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-black text-white">Promotions</h1><p className="text-slate-400">Dépôt actif : {depotActif?.nom || 'aucun'}</p></div>
      {error && <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-200">{error}</div>}
      <form onSubmit={submit} className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-800 border border-slate-700 rounded-2xl p-5">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Article *</span>
          <select className="rounded-xl bg-slate-900 border border-slate-700 p-3 text-white disabled:opacity-50" value={form.articleId} onChange={(e) => setForm({ ...form, articleId: e.target.value })} disabled={articlesQ.isLoading}>
            <option value="">{articlesQ.isLoading ? 'Chargement des articles…' : '— Sélectionner un article —'}</option>
            {articleOptions.map((a) => <option key={a.id} value={a.id}>{a.designation}{a.format ? ` (${a.format})` : ''}</option>)}
          </select>
        </label>
        <input className="rounded-xl bg-slate-900 border border-slate-700 p-3 text-white" placeholder="Nom de la promotion" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
        <select className="rounded-xl bg-slate-900 border border-slate-700 p-3 text-white" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="POURCENTAGE">Pourcentage</option><option value="MONTANT_FIXE">Montant fixe</option><option value="PRIX_FIXE">Prix fixe</option></select>
        <input className="rounded-xl bg-slate-900 border border-slate-700 p-3 text-white" type="number" min="0" placeholder="Valeur" value={form.valeur} onChange={(e) => setForm({ ...form, valeur: Number(e.target.value) })} />
        <input className="rounded-xl bg-slate-900 border border-slate-700 p-3 text-white" type="number" min="0" placeholder="Prix promo" value={form.prixPromo} onChange={(e) => setForm({ ...form, prixPromo: Number(e.target.value) })} />
        <input className="rounded-xl bg-slate-900 border border-slate-700 p-3 text-white" type="datetime-local" value={form.dateDebut} onChange={(e) => setForm({ ...form, dateDebut: e.target.value })} />
        <input className="rounded-xl bg-slate-900 border border-slate-700 p-3 text-white" type="datetime-local" value={form.dateFin} onChange={(e) => setForm({ ...form, dateFin: e.target.value })} />
        <button disabled={!depotActif?.id || save.isPending || articlesQ.isLoading} className="rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white disabled:opacity-50">{save.isPending ? 'Enregistrement…' : editingId ? 'Modifier' : 'Créer'}</button>
      </form>
      {articlesQ.isError && <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">Impossible de charger les articles. Vérifiez le dépôt actif puis réessayez.</div>}
      <div className="rounded-2xl border border-slate-700 overflow-hidden bg-slate-800/50">
        {isLoading ? <div className="p-8 text-slate-400">Chargement…</div> : isError ? <div className="p-8 text-red-300">Erreur de chargement des promotions.</div> : !data?.length ? <div className="p-8 text-slate-400">Aucune promotion.</div> : <table className="w-full text-sm"><thead><tr className="text-slate-400 border-b border-slate-700"><th className="p-4 text-left">Nom</th><th className="p-4 text-left">Article</th><th className="p-4 text-left">Type</th><th className="p-4 text-left">Valeur</th><th className="p-4 text-left">Période</th><th className="p-4 text-left">Actions</th></tr></thead><tbody>{data.map((p) => <tr key={p.id} className="border-b border-slate-700"><td className="p-4 text-white">{p.nom}</td><td className="p-4 text-slate-300">{p.article?.designation || p.articleId}</td><td className="p-4 text-slate-300">{p.type}</td><td className="p-4 text-slate-300">{p.type === 'POURCENTAGE' ? `${p.valeur}%` : p.valeur}</td><td className="p-4 text-slate-300 text-xs">{p.dateDebut ? new Date(p.dateDebut).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'} → {p.dateFin ? new Date(p.dateFin).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '∞'}</td><td className="p-4 flex gap-2"><button className="px-3 py-2 rounded-lg bg-slate-700 text-white" onClick={() => { setEditingId(p.id); setForm({ articleId: p.articleId || '', nom: p.nom || '', type: p.type || 'POURCENTAGE', valeur: p.valeur || 0, prixPromo: p.prixPromo || 0, dateDebut: p.dateDebut ? String(p.dateDebut).slice(0, 16) : '', dateFin: p.dateFin ? String(p.dateFin).slice(0, 16) : '', actif: p.actif ?? true }); setError(''); }}>Modifier</button><button className="px-3 py-2 rounded-lg bg-red-600/80 text-white" disabled={remove.isPending} onClick={() => { if (window.confirm('Supprimer cette promotion ?')) remove.mutate(p.id); }}>Supprimer</button></td></tr>)}</tbody></table>}
      </div>
    </div>
  );
}
