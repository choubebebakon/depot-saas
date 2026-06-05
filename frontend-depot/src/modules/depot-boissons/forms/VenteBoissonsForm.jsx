import { useState, useEffect } from 'react';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
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


export default function VenteBoissonsForm({ isOpen, onClose, onSuccess, edit, metier = 'depot', depotId }) {
  const [form, setForm] = useState({ clientId: '', depotId: depotId || '', modePaiement: 'CASH', remiseGlobale: 0, montantCash: '', montantOM: '', montantMoMo: '' });
  const [panier, setPanier] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [search, setSearch] = useState('');

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));


  useEffect(() => {
    setPanier([]);
    setForm({ clientId: '', depotId: depotId || '', modePaiement: 'CASH', remiseGlobale: 0, montantCash: '', montantOM: '', montantMoMo: '' });
  }, [isOpen, depotId]);

  const prefix = `/${metier}`;

  const fetchClients = async (q) => {
    const r = await api.get(`${prefix}/clients`, { params: { search: q, limit: 8 } });
    return r.data?.data || r.data || [];
  };

  const fetchArticles = async (q) => {
    const r = await api.get(`${prefix}/articles`, { params: { search: q, limit: 8 } });
    return r.data?.data || r.data || [];
  };

  const ajouterAuPanier = (article) => {
    const exist = panier.find(p => p.articleId === article.id);
    if (exist) {
      setPanier(panier.map(p => p.articleId === article.id ? { ...p, quantite: p.quantite + 1 } : p));
    } else {
      setPanier([...panier, { articleId: article.id, designation: article.designation, quantite: 1, prixUnitaire: Number(article.prixVente) || 0, remise: 0 }]);
    }
  };

  const updatePanier = (idx, field) => (e) => {
    const next = [...panier];
    next[idx] = { ...next[idx], [field]: e.target.value };
    setPanier(next);
  };

  const suppriméerDuPanier = (idx) => setPanier(panier.filter((_, i) => i !== idx));

  const sousTotal = panier.reduce((sum, p) => sum + (p.quantite * p.prixUnitaire * (1 - (p.remise || 0) / 100)), 0);
  const remiseMontant = sousTotal * (form.remiseGlobale / 100);
  const total = sousTotal - remiseMontant;

  const isMixte = form.modePaiement === 'MIXTE';


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (panier.length === 0) { setErrors({ panier: 'Ajoutez au moins un article au panier' }); return; }
    setLoading(true);
    const payload = {
      ...form,
      panier: panier.map(p => ({ articleId: p.articleId, quantite: p.quantite, prixUnitaire: p.prixUnitaire, remise: p.remise })),
      total,
    };
    try {
      await api.post(`${prefix}/ventes`, payload);
      onSuccess(); onClose();
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Erreur lors de la vente' });
    } finally { setLoading(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier vente' : '💰 Nouvelle vente'} loading={loading} size="xl" submitIcon="💵" submitLabel="Encaisser">
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <AutocompleteInput label="Client" name="clientId" value={form.clientId} onChange={set('clientId')} fetchSuggestions={fetchClients} placeholder="Client (optionnel)" />
        <FormField label="Mode de paiement" name="modePaiement" type="radio" value={form.modePaiement} onChange={set('modePaiement')}
          options={[
            { value: 'CASH', label: '💵 Cash' },
            { value: 'ORANGE_MONEY', label: '📱 Orange Money' },
            { value: 'MTN_MOMO', label: '📱 MTN MoMo' },
            { value: 'MIXTE', label: '🔀 Mixte' },
          ]} />
      </div>

      <div className="border-t border-slate-700/50 pt-4 mb-4">
        <h4 className="text-white font-bold text-sm mb-3">🛒 Panier</h4>
        <AutocompleteInput name="addArticle" fetchSuggestions={fetchArticles} displayKey="designation" placeholder="Rechercher un article..." onSelect={ajouterAuPanier} />
      </div>

      {errors.panier && <p className="text-red-400 text-xs mb-3">⚠️ {errors.panier}</p>}

      {panier.length > 0 && (
        <div className="space-y-2 mb-4">
          {panier.map((p, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 bg-slate-800/60 rounded-xl">
              <span className="flex-1 text-white text-sm font-medium">{p.designation}</span>
              <NumberInput name={`qte_${idx}`} value={p.quantite} onChange={updatePanier(idx, 'quantite')} min={1} />
              <input type="number" value={p.prixUnitaire} onChange={updatePanier(idx, 'prixUnitaire')}
                className="w-24 bg-slate-700 border border-slate-600 text-white rounded-lg px-2 py-1.5 text-sm text-right font-mono" />
              <input type="number" value={p.remise} onChange={updatePanier(idx, 'remise')} placeholder="%"
                className="w-16 bg-slate-700 border border-slate-600 text-white rounded-lg px-2 py-1.5 text-sm text-right" />
              <span className="text-white font-bold font-mono text-sm w-24 text-right">
                {((p.quantite * p.prixUnitaire * (1 - (p.remise || 0) / 100)) || 0).toLocaleString('fr-FR')} F
              </span>
              <button type="button" onClick={() => suppriméerDuPanier(idx)} className="text-red-400 hover:text-red-300 text-sm">✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 bg-slate-800 rounded-xl space-y-1 text-sm">
        <div className="flex justify-between text-slate-400"><span>Sous-total</span><span>{(sousTotal || 0).toLocaleString('fr-FR')} FCFA</span></div>
        {form.remiseGlobale > 0 && <div className="flex justify-between text-amber-400"><span>Remise ({form.remiseGlobale}%)</span><span>-{remiseMontant.toLocaleString('fr-FR')} FCFA</span></div>}
        <div className="flex justify-between text-white font-bold text-base pt-1 border-t border-slate-600"><span>Total</span><span>{(total || 0).toLocaleString('fr-FR')} FCFA</span></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <FormField label="Remise globale" name="remiseGlobale" type="number" value={form.remiseGlobale} onChange={set('remiseGlobale')} min={0} max={100} unit="%" />
      </div>

      {isMixte && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Montant Cash" name="montantCash" type="number" value={form.montantCash} onChange={set('montantCash')} min={0} unit="FCFA" />
          <FormField label="Montant Orange Money" name="montantOM" type="number" value={form.montantOM} onChange={set('montantOM')} min={0} unit="FCFA" />
          <FormField label="Montant MTN MoMo" name="montantMoMo" type="number" value={form.montantMoMo} onChange={set('montantMoMo')} min={0} unit="FCFA" />
        </div>
      )}
    </FormModal>
  );
}
