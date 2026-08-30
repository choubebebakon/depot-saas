import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Settings, Receipt, ShoppingCart, Store } from 'lucide-react';
import api from '../../../api';
import { useAuth } from '../../../contexts/AuthContext';

function Section({ title, icon, children }) { return <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6"><h2 className="text-white font-black text-lg mb-5 flex items-center gap-2"><span>{icon}</span> {title}</h2>{children}</div>; }
function Field({ label, children }) { return <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block">{label}</label>{children}</div>; }

export default function ParametresPage() {
  const { user, tenantId } = useAuth();
  const queryClient = useQueryClient();
  const [infos, setInfos] = useState({ nomEntreprise: user?.nomEntreprise || '', telephone: '', email: '', adresse: '', devise: 'FCFA' });
  const [ticket, setTicket] = useState({ messageAccueil: 'Bienvenue chez nous !', messageFin: 'Merci de votre confiance !', afficherLogo: true });
  const [caisse, setCaisse] = useState({ alerteStockFaible: 5, autoImpression: false, nomCaissiere: '' });
  const [notif, setNotif] = useState(null);
  const [logoBase64, setLogoBase64] = useState(null);
  const inputClass = 'bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm outline-none w-full focus:ring-2 focus:ring-blue-500/50';

  const { data: parametres } = useQuery({ queryKey: ['supermarche-parametres', tenantId], queryFn: async () => (await api.get('/depot/parametres')).data, enabled: !!tenantId });
  const { data: tenant } = useQuery({ queryKey: ['tenant-config', tenantId], queryFn: async () => (await api.get(`/tenants/${tenantId}`)).data, enabled: !!tenantId });

  useEffect(() => {
    if (parametres?.infos) setInfos(prev => ({ ...prev, ...parametres.infos }));
    if (parametres?.ticket) setTicket(prev => ({ ...prev, ...parametres.ticket }));
    if (parametres?.caisse) setCaisse(prev => ({ ...prev, ...parametres.caisse }));
    if (tenant?.logo) setLogoBase64(tenant.logo);
    if (tenant?.nomEntreprise) setInfos(prev => ({ ...prev, nomEntreprise: tenant.nomEntreprise }));
    if (tenant?.adresse) setInfos(prev => ({ ...prev, adresse: tenant.adresse }));
    if (tenant?.telephone) setInfos(prev => ({ ...prev, telephone: tenant.telephone }));
  }, [parametres, tenant]);

  const resizeImage = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
    reader.onload = event => { const img = new Image(); img.onerror = () => reject(new Error('Image invalide')); img.onload = () => { const max = 250; const scale = Math.min(1, max / img.width); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(img.width * scale)); canvas.height = Math.max(1, Math.round(img.height * scale)); canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL('image/png', 0.7)); }; img.src = event.target.result; }; reader.readAsDataURL(file);
  });
  const handleLogoChange = async e => { const file = e.target.files?.[0]; if (!file) return; try { setLogoBase64(await resizeImage(file)); } catch (err) { setNotif({ msg: err.message, type: 'error' }); } };

  const saveMutation = useMutation({
    mutationFn: async ({ section, data }) => {
      if (!tenantId) throw new Error('Tenant non identifié');
      if (section === 'infos') await api.patch(`/tenants/${tenantId}`, { nomEntreprise: data.nomEntreprise, adresse: data.adresse, telephone: data.telephone, logo: logoBase64 });
      return api.patch('/depot/parametres', { section, data });
    },
    onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ['supermarche-parametres', tenantId] }), queryClient.invalidateQueries({ queryKey: ['tenant-config', tenantId] })]); setNotif({ msg: 'Paramètres sauvegardés avec succès ✓', type: 'success' }); setTimeout(() => setNotif(null), 3000); },
    onError: err => { setNotif({ msg: err.response?.data?.message || err.message || 'Erreur lors de la sauvegarde', type: 'error' }); setTimeout(() => setNotif(null), 4000); }
  });
  const save = (section, data) => saveMutation.mutate({ section, data });

  return <div className="p-6 space-y-6">
    {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>{notif.msg}</div>}
    <div><h1 className="text-2xl font-black text-white flex items-center gap-2"><Settings className="w-6 h-6" /> Paramètres du Supermarché</h1><p className="text-slate-400 text-sm mt-1">Gérez les informations et la configuration de votre supermarché</p></div>
    <Section title="Informations du Supermarché" icon={<Store className="w-5 h-5" />}><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div className="sm:col-span-2"><Field label="Nom"><input value={infos.nomEntreprise} onChange={e => setInfos({...infos, nomEntreprise:e.target.value})} className={inputClass}/></Field></div><Field label="Téléphone"><input value={infos.telephone} onChange={e => setInfos({...infos,telephone:e.target.value})} className={inputClass}/></Field><Field label="Email"><input value={infos.email} onChange={e => setInfos({...infos,email:e.target.value})} className={inputClass}/></Field><Field label="Devise"><select value={infos.devise} onChange={e => setInfos({...infos,devise:e.target.value})} className={inputClass}><option value="FCFA">FCFA</option><option value="EUR">EUR</option><option value="USD">USD</option></select></Field><div className="sm:col-span-2"><Field label="Adresse"><input value={infos.adresse} onChange={e => setInfos({...infos,adresse:e.target.value})} className={inputClass}/></Field></div></div><div className="mt-6 border-t border-slate-700/50 pt-6"><h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2"><Upload className="w-4 h-4 text-cyan-400"/> Logo</h3><div className="relative group w-48 h-48 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden"><>{logoBase64 ? <img src={logoBase64} alt="Logo" className="w-full h-full object-contain p-4"/> : <p className="text-slate-500 text-xs">Cliquez pour ajouter un logo</p>}<input type="file" accept="image/*" onChange={handleLogoChange} className="absolute inset-0 opacity-0 cursor-pointer"/></></div></div><button disabled={saveMutation.isPending} onClick={() => save('infos', infos)} className="mt-5 bg-blue-600 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-xl text-sm">{saveMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}</button></Section>
    <Section title="Ticket de caisse (80mm)" icon={<Receipt className="w-5 h-5"/>}><div className="space-y-4"><Field label="Message d'accueil"><input value={ticket.messageAccueil} onChange={e=>setTicket({...ticket,messageAccueil:e.target.value})} className={inputClass}/></Field><Field label="Message de fin"><input value={ticket.messageFin} onChange={e=>setTicket({...ticket,messageFin:e.target.value})} className={inputClass}/></Field></div><button disabled={saveMutation.isPending} onClick={()=>save('ticket',ticket)} className="mt-5 bg-blue-600 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-xl text-sm">Sauvegarder</button></Section>
    <Section title="Gestion de la Caisse" icon={<ShoppingCart className="w-5 h-5"/>}><Field label="Nom de la caissière"><input value={caisse.nomCaissiere} onChange={e=>setCaisse({...caisse,nomCaissiere:e.target.value})} className={inputClass}/></Field><Field label="Seuil d'alerte stock faible"><input type="number" min="0" value={caisse.alerteStockFaible} onChange={e=>setCaisse({...caisse,alerteStockFaible:Math.max(0,Number(e.target.value)||0)})} className={inputClass}/></Field><label className="flex items-center gap-3 mt-4 cursor-pointer"><input type="checkbox" checked={caisse.autoImpression} onChange={e=>setCaisse({...caisse,autoImpression:e.target.checked})} className="w-5 h-5 accent-blue-500"/><span className="text-slate-300 text-sm">Impression automatique après chaque vente</span></label><button disabled={saveMutation.isPending} onClick={()=>save('caisse',caisse)} className="mt-5 bg-blue-600 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-xl text-sm">Sauvegarder</button></Section>
  </div>;
}
