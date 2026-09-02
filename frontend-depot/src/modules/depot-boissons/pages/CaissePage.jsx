import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { useDepot } from '../../../contexts/DepotContext';
import { useNotif } from '../../../context/NotifContext';
import { usePermission } from '../../../shared/hooks/usePermission';
import { depotApi } from '../services/depotApi';

const PAYMENT_MODES = [
  { value: 'CASH', label: 'Espèces' },
  { value: 'ORANGE_MONEY', label: 'Orange Money' },
  { value: 'MTN_MOMO', label: 'MTN MoMo' },
  { value: 'CREDIT', label: 'Crédit client' },
  { value: 'MIXTE', label: 'Paiement mixte' },
];

function money(value) { return Number(value || 0).toLocaleString('fr-FR'); }
function errorMessage(error, fallback) { return error?.response?.data?.message || error?.message || fallback; }

export default function CaissePage() {
  const { metier } = useAuth();
  const depot = useDepot();
  const depotId = depot?.depotId ?? depot?.depotActif?.id ?? null;
  const queryClient = useQueryClient();
  const notif = useNotif();
  const { canWrite } = usePermission('caisse');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [clientId, setClientId] = useState('');
  const [modePaiement, setModePaiement] = useState('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const [omAmount, setOmAmount] = useState('');
  const [momoAmount, setMomoAmount] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [showOpen, setShowOpen] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('');
  const [movement, setMovement] = useState({ typeMouvement: 'ENTREE', montant: '', motif: '' });
  const [showMovement, setShowMovement] = useState(false);

  const { data: caisse, isLoading: caisseLoading } = useQuery({
    queryKey: ['depot-caisse-statut', depotId],
    queryFn: () => depotApi.getCaisseStatut(depotId).then((res) => res.data),
    enabled: metier === 'DEPOT_BOISSONS' && Boolean(depotId),
    refetchInterval: 10000,
  });
  const { data: articleResponse, isLoading: articlesLoading } = useQuery({
    queryKey: ['depot-pos-articles', depotId, search],
    queryFn: () => depotApi.getArticles({ depotId, search, page: 1, limit: 25 }).then((res) => res.data),
    enabled: Boolean(depotId),
  });
  const { data: clientResponse } = useQuery({
    queryKey: ['depot-pos-clients', depotId],
    queryFn: () => depotApi.getClients({ depotId, page: 1, limit: 100 }).then((res) => res.data),
    enabled: Boolean(depotId),
  });

  const articles = articleResponse?.data || [];
  const clients = clientResponse?.data || [];
  const total = useMemo(() => cart.reduce((sum, line) => sum + line.prixUnitaire * line.quantite, 0), [cart]);
  const paymentTotal = useMemo(() => {
    if (modePaiement === 'CASH') return Number(cashReceived || 0) >= total ? total : Number(cashReceived || 0);
    if (modePaiement === 'ORANGE_MONEY') return Number(omAmount || 0);
    if (modePaiement === 'MTN_MOMO') return Number(momoAmount || 0);
    if (modePaiement === 'CREDIT') return Number(creditAmount || 0);
    return Number(cashReceived || 0) + Number(omAmount || 0) + Number(momoAmount || 0) + Number(creditAmount || 0);
  }, [modePaiement, total, cashReceived, omAmount, momoAmount, creditAmount]);
  const change = modePaiement === 'CASH' ? Math.max(0, Number(cashReceived || 0) - total) : 0;

  const venteMutation = useMutation({
    mutationFn: () => {
      if (!depotId) throw new Error('Dépôt actif requis.');
      if (!cart.length) throw new Error('Ajoutez au moins un article.');
      if (total <= 0) throw new Error('Le total de la vente doit être supérieur à 0.');
      const payload = {
        id: crypto.randomUUID(),
        depotId,
        clientId: clientId || undefined,
        modePaiement,
        articles: cart.map((line) => ({ articleId: line.articleId, quantite: line.quantite, prixUnitaire: line.prixUnitaire })),
      };
      if (modePaiement === 'CASH') payload.montantCash = total;
      if (modePaiement === 'ORANGE_MONEY') payload.montantOM = total;
      if (modePaiement === 'MTN_MOMO') payload.montantMoMo = total;
      if (modePaiement === 'CREDIT') payload.montantCredit = total;
      if (modePaiement === 'MIXTE') {
        payload.montantCash = Number(cashReceived || 0);
        payload.montantOM = Number(omAmount || 0);
        payload.montantMoMo = Number(momoAmount || 0);
        payload.montantCredit = Number(creditAmount || 0);
      }
      return depotApi.createVente(payload);
    },
    onSuccess: () => {
      setCart([]); setClientId(''); setCashReceived(''); setOmAmount(''); setMomoAmount(''); setCreditAmount('');
      queryClient.invalidateQueries({ queryKey: ['depot-caisse-statut', depotId] });
      queryClient.invalidateQueries({ queryKey: ['depot-pos-articles', depotId] });
      queryClient.invalidateQueries({ queryKey: ['depot-clients', depotId] });
      notif.success('Vente enregistrée : stock et caisse mis à jour.');
    },
    onError: (error) => notif.error(errorMessage(error, 'Impossible d’enregistrer la vente.')),
  });

  const openMutation = useMutation({
    mutationFn: () => depotApi.ouvrirCaisse({ depotId, montantInitial: Number(openingAmount || 0) }),
    onSuccess: () => { setOpeningAmount(''); setShowOpen(false); queryClient.invalidateQueries({ queryKey: ['depot-caisse-statut', depotId] }); notif.success('Caisse ouverte.'); },
    onError: (error) => notif.error(errorMessage(error, 'Impossible d’ouvrir la caisse.')),
  });
  const closeMutation = useMutation({
    mutationFn: () => depotApi.fermerCaisse({ depotId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['depot-caisse-statut', depotId] }); notif.success('Caisse fermée.'); },
    onError: (error) => notif.error(errorMessage(error, 'Impossible de fermer la caisse.')),
  });
  const movementMutation = useMutation({
    mutationFn: () => depotApi.mouvementCaisse({ ...movement, depotId, montant: Number(movement.montant) }),
    onSuccess: () => { setMovement({ typeMouvement: 'ENTREE', montant: '', motif: '' }); setShowMovement(false); queryClient.invalidateQueries({ queryKey: ['depot-caisse-statut', depotId] }); notif.success('Mouvement de caisse enregistré.'); },
    onError: (error) => notif.error(errorMessage(error, 'Impossible d’enregistrer le mouvement.')),
  });

  function addArticle(article) {
    const stock = Number(article.quantite || 0);
    if (stock <= 0) return notif.error(`Stock indisponible pour ${article.designation}.`);
    setCart((current) => {
      const found = current.find((line) => line.articleId === article.id);
      if (found) {
        if (found.quantite >= stock) { notif.error('Quantité maximale disponible atteinte.'); return current; }
        return current.map((line) => line.articleId === article.id ? { ...line, quantite: line.quantite + 1 } : line);
      }
      return [...current, { articleId: article.id, designation: article.designation, quantite: 1, prixUnitaire: Number(article.prix || 0), stockDisponible: stock }];
    });
  }
  function setQuantity(articleId, value) {
    const quantity = Math.max(1, Number.parseInt(value, 10) || 1);
    setCart((current) => current.map((line) => line.articleId === articleId ? { ...line, quantite: Math.min(quantity, line.stockDisponible) } : line));
  }

  if (!depotId) return <div className="p-8 text-center text-slate-400">Sélectionnez un dépôt actif pour accéder à la caisse.</div>;
  if (metier !== 'DEPOT_BOISSONS') return <div className="p-8 text-center text-red-400">Accès non autorisé.</div>;
  const paymentValid = Math.abs(paymentTotal - total) <= 0.01;
  const canSubmit = canWrite && caisse?.statut === 'OUVERTE' && cart.length > 0 && total > 0 && paymentValid && !venteMutation.isPending;

  return (
    <div className="p-4 md:p-6 space-y-5 text-white">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div><p className="text-xs uppercase tracking-widest text-amber-400 font-bold">Dépôt de boissons</p><h1 className="text-2xl font-black">Caisse / Point de vente</h1></div>
        <div className="flex flex-wrap gap-2">
          {caisse?.statut === 'OUVERTE' ? <><span className="px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-300 text-sm font-bold">● Caisse ouverte · {money(caisse.solde)} FCFA</span><button disabled={!canWrite || closeMutation.isPending} onClick={() => closeMutation.mutate()} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-sm font-bold">Fermer</button><button disabled={!canWrite} onClick={() => setShowMovement(true)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-sm font-bold">Mouvement</button></> : <button disabled={!canWrite || openMutation.isPending} onClick={() => setShowOpen(true)} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-sm font-black">Ouvrir la caisse</button>}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.35fr_.9fr] gap-5">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
          <div className="p-4 border-b border-slate-800"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un article…" className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-amber-500" /></div>
          <div className="p-4 grid sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
            {articlesLoading ? <p className="text-slate-500 col-span-full">Chargement des articles…</p> : articles.map((article) => <button key={article.id} type="button" onClick={() => addArticle(article)} className="text-left p-4 rounded-xl border border-slate-800 hover:border-amber-500/60 bg-slate-950/50 transition-colors"><p className="font-bold truncate">{article.designation}</p><p className="text-amber-300 font-black mt-1">{money(article.prix)} FCFA</p><p className={`text-xs mt-2 ${Number(article.quantite || 0) > 0 ? 'text-slate-400' : 'text-red-400'}`}>Stock : {article.quantite}</p></button>)}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-4">
          <div className="flex items-center justify-between"><h2 className="font-black text-lg">Panier</h2><span className="text-xs text-slate-500">{cart.length} ligne(s)</span></div>
          <div className="space-y-2 max-h-56 overflow-y-auto">{!cart.length && <p className="text-sm text-slate-500 py-8 text-center border border-dashed border-slate-800 rounded-xl">Ajoutez des articles.</p>}{cart.map((line) => <div key={line.articleId} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60"><div className="flex justify-between gap-3"><span className="font-semibold truncate">{line.designation}</span><button type="button" onClick={() => setCart((c) => c.filter((x) => x.articleId !== line.articleId))} className="text-red-400">×</button></div><div className="flex items-center justify-between mt-2"><input type="number" min="1" max={line.stockDisponible} value={line.quantite} onChange={(e) => setQuantity(line.articleId, e.target.value)} className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1" /><span className="font-bold">{money(line.prixUnitaire * line.quantite)} FCFA</span></div></div>)}</div>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-3 outline-none"><option value="">Client occasionnel</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.nom}</option>)}</select>
          <select value={modePaiement} onChange={(e) => { setModePaiement(e.target.value); setCashReceived(''); setOmAmount(''); setMomoAmount(''); setCreditAmount(''); }} className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-3 outline-none">{PAYMENT_MODES.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}</select>
          {modePaiement === 'CASH' && <input type="number" min="0" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} placeholder="Espèces reçues" className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-3 outline-none" />}
          {modePaiement === 'ORANGE_MONEY' && <input type="number" min="0" value={omAmount} onChange={(e) => setOmAmount(e.target.value)} placeholder="Montant Orange Money" className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-3 outline-none" />}
          {modePaiement === 'MTN_MOMO' && <input type="number" min="0" value={momoAmount} onChange={(e) => setMomoAmount(e.target.value)} placeholder="Montant MTN MoMo" className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-3 outline-none" />}
          {modePaiement === 'CREDIT' && <input type="number" min="0" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} placeholder="Montant à crédit" className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-3 outline-none" />}
          {modePaiement === 'MIXTE' && <div className="grid grid-cols-2 gap-2"><input type="number" min="0" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} placeholder="Cash" className="rounded-xl bg-slate-800 border border-slate-700 px-3 py-3 outline-none" /><input type="number" min="0" value={omAmount} onChange={(e) => setOmAmount(e.target.value)} placeholder="OM" className="rounded-xl bg-slate-800 border border-slate-700 px-3 py-3 outline-none" /><input type="number" min="0" value={momoAmount} onChange={(e) => setMomoAmount(e.target.value)} placeholder="MoMo" className="rounded-xl bg-slate-800 border border-slate-700 px-3 py-3 outline-none" /><input type="number" min="0" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} placeholder="Crédit" className="rounded-xl bg-slate-800 border border-slate-700 px-3 py-3 outline-none" /></div>}
          <div className="border-t border-slate-800 pt-4 space-y-2"><div className="flex justify-between text-slate-400"><span>Total</span><strong className="text-white text-xl">{money(total)} FCFA</strong></div>{modePaiement === 'CASH' && <div className="flex justify-between text-slate-400"><span>Monnaie</span><strong className="text-emerald-300">{money(change)} FCFA</strong></div>}{!paymentValid && <p className="text-xs text-red-400">Le paiement doit correspondre exactement au total.</p>}</div>
          <button disabled={!canSubmit} onClick={() => venteMutation.mutate()} className="w-full rounded-xl py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black disabled:opacity-40 disabled:cursor-not-allowed">{venteMutation.isPending ? 'Enregistrement…' : 'Enregistrer la vente'}</button>
        </section>
      </div>

      {showOpen && <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"><div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5"><h3 className="font-black text-lg mb-4">Ouverture de caisse</h3><input autoFocus type="number" min="0" value={openingAmount} onChange={(e) => setOpeningAmount(e.target.value)} placeholder="Fond initial (FCFA)" className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3" /><div className="flex gap-2 mt-4"><button onClick={() => setShowOpen(false)} className="flex-1 rounded-xl py-3 bg-slate-800">Annuler</button><button disabled={openMutation.isPending} onClick={() => openMutation.mutate()} className="flex-1 rounded-xl py-3 bg-emerald-600 font-bold">Ouvrir</button></div></div></div>}
      {showMovement && <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"><div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5"><h3 className="font-black text-lg mb-4">Mouvement de caisse</h3><div className="grid grid-cols-2 gap-2 mb-3"><button onClick={() => setMovement((m) => ({ ...m, typeMouvement: 'ENTREE' }))} className={`rounded-xl py-2 ${movement.typeMouvement === 'ENTREE' ? 'bg-emerald-600' : 'bg-slate-800'}`}>Entrée</button><button onClick={() => setMovement((m) => ({ ...m, typeMouvement: 'SORTIE' }))} className={`rounded-xl py-2 ${movement.typeMouvement === 'SORTIE' ? 'bg-red-600' : 'bg-slate-800'}`}>Sortie</button></div><input type="number" min="0" value={movement.montant} onChange={(e) => setMovement((m) => ({ ...m, montant: e.target.value }))} placeholder="Montant" className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 mb-3" /><input value={movement.motif} onChange={(e) => setMovement((m) => ({ ...m, motif: e.target.value }))} placeholder="Motif" className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3" /><div className="flex gap-2 mt-4"><button onClick={() => setShowMovement(false)} className="flex-1 rounded-xl py-3 bg-slate-800">Annuler</button><button disabled={movementMutation.isPending} onClick={() => movementMutation.mutate()} className="flex-1 rounded-xl py-3 bg-amber-500 text-slate-950 font-bold">Valider</button></div></div></div>}
      {caisseLoading && <div className="fixed bottom-4 right-4 text-xs text-slate-500">Actualisation caisse…</div>}
    </div>
  );
}
