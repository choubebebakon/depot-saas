import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../../hooks/useData';
import { usePagination } from '../../../hooks/usePagination';
import { useNotif } from '../../../context/NotifContext';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../api/axios';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
import { usePermission } from '../../../shared/hooks/usePermission';
import { PERMISSIONS } from '../permissions';
import ClientForm from '../../../shared/forms/ClientForm';

export default function ClientsPage() {
  const { metier: metierParam } = useParams();
  const { metier: metierAuth } = useAuth();
  const metier = metierParam || metierAuth || 'supermarche';
  const prefix = metier.toLowerCase().replace(/_/g, '-');

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { success, error: notifError } = useNotif();
  const perm = usePermission(PERMISSIONS, 'clients');

  // 1. Récupération des données
  const { data: clientsData = [], loading, refetch } = useData(`/${prefix}/clients`, { enabled: true });
  const clients = Array.isArray(clientsData?.data) ? clientsData.data : (Array.isArray(clientsData) ? clientsData : []);

  // 2. Filtrage
  const filtres = (clients || []).filter(item =>
    !search || JSON.stringify(item).toLowerCase().includes((search || '').toLowerCase())
  );

  // 3. Pagination sécurisée
  const pagination = usePagination(filtres, 10);
  const paginated = pagination?.paginated || [];
  const { totalItems } = pagination;

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/${prefix}/clients/${confirmDelete.id}`);
      setConfirmDelete(null);
      success('Client supprimé');
      refetch();
    } catch {
      notifError('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Clients</h1>
          <p className="text-slate-400 text-sm mt-1">{clients.length} client{clients.length !== 1 ? 's' : ''} au total</p>
        </div>
        {perm.canCreate && (
          <button onClick={() => { setEditItem(null); setFormOpen(true); }}
            className="bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg">
            + Nouveau Client
          </button>
        )}
      </div>

      <input type="text" placeholder="🔍 Rechercher un client..." value={search} onChange={e => setSearch(e.target.value)}
        className="mb-6 bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-72" />

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtres.length === 0 ? (
        <div className="text-center py-20 text-slate-400">Aucun client trouvé</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Si paginated est vide, on affiche les 'filtres' par sécurité */}
          {(paginated.length > 0 ? paginated : filtres).map(c => (
            <div key={c.id} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 hover:border-amber-500/50 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 font-bold">{c.nom?.[0]?.toUpperCase()}</div>
                  <p className="text-white font-bold">{c.nom}</p>
                </div>
                <div className="flex gap-2">
                  {perm.canEdit && <button onClick={() => { setEditItem(c); setFormOpen(true); }} className="text-slate-400 hover:text-white text-xs">✏️</button>}
                  {perm.canDelete && <button onClick={() => setConfirmDelete(c)} className="text-red-400 hover:text-red-300 text-xs">🗑️</button>}
                </div>
              </div>
              
              <div className="space-y-1.5 text-xs text-slate-400">
                <p>📞 {c.telephone || 'Non renseigné'}</p>
                <p>📍 {c.adresse || 'Non renseignée'}</p>
                <p>💳 Plafond: <span className="text-emerald-400 font-bold">{c.plafondCredit} F</span></p>
              </div>
            </div>
          ))}
        </div>
      )}

      <ClientForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={() => { refetch(); setFormOpen(false); }} edit={editItem} metier={prefix} />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer le client" message={`Supprimer ${confirmDelete?.nom} ?`} />
    </div>
  );
}