import { useState, useEffect } from 'react';
import api from '../../api';

const BIEN_TYPES = ['APPARTEMENT', 'MAISON', 'VILLA', 'LOCAL_COMMERCIAL', 'BUREAU', 'ENTREPOT', 'TERRAIN'];
const STATUT_CONT = { ACTIF: 'text-emerald-300 bg-emerald-900/30', EXPIRE: 'text-red-300 bg-red-900/30', RESILIE: 'text-slate-300 bg-slate-700/50', EN_ATTENTE: 'text-yellow-300 bg-yellow-900/30' };

export default function ImmobilierPage() {
  const [tab, setTab] = useState('biens');
  const [biens, setBiens] = useState([]);
  const [contrats, setContrats] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showBienModal, setShowBienModal] = useState(false);
  const [showContratModal, setShowContratModal] = useState(false);
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [showIntervModal, setShowIntervModal] = useState(false);

  const [bienForm, setBienForm] = useState({ reference: '', type: 'APPARTEMENT', adresse: '', ville: '', surface: '', nbPieces: '', etage: '', loyer: '', charges: '', depot: '', description: '' });
  const [contForm, setContForm] = useState({ bienId: '', locataireId: '', dateDebut: '', dateFin: '', loyer: '', charges: '', depot: '', notes: '' });
  const [paiementForm, setPaiementForm] = useState({ contratId: '', mois: '', montant: '', charges: '', modePaiement: 'CASH', notes: '' });
  const [intervForm, setIntervForm] = useState({ bienId: '', type: '', description: '', cout: '' });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [b, c, p, i, cl, st] = await Promise.all([
        api.get('/immobilier/biens', { params: { search, limit: 30 } }),
        api.get('/immobilier/contrats', { params: { limit: 30 } }),
        api.get('/immobilier/paiements', { params: { limit: 30 } }),
        api.get('/immobilier/interventions', { params: { limit: 20 } }),
        api.get('/clients', { params: { limit: 200 } }),
        api.get('/immobilier/stats'),
      ]);
      setBiens(b.data.data || b.data || []);
      setContrats(c.data.data || c.data || []);
      setPaiements(p.data.data || p.data || []);
      setInterventions(i.data.data || i.data || []);
      setClients(cl.data.data || cl.data || []);
      setStats(st.data || null);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { const t = setTimeout(fetchAll, 300); return () => clearTimeout(t); }, [search]);

  const handleCreateBien = async (e) => {
    e.preventDefault();
    await api.post('/immobilier/biens', { ...bienForm, surface: bienForm.surface ? parseFloat(bienForm.surface) : undefined, nbPieces: bienForm.nbPieces ? parseInt(bienForm.nbPieces) : undefined, etage: bienForm.etage ? parseInt(bienForm.etage) : undefined, loyer: parseFloat(bienForm.loyer), charges: bienForm.charges ? parseFloat(bienForm.charges) : undefined, depot: bienForm.depot ? parseFloat(bienForm.depot) : undefined });
    setShowBienModal(false); setBienForm({ reference: '', type: 'APPARTEMENT', adresse: '', ville: '', surface: '', nbPieces: '', etage: '', loyer: '', charges: '', depot: '', description: '' }); fetchAll();
  };

  const handleCreateContrat = async (e) => {
    e.preventDefault();
    await api.post('/immobilier/contrats', { ...contForm, loyer: parseFloat(contForm.loyer), charges: contForm.charges ? parseFloat(contForm.charges) : undefined, depot: contForm.depot ? parseFloat(contForm.depot) : undefined });
    setShowContratModal(false); setContForm({ bienId: '', locataireId: '', dateDebut: '', dateFin: '', loyer: '', charges: '', depot: '', notes: '' }); fetchAll();
  };

  const handleCreatePaiement = async (e) => {
    e.preventDefault();
    await api.post('/immobilier/paiements', { ...paiementForm, montant: parseFloat(paiementForm.montant), charges: paiementForm.charges ? parseFloat(paiementForm.charges) : undefined });
    setShowPaiementModal(false); setPaiementForm({ contratId: '', mois: '', montant: '', charges: '', modePaiement: 'CASH', notes: '' }); fetchAll();
  };

  const handleCreateInterv = async (e) => {
    e.preventDefault();
    await api.post('/immobilier/interventions', { ...intervForm, cout: intervForm.cout ? parseFloat(intervForm.cout) : undefined });
    setShowIntervModal(false); setIntervForm({ bienId: '', type: '', description: '', cout: '' }); fetchAll();
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🏠 Gestion Immobilière</h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowBienModal(true)} className="bg-teal-600 hover:bg-teal-700 px-3 py-2 rounded-lg text-sm font-medium">+ Bien</button>
          <button onClick={() => setShowContratModal(true)} className="bg-teal-600 hover:bg-teal-700 px-3 py-2 rounded-lg text-sm font-medium">+ Contrat</button>
          <button onClick={() => setShowPaiementModal(true)} className="bg-teal-600 hover:bg-teal-700 px-3 py-2 rounded-lg text-sm font-medium">+ Paiement</button>
          <button onClick={() => setShowIntervModal(true)} className="bg-teal-600 hover:bg-teal-700 px-3 py-2 rounded-lg text-sm font-medium">+ Intervention</button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['biens', 'contrats', 'paiements', 'interventions', 'stats'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg ${tab === t ? 'bg-teal-600' : 'bg-slate-700'}`}>
            {t === 'biens' ? '🏘️ Biens' : t === 'contrats' ? '📝 Contrats' : t === 'paiements' ? '💰 Loyers' : t === 'interventions' ? '🔧 Interventions' : '📊 Stats'}
          </button>
        ))}
      </div>

      <input type="text" placeholder="Rechercher référence, ville, adresse..." value={search} onChange={e => setSearch(e.target.value)} className={`w-full p-3 bg-slate-800 border border-slate-700 rounded-lg mb-4 ${tab !== 'biens' ? 'hidden' : ''}`} />

      {loading && <div className="text-center py-12 text-slate-400">Chargement...</div>}

      {!loading && tab === 'stats' && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-teal-400 text-2xl font-bold">{stats.totalBiens}</p><p className="text-slate-400 text-sm">Biens</p></div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-emerald-400 text-2xl font-bold">{stats.disponibles}</p><p className="text-slate-400 text-sm">Disponibles</p></div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-blue-400 text-2xl font-bold">{stats.loues}</p><p className="text-slate-400 text-sm">Loués</p></div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-cyan-400 text-2xl font-bold">{stats.contratsActifs}</p><p className="text-slate-400 text-sm">Contrats actifs</p></div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-emerald-400 text-2xl font-bold">{stats.loyersMensuels.toLocaleString()} XAF</p><p className="text-slate-400 text-sm">Loyers/mois</p></div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-red-400 text-2xl font-bold">{stats.enRetard}</p><p className="text-slate-400 text-sm">En retard</p></div>
        </div>
      )}

      {!loading && tab === 'biens' && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {biens.map(b => (
            <div key={b.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{b.reference}</h3>
                  <p className="text-sm text-slate-400">{b.adresse}, {b.ville}</p>
                  <span className="text-xs text-teal-300 bg-teal-900/30 px-2 py-0.5 rounded">{b.type}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${b.disponible ? 'text-emerald-300 bg-emerald-900/30' : 'text-red-300 bg-red-900/30'}`}>{b.disponible ? 'Disponible' : 'Loué'}</span>
              </div>
              <div className="mt-2 text-sm flex gap-3">
                <span className="text-emerald-400 font-semibold">{b.loyer} XAF</span>
                {b.surface && <span className="text-slate-500">{b.surface}m²</span>}
                {b.nbPieces && <span className="text-slate-500">{b.nbPieces} pièces</span>}
              </div>
              {b.contrats?.length > 0 && <p className="text-xs text-cyan-300 mt-2">Locataire: {b.contrats[0].locataire?.nom}</p>}
            </div>
          ))}
          {biens.length === 0 && <div className="col-span-full text-center py-8 text-slate-500">Aucun bien.</div>}
        </div>
      )}

      {!loading && tab === 'contrats' && (
        <div className="space-y-2">
          {contrats.map(c => (
            <div key={c.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{c.bien?.reference} — {c.locataire?.nom}</p>
                  <p className="text-sm text-slate-400">{new Date(c.dateDebut).toLocaleDateString()} → {c.dateFin ? new Date(c.dateFin).toLocaleDateString() : 'Indéfini'}</p>
                  {c.notes && <p className="text-xs text-slate-500 italic">{c.notes}</p>}
                </div>
                <div className="text-right">
                  <select value={c.statut} onChange={e => api.post(`/immobilier/contrats/${c.id}/statut`, { statut: e.target.value }).then(fetchAll)} className="text-xs rounded p-1 bg-slate-700">
                    <option value="ACTIF">Actif</option>
                    <option value="EXPIRE">Expiré</option>
                    <option value="RESILIE">Résilié</option>
                    <option value="EN_ATTENTE">En attente</option>
                  </select>
                  <p className="text-emerald-400 font-semibold mt-1">{c.loyer} XAF/mois</p>
                </div>
              </div>
              {c.paiements?.length > 0 && (
                <div className="mt-2 text-xs text-slate-500">Derniers paiements: {c.paiements.map(p => `${p.mois} (${p.statut})`).join(', ')}</div>
              )}
            </div>
          ))}
          {contrats.length === 0 && <div className="text-center py-8 text-slate-500">Aucun contrat.</div>}
        </div>
      )}

      {!loading && tab === 'paiements' && (
        <div className="space-y-2">
          {paiements.map(p => (
            <div key={p.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-sm">{p.contrat?.bien?.reference} — {p.contrat?.locataire?.nom}</p>
                  <p className="text-sm text-slate-400">Mois: {p.mois} · {new Date(p.datePaiement).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded ${p.statut === 'PAYE' ? 'text-emerald-300 bg-emerald-900/30' : p.statut === 'EN_RETARD' ? 'text-red-300 bg-red-900/30' : p.statut === 'PARTIEL' ? 'text-yellow-300 bg-yellow-900/30' : 'text-slate-300 bg-slate-700/50'}`}>{p.statut}</span>
                  <p className="text-emerald-400 font-semibold mt-1">{p.montant} XAF</p>
                </div>
              </div>
            </div>
          ))}
          {paiements.length === 0 && <div className="text-center py-8 text-slate-500">Aucun paiement.</div>}
        </div>
      )}

      {!loading && tab === 'interventions' && (
        <div className="space-y-2">
          {interventions.map(i => (
            <div key={i.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{i.type} — {i.bien?.reference}</p>
                  <p className="text-sm text-slate-400">{i.description}</p>
                  <p className="text-xs text-slate-500">{new Date(i.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">{i.statut}</span>
                  {i.cout > 0 && <p className="text-emerald-400 font-semibold mt-1">{i.cout} XAF</p>}
                </div>
              </div>
            </div>
          ))}
          {interventions.length === 0 && <div className="text-center py-8 text-slate-500">Aucune intervention.</div>}
        </div>
      )}

      {showBienModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowBienModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Ajouter un bien</h2>
            <form onSubmit={handleCreateBien} className="space-y-3">
              <input type="text" placeholder="Référence" value={bienForm.reference} onChange={e => setBienForm(p => ({ ...p, reference: e.target.value.toUpperCase() }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <select value={bienForm.type} onChange={e => setBienForm(p => ({ ...p, type: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg">{BIEN_TYPES.map(t => <option key={t}>{t}</option>)}</select>
              <input type="text" placeholder="Adresse" value={bienForm.adresse} onChange={e => setBienForm(p => ({ ...p, adresse: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <input type="text" placeholder="Ville" value={bienForm.ville} onChange={e => setBienForm(p => ({ ...p, ville: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <div className="grid grid-cols-3 gap-2">
                <input type="number" placeholder="Surface (m²)" value={bienForm.surface} onChange={e => setBienForm(p => ({ ...p, surface: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
                <input type="number" placeholder="Pièces" value={bienForm.nbPieces} onChange={e => setBienForm(p => ({ ...p, nbPieces: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
                <input type="number" placeholder="Étage" value={bienForm.etage} onChange={e => setBienForm(p => ({ ...p, etage: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input type="number" placeholder="Loyer (XAF)" value={bienForm.loyer} onChange={e => setBienForm(p => ({ ...p, loyer: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" required />
                <input type="number" placeholder="Charges" value={bienForm.charges} onChange={e => setBienForm(p => ({ ...p, charges: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
                <input type="number" placeholder="Caution" value={bienForm.depot} onChange={e => setBienForm(p => ({ ...p, depot: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
              </div>
              <textarea placeholder="Description" value={bienForm.description} onChange={e => setBienForm(p => ({ ...p, description: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" rows={2} />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-teal-600 py-2 rounded-lg">Ajouter</button>
                <button type="button" onClick={() => setShowBienModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showContratModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowContratModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Nouveau contrat</h2>
            <form onSubmit={handleCreateContrat} className="space-y-3">
              <select value={contForm.bienId} onChange={e => setContForm(p => ({ ...p, bienId: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required>
                <option value="">Bien...</option>
                {biens.filter(b => b.disponible).map(b => <option key={b.id} value={b.id}>{b.reference} — {b.loyer} XAF</option>)}
              </select>
              <select value={contForm.locataireId} onChange={e => setContForm(p => ({ ...p, locataireId: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required>
                <option value="">Locataire...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nom || c.prenom || c.id}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={contForm.dateDebut} onChange={e => setContForm(p => ({ ...p, dateDebut: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" required />
                <input type="date" value={contForm.dateFin} onChange={e => setContForm(p => ({ ...p, dateFin: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input type="number" placeholder="Loyer" value={contForm.loyer} onChange={e => setContForm(p => ({ ...p, loyer: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" required />
                <input type="number" placeholder="Charges" value={contForm.charges} onChange={e => setContForm(p => ({ ...p, charges: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
                <input type="number" placeholder="Dépôt" value={contForm.depot} onChange={e => setContForm(p => ({ ...p, depot: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
              </div>
              <textarea placeholder="Notes" value={contForm.notes} onChange={e => setContForm(p => ({ ...p, notes: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" rows={2} />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-teal-600 py-2 rounded-lg">Créer</button>
                <button type="button" onClick={() => setShowContratModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaiementModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowPaiementModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Enregistrer paiement loyer</h2>
            <form onSubmit={handleCreatePaiement} className="space-y-3">
              <select value={paiementForm.contratId} onChange={e => setPaiementForm(p => ({ ...p, contratId: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required>
                <option value="">Contrat...</option>
                {contrats.filter(c => c.statut === 'ACTIF').map(c => <option key={c.id} value={c.id}>{c.bien?.reference} — {c.locataire?.nom}</option>)}
              </select>
              <input type="text" placeholder="Mois (ex: 2026-05)" value={paiementForm.mois} onChange={e => setPaiementForm(p => ({ ...p, mois: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Montant" value={paiementForm.montant} onChange={e => setPaiementForm(p => ({ ...p, montant: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" required />
                <input type="number" placeholder="Charges" value={paiementForm.charges} onChange={e => setPaiementForm(p => ({ ...p, charges: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
              </div>
              <select value={paiementForm.modePaiement} onChange={e => setPaiementForm(p => ({ ...p, modePaiement: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg">
                <option value="CASH">Espèces</option><option value="MOBILE_MONEY">Mobile Money</option><option value="BANQUE">Virement</option>
              </select>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-teal-600 py-2 rounded-lg">Enregistrer</button>
                <button type="button" onClick={() => setShowPaiementModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showIntervModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowIntervModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Nouvelle intervention</h2>
            <form onSubmit={handleCreateInterv} className="space-y-3">
              <select value={intervForm.bienId} onChange={e => setIntervForm(p => ({ ...p, bienId: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required>
                <option value="">Bien...</option>
                {biens.map(b => <option key={b.id} value={b.id}>{b.reference}</option>)}
              </select>
              <input type="text" placeholder="Type (ex: Plomberie, Électricité, Peinture)" value={intervForm.type} onChange={e => setIntervForm(p => ({ ...p, type: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <textarea placeholder="Description" value={intervForm.description} onChange={e => setIntervForm(p => ({ ...p, description: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required rows={2} />
              <input type="number" placeholder="Coût (XAF)" value={intervForm.cout} onChange={e => setIntervForm(p => ({ ...p, cout: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-teal-600 py-2 rounded-lg">Créer</button>
                <button type="button" onClick={() => setShowIntervModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
