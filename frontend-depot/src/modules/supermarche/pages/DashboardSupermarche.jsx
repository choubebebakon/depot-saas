import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../api';

const COULEUR = '#f59e0b';

function StatCard({ icon, label, value, sub, color, trend }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 hover:border-amber-500/30 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: color + '22' }}>
          {icon}
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
      <p className="text-white font-black text-2xl leading-none">{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function MiniBar({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-400 text-xs w-24 truncate">{label}</span>
      <div className="flex-1 bg-slate-700/50 rounded-full h-2">
        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color || COULEUR }} />
      </div>
      <span className="text-white text-xs font-bold w-12 text-right">{value.toLocaleString('fr-FR')}</span>
    </div>
  );
}

export default function DashboardSupermarche() {
  const { user, tenantId } = useAuth();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['supermarche-dashboard-stats', tenantId],
    queryFn: async () => {
      const res = await api.get('/supermarche/stats');
      return res.data;
    },
    enabled: !!tenantId,
    refetchInterval: 15_000,
  });

  const { data: rapports } = useQuery({
    queryKey: ['supermarche-rapports', tenantId, { periode: 'jour' }],
    queryFn: async () => {
      const res = await api.get('/supermarche/rapports', { params: { periode: 'jour' } });
      return res.data;
    },
    enabled: !!tenantId,
  });

  const { data: rayons } = useQuery({
    queryKey: ['supermarche-rayons', tenantId],
    queryFn: async () => {
      const res = await api.get('/supermarche/rayons');
      return res.data;
    },
    enabled: !!tenantId,
  });

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const ventesByRayon = stats?.ventesByRayon || [];
  const topProduits = rapports?.topArticles || [];
  const maxRayon = Math.max(...ventesByRayon.map(r => r._sum?.prix || 0), 1);
  const alertes = [
    ...(stats?.ruptures > 0 ? [{ type: 'rupture', msg: `${stats.ruptures} articles en rupture de stock`, color: 'red' }] : []),
    ...(stats?.promosActives > 0 ? [{ type: 'promo', msg: `${stats.promosActives} promotions actives`, color: 'amber' }] : []),
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-white tracking-tight">
              🛒 Tableau de Bord
            </h1>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs font-bold">En direct</span>
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            {time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} — {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/supermarche/pos')}
            className="bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20">
            🛒 Ouvrir Caisse
          </button>
          <button onClick={() => navigate('/supermarche/rapports')}
            className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">
            📊 Rapports
          </button>
        </div>
      </div>

      {/* Alertes */}
      {ALERTES.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {ALERTES.map((a, i) => (
            <div key={i} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border ${
              a.color === 'red' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
              a.color === 'amber' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
              'bg-blue-500/10 border-blue-500/30 text-blue-400'
            }`}>
              {a.type === 'rupture' ? '⚠️' : a.type === 'promo' ? '🏷️' : '🚚'} {a.msg}
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="💰" label="CA Jour" value={`${(stats?.caJour || 0).toLocaleString('fr-FR')} F`} sub={`${stats?.ventesJour || 0} ventes`} color="#10b981" />
        <StatCard icon="🧾" label="Transactions" value={stats?.ventesJour || 0} sub="Aujourd'hui" color="#3b82f6" />
        <StatCard icon="⚠️" label="Ruptures Stock" value={stats?.ruptures || 0} sub="Articles en alerte" color="#ef4444" />
        <StatCard icon="🏷️" label="Promos Actives" value={stats?.promosActives || 0} sub="En cours" color="#8b5cf6" />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventes par Rayon */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-white font-black text-lg mb-5">📦 Ventes par Rayon</h2>
          <div className="space-y-4">
            {ventesByRayon.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">Aucune donnée disponible</p>
            ) : (
              ventesByRayon.map((r, i) => (
                <MiniBar key={i} label={`Article ${r.articleId}`} value={r._sum?.prix || 0} max={maxRayon} color={COULEUR} />
              ))
            )}
          </div>
        </div>

        {/* Heures de Pointe */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-white font-black text-lg mb-5">⏰ Heures de Pointe</h2>
          <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
            Données non disponibles (dette technique)
          </div>
        </div>
      </div>

      {/* Top Produits */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-black text-lg">🏆 Top Produits du Jour</h2>
          <button onClick={() => navigate('/supermarche/stock')}
            className="text-amber-400 hover:text-amber-300 text-xs font-bold transition-colors">
            Voir le stock →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="text-left pb-3 pl-2">#</th>
                <th className="text-left pb-3">Produit</th>
                <th className="text-left pb-3">Rayon</th>
                <th className="text-right pb-3">Qté vendue</th>
                <th className="text-right pb-3 pr-2">CA (F CFA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {topProduits.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">Aucune donnée disponible</td></tr>
              ) : (
                topProduits.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-700/20 transition-colors">
                    <td className="py-3 pl-2">
                      <span className={`text-xs font-black ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-700' : 'text-slate-500'}`}>
                        #{i + 1}
                      </span>
                    </td>
                    <td className="py-3 text-white font-semibold text-sm">{p.article?.designation || `Article ${p.articleId}`}</td>
                    <td className="py-3">
                      <span className="text-xs font-bold text-slate-400 bg-slate-700/50 px-2 py-1 rounded-full">-</span>
                    </td>
                    <td className="py-3 text-right text-slate-300 text-sm font-mono">{p._sum?.quantite || 0}</td>
                    <td className="py-3 pr-2 text-right text-emerald-400 text-sm font-bold">{(p._sum?.total || 0).toLocaleString('fr-FR')} F</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions Rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Nouvelle Réception', icon: '📦', path: '/supermarche/receptions', color: '#3b82f6' },
          { label: 'Ajouter Promo', icon: '🏷️', path: '/supermarche/promotions', color: '#8b5cf6' },
          { label: 'Inventaire', icon: '📊', path: '/supermarche/inventaire', color: '#10b981' },
          { label: 'Ajouter Dépense', icon: '💸', path: '/supermarche/depenses', color: '#ef4444' },
        ].map((a, i) => (
          <button key={i} onClick={() => navigate(a.path)}
            className="bg-slate-800/60 border border-slate-700/50 hover:border-slate-600 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all group">
            <span className="text-3xl group-hover:scale-110 transition-transform">{a.icon}</span>
            <span className="text-slate-300 text-xs font-bold text-center">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
