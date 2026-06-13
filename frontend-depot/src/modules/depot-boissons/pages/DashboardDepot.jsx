import { useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { depotApi } from '../services/depotApi';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';
import {
  TrendingUp, AlertTriangle, AlertCircle, Package,
} from 'lucide-react';
import { DASHBOARD_WIDGETS } from '../dashboard.config';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

function WidgetCard({ widget, value, accentColor }) {
  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
      <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)` }} />
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl">{widget.icon}</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{widget.label}</span>
        </div>
        <p className="text-2xl font-black text-white tracking-tight">
          {value ?? '---'}
        </p>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-slate-800/60 rounded-xl overflow-hidden border border-slate-700/30 animate-pulse">
      <div className="h-1.5 w-full bg-slate-700/50" />
      <div className="p-5 space-y-3">
        <div className="flex justify-between">
          <div className="w-10 h-10 rounded-lg bg-slate-700" />
          <div className="w-20 h-3 rounded bg-slate-700" />
        </div>
        <div className="w-24 h-7 rounded bg-slate-700" />
      </div>
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-slate-800/60 rounded-xl border border-slate-700/30 p-6 animate-pulse">
      <div className="w-40 h-4 rounded bg-slate-700 mb-6" />
      <div className="w-full h-64 rounded-lg bg-slate-700/40" />
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="text-white font-medium">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="font-semibold">
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString('fr-FR') : entry.value}
        </p>
      ))}
    </div>
  );
}

export default function DashboardDepot() {
  const { metier, nomEntreprise } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['depot-dashboard'],
    queryFn: async () => {
      const res = await depotApi.getDashboardStats();
      return res.data;
    },
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
    enabled: metier === 'DEPOT_BOISSONS',
  });

  const alerteStock = useMemo(() => data?.stock_critique?.articles || [], [data]);

  if (metier !== 'DEPOT_BOISSONS') {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 text-lg font-semibold">Accès non autorisé - métier incorrect</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-700 animate-pulse" />
          <div className="space-y-2">
            <div className="w-56 h-6 rounded bg-slate-700 animate-pulse" />
            <div className="w-32 h-3 rounded bg-slate-700 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonChart key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 text-lg font-semibold mb-2">Erreur de chargement</p>
        <p className="text-slate-400 text-sm">Impossible de charger les données du tableau de bord.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-5 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const isEmpty = !data || (
    !data.widgets &&
    !data.graphiques &&
    !data.ventes_jour &&
    !data.stock_critique
  );

  if (isEmpty) {
    return (
      <div className="p-8 text-center">
        <div className="max-w-md mx-auto py-16">
          <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">📊</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Bienvenue dans votre tableau de bord</h2>
          <p className="text-slate-400 text-sm mb-8">
            Aucune donnée disponible pour le moment. Commencez par enregistrer vos premières opérations.
          </p>
        </div>
      </div>
    );
  }

  const widgets = DASHBOARD_WIDGETS.map((w) => {
    let raw = data.widgets?.[w.id] ?? data[w.id] ?? null;
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      raw = raw.count ?? raw.montant ?? raw.total ?? raw.valeur ?? Object.values(raw)[0] ?? null;
    }
    if (raw != null && typeof raw === 'number') {
      raw = raw.toLocaleString('fr-FR');
    }
    return { ...w, value: raw };
  });

  const ventes30j = data.graphiques?.ventes_30j ?? data.ventes_30j ?? [];
  const topArticles = data.graphiques?.top_articles ?? data.top_articles ?? [];
  const evolutionStock = data.graphiques?.evolution_stock ?? data.evolution_stock ?? [];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8 animate-fadeIn">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20 flex-shrink-0">
            🥤
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight truncate">
                Tableau de bord
              </h1>
              <span className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                En direct
              </span>
            </div>
            <p className="text-slate-400 text-sm truncate">
              {nomEntreprise || 'Dépôt de Boissons'} • Aujourd'hui
            </p>
          </div>
        </div>
      </div>

      {alerteStock.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5 animate-bounce" />
          <div>
            <p className="text-red-300 font-semibold text-sm">
              {data.stock_critique?.count || alerteStock.length} article{alerteStock.length > 1 ? 's' : ''} en stock critique
            </p>
            <ul className="mt-1.5 space-y-1">
              {alerteStock.slice(0, 5).map((a, i) => (
                <li key={i} className="text-red-400/80 text-xs">
                  {a.designation ?? a.nom ?? a.article ?? 'Article'} —{' '}
                  <span className="font-semibold">{a.quantite ?? a.stock ?? 0}</span> restant{a.quantite > 1 ? 's' : ''}
                </li>
              ))}
              {alerteStock.length > 5 && (
                <li className="text-red-400/60 text-xs">
                  +{alerteStock.length - 5} autre{alerteStock.length - 5 > 1 ? 's' : ''}...
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {widgets.map((w) => (
          <WidgetCard key={w.id} widget={w} value={w.value} accentColor={w.color} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

        <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Ventes 30 jours
          </h3>
          {ventes30j.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ventes30j} margin={{ top: 4, right: 4, bottom: 4, left: -16 }}>
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b' }} />
                <Bar dataKey="montant" name="Montant" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
              Aucune donnée de vente
            </div>
          )}
        </div>

        <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400" />
            Top articles
          </h3>
          {topArticles.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={topArticles}
                  dataKey="quantite"
                  nameKey="nom"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {topArticles.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
              Aucun article vendu
            </div>
          )}
          {topArticles.length > 0 && (
            <div className="mt-4 space-y-1.5">
              {topArticles.slice(0, 5).map((a, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-slate-300 truncate">{a.nom ?? a.designation ?? a.label}</span>
                  </div>
                  <span className="text-slate-400 font-medium flex-shrink-0 ml-2">
                    {a.quantite ?? a.valeur ?? 0}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6 lg:col-span-2 xl:col-span-1">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Évolution stock
          </h3>
          {evolutionStock.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={evolutionStock} margin={{ top: 4, right: 4, bottom: 4, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="stock" name="Stock" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
              Aucune donnée de stock
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
