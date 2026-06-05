import { useState, useEffect } from 'react';
import api from '../../api';

const STATUT_TABLE = { LIBRE: 'text-emerald-300 bg-emerald-900/30', OCCUPEE: 'text-red-300 bg-red-900/30', RESERVEE: 'text-blue-300 bg-blue-900/30' };

export default function RestaurantPage() {
  const [tab, setTab] = useState('tables');
  const [tables, setTables] = useState([]);
  const [plats, setPlats] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPlatModal, setShowPlatModal] = useState(false);
  const [showCommandeModal, setShowCommandeModal] = useState(false);
  const [platForm, setPlatForm] = useState({ nom: '', description: '', prix: '', categorie: 'Plat', tempsPrep: '' });
  const [cmdForm, setCmdForm] = useState({ tableId: '', type: 'SUR_PLACE', notes: '', lignes: [{ platId: '', quantite: 1 }] });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [t, p, c] = await Promise.all([
        api.get('/restaurant/tables'),
        api.get('/restaurant/plats'),
        api.get('/restaurant/commandes'),
      ]);
      setTables(t.data || []);
      setPlats(p.data || []);
      setCommandes(c.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreatePlat = async (e) => {
    e.preventDefault();
    await api.post('/restaurant/plats', { ...platForm, prix: parseFloat(platForm.prix), tempsPrep: platForm.tempsPrep ? parseInt(platForm.tempsPrep) : undefined });
    setShowPlatModal(false);
    setPlatForm({ nom: '', description: '', prix: '', categorie: 'Plat', tempsPrep: '' });
    fetchData();
  };

  const handleCreateCommande = async (e) => {
    e.preventDefault();
    await api.post('/restaurant/commandes', { ...cmdForm, lignes: cmdForm.lignes.filter(l => l.platId) });
    setShowCommandeModal(false);
    setCmdForm({ tableId: '', type: 'SUR_PLACE', notes: '', lignes: [{ platId: '', quantite: 1 }] });
    fetchData();
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🍽️ Restaurant</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowPlatModal(true)} className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-sm font-medium">+ Plat</button>
          <button onClick={() => setShowCommandeModal(true)} className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-sm font-medium">+ Commande</button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {['tables', 'commandes', 'menu'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg ${tab === t ? 'bg-red-600' : 'bg-slate-700'}`}>
            {t === 'tables' ? '🍽️ Tables' : t === 'commandes' ? '📋 Commandes' : '📖 Menu'}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-12 text-slate-400">Chargement...</div>}

      {!loading && tab === 'tables' && (
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
          {tables.map(t => (
            <div key={t.id} className={`p-4 rounded-xl border cursor-pointer ${t.statut === 'LIBRE' ? 'bg-slate-800 border-emerald-700' : t.statut === 'OCCUPEE' ? 'bg-slate-800 border-red-700' : 'bg-slate-800 border-blue-700'}`}
              onClick={() => api.post(`/restaurant/tables/${t.id}/statut`, { statut: t.statut === 'LIBRE' ? 'OCCUPEE' : 'LIBRE' }).then(fetchData)}>
              <p className="text-lg font-bold">Table {t.numero}</p>
              {t.nom && <p className="text-sm text-slate-400">{t.nom}</p>}
              <span className={`text-xs px-2 py-0.5 rounded ${STATUT_TABLE[t.statut] || ''}`}>{t.statut}</span>
            </div>
          ))}
          {tables.length === 0 && <div className="col-span-full text-center py-8 text-slate-500">Aucune table.</div>}
        </div>
      )}

      {!loading && tab === 'commandes' && (
        <div className="space-y-2">
          {commandes.map(c => (
            <div key={c.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">#{c.id.substring(0, 8)}</p>
                  <p className="text-sm text-slate-400">{c.table ? `Table ${c.table.numero}` : 'À emporter'} · {new Date(c.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded ${c.statut === 'PAYE' ? 'text-emerald-300 bg-emerald-900/30' : c.statut === 'EN_ATTENTE' ? 'text-yellow-300 bg-yellow-900/30' : 'text-blue-300 bg-blue-900/30'}`}>{c.statut}</span>
                  <p className="text-emerald-400 font-bold mt-1">{c.total} XAF</p>
                </div>
              </div>
            </div>
          ))}
          {commandes.length === 0 && <div className="text-center py-8 text-slate-500">Aucune commande.</div>}
        </div>
      )}

      {!loading && tab === 'menu' && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {plats.map(p => (
            <div key={p.id} className={`bg-slate-800 p-4 rounded-xl border ${p.disponible ? 'border-slate-700' : 'border-red-900/50 opacity-60'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{p.nom}</h3>
                  <span className="text-xs text-red-300 bg-red-900/30 px-2 py-0.5 rounded">{p.categorie}</span>
                </div>
                <p className="text-emerald-400 font-bold">{p.prix} XAF</p>
              </div>
              {p.description && <p className="text-xs text-slate-500 mt-1">{p.description}</p>}
              {p.tempsPrep && <p className="text-xs text-slate-500 mt-1">⏲️ {p.tempsPrep}min</p>}
            </div>
          ))}
          {plats.length === 0 && <div className="col-span-full text-center py-8 text-slate-500">Menu vide.</div>}
        </div>
      )}

      {showPlatModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowPlatModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Ajouter un plat</h2>
            <form onSubmit={handleCreatePlat} className="space-y-3">
              <input type="text" placeholder="Nom du plat" value={platForm.nom} onChange={e => setPlatForm(p => ({ ...p, nom: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <textarea placeholder="Description" value={platForm.description} onChange={e => setPlatForm(p => ({ ...p, description: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" rows={2} />
              <input type="number" placeholder="Prix (XAF)" step="0.01" value={platForm.prix} onChange={e => setPlatForm(p => ({ ...p, prix: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <select value={platForm.categorie} onChange={e => setPlatForm(p => ({ ...p, categorie: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg">
                <option>Entrée</option><option>Plat</option><option>Dessert</option><option>Boisson</option><option>Autre</option>
              </select>
              <input type="number" placeholder="Temps préparation (min)" value={platForm.tempsPrep} onChange={e => setPlatForm(p => ({ ...p, tempsPrep: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-red-600 py-2 rounded-lg">Ajouter</button>
                <button type="button" onClick={() => setShowPlatModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCommandeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowCommandeModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Nouvelle commande</h2>
            <form onSubmit={handleCreateCommande} className="space-y-3">
              <select value={cmdForm.tableId} onChange={e => setCmdForm(p => ({ ...p, tableId: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg">
                <option value="">À emporter</option>
                {tables.filter(t => t.statut === 'LIBRE').map(t => <option key={t.id} value={t.id}>Table {t.numero}</option>)}
              </select>
              {cmdForm.lignes.map((ligne, i) => (
                <div key={i} className="flex gap-2">
                  <select value={ligne.platId} onChange={e => { const lignes = [...cmdForm.lignes]; lignes[i].platId = e.target.value; setCmdForm(p => ({ ...p, lignes })); }} className="flex-1 p-3 bg-slate-700 rounded-lg">
                    <option value="">Plat...</option>
                    {plats.filter(p => p.disponible).map(p => <option key={p.id} value={p.id}>{p.nom} — {p.prix} XAF</option>)}
                  </select>
                  <input type="number" min="1" value={ligne.quantite} onChange={e => { const lignes = [...cmdForm.lignes]; lignes[i].quantite = parseInt(e.target.value) || 1; setCmdForm(p => ({ ...p, lignes })); }} className="w-16 p-3 bg-slate-700 rounded-lg" />
                  {i === cmdForm.lignes.length - 1 && <button type="button" onClick={() => setCmdForm(p => ({ ...p, lignes: [...p.lignes, { platId: '', quantite: 1 }] }))} className="bg-slate-600 px-3 rounded-lg">+</button>}
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-red-600 py-2 rounded-lg">Créer</button>
                <button type="button" onClick={() => setShowCommandeModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
