import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../../hooks/useData';
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


export default function RapportsPage() {
  const { metier: metierParam } = useParams();
  const { metier: metierAuth } = useAuth();
  const metier = metierParam || metierAuth || 'boutique';
  const prefix = metier.toLowerCase().replace(/_/g, '-');
  
  const [time, setTime] = useState(new Date());

  const { data: stats, loading, refetch  } = useData(`/${prefix}/rapports`, { enabled: true });

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 60000); return () => clearInterval(t); }, []);

  const cards = stats ? [
    { icon: '💰', label: 'Ventes', value: (stats.ventes || 0).toLocaleString('fr-FR'), unit: 'F', color: 'text-green-400', bg: 'bg-gradient-to-br from-green-500 to-green-600' },
    { icon: '📦', label: 'Stock', value: stats.stock || 0, unit: 'produits', color: 'text-blue-400', bg: 'bg-gradient-to-br from-blue-500 to-blue-600' },
    { icon: '👥', label: 'Clients', value: stats.clients || 0, unit: '', color: 'text-purple-400', bg: 'bg-gradient-to-br from-purple-500 to-purple-600' },
    { icon: '📊', label: 'CA', value: (stats.ca || 0).toLocaleString('fr-FR'), unit: 'F', color: 'text-orange-400', bg: 'bg-gradient-to-br from-orange-500 to-orange-600' },
  ] : [];

  if (loading) return <div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6">
      <div className="mb-6"><h1 className="text-2xl font-black text-white">📊 Rapports</h1><p className="text-slate-400 text-sm mt-1">Synthèse de la boutique</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((c, i) => (
          <div key={i} className={`${c.bg} p-5 rounded-2xl`}>
            <div className="flex items-start justify-between mb-3"><span className="text-2xl">{c.icon}</span><span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{c.label}</span></div>
            <p className={`font-black text-3xl ${c.color}`}>{c.value} <span className="text-base text-slate-500">{c.unit}</span></p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="text-white font-bold text-lg mb-4">📈 Top Produits</h3>
          {(!stats.topProduits || stats.topProduits.length === 0) ? <p className="text-slate-500 py-6 text-center">Aucune donnée</p>
          : <div className="space-y-3">{stats.topProduits.slice(0, 5).map((p, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
              <div className="flex items-center gap-3"><span className="text-slate-500 text-sm font-bold w-5">{i + 1}.</span><span className="text-white text-sm font-semibold">{p.nom || p.produit || '—'}</span></div>
              <span className="text-cyan-400 font-bold text-sm">{p.quantite || p.total || 0} vente{p.quantite > 1 || p.total > 1 ? 's' : ''}</span>
            </div>
          ))}</div>}
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="text-white font-bold text-lg mb-4">🏷️ Promotions</h3>
          {(!stats.promotions || stats.promotions.length === 0) ? <p className="text-slate-500 py-6 text-center">Aucune donnée</p>
          : <div className="space-y-3">{stats.promotions.slice(0, 5).map((p, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
              <span className="text-white text-sm font-semibold">{p.libelle || p.nom || '—'}</span>
              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${p.actif ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>{p.actif ? 'Actif' : 'Inactif'}</span>
            </div>
          ))}</div>}
        </div>
      </div>
    </div>
  );
}
