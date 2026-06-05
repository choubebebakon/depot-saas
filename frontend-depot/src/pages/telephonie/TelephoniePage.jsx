import { useState, useEffect } from 'react';
import api from '../../api';

export default function TelephoniePage() {
  const [tab, setTab] = useState('telephones');
  const [telephones, setTelephones] = useState([]);
  const [reparations, setReparations] = useState([]);
  const [articles, setArticles] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTelModal, setShowTelModal] = useState(false);
  const [showRepModal, setShowRepModal] = useState(false);
  const [telForm, setTelForm] = useState({ articleId: '', imei: '', marque: '', modele: '', couleur: '', stockage: '', garantieMois: 12, etat: 'NEUF' });
  const [repForm, setRepForm] = useState({ telephoneId: '', clientId: '', description: '', cout: '', statut: 'EN_ATTENTE' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [t, r, a, c] = await Promise.all([
        api.get('/telephones'),
        api.get('/reparations'),
        api.get('/articles', { params: { limit: 200 } }),
        api.get('/clients', { params: { limit: 200 } }),
      ]);
      setTelephones(t.data || []);
      setReparations(r.data || []);
      setArticles(a.data.data || a.data || []);
      setClients(c.data.data || c.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateTel = async (e) => {
    e.preventDefault();
    await api.post('/telephones', { ...telForm, garantieMois: parseInt(telForm.garantieMois) || 12 });
    setShowTelModal(false);
    setTelForm({ articleId: '', imei: '', marque: '', modele: '', couleur: '', stockage: '', garantieMois: 12, etat: 'NEUF' });
    fetchData();
  };

  const handleCreateRep = async (e) => {
    e.preventDefault();
    await api.post('/reparations', { ...repForm, cout: repForm.cout ? parseFloat(repForm.cout) : undefined });
    setShowRepModal(false);
    setRepForm({ telephoneId: '', clientId: '', description: '', cout: '', statut: 'EN_ATTENTE' });
    fetchData();
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📱 Téléphonie</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowTelModal(true)} className="bg-violet-600 hover:bg-violet-700 px-3 py-2 rounded-lg text-sm font-medium">+ Téléphone</button>
          <button onClick={() => setShowRepModal(true)} className="bg-violet-600 hover:bg-violet-700 px-3 py-2 rounded-lg text-sm font-medium">+ Réparation</button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {['telephones', 'reparations'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg ${tab === t ? 'bg-violet-600' : 'bg-slate-700'}`}>
            {t === 'telephones' ? '📱 Téléphones' : '🔧 Réparations'}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-12 text-slate-400">Chargement...</div>}

      {!loading && tab === 'telephones' && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {telephones.map(t => (
            <div key={t.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{t.marque} {t.modele}</h3>
                  <p className="text-sm text-slate-400">{t.article?.designation || t.article?.nom}</p>
                  <p className="text-xs text-slate-500">IMEI: {t.imei} · {t.couleur} · {t.stockage}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${t.etat === 'NEUF' ? 'text-emerald-300 bg-emerald-900/30' : 'text-yellow-300 bg-yellow-900/30'}`}>{t.etat}</span>
              </div>
              <p className="text-emerald-400 font-semibold mt-1">{t.article?.prixVente || 0} XAF</p>
              {t.garantieMois && <p className="text-xs text-slate-500">Garantie: {t.garantieMois} mois</p>}
            </div>
          ))}
          {telephones.length === 0 && <div className="col-span-full text-center py-8 text-slate-500">Aucun téléphone.</div>}
        </div>
      )}

      {!loading && tab === 'reparations' && (
        <div className="space-y-2">
          {reparations.map(r => (
            <div key={r.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{r.telephone?.marque || r.telephoneId} {r.telephone?.modele || ''}</p>
                  <p className="text-sm text-slate-400">{r.description}</p>
                  <p className="text-xs text-slate-500">Client: {r.client?.nom || r.clientId || 'N/C'}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded ${r.statut === 'TERMINEE' ? 'text-emerald-300 bg-emerald-900/30' : r.statut === 'EN_COURS' ? 'text-yellow-300 bg-yellow-900/30' : r.statut === 'EN_ATTENTE' ? 'text-blue-300 bg-blue-900/30' : 'text-red-300 bg-red-900/30'}`}>{r.statut}</span>
                  {r.cout > 0 && <p className="text-emerald-400 font-semibold mt-1">{r.cout} XAF</p>}
                </div>
              </div>
            </div>
          ))}
          {reparations.length === 0 && <div className="text-center py-8 text-slate-500">Aucune réparation.</div>}
        </div>
      )}

      {showTelModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowTelModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Ajouter un téléphone</h2>
            <form onSubmit={handleCreateTel} className="space-y-3">
              <select value={telForm.articleId} onChange={e => setTelForm(p => ({ ...p, articleId: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required>
                <option value="">Article...</option>
                {articles.map(a => <option key={a.id} value={a.id}>{a.designation || a.nom}</option>)}
              </select>
              <input type="text" placeholder="IMEI" value={telForm.imei} onChange={e => setTelForm(p => ({ ...p, imei: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Marque" value={telForm.marque} onChange={e => setTelForm(p => ({ ...p, marque: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" required />
                <input type="text" placeholder="Modèle" value={telForm.modele} onChange={e => setTelForm(p => ({ ...p, modele: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" required />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input type="text" placeholder="Couleur" value={telForm.couleur} onChange={e => setTelForm(p => ({ ...p, couleur: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
                <input type="text" placeholder="Stockage" value={telForm.stockage} onChange={e => setTelForm(p => ({ ...p, stockage: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
                <input type="number" placeholder="Garantie (mois)" value={telForm.garantieMois} onChange={e => setTelForm(p => ({ ...p, garantieMois: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
              </div>
              <select value={telForm.etat} onChange={e => setTelForm(p => ({ ...p, etat: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg">
                <option value="NEUF">Neuf</option><option value="OCCASION">Occasion</option><option value="RECONDITIONNE">Reconditionné</option>
              </select>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-violet-600 py-2 rounded-lg">Ajouter</button>
                <button type="button" onClick={() => setShowTelModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRepModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowRepModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Nouvelle réparation</h2>
            <form onSubmit={handleCreateRep} className="space-y-3">
              <select value={repForm.telephoneId} onChange={e => setRepForm(p => ({ ...p, telephoneId: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required>
                <option value="">Téléphone...</option>
                {telephones.map(t => <option key={t.id} value={t.id}>{t.marque} {t.modele} ({t.imei})</option>)}
              </select>
              <select value={repForm.clientId} onChange={e => setRepForm(p => ({ ...p, clientId: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg">
                <option value="">Client (optionnel)</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nom || c.prenom || c.id}</option>)}
              </select>
              <textarea placeholder="Description de la panne" value={repForm.description} onChange={e => setRepForm(p => ({ ...p, description: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required rows={3} />
              <input type="number" placeholder="Coût réparation" value={repForm.cout} onChange={e => setRepForm(p => ({ ...p, cout: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <select value={repForm.statut} onChange={e => setRepForm(p => ({ ...p, statut: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg">
                <option value="EN_ATTENTE">En attente</option><option value="EN_COURS">En cours</option><option value="TERMINEE">Terminée</option>
              </select>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-violet-600 py-2 rounded-lg">Créer</button>
                <button type="button" onClick={() => setShowRepModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
