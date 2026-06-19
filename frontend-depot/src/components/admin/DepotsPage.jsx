import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // 👈 Ajout de useNavigate pour une navigation fluide
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../shared/hooks/usePermission';
import FormModal from '../../shared/components/forms/FormModal';
import ConfirmModal from '../../shared/components/forms/ConfirmModal';

const PLAN_DEPOT_LIMITS = {
  FREE: 1, TRIAL: 1, SOLO: 1, BASIC: 1,
  PME: 3, PREMIUM: 5, ENTERPRISE: 20, UNLIMITED: Infinity,
};

const ADMIN_PERMS = {
  PATRON: { canView: ['*'], canCreate: ['*'], canEdit: ['*'], canDelete: ['*'] },
  GERANT: { canView: ['depots', 'utilisateurs'], canCreate: ['depots'], canEdit: [], canDelete: ['depots'] },
};

export default function DepotsPage() {
  const { metier: metierParam } = useParams();
  const { metier: metierCtx, user } = useAuth();
  const navigate = useNavigate(); // 👈 Pour rediriger proprement sans recharger la page
  
  const metier = metierParam || metierCtx || localStorage.getItem('gestock_metier') || '';
  const apiBase = metier.toLowerCase().replace(/_/g, '-');
  
  // 🔥 CORRECTION : On vérifie 'planType' OU 'plan' selon ce que renvoie ton JWT
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
    setLoading(true);
    try {
      const res = await api.get(`/${apiBase}/depots`);
      const list = res.data?.data || res.data || [];
      setDepots(list);
    } catch { setDepots([]); } finally { setLoading(false); }
  }, [apiBase]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setQuotaAlert(null);
    if (depots.length >= maxDepots) {
      setQuotaAlert({
        message: `Limite d'abonnement atteinte (${depots.length}/${maxDepots}). Veuillez mettre à niveau votre offre pour ajouter un dépôt.`,
        current: depots.length,
        limit: maxDepots,
        plan: planType,
      });
      setFormOpen(true);
      return;
    }
    setForm({ nom: '', codePrefix: '', emplacement: '', adresse: '' });
    setFormOpen(true);
  };

  const setF = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nom) { showNotif('Le nom du dépôt est requis', 'error'); return; }
    setFormLoading(true);
    try {
      await api.post(`/${apiBase}/depots`, form);
      setFormOpen(false);
      showNotif('Dépôt créé ✓');
      load();
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.error === 'QUOTA_REACHED') {
        const meta = err.response.data.metadata || {};
        setQuotaAlert({
          message: err.response.data.message || `Quota atteint (${meta.current || depots.length}/${meta.limit || maxDepots})`,
          current: meta.current || depots.length,
          limit: meta.limit || maxDepots,
          plan: meta.currentPlan || planType,
          suggestedPlan: meta.suggestedPlan || 'PREMIUM',
        });
      } else {
        showNotif(err.response?.data?.message || 'Erreur création dépôt', 'error');
      }
    } finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/${apiBase}/depots/${confirmDelete.id}`);
      setConfirmDelete(null);
      showNotif('Dépôt supprimé');
      load();
    } catch { showNotif('Erreur suppression', 'error'); } finally { setDeleting(false); }
  };

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>{notif.msg}</div>}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">🏢 Gestion des Dépôts</h1>
          <p className="text-slate-400 text-sm mt-1">
            {depots.length} dépôt{depots.length !== 1 ? 's' : ''}
            {maxDepots < Infinity && <span> — Limite <span className="text-amber-400 font-bold">{maxDepots}</span></span>}
          </p>
        </div>
        {perm.canCreate && (
          <button onClick={openCreate}
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20">
            + Nouveau Dépôt
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : depots.length === 0 ? (
        <div className="bg-slate-800/40 border border-dashed border-slate-700 rounded-2xl p-16 text-center">
          <p className="text-5xl mb-4">🏢</p>
          <p className="text-slate-400 font-semibold">Aucun dépôt créé</p>
          <p className="text-slate-500 text-sm mt-1">Commencez par créer votre premier dépôt</p>
          {perm.canCreate && (
            <button onClick={openCreate}
              className="mt-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-5 py-2.5 rounded-xl text-sm transition-all">
              + Créer un dépôt
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {depots.map(d => (
            <div key={d.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-lg">🏢</div>
                  <div>
                    <h3 className="text-white font-bold text-base">{d.nom}</h3>
                    <span className="text-xs text-slate-500">{d.codePrefix || 'DEP'}-{d.id?.slice(0, 6).toUpperCase() || 'N/A'}</span>
                  </div>
                </div>
                {perm.canDelete && (
                  <button onClick={() => setConfirmDelete(d)}
                    className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 text-sm transition-colors">🗑️</button>
                )}
              </div>
              <div className="space-y-1.5 mt-4 pt-3 border-t border-slate-700/50">
                {d.emplacement && (
                  <p className="text-slate-400 text-sm flex items-center gap-2">
                    <span className="text-slate-600">📍</span> {d.emplacement}
                  </p>
                )}
                {d.adresse && (
                  <p className="text-slate-400 text-sm flex items-center gap-2">
                    <span className="text-slate-600">📮</span> {d.adresse}
                  </p>
                )}
                {!d.emplacement && !d.adresse && (
                  <p className="text-slate-600 text-xs italic">Aucune information supplémentaire</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <FormModal isOpen={formOpen} onClose={() => { setFormOpen(false); setQuotaAlert(null); }} onSubmit={handleSubmit}
        title="🏢 Nouveau Dépôt" loading={formLoading} submitLabel="Créer le dépôt" submitIcon="➕">
        {quotaAlert && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-2">
            <p className="text-red-400 font-bold text-sm mb-1">⛔ Limite d'abonnement atteinte</p>
            <p className="text-slate-300 text-xs mb-2">{quotaAlert.message}</p>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
              <span>Plan : <strong className="text-white">{quotaAlert.plan}</strong></span>
              <span className="text-slate-600">|</span>
              <span>Dépôts : <strong className="text-red-400">{quotaAlert.current}/{quotaAlert.limit}</strong></span>
            </div>
            {/* 🔥 CORRECTION : Utilisation d'un bouton de navigation interne fluide au lieu du lien mort */}
            <button 
              type="button"
              onClick={() => { setFormOpen(false); navigate('/depot/abonnement'); }}
              className="w-full text-center bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-4 py-2 rounded-lg text-xs transition-colors">
              🚀 Mettre à niveau mon offre
            </button>
          </div>
        )}
        {!quotaAlert && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Nom du dépôt *</label>
                <input required value={form.nom} onChange={setF('nom')}
                  className="w-full bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none" />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Référence</label>
                <input value={form.codePrefix} onChange={setF('codePrefix')}
                  placeholder="Ex: DEP-001"
                  className="w-full bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none" />
              </div>
            </div>
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Localisation *</label>
              <input required value={form.emplacement} onChange={setF('emplacement')}
                placeholder="Ex: Zone industrielle, Bâtiment A"
                className="w-full bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none" />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Adresse</label>
              <input value={form.adresse} onChange={setF('adresse')}
                placeholder="Ex: 123 Rue du Commerce"
                className="w-full bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none" />
            </div>
          </>
        )}
      </FormModal>

      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer le dépôt" message={`Supprimer « ${confirmDelete?.nom} » ? Cette action est irréversible et supprimera toutes les données liées.`} />
    </div>
  );
}