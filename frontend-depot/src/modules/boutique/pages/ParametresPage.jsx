import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import { useAuth } from '../../../contexts/AuthContext';
import { boutiqueApi } from '../services/boutiqueApi';
import { Upload, Settings, Store, Save } from 'lucide-react';
import api from '../../../api/axios';

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
  const [logoBase64, setLogoBase64] = useState(null);

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

  const { data: tenant } = useQuery({
    queryKey: ['tenant-config', tenantId],
    queryFn: async () => {
      const res = await api.get(`/tenants/${tenantId}`);
      return res.data;
    },
    enabled: !!tenantId
  });

  useEffect(() => {
    if (parametres) {
      reset({
        nom: tenant?.nomEntreprise || parametres.nom || '',
        email: parametres.email || '',
        telephone: tenant?.telephone || parametres.telephone || '',
        adresse: tenant?.adresse || parametres.adresse || '',
        devise: parametres.devise || 'FCFA',
        tva: parametres.tva || '',
      });
    }
    if (tenant?.logo) {
      setLogoBase64(tenant.logo);
    }
  }, [parametres, tenant, reset]);

  const resizeImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 250;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const dataUrl = canvas.toDataURL('image/png', 0.7);
          resolve(dataUrl);
        };
      };
    });
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const resized = await resizeImage(file);
      setLogoBase64(resized);
    }
  };

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (tenantId) {
        await api.patch(`/tenants/${tenantId}`, {
          nomEntreprise: data.nom,
          adresse: data.adresse,
          telephone: data.telephone,
          logo: logoBase64
        });
      }
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
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><Settings className="w-6 h-6" /> Paramètres</h1>
        <p className="text-slate-400 text-sm mt-1">Configuration de la boutique</p>
      </div>
      <form onSubmit={handleSubmit(mutation.mutate)} className="space-y-6">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 space-y-5">
          <h3 className="text-white font-bold text-lg flex items-center gap-2"><Store className="w-5 h-5" /> Informations générales</h3>
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
        
        {/* Logo Setup & Preview */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 space-y-5">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Upload className="w-4 h-4 text-cyan-400" />
            Logo de l'entreprise
          </h3>

          <div className="relative group w-48 h-48 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center overflow-hidden transition-all hover:border-cyan-500/50 mx-auto">
            {logoBase64 ? (
              <img src={logoBase64} alt="Logo" className="w-full h-full object-contain p-4 filter grayscale contrast-125" />
            ) : (
              <div className="text-center px-6">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6 text-slate-500" />
                </div>
                <p className="text-slate-500 text-xs font-semibold leading-relaxed">Cliquez pour ajouter un logo</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            {logoBase64 && (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                <span className="text-white text-xs font-bold bg-cyan-600 px-3 py-1.5 rounded-lg shadow-lg">Changer le logo</span>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-3 max-w-lg mx-auto">
            <div className="flex items-start gap-3 bg-cyan-500/5 border border-cyan-500/10 p-4 rounded-xl">
              <div className="w-1 h-1 bg-cyan-400 rounded-full mt-2 shrink-0" />
              <p className="text-slate-400 text-[10px] leading-relaxed">
                Le logo sera automatiquement optimisé pour une impression nette sur ticket thermique (Noir & Blanc contrasté).
              </p>
            </div>
          </div>
        </div>

        <button type="submit" disabled={mutation.isPending} className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold py-4 rounded-xl text-lg">
          {mutation.isPending ? 'Enregistrement...' : 'Enregistrer les paramètres'}
        </button>
      </form>
    </div>
  );
}
