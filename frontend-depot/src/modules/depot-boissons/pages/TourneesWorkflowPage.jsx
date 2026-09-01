import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Eye, FileDown, Lock, PackagePlus, Pencil, Play, Plus, Printer, RefreshCw, Search, Trash2, Truck, Wallet, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useDepot } from '../../../contexts/DepotContext';
import { usePermission } from '../../../shared/hooks/usePermission';
import { tourneeWorkflowApi } from '../services/tourneeWorkflowApi';

const money = (v) => `${Number(v || 0).toLocaleString('fr-FR')} FCFA`;
const statusMeta = {
  PLANIFIEE: ['Planifiée', 'bg-slate-500/10 text-slate-300 border-slate-500/30'],
  EN_COURS: ['En cours', 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'],
  CLOTUREE: ['Clôturée', 'bg-blue-500/10 text-blue-300 border-blue-500/30'],
};

function errorMessage(error) {
  return error?.response?.data?.message || error?.message || 'Une erreur est survenue.';
}

function Modal({ title, children, onClose, wide = false }) {
  return <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center" onClick={onClose}>
    <div className={`w-full ${wide ? 'max-w-6xl' : 'max-w-2xl'} max-h-[92vh] overflow-auto bg-slate-950 border border-slate-700 rounded-3xl shadow-2xl`} onClick={(e) => e.stopPropagation()}>
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-slate-950/95 border-b border-slate-800"><h2 className="text-white font-black text-lg">{title}</h2><button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400"><X size={18} /></button></div>
      <div className="p-5">{children}</div>
    </div>
  </div>;
}

function Btn({ children, onClick, disabled, tone = 'slate', icon: Icon }) {
  const tones = { slate: 'bg-slate-800 hover:bg-slate-700', blue: 'bg-blue-600 hover:bg-blue-500', green: 'bg-emerald-600 hover:bg-emerald-500', amber: 'bg-amber-600 hover:bg-amber-500', red: 'bg-red-600 hover:bg-red-500' };
  return <button disabled={disabled} onClick={onClick} className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white ${tones[tone]} disabled:opacity-40 disabled:cursor-not-allowed transition-all`}>{Icon && <Icon size={15} />}{children}</button>;
}

export default function TourneesWorkflowPage() {
  const { metier } = useAuth();
  const depot = useDepot();
  const { canWrite } = usePermission('tournees');
  const qc = useQueryClient();
  const depotId = depot?.depotId ?? depot?.depotActif?.id;
  const [search, setSearch] = useState('');
  const [active, setActive] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [showView, setShowView] = useState(false);
  const [editing, setEditing] = useState(null);
  const [createForm, setCreateForm] = useState({ tricycleId: '', commercialId: '', date: new Date().toISOString().slice(0, 16) });
  const [lineForm, setLineForm] = useState({ articleId: '', quantiteChargee: 1, prixUnitaireFacture: '' });
  const [returns, setReturns] = useState({});
  const [cash, setCash] = useState({ cashReel: 0, orangeMoneyReel: 0, mtnMomoReel: 0 });
  const [message, setMessage] = useState('');

  const enabled = metier === 'DEPOT_BOISSONS' && Boolean(depotId);
  const q = useQuery({ queryKey: ['tournee-workflow', depotId], queryFn: async () => (await tourneeWorkflowApi.list()).data, enabled });
  const options = useQuery({ queryKey: ['tournee-workflow-options', depotId], queryFn: async () => Promise.all([tourneeWorkflowApi.tricycles(), tourneeWorkflowApi.commerciaux(), tourneeWorkflowApi.articles()]), enabled });
  const detail = useQuery({ queryKey: ['tournee-workflow-detail', active?.id], queryFn: async () => (await tourneeWorkflowApi.get(active.id)).data, enabled: Boolean(active?.id) });
  const tournee = detail.data || active;
  const tricycles = options.data?.[0]?.data || [];
  const commerciaux = options.data?.[1]?.data || [];
  const articles = options.data?.[2]?.data || [];

  const refresh = () => { qc.invalidateQueries({ queryKey: ['tournee-workflow', depotId] }); qc.invalidateQueries({ queryKey: ['tournee-workflow-options', depotId] }); if (active?.id) qc.invalidateQueries({ queryKey: ['tournee-workflow-detail', active.id] }); };
  const mutation = (fn, success) => useMutation({ mutationFn: fn, onSuccess: () => { setMessage(success); refresh(); }, onError: (e) => setMessage(errorMessage(e)) });
  const create = mutation((data) => tourneeWorkflowApi.create(data), 'Tournée planifiée avec succès.');
  const update = mutation(({ id, data }) => tourneeWorkflowApi.update(id, data), 'Tournée modifiée.');
  const addLine = mutation(({ id, data }) => tourneeWorkflowApi.addLine(id, data), 'Article ajouté au chargement.');
  const removeLine = mutation(({ id, lineId }) => tourneeWorkflowApi.removeLine(id, lineId), 'Article retiré du chargement.');
  const depart = mutation((id) => tourneeWorkflowApi.depart(id), 'Départ validé : stock décrémenté et tournée verrouillée.');
  const reconcile = mutation(({ id, data }) => tourneeWorkflowApi.reconcile(id, data), 'Retour et caisse enregistrés.');
  const close = mutation((id) => tourneeWorkflowApi.close(id), 'Tournée clôturée définitivement.');

  const filtered = useMemo(() => (Array.isArray(q.data) ? q.data : []).filter((t) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return [t.reference, t.commercial?.nom, t.tricycle?.nom, t.statut].filter(Boolean).some((x) => String(x).toLowerCase().includes(needle));
  }), [q.data, search]);

  const total = useMemo(() => (tournee?.lignes || []).reduce((a, l) => a + Number(l.quantiteChargee || 0), 0), [tournee]);
  const value = useMemo(() => (tournee?.lignes || []).reduce((a, l) => a + Number(l.quantiteChargee || 0) * Number(l.prixUnitaireFacture || 0), 0), [tournee]);

  const openDetail = (t) => { setActive(t); setShowView(true); };
  const openLoading = (t) => { setActive(t); setShowLoading(true); setLineForm({ articleId: '', quantiteChargee: 1, prixUnitaireFacture: '' }); };
  const openReturn = (t) => { setActive(t); setShowReturn(true); const map = {}; (t.lignes || []).forEach((l) => { map[l.id] = { quantiteRetourPleins: l.quantiteRetourPleins || 0, quantiteRetourVides: l.quantiteRetourVides || 0 }; }); setReturns(map); setCash({ cashReel: t.cashReel || 0, orangeMoneyReel: t.orangeMoneyReel || 0, mtnMomoReel: t.mtnMomoReel || 0 }); };

  const printBon = async (id) => {
    try {
      const res = await tourneeWorkflowApi.bonSortie(id);
      const url = URL.createObjectURL(res.data);
      const win = window.open(url, '_blank', 'noopener,noreferrer');
      if (win) win.onload = () => win.print();
    } catch (e) { setMessage(errorMessage(e)); }
  };

  const downloadBon = async (id, ref) => {
    try {
      const res = await tourneeWorkflowApi.bonSortie(id);
      const url = URL.createObjectURL(res.data); const a = document.createElement('a'); a.href = url; a.download = `bon-sortie-${ref}.pdf`; a.click(); URL.revokeObjectURL(url);
    } catch (e) { setMessage(errorMessage(e)); }
  };

  if (metier !== 'DEPOT_BOISSONS') return <div className="p-8 text-center text-red-300">Cette page appartient au métier Dépôt de boissons.</div>;
  if (!depotId) return <div className="p-8 text-center text-amber-300">Sélectionnez un dépôt actif pour gérer les tournées.</div>;

  return <div className="p-4 sm:p-6 space-y-6">
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
      <div><div className="flex items-center gap-3"><div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-300"><Truck /></div><div><h1 className="text-2xl font-black text-white">Tournée Tricycle</h1><p className="text-sm text-slate-400">Planification → chargement → départ → retour → rapprochement → clôture</p></div></div></div>
      {canWrite && <Btn tone="green" icon={Plus} onClick={() => { setEditing(null); setCreateForm({ tricycleId: '', commercialId: '', date: new Date().toISOString().slice(0, 16) }); setShowCreate(true); }}>Nouvelle tournée</Btn>}
    </div>

    {message && <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 text-blue-200 text-sm"><span>{message}</span><button onClick={() => setMessage('')}><X size={16} /></button></div>}

    <div className="flex items-center gap-3 p-3 bg-slate-900/70 border border-slate-800 rounded-2xl"><Search size={18} className="text-slate-500" /><input value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent outline-none text-white w-full text-sm" placeholder="Rechercher référence, commercial, tricycle ou statut…" /><Btn icon={RefreshCw} onClick={refresh}>Actualiser</Btn></div>

    {q.isLoading ? <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{[1,2,3].map((i) => <div key={i} className="h-48 bg-slate-900 rounded-3xl animate-pulse" />)}</div> : q.isError ? <div className="p-8 rounded-3xl border border-red-500/20 bg-red-500/5 text-red-200">{errorMessage(q.error)}</div> : filtered.length === 0 ? <div className="p-12 rounded-3xl border border-dashed border-slate-700 text-center"><PackagePlus className="mx-auto text-slate-600" size={42} /><p className="text-white font-bold mt-3">Aucune tournée</p><p className="text-slate-500 text-sm mt-1">Créez une tournée pour commencer.</p></div> : <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {filtered.map((t) => { const [label, cls] = statusMeta[t.statut] || [t.statut, statusMeta.PLANIFIEE[1]]; return <div key={t.id} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 hover:border-slate-700 transition-all">
        <div className="flex items-start justify-between gap-3"><div><p className="text-white font-black">{t.reference}</p><p className="text-xs text-slate-500 mt-1">{t.commercial?.nom || t.commercial?.email || 'Commercial'} · {t.tricycle?.nom || 'Tricycle'}</p></div><span className={`px-2.5 py-1 rounded-full border text-[10px] font-black ${cls}`}>{label}</span></div>
        <div className="grid grid-cols-2 gap-2 mt-5"><div className="p-3 rounded-2xl bg-slate-950"><p className="text-[10px] uppercase text-slate-500">Chargé</p><p className="text-white font-black">{t.totalQuantiteChargee || 0}</p></div><div className="p-3 rounded-2xl bg-slate-950"><p className="text-[10px] uppercase text-slate-500">Valeur</p><p className="text-white font-black text-sm">{money(t.totalValeurChargee)}</p></div></div>
        <p className="text-xs text-slate-500 mt-4">{new Date(t.datePlanifiee).toLocaleString('fr-FR')}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Btn icon={Eye} onClick={() => openDetail(t)}>Voir</Btn>
          {canWrite && t.statut === 'PLANIFIEE' && <><Btn tone="blue" icon={PackagePlus} onClick={() => openLoading(t)}>Charger</Btn><Btn icon={Pencil} onClick={() => { setEditing(t); setCreateForm({ tricycleId: t.tricycleId, commercialId: t.commercialId, date: new Date(t.datePlanifiee).toISOString().slice(0,16) }); setShowCreate(true); }}>Modifier</Btn><Btn tone="green" icon={Play} disabled={depart.isPending} onClick={() => { if (window.confirm('Valider le départ ? Le stock sera décrémenté et le chargement deviendra immuable.')) depart.mutate(t.id); }}>Valider le départ</Btn></>}
          {t.statut !== 'PLANIFIEE' && <><Btn icon={Printer} onClick={() => printBon(t.id)}>Imprimer Bon</Btn><Btn icon={FileDown} onClick={() => downloadBon(t.id, t.reference)}>PDF</Btn></>}
          {canWrite && t.statut === 'EN_COURS' && <Btn tone="amber" icon={Wallet} onClick={() => openReturn(t)}>Retour & caisse</Btn>}
          {canWrite && t.statut === 'EN_COURS' && <Btn tone="red" icon={Lock} onClick={() => { if (window.confirm('Clôturer définitivement cette tournée ? Cette action est irréversible.')) close.mutate(t.id); }}>Clôturer</Btn>}
        </div>
      </div>; })}
    </div>}

    {showCreate && <Modal title={editing ? 'Modifier la tournée planifiée' : 'Planifier une nouvelle tournée'} onClose={() => setShowCreate(false)}>
      <div className="grid md:grid-cols-2 gap-4">
        <label className="text-sm text-slate-300">Tricycle<select value={createForm.tricycleId} onChange={(e) => setCreateForm({ ...createForm, tricycleId: e.target.value })} className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"><option value="">Sélectionner…</option>{tricycles.map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}</select></label>
        <label className="text-sm text-slate-300">Commercial<select value={createForm.commercialId} onChange={(e) => setCreateForm({ ...createForm, commercialId: e.target.value })} className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"><option value="">Sélectionner…</option>{commerciaux.map((x) => <option key={x.id} value={x.id}>{x.nom || x.email}</option>)}</select></label>
        <label className="text-sm text-slate-300">Date / heure<input type="datetime-local" value={createForm.date} onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })} className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white" /></label>
      </div>
      <div className="flex justify-end gap-2 mt-6"><Btn onClick={() => setShowCreate(false)}>Annuler</Btn><Btn tone="green" disabled={create.isPending || update.isPending || !createForm.tricycleId || !createForm.commercialId} onClick={() => { const fn = editing ? update : create; fn.mutate(editing ? { id: editing.id, data: createForm } : createForm); setShowCreate(false); }}>{editing ? 'Enregistrer' : 'Planifier'}</Btn></div>
    </Modal>}

    {showLoading && tournee && <Modal wide title={`Chargement — ${tournee.reference}`} onClose={() => setShowLoading(false)}>
      {tournee.statut !== 'PLANIFIEE' && <div className="mb-4 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-amber-200 text-sm flex gap-2"><Lock size={17} /> Le chargement est verrouillé après validation du départ.</div>}
      <div className="grid md:grid-cols-4 gap-3 mb-5"><div className="p-4 bg-slate-900 rounded-2xl"><p className="text-xs text-slate-500">Quantité totale</p><p className="text-xl font-black text-white">{total}</p></div><div className="p-4 bg-slate-900 rounded-2xl md:col-span-2"><p className="text-xs text-slate-500">Valeur marché</p><p className="text-xl font-black text-emerald-300">{money(value)}</p></div><div className="p-4 bg-slate-900 rounded-2xl"><p className="text-xs text-slate-500">Lignes</p><p className="text-xl font-black text-white">{tournee.lignes?.length || 0}</p></div></div>
      {tournee.statut === 'PLANIFIEE' && <div className="grid md:grid-cols-4 gap-3 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl mb-5"><select value={lineForm.articleId} onChange={(e) => { const a = articles.find((x) => x.id === e.target.value); setLineForm({ ...lineForm, articleId: e.target.value, prixUnitaireFacture: a?.prixVente ?? '' }); }} className="md:col-span-2 bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"><option value="">Rechercher / sélectionner un article…</option>{articles.map((a) => <option key={a.id} value={a.id}>{a.designation} — stock {a.quantiteDisponible}</option>)}</select><input type="number" min="1" value={lineForm.quantiteChargee} onChange={(e) => setLineForm({ ...lineForm, quantiteChargee: Number(e.target.value) })} className="bg-slate-950 border border-slate-700 rounded-xl p-3 text-white" placeholder="Quantité" /><input type="number" min="0" value={lineForm.prixUnitaireFacture} onChange={(e) => setLineForm({ ...lineForm, prixUnitaireFacture: Number(e.target.value) })} className="bg-slate-950 border border-slate-700 rounded-xl p-3 text-white" placeholder="Prix unitaire" /><div className="md:col-span-4 flex justify-end"><Btn tone="blue" icon={Plus} disabled={addLine.isPending || !lineForm.articleId || lineForm.quantiteChargee < 1} onClick={() => addLine.mutate({ id: tournee.id, data: lineForm })}>Ajouter article</Btn></div></div>}
      <div className="overflow-x-auto rounded-2xl border border-slate-800"><table className="w-full text-sm"><thead className="bg-slate-900 text-slate-400"><tr><th className="text-left p-3">Article</th><th className="p-3">Stock</th><th className="p-3">Qté</th><th className="p-3">PU</th><th className="p-3">Sous-total</th><th className="p-3">Action</th></tr></thead><tbody>{(tournee.lignes || []).map((l) => { const a = articles.find((x) => x.id === l.articleId); const insufficient = a && Number(l.quantiteChargee) > Number(a.quantiteDisponible); return <tr key={l.id} className="border-t border-slate-800"><td className="p-3 text-white">{l.designation}</td><td className={`p-3 text-center ${insufficient ? 'text-red-300' : 'text-slate-300'}`}>{a?.quantiteDisponible ?? '—'}</td><td className="p-3 text-center text-white font-bold">{l.quantiteChargee}</td><td className="p-3 text-center text-slate-300">{money(l.prixUnitaireFacture)}</td><td className="p-3 text-center text-emerald-300 font-bold">{money(Number(l.quantiteChargee) * Number(l.prixUnitaireFacture))}</td><td className="p-3 text-center">{tournee.statut === 'PLANIFIEE' && <Btn tone="red" icon={Trash2} onClick={() => removeLine.mutate({ id: tournee.id, lineId: l.id })}>Retirer</Btn>}</td></tr>; })}</tbody></table></div>
      <div className="flex flex-wrap justify-end gap-2 mt-5"><Btn onClick={() => setShowLoading(false)}>Fermer</Btn>{tournee.statut === 'PLANIFIEE' && <Btn tone="green" icon={Play} disabled={depart.isPending || !tournee.lignes?.length} onClick={() => { if (window.confirm('Valider le départ ? Le stock sera décrémenté et le chargement sera figé.')) depart.mutate(tournee.id); }}>Valider le départ</Btn>}{tournee.statut !== 'PLANIFIEE' && <Btn icon={Printer} onClick={() => printBon(tournee.id)}>Imprimer Bon de Sortie</Btn>}</div>
    </Modal>}

    {showReturn && tournee && <Modal wide title={`Retour & rapprochement — ${tournee.reference}`} onClose={() => setShowReturn(false)}>
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 mb-5"><div className="flex items-center gap-2 text-white font-bold"><Wallet size={18} /> Rapprochement financier</div><div className="grid md:grid-cols-3 gap-3 mt-4">{[['cashReel','Espèces'],['orangeMoneyReel','Orange Money'],['mtnMomoReel','MTN MoMo']].map(([key,label]) => <label key={key} className="text-xs text-slate-400">{label}<input type="number" min="0" value={cash[key]} onChange={(e) => setCash({ ...cash, [key]: Number(e.target.value) })} className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white" /></label>)}</div></div>
      <div className="overflow-x-auto rounded-2xl border border-slate-800"><table className="w-full text-sm"><thead className="bg-slate-900 text-slate-400"><tr><th className="text-left p-3">Article</th><th className="p-3">Embarqué</th><th className="p-3">Retour pleins</th><th className="p-3">Retour vides</th><th className="p-3">Vendu théorique</th><th className="p-3">CA théorique</th></tr></thead><tbody>{(tournee.lignes || []).map((l) => { const r = returns[l.id] || { quantiteRetourPleins: 0, quantiteRetourVides: 0 }; const vendue = Number(l.quantiteChargee) - Number(r.quantiteRetourPleins); return <tr key={l.id} className="border-t border-slate-800"><td className="p-3 text-white">{l.designation}</td><td className="p-3 text-center">{l.quantiteChargee}</td><td className="p-3"><input type="number" min="0" max={l.quantiteChargee} value={r.quantiteRetourPleins} onChange={(e) => setReturns({ ...returns, [l.id]: { ...r, quantiteRetourPleins: Number(e.target.value) } })} className="w-24 mx-auto block bg-slate-950 border border-slate-700 rounded-lg p-2 text-white" /></td><td className="p-3"><input type="number" min="0" value={r.quantiteRetourVides} onChange={(e) => setReturns({ ...returns, [l.id]: { ...r, quantiteRetourVides: Number(e.target.value) } })} className="w-24 mx-auto block bg-slate-950 border border-slate-700 rounded-lg p-2 text-white" /></td><td className="p-3 text-center text-emerald-300 font-bold">{Math.max(0, vendue)}</td><td className="p-3 text-center text-white">{money(vendue * Number(l.prixUnitaireFacture))}</td></tr>; })}</tbody></table></div>
      <div className="flex justify-end gap-2 mt-5"><Btn onClick={() => setShowReturn(false)}>Annuler</Btn><Btn tone="blue" disabled={reconcile.isPending} onClick={() => reconcile.mutate({ id: tournee.id, data: { lignes: Object.entries(returns).map(([lineId, r]) => ({ lineId, ...r })), ...cash } })}>Enregistrer le rapprochement</Btn></div>
    </Modal>}

    {showView && tournee && <Modal wide title={`Détails — ${tournee.reference}`} onClose={() => setShowView(false)}>
      <div className="grid md:grid-cols-4 gap-3"><div className="p-4 rounded-2xl bg-slate-900"><p className="text-xs text-slate-500">Statut</p><p className="text-white font-black">{statusMeta[tournee.statut]?.[0] || tournee.statut}</p></div><div className="p-4 rounded-2xl bg-slate-900"><p className="text-xs text-slate-500">CA théorique</p><p className="text-white font-black">{money(tournee.caTheorique)}</p></div><div className="p-4 rounded-2xl bg-slate-900"><p className="text-xs text-slate-500">Encaissé réel</p><p className="text-white font-black">{money(tournee.montantEncaisseReel)}</p></div><div className="p-4 rounded-2xl bg-slate-900"><p className="text-xs text-slate-500">Écart caisse</p><p className={`font-black ${Number(tournee.ecartCaisse) < 0 ? 'text-red-300' : 'text-emerald-300'}`}>{money(tournee.ecartCaisse)}</p></div></div>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-800"><table className="w-full text-sm"><thead className="bg-slate-900 text-slate-400"><tr><th className="text-left p-3">Article</th><th className="p-3">Embarqué</th><th className="p-3">Prix figé</th><th className="p-3">Retour plein</th><th className="p-3">Vendu</th><th className="p-3">CA</th></tr></thead><tbody>{(tournee.lignes || []).map((l) => <tr key={l.id} className="border-t border-slate-800"><td className="p-3 text-white">{l.designation}</td><td className="p-3 text-center">{l.quantiteChargee}</td><td className="p-3 text-center">{money(l.prixUnitaireFacture)}</td><td className="p-3 text-center">{l.quantiteRetourPleins}</td><td className="p-3 text-center text-emerald-300">{l.quantiteVendueTheorique}</td><td className="p-3 text-center">{money(l.caTheorique)}</td></tr>)}</tbody></table></div>
      <div className="flex flex-wrap justify-end gap-2 mt-5"><Btn icon={Printer} onClick={() => printBon(tournee.id)}>Imprimer</Btn><Btn icon={FileDown} onClick={() => downloadBon(tournee.id, tournee.reference)}>Télécharger PDF</Btn>{canWrite && tournee.statut === 'EN_COURS' && <Btn tone="amber" icon={Wallet} onClick={() => { setShowView(false); openReturn(tournee); }}>Retour & caisse</Btn>}{canWrite && tournee.statut === 'EN_COURS' && <Btn tone="red" icon={Lock} onClick={() => { if (window.confirm('Clôturer définitivement ?')) close.mutate(tournee.id); }}>Clôturer définitivement</Btn>}</div>
    </Modal>}
  </div>;
}
