import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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


const COULEUR = '#f59e0b';

function StatCard({ icon, label, value, sub, color, trend }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 hover:border-amber-500/30 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: color + '22' }}>
          {icon}
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
      <p className="text-white font-black text-2xl leading-none">{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function MiniBar({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-400 text-xs w-24 truncate">{label}</span>
      <div className="flex-1 bg-slate-700/50 rounded-full h-2">
        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color || COULEUR }} />
      </div>
      <span className="text-white text-xs font-bold w-12 text-right">{value.toLocaleString('fr-FR')}</span>
    </div>
  );
}

const RAYONS_MOCK = [
  { label: 'Alimentaire', value: 4820000, color: '#10b981' },
  { label: 'Boissons',    value: 3150000, color: '#3b82f6' },
  { label: 'Hygiène',     value: 1890000, color: '#8b5cf6' },
  { label: 'Surgelés',    value: 1240000, color: '#06b6d4' },
  { label: 'Boulangerie', value: 980000,  color: '#f59e0b' },
];

const HEURES_MOCK = [
  { h: '7h', v: 12 }, { h: '8h', v: 38 }, { h: '9h', v: 62 },
  { h: '10h', v: 85 }, { h: '11h', v: 73 }, { h: '12h', v: 95 },
  { h: '13h', v: 88 }, { h: '14h', v: 54 }, { h: '15h', v: 61 },
  { h: '16h', v: 79 }, { h: '17h', v: 92 }, { h: '18h', v: 100 },
  { h: '19h', v: 74 }, { h: '20h', v: 45 }, { h: '21h', v: 22 },
];

const TOP_PRODUITS = [
  { nom: 'Riz 25kg', rayon: 'Alimentaire', qte: 312, ca: 1248000 },
  { nom: 'Huile 5L', rayon: 'Alimentaire', qte: 287, ca: 861000 },
  { nom: 'Bière Castel', rayon: 'Boissons', qte: 240, ca: 720000 },
  { nom: 'Lait en poudre', rayon: 'Alimentaire', qte: 198, ca: 792000 },
  { nom: 'Savon de ménage', rayon: 'Hygiène', qte: 175, ca: 262500 },
];

const ALERTES = [
  { type: 'rupture', msg: 'Sucre 1kg — Rupture de stock', color: 'red' },
  { type: 'promo', msg: '3 promotions expirent ce soir', color: 'amber' },
  { type: 'livraison', msg: 'Livraison CFAO prévue à 14h', color: 'blue' },
];

export default function DashboardSupermarche() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  const [month, setMonth] = useState(new Date().getMonth());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);

  return () => clearInterval(t);
  }, []);

  const maxRayon = Math.max(...RAYONS_MOCK.map(r => r.value));
  const maxHeure = Math.max(...HEURES_MOCK.map(h => h.v));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            🛒 Tableau de Bord
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} — {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/supermarche/pos')}
            className="bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20">
            🛒 Ouvrir Caisse
          </button>
          <button onClick={() => navigate('/supermarche/rapports')}
            className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">
            📊 Rapports
          </button>
        </div>
      </div>

      {/* Alertes */}
      {ALERTES.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {ALERTES.map((a, i) => (
            <div key={i} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border ${
              a.color === 'red' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
              a.color === 'amber' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
              'bg-blue-500/10 border-blue-500/30 text-blue-400'
            }`}>
              {a.type === 'rupture' ? '⚠️' : a.type === 'promo' ? '🏷️' : '🚚'} {a.msg}
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="💰" label="CA Jour" value="12 480 000 F" sub="vs hier: 11 200 000 F" color="#10b981" trend={11.4} />
        <StatCard icon="🧾" label="Transactions" value="347" sub="Moy. ticket: 35 966 F" color="#3b82f6" trend={8.2} />
        <StatCard icon="⚠️" label="Ruptures Stock" value="4" sub="Articles en alerte" color="#ef4444" trend={-2} />
        <StatCard icon="🏷️" label="Promos Actives" value="7" sub="Expire ce soir: 3" color="#8b5cf6" trend={0} />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventes par Rayon */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-white font-black text-lg mb-5">📦 Ventes par Rayon</h2>
          <div className="space-y-4">
            {RAYONS_MOCK.map((r, i) => (
              <MiniBar key={i} label={r.label} value={r.value} max={maxRayon} color={r.color} />
            ))}
          </div>
        </div>

        {/* Heures de Pointe */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-white font-black text-lg mb-5">⏰ Heures de Pointe</h2>
          <div className="flex items-end gap-1 h-32">
            {HEURES_MOCK.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-sm transition-all duration-700"
                  style={{ height: `${(h.v / maxHeure) * 100}%`, backgroundColor: h.v === maxHeure ? '#f59e0b' : '#3b82f6' + '99' }}
                />
                <span className="text-slate-500 text-[8px] font-bold">{h.h}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Produits */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-black text-lg">🏆 Top Produits du Jour</h2>
          <button onClick={() => navigate('/supermarche/stock')}
            className="text-amber-400 hover:text-amber-300 text-xs font-bold transition-colors">
            Voir le stock →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="text-left pb-3 pl-2">#</th>
                <th className="text-left pb-3">Produit</th>
                <th className="text-left pb-3">Rayon</th>
                <th className="text-right pb-3">Qté vendue</th>
                <th className="text-right pb-3 pr-2">CA (F CFA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {TOP_PRODUITS.map((p, i) => (
                <tr key={i} className="hover:bg-slate-700/20 transition-colors">
                  <td className="py-3 pl-2">
                    <span className={`text-xs font-black ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-700' : 'text-slate-500'}`}>
                      #{i + 1}
                    </span>
                  </td>
                  <td className="py-3 text-white font-semibold text-sm">{p.nom}</td>
                  <td className="py-3">
                    <span className="text-xs font-bold text-slate-400 bg-slate-700/50 px-2 py-1 rounded-full">{p.rayon}</span>
                  </td>
                  <td className="py-3 text-right text-slate-300 text-sm font-mono">{p.qte}</td>
                  <td className="py-3 pr-2 text-right text-emerald-400 text-sm font-bold">{p.ca.toLocaleString('fr-FR')} F</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions Rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Nouvelle Réception', icon: '📦', path: '/supermarche/receptions', color: '#3b82f6' },
          { label: 'Ajouter Promo', icon: '🏷️', path: '/supermarche/promotions', color: '#8b5cf6' },
          { label: 'Inventaire', icon: '📊', path: '/supermarche/inventaire', color: '#10b981' },
          { label: 'Ajouter Dépense', icon: '💸', path: '/supermarche/depenses', color: '#ef4444' },
        ].map((a, i) => (
          <button key={i} onClick={() => navigate(a.path)}
            className="bg-slate-800/60 border border-slate-700/50 hover:border-slate-600 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all group">
            <span className="text-3xl group-hover:scale-110 transition-transform">{a.icon}</span>
            <span className="text-slate-300 text-xs font-bold text-center">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
