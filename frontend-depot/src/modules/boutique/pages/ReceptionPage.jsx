import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePagination } from '../../../hooks/usePagination';
import { useNotif } from '../../../context/NotifContext';
import { useDepot } from '../../../contexts/DepotContext';
import { useAuth } from '../../../contexts/AuthContext';
import FormModal from '../../../shared/components/forms/FormModal';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
import { usePermission } from '../../../shared/hooks/usePermission';
import { PERMISSIONS } from '../permissions';
import { boutiqueApi } from '../services/boutiqueApi';
import { Trash2, Plus, Eye, Package, Lock, Edit3 } from 'lucide-react';

const STATUTS_RECEPTION = [
  { id: 'EN_ATTENTE', label: 'En attente', color: 'amber' },
  { id: 'EN_COURS', label: 'En cours', color: 'blue' },
  { id: 'VALIDEE', label: 'Validée', color: 'emerald' },
  { id: 'PARTIEL', label: 'Partielle', color: 'blue' },
  { id: 'ANNULEE', label: 'Annulée', color: 'red' },
];

function StatutBadge({ statut }) {
  const s = STATUTS_RECEPTION.find(x => x.id === statut) || { id: 'UNKNOWN', label: statut || 'Inconnu', color: 'gray' };
  const colors = {
    amber: 'bg-amber-500/20 text-amber-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    blue: 'bg-blue-500/20 text-blue-400',
    red: 'bg-red-500/20 text-red-400',
    gray: 'bg-gray-500/20 text-gray-400'
  };
  return <span className={`text-xs font-bold px-2 py-1 rounded-full ${colors[s.color]}`}>{s.label}</span>;
}

