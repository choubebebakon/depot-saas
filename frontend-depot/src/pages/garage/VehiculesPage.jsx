import { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';

function ModalVehicule({ onClose, onSuccess, edit }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    clientId: edit?.clientId || '',
    immatriculation: edit?.immatriculation || '',
    marque: edit?.marque || '',
    modele: edit?.modele || '',
    annee: edit?.annee || '',
  });
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    api.get(`/clients?tenantId=${user?.tenantId}`).then(res => setClients(res.data?.data || res.data || [])).catch(() => {});
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/garage/vehicules', { ...form, annee: parseInt(form.annee) || null, tenantId: user?.tenantId });
      onSuccess();
      onClose();
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h3 className="text-white font-black text-xl mb-6">Nouveau véhicule client</h3>
        {erreur && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{erreur}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Client *</label>
            <select required value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm">
              <option value="">Sélectionner...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Immatriculation *</label>
            <input required value={form.immatriculation} onChange={e => setForm({ ...form, immatriculation: e.target.value })}
              placeholder="LT 1234 AB" className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Marque</label>
              <input value={form.marque} onChange={e => setForm({ ...form, marque: e.target.value })} placeholder="Toyota"
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Modèle</label>
              <input value={form.modele} onChange={e => setForm({ ...form, modele: e.target.value })} placeholder="Hilux"
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Année</label>
            <input type="number" value={form.annee} onChange={e => setForm({ ...form, annee: e.target.value })}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl">
              {loading ? 'Création...' : 'Créer'}
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
        <h3 className="text-white font-black text-lg mb-2">Confirmer la suppression</h3>
        <p className="text-slate-400 text-sm mb-6">Cette action est irréversible.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">Annuler</button>
          <button onClick={onConfirm} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl">Supprimer</button>
        </div>
      </div>
    </div>
  );
}

export default function VehiculesGaragePage() {
  const [vehicules, setVehicules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [notification, setNotification] = useState(null);

  const load = async () => {
    try {
      const res = await api.get('/garage/vehicules');
      setVehicules(res.data.data || []);
    } catch (_) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await api.delete(`/garage/vehicules/${deleteItem.id}`);
      showNotif('Véhicule supprimé');
      setDeleteItem(null);
      load();
    } catch (_) { showNotif('Erreur suppression', 'error'); }
  };

  return (
    <div className="p-6">
      {notification && (
        <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm transition-all ${
          notification.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
        }`}>{notification.msg}</div>
      )}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">Parc Véhicules Clients</h1>
        <button onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/20">
          + Nouveau véhicule
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : vehicules.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <p className="text-lg font-semibold">Aucun véhicule enregistré</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Immatriculation</th>
                <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Marque</th>
                <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Modèle</th>
                <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Année</th>
                <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Client</th>
                <th className="text-right text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {vehicules.map(v => (
                <tr key={v.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-white font-bold">{v.immatriculation}</td>
                  <td className="px-4 py-3 text-slate-300">{v.marque || '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{v.modele || '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{v.annee || '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{v.client?.nom || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setDeleteItem(v)} className="text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider">
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <ModalVehicule onClose={() => setShowModal(false)} onSuccess={() => showNotif('Véhicule créé')} />}
      {deleteItem && <ConfirmDelete onClose={() => setDeleteItem(null)} onConfirm={handleDelete} />}
    </div>
  );
}
