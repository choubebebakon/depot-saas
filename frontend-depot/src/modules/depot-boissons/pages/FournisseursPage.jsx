import { useMemo, useState } from 'react';
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

  const {
    data: providersData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['depot-fournisseurs', depotId],
    queryFn: async () => {
      const res = await depotApi.getFournisseurs({ page: 1, limit: LIMIT, depotId });
      return res.data?.data || res.data || [];
    },
    enabled: isDepotBoissons && hasDepotScope,
    staleTime: 30_000,
  });

  const fournisseurs = useMemo(() => {
    const raw = Array.isArray(providersData)
      ? providersData
      : (providersData?.data || []);
    const term = search.trim().toLowerCase();
    if (!term) return raw;
    return raw.filter((f) =>
      [f.nom, f.telephone, f.email, f.contact]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [providersData, search]);

  const total = fournisseurs.length;

  const {
    currentPage,
    nextPage,
    prevPage,
    totalPages,
    totalItems,
    paginatedData: paginated,
  } = usePagination(fournisseurs, 10);

  const invalidateFournisseurs = () => {
    queryClient.invalidateQueries({ queryKey: ['depot-fournisseurs', depotId] });
    queryClient.invalidateQueries({ queryKey: ['depot-fournisseurs'] });
    queryClient.invalidateQueries({ queryKey: ['depot-fournisseurs-commandes'] });
    queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] });
  };

  const closeActionModal = () => {
    setShowModal(null);
    setSelectedFournisseur(null);
    setDetteData({ montant: '' });
  };

  const commanderMutation = useMutation({
    mutationFn: ({ fournisseurId, articles }) =>
      depotApi.passerCommandeFournisseur({ fournisseurId, articles, depotId }),
    onSuccess: () => {
      invalidateFournisseurs();
      notif.success('Commande envoyée avec succès');
      setShowModal(null);
      setSelectedFournisseur(null);
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Erreur lors de l’envoi de la commande');
    },
  });

  const receptionnerMutation = useMutation({
    mutationFn: ({ fournisseurId, articles }) =>
      depotApi.receptionnerLivraison(fournisseurId, { articles, depotId }),
    onSuccess: () => {
      invalidateFournisseurs();
      notif.success('Livraison réceptionnée avec succès');
      setShowModal(null);
      setSelectedFournisseur(null);
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Erreur lors de la réception');
    },
  });

  const reglerDetteMutation = useMutation({
    mutationFn: ({ fournisseurId, montant }) =>
      depotApi.reglerDetteFournisseur(fournisseurId, { montant, depotId }),
    onSuccess: () => {
      invalidateFournisseurs();
      notif.success('Règlement enregistré avec succès');
      closeActionModal();
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Erreur lors du règlement');
    },
  });

  const openCreate = () => {
    setEditItem(null);
    setFormOpen(true);
  };

  const openEdit = (fournisseur) => {
    setEditItem(fournisseur);
    setFormOpen(true);
  };

  const handleCommander = (fournisseur) => {
    setSelectedFournisseur(fournisseur);
    setShowModal('commander');
  };

  const handleReceptionner = (fournisseur) => {
    setSelectedFournisseur(fournisseur);
    setShowModal('receptionner');
  };

  const handleCommanderSubmit = (data) => {
    if (!hasDepotScope || !selectedFournisseur?.id) {
      notif.error('Dépôt actif introuvable. Impossible d’envoyer la commande.');
      return;
    }
    if (!String(data?.articles || '').trim()) {
      notif.error('Veuillez renseigner les articles à commander.');
      return;
    }
    commanderMutation.mutate({
      fournisseurId: selectedFournisseur.id,
      articles: String(data.articles).trim(),
    });
  };

  const handleReceptionnerSubmit = (data) => {
    if (!hasDepotScope || !selectedFournisseur?.id) {
      notif.error('Dépôt actif introuvable. Impossible d’enregistrer la réception.');
      return;
    }
    if (!String(data?.articles || '').trim()) {
      notif.error('Veuillez renseigner les articles reçus.');
      return;
    }
    receptionnerMutation.mutate({
      fournisseurId: selectedFournisseur.id,
      articles: String(data.articles).trim(),
    });
  };

  const handleReglerDette = (fournisseur) => {
    const montant = Number(detteData.montant);
    const dette = Number(fournisseur?.dette || 0);

    if (!Number.isFinite(montant) || montant <= 0) {
      notif.error('Le montant du règlement doit être supérieur à zéro.');
      return;
    }
    if (montant > dette) {
      notif.error('Le règlement ne peut pas dépasser la dette du fournisseur.');
      return;
    }
    if (!hasDepotScope) {
      notif.error('Dépôt actif introuvable.');
      return;
    }

    reglerDetteMutation.mutate({
      fournisseurId: fournisseur.id,
      montant,
    });
  };

  const handleVoirCommandes = async (fournisseur) => {
    if (!hasDepotScope || !fournisseur?.id) {
      notif.error('Dépôt actif introuvable.');
      return;
    }
    try {
      const res = await depotApi.historiqueCommandes(fournisseur.id);
      setCommandes(res.data?.data || res.data || []);
      setSelectedFournisseur(fournisseur);
      setShowModal('commandes');
    } catch (err) {
      notif.error(err.response?.data?.message || 'Erreur de chargement des commandes');
    }
  };

  if (!isDepotBoissons) {
    return <div className="p-8 text-center text-red-400">Accès non autorisé</div>;
  }

  if (!hasDepotScope) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-red-400 font-bold">Dépôt actif introuvable</p>
        <p className="text-slate-500 text-sm">Sélectionnez un dépôt actif avant de consulter les fournisseurs.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-800/60 rounded-xl" />)}
      </div>
    );
  }

  if (isError) {
    const status = error?.response?.status;
    const message = status === 403
      ? 'Accès refusé pour ce dépôt.'
      : status === 404
        ? 'Ressource fournisseurs introuvable.'
        : 'Impossible de charger les fournisseurs.';

    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-red-400 font-bold">{message}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-bold text-sm"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Fournisseurs</h1>
          <p className="text-slate-400 text-sm mt-1">{total} fournisseur{total > 1 ? 's' : ''}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher nom, téléphone, email…"
            className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-blue-500"
          />
          {canWrite && (
            <button
              type="button"
              onClick={openCreate}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              ➕ Nouveau fournisseur
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {totalItems === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <p className="text-3xl mb-3">🤝</p>
            <p className="text-lg font-medium">{search ? 'Aucun fournisseur trouvé' : 'Aucun fournisseur'}</p>
            <p className="text-sm mt-1">{search ? 'Modifiez votre recherche.' : 'Ajoutez votre premier fournisseur.'}</p>
          </div>
        ) : paginated.map((fournisseur) => {
          const dette = Number(fournisseur.dette || 0);
          return (
            <div key={fournisseur.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 hover:border-blue-500/30 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-bold">{fournisseur.nom}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{fournisseur.telephone || '-'}</p>
                    {fournisseur.email && <p className="text-xs text-slate-500">{fournisseur.email}</p>}
                  </div>
                  {canWrite && (
                    <button type="button" onClick={() => openEdit(fournisseur)} className="text-slate-500 hover:text-white text-xs">
                      ✏️ Modifier
                    </button>
                  )}
                </div>
                {dette > 0 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 mb-3 text-center">
                    <p className="text-[10px] text-red-400 uppercase tracking-wider">Dette</p>
                    <p className="text-sm font-bold text-red-400">{dette.toLocaleString('fr-FR')} FCFA</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 mt-4">
                {canWrite && (
                  <>
                    <button type="button" onClick={() => handleCommander(fournisseur)} disabled={commanderMutation.isPending} className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg text-[10px] transition-all">
                      Commander
                    </button>
                    <button type="button" onClick={() => handleReceptionner(fournisseur)} disabled={receptionnerMutation.isPending} className="px-3 py-1.5 bg-blue-600/80 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-lg text-[10px] transition-all">
                      Réceptionner
                    </button>
                    {dette > 0 && (
                      <button type="button" onClick={() => { setSelectedFournisseur(fournisseur); setShowModal('regler'); }} className="px-3 py-1.5 bg-amber-600/80 hover:bg-amber-500 text-white font-bold rounded-lg text-[10px] transition-all">
                        Régler
                      </button>
                    )}
                  </>
                )}
                <button type="button" onClick={() => handleVoirCommandes(fournisseur)} className="px-3 py-1.5 bg-slate-600/80 hover:bg-slate-500 text-white font-bold rounded-lg text-[10px] transition-all">
                  Commandes
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button type="button" disabled={currentPage <= 1} onClick={prevPage} className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-slate-700 transition-all">
            ◀ Précédent
          </button>
          <span className="text-slate-400 text-sm">Page {currentPage} / {totalPages}</span>
          <button type="button" disabled={currentPage >= totalPages} onClick={nextPage} className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-slate-700 transition-all">
            Suivant ▶
          </button>
        </div>
      )}

      <FormModal
        isOpen={showModal === 'commander'}
        onClose={closeActionModal}
        onSubmit={handleCommanderSubmit}
        title="📦 Commander au fournisseur"
        loading={commanderMutation.isPending}
        size="sm"
        submitLabel="Envoyer commande"
      >
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-slate-400 text-sm">Fournisseur : <span className="text-white font-semibold">{selectedFournisseur?.nom}</span></p>
            <p className="text-slate-400 text-sm">Dépôt actif : <span className="text-cyan-400 font-bold">{depotId}</span></p>
          </div>
          <FormField label="Articles à commander" name="articles" required placeholder="Liste des articles (ex: 10x Bouteille 1L, 5x Casier)" />
        </div>
      </FormModal>

      <FormModal
        isOpen={showModal === 'receptionner'}
        onClose={closeActionModal}
        onSubmit={handleReceptionnerSubmit}
        title="📥 Réceptionner livraison"
        loading={receptionnerMutation.isPending}
        size="sm"
        submitLabel="Réceptionner"
      >
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-slate-400 text-sm">Fournisseur : <span className="text-white font-semibold">{selectedFournisseur?.nom}</span></p>
            <p className="text-slate-400 text-sm">Dépôt actif : <span className="text-cyan-400 font-bold">{depotId}</span></p>
          </div>
          <FormField label="Articles reçus" name="articles" required placeholder="Liste des articles reçus (ex: 10x Bouteille 1L, 5x Casier)" />
        </div>
      </FormModal>

      {showModal === 'commandes' && selectedFournisseur && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeActionModal}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-white">Historique commandes - {selectedFournisseur.nom}</h2>
              <button type="button" onClick={closeActionModal} className="text-slate-500 hover:text-white">✕</button>
            </div>
            {commandes.length === 0 ? (
              <p className="text-slate-500 text-center py-6">Aucune commande passée</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {commandes.map((commande, index) => (
                  <div key={commande.id || `${commande.date || 'commande'}-${index}`} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl">
                    <div>
                      <p className="text-sm text-white">{commande.date ? new Date(commande.date).toLocaleDateString('fr-FR') : '-'}</p>
                      <p className="text-xs text-slate-500">{commande.articles || '-'}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${commande.statut === 'RECUE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                      {commande.statut || 'EN_ATTENTE'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showModal === 'regler' && selectedFournisseur && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeActionModal}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-black text-white mb-2">Règlement fournisseur</h2>
            <p className="text-sm text-slate-400 mb-4">{selectedFournisseur.nom} - Dette : {Number(selectedFournisseur.dette || 0).toLocaleString('fr-FR')} FCFA</p>
            <input
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              placeholder="Montant à régler"
              value={detteData.montant}
              onChange={(e) => setDetteData({ montant: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
            />
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={closeActionModal} className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-sm">
                Annuler
              </button>
              <button type="button" onClick={() => handleReglerDette(selectedFournisseur)} disabled={reglerDetteMutation.isPending} className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all text-sm">
                {reglerDetteMutation.isPending ? 'Enregistrement…' : 'Régler'}
              </button>
            </div>
          </div>
        </div>
      )}

      <FournisseurForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditItem(null); }}
        edit={editItem}
        metier="depot-boissons"
      />
    </div>
  );
}
