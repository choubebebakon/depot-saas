import { useState, useEffect } from 'react';
import api from '../../api';

const STATUT_STYLES = {
  CONFIRME: 'bg-blue-900/50 text-blue-300 border-blue-700',
  EN_COURS: 'bg-green-900/50 text-green-300 border-green-700',
  TERMINE: 'bg-gray-800 text-gray-400 border-gray-700',
  ANNULE: 'bg-red-900/50 text-red-300 border-red-700',
  NO_SHOW: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
};

const STATUT_LABELS = {
  CONFIRME: 'Confirmé',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  ANNULE: 'Annulé',
  NO_SHOW: 'Absent',
};

export default function AgendaPage() {
  const [rdvs, setRdvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today');
  const [showModal, setShowModal] = useState(false);
  const [prestations, setPrestations] = useState([]);
  const [form, setForm] = useState({ nomClient: '', telephone: '', dateHeure: '', prestations: [] });

  const fetchRdvs = async () => {
    try {
      const res = filter === 'today'
        ? await api.get('/salon/rdv/today')
        : await api.get('/salon/rdv', { params: { page: 1, limit: 50 } });
      setRdvs(res.data.data || res.data || []);
    } catch (err) {
      console.error('Erreur chargement RDV:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrestations = async () => {
    try {
      const res = await api.get('/salon/prestations', { params: { limit: 100 } });
      const data = res.data.data || res.data;
      setPrestations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur chargement prestations:', err);
    }
  };

  useEffect(() => { fetchRdvs(); }, [filter]);
  useEffect(() => { fetchPrestations(); }, []);

  const handleCreateRdv = async (e) => {
    e.preventDefault();
    try {
      await api.post('/salon/rdv', {
        ...form,
        dateHeure: new Date(form.dateHeure).toISOString(),
        prestations: form.prestations.map(id => ({ prestationId: id })),
      });
      setShowModal(false);
      setForm({ nomClient: '', telephone: '', dateHeure: '', prestations: [] });
      fetchRdvs();
    } catch (err) {
      console.error('Erreur création RDV:', err);
    }
  };

  const handleUpdateStatut = async (id, statut) => {
    try {
      await api.patch(`/salon/rdv/${id}/statut`, { statut });
      fetchRdvs();
    } catch (err) {
      console.error('Erreur mise à jour statut:', err);
    }
  };

  const togglePrestation = (id) => {
    setForm(prev => ({
      ...prev,
      prestations: prev.prestations.includes(id)
        ? prev.prestations.filter(p => p !== id)
        : [...prev.prestations, id],
    }));
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📅 Agenda — Rendez-vous</h1>
        <button onClick={() => setShowModal(true)} className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-lg font-medium">+ Nouveau RDV</button>
      </div>

      <div className="flex gap-2 mb-4">
        {['today', 'all'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg ${filter === f ? 'bg-pink-600 text-white' : 'bg-slate-700 text-slate-300'}`}>{f === 'today' ? "Aujourd'hui" : 'Tous'}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Chargement...</div>
      ) : rdvs.length === 0 ? (
        <div className="text-center py-12 text-slate-500">Aucun rendez-vous.</div>
      ) : (
        <div className="grid gap-3">
          {rdvs.map((rdv) => (
            <div key={rdv.id} className={`bg-slate-800 p-4 rounded-xl border ${STATUT_STYLES[rdv.statut] || 'border-slate-700'}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{new Date(rdv.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUT_STYLES[rdv.statut]}`}>{STATUT_LABELS[rdv.statut] || rdv.statut}</span>
                  </div>
                  <p className="font-semibold">{rdv.nomClient}</p>
                  {rdv.telephone && <p className="text-slate-400 text-sm">📞 {rdv.telephone}</p>}
                  {rdv.lignes?.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {rdv.lignes.map(l => (
                        <span key={l.id} className="bg-slate-700 text-xs px-2 py-0.5 rounded">{l.prestation?.nom || 'Prestation'}</span>
                      ))}
                    </div>
                  )}
                  {rdv.montantTotal > 0 && <p className="text-emerald-400 text-sm mt-1 font-semibold">{rdv.montantTotal} XAF</p>}
                </div>
                {rdv.statut !== 'TERMINE' && rdv.statut !== 'ANNULE' && (
                  <div className="flex flex-col gap-1 ml-2">
                    {rdv.statut === 'CONFIRME' && <button onClick={() => handleUpdateStatut(rdv.id, 'EN_COURS')} className="text-xs bg-green-700 px-2 py-1 rounded">Démarrer</button>}
                    {rdv.statut === 'EN_COURS' && <button onClick={() => handleUpdateStatut(rdv.id, 'TERMINE')} className="text-xs bg-blue-700 px-2 py-1 rounded">Terminer</button>}
                    <button onClick={() => handleUpdateStatut(rdv.id, 'ANNULE')} className="text-xs bg-red-700 px-2 py-1 rounded">Annuler</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Nouveau rendez-vous</h2>
            <form onSubmit={handleCreateRdv} className="space-y-3">
              <input type="text" placeholder="Nom du client" value={form.nomClient} onChange={e => setForm(p => ({ ...p, nomClient: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <input type="tel" placeholder="Téléphone" value={form.telephone} onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <input type="datetime-local" value={form.dateHeure} onChange={e => setForm(p => ({ ...p, dateHeure: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              {prestations.length > 0 && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Prestations :</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {prestations.filter(p => p.disponible !== false).map(p => (
                      <label key={p.id} className="flex items-center gap-2 p-2 bg-slate-700 rounded cursor-pointer">
                        <input type="checkbox" checked={form.prestations.includes(p.id)} onChange={() => togglePrestation(p.id)} />
                        <span className="flex-1">{p.nom}</span>
                        <span className="text-emerald-400">{p.prix} XAF</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-pink-600 py-2 rounded-lg font-medium">Créer</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
