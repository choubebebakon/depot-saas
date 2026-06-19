import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../../hooks/useData';
import { usePagination } from '../../../hooks/usePagination';
import { useNotif } from '../../../context/NotifContext';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../api/axios';
import { usePermission } from '../../../shared/hooks/usePermission';
import { PERMISSIONS } from '../permissions';
import FournisseurForm from '../../../shared/forms/FournisseurForm';

export default function FournisseursPage() {
  const { metier: metierParam } = useParams();
  const { metier: metierAuth, depotActif } = useAuth();
  const metier = metierParam || metierAuth || 'supermarche';
  const prefix = metier.toLowerCase().replace(/_/g, '-');

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { success, error: notifError } = useNotif();
  const perm = usePermission(PERMISSIONS, 'fournisseurs');

  const { data: fournisseursData = [], loading, refetch } = useData(`/${prefix}/fournisseurs`, { enabled: true });
  
  const fournisseurs = useMemo(() => {
    const rawData = fournisseursData?.data || fournisseursData || [];
    return Array.isArray(rawData) ? rawData : [];
  }, [fournisseursData]);

  const filtres = fournisseurs.filter(item =>
    !search || item.nom?.toLowerCase().includes(search.toLowerCase())
  );

  const { totalItems, paginatedData: paginated } = usePagination(filtres, 10);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Fournisseurs</h1>
          <p className="text-slate-400 text-sm mt-1">{totalItems} fournisseur{totalItems !== 1 ? 's' : ''}</p>
        </div>
        {perm.canCreate && (
          <button onClick={() => { setEditItem(null); setFormOpen(true); }}
            className="bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20">
            + Nouveau Fournisseur
          </button>
        )}
      </div>

      <input type="text" placeholder="🔍 Rechercher un fournisseur..." value={search} onChange={e => setSearch(e.target.value)}
        className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm w-72 mb-6 outline-none" />

      {loading ? (
        <div className="text-center py-20 text-slate-500">Chargement...</div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-900/50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-5 py-4">Fournisseur</th>
                <th className="px-5 py-4">Téléphone</th>
                <th className="px-5 py-4">Dépôt</th>
                <th className="px-5 py-4 text-right">Solde</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.map(f => (
                <tr key={f.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-white font-semibold text-sm">{f.nom}</p>
                    {f.email && <p className="text-slate-400 text-xs font-mono">{f.email}</p>}
                  </td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{f.telephone || '-'}</td>
                  
                  <td className="px-5 py-4">
                    <span className="text-xs font-bold text-slate-300 bg-slate-700/50 px-2.5 py-1 rounded-lg">
                      {f.depotName || 'Aucun'}
                    </span>
                  </td>
                  
                  <td className="px-5 py-4 text-right text-orange-400 font-bold">
                    {new Intl.NumberFormat('fr-FR').format(f.solde || 0)} FCFA
                  </td>

                  <td className="px-5 py-4 text-center">
                    <button onClick={() => { setEditItem(f); setFormOpen(true); }} className="text-slate-400 hover:text-white px-2">✏️</button>
                    <button onClick={() => setConfirmDelete(f)} className="text-red-400 hover:text-red-300 px-2">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FournisseurForm 
        isOpen={formOpen} 
        onClose={() => setFormOpen(false)} 
        onSuccess={() => { refetch(); success('Action réussie'); setFormOpen(false); }} 
        edit={editItem} 
        metier={prefix}
        depotId={depotActif?.id}
      />
    </div>
  );
}