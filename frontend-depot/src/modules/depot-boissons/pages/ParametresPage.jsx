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
    devise: 'XAF',
  });
  const [ticket, setTicket] = useState({
    messageAccueil: 'Bienvenue chez nous !',
    messageFin: 'Merci de votre confiance !',
    afficherLogo: true,
  });
  const [caisse, setCaisse] = useState({
    alerteStockFaible: 5,
    autoImpression: false,
  });
  const [notif, setNotif] = useState(null);

  const inputClass = 'bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm outline-none w-full focus:ring-2 focus:ring-blue-500/50';

  // Chargement des données (adapte l'URL selon ton endpoint)
  const { data: parametres } = useQuery({
    queryKey: ['depot-parametres', tenantId],
    queryFn: async () => {
      const res = await api.get('/depot/parametres');
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
      return await api.patch('/depot/parametres', { section, data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['depot-parametres']);
      setNotif({ msg: 'Paramètres sauvegardés avec succès ✓', type: 'success' });
      setTimeout(() => setNotif(null), 3000);
    }
  });

  const save = (section, data) => {
    // 1. Sauvegarde locale immédiate (pour le ticket)
    if (section === 'infos') {
      localStorage.setItem('depot_nom', data.nomEntreprise);
      localStorage.setItem('depot_adresse', data.adresse);
      localStorage.setItem('depot_telephone', data.telephone);
    }
    if (section === 'ticket') {
      localStorage.setItem('msg_accueil', data.messageAccueil);
      localStorage.setItem('msg_fin', data.messageFin);
    }
    
    // 2. Envoi au serveur
    saveMutation.mutate({ section, data });
  };
  return (
    <div className="p-6 space-y-6">
      {notif && <div className="fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl bg-emerald-600 text-white font-bold text-sm">{notif.msg}</div>}

      <div>
        <h1 className="text-2xl font-black text-white">⚙️ Paramètres du Dépôt</h1>
        <p className="text-slate-400 text-sm mt-1">Gérez les informations de votre dépôt de boissons</p>
      </div>

      <Section title="Informations du Dépôt" icon="🏪">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Nom du Dépôt"><input value={infos.nomEntreprise} onChange={e => setInfos({...infos, nomEntreprise: e.target.value})} className={inputClass} /></Field>
          </div>
          <Field label="Téléphone"><input value={infos.telephone} onChange={e => setInfos({...infos, telephone: e.target.value})} className={inputClass} /></Field>
          <Field label="Email"><input value={infos.email} onChange={e => setInfos({...infos, email: e.target.value})} className={inputClass} /></Field>
          <div className="sm:col-span-2"><Field label="Adresse"><input value={infos.adresse} onChange={e => setInfos({...infos, adresse: e.target.value})} className={inputClass} /></Field></div>
        </div>
        <button onClick={() => save('infos', infos)} className="mt-5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-xl text-sm">Sauvegarder</button>
      </Section>

      <Section title="Ticket de caisse (80mm)" icon="🧾">
        <div className="space-y-4">
          <Field label="Message d'accueil"><input value={ticket.messageAccueil} onChange={e => setTicket({...ticket, messageAccueil: e.target.value})} className={inputClass} /></Field>
          <Field label="Message de fin"><input value={ticket.messageFin} onChange={e => setTicket({...ticket, messageFin: e.target.value})} className={inputClass} /></Field>
        </div>
        <button onClick={() => save('ticket', ticket)} className="mt-5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-xl text-sm">Sauvegarder</button>
      </Section>

      <Section title="Gestion de la Caisse" icon="🛒">
        <Field label="Seuil d'alerte stock faible"><input type="number" value={caisse.alerteStockFaible} onChange={e => setCaisse({...caisse, alerteStockFaible: parseInt(e.target.value)})} className={inputClass} /></Field>
        <label className="flex items-center gap-3 mt-4 cursor-pointer">
          <input type="checkbox" checked={caisse.autoImpression} onChange={e => setCaisse({...caisse, autoImpression: e.target.checked})} className="w-5 h-5 accent-blue-500" />
          <span className="text-slate-300 text-sm">Impression automatique après chaque vente</span>
        </label>
        <button onClick={() => save('caisse', caisse)} className="mt-5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-xl text-sm">Sauvegarder</button>
      </Section>
    </div>
  );
}