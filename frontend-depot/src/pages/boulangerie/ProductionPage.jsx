import { useState, useEffect } from 'react';
import api from '../../api';

export default function ProductionPage() {
  const [recettes, setRecettes] = useState([]);
  const [productions, setProductions] = useState([]);
  const [articles, setArticles] = useState([]);
  const [tab, setTab] = useState('recettes');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showRecetteModal, setShowRecetteModal] = useState(false);
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [selectedRecette, setSelectedRecette] = useState(null);

  const [recetteForm, setRecetteForm] = useState({ articleId: '', nom: '', instructions: '', tempsPrep: '', tempsCuisson: '', temperature: '', portionsUnite: 1 });
  const [prodForm, setProdForm] = useState({ recetteId: '', quantiteProduite: 0, quantiteVendue: 0, coutProduction: '', notes: '' });
  const [ingrForm, setIngrForm] = useState({ articleId: '', quantite: 0, unite: 'g' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rc, pd, art, statsRes] = await Promise.all([
        api.get('/boulangerie/recettes', { params: { search, limit: 50 } }),
        api.get('/boulangerie/production', { params: { limit: 30 } }),
        api.get('/articles', { params: { limit: 200 } }),
        api.get('/boulangerie/stats'),
      ]);
      setRecettes(rc.data.data || rc.data || []);
      setProductions(pd.data.data || pd.data || []);
      setArticles(art.data.data || art.data || []);
      setStats(statsRes.data || null);
    } catch (err) {
      console.error('Erreur chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  const [stats, setStats] = useState(null);

  useEffect(() => { const t = setTimeout(() => fetchData(), 300); return () => clearTimeout(t); }, [search]);

  const handleCreateRecette = async (e) => {
    e.preventDefault();
    try {
      await api.post('/boulangerie/recettes', {
        ...recetteForm,
        tempsPrep: recetteForm.tempsPrep ? parseInt(recetteForm.tempsPrep) : undefined,
        tempsCuisson: recetteForm.tempsCuisson ? parseInt(recetteForm.tempsCuisson) : undefined,
        temperature: recetteForm.temperature ? parseInt(recetteForm.temperature) : undefined,
        portionsUnite: parseInt(recetteForm.portionsUnite) || 1,
      });
      setShowRecetteModal(false);
      setRecetteForm({ articleId: '', nom: '', instructions: '', tempsPrep: '', tempsCuisson: '', temperature: '', portionsUnite: 1 });
      fetchData();
    } catch (err) {
      console.error('Erreur création recette:', err);
    }
  };

  const handleCreateProduction = async (e) => {
    e.preventDefault();
    try {
      await api.post('/boulangerie/production', {
        ...prodForm,
        quantiteProduite: parseInt(prodForm.quantiteProduite),
        quantiteVendue: parseInt(prodForm.quantiteVendue) || 0,
        coutProduction: prodForm.coutProduction ? parseFloat(prodForm.coutProduction) : undefined,
      });
      setShowProductionModal(false);
      setProdForm({ recetteId: '', quantiteProduite: 0, quantiteVendue: 0, coutProduction: '', notes: '' });
      fetchData();
    } catch (err) {
      console.error('Erreur enregistrement production:', err);
    }
  };

  const handleAddIngredient = async (recetteId) => {
    try {
      await api.post(`/boulangerie/recettes/${recetteId}/ingredients`, ingrForm);
      setIngrForm({ articleId: '', quantite: 0, unite: 'g' });
      fetchData();
    } catch (err) {
      console.error('Erreur ajout ingrédient:', err);
    }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🥖 Boulangerie / Pâtisserie</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowRecetteModal(true)} className="bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-lg font-medium">+ Recette</button>
          <button onClick={() => setShowProductionModal(true)} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium">+ Production</button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {['recettes', 'production', 'stats'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg ${tab === t ? 'bg-amber-600' : 'bg-slate-700'}`}>
            {t === 'recettes' ? '📝 Recettes' : t === 'production' ? '🥖 Production' : '📊 Statistiques'}
          </button>
        ))}
      </div>

      {tab === 'stats' && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-amber-400 text-2xl font-bold">{stats.totalProduit}</p><p className="text-slate-400 text-sm">Produits aujourd'hui</p></div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-emerald-400 text-2xl font-bold">{stats.totalVendu}</p><p className="text-slate-400 text-sm">Vendus</p></div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-red-400 text-2xl font-bold">{stats.totalInvendu}</p><p className="text-slate-400 text-sm">Invendus</p></div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-blue-400 text-2xl font-bold">{stats.coutTotal.toLocaleString()} XAF</p><p className="text-slate-400 text-sm">Coût production</p></div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-amber-400 text-2xl font-bold">{stats.totalRecettes}</p><p className="text-slate-400 text-sm">Recettes</p></div>
        </div>
      )}

      {tab === 'recettes' && (
        <>
          <input type="text" placeholder="Rechercher une recette..." value={search} onChange={e => setSearch(e.target.value)} className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg mb-4" />
          {loading ? (
            <div className="text-center py-12 text-slate-400">Chargement...</div>
          ) : recettes.length === 0 ? (
            <div className="text-center py-12 text-slate-500">Aucune recette. Créez-en une !</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recettes.map(r => (
                <div key={r.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{r.nom}</h3>
                    <span className="text-slate-500 text-xs">{r.article?.designation || r.article?.nom}</span>
                  </div>
                  <div className="flex gap-2 text-xs text-slate-500 mb-2 flex-wrap">
                    {r.tempsPrep && <span>⏲️ Prep: {r.tempsPrep}min</span>}
                    {r.tempsCuisson && <span>🔥 Cuisson: {r.tempsCuisson}min</span>}
                    {r.temperature && <span>🌡️ {r.temperature}°C</span>}
                    <span>🍞 {r.portionsUnite} p./unité</span>
                  </div>
                  {r.ingredients?.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-slate-400 mb-1">Ingrédients:</p>
                      {r.ingredients.map(i => (
                        <span key={i.id} className="inline-block bg-slate-700 text-xs px-2 py-0.5 rounded mr-1 mb-1">
                          {i.article?.designation || i.article?.nom} {i.quantite}{i.unite}
                        </span>
                      ))}
                    </div>
                  )}
                  {r.instructions && <p className="text-xs text-slate-500 italic">{r.instructions.substring(0, 120)}{r.instructions.length > 120 ? '...' : ''}</p>}
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <div className="flex gap-1">
                      <select value="" onChange={e => { if (e.target.value) handleAddIngredient(r.id); }} className="flex-1 text-xs bg-slate-700 rounded p-1">
                        <option value="">+ Ingrédient...</option>
                        {articles.map(a => <option key={a.id} value={a.id}>{a.designation || a.nom}</option>)}
                      </select>
                      <input type="number" placeholder="Qté" className="w-16 text-xs bg-slate-700 rounded p-1" value={ingrForm.articleId === r.id ? ingrForm.quantite : ''} onChange={e => setIngrForm(p => ({ ...p, quantite: parseFloat(e.target.value) || 0, articleId: e.target.value ? r.id : '' }))} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'production' && (
        <>
          <div className="space-y-2">
            {productions.map(p => (
              <div key={p.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{p.recette?.nom}</p>
                  <p className="text-sm text-slate-400">{new Date(p.date).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-blue-400">Prod: {p.quantiteProduite}</span>
                  <span className="text-emerald-400">Vendu: {p.quantiteVendue}</span>
                  <span className="text-red-400">Invendu: {p.quantiteInvendue}</span>
                  {p.coutProduction && <span className="text-slate-400">{p.coutProduction} XAF</span>}
                </div>
              </div>
            ))}
            {productions.length === 0 && <div className="text-center py-12 text-slate-500">Aucune production enregistrée.</div>}
          </div>
        </>
      )}

      {showRecetteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowRecetteModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Nouvelle recette</h2>
            <form onSubmit={handleCreateRecette} className="space-y-3">
              <select value={recetteForm.articleId} onChange={e => setRecetteForm(p => ({ ...p, articleId: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required>
                <option value="">Article produit...</option>
                {articles.map(a => <option key={a.id} value={a.id}>{a.designation || a.nom} — {a.prixVente} XAF</option>)}
              </select>
              <input type="text" placeholder="Nom de la recette" value={recetteForm.nom} onChange={e => setRecetteForm(p => ({ ...p, nom: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <textarea placeholder="Instructions de préparation" value={recetteForm.instructions} onChange={e => setRecetteForm(p => ({ ...p, instructions: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" rows={3} />
              <div className="grid grid-cols-3 gap-2">
                <input type="number" placeholder="Prep (min)" value={recetteForm.tempsPrep} onChange={e => setRecetteForm(p => ({ ...p, tempsPrep: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
                <input type="number" placeholder="Cuisson (min)" value={recetteForm.tempsCuisson} onChange={e => setRecetteForm(p => ({ ...p, tempsCuisson: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
                <input type="number" placeholder="°C" value={recetteForm.temperature} onChange={e => setRecetteForm(p => ({ ...p, temperature: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-amber-600 py-2 rounded-lg font-medium">Créer</button>
                <button type="button" onClick={() => setShowRecetteModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProductionModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowProductionModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Enregistrer production</h2>
            <form onSubmit={handleCreateProduction} className="space-y-3">
              <select value={prodForm.recetteId} onChange={e => setProdForm(p => ({ ...p, recetteId: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required>
                <option value="">Sélectionner recette...</option>
                {recettes.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
              </select>
              <input type="number" placeholder="Quantité produite" min="0" value={prodForm.quantiteProduite} onChange={e => setProdForm(p => ({ ...p, quantiteProduite: parseInt(e.target.value) || 0 }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <input type="number" placeholder="Quantité vendue" min="0" value={prodForm.quantiteVendue} onChange={e => setProdForm(p => ({ ...p, quantiteVendue: parseInt(e.target.value) || 0 }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <input type="number" placeholder="Coût production (XAF)" min="0" value={prodForm.coutProduction} onChange={e => setProdForm(p => ({ ...p, coutProduction: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <textarea placeholder="Notes" value={prodForm.notes} onChange={e => setProdForm(p => ({ ...p, notes: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" rows={2} />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-green-600 py-2 rounded-lg font-medium">Enregistrer</button>
                <button type="button" onClick={() => setShowProductionModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
