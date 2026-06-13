import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePagination } from '../../../hooks/usePagination';
import { useNotif } from '../../../context/NotifContext';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../api/axios';
import FormModal from '../../../shared/components/forms/FormModal';
import { usePermission } from '../../../shared/hooks/usePermission';
import { PERMISSIONS } from '../permissions';

const STATUTS_RECEPTION = [
  { id: 'EN_ATTENTE', label: 'En attente', color: 'amber' },
  { id: 'VALIDE', label: 'Valide', color: 'emerald' },
  { id: 'PARTIEL', label: 'Partielle', color: 'blue' },
  { id: 'ANNULE', label: 'Annule', color: 'red' },
];

function StatutBadge({ statut }) {
  const s = STATUTS_RECEPTION.find(x => x.id === statut) || STATUTS_RECEPTION[0];
  const colors = { amber: 'bg-amber-500/20 text-amber-400', emerald: 'bg-emerald-500/20 text-emerald-400', blue: 'bg-blue-500/20 text-blue-400', red: 'bg-red-500/20 text-red-400' };
  return <span className={`text-xs font-bold px-2 py-1 rounded-full ${colors[s.color]}`}>{s.label}</span>;
}

export default function ReceptionsPage() {
  const { metier: metierParam } = useParams();
  const { metier: metierAuth, tenantId } = useAuth();
  const metier = metierParam || metierAuth || 'supermarche';
  const prefix = metier.toLowerCase().replace(/_/g, '-');
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ fournisseurId: '', dateReception: new Date().toISOString().slice(0, 10), numeroBC: '', notes: '' });
  const [deleting, setDeleting] = useState(false);

  const { success, error: notifError } = useNotif();

  const perm = usePermission(PERMISSIONS, 'receptions');

  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [notif, setNotif] = useState(null);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [produits, setProduits] = useState([]);
  const [lignes, setLignes] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  const setF = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));



  useEffect(() => {
    api.get(`/${prefix}/fournisseurs`).then(r => setFournisseurs(r.data?.data || r.data || [])).catch(() => {});
    api.get(`/${prefix}/produits`).then(r => setProduits(r.data?.data || r.data || [])).catch(() => {});
  }, [prefix]);

  const { data: receptionsData = [], isLoading: loading } = useQuery({
    queryKey: ['supermarche-receptions', tenantId],
    queryFn: async () => {
      const res = await api.get(`/${prefix}/receptions`);
      return res.data;
    },
    enabled: !!tenantId,
  });
  const receptions = Array.isArray(receptionsData?.data) ? receptionsData.data : (Array.isArray(receptionsData) ? receptionsData : []);

  const validateMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.patch(`/${prefix}/receptions/${id}`, { statut: 'VALIDEE' });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supermarche-receptions'] });
      queryClient.invalidateQueries({ queryKey: ['supermarche-articles'] });
      queryClient.invalidateQueries({ queryKey: ['supermarche-dashboard'] });
      success('Réception validée');
    },
    onError: () => {
      notifError('Erreur lors de la validation', 'Échec');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/${prefix}/receptions/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supermarche-receptions'] });
      success('Réception supprimée');
    },
    onError: () => {
      notifError('Erreur lors de la suppression', 'Échec');
    }
  });

  // Pagination centralisÃ©e â FIX: totalPages non dÃ©fini
  const filtres = (receptions || []).filter(item =>
    !search || JSON.stringify(item).toLowerCase().includes((search || '').toLowerCase())
  );
  const {
    currentPage,
    setCurrentPage,
    goToPage,
    nextPage,
    prevPage,
    totalPages,
    totalItems,
    paginatedData: paginated,
    hasNext,
    hasPrev,
    from,
    to,
  } = usePagination(filtres, 10);
  const page = currentPage;
  const setPage = setCurrentPage;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.patch(`/${prefix}/receptions/${editItem.id}`, form);
      } else {
        await api.post(`/${prefix}/receptions`, form);
      }
      setFormOpen(false);
      setEditItem(null);
      success(editItem ? 'élément modifié' : 'élément cr');
      queryClient.invalidateQueries({ queryKey: ['supermarche-receptions'] });
    } catch {
      notifError("Erreur lors de l'enregistréement", 'échec');
    }
  };

  const openCreate = () => { setEditItem(null); setForm({ fournisseurId: '', dateReception: new Date().toISOString().slice(0, 10), numeroBC: '', notes: '' }); setLignes([]); setFormOpen(true); };
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };
  const addLigne = () => setLignes([...lignes, { produitId: '', qte: 1, prixUnitaire: 0 }]);
  const removeLigne = (i) => setLignes(lignes.filter((_, idx) => idx !== i));
  const updateLigne = (i, field, value) => {
    const copy = [...lignes];
    copy[i] = { ...copy[i], [field]: value };
    setLignes(copy);
  };
  const total = lignes.reduce((s, l) => s + (l.qte || 0) * (l.prixUnitaire || 0), 0);

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>{notif.msg}</div>}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Rceptions</h1>
          <p className="text-slate-400 text-sm mt-1">{totalItems} rception{totalItems !== 1 ? 's' : ''}</p>
        </div>
        {perm.canCreate && (
        <button onClick={openCreate}
          className="bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20">
          + Nouvelle Rception
        </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : totalItems === 0 ? (
        <div className="text-center py-20"><span className="text-6xl">??</span><p className="text-slate-400 font-semibold mt-4">Aucune rception enregistrée</p></div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="text-left px-5 py-4">Date</th>
                <th className="text-left px-5 py-4">Fournisseur</th>
                <th className="text-left px-5 py-4">N BC</th>
                <th className="text-right px-5 py-4">Montant</th>
                <th className="text-center px-5 py-4">Statut</th>
                <th className="text-center px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.map(r => {
                const f = fournisseurs.find(x => x.id === r.fournisseurId);

  return (
                  <tr key={r.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-5 py-4 text-slate-300 text-sm">{r.dateReception ? new Date(r.dateReception).toLocaleDateString('fr-FR') : ''}</td>
                    <td className="px-5 py-4 text-white font-semibold text-sm">{f?.nom || ''}</td>
                    <td className="px-5 py-4 text-slate-400 text-sm">{r.numeroBC || ''}</td>
                    <td className="px-5 py-4 text-right text-amber-400 font-bold text-sm">{(r.montantTotal || 0).toLocaleString('fr-FR')} F</td>
                    <td className="px-5 py-4 text-center"><StatutBadge statut={r.statut} /></td>
                    <td className="px-5 py-4 text-center">
                      {r.statut === 'EN_COURS' && (
                        <button
                          onClick={() => validateMutation.mutate(r.id)}
                          disabled={validateMutation.isPending}
                          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all"
                        >
                          {validateMutation.isPending ? 'Validation...' : 'Valider'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{totalItems} rception{totalItems > 1 ? 's' : ''}  Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">?</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, page - 2);
                  const p = start + i;
                  if (p > totalPages) return null;
                  return (
                    <button key={p} onClick={() => goToPage(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>
                  );
                })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">?</button>
              </div>
            </div>
          )}
        </div>
      )}

      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title="?? Nouvelle rception" loading={formLoading} size="lg" submitLabel="Enregistrer la rception">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Fournisseur *</label>
            <select required value={form.fournisseurId} onChange={setF('fournisseurId')}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm outline-none">
              <option value=""> Choisir </option>
              {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Date de rception *</label>
            <input required type="date" value={form.dateReception} onChange={setF('dateReception')}
              className="w-full bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none" />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">N Bon de commande</label>
            <input value={form.numeroBC} onChange={setF('numeroBC')}
              className="w-full bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none" />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Notes</label>
            <input value={form.notes} onChange={setF('notes')}
              className="w-full bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest">Articles reus</label>
            <button type="button" onClick={addLigne} className="text-amber-400 hover:text-amber-300 text-xs font-bold transition-colors">+ Ajouter ligne</button>
          </div>
          <div className="space-y-2">
            {lignes.map((l, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <select value={l.produitId} onChange={e => updateLigne(i, 'produitId', e.target.value)}
                  className="col-span-6 bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-xs outline-none">
                  <option value=""> Produit </option>
                  {produits.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                </select>
                <input type="number" min="1" value={l.qte} onChange={e => updateLigne(i, 'qte', e.target.value)}
                  placeholder="Qt"
                  className="col-span-2 bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-3 py-2.5 text-xs outline-none" />
                <input type="number" min="0" value={l.prixUnitaire} onChange={e => updateLigne(i, 'prixUnitaire', e.target.value)}
                  placeholder="Prix"
                  className="col-span-3 bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-3 py-2.5 text-xs outline-none" />
                <button type="button" onClick={() => removeLigne(i)} className="col-span-1 text-red-400 hover:text-red-300 text-center">?</button>
              </div>
            ))}
          </div>
          <div className="mt-3 text-right">
            <span className="text-slate-400 text-sm">Total: </span>
            <span className="text-amber-400 font-black text-lg">{total.toLocaleString('fr-FR')} F</span>
          </div>
        </div>
      </FormModal>
    </div>
  );
}
