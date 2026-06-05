import { useState, useEffect } from 'react';
import api from '../../api';

const COLIS_STYLES = { ENREGISTRE: 'text-blue-300 bg-blue-900/30', EN_TRANSIT: 'text-yellow-300 bg-yellow-900/30', LIVRE: 'text-emerald-300 bg-emerald-900/30', RETOUR: 'text-red-300 bg-red-900/30', PERDU: 'text-slate-300 bg-slate-700/50' };
const TRAJET_STYLES = { PLANIFIE: 'text-blue-300 bg-blue-900/30', EN_COURS: 'text-yellow-300 bg-yellow-900/30', TERMINE: 'text-emerald-300 bg-emerald-900/30', ANNULE: 'text-red-300 bg-red-900/30' };

export default function TransportPage() {
  const [tab, setTab] = useState('vehicules');
  const [vehicules, setVehicules] = useState([]);
  const [colis, setColis] = useState([]);
  const [trajets, setTrajets] = useState([]);
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showVehModal, setShowVehModal] = useState(false);
  const [showColisModal, setShowColisModal] = useState(false);
  const [showTrajetModal, setShowTrajetModal] = useState(false);

  const [vehForm, setVehForm] = useState({ immatriculation: '', type: 'Camion', marque: '', modele: '', capaciteKg: '', capaciteM3: '', chauffeurId: '' });
  const [colisForm, setColisForm] = useState({ expediteurId: '', destinataire: '', telephoneDest: '', adresseDest: '', villeDest: '', poids: '', dimensions: '', description: '', valeur: '', montant: '' });
  const [trajForm, setTrajForm] = useState({ vehiculeId: '', chauffeurId: '', villeDepart: '', villeArrivee: '', dateDepart: '', distance: '', montant: '', notes: '' });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [v, c, t, cl, st] = await Promise.all([
        api.get('/transport/vehicules', { params: { search, limit: 50 } }),
        api.get('/transport/colis', { params: { limit: 30 } }),
        api.get('/transport/trajets', { params: { limit: 30 } }),
        api.get('/clients', { params: { limit: 200 } }),
        api.get('/transport/stats'),
      ]);
      setVehicules(v.data.data || v.data || []);
      setColis(c.data.data || c.data || []);
      setTrajets(t.data.data || t.data || []);
      setClients(cl.data.data || cl.data || []);
      setStats(st.data || null);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { const t = setTimeout(fetchAll, 300); return () => clearTimeout(t); }, [search]);

  const handleCreateVeh = async (e) => { e.preventDefault(); await api.post('/transport/vehicules', { ...vehForm, capaciteKg: vehForm.capaciteKg ? parseFloat(vehForm.capaciteKg) : undefined, capaciteM3: vehForm.capaciteM3 ? parseFloat(vehForm.capaciteM3) : undefined }); setShowVehModal(false); setVehForm({ immatriculation: '', type: 'Camion', marque: '', modele: '', capaciteKg: '', capaciteM3: '', chauffeurId: '' }); fetchAll(); };
  const handleCreateColis = async (e) => { e.preventDefault(); await api.post('/transport/colis', { ...colisForm, poids: colisForm.poids ? parseFloat(colisForm.poids) : undefined, valeur: colisForm.valeur ? parseFloat(colisForm.valeur) : undefined, montant: parseFloat(colisForm.montant) }); setShowColisModal(false); setColisForm({ expediteurId: '', destinataire: '', telephoneDest: '', adresseDest: '', villeDest: '', poids: '', dimensions: '', description: '', valeur: '', montant: '' }); fetchAll(); };
  const handleCreateTraj = async (e) => { e.preventDefault(); await api.post('/transport/trajets', { ...trajForm, distance: trajForm.distance ? parseFloat(trajForm.distance) : undefined, montant: trajForm.montant ? parseFloat(trajForm.montant) : undefined }); setShowTrajetModal(false); setTrajForm({ vehiculeId: '', chauffeurId: '', villeDepart: '', villeArrivee: '', dateDepart: '', distance: '', montant: '', notes: '' }); fetchAll(); };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🚛 Transport / Logistique</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowVehModal(true)} className="bg-orange-600 hover:bg-orange-700 px-3 py-2 rounded-lg text-sm font-medium">+ Véhicule</button>
          <button onClick={() => setShowColisModal(true)} className="bg-orange-600 hover:bg-orange-700 px-3 py-2 rounded-lg text-sm font-medium">+ Colis</button>
          <button onClick={() => setShowTrajetModal(true)} className="bg-orange-600 hover:bg-orange-700 px-3 py-2 rounded-lg text-sm font-medium">+ Trajet</button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['vehicules', 'colis', 'trajets', 'stats'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg ${tab === t ? 'bg-orange-600' : 'bg-slate-700'}`}>
            {t === 'vehicules' ? '🚛 Véhicules' : t === 'colis' ? '📦 Colis' : t === 'trajets' ? '🗺️ Trajets' : '📊 Stats'}
          </button>
        ))}
      </div>

      <input type="text" placeholder="Rechercher immatriculation, marque..." value={search} onChange={e => setSearch(e.target.value)} className={`w-full p-3 bg-slate-800 border border-slate-700 rounded-lg mb-4 ${tab !== 'vehicules' ? 'hidden' : ''}`} />

      {loading && <div className="text-center py-12 text-slate-400">Chargement...</div>}

      {!loading && tab === 'stats' && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-orange-400 text-2xl font-bold">{stats.vehicules}</p><p className="text-slate-400 text-sm">Véhicules</p></div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-emerald-400 text-2xl font-bold">{stats.disponibles}</p><p className="text-slate-400 text-sm">Disponibles</p></div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-yellow-400 text-2xl font-bold">{stats.colisEnCours}</p><p className="text-slate-400 text-sm">Colis en cours</p></div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-emerald-400 text-2xl font-bold">{stats.colisLivre}</p><p className="text-slate-400 text-sm">Colis livrés</p></div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-blue-400 text-2xl font-bold">{stats.trajetsPlanifies}</p><p className="text-slate-400 text-sm">Trajets actifs</p></div>
        </div>
      )}

      {!loading && tab === 'vehicules' && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {vehicules.map(v => (
            <div key={v.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{v.immatriculation}</h3>
                  <p className="text-sm text-slate-400">{v.marque} {v.modele}</p>
                  <span className="text-xs text-orange-300 bg-orange-900/30 px-2 py-0.5 rounded">{v.type}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${v.disponible ? 'text-emerald-300 bg-emerald-900/30' : 'text-red-300 bg-red-900/30'}`}>{v.disponible ? 'Dispo' : 'Occupé'}</span>
              </div>
              <div className="mt-2 text-xs text-slate-500">{v.capaciteKg && `${v.capaciteKg}kg`} {v.capaciteM3 && `/ ${v.capaciteM3}m³`}</div>
            </div>
          ))}
          {vehicules.length === 0 && <div className="col-span-full text-center py-8 text-slate-500">Aucun véhicule.</div>}
        </div>
      )}

      {!loading && tab === 'colis' && (
        <div className="space-y-2">
          {colis.map(c => (
            <div key={c.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-sm">{c.reference}</p>
                  <p className="text-sm text-slate-300">{c.destinataire} → {c.villeDest}</p>
                  <p className="text-xs text-slate-400">{c.adresseDest} {c.telephoneDest && `· ${c.telephoneDest}`}</p>
                  {c.description && <p className="text-xs text-slate-500">{c.description}</p>}
                </div>
                <div className="text-right">
                  <select value={c.statut} onChange={e => api.post(`/transport/colis/${c.id}/statut`, { statut: e.target.value }).then(fetchAll)} className={`text-xs rounded p-1 ${c.statut === 'LIVRE' ? 'bg-emerald-900/30 text-emerald-300' : 'bg-slate-700'}`}>
                    <option value="ENREGISTRE">Enregistré</option>
                    <option value="EN_TRANSIT">En transit</option>
                    <option value="LIVRE">Livré</option>
                    <option value="RETOUR">Retour</option>
                    <option value="PERDU">Perdu</option>
                  </select>
                  <p className="text-emerald-400 text-sm font-semibold mt-1">{c.montant} XAF</p>
                  {c.poids && <p className="text-xs text-slate-500">{c.poids}kg</p>}
                </div>
              </div>
              {c.expediteur && <p className="text-xs text-slate-500 mt-1">Exp: {c.expediteur.nom}</p>}
              {c.trajet && <p className="text-xs text-cyan-400">{c.trajet.villeDepart} → {c.trajet.villeArrivee}</p>}
            </div>
          ))}
          {colis.length === 0 && <div className="text-center py-8 text-slate-500">Aucun colis.</div>}
        </div>
      )}

      {!loading && tab === 'trajets' && (
        <div className="space-y-2">
          {trajets.map(t => (
            <div key={t.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{t.villeDepart} → {t.villeArrivee}</p>
                  <p className="text-sm text-slate-400">{t.vehicule?.immatriculation || 'N/C'} {t.chauffeurId ? `· Chauffeur #${t.chauffeurId.substring(0, 6)}` : ''}</p>
                  <p className="text-xs text-slate-500">{new Date(t.dateDepart).toLocaleString()} {t.distance && `· ${t.distance}km`}</p>
                </div>
                <div className="text-right">
                  <select value={t.statut} onChange={e => api.post(`/transport/trajets/${t.id}/statut`, { statut: e.target.value }).then(fetchAll)} className="text-xs rounded p-1 bg-slate-700">
                    <option value="PLANIFIE">Planifié</option>
                    <option value="EN_COURS">En cours</option>
                    <option value="TERMINE">Terminé</option>
                    <option value="ANNULE">Annulé</option>
                  </select>
                  {t.montant > 0 && <p className="text-emerald-400 text-sm font-semibold mt-1">{t.montant} XAF</p>}
                  <p className="text-xs text-slate-500">{t.colis?.length || 0} colis</p>
                </div>
              </div>
            </div>
          ))}
          {trajets.length === 0 && <div className="text-center py-8 text-slate-500">Aucun trajet.</div>}
        </div>
      )}

      {showVehModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowVehModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Ajouter un véhicule</h2>
            <form onSubmit={handleCreateVeh} className="space-y-3">
              <input type="text" placeholder="Immatriculation" value={vehForm.immatriculation} onChange={e => setVehForm(p => ({ ...p, immatriculation: e.target.value.toUpperCase() }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <select value={vehForm.type} onChange={e => setVehForm(p => ({ ...p, type: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg">
                <option>Camion</option><option>Fourgon</option><option>Moto</option><option>Utilitaire</option><option>Autre</option>
              </select>
              <input type="text" placeholder="Marque" value={vehForm.marque} onChange={e => setVehForm(p => ({ ...p, marque: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <input type="text" placeholder="Modèle" value={vehForm.modele} onChange={e => setVehForm(p => ({ ...p, modele: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Capacité (kg)" value={vehForm.capaciteKg} onChange={e => setVehForm(p => ({ ...p, capaciteKg: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
                <input type="number" placeholder="Capacité (m³)" value={vehForm.capaciteM3} onChange={e => setVehForm(p => ({ ...p, capaciteM3: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-orange-600 py-2 rounded-lg">Ajouter</button>
                <button type="button" onClick={() => setShowVehModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showColisModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowColisModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Enregistrer un colis</h2>
            <form onSubmit={handleCreateColis} className="space-y-3">
              <select value={colisForm.expediteurId} onChange={e => setColisForm(p => ({ ...p, expediteurId: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg">
                <option value="">Expéditeur (optionnel)</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nom || c.prenom || c.id}</option>)}
              </select>
              <input type="text" placeholder="Destinataire" value={colisForm.destinataire} onChange={e => setColisForm(p => ({ ...p, destinataire: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <input type="text" placeholder="Téléphone destinataire" value={colisForm.telephoneDest} onChange={e => setColisForm(p => ({ ...p, telephoneDest: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <input type="text" placeholder="Adresse destination" value={colisForm.adresseDest} onChange={e => setColisForm(p => ({ ...p, adresseDest: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <input type="text" placeholder="Ville destination" value={colisForm.villeDest} onChange={e => setColisForm(p => ({ ...p, villeDest: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Poids (kg)" value={colisForm.poids} onChange={e => setColisForm(p => ({ ...p, poids: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
                <input type="text" placeholder="Dimensions" value={colisForm.dimensions} onChange={e => setColisForm(p => ({ ...p, dimensions: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
              </div>
              <textarea placeholder="Description" value={colisForm.description} onChange={e => setColisForm(p => ({ ...p, description: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" rows={2} />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Valeur déclarée" value={colisForm.valeur} onChange={e => setColisForm(p => ({ ...p, valeur: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
                <input type="number" placeholder="Montant transport" value={colisForm.montant} onChange={e => setColisForm(p => ({ ...p, montant: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" required />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-orange-600 py-2 rounded-lg">Enregistrer</button>
                <button type="button" onClick={() => setShowColisModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTrajetModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowTrajetModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Planifier un trajet</h2>
            <form onSubmit={handleCreateTraj} className="space-y-3">
              <select value={trajForm.vehiculeId} onChange={e => setTrajForm(p => ({ ...p, vehiculeId: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg">
                <option value="">Véhicule...</option>
                {vehicules.filter(v => v.disponible).map(v => <option key={v.id} value={v.id}>{v.immatriculation} ({v.type})</option>)}
              </select>
              <input type="text" placeholder="Ville départ" value={trajForm.villeDepart} onChange={e => setTrajForm(p => ({ ...p, villeDepart: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <input type="text" placeholder="Ville arrivée" value={trajForm.villeArrivee} onChange={e => setTrajForm(p => ({ ...p, villeArrivee: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <input type="datetime-local" value={trajForm.dateDepart} onChange={e => setTrajForm(p => ({ ...p, dateDepart: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Distance (km)" value={trajForm.distance} onChange={e => setTrajForm(p => ({ ...p, distance: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
                <input type="number" placeholder="Montant" value={trajForm.montant} onChange={e => setTrajForm(p => ({ ...p, montant: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
              </div>
              <textarea placeholder="Notes" value={trajForm.notes} onChange={e => setTrajForm(p => ({ ...p, notes: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" rows={2} />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-orange-600 py-2 rounded-lg">Planifier</button>
                <button type="button" onClick={() => setShowTrajetModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
