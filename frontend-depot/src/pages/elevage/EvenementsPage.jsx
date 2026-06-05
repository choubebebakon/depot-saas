import { useState, useEffect } from 'react';
import api from '../../api';

const TYPE_STYLES = {
  NAISSANCE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  ACHAT: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  MORTALITE: 'text-red-400 bg-red-500/10 border-red-500/30',
  VACCINATION: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  TRAITEMENT: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  PESEE: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  VENTE: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  TRANSFERT: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
  ALIMENTATION: 'text-lime-400 bg-lime-500/10 border-lime-500/30',
};

function ModalEvenement({ lotId, onClose, onSuccess }) {
  const [form, setForm] = useState({
    type: 'VACCINATION', quantite: 1, poids: '', montant: '', notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form, quantite: parseInt(form.quantite) || 1,
        poids: form.poids ? parseFloat(form.poids) : undefined,
        montant: form.montant ? parseFloat(form.montant) : undefined,
      };
      await api.post(`/elevage/lots-elevage/${lotId}/evenements`, payload);
      onSuccess(); onClose();
    } catch (err) { setErreur(err.response?.data?.message || 'Erreur'); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h3 className="text-white font-black text-xl mb-6">Nouvel événement</h3>
        {erreur && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{erreur}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Type *</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm">
              {Object.keys(TYPE_STYLES).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Quantité</label>
              <input type="number" value={form.quantite} onChange={e => setForm({ ...form, quantite: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Poids</label>
              <input type="number" step="0.1" value={form.poids} onChange={e => setForm({ ...form, poids: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Montant</label>
              <input type="number" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })}
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
              {loading ? 'Création...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EvenementsPage() {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLot, setSelectedLot] = useState(null);
  const [lotEvents, setLotEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
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
    } catch (_) {} finally { setLoading(false); }
  };

  useEffect(() => { fetchLots(); }, [page, search]);

  const fetchEvents = async (lotId) => {
    try {
      const res = await api.get(`/elevage/lots-elevage/${lotId}/historique`, { params: { limit: 50 } });
      setLotEvents(res.data.data || res.data || []);
    } catch (_) { setLotEvents([]); }
  };

  const selectLot = (lot) => {
    setSelectedLot(lot);
    setLotEvents([]);
    fetchEvents(lot.id);
  };

  const backToLots = () => {
    setSelectedLot(null);
    setLotEvents([]);
  };

  return (
    <div className="p-6">
      {notification && (
        <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${
          notification.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
        }`}>{notification.msg}</div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">
          {selectedLot ? `Événements: ${selectedLot.nom}` : 'Journal des événements'}
        </h1>
        {selectedLot && (
          <div className="flex gap-3">
            <button onClick={backToLots}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm">← Tous les lots</button>
            <button onClick={() => setShowEventModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-indigo-500/20">
              + Événement
            </button>
          </div>
        )}
        {!selectedLot && (
          <button onClick={() => setShowEventModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/20">
            + Nouvel événement
          </button>
        )}
      </div>

      {!selectedLot && (
        <input type="text" placeholder="Rechercher un lot..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm mb-6 placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : !selectedLot ? (
        lots.length === 0 ? (
          <div className="text-center py-20 text-slate-500"><p className="text-lg font-semibold">Aucun lot</p></div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Lot</th>
                  <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Espèce</th>
                  <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Effectif</th>
                  <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Statut</th>
                  <th className="text-right text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {lots.map((lot) => (
                  <tr key={lot.id} className="hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => selectLot(lot)}>
                    <td className="px-4 py-3 text-white font-bold">{lot.nom}</td>
                    <td className="px-4 py-3 text-slate-300">{lot.espece}</td>
                    <td className="px-4 py-3 text-slate-300">{lot.nombreActuel || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${
                        lot.statut === 'ACTIF' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-slate-400 bg-slate-800 border-slate-700'
                      }`}>{lot.statut}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-indigo-400 text-xs font-bold">Voir les événements →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="space-y-3">
          {lotEvents.length === 0 ? (
            <div className="text-center py-20 text-slate-500"><p className="text-lg font-semibold">Aucun événement pour ce lot</p></div>
          ) : (
            lotEvents.map((evt, idx) => (
              <div key={evt.id || idx} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${TYPE_STYLES[evt.type] || 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                      {evt.type}
                    </span>
                    <span className="text-slate-500 text-xs">
                      {new Date(evt.date || evt.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {evt.montant && <span className="text-emerald-400 font-bold text-sm">{evt.montant.toLocaleString('fr-FR')} FCFA</span>}
                </div>
                {evt.notes && <p className="text-slate-300 text-sm mt-2">{evt.notes}</p>}
                <p className="text-slate-500 text-xs mt-1">{evt.quantite || 0} unités{evt.poids ? `, ${evt.poids} kg` : ''}</p>
              </div>
            ))
          )}
        </div>
      )}

      {total > limit && !selectedLot && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl disabled:opacity-40 font-bold text-sm">← Précédent</button>
          <span className="text-slate-500 text-sm">Page {page} / {Math.ceil(total / limit)}</span>
          <button disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl disabled:opacity-40 font-bold text-sm">Suivant →</button>
        </div>
      )}

      {showEventModal && (
        <ModalEvenement
          lotId={selectedLot?.id || ''}
          onClose={() => setShowEventModal(false)}
          onSuccess={() => { showNotif('Événement créé'); if (selectedLot) fetchEvents(selectedLot.id); }}
        />
      )}
    </div>
  );
}
