import { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';

const STATUT_COULEUR = {
  RECU: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  EN_TRAITEMENT: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  PRET: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  RETIRE: 'text-green-400 bg-green-500/10 border-green-500/30',
  ANNULE: 'text-slate-500 bg-slate-500/10 border-slate-500/30',
};

function ModalTicket({ onClose, onSuccess, edit }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    clientId: edit?.clientId || '',
    reference: edit?.reference || 'T-' + Date.now(),
    montantTotal: edit?.montantTotal || 0,
    avance: edit?.avance || 0,
    designation: '',
    typeService: 'Lavage',
    vetements: edit?.vetements?.map(v => ({
      designation: v.designation,
      typeService: v.typeService,
      prix: v.prix,
    })) || [],
  });
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    api.get(`/clients?tenantId=${user?.tenantId}`).then(res => setClients(res.data?.data || res.data || [])).catch(() => {});
  }, [user]);

  const addVetement = () => {
    if (!form.designation) return;
    setForm({
      ...form,
      vetements: [...form.vetements, { designation: form.designation, typeService: form.typeService, prix: parseFloat(form.prixVetement) || 0 }],
      designation: '', prixVetement: '',
    });
  };

  const removeVetement = (idx) => {
    setForm({ ...form, vetements: form.vetements.filter((_, i) => i !== idx) });
  };

  const total = form.vetements.reduce((s, v) => s + v.prix, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.vetements.length === 0) { setErreur('Ajoutez au moins un vêtement'); return; }
    setLoading(true);
    try {
      await api.post('/pressing/tickets', {
        ...form, montantTotal: total, tenantId: user?.tenantId,
        vetements: form.vetements,
      });
      onSuccess(); onClose();
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur création');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-lg shadow-2xl my-8">
        <h3 className="text-white font-black text-xl mb-6">Nouveau ticket pressing</h3>
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
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Vêtements</label>
            <div className="flex gap-2">
              <input value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })}
                placeholder="Chemise, Pantalon..." className="flex-1 bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" />
              <input value={form.prixVetement} onChange={e => setForm({ ...form, prixVetement: e.target.value })} type="number" placeholder="Prix"
                className="w-24 bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" />
              <button type="button" onClick={addVetement} className="bg-indigo-600 text-white px-3 rounded-xl font-bold text-sm">+</button>
            </div>
            {form.vetements.length > 0 && (
              <div className="mt-2 space-y-1">
                {form.vetements.map((v, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-800/50 px-3 py-2 rounded-lg text-sm">
                    <span className="text-slate-300">{v.designation}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{v.prix.toLocaleString('fr-FR')} FCFA</span>
                      <button type="button" onClick={() => removeVetement(i)} className="text-red-400 text-xs">✕</button>
                    </div>
                  </div>
                ))}
                <div className="text-right text-white font-bold text-sm pt-1">Total: {total.toLocaleString('fr-FR')} FCFA</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Avance</label>
              <input type="number" value={form.avance} onChange={e => setForm({ ...form, avance: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl">
              {loading ? 'Création...' : 'Créer le ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState(null);

  const load = async () => {
    try {
      const res = await api.get('/pressing/tickets');
      setTickets(res.data.data || []);
    } catch (_) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleStatut = async (ticket, newStatut) => {
    try {
      await api.patch(`/pressing/tickets/${ticket.id}/statut`, { statut: newStatut });
      showNotif(`Statut mis à jour`);
      load();
    } catch (_) { showNotif('Erreur', 'error'); }
  };

  const handleRetrait = async (ticket) => {
    try {
      await api.patch(`/pressing/tickets/${ticket.id}/retrait`);
      showNotif('Retrait effectué');
      load();
    } catch (_) { showNotif('Erreur retrait', 'error'); }
  };

  return (
    <div className="p-6">
      {notification && (
        <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${
          notification.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
        }`}>{notification.msg}</div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">Tickets Pressing</h1>
        <button onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/20">
          + Nouveau ticket
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <p className="text-lg font-semibold">Aucun ticket pressing</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Réf.</th>
                <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Client</th>
                <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Articles</th>
                <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Statut</th>
                <th className="text-left text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Montant</th>
                <th className="text-right text-slate-400 font-bold uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {tickets.map(t => (
                <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-white font-bold">{t.reference}</td>
                  <td className="px-4 py-3 text-slate-300">{t.client?.nom || '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{t.vetements?.length || 0} vêtements</td>
                  <td className="px-4 py-3">
                    {t.statut === 'RETIRE' ? (
                      <span className="text-xs font-bold px-2 py-1 rounded-lg border bg-green-500/10 border-green-500/30 text-green-400">Retiré</span>
                    ) : (
                      <select value={t.statut} onChange={e => handleStatut(t, e.target.value)}
                        className={`text-xs font-bold px-2 py-1 rounded-lg border ${STATUT_COULEUR[t.statut] || 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                        <option value="RECU">Reçu</option>
                        <option value="EN_TRAITEMENT">En traitement</option>
                        <option value="PRET">Prêt</option>
                        <option value="ANNULE">Annulé</option>
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white font-bold">{t.montantTotal?.toLocaleString('fr-FR') || 0} FCFA</td>
                  <td className="px-4 py-3 text-right">
                    {t.statut === 'PRET' && (
                      <button onClick={() => handleRetrait(t)}
                        className="text-emerald-400 hover:text-emerald-300 text-xs font-bold uppercase tracking-wider">
                        Retirer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <ModalTicket onClose={() => setShowModal(false)} onSuccess={() => showNotif('Ticket créé')} />}
    </div>
  );
}
