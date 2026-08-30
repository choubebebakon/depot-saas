import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import { useAuth } from '../../../contexts/AuthContext';
import { boutiqueApi } from '../services/boutiqueApi';
import { Upload, Settings, Store } from 'lucide-react';
import api from '../../../api/axios';

const parametresSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  devise: z.enum(['FCFA', 'EUR', 'USD']),
  tva: z.coerce.number().min(0).optional(),
  nomCaissiere: z.string().optional(),
});

export default function ParametresPage() {
  const queryClient = useQueryClient();
  const notif = useNotif();
  const { tenantId } = useAuth();
  const [logoBase64, setLogoBase64] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(parametresSchema),
    defaultValues: { nom: '', email: '', telephone: '', adresse: '', devise: 'FCFA', tva: '', nomCaissiere: '' }
  });

  const { data: parametres } = useQuery({
    queryKey: ['boutique-parametres', tenantId],
    queryFn: async () => (await boutiqueApi.getParametres()).data,
    enabled: !!tenantId,
  });

  const { data: tenant } = useQuery({
    queryKey: ['tenant-config', tenantId],
    queryFn: async () => (await api.get(`/tenants/${tenantId}`)).data,
    enabled: !!tenantId,
  });

  useEffect(() => {
    if (parametres || tenant) {
      reset({
        nom: tenant?.nomEntreprise || parametres?.nom || '',
        email: parametres?.email || '',
        telephone: tenant?.telephone || parametres?.telephone || '',
        adresse: tenant?.adresse || parametres?.adresse || '',
        devise: parametres?.devise || 'FCFA',
        tva: parametres?.tva ?? '',
        nomCaissiere: parametres?.nomCaissiere || '',
      });
    }
    if (tenant?.logo) setLogoBase64(tenant.logo);
  }, [parametres, tenant, reset]);

  const resizeImage = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Impossible de lire le fichier'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Image invalide'));
      img.onload = () => {
        const max = 250;
        const scale = Math.min(1, max / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png', 0.7));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { setLogoBase64(await resizeImage(file)); }
    catch { notif.error('Impossible de charger ce logo'); }
  };

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (!tenantId) throw new Error('Tenant non identifié');
      await api.patch(`/tenants/${tenantId}`, {
        nomEntreprise: data.nom,
        adresse: data.adresse,
        telephone: data.telephone,
        logo: logoBase64,
      });
      return boutiqueApi.updateParametres(data);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['boutique-parametres', tenantId] }),
        queryClient.invalidateQueries({ queryKey: ['tenant-config', tenantId] }),
      ]);
      notif.success('Paramètres enregistrés avec succès');
    },
    onError: (err) => notif.error(err.response?.data?.message || err.message || "Erreur lors de l'enregistrement"),
  });

  const inputClass = 'bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-full';

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8"><h1 className="text-2xl font-black text-white flex items-center gap-2"><Settings className="w-6 h-6" /> Paramètres</h1><p className="text-slate-400 text-sm mt-1">Configuration de la boutique</p></div>
      <form onSubmit={handleSubmit(mutation.mutate)} className="space-y-6">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 space-y-5">
          <h3 className="text-white font-bold text-lg flex items-center gap-2"><Store className="w-5 h-5" /> Informations générales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Nom de la boutique</label><input {...register('nom')} className={inputClass} placeholder="Ma Boutique" />{errors.nom && <p className="text-red-400 text-xs mt-1">{errors.nom.message}</p>}</div>
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Email</label><input type="email" {...register('email')} className={inputClass} placeholder="contact@boutique.com" />{errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}</div>
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Téléphone</label><input {...register('telephone')} className={inputClass} /></div>
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Devise</label><select {...register('devise')} className={inputClass}><option value="FCFA">FCFA</option><option value="EUR">EUR</option><option value="USD">USD</option></select></div>
          </div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Adresse</label><input {...register('adresse')} className={inputClass} /></div>
          <div className="md:w-1/2"><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">TVA (%)</label><input type="number" min="0" {...register('tva')} className={inputClass} />{errors.tva && <p className="text-red-400 text-xs mt-1">{errors.tva.message}</p>}</div>
          <div className="md:w-1/2"><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Nom de la caissière</label><input {...register('nomCaissiere')} className={inputClass} /></div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 space-y-5"><h3 className="text-white font-bold text-lg flex items-center gap-2"><Upload className="w-4 h-4 text-cyan-400" /> Logo de l'entreprise</h3><div className="relative group w-48 h-48 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden mx-auto">{logoBase64 ? <img src={logoBase64} alt="Logo" className="w-full h-full object-contain p-4" /> : <p className="text-slate-500 text-xs">Cliquez pour ajouter un logo</p>}<input type="file" accept="image/*" onChange={handleLogoChange} className="absolute inset-0 opacity-0 cursor-pointer" /></div><p className="text-slate-400 text-[10px] leading-relaxed">Le logo est enregistré côté serveur avec la configuration du tenant.</p></div>
        <button type="submit" disabled={mutation.isPending || !tenantId} className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold py-4 rounded-xl text-lg">{mutation.isPending ? 'Enregistrement...' : 'Enregistrer les paramètres'}</button>
      </form>
    </div>
  );
}
