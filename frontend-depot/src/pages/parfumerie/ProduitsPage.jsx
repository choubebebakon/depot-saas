import { useState, useEffect } from 'react';
import api from '../../api';

export default function ProduitsPage() {
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [articles, setArticles] = useState([]);
  const [form, setForm] = useState({ articleId: '', marque: '', contenance: '', typesPeau: '', ingredients: '', certifications: '', categorie: '' });

  const fetchProduits = async () => {
    try {
      const res = await api.get('/parfumerie/produits', { params: { search, limit: 50 } });
      setProduits(res.data.data || res.data || []);
    } catch (err) {
      console.error('Erreur chargement produits:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async () => {
    try {
      const res = await api.get('/articles', { params: { limit: 200 } });
      const data = res.data.data || res.data;
      setArticles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur chargement articles:', err);
    }
  };

  useEffect(() => { fetchProduits(); }, [search]);
  useEffect(() => { fetchArticles(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/parfumerie/produits', form);
      setShowModal(false);
      setForm({ articleId: '', marque: '', contenance: '', typesPeau: '', ingredients: '', certifications: '', categorie: '' });
      fetchProduits();
    } catch (err) {
      console.error('Erreur création produit cosmétique:', err);
    }
  };

  const getStockTotal = (produit) => {
    if (!produit.article?.stocks) return 0;
    return produit.article.stocks.reduce((s, st) => s + (st.quantite || 0), 0);
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🧴 Catalogue Produits Cosmétiques</h1>
        <button onClick={() => setShowModal(true)} className="bg-fuchsia-600 hover:bg-fuchsia-700 px-4 py-2 rounded-lg font-medium">+ Ajouter produit</button>
      </div>

      <input type="text" placeholder="Rechercher par nom, marque, catégorie..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg mb-4 text-white placeholder-slate-500" />

      {loading ? (
        <div className="text-center py-12 text-slate-400">Chargement...</div>
      ) : produits.length === 0 ? (
        <div className="text-center py-12 text-slate-500">Aucun produit cosmétique trouvé.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {produits.map((p) => (
            <div key={p.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{p.article?.designation || p.article?.nom || 'Produit'}</h3>
                <span className="bg-fuchsia-900/50 text-fuchsia-300 text-xs px-2 py-0.5 rounded">{p.categorie}</span>
              </div>
              <div className="space-y-1 text-sm text-slate-400">
                <p>🧴 {p.marque}</p>
                {p.contenance && <p>📏 {p.contenance}</p>}
                {p.typesPeau && <p>👤 {p.typesPeau}</p>}
                {p.certifications && <p>✅ {p.certifications}</p>}
                {p.ingredients && <p className="text-xs text-slate-500 italic">{p.ingredients.substring(0, 100)}{p.ingredients.length > 100 ? '...' : ''}</p>}
              </div>
              <div className="mt-3 flex justify-between items-center pt-3 border-t border-slate-700">
                <span className="text-emerald-400 font-semibold">{p.article?.prixVente || 0} XAF</span>
                <span className="text-slate-500 text-xs">Stock: {getStockTotal(p)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Ajouter un produit cosmétique</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <select value={form.articleId} onChange={e => setForm(p => ({ ...p, articleId: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required>
                <option value="">Sélectionner un article...</option>
                {articles.map(a => <option key={a.id} value={a.id}>{a.designation || a.nom} — {a.prixVente} XAF</option>)}
              </select>
              <input type="text" placeholder="Marque" value={form.marque} onChange={e => setForm(p => ({ ...p, marque: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <input type="text" placeholder="Contenance (ex: 200ml)" value={form.contenance} onChange={e => setForm(p => ({ ...p, contenance: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <input type="text" placeholder="Types de peau" value={form.typesPeau} onChange={e => setForm(p => ({ ...p, typesPeau: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <input type="text" placeholder="Catégorie (ex: Soin, Maquillage, Parfum)" value={form.categorie} onChange={e => setForm(p => ({ ...p, categorie: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <textarea placeholder="Ingrédients" value={form.ingredients} onChange={e => setForm(p => ({ ...p, ingredients: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" rows={2} />
              <input type="text" placeholder="Certifications (ex: Bio, Naturel)" value={form.certifications} onChange={e => setForm(p => ({ ...p, certifications: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-fuchsia-600 py-2 rounded-lg font-medium">Ajouter</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
