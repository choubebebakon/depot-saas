import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { Target, RefreshCw, Loader2 } from 'lucide-react';

const money = (v) => `${Number(v || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} FCFA`;

/**
 * §10 — « Mes performances » (route gate : rapports_performance).
 * Le backend renvoie la ligne du commercial connecté (self-scope §7) ;
 * PATRON/GERANT/COMPTABLE voient le classement complet.
 */
export default function PerformancePage() {
  const { user } = useAuth();
  const isCommercial = user?.role === 'COMMERCIAL';
  const now = new Date();
  const [month, setMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
  );

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['performance-commerciaux', month],
    queryFn: async () => {
      const res = await api.get('/rapports/performance-commerciaux', {
        params: { month },
      });
      return res.data;
    },
    staleTime: 60_000,
  });

  const rows = Array.isArray(data) ? data : [];

  const columns = [
    { key: 'email', label: isCommercial ? 'Mon compte' : 'Commercial' },
    { key: 'nbTournees', label: 'Tournées' },
    { key: 'nbTourneesValidees', label: 'Tournées validées' },
    { key: 'nbVentes', label: 'Ventes' },
    { key: 'chiffreAffaires', label: "Chiffre d'affaires", money: true },
    { key: 'margeBrute', label: 'Marge brute', money: true },
    { key: 'moyenneTicket', label: 'Ticket moyen', money: true },
    { key: 'scorePerformance', label: 'Score' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Target className="w-7 h-7 text-amber-400" />
            {isCommercial ? 'Mes performances' : 'Performances commerciaux'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isCommercial
              ? 'Suivi de vos ventes, tournées et score de performance.'
              : 'Classement des commerciaux sur la période.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm"
          />
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all text-sm"
          >
            <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} /> Actualiser
          </button>
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Chargement…
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-center">
            <p className="font-bold text-red-300">
              Impossible de charger les performances. Réessayez.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
            >
              Réessayer
            </button>
          </div>
        ) : rows.length === 0 ? (
          <p className="text-slate-500 text-center py-10">
            Aucune performance enregistrée pour cette période.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
                {columns.map((c) => (
                  <th key={c.key} className={`p-3 font-semibold ${c.money ? 'text-right' : 'text-left'}`}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {rows.map((row, i) => (
                <tr key={row.commercialId || i} className="hover:bg-slate-800/40">
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={`p-3 text-white ${c.money ? 'text-right font-mono' : ''}`}
                    >
                      {c.money ? money(row[c.key]) : (row[c.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
