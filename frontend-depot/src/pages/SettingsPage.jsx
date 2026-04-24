import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { Upload, Save, CheckCircle, RefreshCcw, Building2 } from 'lucide-react';

export default function SettingsPage() {
  const { tenantId } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    nomEntreprise: '',
    slogan: '',
    adresse: '',
    telephone: '',
    messageFin: '',
    logo: null
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Charger la config actuelle
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant-config', tenantId],
    queryFn: async () => {
      const res = await api.get(`/tenants/${tenantId}`);
      return res.data;
    },
    enabled: !!tenantId
  });

  useEffect(() => {
    if (tenant) {
      setForm({
        nomEntreprise: tenant.nomEntreprise || '',
        slogan: tenant.slogan || '',
        adresse: tenant.adresse || '',
        telephone: tenant.telephone || '',
        messageFin: tenant.messageFin || "Merci de votre fidélité !",
        logo: tenant.logo || null
      });
    }
  }, [tenant]);

  // Fonction de redimensionnement de l'image (Canvas)
  const resizeImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 250; // Largement suffisant pour un reçu
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // On exporte en qualité moyenne pour limiter le poids Base64
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
      setForm({ ...form, logo: resized });
    }
  };

  const updateMutation = useMutation({
    mutationFn: (payload) => api.patch(`/tenants/${tenantId}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['tenant-config', tenantId]);
      setSuccess(true);
      setError('');
      setTimeout(() => setSuccess(false), 5000);
    },
    onError: (err) => {
      console.error('Erreur sauvegarde:', err);
      setError(err.response?.data?.message || "Erreur serveur : Vérifiez que le backend est lancé.");
      setSuccess(false);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  if (isLoading) return <div className="p-10 text-slate-500 animate-pulse">Chargement des paramètres...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center text-indigo-400">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Configuration Entreprise</h1>
          <p className="text-slate-400 text-sm">Personnalisez vos reçus et les infos de votre établissement</p>
        </div>
        <div className="flex-1" />
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('nav-change', { detail: 'depots' }))}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-400 hover:text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
        >
          <Building2 size={16} /> Gérer les Dépôts
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulaire */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-slate-800/50 border border-slate-700 rounded-3xl p-8 space-y-6 shadow-xl backdrop-blur-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Nom de l'entreprise *</label>
                <input
                  id="settings-company-name"
                  required
                  value={form.nomEntreprise}
                  onChange={(e) => setForm({ ...form, nomEntreprise: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-all font-bold"
                />
              </div>
              
              <div>
                <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Slogan</label>
                <input
                  id="settings-slogan"
                  value={form.slogan}
                  onChange={(e) => setForm({ ...form, slogan: e.target.value })}
                  placeholder="Ex: Le meilleur rapport qualité prix"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Téléphone</label>
                <input
                  id="settings-phone"
                  value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Adresse Physique</label>
                <input
                  value={form.adresse}
                  onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                  placeholder="Douala, Akwa face Ã ..."
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                />
              </div>

              <div className="md:col-span-2 border-t border-slate-700 pt-6 mt-2">
                <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Message de fin (Reçu)</label>
                <textarea
                  value={form.messageFin}
                  onChange={(e) => setForm({ ...form, messageFin: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                />
                <p className="text-slate-600 text-[10px] mt-2 italic">Ce message apparaîtra tout en bas de vos tickets de caisse.</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-6 border-t border-slate-700/50 mt-6">
              <div className="flex-1">
                {updateMutation.isLoading && (
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm bg-indigo-500/10 px-4 py-2.5 rounded-xl border border-indigo-500/20 animate-pulse">
                    <RefreshCcw className="w-4 h-4 animate-spin" />
                    Enregistrement en cours...
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm bg-emerald-500/20 px-4 py-3 rounded-xl border border-emerald-500/40 shadow-xl shadow-emerald-500/10 transition-all scale-105 origin-left">
                    <CheckCircle className="w-5 h-5" />
                    SUCCÃˆS : Vos modifications ont été appliquées !
                  </div>
                )}
                {error && (
                  <div className="flex items-center gap-2 text-red-400 font-bold text-sm bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/20 shadow-xl shadow-red-500/10">
                    <Building2 className="w-5 h-5" />
                    {error}
                  </div>
                )}
              </div>
              <button
                id="settings-submit-btn"
                type="submit"
                disabled={updateMutation.isLoading}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
              >
                {updateMutation.isLoading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                SAUVEGARDER
              </button>
            </div>
          </form>
        </div>

        {/* Logo Setup & Preview */}
        <div className="space-y-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-400" />
              Logo de l'entreprise
            </h3>
            
            <div className="relative group aspect-square rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center overflow-hidden transition-all hover:border-indigo-500/50">
              {form.logo ? (
                <img src={form.logo} alt="Logo" className="w-full h-full object-contain p-4 filter grayscale contrast-125" />
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
              {form.logo && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                  <span className="text-white text-xs font-bold bg-indigo-600 px-3 py-1.5 rounded-lg shadow-lg">Changer le logo</span>
                </div>
              )}
            </div>
            
            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-3 bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-xl">
                <div className="w-1 h-1 bg-indigo-400 rounded-full mt-2 shrink-0" />
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  Le logo sera automatiquement optimisé pour une impression nette sur ticket thermique (Noir & Blanc contrasté).
                </p>
              </div>
              <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl">
                <div className="w-1 h-1 bg-amber-400 rounded-full mt-2 shrink-0" />
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  Taille conseillée : format carré ou rectangulaire horizontal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




