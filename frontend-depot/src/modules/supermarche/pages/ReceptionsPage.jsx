import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePagination } from '../../../hooks/usePagination';
import { useNotif } from '../../../context/NotifContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useDepot } from '../../../contexts/DepotContext';
import api from '../../../api/axios';
import FormModal from '../../../shared/components/forms/FormModal';
import { usePermission } from '../../../shared/hooks/usePermission';
import { PERMISSIONS } from '../permissions';
import { Trash2, Plus, Edit3, Eye } from 'lucide-react';

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

export default function ReceptionsPage() {
  const { metier: metierParam } = useParams();
  const { metier: metierAuth, tenantId } = useAuth();
  const { depotId } = useDepot();
  const metier = metierParam || metierAuth || 'supermarche';
  const prefix = metier.toLowerCase().replace(/_/g, '-');
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [form, setForm] = useState({ 
    fournisseurId: '', 
    dateReception: new Date().toISOString().slice(0, 10), 
    numBordereau: '', 
    notes: '', 
    depotId: depotId || '' 
  });

  const { success, error: notifError } = useNotif();
  const perm = usePermission(PERMISSIONS, 'receptions');

  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [articles, setArticles] = useState([]);
  const [lignes, setLignes] = useState([]);

  const setF = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  useEffect(() => {
    if (tenantId) {
      api.get(`/${prefix}/fournisseurs`).then(r => setFournisseurs(r.data?.data || r.data || [])).catch(() => {});
      api.get(`/${prefix}/articles`).then(r => setArticles(r.data?.data || r.data || [])).catch(() => {});
    }
  }, [prefix, tenantId]);

  // Récupération principale
  const { data: receptionsData = [], isLoading: loading } = useQuery({
    queryKey: ['supermarche-receptions', tenantId, prefix],
    queryFn: async () => {
      const res = await api.get(`/${prefix}/receptions`);
      return res.data;
    },
    enabled: !!tenantId,
  });
  
  const receptions = Array.isArray(receptionsData?.data) ? receptionsData.data : (Array.isArray(receptionsData) ? receptionsData : []);

  // Mutation : Validation
  const validateMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.patch(`/${prefix}/receptions/${id}`, { statut: 'VALIDEE' });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supermarche-receptions'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['supermarche-articles'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['supermarche-stock'], exact: false });
      success('Réception validée avec succès et stock mis à jour');
    },
    onError: () => {
      notifError('Erreur lors de la validation', 'Échec');
    }
  });

  // Mutation : Suppression
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/${prefix}/receptions/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supermarche-receptions'], exact: false });
      success('Brouillon de réception supprimé avec succès');
    },
    onError: () => {
      notifError('Impossible de supprimer ce brouillon.', 'Échec');
    }
  });

  // Filtrage et Pagination
  const filtres = (receptions || []).filter(item =>
    !search || JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
  );

  const {
    currentPage,
    goToPage,
    totalPages,
    totalItems,
    paginatedData: paginated,
  } = usePagination(filtres, 10);

  // Soumission
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isViewOnly) return;
    
    const currentDepotId = depotId || form.depotId;
    if (!currentDepotId) {
      notifError('Veuillez sélectionner un dépôt de stockage.', 'Erreur');
      return;
    }

    const lignesValides = lignes.filter(l => l.articleId !== '' && Number(l.qte) > 0);
    if (lignesValides.length === 0) {
      notifError('Veuillez ajouter au moins un article avec une quantité valide.', 'Formulaire incomplet');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        fournisseurId: form.fournisseurId,
        numBordereau: form.numBordereau,
        notes: form.notes,
        depotId: currentDepotId,
        lignes: lignesValides.map(l => ({
          articleId: l.articleId,
          quantiteLivree: Number(l.qte),
          prixAchatUnitaire: Number(l.prixUnitaire),
        })),
      };

      if (editItem) {
        await api.patch(`/${prefix}/receptions/${editItem.id}`, payload);
        success('Réception modifiée avec succès');
      } else {
        await api.post(`/${prefix}/receptions`, payload);
        success('Réception créée avec succès');
      }
      
      setFormOpen(false);
      setEditItem(null);
      queryClient.invalidateQueries({ queryKey: ['supermarche-receptions'], exact: false });
    } catch (error) {
      console.error('Erreur soumission réception:', error);
      notifError("Impossible d'enregistrer les données.", 'Échec');
    } finally {
      setFormLoading(false);
    }
  };

  const openCreate = () => { 
    setEditItem(null);
    setIsViewOnly(false);
    setForm({ 
      fournisseurId: '', 
      dateReception: new Date().toISOString().slice(0, 10), 
      numBordereau: '', 
      notes: '', 
      depotId: depotId || '' 
    }); 
    setLignes([{ articleId: '', qte: 1, prixUnitaire: 0 }]); 
    setFormOpen(true); 
  };

  const openEdit = (reception, viewOnly = false) => {
    setEditItem(reception);
    setIsViewOnly(viewOnly);
    setForm({
      fournisseurId: reception.fournisseurId || '',
      dateReception: reception.createdAt ? reception.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
      numBordereau: reception.numBordereau || '',
      notes: reception.notes || '',
      depotId: reception.depotId || depotId || ''
    });
    
    if (reception.lignes && reception.lignes.length > 0) {
      setLignes(reception.lignes.map(l => ({
        articleId: l.articleId,
        qte: l.quantiteLivree || l.quantite || 1,
        prixUnitaire: l.prixAchatUnitaire || l.prixUnitaire || 0
      })));
    } else {
      setLignes([{ articleId: '', qte: 1, prixUnitaire: 0 }]);
    }
    setFormOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer définitivement ce brouillon de réception ?')) {
      deleteMutation.mutate(id);
    }
  };

  const addLigne = () => {
    if (isViewOnly) return;
    setLignes([...lignes, { articleId: '', qte: 1, prixUnitaire: 0 }]);
  };
  
  const removeLigne = (i) => {
    if (isViewOnly) return;
    if (lignes.length > 1) {
      setLignes(lignes.filter((_, idx) => idx !== i));
    }
  };

  const updateLigne = (i, field, value) => {
    if (isViewOnly) return;
    const copy = [...lignes];
    copy[i] = { ...copy[i], [field]: value };
    
    if (field === 'articleId') {
      const art = articles.find(x => x.id === value);
      if (art) copy[i].prixUnitaire = art.prixAchat || 0;
    }
    setLignes(copy);
  };

  const total = lignes.reduce((s, l) => s + (Number(l.qte) || 0) * (Number(l.prixUnitaire) || 0), 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Réceptions</h1>
          <p className="text-slate-400 text-sm mt-1">{totalItems} réception{totalItems !== 1 ? 's' : ''}</p>
        </div>
        {perm.canCreate && (
          <button onClick={openCreate}
            className="bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 cursor-pointer">
            + Nouvelle Réception
          </button>
        )}
      </div>

      <div className="mb-4">
        <input 
          type="text" 
          placeholder="Rechercher une réception (Fournisseur, BC...)" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md bg-slate-800/60 border border-slate-700/50 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-amber-500"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : totalItems === 0 ? (
        <div className="text-center py-20"><span className="text-6xl">📦</span><p className="text-slate-400 font-semibold mt-4">Aucune réception enregistrée</p></div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="text-left px-5 py-4">Date</th>
                <th className="text-left px-5 py-4">Fournisseur</th>
                <th className="text-left px-5 py-4">N° BC</th>
                <th className="text-right px-5 py-4">Montant</th>
                <th className="text-center px-5 py-4">Statut</th>
                <th className="text-center px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.map(r => {
                const f = fournisseurs.find(x => x.id === r.fournisseurId);
                const isEditable = r.statut === 'EN_ATTENTE' || r.statut === 'EN_COURS';

                return (
                  <tr key={r.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-5 py-4 text-slate-300 text-sm">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : ''}</td>
                    <td className="px-5 py-4 text-white font-semibold text-sm">{f?.nom || 'Fournisseur inconnu'}</td>
                    <td className="px-5 py-4 text-slate-400 text-sm">{r.numBordereau || 'N/A'}</td>
                    <td className="px-5 py-4 text-right text-amber-400 font-bold text-sm">
                      {(r.montant || 0).toLocaleString('fr-FR')} F
                    </td>
                    <td className="px-5 py-4 text-center"><StatutBadge statut={r.statut} /></td>
                    
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => openEdit(r, true)} 
                          className="text-slate-400 hover:text-white transition-colors cursor-pointer" 
                          title="Consulter les articles"
                        >
                          <Eye size={16} />
                        </button>

                        {isEditable ? (
                          <>
                            <button
                              onClick={() => validateMutation.mutate(r.id)}
                              disabled={validateMutation.isPending}
                              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold px-3 py-1 rounded-lg text-xs transition-all cursor-pointer"
                            >
                              {validateMutation.isPending ? 'En cours...' : 'Valider'}
                            </button>

                            {/* 🛠️ Bouton Modifier Direct sans blocage de permission pour les Brouillons */}
                            <button 
                              onClick={() => openEdit(r, false)} 
                              className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer" 
                              title="Modifier"
                            >
                              <Edit3 size={16} />
                            </button>

                            {perm.canDelete && (
                              <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-300 transition-colors cursor-pointer" title="Supprimer">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-slate-500 font-medium select-none bg-slate-900/40 px-2 py-1 rounded-md border border-slate-700/30">
                            <span>🔒 Enregistré</span>
                          </div>
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

      {/* MODAL DU FORMULAIRE */}
      <FormModal 
        isOpen={formOpen} 
        onClose={() => setFormOpen(false)} 
        onSubmit={handleSubmit} 
        title={isViewOnly ? "Détails de la réception" : editItem ? "Modifier la réception" : "Nouvelle réception"} 
        loading={formLoading} 
        size="lg" 
        submitLabel={isViewOnly ? null : "Enregistrer la réception"}
      >
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Fournisseur *</label>
            <select required disabled={isViewOnly} value={form.fournisseurId} onChange={setF('fournisseurId')}
              className="w-full bg-slate-800 border border-slate-600 disabled:opacity-60 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500">
              <option value=""> Choisir </option>
              {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Date de réception *</label>
            <input required disabled={isViewOnly} type="date" value={form.dateReception} onChange={setF('dateReception')}
              className="w-full bg-slate-800 border border-slate-600 disabled:opacity-60 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none" />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">N° Bon de commande / Bordereau *</label>
            <input required disabled={isViewOnly} value={form.numBordereau} onChange={setF('numBordereau')} placeholder="Ex: BC-2026-XXXX"
              className="w-full bg-slate-800 border border-slate-600 disabled:opacity-60 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none" />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Notes / Observations</label>
            <input disabled={isViewOnly} value={form.notes} onChange={setF('notes')} placeholder="Renseignements complémentaires..."
              className="w-full bg-slate-800 border border-slate-600 disabled:opacity-60 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none" />
          </div>
        </div>

        <div className="border-t border-slate-700/60 pt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest">Articles reçus</label>
            {!isViewOnly && (
              <button type="button" onClick={addLigne} className="flex items-center gap-1 text-amber-400 hover:text-amber-300 text-xs font-bold transition-colors">
                <Plus size={14} /> Ajouter une ligne
              </button>
            )}
          </div>
          
          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 style-scrollbar">
            {lignes.map((l, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center bg-slate-900/30 p-1.5 rounded-xl border border-slate-800/40">
                <select required disabled={isViewOnly} value={l.articleId} onChange={e => updateLigne(i, 'articleId', e.target.value)}
                  className="col-span-6 bg-slate-800 border border-slate-600 disabled:opacity-60 text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:border-amber-500">
                  <option value=""> Sélectionner l'article... </option>
                  {articles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.designation} {p.codeBarres ? `(${p.codeBarres})` : ''}
                    </option>
                  ))}
                </select>
                
                <input type="number" min="1" required disabled={isViewOnly} value={l.qte} onChange={e => updateLigne(i, 'qte', e.target.value)}
                  placeholder="Qté"
                  className="col-span-2 bg-slate-800 border border-slate-600 disabled:opacity-60 focus:border-amber-500 text-white rounded-xl px-3 py-2.5 text-xs outline-none text-center" />
                
                <input type="number" min="0" required disabled={isViewOnly} value={l.prixUnitaire} onChange={e => updateLigne(i, 'prixUnitaire', e.target.value)}
                  placeholder="Prix unitaire"
                  className="col-span-3 bg-slate-800 border border-slate-600 disabled:opacity-60 focus:border-amber-500 text-white rounded-xl px-3 py-2.5 text-xs outline-none text-right" />
                
                <button type="button" onClick={() => removeLigne(i)} disabled={lignes.length === 1 || isViewOnly}
                  className="col-span-1 text-red-400 hover:text-red-300 disabled:opacity-20 flex justify-center transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end items-center gap-2">
            <span className="text-slate-400 text-sm font-medium">Montant total de la commande :</span>
            <span className="text-amber-500 font-black text-xl">{total.toLocaleString('fr-FR')} F</span>
          </div>
        </div>
      </FormModal>
    </div>
  );
}