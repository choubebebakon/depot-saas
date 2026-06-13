import { useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import { supermarcheApi } from '../services/supermarcheApi';
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

export default function POSSupermarcheForm({ metier = 'supermarche', onSuccess, depotId }) {
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
    const r = await supermarcheApi.getClients({ search: q, limit: 8 });
    return r.data?.data || r.data || [];
  };

  const fetchArticles = async (q) => {
    const r = await supermarcheApi.getArticles({ search: q, limit: 8 });
    return r.data?.data || r.data || [];
  };

  const handleScan = async (code) => {
    try {
      const r = await supermarcheApi.scanCodeBarres(code);
      const article = r.data?.article;
      if (article) {
        ajouterAuPanier(article);
      }
    } catch (err) {
      notif.error('Code-barres non reconnu');
    }
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
      const r = await supermarcheApi.createVente(payload);
      return r.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supermarche-ventes'] });
      queryClient.invalidateQueries({ queryKey: ['supermarche-articles'] });
      queryClient.invalidateQueries({ queryKey: ['supermarche-dashboard'] });
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
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
          <BarcodeScanner onScan={handleScan} placeholder="Scanner ou saisir le code-barres" mode="both" />
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
          <AutocompleteInput name="addArticle" fetchSuggestions={fetchArticles} displayKey="designation" placeholder="Rechercher un article..." onSelect={ajouterAuPanier} />
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
          <table className="w-full text-sm">
            <thead><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left py-3">Code</th><th className="text-left">Désignation</th><th className="text-right">Qté</th><th className="text-right">Prix</th><th className="text-right">Remise</th><th className="text-right">Total</th><th className="text-center"> </th></tr></thead>
            <tbody className="divide-y divide-slate-700/30">
              {fields.map((field, idx) => (
                <tr key={field.id} className="hover:bg-slate-700/20">
                  <td className="py-3 text-slate-400 font-mono text-xs">{panier[idx]?.codeBarres || '—'}</td>
                  <td className="text-white font-medium">{panier[idx]?.designation}</td>
                  <td className="text-right">
                    <Controller
                      name={`panier.${idx}.quantite`}
                      control={control}
                      render={({ field: f }) => (
                        <input type="number" {...f} min={1} className="w-16 bg-slate-700 border border-slate-600 text-white rounded-lg px-2 py-1 text-sm text-right" />
                      )}
                    />
                  </td>
                  <td className="text-right text-white font-mono">{Number(panier[idx]?.prixUnitaire).toLocaleString('fr-FR')}</td>
                  <td className="text-right">
                    <Controller
                      name={`panier.${idx}.remise`}
                      control={control}
                      render={({ field: f }) => (
                        <input type="number" {...f} className="w-16 bg-slate-700 border border-slate-600 text-white rounded-lg px-2 py-1 text-sm text-right" placeholder="%" />
                      )}
                    />
                  </td>
                  <td className="text-right text-white font-bold font-mono">{(Number(panier[idx]?.quantite) * Number(panier[idx]?.prixUnitaire) * (1 - (Number(panier[idx]?.remise) || 0) / 100)).toLocaleString('fr-FR')}</td>
                  <td className="text-center"><button type="button" onClick={() => remove(idx)} className="text-red-400 hover:text-red-300 text-xs">✕</button></td>
                </tr>
              ))}
              {fields.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-slate-500 text-sm">Panier vide — Scannez ou recherchez un article</td></tr>}
            </tbody>
          </table>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50">
            <div className="flex gap-2">
              <button type="button" onClick={() => setValue('panier', [])} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold rounded-lg">🧹 Vider</button>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-xs">Sous-total</p>
              <p className="text-white font-bold font-mono">{sousTotal.toLocaleString('fr-FR')} FCFA</p>
              {remiseGlobale > 0 && <p className="text-amber-400 text-xs">Remise -{remiseMontant.toLocaleString('fr-FR')} FCFA</p>}
              <p className="text-white font-black text-xl mt-1">{(total || 0).toLocaleString('fr-FR')} FCFA</p>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 space-y-4">
          <h3 className="text-white font-bold text-sm">💳 Paiement</h3>
          <Controller
            name="modePaiement"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                {['CASH', 'ORANGE_MONEY', 'MTN_MOMO', 'CARTE'].map(m => (
                  <button key={m} type="button" onClick={() => field.onChange(m)}
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${field.value === m ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                    {m === 'CASH' ? '💵 Cash' : m === 'ORANGE_MONEY' ? '📱 Orange Money' : m === 'MTN_MOMO' ? '📱 MTN MoMo' : '💳 Carte'}
                  </button>
                ))}
              </div>
            )}
          />
          <Controller
            name="montantRecu"
            control={control}
            render={({ field }) => (
              <input type="number" {...field} placeholder="Montant reçu (FCFA)" className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" />
            )}
          />
          {montantRecu >= total && <p className="text-emerald-400 text-sm font-bold">Monnaie : {monnaie.toLocaleString('fr-FR')} FCFA</p>}
          <Controller
            name="remiseGlobale"
            control={control}
            render={({ field }) => (
              <input type="number" {...field} placeholder="Remise globale %" min={0} max={100} className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" />
            )}
          />
          <Controller
            name="clientId"
            control={control}
            render={({ field }) => (
              <AutocompleteInput name="clientId" value={field.value} onChange={field.onChange} fetchSuggestions={fetchClients} displayKey="nom" placeholder="Associer client (fidélité)" onSelect={(c) => field.onChange(c.id)} />
            )}
          />
          <button type="button" onClick={handleSubmit((data) => mutation.mutate(data))} disabled={fields.length === 0 || mutation.isPending}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black text-lg rounded-xl transition-all shadow-lg shadow-emerald-600/20">
            {mutation.isPending ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> : '💰 ENCAISSER'}
          </button>
        </div>
      </div>
    </div>
  );
}
