import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../api/axios';
import InventaireForm from '../forms/InventaireForm';

export default function InventairePage() {
  const { metier: metierParam } = useParams();
  const { metier: metierAuth, tenantId } = useAuth();
  const metier = metierParam || metierAuth || 'supermarche';
  const prefix = metier.toLowerCase().replace(/_/g, '-');
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [notif, setNotif] = useState(null);

  const { success, error: notifError } = useNotif();

  const { data: produitsData = [], isLoading: loading } = useQuery({
    queryKey: ['supermarche-articles', tenantId],
    queryFn: async () => {
      const res = await api.get(`/${prefix}/produits`);
      return res.data;
    },
    enabled: !!tenantId,
  });
  const produits = Array.isArray(produitsData?.data) ? produitsData.data : (Array.isArray(produitsData) ? produitsData : []);

  const { data: rayonsData = [] } = useQuery({
    queryKey: ['supermarche-rayons', tenantId],
    queryFn: async () => {
      const res = await api.get(`/${prefix}/rayons`);
      return res.data;
    },
    enabled: !!tenantId,
  });
  const rayons = Array.isArray(rayonsData?.data) ? rayonsData.data : (Array.isArray(rayonsData) ? rayonsData : []);

  const [saving, setSaving] = useState(false);
  const [edits, setEdits] = useState({});
  const [dateInventaire, setDateInventaire] = useState('');

  const [rayonFiltre, setRayonFiltre] = useState('');
  const ruptureCount = produits.filter(i => (i.quantite || 0) === 0).length;
  const faibleCount = produits.filter(i => (i.quantite || 0) > 0 && (i.quantite || 0) <= (i.seuil || 5)).length;

  const totalValeur = produits.reduce((acc, i) => acc + (i.valeurStock || i.valeur || i.quantite * i.prix || 0), 0);

  const filtres = produits.filter(p => {
    const matchSearch = !search || p.nom?.toLowerCase().includes(search.toLowerCase()) || p.reference?.toLowerCase().includes(search.toLowerCase());
    const matchRayon = !rayonFiltre || p.rayonId === rayonFiltre;
    return matchSearch && matchRayon;
  });

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>{notif.msg}</div>}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">📊 Inventaire</h1>
          <p className="text-slate-400 text-sm mt-1">Date : {dateInventaire} — {produits.length} référence{produits.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFormOpen(true)}
            className="bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20">
            📋 Nouvel Inventaire
          </button>
          <button onClick={() => window.print()}
            className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">
            🖨️ Imprimer
          </button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
          <p className="text-emerald-400 font-black text-xl">{totalValeur.toLocaleString('fr-FR')} F</p>
          <p className="text-slate-400 text-xs mt-1 font-bold uppercase tracking-widest">Valeur stock</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
          <p className="text-amber-400 font-black text-xl">{faibleCount}</p>
          <p className="text-slate-400 text-xs mt-1 font-bold uppercase tracking-widest">Stock faible</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
          <p className="text-red-400 font-black text-xl">{ruptureCount}</p>
          <p className="text-slate-400 text-xs mt-1 font-bold uppercase tracking-widest">Ruptures</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 mb-6">
        <input type="text" placeholder="🔍 Rechercher un produit..." value={search} onChange={e => setSearch(e.target.value)}
          className="bg-slate-800 border border-slate-700 focus:border-amber-500 text-white rounded-xl px-4 py-2 text-sm outline-none w-64" />
        <select value={rayonFiltre} onChange={e => setRayonFiltre(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm outline-none">
          <option value="">Tous les rayons</option>
          {rayons.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="text-left px-5 py-4">Produit</th>
                <th className="text-left px-5 py-4">Rayon</th>
                <th className="text-right px-5 py-4">Stock Système</th>
                <th className="text-right px-5 py-4">Stock Réel</th>
                <th className="text-right px-5 py-4">Valeur (F)</th>
                <th className="text-center px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtres.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-slate-500">Aucun produit trouvéé</td></tr>
              ) : filtres.map(p => {
                const rayon = rayons.find(r => r.id === p.rayonId);
                const stockActuel = p.stock || 0;
                const editVal = edits[p.id];
                const isEditing = editVal !== undefined;
                const isDirty = isEditing && parseInt(editVal) !== stockActuel;
                const valeur = stockActuel * (p.prixAchat || p.prix || 0);
                const isRupture = stockActuel <= 0;
                const isFaible = stockActuel > 0 && stockActuel <= (p.seuilAlerte || 5);

  return (
                  <tr key={p.id} className={`transition-colors ${isRupture ? 'bg-red-500/5' : isFaible ? 'bg-amber-500/5' : 'hover:bg-slate-700/20'}`}>
                    <td className="px-5 py-3">
                      <p className="text-white font-semibold text-sm">{p.nom}</p>
                      <p className="text-slate-500 text-xs">{p.reference || '—'}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-bold text-slate-400 bg-slate-700/50 px-2 py-1 rounded-full">{rayon?.nom || '—'}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`font-bold text-sm ${isRupture ? 'text-red-400' : isFaible ? 'text-amber-400' : 'text-white'}`}>
                        {stockActuel} {p.unite || ''}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <input
                        type="number"
                        min="0"
                        value={editVal !== undefined ? editVal : stockActuel}
                        onChange={e => handleStockEdit(p.id, e.target.value)}
                        className={`w-24 text-right bg-slate-700 border rounded-lg px-3 py-1.5 text-sm text-white outline-none transition-colors ${isDirty ? 'border-amber-500' : 'border-slate-600 focus:border-amber-500'}`}
                      />
                    </td>
                    <td className="px-5 py-3 text-right text-slate-300 text-sm font-mono">{valeur.toLocaleString('fr-FR')}</td>
                    <td className="px-5 py-3 text-center">
                      {isDirty && (
                        <button onClick={() => saveStock(p)} disabled={saving[p.id]}
                          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                          {saving[p.id] ? '⏳' : '✓ Sauver'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <InventaireForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={() => { success('Inventaire enregistré ✓'); queryClient.invalidateQueries({ queryKey: ['supermarche-articles'] }); }} metier={prefix} />
    </div>
  );
}
