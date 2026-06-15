import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import { usePermission } from '../../../shared/hooks/usePermission';
import { PERMISSIONS } from '../permissions';
import { boutiqueApi } from '../services/boutiqueApi';

export default function FacturesPage() {
  const notif = useNotif();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perm = usePermission(PERMISSIONS, 'factures');

  const { data: ventesData, isLoading } = useQuery({
    queryKey: ['boutique-ventes', search, page],
    queryFn: async () => {
      const res = await boutiqueApi.getVentes({ statut: 'PAYE', search, page });
      return res.data;
    },
  });

  const items = ventesData?.data || [];
  const totalItems = ventesData?.total || 0;
  const totalFacture = items.reduce((acc, i) => acc + (i.total || 0), 0);

  const handlePrint = (vente) => {
    notif.success(`Impression de la facture ${vente.reference}`);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Factures</h1>
          <p className="text-slate-400 text-sm mt-1">{totalItems} facture{totalItems !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total</p>
            <p className="font-black text-xl text-cyan-400">{totalFacture.toLocaleString('fr-FR')} F</p>
          </div>
        </div>
      </div>
      <div className="mb-6">
        <input
          type="text"
          placeholder="🔍 N° facture, client..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 focus:border-cyan-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-72"
        />
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="text-left px-5 py-4">N° Facture</th>
                <th className="text-left px-5 py-4">Client</th>
                <th className="text-left px-5 py-4">Date</th>
                <th className="text-right px-5 py-4">Montant</th>
                <th className="text-center px-5 py-4">Statut</th>
                <th className="text-center px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {items.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-slate-500">Aucune facture</td></tr>
              ) : items.map(i => (
                <tr key={i.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4 text-white font-mono text-sm font-bold">{i.reference}</td>
                  <td className="px-5 py-4 text-slate-300">{i.client?.nom || ''}</td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{i.date ? new Date(i.date).toLocaleDateString('fr-FR') : ''}</td>
                  <td className="px-5 py-4 text-right text-white font-mono font-bold">{(i.total || 0).toLocaleString('fr-FR')} F</td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-[10px] font-black uppercase bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Payée</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => handlePrint(i)}
                        className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm"
                      >
                        🖨️ Imprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
