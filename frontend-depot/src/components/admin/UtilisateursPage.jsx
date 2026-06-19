import { useState, useEffect, useCallback } from 'react'; 
import api from '../../api';
import FormModal from '../../shared/components/forms/FormModal';
import ConfirmModal from '../../shared/components/forms/ConfirmModal';
import { useTenant } from '../../hooks/useTenant'; // 🆕 1. Import du hook (Ajuste le chemin si besoin)

const ROLE_OPTIONS = [
  { value: 'GERANT', label: 'Gérant' },
  { value: 'CAISSIER', label: 'Caissier' },
  { value: 'MAGASINIER', label: 'Magasinier' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'COMPTABLE', label: 'Comptable' },
  { value: 'ADMIN', label: 'Administrateur' },
];

export default function UtilisateursPage() {
  const { tenant } = useTenant(); // 🆕 2. Récupération de l'entreprise connectée

  const [users, setUsers] = useState([]);
  const [depots, setDepots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', password: '', role: 'GERANT', depotId: '', tenantId: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [notif, setNotif] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const metier = localStorage.getItem('gestock_metier') || '';
  const apiBase = metier.toLowerCase().replace(/_/g, '-');

  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // 🆕 On n'a plus besoin d'envoyer le tenantId, le backend le devine tout seul via le Token
      const [u, d] = await Promise.all([
        api.get(`/${apiBase}/utilisateurs`).catch(() => ({ data: [] })),
        api.get('/depots').catch(() => ({ data: [] })),
      ]);
      setUsers(u.data?.data || u.data || []);
      setDepots(d.data?.data || d.data || []);
    } catch { 
      setUsers([]); 
    } finally { 
      setLoading(false); 
    }
  }, [apiBase]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    // 🆕 5. On assigne automatiquement le nouvel utilisateur à l'entreprise en cours
    setForm({ nom: '', prenom: '', email: '', password: '', role: 'GERANT', depotId: '', tenantId: tenant?.id });
    setFormOpen(true);
  };

  const setF = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { showNotif('Email et mot de passe requis', 'error'); return; }
    setFormLoading(true);
    try {
      await api.post(`/${apiBase}/utilisateurs`, form);
      setFormOpen(false);
      showNotif('Utilisateur créé ✓');
      load();
    } catch (err) {
      showNotif(err.response?.data?.message || 'Erreur création', 'error');
    } finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/${apiBase}/utilisateurs/${confirmDelete.id}`);
      setConfirmDelete(null);
      showNotif('Utilisateur supprimé');
      load();
    } catch { showNotif('Erreur suppression', 'error'); } finally { setDeleting(false); }
  };

  const getDepotNom = (id) => depots.find(d => d.id === id)?.nom || '—';

  const filtre = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.nom?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtre.length / itemsPerPage);
  const paginated = filtre.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages || 1)));

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>{notif.msg}</div>}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">👤 Gestion des Utilisateurs</h1>
          <p className="text-slate-400 text-sm mt-1">{filtre.length} utilisateur{filtre.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate}
          className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20">
          + Nouvel Utilisateur
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <input type="text" placeholder="🔍 Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 focus:border-amber-500 text-white rounded-xl px-4 py-2 text-sm outline-none w-56" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="text-left px-5 py-4">Nom</th>
                <th className="text-left px-5 py-4">Prénom</th>
                <th className="text-left px-5 py-4">Email</th>
                <th className="text-left px-5 py-4">Poste</th>
                <th className="text-left px-5 py-4">Dépôt</th>
                <th className="text-center px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-slate-500">Aucun utilisateur</td></tr>
              ) : paginated.map(u => (
                <tr key={u.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-3 text-white font-semibold text-sm">{u.nom || '—'}</td>
                  <td className="px-5 py-3 text-slate-300 text-sm">{u.prenom || '—'}</td>
                  <td className="px-5 py-3 text-slate-300 text-sm">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">{u.role}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-sm">{getDepotNom(u.depotId)}</td>
                  <td className="px-5 py-3 text-center">
                    <button onClick={() => setConfirmDelete(u)}
                      className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 text-sm transition-colors">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtre.length} utilisateur{filtre.length !== 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, page - 2);
                  const p = start + i;
                  if (p > totalPages) return null;
                  return <button key={p} onClick={() => goToPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>;
                })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}

      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit}
        title="👤 Nouvel Utilisateur" loading={formLoading} submitLabel="Créer l'utilisateur" submitIcon="➕">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Nom *</label>
            <input required value={form.nom} onChange={setF('nom')}
              className="w-full bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none" />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Prénom</label>
            <input value={form.prenom} onChange={setF('prenom')}
              className="w-full bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none" />
          </div>
        </div>
        <div>
          <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Email (identifiant) *</label>
          <input required type="email" value={form.email} onChange={setF('email')}
            className="w-full bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none" />
        </div>
        <div>
          <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Mot de passe *</label>
          <input required type="password" minLength={6} value={form.password} onChange={setF('password')}
            className="w-full bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Poste *</label>
            <select required value={form.role} onChange={setF('role')}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm outline-none">
              {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Dépôt</label>
            <select value={form.depotId} onChange={setF('depotId')}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm outline-none">
              <option value="">Sélectionner un dépôt</option>
              {depots.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
            </select>
          </div>
        </div>
      </FormModal>

      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer l'utilisateur" message={`Supprimer « ${confirmDelete?.nom || confirmDelete?.email} » ? Cette action est irréversible.`} />
    </div>
  );
}