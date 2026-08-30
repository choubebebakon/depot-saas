import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useDepot } from '../../../contexts/DepotContext';
import api from '../../../api/axios';
import InventaireForm from '../forms/InventaireForm';
import { BarChart3 } from 'lucide-react';

export default function InventairePage() {
  const { metier: metierParam } = useParams();
  const { metier: metierAuth, tenantId } = useAuth();
  const depotContext = useDepot();
  const depotId = depotContext?.depotId ?? depotContext?.depotActif?.id ?? null;
  const metier = metierParam || metierAuth || 'supermarche';
  const prefix = metier.toLowerCase().replace(/_/g, '-');
  const queryClient = useQueryClient();
  const { success, error: notifError } = useNotif();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [rayonFiltre, setRayonFiltre] = useState('');
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState({});

  const { data: produitsData = [], isLoading: loading } = useQuery({
    queryKey: ['supermarche-articles', tenantId, depotId],
    queryFn: async () => {
      const res = await api.get(`/${prefix}/produits`, { params: { depotId } });
      return res.data;
    },
    enabled: !!tenantId && !!depotId,
  });
  const produits = Array.isArray(produitsData?.data) ? produitsData.data : (Array.isArray(produitsData) ? produitsData : []);

  const { data: rayonsData = [] } = useQuery({
    queryKey: ['supermarche-rayons', tenantId, depotId],
    queryFn: async () => {
      const res = await api.get(`/${prefix}/rayons`, { params: { depotId } });
      return res.data;
    },
    enabled: !!tenantId && !!depotId,
  });
  const rayons = Array.isArray(rayonsData?.data) ? rayonsData.data : (Array.isArray(rayonsData) ? rayonsData : []);

  const handleStockEdit = useCallback((produitId, value) => setEdits(prev => ({ ...prev, [produitId]: value })), []);

  const saveStock = useCallback(async (produit) => {
    const stockReel = parseInt(edits[produit.id], 10);
    if (!Number.isInteger(stockReel) || stockReel < 0) return notifError('Valeur de stock invalide');
    if (!depotId) return notifError('Aucun dépôt actif sélectionné');
    setSaving(prev => ({ ...prev, [produit.id]: true }));
    try {
      await api.patch(`/${prefix}/produits/${produit.id}/stock`, { stock: stockReel, motif: 'Ajustement inventaire', depotId });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['supermarche-articles', tenantId, depotId] }),
        queryClient.invalidateQueries({ queryKey: ['supermarche-stock'] }),
        queryClient.invalidateQueries({ queryKey: ['supermarche-inventaire'] }),
        queryClient.invalidateQueries({ queryKey: ['supermarche-dashboard'] }),
      ]);
      setEdits(prev => { const next = { ...prev }; delete next[produit.id]; return next; });
      success(`Stock de ${produit.nom || produit.designation} ajusté à ${stockReel}`);
    } catch (err) {
      notifError(err.response?.data?.message || "Erreur lors de l'ajustement du stock");
    } finally { setSaving(prev => ({ ...prev, [produit.id]: false })); }
  }, [edits, prefix, queryClient, success, notifError, depotId, tenantId]);

  const ruptureCount = produits.filter(i => (i.quantite || i.stock || 0) === 0).length;
  const faibleCount = produits.filter(i => { const q = i.quantite || i.stock || 0; return q > 0 && q <= (i.seuil || i.seuilAlerte || 5); }).length;
  const totalValeur = produits.reduce((acc, i) => acc + (i.valeurStock || i.valeur || ((i.quantite || i.stock || 0) * (i.prixAchat || i.prix || 0))), 0);
  const filtres = produits.filter(p => {
    const haystack = `${p.nom || p.designation || ''} ${p.reference || p.codeBarres || ''}`.toLowerCase();
    return (!search || haystack.includes(search.toLowerCase())) && (!rayonFiltre || p.rayonId === rayonFiltre || p.rayons?.some(r => r.rayonId === rayonFiltre));
  });

  if (!depotId) return <div className="p-8 text-center text-slate-400">Sélectionnez un dépôt actif pour consulter l'inventaire.</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-black text-white flex items-center gap-2"><BarChart3 className="w-6 h-6" /> Inventaire</h1><p className="text-slate-400 text-sm mt-1">{produits.length} référence{produits.length !== 1 ? 's' : ''} · dépôt actif</p></div><div className="flex gap-2"><button onClick={() => setFormOpen(true)} className="bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm">Nouvel Inventaire</button><button onClick={() => window.print()} className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm">Imprimer</button></div></div>
      <div className="grid grid-cols-3 gap-4 mb-6"><div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center"><p className="text-emerald-400 font-black text-xl">{totalValeur.toLocaleString('fr-FR')} F</p><p className="text-slate-400 text-xs mt-1 font-bold uppercase tracking-widest">Valeur stock</p></div><div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center"><p className="text-amber-400 font-black text-xl">{faibleCount}</p><p className="text-slate-400 text-xs mt-1 font-bold uppercase tracking-widest">Stock faible</p></div><div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center"><p className="text-red-400 font-black text-xl">{ruptureCount}</p><p className="text-slate-400 text-xs mt-1 font-bold uppercase tracking-widest">Ruptures</p></div></div>
      <div className="flex gap-3 mb-6"><input type="text" placeholder="🔍 Rechercher un produit..." value={search} onChange={e => setSearch(e.target.value)} className="bg-slate-800 border border-slate-700 focus:border-amber-500 text-white rounded-xl px-4 py-2 text-sm outline-none w-64"/><select value={rayonFiltre} onChange={e => setRayonFiltre(e.target.value)} className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm outline-none"><option value="">Tous les rayons</option>{rayons.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}</select></div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div> : <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Produit</th><th className="text-left px-5 py-4">Rayon</th><th className="text-right px-5 py-4">Stock Système</th><th className="text-right px-5 py-4">Stock Réel</th><th className="text-right px-5 py-4">Valeur</th><th className="text-center px-5 py-4">Action</th></tr></thead><tbody className="divide-y divide-slate-700/50">{filtres.length === 0 ? <tr><td colSpan={6} className="text-center py-16 text-slate-500">Aucun produit trouvé</td></tr> : filtres.map(p => { const rayon = rayons.find(r => r.id === p.rayonId) || p.rayons?.find(r => r.rayonId === rayonFiltre); const stockActuel = Number(p.stock ?? p.quantite ?? 0); const editVal = edits[p.id]; const isDirty = editVal !== undefined && parseInt(editVal, 10) !== stockActuel; const seuil = Number(p.seuilAlerte ?? p.seuil ?? 5); const valeur = stockActuel * Number(p.prixAchat ?? p.prix ?? 0); return <tr key={p.id} className={`transition-colors ${stockActuel <= 0 ? 'bg-red-500/5' : stockActuel <= seuil ? 'bg-amber-500/5' : 'hover:bg-slate-700/20'}`}><td className="px-5 py-3"><p className="text-white font-semibold text-sm">{p.nom || p.designation}</p><p className="text-slate-500 text-xs">{p.reference || p.codeBarres || '—'}</p></td><td className="px-5 py-3"><span className="text-xs font-bold text-slate-400 bg-slate-700/50 px-2 py-1 rounded-full">{rayon?.nom || '—'}</span></td><td className="px-5 py-3 text-right font-bold text-white">{stockActuel} {p.unite || ''}</td><td className="px-5 py-3 text-right"><input type="number" min="0" value={editVal !== undefined ? editVal : stockActuel} onChange={e => handleStockEdit(p.id, e.target.value)} className={`w-24 text-right bg-slate-700 border rounded-lg px-3 py-1.5 text-sm text-white outline-none ${isDirty ? 'border-amber-500' : 'border-slate-600 focus:border-amber-500'}`} /></td><td className="px-5 py-3 text-right text-slate-300 text-sm font-mono">{valeur.toLocaleString('fr-FR')} F</td><td className="px-5 py-3 text-center">{isDirty && <button onClick={() => saveStock(p)} disabled={!!saving[p.id]} className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white text-xs font-bold px-3 py-1.5 rounded-lg">{saving[p.id] ? '⏳' : '✓ Sauver'}</button>}</td></tr>; })}</tbody></table></div></div>}
      <InventaireForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['supermarche-articles', tenantId, depotId] }); }} metier={prefix} depotId={depotId} />
    </div>
  );
}
