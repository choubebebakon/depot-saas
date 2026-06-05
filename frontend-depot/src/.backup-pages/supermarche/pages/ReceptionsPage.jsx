import { useState, useEffect, useCallback } from 'react'; import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import { PERMISSIONS } from '../permissions';
import { usePermission } from '../../../shared/hooks/usePermission';

const STATUTS_RECEPTION = [
  { id: 'en_attente', label: 'En attente', color: 'amber' },
  { id: 'recu', label: 'Reçu', color: 'emerald' },
  { id: 'partiel', label: 'Partiel', color: 'blue' },
  { id: 'annule', label: 'Annulé', color: 'red' },
];

function StatutBadge({ statut }) {
  const s = STATUTS_RECEPTION.find(x => x.id === statut) || STATUTS_RECEPTION[0];
  const colors = { amber: 'bg-amber-500/20 text-amber-400', emerald: 'bg-emerald-500/20 text-emerald-400', blue: 'bg-blue-500/20 text-blue-400', red: 'bg-red-500/20 text-red-400' };
  return <span className={`text-xs font-bold px-2 py-1 rounded-full ${colors[s.color]}`}>{s.label}</span>;
}

export default function ReceptionsPage() {
  const [receptions, setReceptions] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ fournisseurId: '', dateReception: new Date().toISOString().slice(0, 10), numeroBC: '', notes: '' });
  const [lignes, setLignes] = useState([{ produitId: '', qte: 1, prixUnitaire: 0 }]);
  const [formLoading, setFormLoading] = useState(false);
  const [notif, setNotif] = useState(null);
  const perm = usePermission(PERMISSIONS, 'receptions');
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const openCreate = () => { setForm({ fournisseurId: '', dateReception: new Date().toISOString().slice(0, 10), numeroBC: '', notes: '' }); setLignes([{ produitId: '', qte: 1, prixUnitaire: 0 }]); setFormOpen(true); };

  const load = useCallback(async () => { setLoading(true);
    try { const [r, f, p] = await Promise.all([api.get('/supermarche/receptions'), api.get('/supermarche/fournisseurs'), api.get('/supermarche/produits')]); setReceptions(r.data?.data || r.data || []); setFournisseurs(f.data?.data || f.data || []); setProduits(p.data?.data || p.data || []); }
    catch (_) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };
  const totalPages = Math.ceil(receptions.length / itemsPerPage);
  const paginated = receptions.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  const addLigne = () => setLignes([...lignes, { produitId: '', qte: 1, prixUnitaire: 0 }]);
  const updateLigne = (i, field, val) => { const l = [...lignes]; l[i] = {...l[i], [field]: val}; setLignes(l); };
  const removeLigne = (i) => setLignes(lignes.filter((_, idx) => idx !== i));
  const total = lignes.reduce((s, l) => s + (parseFloat(l.qte) || 0) * (parseFloat(l.prixUnitaire) || 0), 0);

  const handleSubmit = async (e) => { e.preventDefault(); setFormLoading(true);
    try {
      await api.post('/supermarche/receptions', { ...form, lignes: lignes.map(l => ({ ...l, qte: parseInt(l.qte), prixUnitaire: parseFloat(l.prixUnitaire) })) });
      setFormOpen(false); showNotif('Réception enregistrée ✓'); load();
    } catch { showNotif('Erreur lors de l\'enregistrement', 'error'); } finally { setFormLoading(false); }
  };

  const setF = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>{notif.msg}</div>}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">📦 Réceptions</h1>
          <p className="text-slate-400 text-sm mt-1">{receptions.length} réception{receptions.length !== 1 ? 's' : ''}</p>
        </div>
        {perm.canCreate && (
        <button onClick={openCreate}
          className="bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20">
          + Nouvelle Réception
        </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : receptions.length === 0 ? (
        <div className="text-center py-20"><span className="text-6xl">📦</span><p className="text-slate-400 font-semibold mt-4">Aucune réception enregistrée</p></div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="text-left px-5 py-4">Date</th>
                <th className="text-left px-5 py-4">Fournisseur</th>
                <th className="text-left px-5 py-4">N° BC</th>
                <th className="text-right px-5 py-4">Montant</th>
                <th className="text-center px-5 py-4">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.map(r => {
                const f = fournisseurs.find(x => x.id === r.fournisseurId);

  return (
                  <tr key={r.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-5 py-4 text-slate-300 text-sm">{r.dateReception ? new Date(r.dateReception).toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="px-5 py-4 text-white font-semibold text-sm">{f?.nom || '—'}</td>
                    <td className="px-5 py-4 text-slate-400 text-sm">{r.numeroBC || '—'}</td>
                    <td className="px-5 py-4 text-right text-amber-400 font-bold text-sm">{(r.montantTotal || 0).toLocaleString('fr-FR')} F</td>
                    <td className="px-5 py-4 text-center"><StatutBadge statut={r.statut} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{receptions.length} réception{receptions.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, page - 2);
                  const p = start + i;
                  if (p > totalPages) return null;
                  return (
                    <button key={p} onClick={() => goToPage(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>
                  );
                })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}

      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title="📦 Nouvelle réception" loading={formLoading} size="lg" submitLabel="Enregistrer la réception">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Fournisseur *</label>
            <select required value={form.fournisseurId} onChange={setF('fournisseurId')}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm outline-none">
              <option value="">— Choisir —</option>
              {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Date de réception *</label>
            <input required type="date" value={form.dateReception} onChange={setF('dateReception')}
              className="w-full bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none" />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">N° Bon de commande</label>
            <input value={form.numeroBC} onChange={setF('numeroBC')}
              className="w-full bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none" />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Notes</label>
            <input value={form.notes} onChange={setF('notes')}
              className="w-full bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest">Articles reçus</label>
            <button type="button" onClick={addLigne} className="text-amber-400 hover:text-amber-300 text-xs font-bold transition-colors">+ Ajouter ligne</button>
          </div>
          <div className="space-y-2">
            {lignes.map((l, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <select value={l.produitId} onChange={e => updateLigne(i, 'produitId', e.target.value)}
                  className="col-span-6 bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-xs outline-none">
                  <option value="">— Produit —</option>
                  {produits.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                </select>
                <input type="number" min="1" value={l.qte} onChange={e => updateLigne(i, 'qte', e.target.value)}
                  placeholder="Qté"
                  className="col-span-2 bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-3 py-2.5 text-xs outline-none" />
                <input type="number" min="0" value={l.prixUnitaire} onChange={e => updateLigne(i, 'prixUnitaire', e.target.value)}
                  placeholder="Prix"
                  className="col-span-3 bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-3 py-2.5 text-xs outline-none" />
                <button type="button" onClick={() => removeLigne(i)} className="col-span-1 text-red-400 hover:text-red-300 text-center">✕</button>
              </div>
            ))}
          </div>
          <div className="mt-3 text-right">
            <span className="text-slate-400 text-sm">Total: </span>
            <span className="text-amber-400 font-black text-lg">{total.toLocaleString('fr-FR')} F</span>
          </div>
        </div>
      </FormModal>
    </div>
  );
}
