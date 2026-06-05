import { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';

const ESPECES = ['Bovin', 'Ovin', 'Caprin', 'Porcin', 'Volaille', 'Lapin', 'Poisson', 'Autre'];
const STATUT_OPTIONS = ['ACTIF', 'VENDU', 'TERMINE'];

function ModalLot({ onClose, onSuccess, edit }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    nom: edit?.nom || '',
    espece: edit?.espece || 'Bovin',
    race: edit?.race || '',
    dateAcquisition: edit?.dateAcquisition ? edit.dateAcquisition.split('T')[0] : new Date().toISOString().split('T')[0],
    nombreInitial: edit?.nombreInitial || 0,
    nombreActuel: edit?.nombreActuel || edit?.nombreInitial || 0,
    poidsUnitMoyen: edit?.poidsUnitMoyen || '',
    statut: edit?.statut || 'ACTIF',
    notes: edit?.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        nombreInitial: parseInt(form.nombreInitial) || 0,
        nombreActuel: parseInt(form.nombreActuel) || 0,
        poidsUnitMoyen: form.poidsUnitMoyen ? parseFloat(form.poidsUnitMoyen) : undefined,
        tenantId: user?.tenantId,
      };
      if (edit) {
        await api.patch(`/elevage/lots-elevage/${edit.id}`, payload);
      } else {
        await api.post('/elevage/lots-elevage', payload);
      }
      onSuccess(); onClose();
    } catch (err) { setErreur(err.response?.data?.message || 'Erreur'); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-lg shadow-2xl">
        <h3 className="text-white font-black text-xl mb-6">{edit ? 'Modifier' : 'Nouveau'} lot</h3>
        {erreur && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{erreur}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Nom *</label>
            <input required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Espèce *</label>
              <select value={form.espece} onChange={e => setForm({ ...form, espece: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm">
                {ESPECES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Race</label>
              <input value={form.race} onChange={e => setForm({ ...form, race: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Date acquisition</label>
              <input type="date" value={form.dateAcquisition} onChange={e => setForm({ ...form, dateAcquisition: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Statut</label>
              <select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm">
                {STATUT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Nbre initial</label>
              <input type="number" value={form.nombreInitial} onChange={e => setForm({ ...form, nombreInitial: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Nbre actuel</label>
              <input type="number" value={form.nombreActuel} onChange={e => setForm({ ...form, nombreActuel: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Poids moy. (kg)</label>
              <input type="number" step="0.1" value={form.poidsUnitMoyen} onChange={e => setForm({ ...form, poidsUnitMoyen: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" rows={2} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl">
              {loading ? 'Enregistrement...' : edit ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDelete({ onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-red-500/30 rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center">
        <h3 className="text-white font-black text-lg mb-2">Supprimer ce lot ?</h3>
        <p className="text-slate-400 text-sm mb-6">Toutes les données associées seront perdues.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">Annuler</button>
          <button onClick={onConfirm} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl">Supprimer</button>
        </div>
      </div>
    </div>
  );
}

export default function TroupeauxPage() {
  const { user } = useAuth();
  const [lots, setLots] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [notification, setNotification] = useState(null);
  const limit = 20;

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type }); setTimeout(() => setNotification(null), 3000);
  };

  const fetchLots = async () => {
    try {
      const res = await api.get('/elevage/lots-elevage', { params: { page, limit, search } });
      const data = res.data.data || res.data;
      setLots(Array.isArray(data) ? data : []);
      if (res.data.total) setTotal(res.data.total);
    } catch (_) {}
  };

  const fetchStats = async () => {
    try { const res = await api.get('/elevage/stats'); setStats(res.data); } catch (_) {}
  };

  useEffect(() => {
    Promise.all([fetchLots(), fetchStats()]).finally(() => setLoading(false));
  }, [page, search]);

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await api.delete(`/elevage/lots-elevage/${deleteItem.id}`);
      showNotif('Lot supprimé'); setDeleteItem(null); fetchLots(); fetchStats();
    } catch (_) { showNotif('Erreur suppression', 'error'); }
  };

  const statutStyle = (statut) => {
    const colors = { ACTIF: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', VENDU: 'text-blue-400 bg-blue-500/10 border-blue-500/30', TERMINE: 'text-slate-400 bg-slate-500/10 border-slate-500/30' };
    return colors[statut] || 'text-slate-400 bg-slate-800 border-slate-700';
  };

  return (
    <div className="p-6">
      {notification && (
        <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${
          notification.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
        }`}>{notification.msg}</div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">Troupeaux / Lots</h1>
        <button onClick={() => { setEditItem(null); setShowModal(true); }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/20">
          + Nouveau lot
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-emerald-400 text-2xl font-bold">{stats.animaux_total || 0}</p>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1">Animaux total</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-red-400 text-2xl font-bold">{stats.mortalite_mois || 0}</p>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1">Mortalité (mois)</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-yellow-400 text-2xl font-bold">{stats.ventes_jour?.toLocaleString('fr-FR') || 0} FCFA</p>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1">Ventes du jour</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-indigo-400 text-2xl font-bold">{stats.stock_aliment || 0}</p>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1">Stock aliment</p>
          </div>
        </div>
      )}

      <input type="text" placeholder="Rechercher un lot..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm mb-6 placeholder-slate-500 focus:outline-none focus:border-indigo-500" />

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : lots.length === 0 ? (
        <div className="text-center py-20 text-slate-500"><p className="text-lg font-semibold">Aucun lot trouvé</p></div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Nom</th>
                <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Espèce</th>
                <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Effectif</th>
                <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Statut</th>
                <th className="text-right text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {lots.map((lot) => (
                <tr key={lot.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-white font-bold">{lot.nom}</td>
                  <td className="px-4 py-3 text-slate-300">{lot.espece}</td>
                  <td className="px-4 py-3 text-slate-300">{lot.nombreActuel || 0} / {lot.nombreInitial || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${statutStyle(lot.statut)}`}>{lot.statut}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { setEditItem(lot); setShowModal(true); }}
                      className="text-indigo-400 hover:text-indigo-300 text-xs font-bold uppercase tracking-wider mr-3">Modifier</button>
                    <button onClick={() => setDeleteItem(lot)}
                      className="text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider">Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > limit && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl disabled:opacity-40 font-bold text-sm">← Précédent</button>
          <span className="text-slate-500 text-sm">Page {page} / {Math.ceil(total / limit)}</span>
          <button disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl disabled:opacity-40 font-bold text-sm">Suivant →</button>
        </div>
      )}

      {showModal && <ModalLot onClose={() => setShowModal(false)} onSuccess={() => showNotif(editItem ? 'Lot modifié' : 'Lot créé')} edit={editItem} />}
      {deleteItem && <ConfirmDelete onClose={() => setDeleteItem(null)} onConfirm={handleDelete} />}
    </div>
  );
}
