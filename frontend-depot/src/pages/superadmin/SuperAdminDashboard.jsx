import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Building2, TrendingUp, DollarSign, Activity, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../api/axios';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

const KPICard = ({ title, value, sub, icon: Icon }) => {
  return (
    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-black/20 hover:border-indigo-500/30 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center">
          <Icon size={24} className="text-indigo-400" />
        </div>
      </div>
      <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
      <p className="text-white text-2xl font-black">{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  );
};

export default function SuperAdminDashboard() {
  const { data: metrics, isLoading, refetch } = useQuery({
    queryKey: ['platform-metrics'],
    queryFn: async () => {
      const res = await api.get('/platform/metrics');
      return res.data;
    },
    refetchInterval: 30000,
  });

  // Regroupe sectorStats: [{name, status, count}] -> [{metier, count}]
  const metierData = useMemo(() => {
    const raw = metrics?.sectorStats || [];
    const acc = {};
    raw.forEach((s) => {
      const key = s.name || 'INCONNU';
      acc[key] = (acc[key] || 0) + (s.count || 0);
    });
    return Object.entries(acc).map(([metier, count]) => ({ metier, count }));
  }, [metrics]);

  // Evolution MRR pour le graphique
  const evolution = useMemo(() => {
    const evo = metrics?.evolution || [];
    if (evo.length > 0) return evo;
    // Fallback: un seul point actuel
    return [{ month: 'Aujourd\'hui', mrr: metrics?.mrr || 0 }];
  }, [metrics]);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <Activity size={28} className="text-indigo-400" />
            <h1 className="text-2xl font-black text-white">Dashboard SuperAdmin</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">Vue d'ensemble de la plateforme GesTock</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all border border-slate-600"
        >
          <RefreshCw size={18} />
          Actualiser
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="MRR"
              value={`${(metrics?.mrr || 0).toLocaleString('fr-FR')} FCFA`}
              sub={`ARR: ${(metrics?.arr || 0).toLocaleString('fr-FR')} FCFA`}
              icon={DollarSign}
            />
            <KPICard
              title="ARPU"
              value={metrics?.arpu ? `${metrics.arpu.toLocaleString('fr-FR')} FCFA` : 'N/A'}
              sub="Revenu moyen par locataire"
              icon={Users}
            />
            <KPICard
              title="Taux de churn"
              value={metrics?.churnRate != null ? `${metrics.churnRate.toFixed(1)}%` : 'N/A'}
              sub={metrics?.churnInsufficientData ? 'Historique insuffisant' : 'Mensuel'}
              icon={TrendingUp}
            />
            <KPICard
              title="LTV"
              value={metrics?.ltv != null ? `${metrics.ltv.toLocaleString('fr-FR')} FCFA` : 'N/A'}
              sub="Valeur vie client"
              icon={Building2}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Evolution MRR */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-black/20">
              <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-indigo-400" />
                Évolution du MRR
              </h3>
              {evolution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={evolution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Bar dataKey="mrr" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-500">
                  Aucune donnée disponible
                </div>
              )}
            </div>

            {/* Distribution par Métier (Pie Chart) */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-black/20">
              <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                <Activity size={20} className="text-indigo-400" />
                Distribution des Métiers
              </h3>
              {metierData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metierData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ metier, percent }) => `${metier.replace(/_/g, ' ')} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {metierData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-500">
                  Aucune donnée disponible
                </div>
              )}
            </div>
          </div>

          {/* Abonnés par Métier (Bar Chart) */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-black/20">
            <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
              <Building2 size={20} className="text-indigo-400" />
              Abonnés par Métier
            </h3>
            {metierData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metierData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="metier"
                    stroke="#94a3b8"
                    fontSize={12}
                    tickFormatter={(value) => value.replace(/_/g, ' ')}
                  />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                Aucune donnée disponible
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
