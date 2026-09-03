import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Settings, Receipt, ShoppingCart, Store } from 'lucide-react';
import api from '../../../api';
import { useAuth } from '../../../contexts/AuthContext';

const MAX_LOGO_BYTES = 350_000;
const PHONE_RE = /^[0-9+().\s-]*$/;

function Section({ title, icon, children }) { return <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6"><h2 className="text-white font-black text-lg mb-5 flex items-center gap-2">{icon} {title}</h2>{children}</div>; }
function Field({ label, children }) { return <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block">{label}</label>{children}</div>; }

export default function ParametresPage() {
  const { user, tenantId } = useAuth();
  const queryClient = useQueryClient();
  const [infos, setInfos] = useState({ nomEntreprise: '', telephone: '', email: '', adresse: '', devise: 'FCFA' });
  const [ticket, setTicket] = useState({ messageAccueil: '', messageFin: '', afficherLogo: true });
  const [caisse, setCaisse] = useState({ alerteStockFaible: 5, autoImpression: false, nomCaissiere: '' });
  const [notif, setNotif] = useState(null);
  const [logoBase64, setLogoBase64] = useState(null);
  const inputClass = 'bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm outline-none w-full focus:ring-2 focus:ring-blue-500/50';

  const { data: parametres } = useQuery({ queryKey: ['depot-parametres', tenantId], queryFn: async () => (await api.get('/depot/parametres')).data, enabled: !!tenantId });
  const { data: tenant } = useQuery({ queryKey: ['tenant-config', tenantId], queryFn: async () => (await api.get('/tenant/info')).data?.tenant, enabled: !!tenantId });

  useEffect(() => {
    if (parametres?.infos) setInfos(prev => ({ ...prev, ...parametres.infos }));
    if (parametres?.ticket) setTicket(prev => ({ ...prev, ...parametres.ticket }));
    if (parametres?.caisse) setCaisse(prev => ({ ...prev, ...parametres.caisse }));
    if (tenant?.logo) setLogoBase64(tenant.logo);
    if (tenant?.nomEntreprise) setInfos(prev => ({ ...prev, nomEntreprise: tenant.nomEntreprise }));
    if (tenant?.adresse) setInfos(prev => ({ ...prev, adresse: tenant.adresse }));
    if (tenant?.telephone) setInfos(prev => ({ ...prev, telephone: tenant.telephone }));
    if (tenant?.emailPatron) setInfos(prev => ({ ...prev, email: tenant.emailPatron }));
  }, [parametres, tenant]);

  const resizeImage = file => new Promise((resolve, reject) => {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return reject(new Error('Logo : PNG, JPEG ou WebP uniquement.'));
    if (file.size > MAX_LOGO_BYTES) return reject(new Error('Logo trop volumineux. Taille maximale : 350 Ko.'));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
    reader.onload = event => { const img = new Image(); img.onerror = () => reject(new Error('Image invalide')); img.onload = () => { const max = 250; const scale = Math.min(1, max / img.width); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(img.width * scale)); canvas.height = Math.max(1, Math.round(img.height * scale)); const ctx = canvas.getContext('2d'); if (!ctx) return reject(new Error('Traitement de l’image impossible')); ctx.drawImage(img, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL('image/png', 0.7)); }; img.src = event.target.result; };
    reader.readAsDataURL(file);
  });
  const handleLogoChange = async e => { const file = e.target.files?.[0]; if (!file) return; try { setLogoBase64(await resizeImage(file)); } catch (err) { setNotif({ msg: err.message, type: 'error' }); } finally { e.target.value = ''; } };

  const validateInfos = data => {
    const nom = data.nomEntreprise.trim(); const telephone = data.telephone.trim(); const email = data.email.trim();
    if (nom.length < 2 || nom.length > 160) throw new Error('Le nom de l’entreprise doit contenir entre 2 et 160 caractères.');
    if (telephone && !PHONE_RE.test(telephone)) throw new Error('Téléphone invalide.');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Adresse email invalide.');
    return { ...data, nomEntreprise: nom, telephone, email, adresse: data.adresse.trim() };
  };

  const saveMutation = useMutation({
    mutationFn: async ({ section, data }) => {
      if (!tenantId) throw new Error('Tenant non identifié');
      if (section === 'infos') {
        const clean = validateInfos(data);
        await api.patch(`/tenant/${tenantId}`, { nomEntreprise: clean.nomEntreprise, adresse: clean.adresse, telephone: clean.telephone, logo: logoBase64 || undefined });
      }
      return api.patch('/depot/parametres', { section, data });
    },
    onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ['depot-parametres', tenantId] }), queryClient.invalidateQueries({ queryKey: ['tenant-config', tenantId] }), queryClient.invalidateQueries({ queryKey: ['tenant-info'] })]); setNotif({ msg: 'Paramètres sauvegardés avec succès.', type: 'success' }); setTimeout(() => setNotif(null), 3000); },
    onError: err => { setNotif({ msg: err.response?.data?.message || err.message || 'Erreur lors de la sauvegarde', type: 'error' }); setTimeout(() => setNotif(null), 4000); }
  });
  const save = (section, data) => { try { if (section === 'ticket' && ((data.messageAccueil || '').length > 200 || (data.messageFin || '').length > 200)) throw new Error('Les messages du ticket sont limités à 200 caractères.'); if (section === 'caisse' && (!Number.isInteger(Number(data.alerteStockFaible)) || Number(data.alerteStockFaible) < 0 || Number(data.alerteStockFaible) > 1_000_000)) throw new Error('Seuil de stock invalide.'); saveMutation.mutate({ section, data }); } catch (err) { setNotif({ msg: err.message, type: 'error' }); } };

  return <div className="p-6 space-y-6">
    {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>{notif.msg}</div>}
    <div><h1 className="text-2xl font-black text-white flex items-center gap-2"><Settings className="w-6 h-6" /> Paramètres du Dépôt</h1><p className="text-slate-400 text-sm mt-1">Configuration sécurisée de votre dépôt de boissons</p></div>
    <Section title="Informations du Dépôt" icon={<Store className="w-5 h-5" />}><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div className="sm:col-span-2"><Field label="Nom du Dépôt"><input value={infos.nomEntreprise} onChange={e=>setInfos({...infos,nomEntreprise:e.target.value})} maxLength={160} className={inputClass}/></Field></div><Field label="Téléphone"><input value={infos.telephone} onChange={e=>setInfos({...infos,telephone:e.target.value})} maxLength={40} className={inputClass}/></Field><Field label="Email"><input type="email" value={infos.email} onChange={e=>setInfos({...infos,email:e.target.value})} maxLength={180} className={inputClass}/></Field><Field label="Devise"><select value={infos.devise} onChange={e=>setInfos({...infos,devise:e.target.value})} className={inputClass}><option value="FCFA">FCFA</option><option value="EUR">EUR</option><option value="USD">USD</option></select></Field><div className="sm:col-span-2"><Field label="Adresse"><input value={infos.adresse} onChange={e=>setInfos({...infos,adresse:e.target.value})} maxLength={255} className={inputClass}/></Field></div></div><div className="mt-6 border-t border-slate-700/50 pt-6"><h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2"><Upload className="w-4 h-4 text-cyan-400"/> Logo de l'entreprise</h3><div className="relative group w-48 h-48 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden">{logoBase64?<img src={logoBase64} alt="Logo" className="w-full h-full object-contain p-4"/>:<p className="text-slate-500 text-xs text-center px-4">PNG, JPEG ou WebP — 350 Ko max</p>}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoChange} className="absolute inset-0 opacity-0 cursor-pointer"/></div></div><button disabled={saveMutation.isPending} onClick={()=>save('infos',infos)} className="mt-5 bg-blue-600 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-xl text-sm">{saveMutation.isPending?'Sauvegarde...':'Sauvegarder'}</button></Section>
    <Section title="Ticket de caisse (80mm)" icon={<Receipt className="w-5 h-5"/>}><div className="space-y-4"><Field label="Message d'accueil"><input value={ticket.messageAccueil} onChange={e=>setTicket({...ticket,messageAccueil:e.target.value})} maxLength={200} className={inputClass}/></Field><Field label="Message de fin"><input value={ticket.messageFin} onChange={e=>setTicket({...ticket,messageFin:e.target.value})} maxLength={200} className={inputClass}/></Field></div><button disabled={saveMutation.isPending} onClick={()=>save('ticket',ticket)} className="mt-5 bg-blue-600 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-xl text-sm">Sauvegarder</button></Section>
    <Section title="Gestion de la Caisse" icon={<ShoppingCart className="w-5 h-5"/>}><div className="space-y-4"><Field label="Nom de la caissière"><input value={caisse.nomCaissiere} onChange={e=>setCaisse({...caisse,nomCaissiere:e.target.value})} maxLength={120} className={inputClass}/></Field><Field label="Seuil d'alerte stock faible"><input type="number" min="0" max="1000000" step="1" value={caisse.alerteStockFaible} onChange={e=>setCaisse({...caisse,alerteStockFaible:e.target.value})} className={inputClass}/></Field><label className="flex items-center gap-3 mt-4 cursor-pointer"><input type="checkbox" checked={caisse.autoImpression} onChange={e=>setCaisse({...caisse,autoImpression:e.target.checked})} className="w-5 h-5 accent-blue-500"/><span className="text-slate-300 text-sm">Impression automatique après chaque vente</span></label></div><button disabled={saveMutation.isPending} onClick={()=>save('caisse',caisse)} className="mt-5 bg-blue-600 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-xl text-sm">Sauvegarder</button></Section>
  </div>;
}
