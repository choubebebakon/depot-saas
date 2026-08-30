import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { useDepot } from '../../../contexts/DepotContext';
import { useNotif } from '../../../context/NotifContext';
import { usePermission } from '../../../shared/hooks/usePermission';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
import { Package, AlertTriangle, Clock, CheckCircle, XCircle, Plus } from 'lucide-react';

// ── Statut DLC ───────────────────────────────────────────────────────────────
function getStatutDLC(dlc) {
  if (!dlc) return 'ok';
  const now = new Date();
  const diff = Math.floor((new Date(dlc) - now) / 86400000);
  if (diff < 0) return 'expire';
  if (diff < 7) return 'urgent';
  if (diff < 30) return 'bientot';
  return 'ok';
}

const DLC_COLORS = {
  expire:  { bg: 'bg-red-500/15 text-red-400 border border-red-500/30',    icon: <XCircle className="w-3 h-3" />,      label: 'Expiré' },
  urgent:  { bg: 'bg-amber-500/15 text-amber-400 border border-amber-500/30', icon: <AlertTriangle className="w-3 h-3" />, label: '< 7 j' },
  bientot: { bg: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30', icon: <Clock className="w-3 h-3" />,  label: '< 30 j' },
  ok:      { bg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30', icon: <CheckCircle className="w-3 h-3" />, label: 'OK' },
};

// ── Formulaire Lot ───────────────────────────────────────────────────────────
function LotForm({ isOpen, onClose, onSuccess, edit, metier }) {
  const depot = useDepot();
  const depotId = depot?.depotId ?? depot?.depotActif?.id ?? '';
  const [form, setForm] = useState({
    articleId: '',
    numeroLot: '',
    dlc: '',
    quantite: 1,
    ...( edit ? {
      articleId: edit.articleId || '',
      numeroLot: edit.numeroLot || '',
      dlc: edit.dlc ? new Date(edit.dlc).toISOString().slice(0, 10) : '',
      quantite: edit.quantite || 1,
    } : {}),
  });
  const [errors, setErrors] = useState({});

  // Articles disponibles
  const { data: articlesData } = useQuery({
    queryKey: ['lots-articles', metier],
    queryFn: async () => {
      const res = await api.get(`/${metier}/articles`, { params: { limit: 200 } });
      return res.data?.data || res.data || [];
    },
  });

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        articleId: data.articleId,
        depotId,
        quantite: parseInt(data.quantite),
        numeroLot: data.numeroLot || undefined,
        dlc: data.dlc || undefined,
      };
      if (edit) return api.put(`/dlc/lots/${edit.id}`, payload);
      return api.post('/dlc/lots', payload);
    },
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (err) => setErrors({ general: err.response?.data?.message || 'Erreur' }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.articleId) errs.articleId = 'Article requis';
    if (!form.quantite || form.quantite < 1) errs.quantite = 'Quantité invalide';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    mutation.mutate(form);
  };

  const articles = Array.isArray(articlesData) ? articlesData : [];

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={edit ? '✏️ Modifier le lot' : '🏷️ Nouveau lot'}
      loading={mutation.isPending}
      size="md"
      submitLabel={edit ? 'Modifier' : 'Créer'}
    >
      {errors.general && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>
      )}
      <div>
        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block">Article *</label>
        <select
          value={form.articleId}
          onChange={set('articleId')}
          disabled={mutation.isPending}
          className="w-full bg-slate-800 border border-slate-700 focus:border-cyan-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none"
        >
          <option value="">Sélectionner un article</option>
          {articles.map(a => (
            <option key={a.id} value={a.id}>{a.designation}</option>
          ))}
        </select>
        {errors.articleId && <span className="text-red-400 text-xs mt-1 block">{errors.articleId}</span>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <FormField
          label="Numéro de lot"
          name="numeroLot"
          value={form.numeroLot}
          onChange={set('numeroLot')}
          placeholder="Ex: LOT-2026-001"
        />
        <FormField
          label="Date d'expiration (DLC)"
          name="dlc"
          type="date"
          value={form.dlc}
          onChange={set('dlc')}
        />
      </div>
      <div className="mt-4">
        <FormField
          label="Quantité *"
          name="quantite"
          type="number"
          value={form.quantite}
          onChange={set('quantite')}
          min={1}
          required
          error={errors.quantite}
        />
      </div>
    </FormModal>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────
export default function LotsPage({ metier = 'depot' }) {
  const depot = useDepot();
  const depotId = depot?.depotId ?? depot?.depotActif?.id ?? null;
  const queryClient = useQueryClient();
  const notif = useNotif();
  const perm = usePermission('stock');

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filterStatut, setFilterStatut] = useState('tous');

  const { data: lots = [], isLoading } = useQuery({
    queryKey: ['dlc-lots', depotId],
    queryFn: async () => {
      const res = await api.get('/dlc/lots', { params: { depotId } });
      return res.data || [];
    },
    enabled: !!depotId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/dlc/lots/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dlc-lots'] });
      notif.success('Lot supprimé');
      setConfirmDelete(null);
    },
    onError: (err) => notif.error(err.response?.data?.message || 'Erreur'),
  });

  // Filtrage
  const filtered = (lots || []).filter(l => {
    const matchSearch = !search || [l.article?.designation, l.numeroLot].join(' ').toLowerCase().includes(search.toLowerCase());
    const statut = getStatutDLC(l.dlc);
    const matchStatut = filterStatut === 'tous' || statut === filterStatut;
    return matchSearch && matchStatut;
  });

  // Stats rapides
  const stats = {
    total: lots.length,
    expire: lots.filter(l => getStatutDLC(l.dlc) === 'expire').length,
    urgent: lots.filter(l => getStatutDLC(l.dlc) === 'urgent').length,
    bientot: lots.filter(l => getStatutDLC(l.dlc) === 'bientot').length,
  };

  if (!depotId) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="text-center space-y-3">
          <Package className="w-12 h-12 mx-auto text-slate-500" />
          <p className="text-white font-bold text-lg">Aucun dépôt sélectionné</p>
          <p className="text-slate-400 text-sm">Sélectionnez un dépôt actif pour gérer les lots.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Package className="w-7 h-7 text-cyan-400" /> Lots & DLC
          </h1>
          <p className="text-slate-400 text-sm mt-1">{filtered.length} lot{filtered.length !== 1 ? 's' : ''} affiché{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        {perm.canWrite && (
          <button
            onClick={() => { setEditItem(null); setFormOpen(true); }}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-cyan-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nouveau lot
          </button>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { key: 'tous',    label: 'Total',    count: stats.total,   color: 'text-white',         bg: 'bg-slate-800/60 border-slate-700/50' },
          { key: 'expire',  label: 'Expirés',  count: stats.expire,  color: 'text-red-400',       bg: 'bg-red-500/10 border-red-500/20' },
          { key: 'urgent',  label: '< 7 jours',count: stats.urgent,  color: 'text-amber-400',     bg: 'bg-amber-500/10 border-amber-500/20' },
          { key: 'bientot', label: '< 30 jours',count: stats.bientot,color: 'text-yellow-400',   bg: 'bg-yellow-500/10 border-yellow-500/20' },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setFilterStatut(s.key)}
            className={`${s.bg} border rounded-2xl p-4 text-left transition-all ${filterStatut === s.key ? 'ring-2 ring-cyan-500/40' : ''}`}
          >
            <p className="text-xs text-slate-400 uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.count}</p>
          </button>
        ))}
      </div>

      {/* Barre de recherche */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="🔍 Rechercher par article ou numéro de lot..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-slate-800 border border-slate-700 focus:border-cyan-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none flex-1"
        />
      </div>

      {/* Tableau */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="text-left px-5 py-4">Article</th>
                <th className="text-left px-5 py-4">N° Lot</th>
                <th className="text-center px-5 py-4">DLC</th>
                <th className="text-right px-5 py-4">Qté</th>
                <th className="text-center px-5 py-4">Statut</th>
                {perm.canWrite && <th className="text-center px-5 py-4">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={perm.canWrite ? 6 : 5} className="text-center py-16 text-slate-500">
                    Aucun lot trouvé
                  </td>
                </tr>
              ) : filtered.map(l => {
                const statut = getStatutDLC(l.dlc);
                const dlcStyle = DLC_COLORS[statut];
                const dlcDate = l.dlc ? new Date(l.dlc).toLocaleDateString('fr-FR') : '—';
                return (
                  <tr key={l.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-5 py-4 text-white font-semibold text-sm">{l.article?.designation || '—'}</td>
                    <td className="px-5 py-4 text-slate-300 text-sm font-mono">{l.numeroLot || '—'}</td>
                    <td className="px-5 py-4 text-center text-slate-300 text-sm">{dlcDate}</td>
                    <td className="px-5 py-4 text-right text-white font-bold text-sm">{l.quantite ?? 0}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${dlcStyle.bg}`}>
                        {dlcStyle.icon} {dlcStyle.label}
                      </span>
                    </td>
                    {perm.canWrite && (
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => { setEditItem(l); setFormOpen(true); }}
                            className="text-slate-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-slate-700 text-xs transition-colors"
                          >
                            ✏️ Modifier
                          </button>
                          <button
                            onClick={() => setConfirmDelete(l)}
                            className="text-slate-400 hover:text-red-400 px-2 py-1.5 rounded-lg hover:bg-red-500/10 text-xs transition-colors"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Formulaire */}
      {formOpen && (
        <LotForm
          isOpen={formOpen}
          onClose={() => setFormOpen(false)}
          onSuccess={() => {
            notif.success(editItem ? 'Lot modifié' : 'Lot créé avec succès');
            queryClient.invalidateQueries({ queryKey: ['dlc-lots'] });
          }}
          edit={editItem}
          metier={metier}
        />
      )}

      {/* Confirmation suppression */}
      {confirmDelete && (
        <ConfirmModal
          isOpen={!!confirmDelete}
          onConfirm={() => deleteMutation.mutate(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
          title="Supprimer le lot"
          message={`Êtes-vous sûr de vouloir supprimer le lot "${confirmDelete.numeroLot || confirmDelete.id}" ?`}
        />
      )}
    </div>
  );
}
