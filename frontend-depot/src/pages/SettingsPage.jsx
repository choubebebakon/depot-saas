import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { Upload, Save, CheckCircle, RefreshCcw, Building2 } from 'lucide-react';

const MAX_LOGO_BYTES = 350_000;
const MAX_LOGO_DATA_URL_LENGTH = 500_000;
const ACCEPTED_LOGO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

export default function SettingsPage() {
  const { tenantId } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    nomEntreprise: '',
    slogan: '',
    adresse: '',
    telephone: '',
    messageFin: '',
    logo: null,
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['tenant-config', tenantId],
    queryFn: async () => {
      const res = await api.get('/tenant/info');
      return res.data;
    },
    enabled: !!tenantId,
  });

  const tenant = data?.tenant ?? data;

  useEffect(() => {
    if (!tenant) return;

    setForm({
      nomEntreprise: tenant.nomEntreprise || '',
      slogan: tenant.slogan || '',
      adresse: tenant.adresse || '',
      telephone: tenant.telephone || '',
      messageFin: tenant.messageFin || 'Merci de votre fidélité !',
      logo: tenant.logo || null,
    });
  }, [tenant]);

  const resizeImage = (file) => {
    return new Promise((resolve, reject) => {
      if (!ACCEPTED_LOGO_TYPES.has(file.type)) {
        reject(new Error('Format refusé. Utilisez PNG, JPEG ou WebP.'));
        return;
      }
      if (file.size > MAX_LOGO_BYTES) {
        reject(new Error('Le logo ne doit pas dépasser 350 Ko.'));
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Impossible de lire le logo.'));
      reader.onload = (event) => {
        const img = new Image();
        img.onerror = () => reject(new Error('Image invalide.'));
        img.onload = () => {
          if (!img.width || !img.height || img.width > 5000 || img.height > 5000) {
            reject(new Error('Dimensions du logo non valides.'));
            return;
          }

          const maxDimension = 600;
          const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Impossible de préparer le logo.'));
            return;
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/png', 0.8);

          if (dataUrl.length > MAX_LOGO_DATA_URL_LENGTH) {
            reject(new Error('Le logo optimisé reste trop volumineux.'));
            return;
          }

          resolve(dataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleLogoChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const resized = await resizeImage(file);
      setForm((current) => ({ ...current, logo: resized }));
      setError('');
      setSuccess(false);
    } catch (err) {
      setError(err.message || 'Logo invalide.');
      setSuccess(false);
    }
  };

  const successTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  const updateMutation = useMutation({
    mutationFn: (payload) => api.patch(`/tenant/${tenantId}`, payload),
    onSuccess: (response) => {
      queryClient.setQueryData(['tenant-config', tenantId], (current) => ({
        ...(current || {}),
        tenant: response.data,
      }));
      queryClient.invalidateQueries({ queryKey: ['tenant-config', tenantId] });
      setSuccess(true);
      setError('');
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => setSuccess(false), 5000);
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Impossible d’enregistrer les paramètres.');
      setSuccess(false);
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    const payload = {
      nomEntreprise: form.nomEntreprise.trim(),
      slogan: form.slogan.trim(),
      adresse: form.adresse.trim(),
      telephone: form.telephone.trim(),
      messageFin: form.messageFin.trim(),
    };

    if (form.logo) payload.logo = form.logo;

    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return <div className="p-10 text-slate-500 animate-pulse">Chargement des paramètres...</div>;
  }

  if (isError || !tenant) {
    return (
      <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-slate-800/50 border border-slate-700">
        <h1 className="text-xl font-black text-white">Paramètres indisponibles</h1>
        <p className="mt-2 text-sm text-slate-400">Impossible de charger la configuration de votre entreprise.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-3 rounded-xl flex items-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" /> Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center text-indigo-400">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Configuration Entreprise</h1>
          <p className="text-slate-400 text-sm">Personnalisez les informations de votre établissement et vos reçus.</p>
        </div>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('nav-change', { detail: 'depots' }))}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-400 hover:text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
        >
          <Building2 size={16} /> Gérer les dépôts
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-slate-800/50 border border-slate-700 rounded-3xl p-8 space-y-6 shadow-xl backdrop-blur-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="settings-company-name" className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Nom de l'entreprise *</label>
                <input
                  id="settings-company-name"
                  required
                  maxLength={160}
                  value={form.nomEntreprise}
                  onChange={(e) => setForm({ ...form, nomEntreprise: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-all font-bold"
                />
              </div>

              <div>
                <label htmlFor="settings-slogan" className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Slogan</label>
                <input
                  id="settings-slogan"
                  maxLength={160}
                  value={form.slogan}
                  onChange={(e) => setForm({ ...form, slogan: e.target.value })}
                  placeholder="Ex. Le meilleur rapport qualité-prix"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                />
              </div>

              <div>
                <label htmlFor="settings-phone" className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Téléphone</label>
                <input
                  id="settings-phone"
                  maxLength={40}
                  value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="settings-address" className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Adresse physique</label>
                <input
                  id="settings-address"
                  maxLength={255}
                  value={form.adresse}
                  onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                  placeholder="Douala, Akwa..."
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                />
              </div>

              <div className="md:col-span-2 border-t border-slate-700 pt-6 mt-2">
                <label htmlFor="settings-receipt-message" className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Message de fin (reçu)</label>
                <textarea
                  id="settings-receipt-message"
                  maxLength={500}
                  value={form.messageFin}
                  onChange={(e) => setForm({ ...form, messageFin: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                />
                <p className="text-slate-600 text-[10px] mt-2 italic">Ce message apparaîtra en bas de vos tickets de caisse.</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-6 border-t border-slate-700/50 mt-6">
              <div className="flex-1 min-w-0">
                {updateMutation.isPending && (
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm bg-indigo-500/10 px-4 py-2.5 rounded-xl border border-indigo-500/20">
                    <RefreshCcw className="w-4 h-4 animate-spin" /> Enregistrement en cours...
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm bg-emerald-500/20 px-4 py-3 rounded-xl border border-emerald-500/40">
                    <CheckCircle className="w-5 h-5" /> Modifications enregistrées.
                  </div>
                )}
                {error && (
                  <div className="text-red-400 font-bold text-sm bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/20">
                    {error}
                  </div>
                )}
              </div>
              <button
                id="settings-submit-btn"
                type="submit"
                disabled={updateMutation.isPending || !form.nomEntreprise.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
              >
                {updateMutation.isPending ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                SAUVEGARDER
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-400" /> Logo de l'entreprise
            </h3>

            <div className="relative group aspect-square rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center overflow-hidden transition-all hover:border-indigo-500/50">
              {form.logo ? (
                <img src={form.logo} alt="Logo de l'entreprise" className="w-full h-full object-contain p-4" />
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
                accept="image/png,image/jpeg,image/webp"
                onChange={handleLogoChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                aria-label="Choisir un logo"
              />
              {form.logo && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all pointer-events-none">
                  <span className="text-white text-xs font-bold bg-indigo-600 px-3 py-1.5 rounded-lg shadow-lg">Changer le logo</span>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-3 bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-xl">
                <div className="w-1 h-1 bg-indigo-400 rounded-full mt-2 shrink-0" />
                <p className="text-slate-400 text-[10px] leading-relaxed">PNG, JPEG ou WebP. Le logo est optimisé avant envoi et limité pour éviter de stocker des fichiers excessifs en base.</p>
              </div>
              <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl">
                <div className="w-1 h-1 bg-amber-400 rounded-full mt-2 shrink-0" />
                <p className="text-slate-400 text-[10px] leading-relaxed">Pour un ticket thermique, privilégiez un logo simple et contrasté.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
