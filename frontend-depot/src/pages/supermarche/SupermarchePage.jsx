import { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';

const COULEURS = ['#2563eb', '#059669', '#dc2626', '#d97706', '#7c3aed', '#0891b2', '#e11d48', '#65a30d', '#f97316', '#6366f1'];

function ModalRayon({ onClose, onSuccess, edit }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    nom: edit?.nom || '',
    couleur: edit?.couleur || COULEURS[Math.floor(Math.random() * COULEURS.length)],
    ordre: edit?.ordre || 0,
  });
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, ordre: parseInt(form.ordre) || 0, tenantId: user?.tenantId };
      if (edit) {
        await api.patch(`/supermarche/rayons/${edit.id}`, payload);
      } else {
        await api.post('/supermarche/rayons', payload);
      }
      onSuccess(); onClose();
    } catch (err) { setErreur(err.response?.data?.message || 'Erreur'); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h3 className="text-white font-black text-xl mb-6">{edit ? 'Modifier' : 'Nouveau'} rayon</h3>
        {erreur && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{erreur}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Nom *</label>
            <input required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Couleur</label>
            <div className="flex flex-wrap gap-2">
              {COULEURS.map(c => (
                <button key={c} type="button" onClick={() => setForm({ ...form, couleur: c })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${form.couleur === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Ordre</label>
            <input type="number" value={form.ordre} onChange={e => setForm({ ...form, ordre: e.target.value })}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" />
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
        <h3 className="text-white font-black text-lg mb-2">Confirmer la suppression</h3>
        <p className="text-slate-400 text-sm mb-6">Ce rayon sera supprimé définitivement.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">Annuler</button>
          <button onClick={onConfirm} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl">Supprimer</button>
        </div>
      </div>
    </div>
  );
}

export default function SupermarchePage() {
  const [rayons, setRayons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [notification, setNotification] = useState(null);

  const load = async () => {
    try { const res = await api.get('/supermarche/rayons'); setRayons(res.data.data || []); } catch (_) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type }); setTimeout(() => setNotification(null), 3000);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await api.delete(`/supermarche/rayons/${deleteItem.id}`);
      showNotif('Rayon supprimé'); setDeleteItem(null); load();
    } catch (_) { showNotif('Erreur suppression', 'error'); }
  };

  return (
    <div className="p-6">
      {notification && (
        <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${
          notification.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
        }`}>{notification.msg}</div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">Rayons Supermarché</h1>
        <button onClick={() => { setEditItem(null); setShowModal(true); }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/20">
          + Nouveau rayon
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : rayons.length === 0 ? (
        <div className="text-center py-20 text-slate-500"><p className="text-lg font-semibold">Aucun rayon</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rayons.map(r => (
            <div key={r.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all group"
              style={{ borderLeftColor: r.couleur || '#2563eb', borderLeftWidth: '4px' }}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-bold text-lg">{r.nom}</h3>
                  <p className="text-slate-500 text-xs mt-1">Ordre: {r.ordre || 0}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditItem(r); setShowModal(true); }}
                    className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 text-xs" title="Modifier">
                    ✏️
                  </button>
                  <button onClick={() => setDeleteItem(r)}
                    className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 text-xs" title="Supprimer">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <ModalRayon onClose={() => setShowModal(false)} onSuccess={() => showNotif(editItem ? 'Rayon modifié' : 'Rayon créé')} edit={editItem} />}
      {deleteItem && <ConfirmDelete onClose={() => setDeleteItem(null)} onConfirm={handleDelete} />}
    </div>
  );
}
