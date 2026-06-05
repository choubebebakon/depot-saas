import { useState, useEffect, useCallback } from 'react';
import api from '../../../api';
import { PERMISSIONS } from '../permissions';
import { usePermission } from '../../../shared/hooks/usePermission';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

const FAMILLES_MEDICAMENTS = ['Antibiotique', 'Antalgique', 'Anti-inflammatoire', 'Antihypertenseur', 'Antidiabétique', 'Vitamine', 'Antipaludéen', 'Autre'];

export default function MedicamentsPage() {
  const [medicaments, setMedicaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtreFamille, setFiltreFamille] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [notif, setNotif] = useState(null);
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState({ nom: '', famille: 'Autre', dosage: '', prix: '', stock: '', seuilAlerte: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const perm = usePermission(PERMISSIONS, 'medicaments');
  const itemsPerPage = 20;

  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/clinique/medicaments'); setMedicaments(res.data?.data || res.data || []); } catch (_) {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (formOpen && editItem) setFormData({ nom: editItem.nom || '', famille: editItem.famille || 'Autre', dosage: editItem.dosage || '', prix: editItem.prix || '', stock: editItem.stock || '', seuilAlerte: editItem.seuilAlerte || '' });
    if (formOpen && !editItem) setFormData({ nom: '', famille: 'Autre', dosage: '', prix: '', stock: '', seuilAlerte: '' });
  }, [formOpen, editItem]);
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try { await api.patch(`/clinique/medicaments/${confirmDelete.id}`, { actif: false }); showNotif('Médicament supprimé ✓'); setConfirmDelete(null); load(); }
    catch (_) { showNotif('Erreur lors de la suppression', 'error'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormLoading(true);
    try {
      if (editItem) await api.patch(`/clinique/medicaments/${editItem.id}`, formData);
      else await api.post('/clinique/medicaments', formData);
      showNotif(editItem ? 'Médicament modifié ✓' : 'Médicament créé ✓');
      setFormOpen(false); load();
    } catch (err) { setFormErrors({ general: err.response?.data?.message || 'Erreur' }); }
    finally { setFormLoading(false); }
  };

  const set = (f) => (e) => setFormData({ ...formData, [f]: e.target.value });

  const filtres = medicaments.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.nom?.toLowerCase().includes(q) || m.famille?.toLowerCase().includes(q);
    const matchFamille = !filtreFamille || m.famille === filtreFamille;
    return matchSearch && matchFamille;
  });
  const totalPages = Math.ceil(filtres.length / itemsPerPage);
  const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-sky-600'}`}>{notif.msg}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">💊 Médicaments</h1><p className="text-slate-400 text-sm mt-1">{medicaments.length} médicament{medicaments.length !== 1 ? 's' : ''}</p></div>
        {perm.canCreate && <button onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-sky-500 hover:bg-sky-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-sky-500/20">+ Nouveau Médicament</button>}
      </div>
      <div className="flex gap-3 mb-6 flex-wrap">
        <input type="text" placeholder="🔍 Médicament..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-sky-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-60" />
        <select value={filtreFamille} onChange={e => { setFiltreFamille(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none"><option value="">Toutes familles</option>{FAMILLES_MEDICAMENTS.map(f => <option key={f} value={f}>{f}</option>)}</select>
      </div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Médicament</th><th className="text-left px-5 py-4">Famille</th><th className="text-right px-5 py-4">Prix</th><th className="text-center px-5 py-4">Stock</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={5} className="text-center py-16 text-slate-500">Aucun médicament trouvé</td></tr>
              : paginated.map(m => (
                <tr key={m.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-sky-500/20 rounded-xl flex items-center justify-center text-sky-400 font-black text-sm">{m.nom?.[0]?.toUpperCase()}</div><div><p className="text-white font-semibold text-sm">{m.nom}</p>{m.dosage && <p className="text-slate-500 text-xs">{m.dosage}</p>}</div></div></td>
                  <td className="px-5 py-4"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400">{m.famille}</span></td>
                  <td className="px-5 py-4 text-right text-white font-mono font-bold">{(m.prix || 0).toLocaleString('fr-FR')} F</td>
                  <td className={`px-5 py-4 text-center font-mono font-bold text-sm ${(m.stock || 0) <= (m.seuilAlerte || 0) ? 'text-red-400' : 'text-white'}`}>{m.stock || 0}</td>
                  <td className="px-5 py-4 text-center">{perm.canEdit && <button onClick={() => { setEditItem(m); setFormOpen(true); }} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">✏️</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} médicament{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}
      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title={editItem ? '✏️ Modifier médicament' : '💊 Nouveau médicament'} loading={formLoading} submitLabel={editItem ? 'Modifier' : 'Créer'}>
        {formErrors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{formErrors.general}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-2"><FormField label="Nom" name="nom" value={formData.nom} onChange={set('nom')} required placeholder="Nom du médicament" /></div>
          <FormField label="Famille" name="famille" type="select" value={formData.famille} onChange={set('famille')} options={FAMILLES_MEDICAMENTS} />
          <FormField label="Dosage" name="dosage" value={formData.dosage} onChange={set('dosage')} placeholder="500mg" />
          <FormField label="Prix" name="prix" type="number" value={formData.prix} onChange={set('prix')} min={0} unit="FCFA" />
          <FormField label="Stock" name="stock" type="number" value={formData.stock} onChange={set('stock')} min={0} />
          <FormField label="Seuil alerte" name="seuilAlerte" type="number" value={formData.seuilAlerte} onChange={set('seuilAlerte')} min={0} />
        </div>
      </FormModal>
      {confirmDelete && (
        <ConfirmModal
          isOpen={!!confirmDelete}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          title="Supprimer le médicament"
          message={`Êtes-vous sûr de vouloir supprimer "${confirmDelete.nom}" ?`}
        />
      )}
    </div>
  );
}
