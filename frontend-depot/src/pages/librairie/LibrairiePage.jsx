import { useState, useEffect } from 'react';
import api from '../../api';

export default function LibrairiePage() {
  const [tab, setTab] = useState('catalogue');
  const [livres, setLivres] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [articles, setArticles] = useState([]);
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showLivreModal, setShowLivreModal] = useState(false);
  const [showCmdModal, setShowCmdModal] = useState(false);
  const [livreForm, setLivreForm] = useState({ articleId: '', isbn: '', auteur: '', editeur: '', anneeParution: '', genre: '', langue: 'FR', nbPages: '' });
  const [cmdForm, setCmdForm] = useState({ clientId: '', designation: '', isbn: '', quantite: 1, notes: '', dateArrivee: '' });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [lv, cm, art, cl, st] = await Promise.all([
        api.get('/librairie/catalogue', { params: { search, limit: 50 } }),
        api.get('/librairie/commandes', { params: { limit: 30 } }),
        api.get('/articles', { params: { limit: 200 } }),
        api.get('/clients', { params: { limit: 200 } }),
        api.get('/librairie/stats'),
      ]);
      setLivres(lv.data.data || lv.data || []);
      setCommandes(cm.data.data || cm.data || []);
      setArticles(art.data.data || art.data || []);
      setClients(cl.data.data || cl.data || []);
      setStats(st.data || null);
    } catch (err) { console.error('Erreur chargement:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { const t = setTimeout(() => fetchAll(), 300); return () => clearTimeout(t); }, [search]);

  const handleCreateLivre = async (e) => {
    e.preventDefault();
    await api.post('/librairie/catalogue', { ...livreForm, anneeParution: livreForm.anneeParution ? parseInt(livreForm.anneeParution) : undefined, nbPages: livreForm.nbPages ? parseInt(livreForm.nbPages) : undefined });
    setShowLivreModal(false);
    setLivreForm({ articleId: '', isbn: '', auteur: '', editeur: '', anneeParution: '', genre: '', langue: 'FR', nbPages: '' });
    fetchAll();
  };

  const handleCreateCmd = async (e) => {
    e.preventDefault();
    await api.post('/librairie/commandes', { ...cmdForm, quantite: parseInt(cmdForm.quantite) || 1 });
    setShowCmdModal(false);
    setCmdForm({ clientId: '', designation: '', isbn: '', quantite: 1, notes: '', dateArrivee: '' });
    fetchAll();
  };

  const handleStatutCmd = async (id, statut) => {
    await api.post(`/librairie/commandes/${id}/statut`, { statut });
    fetchAll();
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📚 Librairie / Papeterie</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowLivreModal(true)} className="bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-lg text-sm font-medium">+ Livre</button>
          <button onClick={() => setShowCmdModal(true)} className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg text-sm font-medium">+ Commande</button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {['catalogue', 'commandes', 'stats'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg ${tab === t ? 'bg-indigo-600' : 'bg-slate-700'}`}>
            {t === 'catalogue' ? '📖 Catalogue' : t === 'commandes' ? '📋 Commandes' : '📊 Stats'}
          </button>
        ))}
      </div>

      <input type="text" placeholder="Rechercher par titre, auteur, genre..." value={search} onChange={e => setSearch(e.target.value)} className={`w-full p-3 bg-slate-800 border border-slate-700 rounded-lg mb-4 ${tab !== 'catalogue' ? 'hidden' : ''}`} />

      {loading && <div className="text-center py-12 text-slate-400">Chargement...</div>}

      {!loading && tab === 'catalogue' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {livres.map(l => (
            <div key={l.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <h3 className="font-semibold text-lg">{l.article?.designation || l.article?.nom}</h3>
              <p className="text-sm text-indigo-300">{l.auteur}</p>
              <div className="flex gap-1 mt-1 flex-wrap text-xs text-slate-400">
                {l.genre && <span className="bg-indigo-900/30 text-indigo-300 px-2 py-0.5 rounded">{l.genre}</span>}
                {l.editeur && <span>{l.editeur}</span>}
                {l.anneeParution && <span>{l.anneeParution}</span>}
                {l.langue && <span>{l.langue}</span>}
                {l.nbPages && <span>{l.nbPages}p.</span>}
              </div>
              {l.isbn && <p className="text-xs text-slate-500 mt-1">ISBN: {l.isbn}</p>}
              <div className="mt-2 flex justify-between items-center pt-2 border-t border-slate-700">
                <span className="text-emerald-400 font-semibold">{l.article?.prixVente || 0} XAF</span>
                <span className="text-slate-500 text-xs">{l.article?.stocks?.reduce((s, st) => s + (st.quantite || 0), 0) || 0} en stock</span>
              </div>
            </div>
          ))}
          {livres.length === 0 && <div className="col-span-full text-center py-12 text-slate-500">Aucun livre dans le catalogue.</div>}
        </div>
      )}

      {!loading && tab === 'commandes' && (
        <div className="space-y-2">
          {commandes.map(c => (
            <div key={c.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{c.designation}</p>
                  <p className="text-sm text-slate-400">Client: {c.client?.nom || c.clientId}</p>
                  <p className="text-xs text-slate-500">Qty: {c.quantite} · {c.isbn ? `ISBN: ${c.isbn}` : ''} · {new Date(c.dateCommande).toLocaleDateString()}</p>
                  {c.notes && <p className="text-xs text-slate-500 italic mt-1">{c.notes}</p>}
                </div>
                <div className="text-right">
                  <select value={c.statut} onChange={e => handleStatutCmd(c.id, e.target.value)} className="bg-slate-700 text-xs rounded p-1">
                    <option value="EN_ATTENTE">En attente</option>
                    <option value="ARRIVE">Arrivé</option>
                    <option value="LIVRE">Livré</option>
                    <option value="ANNULE">Annulé</option>
                  </select>
                  {c.dateArrivee && <p className="text-xs text-slate-500 mt-1">Arrivée: {new Date(c.dateArrivee).toLocaleDateString()}</p>}
                </div>
              </div>
            </div>
          ))}
          {commandes.length === 0 && <div className="text-center py-8 text-slate-500">Aucune commande spéciale.</div>}
        </div>
      )}

      {!loading && tab === 'stats' && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-indigo-400 text-2xl font-bold">{stats.totalLivres}</p><p className="text-slate-400 text-sm">Livres au catalogue</p></div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-yellow-400 text-2xl font-bold">{stats.totalEnAttente}</p><p className="text-slate-400 text-sm">Commandes en attente</p></div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-emerald-400 text-2xl font-bold">{stats.totalArrivees}</p><p className="text-slate-400 text-sm">Arrivées</p></div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-blue-400 text-2xl font-bold">{stats.commandes30j}</p><p className="text-slate-400 text-sm">Commandes (30j)</p></div>
        </div>
      )}

      {showLivreModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowLivreModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Ajouter un livre</h2>
            <form onSubmit={handleCreateLivre} className="space-y-3">
              <select value={livreForm.articleId} onChange={e => setLivreForm(p => ({ ...p, articleId: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required>
                <option value="">Article...</option>
                {articles.map(a => <option key={a.id} value={a.id}>{a.designation || a.nom} — {a.prixVente} XAF</option>)}
              </select>
              <input type="text" placeholder="ISBN" value={livreForm.isbn} onChange={e => setLivreForm(p => ({ ...p, isbn: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <input type="text" placeholder="Auteur" value={livreForm.auteur} onChange={e => setLivreForm(p => ({ ...p, auteur: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <input type="text" placeholder="Éditeur" value={livreForm.editeur} onChange={e => setLivreForm(p => ({ ...p, editeur: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <div className="grid grid-cols-3 gap-2">
                <input type="text" placeholder="Genre" value={livreForm.genre} onChange={e => setLivreForm(p => ({ ...p, genre: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
                <input type="text" placeholder="Langue" value={livreForm.langue} onChange={e => setLivreForm(p => ({ ...p, langue: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
                <input type="number" placeholder="Pages" value={livreForm.nbPages} onChange={e => setLivreForm(p => ({ ...p, nbPages: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
              </div>
              <input type="number" placeholder="Année parution" value={livreForm.anneeParution} onChange={e => setLivreForm(p => ({ ...p, anneeParution: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-indigo-600 py-2 rounded-lg">Ajouter</button>
                <button type="button" onClick={() => setShowLivreModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCmdModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowCmdModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Commande spéciale</h2>
            <form onSubmit={handleCreateCmd} className="space-y-3">
              <select value={cmdForm.clientId} onChange={e => setCmdForm(p => ({ ...p, clientId: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required>
                <option value="">Client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nom || c.prenom || c.id}</option>)}
              </select>
              <input type="text" placeholder="Désignation du livre" value={cmdForm.designation} onChange={e => setCmdForm(p => ({ ...p, designation: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <input type="text" placeholder="ISBN (optionnel)" value={cmdForm.isbn} onChange={e => setCmdForm(p => ({ ...p, isbn: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <input type="number" placeholder="Quantité" min="1" value={cmdForm.quantite} onChange={e => setCmdForm(p => ({ ...p, quantite: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <input type="date" placeholder="Date arrivée prévue" value={cmdForm.dateArrivee} onChange={e => setCmdForm(p => ({ ...p, dateArrivee: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <textarea placeholder="Notes" value={cmdForm.notes} onChange={e => setCmdForm(p => ({ ...p, notes: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" rows={2} />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-green-600 py-2 rounded-lg">Créer</button>
                <button type="button" onClick={() => setShowCmdModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
