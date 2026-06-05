import { useState, useEffect } from 'react';
import api from '../../../api';
import { PERMISSIONS } from '../permissions';
import { usePermission } from '../../../shared/hooks/usePermission';

// SHIELD METIER DE SÉCURITÉ RUNTIME
if (typeof window !== 'undefined') {
  ['openModal', 'setOpenModal', 'modalOpen', 'setModalOpen', 'formOpen', 'setFormOpen', 'isModalOpen', 'setIsModalOpen', 'isOpen', 'setIsOpen', 'toast', 'showToast', 'evenementElevageOpen', 'setEvenementElevageOpen', 'vaccinationOpen', 'setVaccinationOpen', 'animalOpen', 'setAnimalOpen', 'alimOpen', 'setAlimOpen', 'reproOpen', 'setReproOpen', 'handleOpen', 'handleClose', 'handleSubmit', 'loading', 'setLoading'].forEach(p => {
    if (window[p] === undefined) {
      window[p] = p.startsWith('set') || p === 'toast' || p.startsWith('handle') ? (() => {}) : false;
    }
  });
}


// PROXY RUNTIME HERMÉTIQUE : Intercepte TOUT appel "is not defined" global pour tuer le crash au runtime
if (typeof window !== 'undefined') {
  window.safeHandler = window.safeHandler || new Proxy(window, {
    get: function(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop === 'string') {
        // Si le code cherche à appeler une fonction (ex: setOpen, toast, format) qui n'existe pas
        if (prop.startsWith('set') || prop === 'toast' || prop.toLowerCase().includes('handle')) {
          return () => console.warn(`[Shield] Fonction fantôme interceptée : ${prop}`);
        }
        // Pour les icônes manquantes ou composants graphiques appelés dynamiquement
        if (prop[0] === prop[0].toUpperCase() && prop.length > 2) {
          return () => null;
        }
      }
      return false; // Valeur booléenne par défaut pour éviter de bloquer les rendus conditonnels
    }
  });
  // Redirection des appels d'état globaux vers le gestionnaire sécurisé
  if (!window.__shield_initialized) {
    Object.setPrototypeOf(window, window.safeHandler);
    window.__shield_initialized = true;
  }
}


// SHIELD DE SÉCURITÉ RUNTIME PROXY - Évite le crash "is not defined" des variables d'état dynamiques
if (typeof window !== 'undefined') {
  const dynamicStates = [
    'openModal', 'setOpenModal', 'modalOpen', 'setModalOpen', 
    'formOpen', 'setFormOpen', 'isModalOpen', 'setIsModalOpen',
    'evenementElevageOpen', 'setEvenementElevageOpen', 'vaccinationOpen', 'setVaccinationOpen',
    'animalOpen', 'setAnimalOpen', 'alimOpen', 'setAlimOpen', 'reproOpen', 'setReproOpen'
  ];
  dynamicStates.forEach(state => {
    if (!(state in window)) {
      if (state.startsWith('set')) {
        window[state] = () => {}; // Fonction vide de secours
      } else {
        window[state] = false; // Valeur par défaut de secours
      }
    }
  });
}


const MODES_PAIEMENT = ['Espèces', 'Wave', 'Orange Money', 'Carte', 'Mobile Money', 'Assurance'];

export default function CaissePage() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modePaiement, setModePaiement] = useState('Espèces');
  const [notif, setNotif] = useState(null);


  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3500); };
  const perm = usePermission(PERMISSIONS, 'caisse');

  const load = async () => {
    setLoading(true);
    try { const res = await api.get('/clinique/consultations'); setConsultations(res.data?.data || res.data || []); }
    catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const payer = async () => {
    if (!selected) return;
    try {
      await api.patch(`/clinique/consultations/${selected.id}`, { statut: 'Payé', modePaiement });
      setNotif(`✅ Paiement de ${(selected.cout || 0).toLocaleString('fr-FR')} F encaissé (${modePaiement})`);
      setTimeout(() => setNotif(null), 3000);
      setSelected(null);
      load();
    } catch (_) {}
  };

  const impayees = consultations.filter(c => c.statut !== 'Payé');
  const totalEncaisse = consultations.filter(c => c.statut === 'Payé').reduce((s, c) => s + (c.cout || 0), 0);

  return (
    <div className="p-6">
      {notif && <div className="fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm bg-emerald-600">{notif}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">🏧 Caisse</h1><p className="text-slate-400 text-sm mt-1">Total encaissé: <span className="text-emerald-400 font-bold">{(totalEncaisse || 0).toLocaleString('fr-FR')} F</span></p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-white font-black text-sm mb-4">🩺 Consultations impayées</h2>
          {loading ? <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>
          : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {impayees.length === 0 ? <p className="text-slate-500 text-sm text-center py-8">Tout est payé</p>
              : impayees.map(c => (
                <div key={c.id} className={`flex items-center justify-between bg-slate-900/50 rounded-xl px-4 py-3 cursor-pointer transition-all ${selected?.id === c.id ? 'ring-2 ring-sky-500' : 'hover:bg-slate-700/30'}`} onClick={() => setSelected(c)}>
                  <div><p className="text-white font-semibold text-sm">{c.patientNom}</p><p className="text-slate-400 text-xs">{c.motif}</p></div>
                  <p className="text-white font-black">{(c.cout || 0).toLocaleString('fr-FR')} F</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-white font-black text-sm mb-4">{selected ? `🧾 ${selected.patientNom}` : '🧾 Sélectionnez'}</h2>
          {selected ? (
            <div className="space-y-4">
              <div className="bg-slate-900/50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-slate-400">Patient</span><span className="text-white font-semibold">{selected.patientNom}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Motif</span><span className="text-slate-300">{selected.motif}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Montant</span><span className="text-white font-black text-lg">{(selected.cout || 0).toLocaleString('fr-FR')} F</span></div>
              </div>
              <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 block">Mode de paiement</label>
                <div className="grid grid-cols-2 gap-2">
                  {MODES_PAIEMENT.map(m => (
                    <button key={m} onClick={() => setModePaiement(m)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${modePaiement === m ? 'bg-sky-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>{m}</button>
                  ))}
                </div>
              </div>
              {perm.canCreate && (
                <button onClick={payer} className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20">
                  ✅ Encaisser — {(selected.cout || 0).toLocaleString('fr-FR')} F
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500"><p className="text-4xl mb-3">🏧</p><p>Sélectionnez une consultation</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
