import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../shared/hooks/usePermission';
import FormModal from '../../shared/components/forms/FormModal';
import ConfirmModal from '../../shared/components/forms/ConfirmModal';

const PLAN_DEPOT_LIMITS = { FREE: 1, TRIAL: 1, SOLO: 1, BASIC: 1, PME: 3, PREMIUM: 5, ENTERPRISE: 20, UNLIMITED: Infinity };
const ADMIN_PERMS = {
  PATRON: { canView: ['*'], canCreate: ['*'], canEdit: ['*'], canDelete: ['*'] },
  GERANT: { canView: ['depots', 'utilisateurs'], canCreate: ['depots'], canEdit: [], canDelete: ['depots'] },
};

export default function DepotsPage() {
  const { metier: metierParam } = useParams();
  const { metier: metierCtx, user } = useAuth();
  const navigate = useNavigate();
  const metier = metierParam || metierCtx || '';
  const apiBase = metier.toLowerCase().replace(/_/g, '-');
  const planType = user?.planType || user?.plan || 'FREE';
  const maxDepots = PLAN_DEPOT_LIMITS[planType] ?? 1;
  const perm = usePermission(ADMIN_PERMS, 'depots');

  const [depots, setDepots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [quotaAlert, setQuotaAlert] = useState(null);
  const [form, setForm] = useState({ nom: '', codePrefix: '', emplacement: '', adresse: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [notif, setNotif] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };

  const load = useCallback(async () => {
    if (!apiBase) return;
    setLoading(true);
    try {
      const res = await api.get(`/${apiBase}/depots`);
      setDepots(res.data?.data || res.data || []);
    } catch (err) {
      setDepots([]);
      showNotif(err.response?.data?.message || 'Impossible de charger les dépôts', 'error');
    } finally { setLoading(false); }
  }, [apiBase]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setQuotaAlert(null);
    if (depots.length >= maxDepots) {
      setQuotaAlert({ message: `Limite d'abonnement atteinte (${depots.length}/${maxDepots}). Veuillez mettre à niveau votre offre.`, current: depots.length, limit: maxDepots, plan: planType });
      setFormOpen(true);
      return;
    }
    setForm({ nom: '', codePrefix: '', emplacement: '', adresse: '' });
    setFormOpen(true);
  };

  const setF = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!perm.canCreate) return showNotif('Vous n’avez pas la permission de créer un dépôt', 'error');
    if (!form.nom.trim()) return showNotif('Le nom du dépôt est requis', 'error');
    setFormLoading(true);
    try {
      await api.post(`/${apiBase}/depots`, form);
      setFormOpen(false);
      showNotif('Dépôt créé ✓');
      await load();
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.error === 'QUOTA_REACHED') {
        const meta = err.response.data.metadata || {};
        setQuotaAlert({ message: err.response.data.message || `Quota atteint (${meta.current || depots.length}/${meta.limit || maxDepots})`, current: meta.current || depots.length, limit: meta.limit || maxDepots, plan: meta.currentPlan || planType, suggestedPlan: meta.suggestedPlan || 'PREMIUM' });
      } else showNotif(err.response?.data?.message || 'Erreur création dépôt', 'error');
    } finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete || !perm.canDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/${apiBase}/depots/${encodeURIComponent(confirmDelete.id)}`);
      setConfirmDelete(null);
      showNotif('Dépôt supprimé');
      await load();
    } catch (err) { showNotif(err.response?.data?.message || 'Erreur suppression', 'error'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>{notif.msg}</div>}
      <div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-black text-white">🏢 Gestion des Dépôts</h1><p className="text-slate-400 text-sm mt-1">{depots.length} dépôt{depots.length !== 1 ? 's' : ''}{maxDepots < Infinity && <span> — Limite <span className="text-amber-400 font-bold">{maxDepots}</span></span>}</p></div>{perm.canCreate && <button onClick={openCreate} className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-5 py-2.5 rounded-xl text-sm">+ Nouveau Dépôt</button>}</div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div> : depots.length === 0 ? <div className="bg-slate-800/40 border border-dashed border-slate-700 rounded-2xl p-16 text-center"><p className="text-5xl mb-4">🏢</p><p className="text-slate-400 font-semibold">Aucun dépôt créé</p>{perm.canCreate && <button onClick={openCreate} className="mt-4 bg-amber-500 text-slate-900 font-bold px-5 py-2.5 rounded-xl text-sm">+ Créer un dépôt</button>}</div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{depots.map(d => <div key={d.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5"><div className="flex items-start justify-between mb-3"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-lg">🏢</div><div><h3 className="text-white font-bold">{d.nom}</h3><span className="text-xs text-slate-500">{d.codePrefix || 'DEP'}-{d.id?.slice(0, 6).toUpperCase() || 'N/A'}</span></div></div>{perm.canDelete && <button onClick={() => setConfirmDelete(d)} className="text-red-400 p-1.5">🗑️</button>}</div><div className="space-y-1.5 mt-4 pt-3 border-t border-slate-700/50">{d.emplacement && <p className="text-slate-400 text-sm">📍 {d.emplacement}</p>}{d.adresse && <p className="text-slate-400 text-sm">📮 {d.adresse}</p>}</div></div>)}</div>}
      <FormModal isOpen={formOpen} onClose={() => { setFormOpen(false); setQuotaAlert(null); }} onSubmit={handleSubmit} title="🏢 Nouveau Dépôt" loading={formLoading} submitLabel="Créer le dépôt" submitIcon="➕">
        {quotaAlert ? <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4"><p className="text-red-400 font-bold text-sm">⛔ Limite d'abonnement atteinte</p><p className="text-slate-300 text-xs my-2">{quotaAlert.message}</p><button type="button" onClick={() => { setFormOpen(false); navigate('/pricing'); }} className="w-full bg-amber-500 text-slate-900 font-bold px-4 py-2 rounded-lg text-xs">🚀 Mettre à niveau mon offre</button></div> : <><div className="grid grid-cols-2 gap-4"><input required placeholder="Nom du dépôt *" value={form.nom} onChange={setF('nom')} className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" /><input placeholder="Référence" value={form.codePrefix} onChange={setF('codePrefix')} className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" /></div><input required placeholder="Localisation *" value={form.emplacement} onChange={setF('emplacement')} className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm mt-4" /><input placeholder="Adresse" value={form.adresse} onChange={setF('adresse')} className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm mt-4" /></>}
      </FormModal>
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting} title="Supprimer le dépôt" message={`Supprimer « ${confirmDelete?.nom} » ? Cette action est irréversible et supprimera toutes les données liées.`} />
    </div>
  );
}
