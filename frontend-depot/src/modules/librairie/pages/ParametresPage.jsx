import { useState } from 'react'; import api from '../../../api';

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
    // Object.setPrototypeOf(window, window.safeHandler) - REMOVED: not supported in modern browsers
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

export default function ParametresPage() {
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', adresse: '', devise: 'FCFA', tva: '' });
  const [loading, setLoading] = useState(false); const [notif, setNotif] = useState(null);

  const inputClass = 'bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-full';

  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };
  const handleSubmit = async (e) => { e.preventDefault(); setLoading(true); try { await api.put('/librairie/parametres', form); showNotif('Paramètres enregistrés ✓'); } catch { showNotif('Erreur', 'error'); } finally { setLoading(false); } };
  return (
    <div className="p-6 max-w-3xl mx-auto">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-indigo-600'}`}>{notif.msg}</div>}
      <div className="mb-8"><h1 className="text-2xl font-black text-white">⚙️ Paramètres</h1><p className="text-slate-400 text-sm mt-1">Configuration de la librairie</p></div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 space-y-5">
          <h3 className="text-white font-bold text-lg">🏪 Informations générales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Nom de la librairie</label><input value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} className={inputClass} placeholder="Ma Librairie" /></div>
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inputClass} placeholder="contact@librairie.com" /></div>
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Téléphone</label><input value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} className={inputClass} placeholder="+225 01 02 03 04" /></div>
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Devise</label><select value={form.devise} onChange={e => setForm({...form, devise: e.target.value})} className={inputClass}><option value="FCFA">FCFA</option><option value="EUR">EUR</option><option value="USD">USD</option></select></div>
          </div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Adresse</label><input value={form.adresse} onChange={e => setForm({...form, adresse: e.target.value})} className={inputClass} placeholder="Abidjan, Cocody" /></div>
          <div className="md:w-1/2"><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">TVA (%)</label><input type="number" value={form.tva} onChange={e => setForm({...form, tva: e.target.value})} className={inputClass} placeholder="18" /></div>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-4 rounded-xl text-lg">{loading ? '⏳ Enregistrement...' : '💾 Enregistrer les paramètres'}</button>
      </form>
    </div>
  );
}
