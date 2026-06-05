import { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';

function ModalVehicule({ onClose, onSuccess }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ immatriculation: '', type: 'Camion', capaciteKg: 0, disponible: true });
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/ciment-btp/vehicules', { ...form, capaciteKg: parseFloat(form.capaciteKg), tenantId: user?.tenantId });
      onSuccess(); onClose();
    } catch (err) { setErreur(err.response?.data?.message || 'Erreur'); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h3 className="text-white font-black text-xl mb-6">Nouveau véhicule BTP</h3>
        {erreur && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{erreur}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Immatriculation *</label>
            <input required value={form.immatriculation} onChange={e => setForm({ ...form, immatriculation: e.target.value })}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Type</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm">
              <option value="Camion">Camion</option>
              <option value="Benne">Benne</option>
              <option value="Tracteur">Tracteur</option>
              <option value="Pickup">Pickup</option>
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Capacité (Kg)</label>
            <input type="number" value={form.capaciteKg} onChange={e => setForm({ ...form, capaciteKg: e.target.value })}
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

export default function VehiculesPage() {
  const [vehicules, setVehicules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type }); setTimeout(() => setNotification(null), 3000);
  };

  const load = async () => {
    try { const res = await api.get('/ciment-btp/vehicules'); setVehicules(res.data.data || []); } catch (_) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleDisponible = async (v) => {
    try { await api.patch(`/ciment-btp/vehicules/${v.id}/disponibilite`); showNotif('Disponibilité mise à jour'); load(); }
    catch (_) { showNotif('Erreur', 'error'); }
  };

  return (
    <div className="p-6">
      {notification && (
        <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${
          notification.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
        }`}>{notification.msg}</div>
      )}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">Véhicules BTP</h1>
        <button onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/20">
          + Nouveau véhicule
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : vehicules.length === 0 ? (
        <div className="text-center py-20 text-slate-500"><p className="text-lg font-semibold">Aucun véhicule</p></div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Immatriculation</th>
                <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Type</th>
                <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Capacité</th>
                <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Disponibilité</th>
                <th className="text-right text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {vehicules.map(v => (
                <tr key={v.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-white font-bold">{v.immatriculation}</td>
                  <td className="px-4 py-3 text-slate-300">{v.type}</td>
                  <td className="px-4 py-3 text-slate-300">{v.capaciteKg} Kg</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleDisponible(v)}
                      className={`text-xs font-bold px-3 py-1 rounded-lg border ${
                        v.disponible ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-red-400 bg-red-500/10 border-red-500/30'
                      }`}>
                      {v.disponible ? 'Disponible' : 'Occupé'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <ModalVehicule onClose={() => setShowModal(false)} onSuccess={() => showNotif('Véhicule créé')} />}
    </div>
  );
}
