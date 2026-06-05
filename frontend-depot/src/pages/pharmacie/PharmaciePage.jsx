import { useState, useEffect } from 'react';
import api from '../../api';

export default function PharmaciePage() {
  const [tab, setTab] = useState('medicaments');
  const [medicaments, setMedicaments] = useState([]);
  const [ordonnances, setOrdonnances] = useState([]);
  const [articles, setArticles] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMedModal, setShowMedModal] = useState(false);
  const [showOrdModal, setShowOrdModal] = useState(false);
  const [medForm, setMedForm] = useState({ articleId: '', numeroLot: '', dateExpiration: '', dosage: '', formeGalenique: '', famille: 'Antibiotique', surOrdonnance: false });
  const [ordForm, setOrdForm] = useState({ clientId: '', medecin: '', etablissement: '', dateEmise: '', lignes: [{ articleId: '', quantitePrescrite: 1, posologie: '', duree: '' }] });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [m, o, a, c] = await Promise.all([
        api.get('/medicaments'),
        api.get('/ordonnances'),
        api.get('/articles', { params: { limit: 200 } }),
        api.get('/clients', { params: { limit: 200 } }),
      ]);
      setMedicaments(m.data || []);
      setOrdonnances(o.data || []);
      setArticles(a.data.data || a.data || []);
      setClients(c.data.data || c.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateMed = async (e) => {
    e.preventDefault();
    await api.post('/medicaments', { ...medForm, dateExpiration: new Date(medForm.dateExpiration).toISOString() });
    setShowMedModal(false);
    setMedForm({ articleId: '', numeroLot: '', dateExpiration: '', dosage: '', formeGalenique: '', famille: 'Antibiotique', surOrdonnance: false });
    fetchData();
  };

  const handleCreateOrd = async (e) => {
    e.preventDefault();
    await api.post('/ordonnances', {
      ...ordForm, dateEmise: new Date(ordForm.dateEmise).toISOString(),
      lignes: ordForm.lignes.filter(l => l.articleId).map(l => ({ ...l, quantitePrescrite: parseInt(l.quantitePrescrite) })),
    });
    setShowOrdModal(false);
    setOrdForm({ clientId: '', medecin: '', etablissement: '', dateEmise: '', lignes: [{ articleId: '', quantitePrescrite: 1, posologie: '', duree: '' }] });
    fetchData();
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">💊 Pharmacie</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowMedModal(true)} className="bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-lg text-sm font-medium">+ Médicament</button>
          <button onClick={() => setShowOrdModal(true)} className="bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-lg text-sm font-medium">+ Ordonnance</button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {['medicaments', 'ordonnances'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg ${tab === t ? 'bg-emerald-600' : 'bg-slate-700'}`}>
            {t === 'medicaments' ? '💉 Médicaments' : '📝 Ordonnances'}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-12 text-slate-400">Chargement...</div>}

      {!loading && tab === 'medicaments' && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {medicaments.map(m => (
            <div key={m.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{m.article?.designation || 'Médicament'}</h3>
                  <p className="text-sm text-slate-400">{m.dosage && `${m.dosage} · `}{m.formeGalenique}</p>
                  <span className="text-xs text-emerald-300 bg-emerald-900/30 px-2 py-0.5 rounded">{m.famille}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${m.surOrdonnance ? 'text-red-300 bg-red-900/30' : 'text-green-300 bg-green-900/30'}`}>{m.surOrdonnance ? 'Sur ordonnance' : 'Libre'}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Lot: {m.numeroLot} · Exp: {new Date(m.dateExpiration).toLocaleDateString()}</p>
              <p className="text-emerald-400 font-semibold mt-1">{m.article?.prixVente || 0} XAF</p>
            </div>
          ))}
          {medicaments.length === 0 && <div className="col-span-full text-center py-8 text-slate-500">Aucun médicament.</div>}
        </div>
      )}

      {!loading && tab === 'ordonnances' && (
        <div className="space-y-2">
          {ordonnances.map(o => (
            <div key={o.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">Patient: {o.client?.nom || o.clientId}</p>
                  <p className="text-sm text-slate-400">Médecin: {o.medecin || 'N/C'} {o.etablissement && `· ${o.etablissement}`}</p>
                  <p className="text-xs text-slate-500">{new Date(o.dateEmise).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${o.statut === 'COMPLETE' ? 'text-emerald-300 bg-emerald-900/30' : o.statut === 'EN_COURS' ? 'text-yellow-300 bg-yellow-900/30' : 'text-blue-300 bg-blue-900/30'}`}>{o.statut || 'EN_ATTENTE'}</span>
              </div>
            </div>
          ))}
          {ordonnances.length === 0 && <div className="text-center py-8 text-slate-500">Aucune ordonnance.</div>}
        </div>
      )}

      {showMedModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowMedModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Ajouter médicament</h2>
            <form onSubmit={handleCreateMed} className="space-y-3">
              <select value={medForm.articleId} onChange={e => setMedForm(p => ({ ...p, articleId: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required>
                <option value="">Article...</option>
                {articles.map(a => <option key={a.id} value={a.id}>{a.designation || a.nom}</option>)}
              </select>
              <input type="text" placeholder="Numéro de lot" value={medForm.numeroLot} onChange={e => setMedForm(p => ({ ...p, numeroLot: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <input type="date" value={medForm.dateExpiration} onChange={e => setMedForm(p => ({ ...p, dateExpiration: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Dosage (500mg...)" value={medForm.dosage} onChange={e => setMedForm(p => ({ ...p, dosage: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
                <input type="text" placeholder="Forme (Comprimé...)" value={medForm.formeGalenique} onChange={e => setMedForm(p => ({ ...p, formeGalenique: e.target.value }))} className="p-3 bg-slate-700 rounded-lg" />
              </div>
              <select value={medForm.famille} onChange={e => setMedForm(p => ({ ...p, famille: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg">
                <option>Antibiotique</option><option>Antalgique</option><option>Antifongique</option><option>Antiviral</option><option>Vitamines</option><option>Autre</option>
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={medForm.surOrdonnance} onChange={e => setMedForm(p => ({ ...p, surOrdonnance: e.target.checked }))} className="w-4 h-4" />
                Sur ordonnance uniquement
              </label>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-emerald-600 py-2 rounded-lg">Ajouter</button>
                <button type="button" onClick={() => setShowMedModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showOrdModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowOrdModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Nouvelle ordonnance</h2>
            <form onSubmit={handleCreateOrd} className="space-y-3">
              <select value={ordForm.clientId} onChange={e => setOrdForm(p => ({ ...p, clientId: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required>
                <option value="">Patient...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nom || c.prenom || c.id}</option>)}
              </select>
              <input type="text" placeholder="Médecin prescripteur" value={ordForm.medecin} onChange={e => setOrdForm(p => ({ ...p, medecin: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <input type="text" placeholder="Établissement" value={ordForm.etablissement} onChange={e => setOrdForm(p => ({ ...p, etablissement: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <input type="date" value={ordForm.dateEmise} onChange={e => setOrdForm(p => ({ ...p, dateEmise: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <p className="text-sm font-semibold text-slate-400">Lignes de prescription:</p>
              {ordForm.lignes.map((ligne, i) => (
                <div key={i} className="p-2 bg-slate-700/50 rounded space-y-1">
                  <select value={ligne.articleId} onChange={e => { const lignes = [...ordForm.lignes]; lignes[i].articleId = e.target.value; setOrdForm(p => ({ ...p, lignes })); }} className="w-full p-2 bg-slate-700 rounded text-sm" required>
                    <option value="">Médicament...</option>
                    {articles.map(a => <option key={a.id} value={a.id}>{a.designation || a.nom}</option>)}
                  </select>
                  <div className="grid grid-cols-3 gap-1">
                    <input type="number" placeholder="Qté" min="1" value={ligne.quantitePrescrite} onChange={e => { const lignes = [...ordForm.lignes]; lignes[i].quantitePrescrite = e.target.value; setOrdForm(p => ({ ...p, lignes })); }} className="p-2 bg-slate-700 rounded text-sm" />
                    <input type="text" placeholder="Posologie" value={ligne.posologie} onChange={e => { const lignes = [...ordForm.lignes]; lignes[i].posologie = e.target.value; setOrdForm(p => ({ ...p, lignes })); }} className="p-2 bg-slate-700 rounded text-sm col-span-2" />
                  </div>
                  {i === ordForm.lignes.length - 1 && <button type="button" onClick={() => setOrdForm(p => ({ ...p, lignes: [...p.lignes, { articleId: '', quantitePrescrite: 1, posologie: '', duree: '' }] }))} className="text-xs text-emerald-400">+ Ajouter ligne</button>}
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-emerald-600 py-2 rounded-lg">Créer</button>
                <button type="button" onClick={() => setShowOrdModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
