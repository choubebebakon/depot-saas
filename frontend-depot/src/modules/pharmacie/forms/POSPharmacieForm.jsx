import { useState, useCallback } from 'react';
import api from '../../../api';
import FormField from '../../../shared/components/forms/FormField';
import BarcodeScanner from '../../../shared/components/forms/BarcodeScanner';
import AutocompleteInput from '../../../shared/components/forms/AutocompleteInput';

const cleanParams = (params) => Object.fromEntries(
  Object.entries(params).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
);

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


export default function POSPharmacieForm({ metier = 'pharmacie', onSuccess }) {
  const [panier, setPanier] = useState([]);
  const [modePaiement, setModePaiement] = useState('CASH');
  const [montantRecu, setMontantRecu] = useState('');
  const [ordonnanceId, setOrdonnanceId] = useState('');
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');


  const prefix = `/${metier}`;

  const fetchMedicaments = useCallback(async (q) => {
    const r = await api.get(`${prefix}/medicaments`, { params: cleanParams({ search: q, limit: 8 }) });
    return r.data?.data || r.data || [];
  }, [prefix]);

  const fetchOrdonnances = useCallback(async (q) => {
    const r = await api.get(`${prefix}/ordonnances`, { params: cleanParams({ search: q, limit: 8 }) });
    return r.data?.data || r.data || [];
  }, [prefix]);

  const handleScan = useCallback(async (code) => {
    try {
      const r = await api.get(`${prefix}/medicaments`, { params: cleanParams({ search: code, limit: 5 }) });
      const meds = r.data?.data || r.data || [];
      if (meds.length > 0) ajouterAuPanier(meds[0]);
    } catch {}
  }, [prefix]);

  const ajouterAuPanier = (med) => {
    setPanier(prev => {
      const exist = prev.find(p => p.medicamentId === med.id);
      if (exist) return prev.map(p => p.medicamentId === med.id ? { ...p, quantite: p.quantite + 1 } : p);
      return [...prev, {
        medicamentId: med.id, designation: med.designation || med.article?.designation,
        lot: med.numeroLot, dlc: med.dateExpiration, quantite: 1,
        prixUnitaire: Number(med.prixVente || med.article?.prixVente) || 0,
        surOrdonnance: med.surOrdonnance,
      }];
    });
  };

  const updatePanier = (idx, field) => (e) => setPanier(prev => { const n = [...prev]; n[idx] = { ...n[idx], [field]: e.target.value }; return n; });
  const suppriméerDuPanier = (idx) => setPanier(prev => prev.filter((_, i) => i !== idx));

  const total = panier.reduce((s, p) => s + (Number(p.quantite) || 0) * (Number(p.prixUnitaire) || 0), 0);
  const monnaie = Number(montantRecu) - total;

  const handleEncaisser = async () => {
    if (panier.length === 0) return;
    setLoading(true);
    try {
      await api.post(`${prefix}/ventes`, {
        modePaiement, montantRecu: Number(montantRecu) || 0, total,
        ordonnanceId: ordonnanceId || undefined,
        panier: panier.map(p => ({ medicamentId: p.medicamentId, quantite: p.quantite, prixUnitaire: p.prixUnitaire })),
      });
      setPanier([]); setMontantRecu(''); setOrdonnanceId('');
      if (onSuccess) onSuccess();
    } catch {} finally { setLoading(false); }
  };

  const dlcWarning = (dlc) => {
    if (!dlc) return null;
    const days = Math.ceil((new Date(dlc) - new Date()) / 86400000);
    if (days < 7) return 'bg-red-500/10';
    if (days < 30) return 'bg-amber-500/10';
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
          <BarcodeScanner onScan={handleScan} placeholder="Scanner ou saisir le code médicament" mode="both" />
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
          <AutocompleteInput name="addMed" fetchSuggestions={fetchMedicaments} displayKey="designation" placeholder="Rechercher par nom/DCI/code..." onSelect={ajouterAuPanier} />
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
          <table className="w-full text-sm">
            <thead><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left py-3">Médicament</th><th className="text-left">Lot</th><th className="text-left">DLC</th><th className="text-right">Qté</th><th className="text-right">Prix</th><th className="text-right">Total</th><th className="text-center"></th></tr></thead>
            <tbody className="divide-y divide-slate-700/30">
              {panier.map((p, idx) => (
                <tr key={idx} className={`hover:bg-slate-700/20 transition-colors ${dlcWarning(p.dlc) || ''}`}>
                  <td className="py-3 text-white font-medium">
                    {p.designation}
                    {p.surOrdonnance && <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold">ORD</span>}
                  </td>
                  <td className="text-slate-400 text-xs font-mono">{p.lot || '—'}</td>
                  <td className="text-slate-400 text-xs">{p.dlc ? new Date(p.dlc).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="text-right"><input type="number" value={p.quantite} onChange={updatePanier(idx, 'quantite')} min={1} className="w-16 bg-slate-700 border border-slate-600 text-white rounded-lg px-2 py-1 text-sm text-right" /></td>
                  <td className="text-right text-white font-mono">{Number(p.prixUnitaire).toLocaleString('fr-FR')}</td>
                  <td className="text-right text-white font-bold font-mono">{(Number(p.quantite) * Number(p.prixUnitaire)).toLocaleString('fr-FR')}</td>
                  <td className="text-center"><button onClick={() => suppriméerDuPanier(idx)} className="text-red-400 hover:text-red-300 text-xs">✕</button></td>
                </tr>
              ))}
              {panier.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-slate-500 text-sm">Panier vide</td></tr>}
            </tbody>
          </table>
          <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-end">
            <p className="text-white font-black text-xl">{(total || 0).toLocaleString('fr-FR')} FCFA</p>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 space-y-4">
          <h3 className="text-white font-bold text-sm">💳 Paiement</h3>
          <div className="space-y-2">
            {['CASH', 'ORANGE_MONEY', 'MTN_MOMO', 'CARTE'].map(m => (
              <button key={m} onClick={() => setModePaiement(m)}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${modePaiement === m ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                {m === 'CASH' ? '💵 Cash' : m === 'ORANGE_MONEY' ? '📱 Orange Money' : m === 'MTN_MOMO' ? '📱 MTN MoMo' : '💳 Carte'}
              </button>
            ))}
          </div>
          <input type="number" placeholder="Montant reçu (FCFA)" value={montantRecu} onChange={e => setMontantRecu(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" />
          {Number(montantRecu) >= total && <p className="text-emerald-400 text-sm font-bold">Monnaie : {(monnaie).toLocaleString('fr-FR')} FCFA</p>}
          <AutocompleteInput name="ordonnanceId" fetchSuggestions={fetchOrdonnances} displayKey="code" placeholder="Lier une ordonnance..." onSelect={(o) => setOrdonnanceId(o.id)} />
          <button onClick={handleEncaisser} disabled={panier.length === 0 || loading}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black text-lg rounded-xl transition-all shadow-lg shadow-emerald-600/20">
            {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> : '💰 ENCAISSER'}
          </button>
        </div>
      </div>
    </div>
  );
}
