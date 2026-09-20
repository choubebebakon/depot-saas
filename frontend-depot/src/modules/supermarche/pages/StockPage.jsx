import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePagination } from '../../../hooks/usePagination';
import { useSectorQuery } from '../../../hooks/useSectorQuery';
import { useNotif } from '../../../context/NotifContext';
import { useDepot } from '../../../contexts/DepotContext';
import { usePermission } from '../../../shared/hooks/usePermission';
import { useActions } from '../../../shared/hooks/useActions';
import { PERMISSIONS } from '../permissions';
import { supermarcheApi } from '../services/supermarcheApi';
import ArticleSupermarcheForm from '../forms/ArticleSupermarcheForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
import { Edit, Trash2, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, History, X, Package } from 'lucide-react';
const FILTRES_STOCK=[{id:'',label:'Tous'},{id:'rupture',label:'Rupture'},{id:'faible',label:'Stock faible'},{id:'ok',label:'OK'}];
function getArticleStock(a){return(a.stocks||[]).reduce((sum,s)=>sum+(Number(s.quantite)||0),0)}
function getArticleRayonId(a){return a.rayons?.[0]?.rayonId||a.rayonId||''}
function StockBadge({qte,seuil=5}){if(qte<=0)return <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/30">Rupture</span>;if(qte<=seuil)return <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/30">Faible</span>;return <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/30">OK</span>}
function ExpirationBadge({value}){if(!value)return <span className="text-xs text-slate-500">—</span>;const d=new Date(value);if(Number.isNaN(d.getTime()))return <span className="text-xs text-red-400">Date invalide</span>;const diff=d.getTime()-Date.now(),day=86400000,label=d.toLocaleString('fr-FR',{dateStyle:'short',timeStyle:'short'});if(diff<0)return <span title={label} className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/30">Expiré · {label}</span>;if(diff<=30*day)return <span title={label} className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/30">Bientôt · {label}</span>;return <span className="text-xs text-slate-300">{label}</span>}
// ── Modal générique de mouvement (Entrée / Sortie) ─────────────────────────
function MouvementModal({ type, article, depotActif, onClose }) {
  const isEntree = type === 'ENTREE';
  const queryClient = useQueryClient();
  const { success, error: notifError } = useNotif();
  const [quantite, setQuantite] = useState('');
  const [motif, setMotif] = useState('');
  const mutation = useMutation({
    mutationFn: (data) => isEntree ? supermarcheApi.entreeStock(data) : supermarcheApi.sortieStock(data),
    onSuccess: (res) => {
      ['supermarche-articles','supermarche-stock','supermarche-dashboard','supermarche-stock-historique'].forEach(k => queryClient.invalidateQueries({ queryKey: [k] }));
      success(`${isEntree ? 'Entrée' : 'Sortie'} de stock enregistrée${res?.data?.quantite != null ? ` — nouveau stock : ${res.data.quantite}` : ''}`);
      onClose();
    },
    onError: (err) => notifError(err?.response?.data?.message || err?.message || 'Erreur lors de l\'opération'),
  });
  const submit = (e) => {
    e.preventDefault();
    const qte = Number(quantite);
    if (!Number.isInteger(qte) || qte < 1) return notifError('Quantité invalide (entier ≥ 1).');
    if (motif.length > 200) return notifError('Motif trop long (200 caractères max).');
    mutation.mutate({ articleId: article.id, depotId: depotActif?.id, quantite: qte, motif: motif || undefined });
  };
  const stockActuel = getArticleStock(article);
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className={`text-lg font-black flex items-center gap-2 ${isEntree ? 'text-emerald-400' : 'text-red-400'}`}>
            {isEntree ? <ArrowDownToLine size={18} /> : <ArrowUpFromLine size={18} />}
            {isEntree ? 'Entrée de stock' : 'Sortie de stock'}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-white"><X size={18} /></button>
        </div>
        <p className="text-slate-400 text-sm">{article.designation} — stock actuel : <span className="font-bold text-white">{stockActuel}</span></p>
        <div>
          <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block">Quantité *</label>
          <input type="number" min={1} step={1} value={quantite} onChange={(e) => setQuantite(e.target.value)} autoFocus className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-500/40" placeholder="0" />
        </div>
        <div>
          <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block">Motif</label>
          <input type="text" maxLength={200} value={motif} onChange={(e) => setMotif(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-500/40" placeholder={isEntree ? 'Ex : Réception fournisseur' : 'Ex : Casse, perte, ajustement'} />
        </div>
        {!isEntree && stockActuel <= 0 && <p className="text-red-400 text-xs font-bold">⚠ Stock actuel nul : la sortie sera refusée par le serveur.</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2.5 rounded-xl text-sm">Annuler</button>
          <button type="submit" disabled={mutation.isPending} className={`flex-1 font-bold py-2.5 rounded-xl text-sm text-white disabled:opacity-50 ${isEntree ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'}`}>
            {mutation.isPending ? 'Traitement…' : isEntree ? 'Valider l\'entrée' : 'Valider la sortie'}
          </button>
        </div>
      </form>
    </div>
  );
}
// ── Modal Transfert entre dépôts ────────────────────────────────────────────
function TransfertModal({ article, depots, depotActif, onClose }) {
  const queryClient = useQueryClient();
  const { success, error: notifError } = useNotif();
  const [sourceDepotId, setSourceDepotId] = useState(depotActif?.id || '');
  const [destDepotId, setDestDepotId] = useState('');
  const [quantite, setQuantite] = useState('');
  const [motif, setMotif] = useState('');
  const stockSource = sourceDepotId
    ? ((article.stocks || []).find((s) => s.depotId === sourceDepotId)?.quantite ?? 0)
    : getArticleStock(article);
  const mutation = useMutation({
    mutationFn: (data) => supermarcheApi.transfertStock(data),
    onSuccess: (res) => {
      ['supermarche-articles','supermarche-stock','supermarche-dashboard','supermarche-stock-historique','supermarche-depots'].forEach(k => queryClient.invalidateQueries({ queryKey: [k] }));
      success(`Transfert effectué${res?.data?.reference ? ` (${res.data.reference})` : ''}`);
      onClose();
    },
    onError: (err) => notifError(err?.response?.data?.message || err?.message || 'Erreur lors du transfert'),
  });
  const submit = (e) => {
    e.preventDefault();
    const qte = Number(quantite);
    if (!sourceDepotId) return notifError('Sélectionnez le dépôt source.');
    if (!destDepotId) return notifError('Sélectionnez le dépôt de destination.');
    if (sourceDepotId === destDepotId) return notifError('Les dépôts source et destination doivent être différents.');
    if (!Number.isInteger(qte) || qte < 1) return notifError('Quantité invalide (entier ≥ 1).');
    if (qte > stockSource) return notifError(`Stock insuffisant dans le dépôt source (disponible : ${stockSource}).`);
    mutation.mutate({ articleId: article.id, sourceDepotId, destDepotId, quantite: qte, motif: motif || undefined });
  };
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-sky-400 flex items-center gap-2"><ArrowLeftRight size={18} /> Transférer le stock</h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-white"><X size={18} /></button>
        </div>
        <p className="text-slate-400 text-sm">{article.designation}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block">Dépôt source *</label>
            <select value={sourceDepotId} onChange={(e) => setSourceDepotId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm outline-none">
              <option value="">— Choisir —</option>
              {depots.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
            </select>
            {sourceDepotId && <p className="text-xs text-slate-500 mt-1">Stock disponible : <span className="font-bold text-white">{stockSource}</span></p>}
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block">Destination *</label>
            <select value={destDepotId} onChange={(e) => setDestDepotId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm outline-none">
              <option value="">— Choisir —</option>
              {depots.filter((d) => d.id !== sourceDepotId).map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block">Quantité *</label>
          <input type="number" min={1} step={1} value={quantite} onChange={(e) => setQuantite(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-500/40" placeholder="0" />
        </div>
        <div>
          <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block">Motif</label>
          <input type="text" maxLength={200} value={motif} onChange={(e) => setMotif(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm outline-none" placeholder="Ex : Réapprovisionnement du dépôt centre" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2.5 rounded-xl text-sm">Annuler</button>
          <button type="submit" disabled={mutation.isPending} className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50">
            {mutation.isPending ? 'Transfert en cours…' : 'Transférer'}
          </button>
        </div>
      </form>
    </div>
  );
}
// ── Modal Historique des mouvements ─────────────────────────────────────────
const TYPE_META = {
  ENTREE: ['Entrée', 'text-emerald-400'],
  SORTIE: ['Sortie', 'text-red-400'],
  SORTIE_VENTE: ['Vente', 'text-orange-400'],
  SORTIE_GRATUITE: ['Sortie gratuite', 'text-pink-400'],
  TRANSFERT_ENTREE: ['Transfert (+)', 'text-sky-400'],
  TRANSFERT_SORTIE: ['Transfert (−)', 'text-amber-400'],
  AJUSTEMENT_INVENTAIRE: ['Ajustement', 'text-violet-400'],
  CASSE_AVARIE: ['Casse / Avarie', 'text-red-300'],
  RETOUR_CLIENT: ['Retour client', 'text-teal-400'],
};
function HistoriqueModal({ article, onClose }) {
  const q = useQuery({
    queryKey: ['supermarche-stock-historique', article.id],
    queryFn: async () => {
      const res = await supermarcheApi.getStockHistorique({ articleId: article.id, limit: 50 });
      const rows = res.data?.data ?? res.data ?? [];
      return Array.isArray(rows) ? rows : [];
    },
    refetchInterval: 20_000,
  });
  const rows = Array.isArray(q.data) ? q.data : [];
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-700/50">
          <h2 className="text-lg font-black text-white flex items-center gap-2"><History size={18} className="text-amber-400" /> Historique — {article.designation}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto custom-scrollbar p-6">
          {q.isLoading ? (
            <div className="py-10 text-center"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : rows.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-10">Aucun mouvement enregistré pour cet article.</p>
          ) : (
            <ul className="space-y-2">
              {rows.map((m) => {
                const [label, color] = TYPE_META[m.type] || [m.type, 'text-slate-300'];
                return (
                  <li key={m.id} className="flex items-center justify-between bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3">
                    <div>
                      <p className={`text-sm font-bold ${color}`}>{label} · {['ENTREE', 'TRANSFERT_ENTREE', 'RETOUR_CLIENT'].includes(m.type) ? '+' : '−'}{m.quantite}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{m.motif || '—'}{m.depot ? ` · ${m.depot.nom}` : ''}</p>
                    </div>
                    <p className="text-xs text-slate-500 whitespace-nowrap ml-4">{m.createdAt ? new Date(m.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
export default function StockPage(){
  const queryClient=useQueryClient();
  const { success, error: notifError } = useNotif();
  const perm=usePermission(PERMISSIONS,'stock');
  const depotCtx=useDepot();
  const depotActif=depotCtx?.depotActif||null;
  const[search,setSearch]=useState(''),[filtre,setFiltre]=useState(''),[rayonFiltre,setRayonFiltre]=useState(''),[formOpen,setFormOpen]=useState(false),[editItem,setEditItem]=useState(null),[confirmDelete,setConfirmDelete]=useState(null);
  const[mouvement,setMouvement]=useState(null),[transfert,setTransfert]=useState(null),[historique,setHistorique]=useState(null);
  const { hasAction } = useActions();
  const{data:depots=[]}=useQuery({queryKey:['supermarche-depots'],queryFn:async()=>{try{const r=await supermarcheApi.getDepots();const raw=r.data?.data??r.data??[];return Array.isArray(raw)?raw:(raw.items||[])}catch{return[]}},refetchInterval:60_000});
  const{data:produits=[],isLoading}=useSectorQuery(['supermarche-articles',{search,filtre,rayonFiltre}],async()=>{const r=await supermarcheApi.getProduits({search,limit:100});const raw=r.data?.data??r.data;return Array.isArray(raw)?raw:[]});
  const{data:rayons=[]}=useSectorQuery(['supermarche-rayons'],async()=>{const r=await supermarcheApi.getRayons();const raw=r.data?.data??r.data;return Array.isArray(raw)?raw:[]});
  const filtres=produits.filter(item=>{const qte=getArticleStock(item),seuil=item.seuilCritique??5;if(search&&!`${item.designation||''} ${item.codeBarres||''}`.toLowerCase().includes(search.toLowerCase()))return false;if(rayonFiltre&&getArticleRayonId(item)!==rayonFiltre)return false;if(filtre==='rupture')return qte<=0;if(filtre==='faible')return qte>0&&qte<=seuil;if(filtre==='ok')return qte>seuil;return true});
  const{currentPage:page,goToPage,totalPages,paginatedData:paginated}=usePagination(filtres,10);
  const deleteMutation=useMutation({mutationFn:id=>supermarcheApi.deleteProduit(id),onSuccess:()=>{['supermarche-articles','supermarche-stock','supermarche-dashboard'].forEach(k=>queryClient.invalidateQueries({queryKey:[k]}));success('Produit supprimé');setConfirmDelete(null)},onError:()=>notifError('Erreur lors de la suppression')});
  const handleCloseForm=()=>{setFormOpen(false);setEditItem(null)};
  return <div className="p-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"><div><h1 className="text-2xl font-black text-white">Gestion du Stock</h1><p className="text-slate-400 text-sm mt-1">{filtres.length} produit{filtres.length!==1?'s':''} affiché{filtres.length!==1?'s':''}</p></div>{perm.canCreate&&<button onClick={()=>{setEditItem(null);setFormOpen(true)}} className="bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm">+ Nouveau Produit</button>}</div>    <div className="flex flex-wrap gap-3 mb-6"><input type="text" placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)} className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm outline-none w-64"/><select value={rayonFiltre} onChange={e=>setRayonFiltre(e.target.value)} className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm outline-none"><option value="">Tous les rayons</option>{rayons.map(r=><option key={r.id} value={r.id}>{r.nom}</option>)}</select><div className="flex gap-1">{FILTRES_STOCK.map(s=><button key={s.id} onClick={()=>setFiltre(s.id)} className={`px-3 py-2 rounded-xl text-xs font-bold ${filtre===s.id?'bg-amber-500 text-white':'bg-slate-800 text-slate-400'}`}>{s.label}</button>)}</div></div>
    {isLoading?<div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"/></div>:<div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Produit</th><th className="text-left px-5 py-4">Rayon</th><th className="text-right px-5 py-4">Prix Vente</th><th className="text-right px-5 py-4">Prix Achat</th><th className="text-right px-5 py-4">Stock</th><th className="text-center px-5 py-4">Péremption</th><th className="text-center px-5 py-4">Statut</th><th className="text-center px-5 py-4">Actions</th></tr></thead><tbody className="divide-y divide-slate-700/50">{filtres.length===0?<tr><td colSpan={8} className="text-center py-16 text-slate-500">Aucun produit trouvé</td></tr>:paginated.map(p=>{const stock=getArticleStock(p),seuil=p.seuilCritique??5,rayon=rayons.find(r=>r.id===getArticleRayonId(p));return <tr key={p.id} className="hover:bg-slate-700/20"><td className="px-5 py-4"><div className="flex items-center gap-2.5">{p.photoUrl ? <img src={p.photoUrl} alt={p.designation} className="w-10 h-10 rounded-lg object-cover bg-slate-700/40 shrink-0 border border-slate-700/40" onError={(e)=>{e.currentTarget.style.display='none'}} /> : <div className="w-10 h-10 rounded-lg bg-slate-700/40 flex items-center justify-center text-slate-500 shrink-0"><Package className="w-5 h-5" /></div>}<div><p className="text-white font-semibold text-sm">{p.designation}</p><p className="text-slate-500 text-xs">{p.codeBarres||''}</p></div></div></td><td className="px-5 py-4"><span className="text-xs font-bold text-slate-300 bg-slate-700/50 px-2 py-1 rounded-full">{rayon?.nom||'—'}</span></td><td className="px-5 py-4 text-right text-amber-400 font-bold text-sm">{(p.prixVente||0).toLocaleString('fr-FR')} F</td><td className="px-5 py-4 text-right text-slate-400 text-sm">{(p.prixAchat||0).toLocaleString('fr-FR')} F</td><td className="px-5 py-4 text-right"><span className={`font-bold text-sm ${stock<=0?'text-red-400':stock<=seuil?'text-amber-400':'text-white'}`}>{stock}</span></td><td className="px-5 py-4 text-center"><ExpirationBadge value={p.datePeremption}/></td><td className="px-5 py-4 text-center"><StockBadge qte={stock} seuil={seuil}/></td><td className="px-5 py-4 text-center"><div className="flex items-center justify-center gap-1">{perm.canEdit&&<button onClick={()=>{setEditItem(p);setFormOpen(true)}} title="Modifier" className="text-slate-400 hover:text-white p-1.5 rounded-lg"><Edit className="w-4 h-4"/></button>}{perm.canDelete&&<button onClick={()=>setConfirmDelete(p)} title="Supprimer" className="text-red-400 hover:text-red-300 p-1.5 rounded-lg"><Trash2 className="w-4 h-4"/></button>}{perm.canEdit&&<button onClick={()=>setMouvement({type:'ENTREE',article:p})} title="Entrée de stock" className="text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 p-1.5 rounded-lg"><ArrowDownToLine className="w-4 h-4"/></button>}{perm.canEdit&&<button onClick={()=>setMouvement({type:'SORTIE',article:p})} title="Sortie de stock" className="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 p-1.5 rounded-lg"><ArrowUpFromLine className="w-4 h-4"/></button>}{depots.length>1&&perm.canEdit&&hasAction('stock.transferer')&&<button onClick={()=>setTransfert({article:p})} title="Transférer" className="text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 p-1.5 rounded-lg"><ArrowLeftRight className="w-4 h-4"/></button>}<button onClick={()=>setHistorique(p)} title="Historique" className="text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 p-1.5 rounded-lg"><History className="w-4 h-4"/></button></div></td></tr>})}</tbody></table></div>{totalPages>1&&<div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50"><span className="text-slate-400 text-xs">{filtres.length} produit{filtres.length>1?'s':''} — Page {page}/{totalPages}</span><div className="flex gap-1"><button onClick={()=>goToPage(page-1)} disabled={page===1} className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-400 disabled:opacity-30">‹</button>{Array.from({length:Math.min(totalPages,5)},(_,i)=>{const start=Math.max(1,page-2),n=start+i;if(n>totalPages)return null;return <button key={n} onClick={()=>goToPage(n)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${page===n?'bg-amber-500 text-white':'bg-slate-800 text-slate-400'}`}>{n}</button>})}<button onClick={()=>goToPage(page+1)} disabled={page===totalPages} className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-400 disabled:opacity-30">›</button></div></div>}</div>}    <ArticleSupermarcheForm isOpen={formOpen} onClose={handleCloseForm} onSuccess={()=>{handleCloseForm();['supermarche-articles','supermarche-stock','supermarche-dashboard'].forEach(k=>queryClient.invalidateQueries({queryKey:[k]}))}} edit={editItem}/>
    <ConfirmModal isOpen={!!confirmDelete} onConfirm={()=>confirmDelete&&deleteMutation.mutate(confirmDelete.id)} onCancel={()=>setConfirmDelete(null)} loading={deleteMutation.isPending} title="Supprimer le produit" message={`Supprimer « ${confirmDelete?.designation} » ? Cette action est irréversible.`}/>
    {mouvement&&<MouvementModal type={mouvement.type} article={mouvement.article} depotActif={depotActif} onClose={()=>setMouvement(null)}/>}
    {transfert&&<TransfertModal article={transfert.article} depots={depots} depotActif={depotActif} onClose={()=>setTransfert(null)}/>}
    {historique&&<HistoriqueModal article={historique} onClose={()=>setHistorique(null)}/>}
  </div>;
}