import { useState, useEffect } from 'react';
import api from '../../api';

export default function GlacierPage() {
  const [tab, setTab] = useState('menu');
  const [plats, setPlats] = useState([]);
  const [tables, setTables] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [compositions, setCompositions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPlatModal, setShowPlatModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showCommandeModal, setShowCommandeModal] = useState(false);
  const [showCompositionModal, setShowCompositionModal] = useState(false);
  const [platForm, setPlatForm] = useState({ nom: '', prix: '', categorie: 'Glace', tempsPrep: '' });
  const [tableForm, setTableForm] = useState({ numero: '', nom: '', capacite: 4 });
  const [commandeForm, setCommandeForm] = useState({ tableId: '', notes: '', type: 'SUR_PLACE', lignes: [{ platId: '', quantite: 1 }] });
  const [compForm, setCompForm] = useState({ commandeId: '', contenant: 'Cornet', parfums: '', supplements: '', prix: '' });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [p, t, c, comp, s] = await Promise.all([
        api.get('/glacier/menu', { params: { limit: 50 } }),
        api.get('/glacier/tables'),
        api.get('/glacier/commandes', { params: { limit: 30 } }),
        api.get('/glacier/compositions', { params: { limit: 20 } }),
        api.get('/glacier/stats'),
      ]);
      setPlats(p.data.data || p.data || []);
      setTables(t.data || []);
      setCommandes(c.data.data || c.data || []);
      setCompositions(comp.data.data || comp.data || []);
      setStats(s.data || null);
    } catch (err) { console.error('Erreur chargement:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreatePlat = async (e) => {
    e.preventDefault();
    await api.post('/glacier/menu', { ...platForm, prix: parseFloat(platForm.prix), tempsPrep: platForm.tempsPrep ? parseInt(platForm.tempsPrep) : undefined });
    setShowPlatModal(false);
    setPlatForm({ nom: '', prix: '', categorie: 'Glace', tempsPrep: '' });
    fetchAll();
  };

  const handleCreateTable = async (e) => {
    e.preventDefault();
    await api.post('/glacier/tables', { ...tableForm, numero: parseInt(tableForm.numero), capacite: parseInt(tableForm.capacite) });
    setShowTableModal(false);
    setTableForm({ numero: '', nom: '', capacite: 4 });
    fetchAll();
  };

  const handleCreateCommande = async (e) => {
    e.preventDefault();
    await api.post('/glacier/commandes', { ...commandeForm, lignes: commandeForm.lignes.filter(l => l.platId) });
    setShowCommandeModal(false);
    setCommandeForm({ tableId: '', notes: '', type: 'SUR_PLACE', lignes: [{ platId: '', quantite: 1 }] });
    fetchAll();
  };

  const handleCreateComposition = async (e) => {
    e.preventDefault();
    await api.post('/glacier/compositions', { ...compForm, prix: parseFloat(compForm.prix) });
    setShowCompositionModal(false);
    setCompForm({ commandeId: '', contenant: 'Cornet', parfums: '', supplements: '', prix: '' });
    fetchAll();
  };

  const handleToggleDispo = async (plat) => {
    await api.post(`/glacier/menu`, { ...plat, disponible: !plat.disponible });
    fetchAll();
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🍦 Glacier / Snack</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowPlatModal(true)} className="bg-cyan-600 hover:bg-cyan-700 px-3 py-2 rounded-lg text-sm font-medium">+ Plat</button>
          <button onClick={() => setShowTableModal(true)} className="bg-cyan-600 hover:bg-cyan-700 px-3 py-2 rounded-lg text-sm font-medium">+ Table</button>
          <button onClick={() => setShowCommandeModal(true)} className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg text-sm font-medium">+ Commande</button>
          <button onClick={() => setShowCompositionModal(true)} className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded-lg text-sm font-medium">+ Composition</button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { k: 'stats', label: '📊 Stats' }, { k: 'menu', label: '📖 Menu' },
          { k: 'tables', label: '🪑 Tables' }, { k: 'commandes', label: '📋 Commandes' },
          { k: 'compositions', label: '🍦 Compositions' },
        ].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} className={`px-4 py-2 rounded-lg ${tab === t.k ? 'bg-cyan-600' : 'bg-slate-700'}`}>{t.label}</button>
        ))}
      </div>

      {loading && <div className="text-center py-12 text-slate-400">Chargement...</div>}

      {!loading && tab === 'stats' && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-cyan-400 text-2xl font-bold">{stats.commandesJour}</p><p className="text-slate-400 text-sm">Commandes du jour</p></div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-emerald-400 text-2xl font-bold">{stats.recettesJour.toLocaleString()} XAF</p><p className="text-slate-400 text-sm">Recettes du jour</p></div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-green-400 text-2xl font-bold">{stats.platsActifs}</p><p className="text-slate-400 text-sm">Plats actifs</p></div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-blue-400 text-2xl font-bold">{stats.tablesOccupees}</p><p className="text-slate-400 text-sm">Tables occupées</p></div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-purple-400 text-2xl font-bold">{stats.totalCompositions}</p><p className="text-slate-400 text-sm">Compositions glace</p></div>
        </div>
      )}

      {!loading && tab === 'menu' && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {plats.map(p => (
            <div key={p.id} className={`bg-slate-800 p-4 rounded-xl border ${p.disponible ? 'border-slate-700' : 'border-red-900/50 opacity-70'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{p.nom}</h3>
                  <span className="text-xs text-cyan-400 bg-cyan-900/30 px-2 py-0.5 rounded">{p.categorie}</span>
                </div>
                <p className="text-emerald-400 font-bold">{p.prix} XAF</p>
              </div>
              {p.tempsPrep && <p className="text-xs text-slate-500 mt-1">⏲️ {p.tempsPrep}min</p>}
              <button onClick={() => handleToggleDispo(p)} className={`mt-2 text-xs px-2 py-1 rounded ${p.disponible ? 'bg-red-600/30 text-red-300' : 'bg-green-600/30 text-green-300'}`}>
                {p.disponible ? 'Désactiver' : 'Activer'}
              </button>
            </div>
          ))}
          {plats.length === 0 && <div className="col-span-full text-center py-8 text-slate-500">Aucun plat dans le menu.</div>}
        </div>
      )}

      {!loading && tab === 'tables' && (
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
          {tables.map(t => (
            <div key={t.id} className={`p-4 rounded-xl border cursor-pointer ${t.statut === 'LIBRE' ? 'bg-slate-800 border-emerald-700' : t.statut === 'OCCUPEE' ? 'bg-slate-800 border-red-700' : 'bg-slate-800 border-yellow-700'}`}
              onClick={() => api.post(`/glacier/tables/${t.id}/statut`, { statut: t.statut === 'LIBRE' ? 'OCCUPEE' : 'LIBRE' }).then(fetchAll)}
            >
              <p className="text-lg font-bold">Table {t.numero}</p>
              {t.nom && <p className="text-sm text-slate-400">{t.nom}</p>}
              <p className="text-xs text-slate-500">Capacité: {t.capacite}</p>
              <span className={`text-xs px-2 py-0.5 rounded ${t.statut === 'LIBRE' ? 'text-emerald-300 bg-emerald-900/30' : t.statut === 'OCCUPEE' ? 'text-red-300 bg-red-900/30' : 'text-yellow-300 bg-yellow-900/30'}`}>{t.statut}</span>
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
                  <p className="text-xs text-slate-400">{c.table ? `Table ${c.table.numero}` : 'À emporter'} · {new Date(c.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded ${c.statut === 'PAYE' ? 'text-emerald-300 bg-emerald-900/30' : c.statut === 'EN_ATTENTE' ? 'text-yellow-300 bg-yellow-900/30' : 'text-blue-300 bg-blue-900/30'}`}>{c.statut}</span>
                  <p className="text-emerald-400 font-bold mt-1">{c.total} XAF</p>
                </div>
              </div>
              {c.lignes?.length > 0 && <div className="mt-2 text-sm text-slate-400">{c.lignes.map(l => `${l.plat?.nom} x${l.quantite}`).join(', ')}</div>}
              {c.compositionGlace && <div className="mt-1 text-xs text-purple-400">🍦 {c.compositionGlace.contenant} · {c.compositionGlace.parfums}</div>}
            </div>
          ))}
          {commandes.length === 0 && <div className="text-center py-8 text-slate-500">Aucune commande.</div>}
        </div>
      )}

      {!loading && tab === 'compositions' && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {compositions.map(c => (
            <div key={c.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">🍦 {c.contenant}</p>
                  <p className="text-sm text-purple-300">Parfums: {c.parfums}</p>
                  {c.supplements && <p className="text-xs text-slate-400">+ {c.supplements}</p>}
                </div>
                <p className="text-emerald-400 font-bold">{c.prix} XAF</p>
              </div>
            </div>
          ))}
          {compositions.length === 0 && <div className="col-span-full text-center py-8 text-slate-500">Aucune composition.</div>}
        </div>
      )}

      {showPlatModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowPlatModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Ajouter un plat</h2>
            <form onSubmit={handleCreatePlat} className="space-y-3">
              <input type="text" placeholder="Nom du plat" value={platForm.nom} onChange={e => setPlatForm(p => ({ ...p, nom: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <input type="number" placeholder="Prix (XAF)" step="0.01" value={platForm.prix} onChange={e => setPlatForm(p => ({ ...p, prix: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <select value={platForm.categorie} onChange={e => setPlatForm(p => ({ ...p, categorie: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg">
                <option>Glace</option><option>Snack</option><option>Boisson</option><option>Dessert</option><option>Autre</option>
              </select>
              <input type="number" placeholder="Temps de préparation (min)" value={platForm.tempsPrep} onChange={e => setPlatForm(p => ({ ...p, tempsPrep: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-cyan-600 py-2 rounded-lg">Ajouter</button>
                <button type="button" onClick={() => setShowPlatModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTableModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowTableModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Ajouter une table</h2>
            <form onSubmit={handleCreateTable} className="space-y-3">
              <input type="number" placeholder="Numéro" value={tableForm.numero} onChange={e => setTableForm(p => ({ ...p, numero: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <input type="text" placeholder="Nom (optionnel)" value={tableForm.nom} onChange={e => setTableForm(p => ({ ...p, nom: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <input type="number" placeholder="Capacité" min="1" value={tableForm.capacite} onChange={e => setTableForm(p => ({ ...p, capacite: parseInt(e.target.value) || 1 }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-cyan-600 py-2 rounded-lg">Ajouter</button>
                <button type="button" onClick={() => setShowTableModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCommandeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowCommandeModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Nouvelle commande</h2>
            <form onSubmit={handleCreateCommande} className="space-y-3">
              <select value={commandeForm.tableId} onChange={e => setCommandeForm(p => ({ ...p, tableId: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg">
                <option value="">À emporter / Livraison</option>
                {tables.filter(t => t.statut === 'LIBRE').map(t => <option key={t.id} value={t.id}>Table {t.numero}</option>)}
              </select>
              <select value={commandeForm.type} onChange={e => setCommandeForm(p => ({ ...p, type: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg">
                <option value="SUR_PLACE">Sur place</option>
                <option value="A_EMPORTER">À emporter</option>
                <option value="LIVRAISON">Livraison</option>
              </select>
              {commandeForm.lignes.map((ligne, i) => (
                <div key={i} className="flex gap-2">
                  <select value={ligne.platId} onChange={e => { const lignes = [...commandeForm.lignes]; lignes[i].platId = e.target.value; setCommandeForm(p => ({ ...p, lignes })); }} className="flex-1 p-3 bg-slate-700 rounded-lg">
                    <option value="">Plat...</option>
                    {plats.filter(p => p.disponible).map(p => <option key={p.id} value={p.id}>{p.nom} — {p.prix} XAF</option>)}
                  </select>
                  <input type="number" min="1" value={ligne.quantite} onChange={e => { const lignes = [...commandeForm.lignes]; lignes[i].quantite = parseInt(e.target.value) || 1; setCommandeForm(p => ({ ...p, lignes })); }} className="w-16 p-3 bg-slate-700 rounded-lg" />
                  {i === commandeForm.lignes.length - 1 && <button type="button" onClick={() => setCommandeForm(p => ({ ...p, lignes: [...p.lignes, { platId: '', quantite: 1 }] }))} className="bg-slate-600 px-3 rounded-lg">+</button>}
                </div>
              ))}
              <textarea placeholder="Notes" value={commandeForm.notes} onChange={e => setCommandeForm(p => ({ ...p, notes: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" rows={2} />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-green-600 py-2 rounded-lg">Créer</button>
                <button type="button" onClick={() => setShowCommandeModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCompositionModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowCompositionModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Nouvelle composition glace</h2>
            <form onSubmit={handleCreateComposition} className="space-y-3">
              <select value={compForm.commandeId} onChange={e => setCompForm(p => ({ ...p, commandeId: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required>
                <option value="">Commande associée...</option>
                {commandes.filter(c => !c.compositionGlace).map(c => <option key={c.id} value={c.id}>#{c.id.substring(0, 8)}</option>)}
              </select>
              <select value={compForm.contenant} onChange={e => setCompForm(p => ({ ...p, contenant: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg">
                <option>Cornet</option><option>Coupe</option><option>Pot</option><option>Gâteau</option>
              </select>
              <input type="text" placeholder="Parfums (séparés par virgule)" value={compForm.parfums} onChange={e => setCompForm(p => ({ ...p, parfums: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <input type="text" placeholder="Suppléments (optionnel)" value={compForm.supplements} onChange={e => setCompForm(p => ({ ...p, supplements: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <input type="number" placeholder="Prix (XAF)" step="0.01" value={compForm.prix} onChange={e => setCompForm(p => ({ ...p, prix: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-purple-600 py-2 rounded-lg">Créer</button>
                <button type="button" onClick={() => setShowCompositionModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
