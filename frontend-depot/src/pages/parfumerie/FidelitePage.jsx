import { useState, useEffect } from 'react';
import api from '../../api';

const NIVEAU_STYLES = {
  BRONZE: 'bg-amber-900/50 text-amber-300',
  ARGENT: 'bg-slate-500/50 text-slate-200',
  OR: 'bg-yellow-600/50 text-yellow-200',
  PLATINE: 'bg-purple-900/50 text-purple-300',
};

export default function FidelitePage() {
  const [stats, setStats] = useState(null);
  const [topClients, setTopClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('stats');
  const [clientId, setClientId] = useState('');
  const [clientProgramme, setClientProgramme] = useState(null);
  const [showAjouter, setShowAjouter] = useState(false);
  const [ajoutForm, setAjoutForm] = useState({ clientId: '', points: 1, motif: '' });

  const fetchStats = async () => {
    try {
      const [statsRes, topRes] = await Promise.all([
        api.get('/parfumerie/fidelite/stats'),
        api.get('/parfumerie/fidelite/top-clients', { params: { limit: 10 } }),
      ]);
      setStats(statsRes.data);
      setTopClients(topRes.data || []);
    } catch (err) {
      console.error('Erreur chargement stats fidélité:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleRechercheClient = async () => {
    if (!clientId) return;
    try {
      const res = await api.get(`/parfumerie/fidelite/client/${clientId}`);
      setClientProgramme(res.data);
    } catch (err) {
      console.error('Erreur recherche client:', err);
      setClientProgramme(null);
    }
  };

  const handleAjouterPoints = async (e) => {
    e.preventDefault();
    try {
      await api.post('/parfumerie/fidelite/points', ajoutForm);
      setShowAjouter(false);
      setAjoutForm({ clientId: '', points: 1, motif: '' });
      fetchStats();
    } catch (err) {
      console.error('Erreur ajout points:', err);
    }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">🎁 Programme de Fidélité</h1>

      <div className="flex gap-2 mb-6">
        {['stats', 'recherche', 'ajouter'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg ${tab === t ? 'bg-fuchsia-600' : 'bg-slate-700'}`}>
            {t === 'stats' ? 'Statistiques' : t === 'recherche' ? 'Rechercher client' : 'Ajouter points'}
          </button>
        ))}
      </div>

      {tab === 'stats' && (
        <>
          {loading ? (
            <div className="text-center py-12 text-slate-400">Chargement...</div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-fuchsia-400 text-2xl font-bold">{stats.totalClientsFideles}</p><p className="text-slate-400 text-sm">Clients fidélisés</p></div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-yellow-400 text-2xl font-bold">{stats.totalPointsDistribues}</p><p className="text-slate-400 text-sm">Points distribués</p></div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-emerald-400 text-2xl font-bold">{stats.pointsMoyen}</p><p className="text-slate-400 text-sm">Points moyen/client</p></div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                  <p className="text-slate-400 text-sm mb-1">Niveaux</p>
                  {Object.entries(stats.repartitionNiveaux || {}).map(([niveau, count]) => (
                    <span key={niveau} className={`inline-block mr-1 mb-1 px-2 py-0.5 rounded text-xs ${NIVEAU_STYLES[niveau] || ''}`}>{niveau}: {count}</span>
                  ))}
                </div>
              </div>

              <h2 className="text-lg font-semibold mb-3">Top clients</h2>
              <div className="space-y-2">
                {topClients.map((c, i) => (
                  <div key={c.id} className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-slate-500">#{i + 1}</span>
                      <div>
                        <p className="font-medium">{c.client?.nom || c.client?.prenom || 'Client'}</p>
                        <span className={`text-xs px-2 py-0.5 rounded ${NIVEAU_STYLES[c.niveau] || ''}`}>{c.niveau}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-400 font-semibold">{c.points} pts</p>
                      <p className="text-slate-500 text-xs">{c.totalDepense} XAF dépensés</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500">Aucune donnée de fidélité.</div>
          )}
        </>
      )}

      {tab === 'recherche' && (
        <div>
          <div className="flex gap-2 mb-4">
            <input type="text" placeholder="ID du client" value={clientId} onChange={e => setClientId(e.target.value)} className="flex-1 p-3 bg-slate-800 border border-slate-700 rounded-lg" />
            <button onClick={handleRechercheClient} className="bg-fuchsia-600 px-4 py-2 rounded-lg">Rechercher</button>
          </div>
          {clientProgramme ? (
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-lg">{clientProgramme.client?.nom || 'Client'}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${NIVEAU_STYLES[clientProgramme.niveau] || ''}`}>{clientProgramme.niveau}</span>
                </div>
                <p className="text-yellow-400 text-2xl font-bold">{clientProgramme.points} pts</p>
              </div>
              <p className="text-slate-400 text-sm mt-2">Total dépensé: {clientProgramme.totalDepense} XAF</p>
              {clientProgramme.historique?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-slate-400 mb-2">Historique des points</p>
                  {clientProgramme.historique.map(h => (
                    <div key={h.id} className="flex justify-between text-sm py-1 border-b border-slate-700 last:border-0">
                      <span className="text-slate-400">{h.motif}</span>
                      <span className={h.points > 0 ? 'text-emerald-400' : 'text-red-400'}>{h.points > 0 ? '+' : ''}{h.points}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : clientId && (
            <div className="text-center py-8 text-slate-500">Aucun programme trouvé pour ce client.</div>
          )}
        </div>
      )}

      {tab === 'ajouter' && (
        <div className="max-w-md">
          <form onSubmit={handleAjouterPoints} className="space-y-3 bg-slate-800 p-6 rounded-xl border border-slate-700">
            <input type="text" placeholder="ID du client" value={ajoutForm.clientId} onChange={e => setAjoutForm(p => ({ ...p, clientId: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
            <input type="number" placeholder="Points" min="1" value={ajoutForm.points} onChange={e => setAjoutForm(p => ({ ...p, points: parseInt(e.target.value) || 0 }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
            <input type="text" placeholder="Motif (ex: Achat, Anniversaire, Parrainage)" value={ajoutForm.motif} onChange={e => setAjoutForm(p => ({ ...p, motif: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
            <button type="submit" className="w-full bg-fuchsia-600 py-3 rounded-lg font-medium">Ajouter les points</button>
          </form>
        </div>
      )}
    </div>
  );
}
