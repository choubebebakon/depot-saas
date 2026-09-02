import { useEffect, useCallback, useMemo, memo } from 'react';
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
  quantite: z.coerce.number().int().min(1, 'Minimum 1'),
  prixUnitaire: z.coerce.number().finite().min(0, 'Prix invalide'),
  remise: z.coerce.number().finite().min(0).max(100).default(0),
  codeBarres: z.string().optional(),
});

const venteSchema = z.object({
  clientId: z.string().optional().or(z.literal('')),
  depotId: z.string().optional().or(z.literal('')),
  modePaiement: z.enum(['CASH', 'ORANGE_MONEY', 'MTN_MOMO']),
  remiseGlobale: z.coerce.number().finite().min(0).max(100).default(0),
  montantRecu: z.coerce.number().finite().min(0).optional().or(z.literal('')),
  panier: z.array(panierLigneSchema).min(1, 'Ajoutez au moins un article au panier'),
});

const LignePanier = memo(function LignePanier({ field, idx, control, panierItem, onRemove }) {
  const ligneSousTotal = useMemo(
    () => Number(panierItem?.quantite || 0) * Number(panierItem?.prixUnitaire || 0) * (1 - (Number(panierItem?.remise) || 0) / 100),
    [panierItem?.quantite, panierItem?.prixUnitaire, panierItem?.remise],
  );

  return (
    <tr className="hover:bg-slate-700/20">
      <td className="py-3 text-slate-400 font-mono text-xs">{panierItem?.codeBarres || '—'}</td>
      <td className="text-white font-medium">{panierItem?.designation}</td>
      <td className="text-right">
        <Controller name={`panier.${idx}.quantite`} control={control} render={({ field: inputField }) => (
          <input type="number" {...inputField} min={1} step={1} className="w-16 bg-slate-700 border border-slate-600 text-white rounded-lg px-2 py-1 text-sm text-right" />
        )} />
      </td>
      <td className="text-right text-white font-mono">{Number(panierItem?.prixUnitaire || 0).toLocaleString('fr-FR')}</td>
      <td className="text-right">
        <Controller name={`panier.${idx}.remise`} control={control} render={({ field: inputField }) => (
          <input type="number" {...inputField} min={0} max={100} step="0.01" className="w-16 bg-slate-700 border border-slate-600 text-white rounded-lg px-2 py-1 text-sm text-right" placeholder="%" />
        )} />
      </td>
      <td className="text-right text-white font-bold font-mono">{ligneSousTotal.toLocaleString('fr-FR')}</td>
      <td className="text-center"><button type="button" onClick={() => onRemove(idx)} className="text-red-400 hover:text-red-300 text-xs" aria-label={`Supprimer ${panierItem?.designation || 'l’article'}`}>✕</button></td>
    </tr>
  );
});

