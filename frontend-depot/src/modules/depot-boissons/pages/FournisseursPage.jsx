import { useMemo, useState } from 'react';
import { Factory, Handshake, Pencil, Plus, ReceiptText, RefreshCw, Search, ShoppingCart, Truck, Wallet, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePagination } from '../../../hooks/usePagination';
import { useAuth } from '../../../contexts/AuthContext';
import { useDepot } from '../../../contexts/DepotContext';
import { useNotif } from '../../../context/NotifContext';
import { usePermission } from '../../../shared/hooks/usePermission';
import { depotApi } from '../services/depotApi';
import FournisseurForm from '../../../shared/forms/FournisseurForm';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';

const LIMIT = 100;

export default function FournisseursPage() {
  const { metier } = useAuth();
  const depot = useDepot();
  const depotId = depot?.depotId ?? null;
  const queryClient = useQueryClient();
  const notif = useNotif();
  const { canWrite } = usePermission('fournisseurs');

  const [showModal, setShowModal] = useState(null);
  const [selectedFournisseur, setSelectedFournisseur] = useState(null);
  const [commandes, setCommandes] = useState([]);
  const [detteData, setDetteData] = useState({ montant: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');

  const isDepotBoissons = metier === 'DEPOT_BOISSONS';
  const hasDepotScope = Boolean(depotId);

  const { data: providersData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['depot-fournisseurs', depotId],
    queryFn: async () => {
      const res = await depotApi.getFournisseurs({ page: 1, limit: LIMIT, depotId }, depotId);
      return res.data?.data || res.data || [];
    },
    enabled: isDepotBoissons && hasDepotScope,
    staleTime: 30_000,
  });

  const fournisseurs = useMemo(() => {
    const raw = Array.isArray(providersData) ? providersData : (providersData?.data || []);
    const term = search.trim().toLowerCase();
    if (!term) return raw;
    return raw.filter((f) => [f.nom, f.telephone, f.email, f.contact].filter(Boolean).some((value) => String(value).toLowerCase().includes(term)));
  }, [providersData, search]);

  const total = fournisseurs.length;
  const { currentPage, nextPage, prevPage, totalPages, totalItems, paginatedData: paginated } = usePagination(fournisseurs, 10);

  const invalidateFournisseurs = () => {
    queryClient.invalidateQueries({ queryKey: ['depot-fournisseurs'] });
    queryClient.invalidateQueries({ queryKey: ['depot-fournisseurs-commandes'] });
    queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['achats-fournisseurs'] });
    queryClient.invalidateQueries({ queryKey: ['achats-receptions'] });
  };

  const closeActionModal = () => {
    setShowModal(null);
    setSelectedFournisseur(null);
    setDetteData({ montant: '' });
  };

  const commanderMutation = useMutation({
    mutationFn: ({ fournisseurId, articles }) => depotApi.passerCommandeFournisseur({ fournisseurId, articles, depotId }),
    onSuccess: () => { invalidateFournisseurs(); notif.success('Commande envoyée avec succès'); closeActionModal(); },
    onError: (err) => notif.error(err.response?.data?.message || 'Erreur lors de l’envoi de la commande'),
  });

  const receptionnerMutation = useMutation({
    mutationFn: ({ fournisseurId, articles }) => depotApi.receptionnerLivraison(fournisseurId, { articles, depotId }),
    onSuccess: () => { invalidateFournisseurs(); notif.success('Livraison réceptionnée avec succès'); closeActionModal(); },
    onError: (err) => notif.error(err.response?.data?.message || 'Erreur lors de la réception'),
  });

  const reglerDetteMutation = useMutation({
    mutationFn: ({ fournisseurId, montant }) => depotApi.reglerDetteFournisseur(fournisseurId, { montant, depotId }),
    onSuccess: () => { invalidateFournisseurs(); notif.success('Règlement enregistré avec succès'); closeActionModal(); },
    onError: (err) => notif.error(err.response?.data?.message || 'Erreur lors du règlement'),
  });

  const openCreate = () => { setEditItem(null); setFormOpen(true); };
  const openEdit = (fournisseur) => { setEditItem(fournisseur); setFormOpen(true); };
  const handleCommander = (fournisseur) => { setSelectedFournisseur(fournisseur); setShowModal('commander'); };
  const handleReceptionner = (fournisseur) => { setSelectedFournisseur(fournisseur); setShowModal('receptionner'); };

  const handleCommanderSubmit = (data) => {
    if (!hasDepotScope || !selectedFournisseur?.id) return notif.error('Dépôt actif introuvable. Impossible d’envoyer la commande.');
    if (!String(data?.articles || '').trim()) return notif.error('Veuillez renseigner les articles à commander.');
    commanderMutation.mutate({ fournisseurId: selectedFournisseur.id, articles: String(data.articles).trim() });
  };

  const handleReceptionnerSubmit = (data) => {
    if (!hasDepotScope || !selectedFournisseur?.id) return notif.error('Dépôt actif introuvable. Impossible d’enregistrer la réception.');
    if (!String(data?.articles || '').trim()) return notif.error('Veuillez renseigner les articles reçus.');
    receptionnerMutation.mutate({ fournisseurId: selectedFournisseur.id, articles: String(data.articles).trim() });
  };

  const handleReglerDette = (fournisseur) => {
    const montant = Number(detteData.montant);
    const dette = Number(fournisseur?.dette || fournisseur?.solde || 0);
    if (!Number.isFinite(montant) || montant <= 0) return notif.error('Le montant du règlement doit être supérieur à zéro.');
    if (montant > dette) return notif.error('Le règlement ne peut pas dépasser la dette du fournisseur.');
    if (!hasDepotScope) return notif.error('Dépôt actif introuvable.');
    reglerDetteMutation.mutate({ fournisseurId: fournisseur.id, montant });
  };

  const handleVoirCommandes = async (fournisseur) => {
    if (!hasDepotScope || !fournisseur?.id) return notif.error('Dépôt actif introuvable.');
    try {
      const res = await depotApi.historiqueCommandes(fournisseur.id, depotId);
      setCommandes(res.data?.data || res.data || []);
      setSelectedFournisseur(fournisseur);
      setShowModal('commandes');
    } catch (err) {
      notif.error(err.response?.data?.message || 'Erreur de chargement des commandes');
    }
  };

  if (!isDepotBoissons) return <div className="p-8 text-center text-red-400">Accès non autorisé</div>;
  if (!hasDepotScope) return <div className="space-y-3 p-8 text-center"><Factory className="mx-auto text-slate-600" size={32} /><p className="font-bold text-red-400">Dépôt actif introuvable</p><p className="text-sm text-slate-500">Sélectionnez un dépôt actif avant de consulter les fournisseurs.</p></div>;
  if (isLoading) return <div className="space-y-4 p-6 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-slate-800/60" />)}</div>;

  if (isError) {
    const status = error?.response?.status;
    const message = status === 403 ? 'Accès refusé pour ce dépôt.' : status === 404 ? 'Ressource fournisseurs introuvable.' : 'Impossible de charger les fournisseurs.';
    return <div className="space-y-4 p-8 text-center"><p className="font-bold text-red-400">{message}</p><button type="button" onClick={() => refetch()} className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"><RefreshCw size={16} /> Réessayer</button></div>;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div><div className="flex items-center gap-2"><Factory size={20} className="text-blue-400" /><h1 className="text-2xl font-black tracking-tight text-white">Fournisseurs</h1></div><p className="mt-1 text-sm text-slate-400">{total} fournisseur{total > 1 ? 's' : ''}</p></div>
        <div className="flex flex-col gap-3 sm:flex-row"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} /><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher nom, téléphone, email…" aria-label="Rechercher un fournisseur" className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 pl-9 text-sm text-white outline-none focus:border-blue-500" /></div>{canWrite && <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"><Plus size={16} /> Nouveau fournisseur</button>}</div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {totalItems === 0 ? <div className="col-span-full rounded-xl border border-slate-700/50 bg-slate-800/30 p-12 text-center"><Handshake className="mx-auto mb-3 text-slate-600" size={34} /><p className="text-lg font-medium text-slate-300">{search ? 'Aucun fournisseur trouvé' : 'Aucun fournisseur'}</p><p className="mt-1 text-sm text-slate-500">{search ? 'Modifiez votre recherche.' : 'Ajoutez votre premier fournisseur.'}</p></div> : paginated.map((fournisseur) => {
          const dette = Number(fournisseur.dette ?? fournisseur.solde ?? 0);
          return <div key={fournisseur.id} className="flex flex-col justify-between rounded-xl border border-slate-700/50 bg-slate-800/60 p-5 transition-all hover:border-blue-500/30"><div><div className="mb-3 flex items-start justify-between"><div><p className="font-bold text-white">{fournisseur.nom}</p><p className="mt-0.5 text-xs text-slate-500">{fournisseur.telephone || '-'}</p>{fournisseur.email && <p className="text-xs text-slate-500">{fournisseur.email}</p>}</div>{canWrite && <button type="button" onClick={() => openEdit(fournisseur)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-700/60 hover:text-white"><Pencil size={13} /> Modifier</button>}</div>{dette > 0 && <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-center"><p className="text-[10px] uppercase tracking-wider text-red-400">Dette</p><p className="text-sm font-bold text-red-400">{dette.toLocaleString('fr-FR')} FCFA</p></div>}</div><div className="mt-4 flex flex-wrap gap-1.5">{canWrite && <><button type="button" onClick={() => handleCommander(fournisseur)} disabled={commanderMutation.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600/80 px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"><ShoppingCart size={13} /> Commander</button><button type="button" onClick={() => handleReceptionner(fournisseur)} disabled={receptionnerMutation.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600/80 px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-blue-500 disabled:opacity-50"><Truck size={13} /> Réceptionner</button>{dette > 0 && <button type="button" onClick={() => { setSelectedFournisseur(fournisseur); setShowModal('regler'); }} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600/80 px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-amber-500"><Wallet size={13} /> Régler</button>}</>}<button type="button" onClick={() => handleVoirCommandes(fournisseur)} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-600/80 px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-slate-500"><ReceiptText size={13} /> Commandes</button></div></div>;
        })}
      </div>

      {totalPages > 1 && <div className="mt-6 flex items-center justify-center gap-2"><button type="button" disabled={currentPage <= 1} onClick={prevPage} className="rounded-xl bg-slate-800 px-4 py-2 text-sm text-white transition hover:bg-slate-700 disabled:opacity-40">Précédent</button><span className="text-sm text-slate-400">Page {currentPage} / {totalPages}</span><button type="button" disabled={currentPage >= totalPages} onClick={nextPage} className="rounded-xl bg-slate-800 px-4 py-2 text-sm text-white transition hover:bg-slate-700 disabled:opacity-40">Suivant</button></div>}

      <FormModal isOpen={showModal === 'commander'} onClose={closeActionModal} onSubmit={handleCommanderSubmit} title="Commander au fournisseur" loading={commanderMutation.isPending} size="sm" submitLabel="Envoyer commande"><div className="space-y-4"><div className="rounded-lg bg-slate-800/50 p-3"><p className="text-sm text-slate-400">Fournisseur : <span className="font-semibold text-white">{selectedFournisseur?.nom}</span></p><p className="text-sm text-slate-400">Dépôt actif : <span className="font-bold text-cyan-400">{depotId}</span></p></div><FormField label="Articles à commander" name="articles" required placeholder="Ex. 10x Bouteille 1L, 5x Casier" /></div></FormModal>
      <FormModal isOpen={showModal === 'receptionner'} onClose={closeActionModal} onSubmit={handleReceptionnerSubmit} title="Réceptionner une livraison" loading={receptionnerMutation.isPending} size="sm" submitLabel="Réceptionner"><div className="space-y-4"><div className="rounded-lg bg-slate-800/50 p-3"><p className="text-sm text-slate-400">Fournisseur : <span className="font-semibold text-white">{selectedFournisseur?.nom}</span></p><p className="text-sm text-slate-400">Dépôt actif : <span className="font-bold text-cyan-400">{depotId}</span></p></div><FormField label="Articles reçus" name="articles" required placeholder="Ex. 10x Bouteille 1L, 5x Casier" /></div></FormModal>

      {showModal === 'commandes' && selectedFournisseur && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={closeActionModal}><div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black text-white">Historique commandes - {selectedFournisseur.nom}</h2><button type="button" onClick={closeActionModal} className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white" aria-label="Fermer"><X size={18} /></button></div>{commandes.length === 0 ? <p className="py-6 text-center text-slate-500">Aucune commande passée</p> : <div className="max-h-[400px] space-y-2 overflow-y-auto">{commandes.map((commande, index) => <div key={commande.id || `${commande.date || 'commande'}-${index}`} className="flex items-center justify-between rounded-xl bg-slate-800 p-3"><div><p className="text-sm text-white">{commande.date ? new Date(commande.date).toLocaleDateString('fr-FR') : '-'}</p><p className="text-xs text-slate-500">{commande.articles || '-'}</p></div><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${commande.statut === 'RECUE' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-amber-500/30 bg-amber-500/10 text-amber-400'}`}>{commande.statut || 'EN_ATTENTE'}</span></div>)}</div>}</div></div>}

      {showModal === 'regler' && selectedFournisseur && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={closeActionModal}><div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}><h2 className="mb-2 text-lg font-black text-white">Règlement fournisseur</h2><p className="mb-4 text-sm text-slate-400">{selectedFournisseur.nom} - Dette : {Number(selectedFournisseur.dette ?? selectedFournisseur.solde ?? 0).toLocaleString('fr-FR')} FCFA</p><input type="number" min="1" step="1" inputMode="numeric" placeholder="Montant à régler" value={detteData.montant} onChange={(e) => setDetteData({ montant: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white" /><div className="mt-6 flex gap-3"><button type="button" onClick={closeActionModal} className="flex-1 rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-700">Annuler</button><button type="button" onClick={() => handleReglerDette(selectedFournisseur)} disabled={reglerDetteMutation.isPending} className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50">{reglerDetteMutation.isPending ? 'Enregistrement…' : 'Régler'}</button></div></div></div>}

      <FournisseurForm isOpen={formOpen} onClose={() => { setFormOpen(false); setEditItem(null); }} edit={editItem} metier="depot-boissons" />
    </div>
  );
}
