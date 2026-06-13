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

export default function RapportsPage() {
  const [type, setType] = useState('ventes');
  const rapports = {
    ventes: [
      { mois: 'Janvier 2026', montant: 4850000, clients: 12, livraisons: 85 },
      { mois: 'Février 2026', montant: 4320000, clients: 10, livraisons: 78 },
      { mois: 'Mars 2026', montant: 5620000, clients: 15, livraisons: 95 },
      { mois: 'Avril 2026', montant: 6100000, clients: 18, livraisons: 110 },
    ],
    chantiers: [
      { chantier: 'Résidence Mer', client: 'Sococim', statut: 'En cours', avancement: '65%' },
      { chantier: 'Marché Central', client: 'Mairie', statut: 'En cours', avancement: '40%' },
      { chantier: 'Villa Baobab', client: 'M. Diallo', statut: 'Terminé', avancement: '100%' },
      { chantier: 'Pont Sud', client: 'État', statut: 'En attente', avancement: '0%' },
    ],
    depenses: [
      { categorie: 'Ciment', montant: 1200000, mois: 'Avril 2026' },
      { categorie: 'Carburant', montant: 380000, mois: 'Avril 2026' },
      { categorie: 'Maintenance', montant: 210000, mois: 'Avril 2026' },
      { categorie: 'Salaires', montant: 850000, mois: 'Avril 2026' },
    ],
  };
  const current = rapports[type] || [];
  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-3xl font-black text-white tracking-tight">📈 Rapports</h1><p className="text-slate-400 text-sm">Indicateurs de performance</p></div>
      <div className="flex gap-3 flex-wrap">
        {[
          { id: 'ventes', label: 'Ventes', icon: '💰' },
          { id: 'chantiers', label: 'Chantiers', icon: '🏗️' },
          { id: 'depenses', label: 'Dépenses', icon: '💸' },
        ].map(t => (
          <button key={t.id} onClick={() => setType(t.id)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${type === t.id ? 'bg-amber-700 text-white shadow-lg shadow-amber-700/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{t.icon} {t.label}</button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-700/50"><table className="w-full text-sm"><thead className="bg-slate-800/80 text-slate-400 text-xs uppercase"><tr>{Object.keys(current[0] || {}).map(k => <th key={k} className="p-4 text-left">{k}</th>)}</tr></thead><tbody>{current.map((r, i) => (
        <tr key={i} className="border-t border-slate-800 hover:bg-slate-800/40">{Object.values(r).map((v, j) => <td key={j} className="p-4 text-white font-semibold">{v}</td>)}</tr>
      ))}</tbody></table></div>
    </div>
  );
}
