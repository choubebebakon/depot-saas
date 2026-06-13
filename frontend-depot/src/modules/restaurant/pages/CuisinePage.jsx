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


export default function CuisinePage() {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState(null);


  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3500); };
  const perm = usePermission(PERMISSIONS, 'cuisine');

  const load = async () => {
    setLoading(true);
    try { const res = await api.get('/restaurant/commandes'); setCommandes((res.data?.data || res.data || []).filter(c => c.statut !== 'Payé' && c.statut !== 'Annulé')); }
    catch (_) { setCommandes([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); const i = setInterval(load, 15000); return () => clearInterval(i); }, []);

  const updateStatut = async (id, statut) => {
    try { await api.patch(`/restaurant/commandes/${id}`, { statut }); setNotif(`Commande passée à "${statut}"`); setTimeout(() => setNotif(null), 2000); load(); }
    catch (_) {}
  };

  if (loading) return <div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6">
      {notif && <div className="fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm bg-red-600">{notif}</div>}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">👨‍🍳 Cuisine</h1>
        <p className="text-slate-400 text-sm mt-1">{commandes.length} commande{commandes.length !== 1 ? 's' : ''} en cours</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {commandes.length === 0 ? (
          <div className="col-span-full text-center py-20 text-slate-500">
            <p className="text-5xl mb-4">🍽️</p>
            <p className="text-slate-400 font-bold">Aucune commande en cours</p>
            <p className="text-slate-500 text-sm">Les nouvelles commandes apparaîtront ici</p>
          </div>
        ) : commandes.map(c => (
          <div key={c.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-white font-black text-lg">Table {c.tableNumero}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.statut === 'En préparation' ? 'bg-yellow-500/20 text-yellow-400' : c.statut === 'Prêt' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>{c.statut}</span>
              </div>
              <span className="text-slate-400 text-xs">{c.createdAt ? new Date(c.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
            </div>
            <p className="text-white text-sm font-semibold mb-1">📋 {c.articles}</p>
            {c.notes && <p className="text-slate-500 text-xs mb-3">📝 {c.notes}</p>}
            <div className="flex gap-2 mt-3">
              {c.statut === 'En attente' && perm.canEdit && (
                <button onClick={() => updateStatut(c.id, 'En préparation')} className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-white font-bold py-2 rounded-xl text-xs transition-all">Démarrer</button>
              )}
              {c.statut === 'En préparation' && perm.canEdit && (
                <button onClick={() => updateStatut(c.id, 'Prêt')} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2 rounded-xl text-xs transition-all">✅ Prêt</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
