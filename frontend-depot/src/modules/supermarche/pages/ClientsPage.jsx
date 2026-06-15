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

  const [notif, setNotif] = useState(null);

  const [edit, setEdit] = useState(null);

  const CAT_COLORS = {};

  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3500); };

  const { success, error: notifError } = useNotif();

  const perm = usePermission(PERMISSIONS, 'clients');

  const { data: clientsData = [], loading, refetch } = useData(`/${prefix}/clients`, { enabled: true });
  const clients = Array.isArray(clientsData?.data) ? clientsData.data : (Array.isArray(clientsData) ? clientsData : []);

  // Pagination centralisÃ©e â FIX: totalPages non dÃ©fini
  const filtres = (clients || []).filter(item =>
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

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/${prefix}/clients/${confirmDelete.id}`);
      setConfirmDelete(null);
      success('élément supprimé');
      refetch();
    } catch {
      notifError('Erreur lors de la suppression', 'échec');
    } finally {
      setDeleting(false);
    }
  };



  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>{notif.msg}</div>}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Clients</h1>
          <p className="text-slate-400 text-sm mt-1">{totalItems} client{totalItems !== 1 ? 's' : ''} enregistr{totalItems !== 1 ? 's' : ''}</p>
        </div>
        {perm.canCreate && (
        <button onClick={() => { setEditItem(null); setFormOpen(true); }}
          className="bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20">
          + Nouveau Client
        </button>
        )}
      </div>

      <div className="mb-6">
        <input type="text" placeholder="🔍 Rechercher un client..." value={search} onChange={e => setSearch(e.target.value)}
          className="bg-slate-800 border border-slate-700 focus:border-amber-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-72" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtres.length === 0 ? (
        <div className="text-center py-20"><span className="text-6xl">??</span><p className="text-slate-400 font-semibold mt-4">Aucun client trouvé</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map(c => {
            const color = CAT_COLORS[c.categorie] || 'slate';
            return (
              <div key={c.id} className="bg-slate-800/60 border border-slate-700/50 hover:border-amber-500/30 rounded-2xl p-5 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 font-black text-lg">
                      {c.nom?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-white font-bold">{c.nom}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-${color}-500/20 text-${color}-400`}>
                        {c.categorie || 'standard'}
                      </span>
                    </div>
                  </div>
                  {perm.canEdit && (
                  <button onClick={() => { setEditItem(c); setFormOpen(true); }}
                    className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm opacity-0 group-hover:opacity-100 transition-all">✏️ Modifier</button>
                  )}
                  {perm.canDelete && (
                  <button onClick={() => setConfirmDelete(c)}
                    className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 text-sm opacity-0 group-hover:opacity-100 transition-all">🗑️ Supprimer</button>
                  )}
                </div>
                <div className="space-y-1 text-xs text-slate-400">
                  {c.telephone && <p>?? {c.telephone}</p>}
                  {c.email && <p>?? {c.email}</p>}
                  {c.adresse && <p>?? {c.adresse}</p>}
                  {c.cartesFidelite && <p className="text-amber-400 font-bold">?? {c.cartesFidelite}</p>}
                </div>
                {c.totalAchats && (
                  <div className="mt-3 pt-3 border-t border-slate-700 flex justify-between text-xs">
                    <span className="text-slate-500">Total achats</span>
                    <span className="text-emerald-400 font-bold">{c.totalAchats?.toLocaleString('fr-FR')} F</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-4 mt-4 bg-slate-800/60 border border-slate-700/50 rounded-2xl">
          <span className="text-slate-400 text-xs">{filtres.length} client{filtres.length > 1 ? 's' : ''}  Page {page}/{totalPages}</span>
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

      <ClientForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={() => { success(editItem ? 'Client modifié ?' : 'Client cr ?'); refetch(); }} edit={editItem} metier={prefix} />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer le client" message={`Supprimer  ${confirmDelete?.nom}  ? Cette action est irrversible.`} />
    </div>
  );
}
