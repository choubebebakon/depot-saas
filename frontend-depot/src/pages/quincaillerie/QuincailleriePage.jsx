import { useState, useEffect } from 'react';
import api from '../../api';

export default function QuincailleriePage() {
  const [tab, setTab] = useState('chantiers');
  const [chantiers, setChantiers] = useState([]);
  const [devis, setDevis] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChantierModal, setShowChantierModal] = useState(false);
  const [showDevisModal, setShowDevisModal] = useState(false);

  const [chantierForm, setChantierForm] = useState({ clientId: '', nom: '', adresse: '', description: '', dateDebut: '', dateFin: '', budgetEstime: '' });
  const [devisForm, setDevisForm] = useState({ clientId: '', chantierId: '', dateExpiry: '', notes: '', lignes: [{ articleId: '', designation: '', quantite: 1, prix: '', remise: 0 }] });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ch, d, c] = await Promise.all([
        api.get('/quincaillerie/chantiers'),
        api.get('/quincaillerie/devis'),
        api.get('/clients', { params: { limit: 200 } }),
      ]);
      setChantiers(ch.data || []);
      setDevis(d.data || []);
      setClients(c.data.data || c.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateChantier = async (e) => {
    e.preventDefault();
    await api.post('/quincaillerie/chantiers', {
      ...chantierForm, budgetEstime: chantierForm.budgetEstime ? parseFloat(chantierForm.budgetEstime) : undefined,
      dateDebut: new Date(chantierForm.dateDebut).toISOString(), dateFin: chantierForm.dateFin ? new Date(chantierForm.dateFin).toISOString() : undefined,
    });
    setShowChantierModal(false);
    setChantierForm({ clientId: '', nom: '', adresse: '', description: '', dateDebut: '', dateFin: '', budgetEstime: '' });
    fetchData();
  };

  const handleCreateDevis = async (e) => {
    e.preventDefault();
    await api.post('/quincaillerie/devis', {
      ...devisForm, dateExpiry: new Date(devisForm.dateExpiry).toISOString(),
      lignes: devisForm.lignes.filter(l => l.articleId).map(l => ({ ...l, prix: parseFloat(l.prix), remise: parseFloat(l.remise) || 0 })),
    });
    setShowDevisModal(false);
    setDevisForm({ clientId: '', chantierId: '', dateExpiry: '', notes: '', lignes: [{ articleId: '', designation: '', quantite: 1, prix: '', remise: 0 }] });
    fetchData();
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🛠 Quincaillerie / BTP</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowChantierModal(true)} className="bg-amber-600 hover:bg-amber-700 px-3 py-2 rounded-lg text-sm font-medium">+ Chantier</button>
          <button onClick={() => setShowDevisModal(true)} className="bg-amber-600 hover:bg-amber-700 px-3 py-2 rounded-lg text-sm font-medium">+ Devis</button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {['chantiers', 'devis'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg ${tab === t ? 'bg-amber-600' : 'bg-slate-700'}`}>
            {t === 'chantiers' ? '🏗️ Chantiers' : '📋 Devis'}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-12 text-slate-400">Chargement...</div>}

      {!loading && tab === 'chantiers' && (
        <div className="grid gap-3 md:grid-cols-2">
          {chantiers.map(c => (
            <div key={c.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{c.nom}</h3>
                  <p className="text-sm text-slate-400">Client: {c.client?.nom || c.clientId}</p>
                  {c.adresse && <p className="text-xs text-slate-500">{c.adresse}</p>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${c.statut === 'EN_COURS' ? 'text-emerald-300 bg-emerald-900/30' : c.statut === 'TERMINE' ? 'text-blue-300 bg-blue-900/30' : 'text-slate-300 bg-slate-700/50'}`}>{c.statut}</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">{new Date(c.dateDebut).toLocaleDateString()} {c.dateFin && `→ ${new Date(c.dateFin).toLocaleDateString()}`}</p>
              {c.budgetEstime > 0 && <p className="text-amber-400 font-semibold mt-1">{c.budgetEstime} XAF</p>}
            </div>
          ))}
          {chantiers.length === 0 && <div className="col-span-full text-center py-8 text-slate-500">Aucun chantier.</div>}
        </div>
      )}

      {!loading && tab === 'devis' && (
        <div className="space-y-2">
          {devis.map(d => (
            <div key={d.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{d.reference} — {d.client?.nom}</p>
                  <p className="text-sm text-slate-400">{d.chantier?.nom && `Chantier: ${d.chantier.nom}`}</p>
                  <p className="text-xs text-slate-500">Expire le {new Date(d.dateExpiry).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded ${d.statut === 'ACCEPTE' ? 'text-emerald-300 bg-emerald-900/30' : d.statut === 'EN_ATTENTE' ? 'text-yellow-300 bg-yellow-900/30' : d.statut === 'REFUSE' ? 'text-red-300 bg-red-900/30' : 'text-slate-300 bg-slate-700/50'}`}>{d.statut}</span>
                  <p className="text-emerald-400 font-bold mt-1">{d.montantTTC?.toLocaleString()} XAF</p>
                </div>
              </div>
            </div>
          ))}
          {devis.length === 0 && <div className="text-center py-8 text-slate-500">Aucun devis.</div>}
        </div>
      )}

      {showChantierModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowChantierModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Nouveau chantier</h2>
            <form onSubmit={handleCreateChantier} className="space-y-3">
              <select value={chantierForm.clientId} onChange={e => setChantierForm(p => ({ ...p, clientId: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required>
                <option value="">Client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nom || c.prenom || c.id}</option>)}
              </select>
              <input type="text" placeholder="Nom du chantier" value={chantierForm.nom} onChange={e => setChantierForm(p => ({ ...p, nom: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <input type="text" placeholder="Adresse" value={chantierForm.adresse} onChange={e => setChantierForm(p => ({ ...p, adresse: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <textarea placeholder="Description" value={chantierForm.description} onChange={e => setChantierForm(p => ({ ...p, description: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" rows={2} />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={chantierForm.dateDebut} onChange={e => setChantierForm(p => ({ ...p, dateDebut: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" required />
                <input type="date" value={chantierForm.dateFin} onChange={e => setChantierForm(p => ({ ...p, dateFin: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
              </div>
              <input type="number" placeholder="Budget estimé" value={chantierForm.budgetEstime} onChange={e => setChantierForm(p => ({ ...p, budgetEstime: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-amber-600 py-2 rounded-lg">Créer</button>
                <button type="button" onClick={() => setShowChantierModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDevisModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowDevisModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Nouveau devis</h2>
            <form onSubmit={handleCreateDevis} className="space-y-3">
              <select value={devisForm.clientId} onChange={e => setDevisForm(p => ({ ...p, clientId: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required>
                <option value="">Client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nom || c.prenom || c.id}</option>)}
              </select>
              <select value={devisForm.chantierId} onChange={e => setDevisForm(p => ({ ...p, chantierId: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg">
                <option value="">Aucun chantier</option>
                {chantiers.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
              <input type="date" value={devisForm.dateExpiry} onChange={e => setDevisForm(p => ({ ...p, dateExpiry: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              {devisForm.lignes.map((ligne, i) => (
                <div key={i} className="flex gap-1">
                  <input type="text" placeholder="Désignation" value={ligne.designation} onChange={e => { const lignes = [...devisForm.lignes]; lignes[i].designation = e.target.value; setDevisForm(p => ({ ...p, lignes })); }} className="flex-1 p-2 bg-slate-700 rounded text-sm" />
                  <input type="number" placeholder="Qté" min="1" value={ligne.quantite} onChange={e => { const lignes = [...devisForm.lignes]; lignes[i].quantite = parseInt(e.target.value) || 1; setDevisForm(p => ({ ...p, lignes })); }} className="w-14 p-2 bg-slate-700 rounded text-sm" />
                  <input type="number" placeholder="Prix" value={ligne.prix} onChange={e => { const lignes = [...devisForm.lignes]; lignes[i].prix = e.target.value; setDevisForm(p => ({ ...p, lignes })); }} className="w-20 p-2 bg-slate-700 rounded text-sm" />
                  {i === devisForm.lignes.length - 1 && <button type="button" onClick={() => setDevisForm(p => ({ ...p, lignes: [...p.lignes, { articleId: '', designation: '', quantite: 1, prix: '', remise: 0 }] }))} className="bg-slate-600 px-2 rounded text-sm">+</button>}
                </div>
              ))}
              <textarea placeholder="Notes" value={devisForm.notes} onChange={e => setDevisForm(p => ({ ...p, notes: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" rows={2} />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-amber-600 py-2 rounded-lg">Créer</button>
                <button type="button" onClick={() => setShowDevisModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
