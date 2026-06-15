import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import { boutiqueApi } from '../services/boutiqueApi';

const parametresSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  devise: z.enum(['FCFA', 'EUR', 'USD']),
  tva: z.coerce.number().min(0).optional(),
});

export default function ParametresPage() {
  const queryClient = useQueryClient();
  const notif = useNotif();

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(parametresSchema),
    defaultValues: {
      nom: '',
      email: '',
      telephone: '',
      adresse: '',
      devise: 'FCFA',
      tva: '',
    }
  });

  const { data: parametres } = useQuery({
    queryKey: ['boutique-parametres'],
    queryFn: async () => {
      const res = await boutiqueApi.getParametres();
      return res.data;
    },
  });

  useEffect(() => {
    if (parametres) {
      reset({
        nom: parametres.nom || '',
        email: parametres.email || '',
        telephone: parametres.telephone || '',
        adresse: parametres.adresse || '',
        devise: parametres.devise || 'FCFA',
        tva: parametres.tva || '',
      });
    }
  }, [parametres, reset]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      return boutiqueApi.updateParametres(data);
    },
    onSuccess: () => {
      notif.success('Paramètres enregistrés avec succès');
      queryClient.invalidateQueries({ queryKey: ['boutique-parametres'] });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Erreur lors de l\'enregistrement';
      notif.error(msg);
    }
  });

  const inputClass = 'bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-full';

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">⚙️ Paramètres</h1>
        <p className="text-slate-400 text-sm mt-1">Configuration de la boutique</p>
      </div>
      <form onSubmit={handleSubmit(mutation.mutate)} className="space-y-6">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 space-y-5">
          <h3 className="text-white font-bold text-lg">🏪 Informations générales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Nom de la boutique</label>
              <input {...control.register('nom')} className={inputClass} placeholder="Ma Boutique" />
              {errors.nom && <p className="text-red-400 text-xs mt-1">{errors.nom.message}</p>}
            </div>
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Email</label>
              <input type="email" {...control.register('email')} className={inputClass} placeholder="contact@boutique.com" />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Téléphone</label>
              <input {...control.register('telephone')} className={inputClass} placeholder="+225 01 02 03 04" />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Devise</label>
              <select {...control.register('devise')} className={inputClass}>
                <option value="FCFA">FCFA</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Adresse</label>
            <input {...control.register('adresse')} className={inputClass} placeholder="Abidjan, Cocody" />
          </div>
          <div className="md:w-1/2">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">TVA (%)</label>
            <input type="number" {...control.register('tva')} className={inputClass} placeholder="18" />
            {errors.tva && <p className="text-red-400 text-xs mt-1">{errors.tva.message}</p>}
          </div>
        </div>
        <button type="submit" disabled={mutation.isPending} className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold py-4 rounded-xl text-lg">
          {mutation.isPending ? '⏳ Enregistrement...' : '💾 Enregistrer les paramètres'}
        </button>
      </form>
    </div>
  );
}
