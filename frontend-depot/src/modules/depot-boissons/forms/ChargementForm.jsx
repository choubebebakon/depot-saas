import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api';
import { useNotif } from '../../../context/NotifContext';
import FormModal from '../../../shared/components/forms/FormModal';
import AutocompleteInput from '../../../shared/components/forms/AutocompleteInput';
import NumberInput from '../../../shared/components/forms/NumberInput';

export default function ChargementForm({ isOpen, onClose, onSuccess, edit, metier = 'depot', tourneeId }) {
  const queryClient = useQueryClient();
  const notif = useNotif();
  const [lignes, setLignes] = useState([{ articleId: '', quantiteChargee: 1, designation: '', prix: 0 }]);
  const [localErrors, setLocalErrors] = useState({});

  const totalValeur = lignes.reduce((acc, i) => acc + (Number(i.quantiteChargee || 0) * Number(i.prix || 0)), 0);
  const prefix = `/${metier}`;

  const fetchArticles = async (q) => {
    const r = await api.get(`${prefix}/articles`, { params: { search: q, limit: 8 } });
    return r.data?.data || r.data || [];
  };

  const validate = () => {
    const errs = {};
    const articlesValides = lignes.filter(l => l.articleId && Number(l.quantiteChargee) > 0);
    if (articlesValides.length === 0) {
      errs.lignes = 'Ajoutez au moins un article avec une quantité valide';
    }
    return errs;
  };

  const updateLigneArticle = (idx, article) => {
    const next = [...lignes];
    next[idx] = {
      ...next[idx],
      articleId: article.id,
      designation: article.designation,
      prix: Number(article.prix) || Number(article.prixVente) || 0,
    };
    setLignes(next);
  };

  const updateLigneQty = (idx, val) => {
    const next = [...lignes];
    next[idx] = { ...next[idx], quantiteChargee: Number(val) || 1 };
    setLignes(next);
  };

  const ajouterLigne = () => setLignes([...lignes, { articleId: '', quantiteChargee: 1, designation: '', prix: 0 }]);
  const suppriméerLigne = (idx) => setLignes(lignes.filter((_, i) => i !== idx));

  const mutation = useMutation({
    mutationFn: async () => {
      const articlesPayload = lignes
        .filter(l => l.articleId && Number(l.quantiteChargee) > 0)
        .map(l => ({
          articleId: l.articleId,
          quantite: Number(l.quantiteChargee),
        }));

      // Fixed endpoint name to match NestJS router: /charger
      const r = await api.post(`${prefix}/tournees/${tourneeId}/charger`, { articles: articlesPayload });
      return r.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-tournees'] });
      queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] });
      notif.success('Chargement enregistré avec succès');
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Erreur lors du chargement';
      setLocalErrors({ general: msg });
      notif.error(msg);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    setLocalErrors(errs);
    if (Object.keys(errs).length > 0) return;
    mutation.mutate();
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier chargement' : '📦 Chargement de tournée'} loading={mutation.isPending} size="lg" submitIcon="💾" submitLabel="Enregistrer le chargement">
      {localErrors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl mb-4">{localErrors.general}</div>}
      <div className="space-y-3">
        {lignes.map((ligne, idx) => (
          <div key={idx} className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 font-bold uppercase">Article {idx + 1}</span>
              {lignes.length > 1 && (
                <button type="button" onClick={() => suppriméerLigne(idx)} className="text-red-400 hover:text-red-300 text-xs font-bold">✕ Supprimer</button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AutocompleteInput
                label="Article"
                name={`article_${idx}`}
                value={ligne.articleId}
                onSelect={(article) => updateLigneArticle(idx, article)}
                fetchSuggestions={fetchArticles}
                displayKey="designation"
                placeholder="Rechercher..."
                required
              />
              <NumberInput
                label="Quantité"
                name={`qte_${idx}`}
                value={ligne.quantiteChargee}
                onChange={(e) => updateLigneQty(idx, e.target.value)}
                min={1}
                required
              />
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={ajouterLigne}
        className="w-full py-2.5 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-white hover:border-slate-500 text-sm font-bold transition-all mt-3">
        + Ajouter un article
      </button>
      {localErrors.lignes && <p className="text-red-400 text-xs mt-2">⚠️ {localErrors.lignes}</p>}
      <div className="p-3 bg-slate-800 rounded-xl text-sm flex justify-between items-center mt-3">
        <span className="text-slate-400">Total valeur chargée</span>
        <span className="text-white font-bold font-mono">{totalValeur.toLocaleString('fr-FR')} FCFA</span>
      </div>
    </FormModal>
  );
}
