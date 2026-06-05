import { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';

const STATUT_COULEUR = {
  PLANIFIEE: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  EN_ROUTE: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  LIVREE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  ANNULEE: 'text-slate-500 bg-slate-500/10 border-slate-500/30',
};

function ModalLivraison({ onClose, onSuccess }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    chantierId: '', vehiculeId: '', chauffeur: '', reference: 'LIV-' + Date.now(),
  });
  const [chantiers, setChantiers] = useState([]);
  const [vehicules, setVehicules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    api.get(`/quincaillerie/chantiers?tenantId=${user?.tenantId}`).then(res => setChantiers(res.data?.data || res.data || [])).catch(() => {});
    api.get('/ciment-btp/vehicules').then(res => setVehicules(res.data.data || [])).catch(() => {});
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/ciment-btp/livraisons', { ...form, tenantId: user?.tenantId });
      onSuccess(); onClose();
    } catch (err) { setErreur(err.response?.data?.message || 'Erreur'); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h3 className="text-white font-black text-xl mb-6">Nouvelle livraison BTP</h3>
        {erreur && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{erreur}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Chantier *</label>
            <select required value={form.chantierId} onChange={e => setForm({ ...form, chantierId: e.target.value })}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm">
              <option value="">Sélectionner...</option>
              {chantiers.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Véhicule</label>
            <select value={form.vehiculeId} onChange={e => setForm({ ...form, vehiculeId: e.target.value })}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm">
              <option value="">Sélectionner...</option>
              {vehicules.map(v => <option key={v.id} value={v.id}>{v.immatriculation} ({v.type})</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Chauffeur</label>
            <input value={form.chauffeur} onChange={e => setForm({ ...form, chauffeur: e.target.value })}
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

export default function LivraisonsPage() {
  const [livraisons, setLivraisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type }); setTimeout(() => setNotification(null), 3000);
  };

  const load = async () => {
    try { const res = await api.get('/ciment-btp/livraisons'); setLivraisons(res.data.data || []); } catch (_) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleStatut = async (liv, statut) => {
    try { await api.patch(`/ciment-btp/livraisons/${liv.id}/statut`, { statut }); showNotif('Statut mis à jour'); load(); }
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
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">Livraisons BTP</h1>
        <button onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/20">
          + Nouvelle livraison
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : livraisons.length === 0 ? (
        <div className="text-center py-20 text-slate-500"><p className="text-lg font-semibold">Aucune livraison</p></div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Réf.</th>
                <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Chantier</th>
                <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Véhicule</th>
                <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Chauffeur</th>
                <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Statut</th>
                <th className="text-right text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {livraisons.map(l => (
                <tr key={l.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-white font-bold">{l.reference}</td>
                  <td className="px-4 py-3 text-slate-300">{l.chantier?.nom || '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{l.vehicule?.immatriculation || '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{l.chauffeur || '—'}</td>
                  <td className="px-4 py-3">
                    <select value={l.statut} onChange={e => handleStatut(l, e.target.value)}
                      className={`text-xs font-bold px-2 py-1 rounded-lg border ${STATUT_COULEUR[l.statut] || ''}`}>
                      <option value="PLANIFIEE">Planifiée</option>
                      <option value="EN_ROUTE">En route</option>
                      <option value="LIVREE">Livrée</option>
                      <option value="ANNULEE">Annulée</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <ModalLivraison onClose={() => setShowModal(false)} onSuccess={() => showNotif('Livraison créée')} />}
    </div>
  );
}
