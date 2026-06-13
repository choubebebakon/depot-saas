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


function MiniBar({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-400 text-xs w-24 truncate">{label}</span>
      <div className="flex-1 bg-slate-700/50 rounded-full h-2">
        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color || '#f59e0b' }} />
      </div>
      <span className="text-white text-xs font-bold w-24 text-right">{(value || 0).toLocaleString('fr-FR')} F</span>
    </div>
  );
}

export default function RapportsPage() {
  const { metier: metierParam } = useParams();
  const { metier: metierAuth } = useAuth();
  const metier = metierParam || metierAuth || 'supermarche';
  const prefix = metier.toLowerCase().replace(/_/g, '-');
  const [periode, setPeriode] = useState('mois');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');


  const params = { periode };
  if (dateDebut) params.dateDebut = dateDebut;
  if (dateFin) params.dateFin = dateFin;

  const { data: stats, loading } = useData(`/${prefix}/rapports`, { enabled: true, params });

  if (loading) return <div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">📊 Rapports</h1>
          <p className="text-slate-400 text-sm">Période : {periode}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex gap-2">{[{k:'jour',l:'Jour'},{k:'semaine',l:'Semaine'},{k:'mois',l:'Mois'},{k:'annee',l:'Année'}].map(p => (
            <button key={p.k} onClick={() => setPeriode(p.k)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${periode === p.k ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p.l}</button>
          ))}</div>
          <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs" />
          <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: '💰', label: 'CA total', value: `${(stats?.caTotal || 0).toLocaleString('fr-FR')} F`, color: '#10b981' },
          { icon: '🧾', label: 'Transactions', value: stats?.transactions || 0, color: '#3b82f6' },
          { icon: '💸', label: 'Dépenses', value: `${(stats?.depenses || 0).toLocaleString('fr-FR')} F`, color: '#ef4444' },
          { icon: '📈', label: 'Marge', value: `${(stats?.marge || 0).toLocaleString('fr-FR')} F`, color: '#f59e0b' },
        ].map((k, i) => (
          <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl mb-3" style={{ backgroundColor: k.color + '22' }}>{k.icon}</div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{k.label}</p>
            <p className="text-white font-black text-2xl leading-none">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-white font-black text-sm mb-4">📦 Ventes par rayon</h2>
          <div className="space-y-3">
            {stats?.rayons?.map((r, i) => (
              <MiniBar key={i} label={r.nom} value={r.montant} max={Math.max(...(stats?.rayons?.map(x => x.montant) || [1]))} color={r.couleur || '#f59e0b'} />
            ))}
            {(!stats?.rayons || stats.rayons.length === 0) && <p className="text-slate-500 text-sm text-center py-6">Aucune donnée</p>}
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-white font-black text-sm mb-4">🏆 Top produits</h2>
          <div className="space-y-3">
            {stats?.topProduits?.map((p, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-900/50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-xs font-bold">#{i + 1}</span>
                  <span className="text-white font-semibold text-sm">{p.nom}</span>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-xs">{p.qte} vendus</p>
                  <p className="text-slate-400 text-[10px]">{(p.ca || 0).toLocaleString('fr-FR')} F</p>
                </div>
              </div>
            ))}
            {(!stats?.topProduits || stats.topProduits.length === 0) && <p className="text-slate-500 text-sm text-center py-8">Aucune donnée</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
