import { useState, useEffect } from 'react';
import api from '../../../api';
import { PERMISSIONS } from '../permissions';
import { usePermission } from '../../../shared/hooks/usePermission';

export default function StockPage() {
  const [medicaments, setMedicaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [familleFiltre, setFamilleFiltre] = useState('');
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState({});
  const [notif, setNotif] = useState(null);
  const [page, setPage] = useState(1);
  const perm = usePermission(PERMISSIONS, 'stock');
  const itemsPerPage = 20;

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pharmacie/medicaments');
      setMedicaments(res.data?.data || res.data || []);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };

  const filtres = medicaments.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.designation?.toLowerCase().includes(q) || m.famille?.toLowerCase().includes(q);
    const matchFamille = !familleFiltre || m.famille === familleFiltre;
    return matchSearch && matchFamille;
  });

  const totalPages = Math.ceil(filtres.length / itemsPerPage);
  const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  const totalValeur = filtres.reduce((s, m) => s + (m.stock || 0) * (m.prixAchat || m.prix || 0), 0);
  const ruptureCount = filtres.filter(m => (m.stock || 0) <= 0).length;
  const faibleCount = filtres.filter(m => m.stock > 0 && m.stock <= (m.seuilAlerte || 10)).length;
  const expireCount = filtres.filter(m => m.dateExpiration && new Date(m.dateExpiration) <= new Date()).length;

  const handleStockEdit = (id, val) => setEdits(prev => ({ ...prev, [id]: val }));

  const saveStock = async (med) => {
    const newStock = parseInt(edits[med.id]);
    if (isNaN(newStock)) return;
    setSaving(prev => ({ ...prev, [med.id]: true }));
    try {
      await api.patch(`/pharmacie/medicaments/${med.id}`, { stock: newStock });
      showNotif(`Stock de "${med.designation}" mis à jour ✓`);
      setEdits(prev => { const e = { ...prev }; delete e[med.id]; return e; });
      load();
    } catch (_) { showNotif('Erreur', 'error'); }
    finally { setSaving(prev => ({ ...prev, [med.id]: false })); }
  };

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>{notif.msg}</div>}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">📦 Stock</h1>
          <p className="text-slate-400 text-sm mt-1">{medicaments.length} référence{medicaments.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
          <p className="text-emerald-400 font-black text-xl">{totalValeur.toLocaleString('fr-FR')} F</p>
          <p className="text-slate-400 text-xs mt-1 font-bold uppercase">Valeur Stock</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
          <p className="text-amber-400 font-black text-xl">{faibleCount}</p>
          <p className="text-slate-400 text-xs mt-1 font-bold uppercase">Stock Faible</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
          <p className="text-red-400 font-black text-xl">{ruptureCount}</p>
          <p className="text-slate-400 text-xs mt-1 font-bold uppercase">Rupture</p>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 text-center">
          <p className="text-purple-400 font-black text-xl">{expireCount}</p>
          <p className="text-slate-400 text-xs mt-1 font-bold uppercase">Expiré</p>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <input type="text" placeholder="🔍 Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 focus:border-emerald-500 text-white rounded-xl px-4 py-2 text-sm outline-none w-64" />
        <select value={familleFiltre} onChange={e => { setFamilleFiltre(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm outline-none">
          <option value="">Toutes familles</option>
          {['Antibiotiques','Antalgiques','Anti-inflammatoires','Vitamines','Cardiovasculaires','Autre'].map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="text-left px-5 py-4">Médicament</th>
                <th className="text-left px-5 py-4">Lot</th>
                <th className="text-right px-5 py-4">Stock Système</th>
                <th className="text-right px-5 py-4">Stock Réel</th>
                <th className="text-right px-5 py-4">Valeur</th>
                <th className="text-center px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-slate-500">Aucun produit trouvé</td></tr>
              ) : paginated.map(m => {
                const stockActuel = m.stock || 0;
                const editVal = edits[m.id];
                const isEditing = editVal !== undefined;
                const isDirty = isEditing && parseInt(editVal) !== stockActuel;
                const valeur = stockActuel * (m.prixAchat || m.prix || 0);

  return (
                  <tr key={m.id} className={`hover:bg-slate-700/20 transition-colors ${stockActuel <= 0 ? 'bg-red-500/5' : stockActuel <= (m.seuilAlerte || 10) ? 'bg-amber-500/5' : ''}`}>
                    <td className="px-5 py-3">
                      <p className="text-white font-semibold text-sm">{m.designation}</p>
                      <p className="text-slate-500 text-xs">{m.dosage || ''}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-300 text-sm font-mono">{m.numeroLot || '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`font-bold text-sm ${stockActuel <= 0 ? 'text-red-400' : stockActuel <= (m.seuilAlerte || 10) ? 'text-amber-400' : 'text-white'}`}>
                        {stockActuel}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {perm.canEdit ? (
                        <input type="number" min="0" value={editVal !== undefined ? editVal : stockActuel}
                          onChange={e => handleStockEdit(m.id, e.target.value)}
                          className={`w-24 text-right bg-slate-700 border rounded-lg px-3 py-1.5 text-sm text-white outline-none transition-colors ${isDirty ? 'border-emerald-500' : 'border-slate-600 focus:border-emerald-500'}`} />
                      ) : (
                        <span className="text-slate-300 text-sm">{stockActuel}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-300 text-sm font-mono">{valeur.toLocaleString('fr-FR')}</td>
                    <td className="px-5 py-3 text-center">
                      {isDirty && perm.canEdit && (
                        <button onClick={() => saveStock(m)} disabled={saving[m.id]}
                          className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                          {saving[m.id] ? '⏳' : '✓ Sauver'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} médicament{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, page - 2); const p = start + i;
                  if (p > totalPages) return null;
                  return (<button key={p} onClick={() => goToPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>);
                })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
