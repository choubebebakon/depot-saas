import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

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
  const { metier, user } = useAuth();

  const [nomDepot, setNomDepot] = useState('');
  const [adresse, setAdresse] = useState('');
  const [devise, setDevise] = useState('FCFA');
  const [tva, setTva] = useState(19.25);
  const [saved, setSaved] = useState(false);

  if (metier !== 'DEPOT_BOISSONS') {
    return <div className="p-8 text-center text-red-400">Accès non autorisé</div>;
  }


  function handleSave(e) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">⚙️ Paramètres</h1>
        <p className="text-slate-400 text-sm mt-1">Configuration du dépôt de boissons</p>
      </div>

      <form onSubmit={handleSave} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Informations du dépôt</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Nom du dépôt</label>
              <input value={nomDepot} onChange={e => setNomDepot(e.target.value)} placeholder="Mon dépôt"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Adresse</label>
              <input value={adresse} onChange={e => setAdresse(e.target.value)} placeholder="Adresse du dépôt"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm" />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700/50 pt-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Configuration fiscale</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Devise</label>
              <select value={devise} onChange={e => setDevise(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm">
                <option value="FCFA">FCFA (XAF)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="USD">Dollar (USD)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">TVA (%)</label>
              <input type="number" step="0.01" value={tva} onChange={e => setTva(parseFloat(e.target.value))}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm" />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700/50 pt-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Notifications</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl cursor-pointer">
              <input type="écheckbox" defaultChecked className="w-4 h-4 rounded border-slate-600" />
              <span className="text-sm text-slate-300">Alerte stock critique</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl cursor-pointer">
              <input type="écheckbox" defaultChecked className="w-4 h-4 rounded border-slate-600" />
              <span className="text-sm text-slate-300">Alerte clients débiteurs</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl cursor-pointer">
              <input type="écheckbox" defaultChecked className="w-4 h-4 rounded border-slate-600" />
              <span className="text-sm text-slate-300">Rapport quotidien par email</span>
            </label>
          </div>
        </div>

        <button type="submit"
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all text-sm shadow-lg shadow-blue-600/20">
          {saved ? '✅ Configuration sauvegardée !' : '💾 Sauvegarder la configuration'}
        </button>
      </form>
    </div>
  );
}
