import { useState, useEffect, useCallback } from 'react'; import api from '../../../api'; import { PERMISSIONS } from '../permissions'; import { usePermission } from '../../../shared/hooks/usePermission'; import FormModal from '../../../shared/components/forms/FormModal'; import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
const inputClass = 'w-full bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none';
export default function CategoriesPage() {
  const [categories, setCategories] = useState([]); const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null); const [confirmDelete, setConfirmDelete] = useState(null); const [deleting, setDeleting] = useState(false); const [notif, setNotif] = useState(null);
  const [form, setForm] = useState({ nom: '', description: '' }); const [saving, setSaving] = useState(false);
  const perm = usePermission(PERMISSIONS, 'categories');
  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/quincaillerie/categories'); setCategories(res.data?.data || res.data || []); } catch (_) {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };
  const openCreate = () => { setEditItem(null); setForm({ nom: '', description: '' }); setFormOpen(true); };
  const openEdit = (c) => { setEditItem(c); setForm({ nom: c.nom || '', description: c.description || '' }); setFormOpen(true); };
  const handleSubmit = async (e) => { e.preventDefault(); setSaving(true); try { if (editItem) await api.patch(`/quincaillerie/categories/${editItem.id}`, form); else await api.post('/quincaillerie/categories', form); setFormOpen(false); showNotif(editItem ? 'Catégorie modifiée ✓' : 'Catégorie créée ✓'); load(); } catch (err) { showNotif(err.response?.data?.message || 'Erreur', 'error'); } finally { setSaving(false); } };
  const handleDelete = async () => { if (!confirmDelete) return; setDeleting(true); try { await api.delete(`/quincaillerie/categories/${confirmDelete.id}`); showNotif('Catégorie supprimée ✓'); setConfirmDelete(null); load(); } catch { showNotif('Erreur lors de la suppression', 'error'); } finally { setDeleting(false); } };
  const setF = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-amber-600'}`}>{notif.msg}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">📁 Catégories</h1><p className="text-slate-400 text-sm mt-1">{categories.length} catégorie{categories.length !== 1 ? 's' : ''}</p></div>
        {perm.canCreate && <button onClick={openCreate} className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-600/20">+ Nouvelle Catégorie</button>}
      </div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.length === 0 ? <p className="text-slate-500 col-span-full text-center py-16">Aucune catégorie</p>
          : categories.map(c => (
            <div key={c.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 hover:border-amber-600/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-bold text-sm">{c.nom}</h3>
                <div className="flex items-center gap-1">{perm.canEdit && <button onClick={() => openEdit(c)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 text-xs">✏️</button>}{perm.canDelete && <button onClick={() => setConfirmDelete(c)} className="text-slate-400 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 text-xs">🗑️</button>}</div>
              </div>
              {c.description && <p className="text-slate-400 text-xs">{c.description}</p>}
            </div>
          ))}
        </div>
      )}
      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title={editItem ? '✏️ Modifier Catégorie' : '📁 Nouvelle Catégorie'} loading={saving} submitLabel={editItem ? 'Modifier' : 'Créer'}>
        <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Nom *</label><input required value={form.nom} onChange={setF('nom')} className={inputClass} /></div>
        <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Description</label><textarea value={form.description} onChange={setF('description')} className={inputClass} rows={2} /></div>
      </FormModal>
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting} title="Supprimer la catégorie" message={`Supprimer « ${confirmDelete?.nom} » ? Cette action est irréversible.`} />
    </div>
  );
}
