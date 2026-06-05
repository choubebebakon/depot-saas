import { useState, useEffect } from 'react'; import api from '../../../api'; import { PERMISSIONS } from '../permissions'; import { usePermission } from '../../../shared/hooks/usePermission';
const FONCTIONS = ['Mécanicien', 'Électricien auto', 'Carrossier', 'Réceptionniste', 'Chef d\'atelier', 'Apprenti', 'Comptable'];
function ModalPersonnel({ onClose, onSuccess, edit }) {
  const [form, setForm] = useState({ nom: edit?.nom || '', prenom: edit?.prenom || '', fonction: edit?.fonction || 'Mécanicien', telephone: edit?.telephone || '', email: edit?.email || '', salaire: edit?.salaire || '' });
  const [loading, setLoading] = useState(false); const [erreur, setErreur] = useState('');
  const handleSubmit = async (e) => { e.preventDefault(); setLoading(true); try { if (edit) await api.patch(`/garage/personnel/${edit.id}`, form); else await api.post('/garage/personnel', form); onSuccess(); onClose(); } catch (err) { setErreur(err.response?.data?.message || 'Erreur'); } finally { setLoading(false); } };
  const inputClass = 'w-full bg-slate-800 border border-slate-600 focus:border-orange-500 text-white rounded-xl px-4 py-3 text-sm outline-none';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-lg shadow-2xl">
        <h3 className="text-white font-black text-xl mb-6">{edit ? '✏️ Modifier' : '👥 Nouvel'} Employé</h3>
        {erreur && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{erreur}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Nom *</label><input required value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} className={inputClass} /></div>
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Prénom</label><input value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} className={inputClass} /></div>
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Fonction</label><select value={form.fonction} onChange={e => setForm({...form, fonction: e.target.value})} className={inputClass}>{FONCTIONS.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Téléphone</label><input value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} className={inputClass} /></div>
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inputClass} /></div>
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Salaire (F)</label><input type="number" value={form.salaire} onChange={e => setForm({...form, salaire: e.target.value})} className={inputClass} /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all">{loading ? '⏳...' : edit ? 'Modifier' : 'Créer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default function PersonnelPage() {
  const [personnel, setPersonnel] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState(''); const [filtreFonction, setFiltreFonction] = useState('');
  const [showModal, setShowModal] = useState(false); const [editItem, setEditItem] = useState(null); const [notif, setNotif] = useState(null);
  const [page, setPage] = useState(1); const perm = usePermission(PERMISSIONS, 'personnel'); const itemsPerPage = 20;
  const load = async () => { setLoading(true); try { const res = await api.get('/garage/personnel'); setPersonnel(res.data?.data || res.data || []); } catch (_) {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };
  const filtres = personnel.filter(p => { const q = search.toLowerCase(); const matchSearch = !q || p.nom?.toLowerCase().includes(q) || p.prenom?.toLowerCase().includes(q) || p.fonction?.toLowerCase().includes(q); const matchF = !filtreFonction || p.fonction === filtreFonction; return matchSearch && matchF; });
  const totalPages = Math.ceil(filtres.length / itemsPerPage); const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-orange-600'}`}>{notif.msg}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">👥 Personnel</h1><p className="text-slate-400 text-sm mt-1">{personnel.length} employé{personnel.length !== 1 ? 's' : ''}</p></div>
        {perm.canCreate && <button onClick={() => { setEditItem(null); setShowModal(true); }} className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20">+ Nouvel Employé</button>}
      </div>
      <div className="flex gap-3 mb-6 flex-wrap">
        <input type="text" placeholder="🔍 Nom ou fonction..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-orange-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-60" />
        <select value={filtreFonction} onChange={e => { setFiltreFonction(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none"><option value="">Toutes fonctions</option>{FONCTIONS.map(f => <option key={f} value={f}>{f}</option>)}</select>
      </div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Employé</th><th className="text-left px-5 py-4">Fonction</th><th className="text-left px-5 py-4">Téléphone</th><th className="text-right px-5 py-4">Salaire</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={5} className="text-center py-16 text-slate-500">Aucun employé trouvé</td></tr>
              : paginated.map(p => (
                <tr key={p.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-400 font-black text-sm">{p.nom?.[0]?.toUpperCase()}</div><div><p className="text-white font-semibold text-sm">{p.nom} {p.prenom || ''}</p></div></div></td>
                  <td className="px-5 py-4"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">{p.fonction}</span></td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{p.telephone || '—'}</td>
                  <td className="px-5 py-4 text-right text-white font-mono font-bold">{(p.salaire || 0).toLocaleString('fr-FR')} F</td>
                  <td className="px-5 py-4 text-center">{perm.canEdit && <button onClick={() => { setEditItem(p); setShowModal(true); }} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">✏️</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} employé{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}
      {showModal && <ModalPersonnel onClose={() => setShowModal(false)} onSuccess={() => { showNotif(editItem ? 'Employé modifié ✓' : 'Employé créé ✓'); load(); }} edit={editItem} />}
    </div>
  );
}
