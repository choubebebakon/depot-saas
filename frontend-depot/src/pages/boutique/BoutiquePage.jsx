import { useState, useEffect } from 'react';
import api from '../../api';

export default function BoutiquePage() {
  const [tab, setTab] = useState('promotions');
  const [promotions, setPromotions] = useState([]);
  const [articles, setArticles] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditClient, setCreditClient] = useState(null);
  const [creditId, setCreditId] = useState('');

  const [promoForm, setPromoForm] = useState({ articleId: '', nom: '', type: 'POURCENTAGE', valeur: '', prixPromo: '', dateDebut: '', dateFin: '' });
  const [creditForm, setCreditForm] = useState({ montant: '', description: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [p, a, c] = await Promise.all([
        api.get('/boutique/promotions'),
        api.get('/articles', { params: { limit: 200 } }),
        api.get('/clients', { params: { limit: 200 } }),
      ]);
      setPromotions(p.data || []);
      setArticles(a.data.data || a.data || []);
      setClients(c.data.data || c.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreatePromo = async (e) => {
    e.preventDefault();
    await api.post('/boutique/promotions', {
      ...promoForm, valeur: parseFloat(promoForm.valeur), prixPromo: parseFloat(promoForm.prixPromo),
      dateDebut: new Date(promoForm.dateDebut).toISOString(), dateFin: new Date(promoForm.dateFin).toISOString(),
    });
    setShowPromoModal(false);
    setPromoForm({ articleId: '', nom: '', type: 'POURCENTAGE', valeur: '', prixPromo: '', dateDebut: '', dateFin: '' });
    fetchData();
  };

  const handleSearchCredit = async () => {
    if (!creditId) return;
    try {
      const res = await api.get(`/clients/${creditId}/credit`);
      setCreditClient(res.data);
    } catch { setCreditClient(null); }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🏪 Boutique</h1>
        <button onClick={() => setShowPromoModal(true)} className="bg-cyan-600 hover:bg-cyan-700 px-3 py-2 rounded-lg text-sm font-medium">+ Promotion</button>
      </div>

      <div className="flex gap-2 mb-6">
        {['promotions', 'credit'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg ${tab === t ? 'bg-cyan-600' : 'bg-slate-700'}`}>
            {t === 'promotions' ? '🏷️ Promotions' : '💳 Crédit clients'}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-12 text-slate-400">Chargement...</div>}

      {!loading && tab === 'promotions' && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {promotions.map(p => (
            <div key={p.id} className={`bg-slate-800 p-4 rounded-xl border ${p.actif ? 'border-emerald-700' : 'border-slate-700 opacity-60'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{p.nom}</h3>
                  <p className="text-sm text-slate-400">{p.article?.designation || p.articleId}</p>
                  <span className="text-xs text-cyan-300 bg-cyan-900/30 px-2 py-0.5 rounded">{p.type}</span>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-bold">{p.prixPromo} XAF</p>
                  <p className="text-xs text-slate-500 line-through">{p.valeur}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Du {new Date(p.dateDebut).toLocaleDateString()} au {new Date(p.dateFin).toLocaleDateString()}</p>
              <span className={`text-xs px-2 py-0.5 rounded ${p.actif ? 'text-emerald-300 bg-emerald-900/30' : 'text-red-300 bg-red-900/30'}`}>{p.actif ? 'Active' : 'Inactive'}</span>
            </div>
          ))}
          {promotions.length === 0 && <div className="col-span-full text-center py-8 text-slate-500">Aucune promotion.</div>}
        </div>
      )}

      {!loading && tab === 'credit' && (
        <div>
          <div className="flex gap-2 mb-4">
            <select value={creditId} onChange={e => setCreditId(e.target.value)} className="flex-1 p-3 bg-slate-800 border border-slate-700 rounded-lg">
              <option value="">Sélectionner un client...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.nom || c.prenom || c.id}</option>)}
            </select>
            <button onClick={handleSearchCredit} className="bg-cyan-600 px-4 py-2 rounded-lg">Rechercher</button>
          </div>

          {creditClient && (
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <p className="font-semibold">Solde: <span className="text-emerald-400">{creditClient.solde} XAF</span></p>
              <p className="text-sm text-slate-400">Plafond: {creditClient.plafond} XAF</p>
            </div>
          )}
        </div>
      )}

      {showPromoModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowPromoModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Nouvelle promotion</h2>
            <form onSubmit={handleCreatePromo} className="space-y-3">
              <select value={promoForm.articleId} onChange={e => setPromoForm(p => ({ ...p, articleId: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required>
                <option value="">Article...</option>
                {articles.map(a => <option key={a.id} value={a.id}>{a.designation || a.nom}</option>)}
              </select>
              <input type="text" placeholder="Nom de la promotion" value={promoForm.nom} onChange={e => setPromoForm(p => ({ ...p, nom: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <select value={promoForm.type} onChange={e => setPromoForm(p => ({ ...p, type: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg">
                <option value="POURCENTAGE">%</option>
                <option value="MONTANT_FIXE">Montant fixe</option>
                <option value="PRIX_FIXE">Prix fixe</option>
              </select>
              <input type="number" placeholder="Valeur" value={promoForm.valeur} onChange={e => setPromoForm(p => ({ ...p, valeur: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <input type="number" placeholder="Prix promo final" value={promoForm.prixPromo} onChange={e => setPromoForm(p => ({ ...p, prixPromo: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={promoForm.dateDebut} onChange={e => setPromoForm(p => ({ ...p, dateDebut: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" required />
                <input type="date" value={promoForm.dateFin} onChange={e => setPromoForm(p => ({ ...p, dateFin: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" required />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-cyan-600 py-2 rounded-lg">Créer</button>
                <button type="button" onClick={() => setShowPromoModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
