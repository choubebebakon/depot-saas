import { useState, useEffect } from 'react';
import api from '../../api';

const STATUT_CH = { LIBRE: 'text-emerald-300 bg-emerald-900/30', OCCUPEE: 'text-red-300 bg-red-900/30', RESERVEE: 'text-blue-300 bg-blue-900/30', EN_NETTOYAGE: 'text-yellow-300 bg-yellow-900/30', HORS_SERVICE: 'text-slate-300 bg-slate-700/50' };
const STATUT_RES = { CONFIRMEE: 'text-blue-300 bg-blue-900/30', CHECKIN: 'text-emerald-300 bg-emerald-900/30', CHECKOUT: 'text-yellow-300 bg-yellow-900/30', ANNULEE: 'text-red-300 bg-red-900/30', NO_SHOW: 'text-slate-300 bg-slate-700/50' };

export default function HotelleriePage() {
  const [tab, setTab] = useState('chambres');
  const [types, setTypes] = useState([]);
  const [chambres, setChambres] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showChModal, setShowChModal] = useState(false);
  const [showResModal, setShowResModal] = useState(false);

  const [typeForm, setTypeForm] = useState({ nom: '', description: '', capacite: 2, prixNuit: '', equipements: '' });
  const [chForm, setChForm] = useState({ numero: '', etage: '', typeChambreId: '', notes: '' });
  const [resForm, setResForm] = useState({ clientId: '', chambreId: '', nomClient: '', telephone: '', email: '', dateArrivee: '', dateDepart: '', nbPersonnes: 1, prixTotal: '', avance: '', source: '', notes: '' });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [tp, ch, rs, cl, st] = await Promise.all([
        api.get('/hotellerie/types-chambres'),
        api.get('/hotellerie/chambres', { params: { search, limit: 50 } }),
        api.get('/hotellerie/reservations', { params: { limit: 30 } }),
        api.get('/clients', { params: { limit: 200 } }),
        api.get('/hotellerie/stats'),
      ]);
      setTypes(tp.data || []);
      setChambres(ch.data.data || ch.data || []);
      setReservations(rs.data.data || rs.data || []);
      setClients(cl.data.data || cl.data || []);
      setStats(st.data || null);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { const t = setTimeout(fetchAll, 300); return () => clearTimeout(t); }, [search]);

  const handleCreateType = async (e) => { e.preventDefault(); await api.post('/hotellerie/types-chambres', { ...typeForm, capacite: parseInt(typeForm.capacite) || 2, prixNuit: parseFloat(typeForm.prixNuit) }); setShowTypeModal(false); setTypeForm({ nom: '', description: '', capacite: 2, prixNuit: '', equipements: '' }); fetchAll(); };
  const handleCreateCh = async (e) => { e.preventDefault(); await api.post('/hotellerie/chambres', { ...chForm, etage: chForm.etage ? parseInt(chForm.etage) : undefined }); setShowChModal(false); setChForm({ numero: '', etage: '', typeChambreId: '', notes: '' }); fetchAll(); };
  const handleCreateRes = async (e) => { e.preventDefault(); await api.post('/hotellerie/reservations', { ...resForm, nbPersonnes: parseInt(resForm.nbPersonnes) || 1, prixTotal: parseFloat(resForm.prixTotal), avance: resForm.avance ? parseFloat(resForm.avance) : undefined }); setShowResModal(false); setResForm({ clientId: '', chambreId: '', nomClient: '', telephone: '', email: '', dateArrivee: '', dateDepart: '', nbPersonnes: 1, prixTotal: '', avance: '', source: '', notes: '' }); fetchAll(); };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🏨 Hôtellerie</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowTypeModal(true)} className="bg-amber-600 hover:bg-amber-700 px-3 py-2 rounded-lg text-sm font-medium">+ Type</button>
          <button onClick={() => setShowChModal(true)} className="bg-amber-600 hover:bg-amber-700 px-3 py-2 rounded-lg text-sm font-medium">+ Chambre</button>
          <button onClick={() => setShowResModal(true)} className="bg-amber-600 hover:bg-amber-700 px-3 py-2 rounded-lg text-sm font-medium">+ Réservation</button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['chambres', 'reservations', 'types', 'stats'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg ${tab === t ? 'bg-amber-600' : 'bg-slate-700'}`}>
            {t === 'chambres' ? '🛏️ Chambres' : t === 'reservations' ? '📅 Réservations' : t === 'types' ? '🏷️ Types' : '📊 Stats'}
          </button>
        ))}
      </div>

      <input type="text" placeholder="Rechercher numéro de chambre..." value={search} onChange={e => setSearch(e.target.value)} className={`w-full p-3 bg-slate-800 border border-slate-700 rounded-lg mb-4 ${tab !== 'chambres' ? 'hidden' : ''}`} />

      {loading && <div className="text-center py-12 text-slate-400">Chargement...</div>}

      {!loading && tab === 'stats' && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-7 gap-4">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-amber-400 text-2xl font-bold">{stats.totalChambres}</p><p className="text-slate-400 text-sm">Chambres</p></div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-emerald-400 text-2xl font-bold">{stats.libres}</p><p className="text-slate-400 text-sm">Libres</p></div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-red-400 text-2xl font-bold">{stats.occupees}</p><p className="text-slate-400 text-sm">Occupées</p></div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-cyan-400 text-2xl font-bold">{stats.tauxOccupation}%</p><p className="text-slate-400 text-sm">Taux occupation</p></div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-blue-400 text-2xl font-bold">{stats.arriveesAujourdhui}</p><p className="text-slate-400 text-sm">Arrivées</p></div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-yellow-400 text-2xl font-bold">{stats.departsAujourdhui}</p><p className="text-slate-400 text-sm">Départs</p></div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-green-400 text-2xl font-bold">{stats.actives}</p><p className="text-slate-400 text-sm">Réservations actives</p></div>
        </div>
      )}

      {!loading && tab === 'types' && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {types.map(t => (
            <div key={t.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <h3 className="font-semibold">{t.nom}</h3>
              <p className="text-sm text-slate-400">{t.description}</p>
              <div className="mt-2 flex gap-3 text-sm">
                <span className="text-amber-400 font-semibold">{t.prixNuit} XAF/nuit</span>
                <span className="text-slate-500">{t.capacite} pers.</span>
              </div>
              {t.equipements && <p className="text-xs text-slate-500 mt-1">{t.equipements}</p>}
            </div>
          ))}
          {types.length === 0 && <div className="col-span-full text-center py-8 text-slate-500">Aucun type de chambre.</div>}
        </div>
      )}

      {!loading && tab === 'chambres' && (
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
          {chambres.map(c => (
            <div key={c.id} className={`p-4 rounded-xl border cursor-pointer ${c.statut === 'LIBRE' ? 'bg-slate-800 border-emerald-700' : c.statut === 'OCCUPEE' ? 'bg-slate-800 border-red-700' : c.statut === 'RESERVEE' ? 'bg-slate-800 border-blue-700' : c.statut === 'EN_NETTOYAGE' ? 'bg-slate-800 border-yellow-700' : 'bg-slate-800 border-slate-600'}`}
              onClick={() => {
                const next = { LIBRE: 'OCCUPEE', OCCUPEE: 'EN_NETTOYAGE', EN_NETTOYAGE: 'LIBRE', RESERVEE: 'OCCUPEE', HORS_SERVICE: 'LIBRE' };
                api.post(`/hotellerie/chambres/${c.id}/statut`, { statut: next[c.statut] || 'LIBRE' }).then(fetchAll);
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-bold">#{c.numero}</p>
                  <p className="text-xs text-slate-400">{c.typeChambre?.nom} · Étage {c.etage || '-'}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${STATUT_CH[c.statut] || ''}`}>{c.statut}</span>
              </div>
              <p className="text-amber-400 font-semibold mt-1">{c.typeChambre?.prixNuit || 0} XAF/nuit</p>
              {c.reservations?.length > 0 && <p className="text-xs text-cyan-300 mt-1">Réservé</p>}
            </div>
          ))}
          {chambres.length === 0 && <div className="col-span-full text-center py-8 text-slate-500">Aucune chambre.</div>}
        </div>
      )}

      {!loading && tab === 'reservations' && (
        <div className="space-y-2">
          {reservations.map(r => (
            <div key={r.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{r.nomClient} <span className="text-xs text-slate-500">#{r.reference}</span></p>
                  <p className="text-sm text-slate-400">Chambre {r.chambre?.numero} ({r.chambre?.typeChambre?.nom})</p>
                  <p className="text-xs text-slate-500">{new Date(r.dateArrivee).toLocaleDateString()} → {new Date(r.dateDepart).toLocaleDateString()} · {r.nbNuits} nuits</p>
                  {r.notes && <p className="text-xs text-slate-500 italic">{r.notes}</p>}
                </div>
                <div className="text-right">
                  <select value={r.statut} onChange={e => api.post(`/hotellerie/reservations/${r.id}/statut`, { statut: e.target.value }).then(fetchAll)} className="text-xs rounded p-1 bg-slate-700">
                    <option value="CONFIRMEE">Confirmée</option>
                    <option value="CHECKIN">Check-in</option>
                    <option value="CHECKOUT">Check-out</option>
                    <option value="ANNULEE">Annulée</option>
                    <option value="NO_SHOW">No show</option>
                  </select>
                  <p className="text-emerald-400 font-semibold mt-1">{r.prixTotal} XAF</p>
                  {r.avance > 0 && <p className="text-xs text-amber-400">Avance: {r.avance} XAF</p>}
                  {r.consommations?.length > 0 && <p className="text-xs text-cyan-400">{r.consommations.length} consommation(s)</p>}
                </div>
              </div>
            </div>
          ))}
          {reservations.length === 0 && <div className="text-center py-8 text-slate-500">Aucune réservation.</div>}
        </div>
      )}

      {showTypeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowTypeModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Type de chambre</h2>
            <form onSubmit={handleCreateType} className="space-y-3">
              <input type="text" placeholder="Nom (ex: Suite, Standard, Deluxe)" value={typeForm.nom} onChange={e => setTypeForm(p => ({ ...p, nom: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <input type="text" placeholder="Description" value={typeForm.description} onChange={e => setTypeForm(p => ({ ...p, description: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Capacité" min="1" value={typeForm.capacite} onChange={e => setTypeForm(p => ({ ...p, capacite: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
                <input type="number" placeholder="Prix / nuit" value={typeForm.prixNuit} onChange={e => setTypeForm(p => ({ ...p, prixNuit: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" required />
              </div>
              <input type="text" placeholder="Équipements (TV, Clim, WiFi...)" value={typeForm.equipements} onChange={e => setTypeForm(p => ({ ...p, equipements: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-amber-600 py-2 rounded-lg">Créer</button>
                <button type="button" onClick={() => setShowTypeModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showChModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowChModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Ajouter une chambre</h2>
            <form onSubmit={handleCreateCh} className="space-y-3">
              <input type="text" placeholder="Numéro" value={chForm.numero} onChange={e => setChForm(p => ({ ...p, numero: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <input type="number" placeholder="Étage" value={chForm.etage} onChange={e => setChForm(p => ({ ...p, etage: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <select value={chForm.typeChambreId} onChange={e => setChForm(p => ({ ...p, typeChambreId: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required>
                <option value="">Type de chambre...</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.nom} — {t.prixNuit} XAF</option>)}
              </select>
              <textarea placeholder="Notes" value={chForm.notes} onChange={e => setChForm(p => ({ ...p, notes: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" rows={2} />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-amber-600 py-2 rounded-lg">Ajouter</button>
                <button type="button" onClick={() => setShowChModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowResModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Nouvelle réservation</h2>
            <form onSubmit={handleCreateRes} className="space-y-3">
              <select value={resForm.chambreId} onChange={e => setResForm(p => ({ ...p, chambreId: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required>
                <option value="">Chambre...</option>
                {chambres.filter(c => c.statut === 'LIBRE' || c.statut === 'RESERVEE').map(c => <option key={c.id} value={c.id}>#{c.numero} — {c.typeChambre?.nom} ({c.typeChambre?.prixNuit}XAF)</option>)}
              </select>
              <input type="text" placeholder="Nom du client" value={resForm.nomClient} onChange={e => setResForm(p => ({ ...p, nomClient: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Téléphone" value={resForm.telephone} onChange={e => setResForm(p => ({ ...p, telephone: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
                <input type="email" placeholder="Email" value={resForm.email} onChange={e => setResForm(p => ({ ...p, email: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="datetime-local" value={resForm.dateArrivee} onChange={e => setResForm(p => ({ ...p, dateArrivee: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" required />
                <input type="datetime-local" value={resForm.dateDepart} onChange={e => setResForm(p => ({ ...p, dateDepart: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" required />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input type="number" placeholder="Personnes" min="1" value={resForm.nbPersonnes} onChange={e => setResForm(p => ({ ...p, nbPersonnes: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
                <input type="number" placeholder="Prix total" value={resForm.prixTotal} onChange={e => setResForm(p => ({ ...p, prixTotal: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" required />
                <input type="number" placeholder="Avance" value={resForm.avance} onChange={e => setResForm(p => ({ ...p, avance: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
              </div>
              <input type="text" placeholder="Source (Booking, Réception, Phone...)" value={resForm.source} onChange={e => setResForm(p => ({ ...p, source: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <textarea placeholder="Notes" value={resForm.notes} onChange={e => setResForm(p => ({ ...p, notes: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" rows={2} />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-amber-600 py-2 rounded-lg">Réserver</button>
                <button type="button" onClick={() => setShowResModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
