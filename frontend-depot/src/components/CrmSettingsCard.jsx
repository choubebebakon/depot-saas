import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Bot } from 'lucide-react';
import api from '../api/axios';
import { useNotif } from '../context/NotifContext';

/**
 * Carte « CRM Omnicanal » de l'écran Paramètres (contrainte n°12 : les règles
 * métier chiffrées n'existent QUE si le commerçant les saisit ici — le
 * backend n'a aucune valeur par défaut métier).
 */
const EMPTY_FORM = {
  loyaltyEnabled: false,
  pointsPerCurrencyUnit: '',
  pointsToCurrencyRatio: '',
  currency: 'FCFA',
  shrinkageEnabled: false,
  maxDeltaPercent: '',
  windowDays: '',
  sizeSystem: '',
  whatsapp: true,
  instagram: true,
  messenger: true,
};

/** Pré-remplit le formulaire depuis Tenant.parametres.crm (null = non configuré). */
function crmSettingsToForm(crm) {
  if (!crm) return { ...EMPTY_FORM };
  return {
    loyaltyEnabled: !!crm.loyalty?.enabled,
    pointsPerCurrencyUnit: crm.loyalty?.pointsPerCurrencyUnit ?? '',
    pointsToCurrencyRatio: crm.loyalty?.pointsToCurrencyRatio ?? '',
    currency: crm.loyalty?.currency || 'FCFA',
    shrinkageEnabled: !!crm.shrinkageAlert?.enabled,
    maxDeltaPercent: crm.shrinkageAlert?.maxDeltaPercent ?? '',
    windowDays: crm.shrinkageAlert?.windowDays ?? '',
    sizeSystem: crm.boutique?.sizeSystem || '',
    whatsapp: crm.channels?.whatsapp !== false,
    instagram: crm.channels?.instagram !== false,
    messenger: crm.channels?.messenger !== false,
  };
}

/** Valide la saisie : message utilisateur clair, aucune donnée absurde envoyée. */
function validateCrmForm(form) {
  const errors = [];
  const positiveOrNull = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return undefined;
    return n;
  };
  const ppcu = positiveOrNull(form.pointsPerCurrencyUnit);
  const ptcr = positiveOrNull(form.pointsToCurrencyRatio);
  if (ppcu === undefined) errors.push('Ratio de gain de points invalide.');
  if (ptcr === undefined) errors.push('Ratio de conversion invalide.');
  if (form.loyaltyEnabled && (ppcu === null || ptcr === null)) {
    errors.push('Fidélité activée : renseignez le ratio de gain ET de conversion.');
  }
  const delta = positiveOrNull(form.maxDeltaPercent);
  if (delta === undefined || (delta !== null && delta > 100)) {
    errors.push('Seuil perte/vol : pourcentage attendu entre 0 et 100.');
  }
  const window = positiveOrNull(form.windowDays);
  if (window === undefined || (window !== null && window < 1)) {
    errors.push('Fenêtre perte/vol : nombre de jours attendu (≥ 1).');
  }
  if (form.shrinkageEnabled && delta === null) {
    errors.push('Alerte perte/vol activée : renseignez le seuil maximal.');
  }
  return { errors, values: { ppcu, ptcr, delta, window } };
}

