import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../api/axios';
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
  const { tenantId } = useAuth();
  const [logo, setLogo] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(parametresSchema),
    defaultValues: { nom: '', email: '', telephone: '', adresse: '', devise: 'FCFA', tva: '' },
  });

  const { data: parametres } = useQuery({
    queryKey: ['boutique-parametres'],
    queryFn: async () => (await boutiqueApi.getParametres()).data,
  });

  const { data: tenant } = useQuery({
    queryKey: ['tenant-config', tenantId],
    queryFn: async () => (await api.get(`/tenant/${tenantId}`)).data,
    enabled: !!tenantId,
  });

  useEffect(() => {
    if (parametres) {
      reset({
        nom: parametres.nom || parametres.nomEntreprise || '',
        email: parametres.email || '',
        telephone: parametres.telephone || '',
        adresse: parametres.adresse || '',
        devise: ['FCFA', 'EUR', 'USD'].includes(parametres.devise) ? parametres.devise : 'FCFA',
        tva: parametres.tva ?? '',
      });
    }
  }, [parametres, reset]);

  useEffect(() => {
    if (tenant?.logo) setLogo(tenant.logo);
  }, [tenant]);

  const mutation = useMutation({
    mutationFn: async (data) => boutiqueApi.updateParametres(data),
    onSuccess: () => {
      notif.success('Paramètres enregistrés avec succès');
      queryClient.invalidateQueries({ queryKey: ['boutique-parametres'] });
    },
    onError: (err) => notif.error(err.response?.data?.message || err.message || "Erreur lors de l'enregistrement"),
  });

  const handleLogoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !tenantId) return;
    if (!file.type.startsWith('image/')) {
      notif.error('Veuillez sélectionner une image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notif.error("L'image ne doit pas dépasser 5 Mo.");
      return;
    }

    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const upload = await api.post('/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const logoUrl = upload.data?.url;
      if (!logoUrl) throw new Error('Le serveur n’a pas retourné l’URL du logo.');
      const saved = await api.patch(`/tenant/${tenantId}`, { logo: logoUrl });
      setLogo(saved.data?.logo || logoUrl);
      queryClient.invalidateQueries({ queryKey: ['tenant-config', tenantId] });
      notif.success('Logo enregistré avec succès');
    } catch (err) {
      notif.error(err.response?.data?.message || err.message || 'Erreur lors de l’envoi du logo');
    } finally {
      setLogoUploading(false);
      event.target.value = '';
    }
  };

  const inputClass = 'bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-full focus:border-cyan-500';

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
              <input {...register('nom')} className={inputClass} placeholder="Ma Boutique" />
              {errors.nom && <p className="text-red-400 text-xs mt-1">{errors.nom.message}</p>}
            </div>
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Email</label>
              <input type="email" {...register('email')} className={inputClass} placeholder="contact@boutique.com" />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Téléphone</label>
              <input {...register('telephone')} className={inputClass} placeholder="+237 ..." />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Devise</label>
              <select {...register('devise')} className={inputClass}>
                <option value="FCFA">FCFA</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Adresse</label>
            <input {...register('adresse')} className={inputClass} placeholder="Douala, Akwa" />
          </div>
          <div className="md:w-1/2">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">TVA (%)</label>
            <input type="number" min="0" {...register('tva')} className={inputClass} placeholder="19.25" />
            {errors.tva && <p className="text-red-400 text-xs mt-1">{errors.tva.message}</p>}
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-white font-bold text-lg mb-4">🖼️ Logo</h3>
          <div className="flex items-center gap-5">
            <div className="w-28 h-28 rounded-xl border border-slate-700 bg-slate-900 flex items-center justify-center overflow-hidden">
              {logo ? <img src={logo} alt="Logo de la boutique" className="w-full h-full object-contain p-2" /> : <span className="text-slate-500 text-xs text-center px-2">Aucun logo</span>}
            </div>
            <div>
              <label className="inline-flex cursor-pointer bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm">
                {logoUploading ? 'Envoi...' : 'Choisir un logo'}
                <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleLogoChange} disabled={logoUploading} className="hidden" />
              </label>
              <p className="text-slate-500 text-xs mt-2">JPG, PNG, GIF ou WebP — 5 Mo maximum.</p>
            </div>
          </div>
        </div>

        <button type="submit" disabled={mutation.isPending} className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold py-4 rounded-xl text-lg">
          {mutation.isPending ? '⏳ Enregistrement...' : '💾 Enregistrer les paramètres'}
        </button>
      </form>
    </div>
  );
}
