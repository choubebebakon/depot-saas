import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api';
import { useAuth } from '../../../contexts/AuthContext';

function Section({ title, icon, children }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
      <h2 className="text-white font-black text-lg mb-5 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

export default function ParametresPage() {
  const { user, tenantId } = useAuth();
  const queryClient = useQueryClient();

  const [infos, setInfos] = useState({
    nomEntreprise: user?.nomEntreprise || '',
    telephone: '',
    email: '',
    adresse: '',
    devise: 'XOF',
    fuseau: 'Africa/Abidjan',
    logo: '',
  });
  const [ticket, setTicket] = useState({
    messageAccueil: 'Merci de votre visite !',
    messageFin: 'À bientôt !',
    afficherLogo: true,
    afficherTaxe: false,
    tauxTaxe: 18,
  });
  const [caisse, setCaisse] = useState({
    ouvertureCaisse: '08:00',
    fermetureCaisse: '21:00',
    alerteStockFaible: 5,
    autoImpression: false,
  });
  const [notif, setNotif] = useState(null);

  const inputClass = 'bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-full';

  const { data: parametres } = useQuery({
    queryKey: ['supermarche-parametres', tenantId],
    queryFn: async () => {
      const res = await api.get('/supermarche/parametres');
      return res.data;
    },
    enabled: !!tenantId,
    onSuccess: (d) => {
      if (d?.infos) setInfos(prev => ({ ...prev, ...d.infos }));
      if (d?.ticket) setTicket(prev => ({ ...prev, ...d.ticket }));
      if (d?.caisse) setCaisse(prev => ({ ...prev, ...d.caisse }));
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ section, data }) => {
      const res = await api.patch('/supermarche/parametres', { section, data });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supermarche-parametres'] });
      setNotif({ msg: 'Paramètres sauvegardés ✓', type: 'success' });
      setTimeout(() => setNotif(null), 3000);
    },
    onError: () => {
      setNotif({ msg: 'Erreur lors de la sauvegarde', type: 'error' });
      setTimeout(() => setNotif(null), 3000);
    }
  });

  const save = (section, data) => {
    saveMutation.mutate({ section, data });
  };


  return (
    <div className="p-6 space-y-6">
      {notif && (
        <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
          {notif.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-black text-white">⚙️ Paramètres</h1>
          <p className="text-slate-400 text-sm mt-1">Configuration de votre supermarché</p>
        </div>
      </div>

      {/* Informations générales */}
      <Section title="Informations générales" icon="🏪">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Nom du supermarché">
              <input value={infos.nomEntreprise} onChange={e => setInfos({...infos, nomEntreprise: e.target.value})} className={inputClass} />
            </Field>
          </div>
          <Field label="Téléphone">
            <input value={infos.telephone} onChange={e => setInfos({...infos, telephone: e.target.value})} className={inputClass} />
          </Field>
          <Field label="Email">
            <input type="email" value={infos.email} onChange={e => setInfos({...infos, email: e.target.value})} className={inputClass} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Adresse complète">
              <input value={infos.adresse} onChange={e => setInfos({...infos, adresse: e.target.value})} className={inputClass} />
            </Field>
          </div>
          <Field label="Devise">
            <select value={infos.devise} onChange={e => setInfos({...infos, devise: e.target.value})} className={inputClass}>
              <option value="XOF">F CFA (XOF)</option>
              <option value="EUR">Euro (EUR)</option>
              <option value="USD">Dollar (USD)</option>
              <option value="GNF">Franc Guinéen (GNF)</option>
            </select>
          </Field>
          <Field label="Fuseau horaire">
            <select value={infos.fuseau} onChange={e => setInfos({...infos, fuseau: e.target.value})} className={inputClass}>
              <option value="Africa/Abidjan">Afrique de l'Ouest (UTC+0)</option>
              <option value="Africa/Lagos">Afrique Centrale (UTC+1)</option>
              <option value="Africa/Nairobi">Afrique de l'Est (UTC+3)</option>
              <option value="Europe/Paris">Europe/Paris (UTC+1/+2)</option>
            </select>
          </Field>
        </div>
        <div className="mt-5">
          <button onClick={() => save('infos', infos)} disabled={saveMutation.isPending}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20">
            {saveMutation.isPending ? '⏳ Sauvegarde...' : '✓ Sauvegarder'}
          </button>
        </div>
      </Section>

      {/* Configuration du ticket */}
      <Section title="Ticket de caisse" icon="🧾">
        <div className="space-y-4">
          <Field label="Message d'accueil">
            <input value={ticket.messageAccueil} onChange={e => setTicket({...ticket, messageAccueil: e.target.value})} className={inputClass} />
          </Field>
          <Field label="Message de fin">
            <input value={ticket.messageFin} onChange={e => setTicket({...ticket, messageFin: e.target.value})} className={inputClass} />
          </Field>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="écheckbox" échecked={ticket.afficherLogo} onChange={e => setTicket({...ticket, afficherLogo: e.target.échecked})}
                className="w-4 h-4 accent-amber-500" />
              <span className="text-slate-300 text-sm font-semibold">Afficher le logo sur le ticket</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="écheckbox" échecked={ticket.afficherTaxe} onChange={e => setTicket({...ticket, afficherTaxe: e.target.échecked})}
                className="w-4 h-4 accent-amber-500" />
              <span className="text-slate-300 text-sm font-semibold">Afficher la TVA</span>
            </label>
          </div>
          {ticket.afficherTaxe && (
            <Field label="Taux TVA (%)">
              <input type="number" min="0" max="100" value={ticket.tauxTaxe} onChange={e => setTicket({...ticket, tauxTaxe: parseFloat(e.target.value)})}
                className={inputClass + ' w-32'} />
            </Field>
          )}
        </div>
        <div className="mt-5">
          <button onClick={() => save('ticket', ticket)} disabled={saveMutation.isPending}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20">
            {saveMutation.isPending ? '⏳ Sauvegarde...' : '✓ Sauvegarder'}
          </button>
        </div>
      </Section>

      {/* Configuration caisse */}
      <Section title="Gestion de la caisse" icon="🛒">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Heure d'ouverture">
            <input type="time" value={caisse.ouvertureCaisse} onChange={e => setCaisse({...caisse, ouvertureCaisse: e.target.value})} className={inputClass} />
          </Field>
          <Field label="Heure de fermeture">
            <input type="time" value={caisse.fermetureCaisse} onChange={e => setCaisse({...caisse, fermetureCaisse: e.target.value})} className={inputClass} />
          </Field>
          <Field label="Seuil d'alerte stock faible (unités)">
            <input type="number" min="0" value={caisse.alerteStockFaible} onChange={e => setCaisse({...caisse, alerteStockFaible: parseInt(e.target.value)})} className={inputClass} />
          </Field>
        </div>
        <div className="mt-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="écheckbox" échecked={caisse.autoImpression} onChange={e => setCaisse({...caisse, autoImpression: e.target.échecked})}
              className="w-4 h-4 accent-amber-500" />
            <span className="text-slate-300 text-sm font-semibold">Impression automatique après chaque vente</span>
          </label>
        </div>
        <div className="mt-5">
          <button onClick={() => save('caisse', caisse)} disabled={saveMutation.isPending}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20">
            {saveMutation.isPending ? '⏳ Sauvegarde...' : '✓ Sauvegarder'}
          </button>
        </div>
      </Section>

      {/* Zone danger */}
      <Section title="Zone danger" icon="⚠️">
        <p className="text-slate-400 text-sm mb-4">Ces actions sont irréversibles. Procédez avec précaution.</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => window.confirm('Réinitialiser toutes les données du supermarché ?') && api.post('/supermarche/reset-data').then(() => { setNotif({ msg: 'Données réinitialisées', type: 'success' }); setTimeout(() => setNotif(null), 3000); }).catch(() => { setNotif({ msg: 'Erreur', type: 'error' }); setTimeout(() => setNotif(null), 3000); })}
            className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 font-bold px-5 py-2.5 rounded-xl text-sm transition-all">
            🗑️ Réinitialiser les données
          </button>
          <button
            onClick={() => {
              const data = JSON.stringify({ infos, ticket, caisse }, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'parametres-supermarche.json'; a.click();
            }}
            className="bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">
            📤 Exporter la configuration
          </button>
        </div>
      </Section>
    </div>
  );
}