export default function CrmSettingsCard({ tenantId, canEdit, tenant }) {
  const { success, error: notifError } = useNotif();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => crmSettingsToForm(tenant?.parametres?.crm ?? tenant?.crm));
  const [errors, setErrors] = useState([]);
  // Re-synchronisation quand /tenant/info arrive (ou est rafraîchi) après le
  // premier rendu : la carte démarre souvent avant la réponse réseau.
  // Pattern « adjusting state when props change » (React docs) : setState
  // pendant le rendu, gardé par l'identité de l'objet — pas d'effet, pas de
  // rendu en cascade (règle react-hooks/set-state-in-effect).
  const [syncedTenant, setSyncedTenant] = useState(tenant);
  if (tenant !== syncedTenant) {
    setSyncedTenant(tenant);
    setForm(crmSettingsToForm(tenant?.parametres?.crm ?? tenant?.crm));
  }

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.patch('/crm-settings', payload);
      return res.data;
    },
    onSuccess: (data) => {
      setForm(crmSettingsToForm(data?.crm));
      setErrors([]);
      queryClient.invalidateQueries({ queryKey: ['tenant-config', tenantId] });
      success('Paramètres CRM enregistrés.');
    },
    onError: (err) => {
      notifError(err.response?.data?.message || 'Échec de la sauvegarde CRM.', 'Erreur');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canEdit) return;
    const { errors: validationErrors, values } = validateCrmForm(form);
    if (validationErrors.length) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    const currency = form.currency.trim() || null;
    saveMutation.mutate({
      loyalty: {
        enabled: form.loyaltyEnabled,
        // null = valeur effacée (le backend retire la clé au lieu de stocker null).
        pointsPerCurrencyUnit: values.ppcu,
        pointsToCurrencyRatio: values.ptcr,
        currency: form.loyaltyEnabled ? currency : null,
      },
      shrinkageAlert: {
        enabled: form.shrinkageEnabled,
        maxDeltaPercent: values.delta,
        windowDays: values.window,
      },
      boutique: { sizeSystem: form.sizeSystem || null },
      channels: {
        whatsapp: form.whatsapp,
        instagram: form.instagram,
        messenger: form.messenger,
      },
    });
  };

  const set = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
  };

  const inputClass = 'w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed';
  const labelClass = 'text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block';

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-600/20 rounded-2xl flex items-center justify-center text-indigo-400"><Bot className="w-5 h-5" /></div>
        <div>
          <h3 className="text-white font-bold">CRM Omnicanal (WhatsApp / Instagram / Messenger)</h3>
          <p className="text-slate-500 text-xs">Règles utilisées par l'agent IA conversationnel. Laissez vide tant que la règle n'est pas arrêtée : l'IA restera muette plutôt que d'inventer un chiffre.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <fieldset disabled={!canEdit} className="space-y-6">
          <div>
            <p className="text-indigo-400 text-xs font-black uppercase tracking-widest mb-3">Fidélité</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-3 bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 cursor-pointer">
                <input type="checkbox" checked={form.loyaltyEnabled} onChange={set('loyaltyEnabled')} className="accent-indigo-500 w-4 h-4" />
                <span className="text-slate-300 text-sm font-bold">Programme activé</span>
              </label>
              <div>
                <label className={labelClass}>Points gagnés / {form.currency || 'unité'} dépensée</label>
                <input type="number" min="0" step="any" value={form.pointsPerCurrencyUnit} onChange={set('pointsPerCurrencyUnit')} placeholder="ex. 1" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Valeur d'1 point ({form.currency || 'devise'})</label>
                <input type="number" min="0" step="any" value={form.pointsToCurrencyRatio} onChange={set('pointsToCurrencyRatio')} placeholder="ex. 25" className={inputClass} />
              </div>
            </div>
          </div>

          <div>
            <p className="text-indigo-400 text-xs font-black uppercase tracking-widest mb-3">Alerte pertes / vols</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-3 bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 cursor-pointer">
                <input type="checkbox" checked={form.shrinkageEnabled} onChange={set('shrinkageEnabled')} className="accent-indigo-500 w-4 h-4" />
                <span className="text-slate-300 text-sm font-bold">Surveillance activée</span>
              </label>
              <div>
                <label className={labelClass}>Écart maximal toléré (%)</label>
                <input type="number" min="0" max="100" step="any" value={form.maxDeltaPercent} onChange={set('maxDeltaPercent')} placeholder="ex. 2" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Fenêtre de calcul (jours)</label>
                <input type="number" min="1" max="365" step="1" value={form.windowDays} onChange={set('windowDays')} placeholder="ex. 30" className={inputClass} />
              </div>
            </div>
          </div>

          <div>
            <p className="text-indigo-400 text-xs font-black uppercase tracking-widest mb-3">Boutique de mode</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Référentiel de pointures</label>
                <select value={form.sizeSystem} onChange={set('sizeSystem')} className={inputClass}>
                  <option value="">Non configuré (l'IA ne prédira pas de pointure)</option>
                  <option value="EU">Européen (EU)</option>
                  <option value="UK">Royaume-Uni (UK)</option>
                  <option value="US">États-Unis (US)</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Devise de fidélité</label>
                <input type="text" maxLength={12} value={form.currency} onChange={set('currency')} placeholder="FCFA" className={inputClass} />
              </div>
            </div>
          </div>

          <div>
            <p className="text-indigo-400 text-xs font-black uppercase tracking-widest mb-3">Canaux autorisés pour l'agent IA</p>
            <div className="flex flex-wrap gap-3">
              {[
                ['whatsapp', 'WhatsApp'],
                ['instagram', 'Instagram'],
                ['messenger', 'Messenger'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-2.5 cursor-pointer">
                  <input type="checkbox" checked={form[key]} onChange={set(key)} className="accent-indigo-500 w-4 h-4" />
                  <span className="text-slate-300 text-sm font-bold">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {errors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-1">
              {errors.map((message) => <p key={message} className="text-red-400 text-xs font-bold">{message}</p>)}
            </div>
          )}

          {canEdit && (
            <div className="pt-4 border-t border-slate-700/50">
              <button type="submit" disabled={saveMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 text-sm">
                {saveMutation.isPending ? <Save className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                ENREGISTRER LES RÈGLES CRM
              </button>
            </div>
          )}
        </fieldset>
      </form>
    </div>
  );
}

/** Alias utilisé par SettingsPage (même composant, nom parlant dans le JSX). */
export { CrmSettingsCard as FormCrmSettings };
