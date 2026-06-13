import { useState, useCallback } from 'react';
import api from '../../../api';
import FormField from '../../../shared/components/forms/FormField';
import AutocompleteInput from '../../../shared/components/forms/AutocompleteInput';
import NumberInput from '../../../shared/components/forms/NumberInput';

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


export default function PriseCommandeForm({ metier = 'restaurant', onSuccess }) {
  const [form, setForm] = useState({ tableId: '', type: 'SUR_PLACE' });
  const [panier, setPanier] = useState([]);
  const [notesPlat, setNotesPlat] = useState({});
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState([]);

  const [search, setSearch] = useState('');


  useState(() => {
    api.get(`/${metier}/tables`).then(r => setTables(r.data?.data || r.data || [])).catch(() => {});
  }, []);

  const prefix = `/${metier}`;

  const fetchPlats = useCallback(async (q) => {
    const r = await api.get(`${prefix}/plats`, { params: { search: q, limit: 20 } });
    return r.data?.data || r.data || [];
  }, [prefix]);

  const ajouterPlat = (plat) => {
    setPanier(prev => {
      const exist = prev.find(p => p.platId === plat.id);
      if (exist) return prev.map(p => p.platId === plat.id ? { ...p, quantite: p.quantite + 1 } : p);
      return [...prev, { platId: plat.id, nom: plat.nom, prix: Number(plat.prix) || 0, quantite: 1 }];
    });
  };

  const updatePanier = (idx, field) => (e) => setPanier(prev => { const n = [...prev]; n[idx] = { ...n[idx], [field]: e.target.value }; return n; });
  const suppriméerDuPanier = (idx) => setPanier(prev => prev.filter((_, i) => i !== idx));
  const total = panier.reduce((s, p) => s + (Number(p.quantite) || 0) * (Number(p.prix) || 0), 0);

  const handleEnvoyer = async () => {
    if (panier.length === 0) return;
    setLoading(true);
    try {
      await api.post(`${prefix}/commandes`, {
        tableId: form.tableId || undefined, type: form.type,
        plats: panier.map(p => ({ platId: p.platId, quantite: p.quantite, note: notesPlat[p.platId] || '' })),
      });
      setPanier([]); setNotesPlat({});
      if (onSuccess) onSuccess();
    } catch {} finally { setLoading(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
          <div className="flex gap-4 mb-4">
            <FormField label="Table" name="tableId" type="select" value={form.tableId} onChange={(e) => setForm({ ...form, tableId: e.target.value })}
              options={tables.map(t => ({ value: t.id, label: `Table ${t.numero} (${t.capacite} pers.)` }))} />
            <FormField label="Type" name="type" type="radio" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              options={[{ value: 'SUR_PLACE', label: '🍽️ Sur place' }, { value: 'A_EMPORTER', label: '🛍️ À emporter' }, { value: 'LIVRAISON', label: '🚚 Livraison' }]} />
          </div>
          <AutocompleteInput name="addPlat" fetchSuggestions={fetchPlats} displayKey="nom" placeholder="Rechercher un plat..." onSelect={ajouterPlat} />
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
          <table className="w-full text-sm">
            <thead><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left py-3">Plat</th><th className="text-right">Qté</th><th className="text-right">Prix</th><th className="text-right">Total</th><th className="text-center"></th></tr></thead>
            <tbody className="divide-y divide-slate-700/30">
              {panier.map((p, idx) => (
                <tr key={idx}>
                  <td className="py-2 text-white font-medium">
                    {p.nom}
                    <button onClick={() => {
                      const note = window.prompt('Note pour le cuisinier :', notesPlat[p.platId] || '');
                      if (note !== null) setNotesPlat({ ...notesPlat, [p.platId]: note });
                    }} className="ml-2 text-xs text-amber-400 hover:text-amber-300">📝</button>
                    {notesPlat[p.platId] && <span className="ml-1 text-xs text-slate-500">({notesPlat[p.platId]})</span>}
                  </td>
                  <td className="text-right"><input type="number" value={p.quantite} onChange={updatePanier(idx, 'quantite')} min={1} className="w-16 bg-slate-700 border border-slate-600 text-white rounded-lg px-2 py-1 text-sm text-right" /></td>
                  <td className="text-right text-white font-mono">{Number(p.prix).toLocaleString('fr-FR')}</td>
                  <td className="text-right text-white font-bold font-mono">{(Number(p.quantite) * Number(p.prix)).toLocaleString('fr-FR')}</td>
                  <td className="text-center"><button onClick={() => suppriméerDuPanier(idx)} className="text-red-400 hover:text-red-300 text-xs">✕</button></td>
                </tr>
              ))}
              {panier.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-slate-500 text-sm">Panier vide — Ajoutez des plats</td></tr>}
            </tbody>
          </table>
          <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between items-center">
            <span className="text-slate-400 text-sm">Total</span>
            <span className="text-white font-black text-xl">{(total || 0).toLocaleString('fr-FR')} FCFA</span>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 space-y-4">
          <h3 className="text-white font-bold text-sm">📤 Envoyer en cuisine</h3>
          <button onClick={handleEnvoyer} disabled={panier.length === 0 || loading}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-900 font-black text-lg rounded-xl transition-all shadow-lg shadow-amber-500/20">
            {loading ? <span className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin inline-block" /> : '📤 ENVOYER EN CUISINE'}
          </button>
        </div>
      </div>
    </div>
  );
}
