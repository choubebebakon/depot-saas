import { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';

const STATUT_OPTIONS = ['RECU', 'EN_DIAGNOSTIC', 'DEVIS_ENVOYE', 'EN_REPARATION', 'EN_ATTENTE_PIECES', 'PRET', 'LIVRE', 'ANNULE'];
const STATUT_COULEUR = {
  RECU: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  EN_DIAGNOSTIC: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  DEVIS_ENVOYE: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  EN_REPARATION: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  EN_ATTENTE_PIECES: 'text-red-400 bg-red-500/10 border-red-500/30',
  PRET: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  LIVRE: 'text-green-400 bg-green-500/10 border-green-500/30',
  ANNULE: 'text-slate-500 bg-slate-500/10 border-slate-500/30',
};

function ModalFiche({ onClose, onSuccess, edit }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    vehiculeId: edit?.vehiculeId || '',
    problemeClient: edit?.problemeClient || '',
    travaux: edit?.travaux || '',
    montantMO: edit?.montantMO || 0,
    notes: edit?.notes || '',
  });
  const [vehicules, setVehicules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    api.get('/garage/vehicules').then(res => setVehicules(res.data.data || [])).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, montantMO: parseFloat(form.montantMO), tenantId: user?.tenantId };
      await api.post('/garage/fiches-travaux', payload);
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
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-lg shadow-2xl">
        <h3 className="text-white font-black text-xl mb-6">{edit ? 'Modifier' : 'Nouvel'} ordre de réparation</h3>
        {erreur && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{erreur}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Véhicule *</label>
            <select required value={form.vehiculeId} onChange={e => setForm({ ...form, vehiculeId: e.target.value })}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm">
              <option value="">Sélectionner...</option>
              {vehicules.map(v => <option key={v.id} value={v.id}>{v.immatriculation} - {v.marque} {v.modele}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Problème client *</label>
            <textarea required value={form.problemeClient} onChange={e => setForm({ ...form, problemeClient: e.target.value })}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" rows={2} />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Travaux à effectuer</label>
            <textarea value={form.travaux} onChange={e => setForm({ ...form, travaux: e.target.value })}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" rows={2} />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Montant main-d'œuvre</label>
            <input type="number" value={form.montantMO} onChange={e => setForm({ ...form, montantMO: e.target.value })}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" rows={2} />
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

export default function OrdresReparationPage() {
  const [fiches, setFiches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [notification, setNotification] = useState(null);

  const load = async () => {
    try {
      const res = await api.get('/garage/fiches-travaux');
      setFiches(res.data.data || []);
    } catch (_) {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await api.delete(`/garage/fiches-travaux/${deleteItem.id}`);
      showNotif('Ordre supprimé');
      setDeleteItem(null);
      load();
    } catch (_) {
      showNotif('Erreur suppression', 'error');
    }
  };

  const handleStatut = async (fiche, newStatut) => {
    try {
      await api.patch(`/garage/fiches-travaux/${fiche.id}/statut`, { statut: newStatut });
      showNotif(`Statut mis à jour : ${newStatut}`);
      load();
    } catch (_) {
      showNotif('Erreur mise à jour', 'error');
    }
  };

  return (
    <div className="p-6">
      {notification && (
        <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm transition-all ${
          notification.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
        }`}>
          {notification.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">Ordres de Réparation</h1>
        <button onClick={() => { setEditItem(null); setShowModal(true); }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/20">
          + Nouvel ordre
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : fiches.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <p className="text-lg font-semibold">Aucun ordre de réparation</p>
          <p className="text-sm mt-2">Cliquez sur "+ Nouvel ordre" pour créer le premier</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Réf.</th>
                <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Véhicule</th>
                <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Problème</th>
                <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Statut</th>
                <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Total</th>
                <th className="text-right text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {fiches.map(f => (
                <tr key={f.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-white font-bold">{f.reference}</td>
                  <td className="px-4 py-3 text-slate-300">{f.vehicule?.immatriculation || '—'}</td>
                  <td className="px-4 py-3 text-slate-300 max-w-[200px] truncate">{f.problemeClient}</td>
                  <td className="px-4 py-3">
                    <select value={f.statut} onChange={e => handleStatut(f, e.target.value)}
                      className={`text-xs font-bold px-2 py-1 rounded-lg border ${STATUT_COULEUR[f.statut] || 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                      {STATUT_OPTIONS.map(s => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-white font-bold">{f.montantTotal?.toLocaleString('fr-FR') || 0} FCFA</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setDeleteItem(f)} className="text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider ml-2">
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <ModalFiche onClose={() => setShowModal(false)} onSuccess={() => showNotif('Ordre créé')} edit={editItem} />}
      {deleteItem && <ConfirmDelete onClose={() => setDeleteItem(null)} onConfirm={handleDelete} />}
    </div>
  );
}
