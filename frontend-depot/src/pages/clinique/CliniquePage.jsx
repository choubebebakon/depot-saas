import { useState, useEffect } from 'react';
import api from '../../api';

const STATUT_STYLES = {
  PLANIFIE: 'text-blue-300 bg-blue-900/30', CONFIRME: 'text-cyan-300 bg-cyan-900/30',
  EN_COURS: 'text-yellow-300 bg-yellow-900/30', TERMINE: 'text-emerald-300 bg-emerald-900/30',
  ANNULE: 'text-red-300 bg-red-900/30', NO_SHOW: 'text-slate-300 bg-slate-700/50',
};

export default function CliniquePage() {
  const [tab, setTab] = useState('dossiers');
  const [dossiers, setDossiers] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [rdvs, setRdvs] = useState([]);
  const [clients, setClients] = useState([]);
  const [medicaments, setMedicaments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [showRdvModal, setShowRdvModal] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState(null);

  const [dosForm, setDosForm] = useState({ clientId: '', groupeSanguin: '', allergies: '', antecedents: '', traitementEnCours: '' });
  const [consultForm, setConsultForm] = useState({ dossierId: '', motif: '', specialite: '', examen: '', diagnostic: '', montant: '', notes: '' });
  const [prescForm, setPrescForm] = useState({ medicament: '', dosage: '', posologie: '', duree: '' });
  const [rdvForm, setRdvForm] = useState({ clientId: '', dateHeure: '', motif: '', specialite: '', notes: '' });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [d, c, r, cl, st] = await Promise.all([
        api.get('/clinique/dossiers', { params: { search, limit: 30 } }),
        api.get('/clinique/consultations', { params: { limit: 20 } }),
        api.get('/clinique/rendez-vous', { params: { limit: 30 } }),
        api.get('/clients', { params: { limit: 200 } }),
        api.get('/clinique/stats'),
      ]);
      setDossiers(d.data.data || d.data || []);
      setConsultations(c.data.data || c.data || []);
      setRdvs(r.data.data || r.data || []);
      setClients(cl.data.data || cl.data || []);
      setStats(st.data || null);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { const t = setTimeout(fetchAll, 300); return () => clearTimeout(t); }, [search]);

  const handleCreateDossier = async (e) => { e.preventDefault(); await api.post('/clinique/dossiers', dosForm); setShowDossierModal(false); setDosForm({ clientId: '', groupeSanguin: '', allergies: '', antecedents: '', traitementEnCours: '' }); fetchAll(); };
  const handleCreateConsult = async (e) => { e.preventDefault(); await api.post('/clinique/consultations', { ...consultForm, montant: consultForm.montant ? parseFloat(consultForm.montant) : undefined }); setShowConsultModal(false); setConsultForm({ dossierId: '', motif: '', specialite: '', examen: '', diagnostic: '', montant: '', notes: '' }); fetchAll(); };
  const handleAddPresc = async (consultId) => { await api.post(`/clinique/consultations/${consultId}/prescriptions`, prescForm); setPrescForm({ medicament: '', dosage: '', posologie: '', duree: '' }); fetchAll(); };
  const handleCreateRdv = async (e) => { e.preventDefault(); await api.post('/clinique/rendez-vous', rdvForm); setShowRdvModal(false); setRdvForm({ clientId: '', dateHeure: '', motif: '', specialite: '', notes: '' }); fetchAll(); };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🏥 Clinique</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowDossierModal(true)} className="bg-rose-600 hover:bg-rose-700 px-3 py-2 rounded-lg text-sm font-medium">+ Dossier</button>
          <button onClick={() => setShowConsultModal(true)} className="bg-rose-600 hover:bg-rose-700 px-3 py-2 rounded-lg text-sm font-medium">+ Consultation</button>
          <button onClick={() => setShowRdvModal(true)} className="bg-rose-600 hover:bg-rose-700 px-3 py-2 rounded-lg text-sm font-medium">+ RDV</button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['dossiers', 'consultations', 'rdvs', 'stats'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg ${tab === t ? 'bg-rose-600' : 'bg-slate-700'}`}>
            {t === 'dossiers' ? '📋 Patients' : t === 'consultations' ? '🩺 Consultations' : t === 'rdvs' ? '📅 Rendez-vous' : '📊 Stats'}
          </button>
        ))}
      </div>

      <input type="text" placeholder="Rechercher patient..." value={search} onChange={e => setSearch(e.target.value)} className={`w-full p-3 bg-slate-800 border border-slate-700 rounded-lg mb-4 ${tab !== 'dossiers' ? 'hidden' : ''}`} />

      {loading && <div className="text-center py-12 text-slate-400">Chargement...</div>}

      {!loading && tab === 'dossiers' && (
        <div className="grid gap-3 md:grid-cols-2">
          {dossiers.map(d => (
            <div key={d.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{d.client?.nom || d.client?.prenom || 'Patient'}</h3>
                  <p className="text-xs text-slate-400">GS: {d.groupeSanguin || 'N/C'} · Allergies: {d.allergies || '-'}</p>
                </div>
                <button onClick={() => setSelectedDossier(selectedDossier?.id === d.id ? null : d)} className="text-rose-400 text-xs">Détails</button>
              </div>
              {d.antecedents && <p className="text-xs text-slate-500 mt-1">Ant: {d.antecedents.substring(0, 100)}</p>}
              {d.consultations?.length > 0 && <p className="text-xs text-slate-500 mt-1">Consultations: {d.consultations.length}</p>}

              {selectedDossier?.id === d.id && (
                <div className="mt-3 pt-3 border-t border-slate-700 space-y-2">
                  <p className="text-sm font-semibold text-rose-400">Dossier complet</p>
                  <p className="text-xs text-slate-400">Allergies: {d.allergies || 'Aucune'}</p>
                  <p className="text-xs text-slate-400">Antécédents: {d.antecedents || 'Aucun'}</p>
                  <p className="text-xs text-slate-400">Traitement: {d.traitementEnCours || 'Aucun'}</p>
                  {d.consultations?.map(c => (
                    <div key={c.id} className="bg-slate-700/50 rounded-lg p-2">
                      <p className="text-xs text-slate-300">{new Date(c.date).toLocaleDateString()} — {c.motif}</p>
                      {c.diagnostic && <p className="text-xs text-slate-400">Dx: {c.diagnostic}</p>}
                      {c.prescriptions?.map(p => <p key={p.id} className="text-xs text-cyan-300">{p.medicament} {p.posologie || ''} {p.duree || ''}</p>)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {dossiers.length === 0 && <div className="col-span-full text-center py-12 text-slate-500">Aucun dossier patient.</div>}
        </div>
      )}

      {!loading && tab === 'consultations' && (
        <div className="space-y-2">
          {consultations.map(c => (
            <div key={c.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{c.motif}</p>
                  <p className="text-sm text-slate-400">Patient: {c.dossier?.client?.nom || c.dossierId}</p>
                  <p className="text-xs text-slate-500">{c.specialite && `${c.specialite} · `}{new Date(c.date).toLocaleString()}</p>
                  {c.diagnostic && <p className="text-xs text-yellow-300 mt-1">Dx: {c.diagnostic}</p>}
                  {c.notes && <p className="text-xs text-slate-500 italic">{c.notes}</p>}
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded ${c.statut === 'EN_COURS' ? 'text-yellow-300 bg-yellow-900/30' : c.statut === 'TERMINEE' ? 'text-emerald-300 bg-emerald-900/30' : 'text-red-300 bg-red-900/30'}`}>{c.statut}</span>
                  {c.montant > 0 && <p className="text-emerald-400 font-semibold mt-1">{c.montant} XAF</p>}
                </div>
              </div>
              {c.prescriptions?.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-700">
                  <p className="text-xs font-semibold text-cyan-400 mb-1">Prescriptions:</p>
                  {c.prescriptions.map(p => <span key={p.id} className="inline-block bg-slate-700 text-xs px-2 py-0.5 rounded mr-1 mb-1">{p.medicament} {p.posologie || ''}</span>)}
                </div>
              )}
            </div>
          ))}
          {consultations.length === 0 && <div className="text-center py-8 text-slate-500">Aucune consultation.</div>}
        </div>
      )}

      {!loading && tab === 'rdvs' && (
        <div className="space-y-2">
          {rdvs.map(r => (
            <div key={r.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{r.client?.nom || r.client?.prenom || 'Patient'}</p>
                  <p className="text-sm text-slate-400">{r.motif || 'Consultation'}</p>
                  <p className="text-xs text-slate-500">{new Date(r.dateHeure).toLocaleString()} {r.specialite && `· ${r.specialite}`}</p>
                  {r.notes && <p className="text-xs text-slate-500 italic">{r.notes}</p>}
                </div>
                <select value={r.statut} onChange={e => api.post(`/clinique/rendez-vous/${r.id}/statut`, { statut: e.target.value }).then(fetchAll)} className={`text-xs rounded p-1 ${r.statut === 'ANNULE' ? 'bg-red-900/30 text-red-300' : 'bg-slate-700'}`}>
                  <option value="PLANIFIE">Planifié</option>
                  <option value="CONFIRME">Confirmé</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="TERMINE">Terminé</option>
                  <option value="ANNULE">Annulé</option>
                  <option value="NO_SHOW">Absent</option>
                </select>
              </div>
            </div>
          ))}
          {rdvs.length === 0 && <div className="text-center py-8 text-slate-500">Aucun rendez-vous.</div>}
        </div>
      )}

      {!loading && tab === 'stats' && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-rose-400 text-2xl font-bold">{stats.totalPatients}</p><p className="text-slate-400 text-sm">Patients</p></div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-blue-400 text-2xl font-bold">{stats.rdvsAujourdhui}</p><p className="text-slate-400 text-sm">RDV aujourd'hui</p></div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-yellow-400 text-2xl font-bold">{stats.rdvsPlanifies}</p><p className="text-slate-400 text-sm">RDV planifiés</p></div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-cyan-400 text-2xl font-bold">{stats.consultationsEnCours}</p><p className="text-slate-400 text-sm">Consultations en cours</p></div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-emerald-400 text-2xl font-bold">{stats.totalConsultations}</p><p className="text-slate-400 text-sm">Total consultations</p></div>
        </div>
      )}

      {showDossierModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowDossierModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Nouveau dossier patient</h2>
            <form onSubmit={handleCreateDossier} className="space-y-3">
              <select value={dosForm.clientId} onChange={e => setDosForm(p => ({ ...p, clientId: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required>
                <option value="">Client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nom || c.prenom || c.id}</option>)}
              </select>
              <input type="text" placeholder="Groupe sanguin" value={dosForm.groupeSanguin} onChange={e => setDosForm(p => ({ ...p, groupeSanguin: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <textarea placeholder="Allergies" value={dosForm.allergies} onChange={e => setDosForm(p => ({ ...p, allergies: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" rows={2} />
              <textarea placeholder="Antécédents médicaux" value={dosForm.antecedents} onChange={e => setDosForm(p => ({ ...p, antecedents: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" rows={2} />
              <textarea placeholder="Traitement en cours" value={dosForm.traitementEnCours} onChange={e => setDosForm(p => ({ ...p, traitementEnCours: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" rows={2} />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-rose-600 py-2 rounded-lg">Créer</button>
                <button type="button" onClick={() => setShowDossierModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConsultModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowConsultModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Nouvelle consultation</h2>
            <form onSubmit={handleCreateConsult} className="space-y-3">
              <select value={consultForm.dossierId} onChange={e => setConsultForm(p => ({ ...p, dossierId: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required>
                <option value="">Dossier patient...</option>
                {dossiers.map(d => <option key={d.id} value={d.id}>{d.client?.nom || d.client?.prenom || d.id}</option>)}
              </select>
              <input type="text" placeholder="Motif de consultation" value={consultForm.motif} onChange={e => setConsultForm(p => ({ ...p, motif: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <input type="text" placeholder="Spécialité" value={consultForm.specialite} onChange={e => setConsultForm(p => ({ ...p, specialite: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <textarea placeholder="Examen clinique" value={consultForm.examen} onChange={e => setConsultForm(p => ({ ...p, examen: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" rows={2} />
              <input type="text" placeholder="Diagnostic" value={consultForm.diagnostic} onChange={e => setConsultForm(p => ({ ...p, diagnostic: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <input type="number" placeholder="Montant consultation (XAF)" value={consultForm.montant} onChange={e => setConsultForm(p => ({ ...p, montant: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <textarea placeholder="Notes" value={consultForm.notes} onChange={e => setConsultForm(p => ({ ...p, notes: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" rows={2} />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-rose-600 py-2 rounded-lg">Créer</button>
                <button type="button" onClick={() => setShowConsultModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRdvModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowRdvModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Nouveau rendez-vous</h2>
            <form onSubmit={handleCreateRdv} className="space-y-3">
              <select value={rdvForm.clientId} onChange={e => setRdvForm(p => ({ ...p, clientId: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required>
                <option value="">Patient...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nom || c.prenom || c.id}</option>)}
              </select>
              <input type="datetime-local" value={rdvForm.dateHeure} onChange={e => setRdvForm(p => ({ ...p, dateHeure: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <input type="text" placeholder="Motif" value={rdvForm.motif} onChange={e => setRdvForm(p => ({ ...p, motif: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <input type="text" placeholder="Spécialité" value={rdvForm.specialite} onChange={e => setRdvForm(p => ({ ...p, specialite: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <textarea placeholder="Notes" value={rdvForm.notes} onChange={e => setRdvForm(p => ({ ...p, notes: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" rows={2} />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-rose-600 py-2 rounded-lg">Planifier</button>
                <button type="button" onClick={() => setShowRdvModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