export default function POSSupermarcheForm({ onSuccess, depotId }) {
  const queryClient = useQueryClient();
  const notif = useNotif();

  const { control, handleSubmit, watch, reset, getValues, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(venteSchema),
    defaultValues: { clientId: '', depotId: depotId || '', modePaiement: 'CASH', remiseGlobale: 0, montantRecu: '', panier: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'panier' });
  const modePaiement = watch('modePaiement');
  const remiseGlobale = Number(watch('remiseGlobale')) || 0;
  const montantRecu = Number(watch('montantRecu')) || 0;
  const panierWatch = watch('panier') || [];

  useEffect(() => {
    reset({ clientId: '', depotId: depotId || '', modePaiement: 'CASH', remiseGlobale: 0, montantRecu: '', panier: [] });
  }, [depotId, reset]);

  const fetchClients = useCallback(async (q) => {
    const r = await supermarcheApi.getClients({ search: q, limit: 8 });
    return r.data?.data || r.data || [];
  }, []);

  const fetchArticles = useCallback(async (q) => {
    const r = await supermarcheApi.getArticles({ search: q, limit: 8 });
    return r.data?.data || r.data || [];
  }, []);

  const ajouterAuPanier = useCallback((article) => {
    if (!article?.id) return;
    const current = getValues('panier') || [];
    const idx = current.findIndex((p) => p.articleId === article.id);
    if (idx >= 0) {
      setValue(`panier.${idx}.quantite`, Number(current[idx].quantite) + 1, { shouldDirty: true, shouldValidate: true });
    } else {
      append({ articleId: article.id, designation: article.designation, codeBarres: article.codeBarres, quantite: 1, prixUnitaire: Number(article.prixVente) || 0, remise: 0 });
    }
  }, [getValues, setValue, append]);

  const handleScan = useCallback(async (code) => {
    const normalized = String(code || '').trim();
    if (!normalized) return;
    try {
      const r = await supermarcheApi.scanCodeBarres(normalized);
      if (r.data?.article) {
        ajouterAuPanier(r.data.article);
        return;
      }
      notif.error(`Article introuvable pour le code ${normalized}`);
    } catch {
      notif.error('Impossible de lire ce code-barres. Vérifiez la connexion.');
    }
  }, [ajouterAuPanier, notif]);

  const handleRemoveLigne = useCallback((idx) => remove(idx), [remove]);
  const handleViderPanier = useCallback(() => setValue('panier', []), [setValue]);

  const { sousTotal, remiseMontant, total, monnaie } = useMemo(() => {
    const st = panierWatch.reduce((sum, p) => sum + Number(p.quantite || 0) * Number(p.prixUnitaire || 0) * (1 - (Number(p.remise) || 0) / 100), 0);
    const rm = st * (remiseGlobale / 100);
    const t = Math.max(0, st - rm);
    return { sousTotal: st, remiseMontant: rm, total: t, monnaie: Math.max(0, montantRecu - t) };
  }, [panierWatch, remiseGlobale, montantRecu]);

  const montantInsuffisant = modePaiement === 'CASH' && montantRecu < total;

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (!depotId) throw new Error('Aucun dépôt actif sélectionné.');
      if (data.modePaiement === 'CASH' && Number(data.montantRecu) < total) throw new Error('Le montant reçu est inférieur au total de la vente.');

      const payload = {
        id: crypto.randomUUID(),
        depotId,
        clientId: data.clientId || undefined,
        modePaiement: data.modePaiement,
        remiseGlobale: Number(data.remiseGlobale) || 0,
        panier: data.panier.map((p) => ({ articleId: p.articleId, quantite: Number(p.quantite), prix: Number(p.prixUnitaire), remise: Number(p.remise) || 0 })),
        total: Math.round(total * 100) / 100,
      };

      const r = await supermarcheApi.createVente(payload);
      return r.data;
    },
    onSuccess: (createdVente) => {
      queryClient.invalidateQueries({ queryKey: ['supermarche-ventes'] });
      queryClient.invalidateQueries({ queryKey: ['supermarche-articles'] });
      queryClient.invalidateQueries({ queryKey: ['supermarche-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['supermarche-caisse-resume'] });
      notif.success(`Vente${createdVente?.reference ? ` #${createdVente.reference}` : ''} enregistrée avec succès`);
      reset({ clientId: '', depotId: depotId || '', modePaiement: 'CASH', remiseGlobale: 0, montantRecu: '', panier: [] });
      onSuccess?.(createdVente);
    },
    onError: (err) => {
      const responseMessage = err.response?.data?.message;
      const msg = Array.isArray(responseMessage) ? responseMessage.join(', ') : responseMessage || err.message || 'Erreur lors de la vente';
      notif.error(msg);
    },
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        {errors.panier?.message && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.panier.message}</div>}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
          <BarcodeScanner onScan={handleScan} autoFocus placeholder="Scanner ou saisir le code-barres" />
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
          <AutocompleteInput name="addArticle" fetchSuggestions={fetchArticles} displayKey="designation" placeholder="Rechercher un article..." onSelect={ajouterAuPanier} />
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left py-3">Code</th><th className="text-left">Désignation</th><th className="text-right">Qté</th><th className="text-right">Prix</th><th className="text-right">Remise</th><th className="text-right">Total</th><th /></tr></thead>
            <tbody className="divide-y divide-slate-700/30">
              {fields.map((field, idx) => <LignePanier key={field.id} field={field} idx={idx} control={control} panierItem={panierWatch[idx]} onRemove={handleRemoveLigne} />)}
              {fields.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-slate-500 text-sm">Panier vide — Scannez ou recherchez un article</td></tr>}
            </tbody>
          </table>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50 gap-4">
            <button type="button" onClick={handleViderPanier} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold rounded-lg">Vider</button>
            <div className="text-right"><p className="text-slate-400 text-xs">Sous-total</p><p className="text-white font-bold font-mono">{sousTotal.toLocaleString('fr-FR')} FCFA</p>{remiseGlobale > 0 && <p className="text-amber-400 text-xs">Remise -{remiseMontant.toLocaleString('fr-FR')} FCFA</p>}<p className="text-white font-black text-xl mt-1">{total.toLocaleString('fr-FR')} FCFA</p></div>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 space-y-4">
          <h3 className="text-white font-bold text-sm">Paiement</h3>
          <Controller name="modePaiement" control={control} render={({ field }) => (
            <div className="space-y-2">
              {[['CASH', 'Cash'], ['ORANGE_MONEY', 'Orange Money'], ['MTN_MOMO', 'MTN MoMo']].map(([value, label]) => (
                <button key={value} type="button" onClick={() => field.onChange(value)} className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${field.value === value ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>{label}</button>
              ))}
            </div>
          )} />
          {modePaiement === 'CASH' && <Controller name="montantRecu" control={control} render={({ field }) => (
            <div><input type="number" {...field} min={0} step={1} placeholder="Montant reçu (FCFA)" className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" />{montantInsuffisant && <p className="text-red-400 text-xs mt-1">Montant insuffisant : il manque {(total - montantRecu).toLocaleString('fr-FR')} FCFA.</p>}</div>
          )} />}
          {modePaiement === 'CASH' && montantRecu >= total && total > 0 && <p className="text-emerald-400 text-sm font-bold">Monnaie : {monnaie.toLocaleString('fr-FR')} FCFA</p>}
          <Controller name="remiseGlobale" control={control} render={({ field }) => <input type="number" {...field} min={0} max={100} step="0.01" placeholder="Remise globale %" className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" />} />
          <Controller name="clientId" control={control} render={({ field }) => <AutocompleteInput name="clientId" value={field.value} onChange={field.onChange} fetchSuggestions={fetchClients} displayKey="nom" placeholder="Associer client (optionnel)" onSelect={(client) => field.onChange(client?.id || '')} />} />
          <button type="button" onClick={handleSubmit((data) => mutation.mutate(data))} disabled={fields.length === 0 || mutation.isPending || total <= 0 || montantInsuffisant || !depotId} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black text-lg rounded-xl transition-all shadow-lg shadow-emerald-600/20">
            {mutation.isPending ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> : 'ENCAISSER'}
          </button>
        </div>
      </div>
    </div>
  );
}
