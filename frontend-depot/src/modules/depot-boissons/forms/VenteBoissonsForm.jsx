import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api';
import { useNotif } from '../../../context/NotifContext';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import AutocompleteInput from '../../../shared/components/forms/AutocompleteInput';
import NumberInput from '../../../shared/components/forms/NumberInput';

export default function VenteBoissonsForm({ isOpen, onClose, onSuccess, edit, metier = 'depot', depotId }) {
  const queryClient = useQueryClient();
  const notif = useNotif();
  const [panier, setPanier] = useState([]);
  const [localErrors, setLocalErrors] = useState({});

  const { control, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      clientId: '',
      depotId: depotId || '',
      modePaiement: 'CASH',
      remiseGlobale: 0,
      montantCash: '',
      montantOM: '',
      montantMoMo: '',
    }
  });

  const modePaiement = watch('modePaiement');
  const remiseGlobale = Number(watch('remiseGlobale')) || 0;

  useEffect(() => {
    setPanier([]);
    reset({
      clientId: '',
      depotId: depotId || '',
      modePaiement: 'CASH',
      remiseGlobale: 0,
      montantCash: '',
      montantOM: '',
      montantMoMo: '',
    });
    setLocalErrors({});
  }, [isOpen, depotId, reset]);

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
    next[idx] = { ...next[idx], [field]: Number(e.target.value) || 0 };
    setPanier(next);
  };

  const suppriméerDuPanier = (idx) => setPanier(panier.filter((_, i) => i !== idx));

  const sousTotal = panier.reduce((sum, p) => sum + (p.quantite * p.prixUnitaire * (1 - (p.remise || 0) / 100)), 0);
  const remiseMontant = sousTotal * (remiseGlobale / 100);
  const total = sousTotal - remiseMontant;

  const isMixte = modePaiement === 'MIXTE';

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (panier.length === 0) {
        throw new Error('Ajoutez au moins un article au panier');
      }
      const payload = {
        ...data,
        remiseGlobale,
        panier: panier.map(p => ({
          articleId: p.articleId,
          quantite: p.quantite,
          prixUnitaire: p.prixUnitaire,
          remise: p.remise
        })),
        total,
      };
      const r = await api.post(`${prefix}/ventes`, payload);
      return r.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-ventes'] });
      queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] });
      notif.success('Vente enregistrée avec succès');
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Erreur lors de la vente';
      setLocalErrors({ general: msg });
      notif.error(msg);
    }
  });

  const onSubmit = (data) => {
    setLocalErrors({});
    mutation.mutate(data);
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit(onSubmit)} title={edit ? '✏️ Modifier vente' : '💰 Nouvelle vente'} loading={mutation.isPending} size="xl" submitIcon="💵" submitLabel="Encaisser">
      {localErrors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{localErrors.general}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Controller
          name="clientId"
          control={control}
          render={({ field }) => (
            <AutocompleteInput
              label="Client"
              name="clientId"
              value={field.value}
              onChange={field.onChange}
              fetchSuggestions={fetchClients}
              placeholder="Client (optionnel)"
            />
          )}
        />

        <Controller
          name="modePaiement"
          control={control}
          render={({ field }) => (
            <FormField
              label="Mode de paiement"
              name="modePaiement"
              type="radio"
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: 'CASH', label: '💵 Cash' },
                { value: 'ORANGE_MONEY', label: '📱 Orange Money' },
                { value: 'MTN_MOMO', label: '📱 MTN MoMo' },
                { value: 'MIXTE', label: '🔀 Mixte' },
              ]}
            />
          )}
        />
      </div>

      <div className="border-t border-slate-700/50 pt-4 mb-4">
        <h4 className="text-white font-bold text-sm mb-3">🛒 Panier</h4>
        <AutocompleteInput name="addArticle" fetchSuggestions={fetchArticles} displayKey="designation" placeholder="Rechercher un article..." onSelect={ajouterAuPanier} />
      </div>

      {panier.length === 0 && <p className="text-red-400 text-xs mb-3">⚠️ Ajoutez au moins un article au panier</p>}

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
        {remiseGlobale > 0 && <div className="flex justify-between text-amber-400"><span>Remise ({remiseGlobale}%)</span><span>-{remiseMontant.toLocaleString('fr-FR')} FCFA</span></div>}
        <div className="flex justify-between text-white font-bold text-base pt-1 border-t border-slate-600"><span>Total</span><span>{(total || 0).toLocaleString('fr-FR')} FCFA</span></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <Controller
          name="remiseGlobale"
          control={control}
          render={({ field }) => (
            <FormField
              label="Remise globale"
              name="remiseGlobale"
              type="number"
              value={field.value}
              onChange={field.onChange}
              min={0}
              max={100}
              unit="%"
            />
          )}
        />
      </div>

      {isMixte && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 animate-fadeIn">
          <Controller
            name="montantCash"
            control={control}
            render={({ field }) => (
              <FormField
                label="Montant Cash"
                name="montantCash"
                type="number"
                value={field.value}
                onChange={field.onChange}
                min={0}
                unit="FCFA"
              />
            )}
          />
          <Controller
            name="montantOM"
            control={control}
            render={({ field }) => (
              <FormField
                label="Montant Orange Money"
                name="montantOM"
                type="number"
                value={field.value}
                onChange={field.onChange}
                min={0}
                unit="FCFA"
              />
            )}
          />
          <Controller
            name="montantMoMo"
            control={control}
            render={({ field }) => (
              <FormField
                label="Montant MTN MoMo"
                name="montantMoMo"
                type="number"
                value={field.value}
                onChange={field.onChange}
                min={0}
                unit="FCFA"
              />
            )}
          />
        </div>
      )}
    </FormModal>
  );
}