export default function ReceptionPage() {
  const queryClient = useQueryClient();
  const { depotId } = useDepot();
  const { tenantId } = useAuth();
  const notif = useNotif();

  const perm = usePermission(PERMISSIONS, 'receptions');

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [articles, setArticles] = useState([]);
  const [lignes, setLignes] = useState([]);

  const [form, setForm] = useState({
    fournisseurId: '',
    dateReception: new Date().toISOString().slice(0, 10),
    numBordereau: '',
    notes: ''
  });

  const setF = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  useEffect(() => {
    if (!tenantId || !depotId) return;
    Promise.all([
      boutiqueApi.getFournisseurs({ depotId }),
      boutiqueApi.getArticles({ depotId }),
    ]).then(([fournisseursRes, articlesRes]) => {
      const fData = fournisseursRes.data?.data ?? fournisseursRes.data ?? [];
      const aData = articlesRes.data?.data ?? articlesRes.data ?? [];
      setFournisseurs(Array.isArray(fData) ? fData : []);
      setArticles(Array.isArray(aData) ? aData : []);
    }).catch((error) => {
      console.error('Erreur chargement réception:', error);
      notif.error('Impossible de charger les fournisseurs et articles.', 'Échec');
    });
  }, [tenantId, depotId, notif]);

  const { data: receptionsData = [], isLoading: loading } = useQuery({
    queryKey: ['boutique-receptions', tenantId, depotId],
    queryFn: async () => {
      const res = await boutiqueApi.getReceptions({ depotId });
      return res.data;
    },
    enabled: !!tenantId && !!depotId,
  });

  const receptions = Array.isArray(receptionsData?.data)
    ? receptionsData.data
    : (Array.isArray(receptionsData) ? receptionsData : []);

  const validateMutation = useMutation({
    mutationFn: async (reception) => {
      if (!reception?.id || !depotId) throw new Error('Réception ou dépôt invalide');
      if (reception.depotId && String(reception.depotId) !== String(depotId)) {
        throw new Error('Cette réception appartient à un autre dépôt');
      }
      const res = await boutiqueApi.updateReception(reception.id, {
        statut: 'VALIDEE',
        depotId,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boutique-receptions'] });
      queryClient.invalidateQueries({ queryKey: ['boutique-stock'] });
      queryClient.invalidateQueries({ queryKey: ['boutique-articles'] });
      queryClient.invalidateQueries({ queryKey: ['boutique-dashboard'] });
      notif.success('Réception validée avec succès et stock mis à jour');
    },
    onError: (error) => notif.error(error.response?.data?.message || error.message || 'Erreur lors de la validation', 'Échec'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (reception) => {
      if (!reception?.id || !depotId) throw new Error('Réception ou dépôt invalide');
      if (reception.depotId && String(reception.depotId) !== String(depotId)) {
        throw new Error('Cette réception appartient à un autre dépôt');
      }
      const res = await boutiqueApi.deleteReception(reception.id);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boutique-receptions'] });
      notif.success('Brouillon de réception supprimé avec succès');
      setConfirmDelete(null);
    },
    onError: (error) => notif.error(error.response?.data?.message || error.message || 'Impossible de supprimer ce brouillon.', 'Échec'),
  });

  const filtres = receptions.filter(item =>
    !search || JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
  );

  const { currentPage, goToPage, totalPages, totalItems, paginatedData: paginated } = usePagination(filtres, 10);

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (isViewOnly) return;
    if (!depotId) return notif.error('Aucun dépôt actif sélectionné.', 'Erreur');
    if (!form.fournisseurId) return notif.error('Veuillez sélectionner un fournisseur.', 'Formulaire incomplet');
    if (!form.dateReception) return notif.error('Veuillez renseigner la date de réception.', 'Formulaire incomplet');
    if (!form.numBordereau.trim()) return notif.error('Le N° de bon de commande / bordereau est requis.', 'Formulaire incomplet');

    const lignesValides = lignes.filter(l => l.articleId && Number(l.qte) > 0 && Number(l.prixUnitaire) >= 0);
    if (lignesValides.length === 0) {
      return notif.error('Veuillez ajouter au moins un article avec une quantité et un prix valides.', 'Formulaire incomplet');
    }

    if (!editItem && !perm.canCreate) return notif.error('Vous n’avez pas la permission de créer une réception.', 'Accès refusé');
    if (editItem && !perm.canEdit) return notif.error('Vous n’avez pas la permission de modifier une réception.', 'Accès refusé');

    setFormLoading(true);
    try {
      const payload = {
        fournisseurId: form.fournisseurId,
        dateReception: form.dateReception,
        numBordereau: form.numBordereau.trim(),
        notes: form.notes.trim(),
        depotId,
        lignes: lignesValides.map(l => ({
          articleId: l.articleId,
          quantiteLivree: Number(l.qte),
          prixAchatUnitaire: Number(l.prixUnitaire),
        })),
      };

      if (editItem) {
        if (editItem.depotId && String(editItem.depotId) !== String(depotId)) {
          throw new Error('Impossible de modifier une réception d’un autre dépôt.');
        }
        await boutiqueApi.updateReception(editItem.id, payload);
        notif.success('Réception modifiée avec succès');
      } else {
        await boutiqueApi.createReception(payload);
        notif.success('Réception créée avec succès');
      }

      setFormOpen(false);
      setEditItem(null);
      queryClient.invalidateQueries({ queryKey: ['boutique-receptions'] });
      queryClient.invalidateQueries({ queryKey: ['boutique-stock'] });
    } catch (error) {
      console.error('Erreur soumission réception:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const message = error.response?.data?.message || error.message || "Impossible d'enregistrer les données.";
      notif.error(message, 'Échec');
    } finally {
      setFormLoading(false);
    }
  };

  const openCreate = () => {
    if (!depotId) return notif.error('Aucun dépôt actif sélectionné.', 'Erreur');
    if (!perm.canCreate) return notif.error('Vous n’avez pas la permission de créer une réception.', 'Accès refusé');
    setEditItem(null);
    setIsViewOnly(false);
    setForm({
      fournisseurId: '',
      dateReception: new Date().toISOString().slice(0, 10),
      numBordereau: '',
      notes: ''
    });
    setLignes([{ articleId: '', qte: 1, prixUnitaire: 0 }]);
    setFormOpen(true);
  };

  const openEdit = (reception, viewOnly = false) => {
    if (!reception?.id) return;
    if (reception.depotId && String(reception.depotId) !== String(depotId)) {
      return notif.error('Cette réception appartient à un autre dépôt.', 'Accès refusé');
    }
    if (!viewOnly && !perm.canEdit) return notif.error('Vous n’avez pas la permission de modifier une réception.', 'Accès refusé');

    // Ensure articles are loaded before opening the form
    if (articles.length === 0) {
      boutiqueApi.getArticles({ depotId }).then((res) => {
        const aData = res.data?.data ?? res.data ?? [];
        setArticles(Array.isArray(aData) ? aData : []);
      });
    }

    setEditItem(reception);
    setIsViewOnly(viewOnly);
    setForm({
      fournisseurId: reception.fournisseurId || '',
      dateReception: reception.dateReception ? reception.dateReception.slice(0, 10) : (reception.createdAt ? reception.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10)),
      numBordereau: reception.numBordereau || '',
      notes: reception.notes || ''
    });

    if (reception.lignes?.length) {
      setLignes(reception.lignes.map(l => ({
        articleId: l.articleId || '',
        qte: l.quantiteLivree ?? l.quantite ?? 1,
        prixUnitaire: l.prixAchatUnitaire ?? l.prixUnitaire ?? 0
      })));
    } else {
      setLignes([{ articleId: '', qte: 1, prixUnitaire: 0 }]);
    }
    setFormOpen(true);
  };

  const handleDeleteClick = (reception) => {
    if (!perm.canDelete) return notif.error('Vous n’avez pas la permission de supprimer une réception.', 'Accès refusé');
    if (!reception?.id) return;
    if (reception.statut !== 'EN_ATTENTE' && reception.statut !== 'EN_COURS') {
      return notif.error('Seuls les brouillons de réception peuvent être supprimés.', 'Action refusée');
    }
    if (reception.depotId && String(reception.depotId) !== String(depotId)) {
      return notif.error('Cette réception appartient à un autre dépôt.', 'Accès refusé');
    }
    setConfirmDelete(reception);
  };

  const confirmDeleteHandler = () => {
    if (!confirmDelete) return;
    setDeleting(true);
    deleteMutation.mutate(confirmDelete);
    setDeleting(false);
  };

  const addLigne = () => {
    if (isViewOnly) return;
    setLignes(prev => [...prev, { articleId: '', qte: 1, prixUnitaire: 0 }]);
  };

  const removeLigne = (i) => {
    if (isViewOnly || lignes.length <= 1) return;
    setLignes(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateLigne = (i, field, value) => {
    if (isViewOnly) return;
    setLignes(prev => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [field]: value };
      if (field === 'articleId') {
        const art = articles.find(x => x.id === value);
        if (art) copy[i].prixUnitaire = art.prixAchat ?? art.prixAchatUnitaire ?? 0;
      }
      return copy;
    });
  };

  const total = lignes.reduce((s, l) => s + (Number(l.qte) || 0) * (Number(l.prixUnitaire) || 0), 0);

  if (!depotId) {
    return <div className="p-8 text-center text-amber-400 font-semibold">Sélectionnez un dépôt actif pour consulter les réceptions.</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Réceptions</h1>
          <p className="text-slate-400 text-sm mt-1">{totalItems} réception{totalItems !== 1 ? 's' : ''}</p>
        </div>
        {perm.canCreate && (
          <button onClick={openCreate} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-cyan-600/20">
            <Plus size={16} className="inline mr-1" />Nouvelle Réception
          </button>
        )}
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher une réception (Fournisseur, BC...)"
          value={search}
          onChange={e => { setSearch(e.target.value); goToPage(1); }}
          className="w-full max-w-md bg-slate-800/60 border border-slate-700/50 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-cyan-500"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : totalItems === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 mx-auto text-slate-500" />
          <p className="text-slate-400 font-semibold mt-4">Aucune réception enregistrée</p>
        </div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="text-left px-5 py-4">Date</th>
                <th className="text-left px-5 py-4">Fournisseur</th>
                <th className="text-left px-5 py-4">N° BC</th>
                <th className="text-right px-5 py-4">Quantité</th>
                <th className="text-right px-5 py-4">Montant</th>
                <th className="text-center px-5 py-4">Statut</th>
                <th className="text-center px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.map(r => {
                const f = fournisseurs.find(x => x.id === r.fournisseurId);
                const isEditable = r.statut === 'EN_ATTENTE' || r.statut === 'EN_COURS';
                const canValidate = perm.canEdit && r.statut !== 'VALIDEE' && r.statut !== 'ANNULEE';
                // Compute total quantite and montant from lignes
                const totalQuantite = (r.lignes || []).reduce((sum, l) => sum + (Number(l.quantiteLivree) || 0), 0);
                const totalMontant = (r.lignes || []).reduce((sum, l) => sum + (Number(l.quantiteLivree) || 0) * (Number(l.prixAchatUnitaire) || 0), 0);
                return (
                  <tr key={r.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-5 py-4 text-slate-300 text-sm">
                      {r.dateReception ? new Date(r.dateReception).toLocaleDateString('fr-FR') : (r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : '')}
                    </td>
                    <td className="px-5 py-4 text-white font-semibold text-sm">{f?.nom || 'Fournisseur inconnu'}</td>
                    <td className="px-5 py-4 text-slate-400 text-sm">{r.numBordereau || 'N/A'}</td>
                    <td className="px-5 py-4 text-right text-white font-bold text-sm">{totalQuantite.toLocaleString('fr-FR')}</td>
                    <td className="px-5 py-4 text-right text-cyan-400 font-bold text-sm">{totalMontant.toLocaleString('fr-FR')} F</td>
                    <td className="px-5 py-4 text-center"><StatutBadge statut={r.statut} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => openEdit(r, true)} className="text-slate-400 hover:text-white transition-colors" title="Consulter">
                          <Eye size={16} />
                        </button>
                        {isEditable && perm.canEdit && (
                          <button onClick={() => openEdit(r, false)} className="text-cyan-400 hover:text-cyan-300 transition-colors" title="Modifier">
                            <Edit3 size={16} />
                          </button>
                        )}
                        {canValidate && (
                          <button onClick={() => validateMutation.mutate(r)} className="text-emerald-400 hover:text-emerald-300 transition-colors" title="Valider">
                            <Lock size={16} />
                          </button>
                        )}
                        {isEditable && perm.canDelete && (
                          <button onClick={() => handleDeleteClick(r)} className="text-red-400 hover:text-red-300 transition-colors" title="Supprimer">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          <button disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)} className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40">◀ Précédent</button>
          <span className="text-slate-400 text-sm">Page {currentPage} / {totalPages}</span>
          <button disabled={currentPage >= totalPages} onClick={() => goToPage(currentPage + 1)} className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40">Suivant ▶</button>
        </div>
      )}

      <FormModal
        isOpen={formOpen}
        onClose={() => { if (!formLoading) setFormOpen(false); }}
        onSubmit={handleSubmit}
        title={isViewOnly ? 'Détails de la réception' : editItem ? 'Modifier la réception' : 'Nouvelle réception'}
        loading={formLoading}
        size="lg"
        submitLabel={isViewOnly ? null : 'Enregistrer la réception'}
      >
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Fournisseur *</label>
            <select required disabled={isViewOnly || formLoading} value={form.fournisseurId} onChange={setF('fournisseurId')} className="w-full bg-slate-800 border border-slate-600 disabled:opacity-60 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-500">
              <option value="">Choisir</option>
              {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Date de réception *</label>
            <input required disabled={isViewOnly || formLoading} type="date" value={form.dateReception} onChange={setF('dateReception')} className="w-full bg-slate-800 border border-slate-600 disabled:opacity-60 focus:border-cyan-500 text-white rounded-xl px-4 py-3 text-sm outline-none" />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">N° Bon de commande / Bordereau *</label>
            <input required disabled={isViewOnly || formLoading} value={form.numBordereau} onChange={setF('numBordereau')} placeholder="Ex: BC-2026-XXXX" className="w-full bg-slate-800 border border-slate-600 disabled:opacity-60 focus:border-cyan-500 text-white rounded-xl px-4 py-3 text-sm outline-none" />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Notes / Observations</label>
            <input disabled={isViewOnly || formLoading} value={form.notes} onChange={setF('notes')} placeholder="Renseignements complémentaires..." className="w-full bg-slate-800 border border-slate-600 disabled:opacity-60 focus:border-cyan-500 text-white rounded-xl px-4 py-3 text-sm outline-none" />
          </div>
        </div>

        <div className="px-4 py-3 mb-4 bg-slate-900/50 border border-slate-700/50 rounded-xl text-slate-400 text-sm">
          Dépôt actif : <span className="text-white font-bold">{depotId}</span>
        </div>

        <div className="border-t border-slate-700/60 pt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest">Articles reçus</label>
            {!isViewOnly && (
              <button type="button" onClick={addLigne} className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-xs font-bold transition-colors">
                <Plus size={14} /> Ajouter une ligne
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
            {lignes.map((l, i) => (
              <div key={`${l.articleId || 'new'}-${i}`} className="grid grid-cols-12 gap-2 items-center bg-slate-900/30 p-1.5 rounded-xl border border-slate-800/40">
                <select
                  required
                  disabled={isViewOnly || formLoading}
                  value={l.articleId}
                  onChange={e => updateLigne(i, 'articleId', e.target.value)}
                  className="col-span-6 bg-slate-800 border border-slate-600 disabled:opacity-60 text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:border-cyan-500"
                >
                  <option value="">Sélectionner l'article...</option>
                  {articles.map(p => <option key={p.id} value={p.id}>{p.designation} {p.codeBarres ? `(${p.codeBarres})` : ''}</option>)}
                </select>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  disabled={isViewOnly || formLoading}
                  value={l.qte}
                  onChange={e => updateLigne(i, 'qte', e.target.value)}
                  placeholder="Qté"
                  className="col-span-2 bg-slate-800 border border-slate-600 disabled:opacity-60 focus:border-cyan-500 text-white rounded-xl px-3 py-2.5 text-xs outline-none text-center"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  disabled={isViewOnly || formLoading}
                  value={l.prixUnitaire}
                  onChange={e => updateLigne(i, 'prixUnitaire', e.target.value)}
                  placeholder="Prix unitaire"
                  className="col-span-3 bg-slate-800 border border-slate-600 disabled:opacity-60 focus:border-cyan-500 text-white rounded-xl px-3 py-2.5 text-xs outline-none text-right"
                />
                <button
                  type="button"
                  onClick={() => removeLigne(i)}
                  disabled={lignes.length === 1 || isViewOnly || formLoading}
                  className="col-span-1 p-2 text-red-400 hover:text-red-300 disabled:opacity-40 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 text-right text-cyan-400 font-bold text-sm">
            Total : {total.toLocaleString('fr-FR')} F
          </div>
        </div>
      </FormModal>

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteHandler}
        title="Supprimer la réception"
        message="Êtes-vous sûr de vouloir supprimer définitivement ce brouillon de réception ?"
        loading={deleting}
        confirmLabel="Supprimer"
      />
    </div>
  );
}
