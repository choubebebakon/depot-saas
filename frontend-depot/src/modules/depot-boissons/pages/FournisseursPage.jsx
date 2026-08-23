import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePagination } from '../../../hooks/usePagination';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotif } from '../../../context/NotifContext';
import { usePermission } from '../../../shared/hooks/usePermission';
import { depotApi } from '../services/depotApi';
import FournisseurForm from '../../../shared/forms/FournisseurForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';

const LIMIT = 100;

export default function FournisseursPage() {
  const { metier, user } = useAuth();
  const queryClient = useQueryClient();
  const notif = useNotif();
  const { canWrite } = usePermission('fournisseurs');

  const [showModal, setShowModal] = useState(null);
  const [selectedFournisseur, setSelectedFournisseur] = useState(null);
  const [commandes, setCommandes] = useState([]);
  const [detteData, setDetteData] = useState({ montant: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [commandeData, setCommandeData] = useState({ articles: '' });
  const [receptionData, setReceptionData] = useState({ articles: '' });

  if (metier !== 'DEPOT_BOISSONS') {
    return <div className="p-8 text-center text-red-400">AccÃ¨s non autorisÃ©</div>;
  }

  // Fetch providers via useQuery
  const { data: providersData, isLoading } = useQuery({
    queryKey: ['depot-fournisseurs'],
    queryFn: async () => {
      const res = await depotApi.getFournisseurs({ page: 1, limit: LIMIT });
      return res.data?.data || res.data || [];
    },
    enabled: metier === 'DEPOT_BOISSONS',
  });

  const fournisseurs = Array.isArray(providersData) ? providersData : (providersData?.data || []);
  const total = fournisseurs.length;

  const {
    currentPage,
    setCurrentPage,
    nextPage,
    prevPage,
    totalPages,
    totalItems,
    paginatedData: paginated,
  } = usePagination(fournisseurs, 10);

  const openCreate = () => { setEditItem(null); setFormOpen(true); };
  const openEdit = (f) => { setEditItem(f); setFormOpen(true); };

  const commanderMutation = useMutation({
    mutationFn: ({ fournisseurId, articles, depotId, userId }) =>
      depotApi.passerCommandeFournisseur({ fournisseurId, articles, depotId, userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-fournisseurs'] });
      queryClient.invalidateQueries({ queryKey: ['depot-fournisseurs-commandes'] });
      queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] });
      notif.success('Commande envoyÃ©e avec succÃ¨s');
      setShowModal(null);
      setCommandeData({ articles: '' });
      setSelectedFournisseur(null);
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Erreur lors de l\'envoi de la commande');
    }
  });

  const receptionnerMutation = useMutation({
    mutationFn: ({ fournisseurId, articles, depotId }) =>
      depotApi.receptionnerLivraison(fournisseurId, { articles, depotId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-fournisseurs'] });
      queryClient.invalidateQueries({ queryKey: ['depot-fournisseurs-commandes'] });
      queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] });
      notif.success('Livraison rÃ©ceptionnÃ©e avec succÃ¨s');
      setShowModal(null);
      setReceptionData({ articles: '' });
      setSelectedFournisseur(null);
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Erreur lors de la rÃ©ception');
    }
  });

  const reglerDetteMutation = useMutation({
    mutationFn: ({ fournisseurId, montant }) =>
      depotApi.reglerDetteFournisseur(fournisseurId, { montant }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-fournisseurs'] });
      queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] });
      notif.success('RÃ¨glement enregistrÃ© avec succÃ¨s');
      setShowModal(null);
      setDetteData({ montant: '' });
      setSelectedFournisseur(null);
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Erreur lors du rÃ¨glement');
    }
  });

  const handleCommander = (fournisseur) => {
    setSelectedFournisseur(fournisseur);
    setShowModal('commander');
  };

  const handleReceptionner = (fournisseur) => {
    setSelectedFournisseur(fournisseur);
    setShowModal('receptionner');
  };

  const handleCommanderSubmit = (data) => {
    const depotId = user?.depotActif?.id;
    if (!depotId) {
      notif.error('DÃ©pÃ´t actif non trouvÃ©');
      return;
    }
    commanderMutation.mutate({
      fournisseurId: selectedFournisseur.id,
      articles: data.articles,
      depotId,
      userId: user?.id,
    });
  };

  const handleReceptionnerSubmit = (data) => {
    const depotId = user?.depotActif?.id;
    if (!depotId) {
      notif.error('DÃ©pÃ´t actif non trouvÃ©');
      return;
    }
    receptionnerMutation.mutate({
      fournisseurId: selectedFournisseur.id,
      articles: data.articles,
      depotId,
    });
  };

  const handleReglerDette = (fournisseurId) => {
    if (!detteData.montant || isNaN(detteData.montant)) return;
    reglerDetteMutation.mutate({
      fournisseurId,
      montant: parseInt(detteData.montant)
    });
  };

  const handleVoirCommandes = async (fournisseur) => {
    try {
      const res = await depotApi.historiqueCommandes(fournisseur.id);
      setCommandes(res.data?.data || res.data || []);
      setSelectedFournisseur(fournisseur);
    } catch (err) {
      notif.error(err.response?.data?.message || 'Erreur de chargement des commandes');
    }
  };

  if (isLoading && totalItems === 0) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-800/60 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Fournisseurs</h1>
          <p className="text-slate-400 text-sm mt-1">{total} fournisseur{total > 1 ? 's' : ''}</p>
        </div>
        {canWrite && (
          <button onClick={openCreate}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-blue-600/20">
            âž• Nouveau fournisseur
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {totalItems === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <p className="text-3xl mb-3">ðŸ¤</p>
            <p className="text-lg font-medium">Aucun fournisseur</p>
            <p className="text-sm mt-1">Ajoutez votre premier fournisseur</p>
          </div>
        ) : paginated.map(f => {
          const dette = Number(f.dette || 0);
          return (
            <div key={f.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 hover:border-blue-500/30 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-bold">{f.nom}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{f.telephone || '-'}</p>
                    {f.email && <p className="text-xs text-slate-500">{f.email}</p>}
                  </div>
                  {canWrite && (
                    <button onClick={() => openEdit(f)} className="text-slate-500 hover:text-white text-xs">âœï¸ Modifier</button>
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
                    <button onClick={() => handleCommander(f)} disabled={commanderMutation.isPending}
                      className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] transition-all">Commander</button>
                    <button onClick={() => handleReceptionner(f)} disabled={receptionnerMutation.isPending}
                      className="px-3 py-1.5 bg-blue-600/80 hover:bg-blue-500 text-white font-bold rounded-lg text-[10px] transition-all">RÃ©ceptionner</button>
                    {dette > 0 && (
                      <button onClick={() => { setSelectedFournisseur(f); setShowModal('regler'); }}
                        className="px-3 py-1.5 bg-amber-600/80 hover:bg-amber-500 text-white font-bold rounded-lg text-[10px] transition-all">RÃ©gler</button>
                    )}
                  </>
                )}
                <button onClick={() => handleVoirCommandes(f)}
                  className="px-3 py-1.5 bg-slate-600/80 hover:bg-slate-500 text-white font-bold rounded-lg text-[10px] transition-all">Commandes</button>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button disabled={currentPage <= 1} onClick={prevPage}
            className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-slate-700 transition-all">â—€ PrÃ©cÃ©dent</button>
          <span className="text-slate-400 text-sm">Page {currentPage} / {totalPages}</span>
          <button disabled={currentPage >= totalPages} onClick={nextPage}
            className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-slate-700 transition-all">Suivant â–¶</button>
        </div>
      )}

      {/* Modal Commander */}
      <FormModal
        isOpen={showModal === 'commander'}
        onClose={() => { setShowModal(null); setCommandeData({ articles: '' }); setSelectedFournisseur(null); }}
        onSubmit={handleCommanderSubmit}
        title="ðŸ“¦ Commander au fournisseur"
        loading={commanderMutation.isPending}
        size="sm"
        submitLabel="Envoyer commande"
      >
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-slate-400 text-sm">Fournisseur: <span className="text-white font-semibold">{selectedFournisseur?.nom}</span></p>
            <p className="text-slate-400 text-sm">DÃ©pÃ´t ID: <span className={user?.depotActif?.id ? "text-cyan-400 font-bold" : "text-red-400 font-bold"}>{user?.depotActif?.id || "Non dÃ©fini"}</span></p>
          </div>
          {!user?.depotActif?.id && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">
              âš ï¸ DÃ©pÃ´t actif non trouvÃ©. Veuillez sÃ©lectionner un dÃ©pÃ´t actif.
            </div>
          )}
          <FormField
            label="Articles Ã  commander"
            name="articles"
            required
            placeholder="Liste des articles (ex: 10x Bouteille 1L, 5x Casier)"
          />
        </div>
      </FormModal>

      {/* Modal RÃ©ceptionner */}
      <FormModal
        isOpen={showModal === 'receptionner'}
        onClose={() => { setShowModal(null); setReceptionData({ articles: '' }); setSelectedFournisseur(null); }}
        onSubmit={handleReceptionnerSubmit}
        title="ðŸ“¥ RÃ©ceptionner livraison"
        loading={receptionnerMutation.isPending}
        size="sm"
        submitLabel="RÃ©ceptionner"
      >
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-slate-400 text-sm">Fournisseur: <span className="text-white font-semibold">{selectedFournisseur?.nom}</span></p>
            <p className="text-slate-400 text-sm">DÃ©pÃ´t ID: <span className={user?.depotActif?.id ? "text-cyan-400 font-bold" : "text-red-400 font-bold"}>{user?.depotActif?.id || "Non dÃ©fini"}</span></p>
          </div>
          {!user?.depotActif?.id && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">
              âš ï¸ DÃ©pÃ´t actif non trouvÃ©. Veuillez sÃ©lectionner un dÃ©pÃ´t actif.
            </div>
          )}
          <FormField
            label="Articles reÃ§us"
            name="articles"
            required
            placeholder="Liste des articles reÃ§us (ex: 10x Bouteille 1L, 5x Casier)"
          />
        </div>
      </FormModal>

      {selectedFournisseur && showModal !== 'regler' && showModal !== 'commander' && showModal !== 'receptionner' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => { setSelectedFournisseur(null); setCommandes([]); }}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-white">Historique commandes - {selectedFournisseur.nom}</h2>
              <button onClick={() => { setSelectedFournisseur(null); setCommandes([]); }} className="text-slate-500 hover:text-white">âœ•</button>
            </div>
            {commandes.length === 0 ? (
              <p className="text-slate-500 text-center py-6">Aucune commande passÃ©e</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {commandes.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl">
                    <div>
                      <p className="text-sm text-white">{new Date(c.date).toLocaleDateString('fr-FR')}</p>
                      <p className="text-xs text-slate-500">{c.articles || '-'}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      c.statut === 'RECUE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>{c.statut || 'EN_ATTENTE'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showModal === 'regler' && selectedFournisseur && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-black text-white mb-2">RÃ¨glement fournisseur</h2>
            <p className="text-sm text-slate-400 mb-4">{selectedFournisseur.nom} - Dette: {Number(selectedFournisseur.dette || 0).toLocaleString('fr-FR')} FCFA</p>
            <input type="number" placeholder="Montant Ã  rÃ©gler" value={detteData.montant}
              onChange={e => setDetteData({ montant: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm" />
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModal(null); setDetteData({ montant: '' }); }}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-sm">Annuler</button>
              <button onClick={() => handleReglerDette(selectedFournisseur.id)} disabled={reglerDetteMutation.isPending}
                className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all text-sm">
                {reglerDetteMutation.isPending ? 'Enregistrement...' : 'RÃ©gler'}
              </button>
            </div>
          </div>
        </div>
      )}

      <FournisseurForm isOpen={formOpen} onClose={() => setFormOpen(false)} edit={editItem} metier="depot-boissons" />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={() => setConfirmDelete(null)} onCancel={() => setConfirmDelete(null)}
        title="Supprimer" message={`Supprimer ce fournisseur ? Cette action est irrÃ©versible.`} />
    </div>
  );
}

