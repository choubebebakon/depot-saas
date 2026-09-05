import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useSuperAdminRealtime } from '../../shared/realtime/useSuperAdminRealtime';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, DollarSign, Users, Building2, Activity, BarChart3, RefreshCw, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import api from '../../api/axios';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#10b981', '#f59e0b'];

const KPICard = ({ title, value, sub, icon: Icon, trend }) => {
  return (
    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-black/20 hover:border-indigo-500/30 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center">
          <Icon size={24} className="text-indigo-400" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-bold ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
        )}
      </div>
      <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
      <p className="text-white text-2xl font-black">{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  );
};

export default function SuperAdminAnalytics() {
  const [period, setPeriod] = useState('30d');

  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useQuery({
    queryKey: ['admin-analytics-overview'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics/overview');
      return res.data;
    },
  });

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ['admin-analytics-usage', period],
    queryFn: async () => {
      const res = await api.get(`/admin/analytics/usage?period=${period}`);
      return res.data;
    },
  });

  const { data: revenue, isLoading: revenueLoading } = useQuery({
    queryKey: ['admin-analytics-revenue', period],
    queryFn: async () => {
      const res = await api.get(`/admin/analytics/revenue?period=${period}`);
      return res.data;
    },
  });

  const { data: churn, isLoading: churnLoading } = useQuery({
    queryKey: ['admin-analytics-churn'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics/churn');
      return res.data;
    },
  });

  const { data: featureUsage, isLoading: featureLoading } = useQuery({
    queryKey: ['admin-analytics-feature'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics/feature-usage');
      return res.data;
    },
  });

  const revenueChartData = revenue?.dailyRevenue?.map(d => ({
    date: new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    amount: d.amount,
  })) || [];

  const featureChartData = featureUsage?.features?.map(f => ({
    name: f.name,
    value: f.count,
    percentage: f.percentage,
  })) || [];

  const revenueByMethodData = Object.entries(revenue?.revenueByMethod || {}).map(([method, amount]) => ({
    method,
    amount,
  }));

  const handleRefresh = () => queryClient.invalidateQueries({
    predicate: ({ queryKey }) => Array.isArray(queryKey) && String(queryKey[0]).startsWith('admin-analytics'),
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <BarChart3 size={28} className="text-indigo-400" />
            <h1 className="text-2xl font-black text-white">Analytics Avancés</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">Métriques détaillées de la plateforme GesTock</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="7d">7 jours</option>
            <option value="30d">30 jours</option>
            <option value="90d">90 jours</option>
            <option value="1y">1 an</option>
          </select>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all border border-slate-600"
          >
            <RefreshCw size={18} />
            Actualiser
          </button>
        </div>
      </div>

      {overviewLoading || usageLoading || revenueLoading || churnLoading || featureLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overview KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Revenu du mois"
              value={`${(overview?.revenue?.currentMonth || 0).toLocaleString('fr-FR')} FCFA`}
              sub={`ARR: ${(overview?.revenue?.arr || 0).toLocaleString('fr-FR')} FCFA`}
              icon={DollarSign}
              trend={overview?.revenue?.growth}
            />
            <KPICard
              title="Tenants actifs"
              value={overview?.tenants?.active || 0}
              sub={`Total: ${overview?.tenants?.total || 0}`}
              icon={Building2}
            />
            <KPICard
              title="Utilisateurs actifs"
              value={overview?.users?.active || 0}
              sub={`Total: ${overview?.users?.total || 0}`}
              icon={Users}
            />
            <KPICard
              title="Taux d'activation"
              value={`${overview?.tenants?.activationRate?.toFixed(1) || 0}%`}
              sub="Tenants actifs / total"
              icon={Activity}
            />
          </div>

          {/* Platform Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard
              title="Dépôts"
              value={overview?.platform?.totalDepots || 0}
              icon={Building2}
            />
            <KPICard
              title="Ventes (ce mois)"
              value={overview?.platform?.totalVentes || 0}
              icon={TrendingUp}
            />
            <KPICard
              title="Articles"
              value={overview?.platform?.totalArticles || 0}
              icon={Activity}
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Evolution */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-black/20">
              <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-indigo-400" />
                Évolution du Revenu
              </h3>
              {revenueChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                      itemStyle={{ color: '#e2e8f0' }}
                      formatter={(value) => `${value.toLocaleString('fr-FR')} FCFA`}
                    />
                    <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-500">
                  Aucune donnée disponible
                </div>
              )}
            </div>

            {/* Revenue by Method */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-black/20">
              <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                <DollarSign size={20} className="text-indigo-400" />
                Revenu par Méthode
              </h3>
              {revenueByMethodData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueByMethodData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ method, percentage }) => `${method} (${percentage.toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {revenueByMethodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                      itemStyle={{ color: '#e2e8f0' }}
                      formatter={(value) => `${value.toLocaleString('fr-FR')} FCFA`}
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

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feature Usage */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-black/20">
              <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                <Activity size={20} className="text-indigo-400" />
                Utilisation des Fonctionnalités
              </h3>
              {featureChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={featureChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-500">
                  Aucune donnée disponible
                </div>
              )}
            </div>

            {/* Churn Analytics */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-black/20">
              <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-indigo-400" />
                Churn Rate
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                  <div>
                    <p className="text-slate-400 text-sm">Churn 30 jours</p>
                    <p className="text-white text-2xl font-black">{churn?.churnRate30d?.toFixed(2) || 0}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-sm">Expérés (30j)</p>
                    <p className="text-white font-semibold">{churn?.expiredLast30Days || 0}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                  <div>
                    <p className="text-slate-400 text-sm">Churn 90 jours</p>
                    <p className="text-white text-2xl font-black">{churn?.churnRate90d?.toFixed(2) || 0}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-sm">Expérés (90j)</p>
                    <p className="text-white font-semibold">{churn?.expiredLast90Days || 0}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                  <div>
                    <p className="text-slate-400 text-sm">Tenants actifs</p>
                    <p className="text-white text-2xl font-black">{churn?.activeNow || 0}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 text-sm font-semibold">En vie</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Metrics */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-black/20">
            <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
              <Calendar size={20} className="text-indigo-400" />
              Métriques d'Utilisation ({period})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-800/50 rounded-xl">
                <p className="text-slate-400 text-sm">Ventes</p>
                <p className="text-white text-2xl font-black">{usage?.ventes || 0}</p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-xl">
                <p className="text-slate-400 text-sm">Articles créés</p>
                <p className="text-white text-2xl font-black">{usage?.articlesCreated || 0}</p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-xl">
                <p className="text-slate-400 text-sm">Utilisateurs actifs</p>
                <p className="text-white text-2xl font-black">{usage?.activeUsers || 0}</p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-xl">
                <p className="text-slate-400 text-sm">Dépôts actifs</p>
                <p className="text-white text-2xl font-black">{usage?.activeDepots || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
