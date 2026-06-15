import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { boutiqueApi } from '../services/boutiqueApi';

export default function DashboardBoutique() {
  const navigate = useNavigate();
  const { user, tenantId } = useAuth();
  const [time, setTime] = useState(new Date());

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['boutique-dashboard-stats', tenantId],
    queryFn: async () => {
      const res = await boutiqueApi.getStats();
      return res.data;
    },
    enabled: !!tenantId,
    refetchInterval: 15_000,
  });

  const { data: rapports } = useQuery({
    queryKey: ['boutique-rapports', tenantId, { periode: 'jour' }],
    queryFn: async () => {
      const res = await boutiqueApi.getRapports({ periode: 'jour' });
      return res.data;
    },
    enabled: !!tenantId,
  });

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  if (statsLoading) return <div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;

  const topProduits = rapports?.topArticles || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-white tracking-tight">🏪 Tableau de Bord</h1>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs font-bold">En direct</span>
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-1">{time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} — {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/boutique/ventes')} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-cyan-600/20">💰 Ventes</button>
          <button onClick={() => navigate('/boutique/stock')} className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">📦 Stock</button>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: '💰', label: 'CA du jour', value: `${(stats?.caJour || 0).toLocaleString('fr-FR')} F`, color: '#10b981' },
          { icon: '📦', label: 'Ventes du jour', value: stats?.ventesJour || 0, color: '#0891b2' },
          { icon: '👤', label: 'Clients actifs', value: stats?.clientsActifs || 0, color: '#3b82f6' },
          { icon: '⚠️', label: 'Ruptures stock', value: stats?.stockCritique || 0, color: '#ef4444' },
        ].map((k, i) => (
          <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 hover:border-cyan-500/30 transition-all">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl mb-3" style={{ backgroundColor: k.color + '22' }}>{k.icon}</div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{k.label}</p>
            <p className="text-white font-black text-2xl leading-none">{k.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-white font-black text-sm mb-4">📦 Produits en stock</h2>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-cyan-600/20 flex items-center justify-center"><span className="text-4xl">📦</span></div>
            <div><p className="text-white font-black text-5xl">{stats?.totalProduits || 0}</p><p className="text-slate-400 text-sm">produits référencés</p></div>
          </div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-white font-black text-sm mb-4">🏧 Caisse du jour</h2>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-purple-500/20 flex items-center justify-center"><span className="text-4xl">🏧</span></div>
            <div><p className="text-white font-black text-5xl">{(stats?.caisseJour || 0).toLocaleString('fr-FR')}</p><p className="text-slate-400 text-sm">F CFA</p></div>
          </div>
        </div>
      </div>
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-black text-lg">🏆 Top Produits du Jour</h2>
          <button onClick={() => navigate('/boutique/stock')} className="text-cyan-400 hover:text-cyan-300 text-xs font-bold transition-colors">Voir le stock →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="text-left pb-3 pl-2">#</th>
                <th className="text-left pb-3">Produit</th>
                <th className="text-right pb-3">Qté vendue</th>
                <th className="text-right pb-3 pr-2">CA (F CFA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {topProduits.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-500">Aucune donnée disponible</td></tr>
              ) : (
                topProduits.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-700/20 transition-colors">
                    <td className="py-3 pl-2">
                      <span className={`text-xs font-black ${i === 0 ? 'text-cyan-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-cyan-700' : 'text-slate-500'}`}>
                        #{i + 1}
                      </span>
                    </td>
                    <td className="py-3 text-white font-semibold text-sm">Article #{p.articleId}</td>
                    <td className="py-3 text-right text-slate-300 text-sm font-mono">{p._sum?.quantite || 0}</td>
                    <td className="py-3 pr-2 text-right text-emerald-400 text-sm font-bold">{(p._sum?.total || 0).toLocaleString('fr-FR')} F</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
