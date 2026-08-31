import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { depotApi } from '../services/depotApi';
import { useDepot } from '../../../contexts/DepotContext';

const EMPTY = { articleId: '', nom: '', type: 'POURCENTAGE', valeur: 0, prixPromo: 0, dateDebut: '', dateFin: '', actif: true };

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
    save.mutate({ ...form, depotId: depotActif.id });
  };

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-black text-white">Promotions</h1><p className="text-slate-400">Dépôt actif : {depotActif?.nom || 'aucun'}</p></div>
      {error && <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-200">{error}</div>}
      <form onSubmit={submit} className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-800 border border-slate-700 rounded-2xl p-5">
        <input className="rounded-xl bg-slate-900 border border-slate-700 p-3 text-white" placeholder="ID article" value={form.articleId} onChange={(e) => setForm({ ...form, articleId: e.target.value })} />
        <input className="rounded-xl bg-slate-900 border border-slate-700 p-3 text-white" placeholder="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
        <select className="rounded-xl bg-slate-900 border border-slate-700 p-3 text-white" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="POURCENTAGE">Pourcentage</option><option value="MONTANT_FIXE">Montant fixe</option><option value="PRIX_FIXE">Prix fixe</option></select>
        <input className="rounded-xl bg-slate-900 border border-slate-700 p-3 text-white" type="number" min="0" placeholder="Valeur" value={form.valeur} onChange={(e) => setForm({ ...form, valeur: Number(e.target.value) })} />
        <input className="rounded-xl bg-slate-900 border border-slate-700 p-3 text-white" type="number" min="0" placeholder="Prix promo" value={form.prixPromo} onChange={(e) => setForm({ ...form, prixPromo: Number(e.target.value) })} />
        <input className="rounded-xl bg-slate-900 border border-slate-700 p-3 text-white" type="datetime-local" value={form.dateDebut} onChange={(e) => setForm({ ...form, dateDebut: e.target.value })} />
        <input className="rounded-xl bg-slate-900 border border-slate-700 p-3 text-white" type="datetime-local" value={form.dateFin} onChange={(e) => setForm({ ...form, dateFin: e.target.value })} />
        <button disabled={!depotActif?.id || save.isPending} className="rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white disabled:opacity-50">{save.isPending ? 'Enregistrement…' : editingId ? 'Modifier' : 'Créer'}</button>
      </form>
      <div className="rounded-2xl border border-slate-700 overflow-hidden bg-slate-800/50">
        {isLoading ? <div className="p-8 text-slate-400">Chargement…</div> : isError ? <div className="p-8 text-red-300">Erreur de chargement.</div> : !data?.length ? <div className="p-8 text-slate-400">Aucune promotion.</div> : <table className="w-full text-sm"><thead><tr className="text-slate-400 border-b border-slate-700"><th className="p-4 text-left">Nom</th><th className="p-4 text-left">Article</th><th className="p-4 text-left">Type</th><th className="p-4 text-left">Valeur</th><th className="p-4 text-left">Actions</th></tr></thead><tbody>{data.map((p) => <tr key={p.id} className="border-b border-slate-700"><td className="p-4 text-white">{p.nom}</td><td className="p-4 text-slate-300">{p.article?.designation || p.articleId}</td><td className="p-4 text-slate-300">{p.type}</td><td className="p-4 text-slate-300">{p.valeur}</td><td className="p-4 flex gap-2"><button className="px-3 py-2 rounded-lg bg-slate-700 text-white" onClick={() => { setEditingId(p.id); setForm({ articleId: p.articleId || '', nom: p.nom || '', type: p.type || 'POURCENTAGE', valeur: p.valeur || 0, prixPromo: p.prixPromo || 0, dateDebut: p.dateDebut ? String(p.dateDebut).slice(0, 16) : '', dateFin: p.dateFin ? String(p.dateFin).slice(0, 16) : '', actif: p.actif ?? true }); }}>Modifier</button><button className="px-3 py-2 rounded-lg bg-red-600/80 text-white" disabled={remove.isPending} onClick={() => remove.mutate(p.id)}>Supprimer</button></td></tr>)}</tbody></table>}
      </div>
    </div>
  );
}
