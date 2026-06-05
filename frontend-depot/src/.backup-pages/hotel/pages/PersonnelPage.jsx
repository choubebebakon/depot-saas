import { useState, useEffect, useCallback } from 'react'; import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

const FONCTIONS = ['Réceptionniste', 'Femme/Homme de ménage', 'Serveur/Serveuse', 'Cuisinier', 'Groom', 'Concierge', 'Gardien', 'Comptable', 'Directeur'];

const inputClass = 'w-full bg-slate-800 border border-slate-600 focus:border-violet-500 text-white rounded-xl px-4 py-3 text-sm outline-none';

export default function PersonnelPage() {
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtreFonction, setFiltreFonction] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ nom: '', telephone: '', email: '', fonction: '', salaire: '', dateEmbauche: '', statut: 'Actif' });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const load = useCallback(async () => { setLoading(true);
    try { const res = await api.get('/hotel/personnel'); setPersonnel(res.data?.data || res.data || []); }
    catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditItem(null); setForm({ nom: '', telephone: '', email: '', fonction: '', salaire: '', dateEmbauche: '', statut: 'Actif' }); setFormOpen(true); };
  const openEdit = (p) => { setEditItem(p); setForm({ nom: p.nom || '', telephone: p.telephone || '', email: p.email || '', fonction: p.fonction || '', salaire: p.salaire || '', dateEmbauche: p.dateEmbauche || '', statut: p.statut || 'Actif' }); setFormOpen(true); };

  const handleSubmit = async (e) => { e.preventDefault(); setSaving(true);
    try { if (editItem) await api.patch(`/hotel/personnel/${editItem.id}`, form); else await api.post('/hotel/personnel', form); setFormOpen(false); load(); }
    catch { alert('Erreur'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return; setDeleting(true);
    try { await api.delete(`/hotel/personnel/${confirmDelete.id}`); setConfirmDelete(null); load(); }
    catch { alert('Erreur lors de la suppression'); } finally { setDeleting(false); }
  };

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const filtres = personnel.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.nom?.toLowerCase().includes(q) || p.fonction?.toLowerCase().includes(q);
    const matchFonction = !filtreFonction || p.fonction === filtreFonction;
    return matchSearch && matchFonction;
  });

  const totalPages = Math.ceil(filtres.length / itemsPerPage);
  const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">👨‍💼 Personnel</h1>
          <p className="text-slate-400 text-sm mt-1">{personnel.length} membre{personnel.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate}
          className="bg-violet-500 hover:bg-violet-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-violet-500/20">
          + Nouveau Membre
        </button>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <input type="text" placeholder="🔍 Nom ou fonction..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 focus:border-violet-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-60" />
        <select value={filtreFonction} onChange={e => { setFiltreFonction(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none">
          <option value="">Toutes fonctions</option>
          {FONCTIONS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="text-left px-5 py-4">Membre</th>
                <th className="text-left px-5 py-4">Fonction</th>
                <th className="text-right px-5 py-4">Salaire</th>
                <th className="text-center px-5 py-4">Téléphone</th>
                <th className="text-center px-5 py-4">Statut</th>
                <th className="text-center px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-slate-500">Aucun membre trouvé</td></tr>
              ) : paginated.map(p => (
                <tr key={p.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-violet-500/20 rounded-xl flex items-center justify-center text-violet-400 font-black text-sm">{p.nom?.[0]?.toUpperCase()}</div>
                      <span className="text-white font-semibold text-sm">{p.nom}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{p.fonction || '—'}</td>
                  <td className="px-5 py-4 text-right text-white font-mono font-bold">{(p.salaire || 0).toLocaleString('fr-FR')} F</td>
                  <td className="px-5 py-4 text-center text-slate-300 text-sm font-mono">{p.telephone || '—'}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.statut === 'Actif' ? 'bg-emerald-500/20 text-emerald-400' : p.statut === 'Congé' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{p.statut || 'Actif'}</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(p)}
                        className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">✏️</button>
                      <button onClick={() => setConfirmDelete(p)}
                        className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} membre{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, page - 2); const p = start + i;
                  if (p > totalPages) return null;
                  return (<button key={p} onClick={() => goToPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-violet-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>);
                })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}

      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title={editItem ? '✏️ Modifier membre' : '👨‍💼 Nouveau membre'} loading={saving} submitLabel={editItem ? 'Modifier' : 'Créer'}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Nom *</label><input required value={form.nom} onChange={set('nom')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Téléphone</label><input value={form.telephone} onChange={set('telephone')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Email</label><input type="email" value={form.email} onChange={set('email')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Fonction</label><select value={form.fonction} onChange={set('fonction')} className={inputClass}>{FONCTIONS.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Salaire (F)</label><input type="number" value={form.salaire} onChange={set('salaire')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Date d'embauche</label><input type="date" value={form.dateEmbauche} onChange={set('dateEmbauche')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Statut</label><select value={form.statut} onChange={set('statut')} className={inputClass}><option>Actif</option><option>Inactif</option><option>Congé</option></select></div>
        </div>
      </FormModal>

      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer le membre" message={`Supprimer « ${confirmDelete?.nom} » ? Cette action est irréversible.`} />
    </div>
  );
}
