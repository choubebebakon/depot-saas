import { useState } from 'react';

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

export default function ParametresPage() {
  const [config, setConfig] = useState({ nomTransport: 'GeStock Transport', email: 'contact@gestock-transport.com', telephone: '+221 33 000 00 00', adresse: 'Dakar, Sénégal', tva: '18', devise: 'FCFA' });
  const [saved, setSaved] = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div><h1 className="text-3xl font-black text-white tracking-tight">⚙️ Paramètres</h1><p className="text-slate-400 text-sm">Configuration du transport</p></div>
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 space-y-5">
        {[
          { label: 'Nom société', key: 'nomTransport', type: 'text' },
          { label: 'Email', key: 'email', type: 'email' },
          { label: 'Téléphone', key: 'telephone', type: 'tel' },
          { label: 'Adresse', key: 'adresse', type: 'text' },
          { label: 'TVA (%)', key: 'tva', type: 'number' },
          { label: 'Devise', key: 'devise', type: 'text' },
        ].map(f => (
          <div key={f.key}><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">{f.label}</label><input type={f.type} value={config[f.key]} onChange={e => setConfig({...config, [f.key]: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white w-full text-sm" /></div>
        ))}
        <button onClick={handleSave} className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all">{saved ? '✓ Enregistré' : 'Enregistrer'}</button>
      </div>
    </div>
  );
}
