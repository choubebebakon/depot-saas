import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import NumberInput from '../../../shared/components/forms/NumberInput';
import { useNotif } from '../../../context/NotifContext';

const cleanParams = (params) => Object.fromEntries(
  Object.entries(params).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
);

const inventaireLigneSchema = z.object({
  articleId: z.string().min(1, 'Article requis'),
  designation: z.string().optional(),
  stockTheorique: z.coerce.number().min(0, 'Stock théorique invalide'),
  stockComptage: z.coerce.number().min(0, 'Stock comptage invalide'),
});

const inventaireSchema = z.object({
  depotId: z.string().min(1, 'Dépôt requis'),
  rayonId: z.string().optional(),
  lignes: z.array(inventaireLigneSchema).min(1, 'Chargez au moins un article'),
});

export default function InventaireForm({ isOpen, onClose, onSuccess, metier = 'supermarche', depotId }) {
  const queryClient = useQueryClient();
  const notif = useNotif();
  const [loadingData, setLoadingData] = useState(false);
  const [rayons, setRayons] = useState([]);

  const { control, handleSubmit, watch, reset, setValue, register, formState: { errors } } = useForm({
    resolver: zodResolver(inventaireSchema),
    defaultValues: {
      depotId: depotId || '',
      rayonId: '',
      lignes: [],
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lignes' });
  const watchedDepotId = watch('depotId');
  const watchedRayonId = watch('rayonId');

  useState(() => {
    api.get(`/${metier}/rayons`).then(r => setRayons(r.data?.data || r.data || [])).catch(() => {});
  }, [metier]);

  const prefix = `/${metier}`;

  const mutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post(`${prefix}/stock/inventaire`, {
        depotId: data.depotId,
        lignes: data.lignes.map(l => ({ articleId: l.articleId, stockPhysique: l.stockComptage })),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supermarche-inventaire'] });
      queryClient.invalidateQueries({ queryKey: ['supermarche-articles'] });
      queryClient.invalidateQueries({ queryKey: ['supermarche-dashboard'] });
      notif.success('Inventaire enregistré avec succès');
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Erreur lors de l\'enregistrement', 'Échec');
    }
  });

  const chargerStock = async () => {
    if (!watchedDepotId) return;
    setLoadingData(true);
    try {
      const params = { depotId: watchedDepotId };
      if (watchedRayonId) params.rayonId = watchedRayonId;
      const r = await api.get(`${prefix}/stock`, { params: cleanParams(params) });
      const articles = r.data?.data || r.data || [];
      setValue('lignes', articles.map(a => ({
        articleId: a.id,
        designation: a.designation,
        stockTheorique: Number(a.quantite) || 0,
        stockComptage: Number(a.quantite) || 0,
      })));
    } catch {} finally { setLoadingData(false); }
  };

  const onSubmit = (data) => {
    mutation.mutate(data);
  };


  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit(onSubmit)} title="📋 Inventaire" loading={mutation.isPending} size="xl" submitIcon="✅" submitLabel="Valider l'inventaire">
      {errors.depotId && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.depotId.message}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Rayon" name="rayonId" type="select" value={watchedRayonId} onChange={(e) => setValue('rayonId', e.target.value)} options={rayons.map(r => ({ value: r.id, label: r.nom }))} />
        <div className="flex items-end">
          <button type="button" onClick={chargerStock} disabled={loadingData}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-colors">
            {loadingData ? '⏳...' : '📥 Charger le stock'}
          </button>
        </div>
      </div>
      {fields.length > 0 && (
        <div className="max-h-64 overflow-y-auto space-y-2 mt-4">
          {fields.map((field, idx) => {
            const l = watch(`lignes.${idx}`);
            const ecart = l.stockComptage - l.stockTheorique;
            return (
              <div key={field.id} className="flex items-center gap-3 p-2 bg-slate-800/60 rounded-xl">
                <span className="flex-1 text-white text-sm font-medium">{l.designation}</span>
                <span className="text-slate-400 text-xs w-16 text-right">{l.stockTheorique}</span>
                <input type="number" {...register(`lignes.${idx}.stockComptage`)}
                  className="w-20 bg-slate-700 border border-slate-600 text-white rounded-lg px-2 py-1.5 text-sm text-center font-mono" />
                <span className={`text-xs font-bold w-16 text-right ${ecart > 0 ? 'text-emerald-400' : ecart < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                  {ecart > 0 ? '+' : ''}{ecart}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {errors.lignes && <p className="text-red-400 text-xs mt-2">⚠️ {errors.lignes.message}</p>}
    </FormModal>
  );
}
