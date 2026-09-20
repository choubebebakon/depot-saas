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
import ClientFicheModal, { BadgeCanal, canauxClient } from '../../../components/ClientFicheModal';

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
  const [canalFiltre, setCanalFiltre] = useState('');
  const [ficheClient, setFicheClient] = useState(null);

  const { success, error: notifError } = useNotif();
  const perm = usePermission(PERMISSIONS, 'clients');

  const { data: clientsData = [], loading, refetch } = useData(`/${prefix}/clients`, { enabled: true });
  const clients = Array.isArray(clientsData?.data)
    ? clientsData.data
    : (Array.isArray(clientsData) ? clientsData : []);

  const normalizedSearch = search.trim().toLowerCase();
  const filtres = clients.filter((item) => {
    // Filtre canal appliqué à l'écran : le serveur ne filtre pas sur les
    // identifiants Instagram / Messenger (colonnes de la fiche client).
    if (canalFiltre && !canauxClient(item).includes(canalFiltre)) return false;
    if (!normalizedSearch) return true;
    return [item?.nom, item?.telephone, item?.adresse]
      .filter((value) => value !== null && value !== undefined)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch));
  });

  const pagination = usePagination(filtres, 10);
  const paginated = pagination?.paginated || [];

  const handleDelete = async () => {
    if (!confirmDelete || deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/${prefix}/clients/${confirmDelete.id}`);
      setConfirmDelete(null);
      success('Client supprimé');
      await refetch();
    } catch (error) {
      notifError(error?.response?.data?.message || 'Erreur lors de la suppression');
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

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="🔍 Rechercher par nom, téléphone ou adresse..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-72"
        />
        <div className="flex gap-1">
          {[['', 'Tous'], ['WHATSAPP', 'WhatsApp'], ['INSTAGRAM', 'Instagram'], ['MESSENGER', 'Messenger']].map(([id, label]) => (
            <button key={id || 'all'} type="button" onClick={() => setCanalFiltre(id)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${canalFiltre === id ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtres.length === 0 ? (
        <div className="text-center py-20 text-slate-400">Aucun client trouvé</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(paginated.length > 0 ? paginated : filtres).map(c => (
            <div key={c.id} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 hover:border-amber-500/50 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 font-bold">{c.nom?.[0]?.toUpperCase()}</div>
                  <div className="min-w-0">
                    <button type="button" onClick={() => setFicheClient(c)} title="Voir la fiche client"
                      className="text-white font-bold hover:text-amber-400 transition-colors text-left truncate max-w-full">
                      {c.nom}
                    </button>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {canauxClient(c).map((canal) => <BadgeCanal key={canal} canal={canal} />)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {perm.canEdit && <button onClick={() => { setEditItem(c); setFormOpen(true); }} className="text-slate-400 hover:text-white text-xs">✏️</button>}
                  {perm.canDelete && <button onClick={() => setConfirmDelete(c)} className="text-red-400 hover:text-red-300 text-xs">🗑️</button>}
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-slate-400">
                <p>📞 {c.telephone || 'Non renseigné'}</p>
                <p>📍 {c.adresse || 'Non renseignée'}</p>
                <p>💳 Plafond: <span className="text-emerald-400 font-bold">{Number(c.plafondCredit || 0).toLocaleString('fr-FR')} F</span></p>
                <p>💰 Solde crédit: <span className={Number(c.soldeCredit || 0) > 0 ? 'text-red-400 font-bold' : 'text-emerald-400'}>{Number(c.soldeCredit || 0).toLocaleString('fr-FR')} F</span></p>
              </div>
            </div>
          ))}
        </div>
      )}

      {ficheClient && (
        <ClientFicheModal
          client={ficheClient}
          onClose={() => setFicheClient(null)}
          onEdit={perm.canEdit ? (c) => { setFicheClient(null); setEditItem(c); setFormOpen(true); } : undefined}
          // Historique de caisse du supermarché : endpoint métier dédié
          // (curseur keyset, limite par défaut issue des paramètres du shop).
          historyEndpoint={(c) => `/${prefix}/clients/${c.id}/historique`}
        />
      )}
      <ClientForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={() => { refetch(); setFormOpen(false); }} edit={editItem} metier={prefix} />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer le client" message={`Supprimer ${confirmDelete?.nom} ?`} />
    </div>
  );
}
