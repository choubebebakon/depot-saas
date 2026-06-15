import { useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import { boutiqueApi } from '../services/boutiqueApi';
import FormField from '../../../shared/components/forms/FormField';
import BarcodeScanner from '../../../shared/components/forms/BarcodeScanner';
import AutocompleteInput from '../../../shared/components/forms/AutocompleteInput';

const panierLigneSchema = z.object({
  articleId: z.string().min(1, 'Article requis'),
  designation: z.string().optional(),
  codeBarres: z.string().optional(),
  quantite: z.coerce.number().min(1, 'Minimum 1'),
  prixUnitaire: z.coerce.number().min(0, 'Prix invalide'),
  remise: z.coerce.number().min(0).max(100).default(0),
});

const venteSchema = z.object({
  clientId: z.string().optional().or(z.literal('')),
  depotId: z.string().optional().or(z.literal('')),
  modePaiement: z.enum(['CASH', 'ORANGE_MONEY', 'MTN_MOMO', 'CARTE']),
  remiseGlobale: z.coerce.number().min(0).max(100).default(0),
  montantRecu: z.coerce.number().min(0).optional().or(z.literal('')),
  panier: z.array(panierLigneSchema).min(1, 'Ajoutez au moins un article au panier'),
});

export default function VenteBoutiqueForm({ metier = 'boutique', onSuccess, depotId }) {
  const queryClient = useQueryClient();
  const notif = useNotif();

  const { control, handleSubmit, watch, reset, getValues, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(venteSchema),
    defaultValues: {
      clientId: '',
      depotId: depotId || '',
      modePaiement: 'CASH',
      remiseGlobale: 0,
      montantRecu: '',
      panier: [],
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'panier' });

  const modePaiement = watch('modePaiement');
  const remiseGlobale = Number(watch('remiseGlobale')) || 0;
  const montantRecu = Number(watch('montantRecu')) || 0;
  const panier = watch('panier') || [];

  useEffect(() => {
    reset({
      clientId: '',
      depotId: depotId || '',
      modePaiement: 'CASH',
      remiseGlobale: 0,
      montantRecu: '',
      panier: [],
    });
  }, [depotId, reset]);

  const fetchClients = async (q) => {
    const r = await boutiqueApi.getClients({ search: q, limit: 8 });
    return r.data?.data || r.data || [];
  };

  const fetchArticles = async (q) => {
    const r = await boutiqueApi.getArticles({ search: q, limit: 8 });
    return r.data?.data || r.data || [];
  };

  const ajouterAuPanier = (article) => {
    const current = getValues('panier') || [];
    const idx = current.findIndex(p => p.articleId === article.id);
    if (idx >= 0) {
      setValue(`panier.${idx}.quantite`, Number(current[idx].quantite) + 1);
    } else {
      append({
        articleId: article.id,
        designation: article.designation,
        codeBarres: article.codeBarres,
        quantite: 1,
        prixUnitaire: Number(article.prixVente) || 0,
        remise: 0,
      });
    }
  };

  const sousTotal = panier.reduce((sum, p) => sum + (p.quantite * p.prixUnitaire * (1 - (p.remise || 0) / 100)), 0);
  const remiseMontant = sousTotal * (remiseGlobale / 100);
  const total = sousTotal - remiseMontant;
  const monnaie = montantRecu - total;

  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        depotId: data.depotId || depotId,
        remiseGlobale,
        panier: data.panier.map(p => ({
          articleId: p.articleId,
          quantite: p.quantite,
          prix: p.prixUnitaire,
          remise: p.remise,
        })),
        total,
      };
      const r = await boutiqueApi.createVente(payload);
      return r.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boutique-ventes'] });
      queryClient.invalidateQueries({ queryKey: ['boutique-stock'] });
      queryClient.invalidateQueries({ queryKey: ['boutique-dashboard'] });
      notif.success('Vente enregistrée avec succès');
      reset({
        clientId: '',
        depotId: depotId || '',
        modePaiement: 'CASH',
        remiseGlobale: 0,
        montantRecu: '',
        panier: [],
      });
      onSuccess?.();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Erreur lors de la vente';
      notif.error(msg);
    }
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        {errors.panier?.message && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.panier.message}</div>
        )}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Ajouter un article</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="article"
              control={control}
              render={({ field }) => (
                <AutocompleteInput
                  label="Article"
                  placeholder="Rechercher un article..."
                  fetchOptions={fetchArticles}
                  onSelect={(article) => ajouterAuPanier(article)}
                  displayValue={(article) => article.designation}
                />
              )}
            />
            <BarcodeScanner onScan={(code) => {
              fetchArticles(code).then(articles => {
                if (articles.length > 0) ajouterAuPanier(articles[0]);
              });
            }} />
          </div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Panier ({panier.length})</h3>
          {panier.length === 0 ? (
            <p className="text-slate-400 text-center py-8">Le panier est vide</p>
          ) : (
            <div className="space-y-2">
              {panier.map((item, index) => (
                <div key={item.id || index} className="flex items-center justify-between bg-slate-700/30 rounded-lg p-3">
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">{item.designation}</p>
                    <p className="text-slate-400 text-xs">{item.quantite} × {item.prixUnitaire.toLocaleString('fr-FR')} F</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-mono font-bold">{(item.quantite * item.prixUnitaire * (1 - (item.remise || 0) / 100)).toLocaleString('fr-FR')} F</p>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="space-y-4">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Informations</h3>
          <div className="space-y-4">
            <Controller
              name="clientId"
              control={control}
              render={({ field }) => (
                <AutocompleteInput
                  label="Client"
                  placeholder="Rechercher un client..."
                  fetchOptions={fetchClients}
                  displayValue={(client) => client.nom}
                />
              )}
            />
            <FormField
              label="Mode de paiement"
              name="modePaiement"
              control={control}
              type="select"
              options={[
                { value: 'CASH', label: 'Espèces' },
                { value: 'ORANGE_MONEY', label: 'Orange Money' },
                { value: 'MTN_MOMO', label: 'MTN Mobile Money' },
                { value: 'CARTE', label: 'Carte bancaire' },
              ]}
            />
            <FormField
              label="Remise globale (%)"
              name="remiseGlobale"
              type="number"
              control={control}
              min="0"
              max="100"
            />
          </div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Récapitulatif</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-slate-300">
              <span>Sous-total</span>
              <span className="font-mono">{sousTotal.toLocaleString('fr-FR')} F</span>
            </div>
            {remiseMontant > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Remise</span>
                <span className="font-mono">-{remiseMontant.toLocaleString('fr-FR')} F</span>
              </div>
            )}
            <div className="flex justify-between text-white font-bold text-lg border-t border-slate-700 pt-2">
              <span>Total</span>
              <span className="font-mono text-cyan-400">{total.toLocaleString('fr-FR')} F</span>
            </div>
            {modePaiement === 'CASH' && (
              <>
                <FormField
                  label="Montant reçu"
                  name="montantRecu"
                  type="number"
                  control={control}
                  min="0"
                />
                {montantRecu > 0 && (
                  <div className="flex justify-between text-green-400 font-bold">
                    <span>Monnaie à rendre</span>
                    <span className="font-mono">{monnaie.toLocaleString('fr-FR')} F</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleSubmit(mutation.mutate)}
          disabled={mutation.isPending || panier.length === 0}
          className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-cyan-600/20"
        >
          {mutation.isPending ? 'Traitement...' : 'Valider la vente'}
        </button>
      </div>
    </div>
  );
}
