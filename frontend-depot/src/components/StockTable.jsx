import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useDepot } from '../contexts/DepotContext';

export default function StockTable() {
  const { tenantId } = useAuth();
  const { depotId } = useDepot();

  const { data: stocks = [], isLoading, isFetching } = useQuery({
    queryKey: ['stocks-dashboard', tenantId, depotId],
    queryFn: async () => {
      const res = await api.get('/stocks', { params: { tenantId, depotId } });
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!tenantId && !!depotId,
    refetchInterval: 30000, 
  });

  if (!depotId) return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-10 text-center text-slate-400 text-sm">
      Sélectionnez un Dépôt pour voir les stocks.
    </div>
  );

  if (isLoading) return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl h-64 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-400 text-sm font-medium">Synchronisation des stocks...</span>
      </div>
    </div>
  );

  // Tri : Priorité aux Ruptures, puis aux Critiques, puis le reste par Désignation
  const sortedStocks = [...stocks].sort((a, b) => {
    const isCritA = a.quantite <= (a.article?.seuilCritique || 0);
    const isCritB = b.quantite <= (b.article?.seuilCritique || 0);
    
    if (isCritA && !isCritB) return -1;
    if (!isCritA && isCritB) return 1;
    
    return (a.article?.designation || '').localeCompare(b.article?.designation || '');
  });

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl overflow-hidden relative">
      {isFetching && (
        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/20 z-10">
          <div className="h-full bg-indigo-500 animate-[shimmer_2s_infinite] w-1/2" />
        </div>
      )}

      <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/30">
        <h2 className="text-white font-bold flex items-center gap-2">
          ðŸ“¦ <span>État des Stocks</span>
        </h2>
        <span className="flex items-center gap-2">
           {isFetching && <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />}
           <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
            {isFetching ? 'Mise Ã  jour...' : 'Temps réel'}
          </span>
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-500 text-xs uppercase tracking-widest bg-slate-900/50">
              <th className="px-6 py-4">Article</th>
              <th className="px-6 py-4 text-center">Prix Unitaire</th>
              <th className="px-6 py-4 text-right">Quantité</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {sortedStocks.length === 0 ? (
              <tr><td colSpan="3" className="px-6 py-10 text-center text-slate-500 font-medium">Aucun stock sur ce Dépôt.</td></tr>
            ) : sortedStocks.map(row => {
              const qte = row.quantite ?? 0;
              const nom = row.article?.designation ?? row.designation ?? 'Inconnu';
              const prix = row.article?.prixVente ?? row.prix ?? 0;
              const seuil = row.article?.seuilCritique || 0;
              const isRupture = qte <= 0;
              const isCritique = qte <= seuil;

              return (
                <tr key={row.id} className={`hover:bg-slate-700/30 transition-colors ${isCritique ? 'bg-red-500/[0.02]' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {isCritique && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />}
                      <span className={`text-white font-semibold ${isCritique ? 'text-red-200' : ''}`}>{nom}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-400 tabular-nums">
                    {prix.toLocaleString('fr-FR')} <span className="text-[10px] opacity-50">F</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-black border transition-all duration-500 shadow-sm ${
                        isRupture 
                        ? 'bg-red-500/20 text-red-500 border-red-500/40 animate-pulse' 
                        : isCritique 
                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' 
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                      {isRupture ? 'RUPTURE' : `${qte} u.`}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}




