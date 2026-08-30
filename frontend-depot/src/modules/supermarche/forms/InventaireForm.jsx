import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import { useNotif } from '../../../context/NotifContext';

const inventaireLigneSchema = z.object({
  articleId: z.string().min(1, 'Article requis'),
  designation: z.string().optional(),
  stockTheorique: z.coerce.number().min(0, 'Stock théorique invalide'),
  stockComptage: z.coerce.number().min(0, 'Stock comptage invalide'),
});

const inventaireSchema = z.object({
  depotId: z.string().min(1, 'Dépôt actif requis'),
  rayonId: z.string().optional(),
  lignes: z.array(inventaireLigneSchema).min(1, 'Chargez au moins un article'),
});

export default function InventaireForm({ isOpen, onClose, onSuccess, metier = 'supermarche', depotId }) {
  const queryClient = useQueryClient();
  const notif = useNotif();
  const [loadingData, setLoadingData] = useState(false);
  const [rayons, setRayons] = useState([]);
  const prefix = `/${metier}`;

  const { control, handleSubmit, watch, reset, setValue, register, formState: { errors } } = useForm({
    resolver: zodResolver(inventaireSchema),
    defaultValues: { depotId: depotId || '', rayonId: '', lignes: [] },
  });

  const { fields } = useFieldArray({ control, name: 'lignes' });
  const watchedDepotId = watch('depotId');
  const watchedRayonId = watch('rayonId');

  useEffect(() => {
    reset({ depotId: depotId || '', rayonId: '', lignes: [] });
  }, [depotId, isOpen, reset]);

  useEffect(() => {
    if (!isOpen || !depotId) return;
    api.get(`${prefix}/rayons`, { params: { depotId } })
      .then(r => setRayons(r.data?.data || r.data || []))
      .catch(() => setRayons([]));
  }, [isOpen, depotId, prefix]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (!depotId || data.depotId !== depotId) throw new Error('Le dépôt actif a changé. Rechargez le formulaire.');
      const res = await api.post(`${prefix}/stock/inventaire`, {
        depotId,
        lignes: data.lignes.map(l => ({ articleId: l.articleId, stockPhysique: Number(l.stockComptage) })),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supermarche-inventaire'] });
      queryClient.invalidateQueries({ queryKey: ['supermarche-articles'] });
      queryClient.invalidateQueries({ queryKey: ['supermarche-stock'] });
      queryClient.invalidateQueries({ queryKey: ['supermarche-dashboard'] });
      notif.success('Inventaire enregistré avec succès');
      onSuccess?.();
      onClose();
    },
    onError: (err) => notif.error(err.response?.data?.message || err.message || "Erreur lors de l'enregistrement", 'Échec'),
  });

  const chargerStock = async () => {
    if (!depotId) return notif.error('Aucun dépôt actif sélectionné');
    setLoadingData(true);
    try {
      const params = { depotId };
      if (watchedRayonId) params.rayonId = watchedRayonId;
      const r = await api.get(`${prefix}/stock`, { params });
      const raw = r.data?.data || r.data || [];
      const articles = Array.isArray(raw) ? raw : [];
      setValue('depotId', depotId, { shouldValidate: true });
      setValue('lignes', articles.map(a => ({
        articleId: a.id,
        designation: a.designation,
        stockTheorique: Number(a.quantite) || 0,
        stockComptage: Number(a.quantite) || 0,
      })), { shouldValidate: true });
    } catch (err) {
      notif.error(err.response?.data?.message || 'Impossible de charger le stock');
      setValue('lignes', []);
    } finally { setLoadingData(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit(data => mutation.mutate(data))} title="Inventaire" loading={mutation.isPending} size="xl" submitLabel="Valider l'inventaire">
      {errors.depotId && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.depotId.message}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Dépôt actif" name="depotId" type="text" value={depotId || ''} disabled readOnly />
        <FormField label="Rayon" name="rayonId" type="select" value={watchedRayonId} onChange={e => setValue('rayonId', e.target.value)} options={[{ value: '', label: 'Tous les rayons' }, ...rayons.map(r => ({ value: r.id, label: r.nom }))]} />
        <div className="flex items-end"><button type="button" onClick={chargerStock} disabled={loadingData || !depotId} className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold rounded-xl text-sm">{loadingData ? 'Chargement...' : 'Charger le stock'}</button></div>
      </div>
      {fields.length > 0 && <div className="max-h-64 overflow-y-auto space-y-2 mt-4">{fields.map((field, idx) => { const l = watch(`lignes.${idx}`); const ecart = Number(l.stockComptage) - Number(l.stockTheorique); return <div key={field.id} className="flex items-center gap-3 p-2 bg-slate-800/60 rounded-xl"><span className="flex-1 text-white text-sm font-medium">{l.designation}</span><span className="text-slate-400 text-xs w-16 text-right">{l.stockTheorique}</span><input type="number" min="0" {...register(`lignes.${idx}.stockComptage`)} className="w-20 bg-slate-700 border border-slate-600 text-white rounded-lg px-2 py-1.5 text-sm text-center font-mono"/><span className={`text-xs font-bold w-16 text-right ${ecart > 0 ? 'text-emerald-400' : ecart < 0 ? 'text-red-400' : 'text-slate-500'}`}>{ecart > 0 ? '+' : ''}{ecart}</span></div>; })}</div>}
      {errors.lignes && <p className="text-red-400 text-xs mt-2">{errors.lignes.message}</p>}
    </FormModal>
  );
}
