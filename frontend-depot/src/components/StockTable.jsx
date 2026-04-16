import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useSite } from '../contexts/SiteContext';

export default function StockTable() {
  const { tenantId } = useAuth();
  const { siteId } = useSite();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStocks = useCallback(async (background = false) => {
    if (!tenantId || !siteId) return;
    background ? setRefreshing(true) : setLoading(true);
    try {
      const res = await api.get('/stocks', { params: { tenantId, siteId } });
      setStocks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Erreur stocks:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tenantId, siteId]);

  useEffect(() => {
    fetchStocks();
    const handler = () => fetchStocks(true);
    window.addEventListener('refresh-stocks', handler);
    return () => window.removeEventListener('refresh-stocks', handler);
  }, [fetchStocks]);

  if (!siteId) return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-10 text-center text-slate-400 text-sm">
      Sélectionnez un site pour voir les stocks.
    </div>
  );

  if (loading) return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl h-64 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-400 text-sm font-medium">Synchronisation des stocks...</span>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl overflow-hidden relative">
      {refreshing && (
        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/20">
          <div className="h-full bg-indigo-500 animate-pulse w-1/2" />
        </div>
      )}

      <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
        <h2 className="text-white font-bold flex items-center gap-2">
          📦 <span>État des Stocks</span>
        </h2>
        <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
          {refreshing ? 'Mise à jour...' : 'Temps réel'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-500 text-xs uppercase tracking-widest">
              <th className="px-6 py-4">Article</th>
              <th className="px-6 py-4">Prix Unitaire</th>
              <th className="px-6 py-4 text-right">Quantité</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {stocks.length === 0 ? (
              <tr><td colSpan="3" className="px-6 py-10 text-center text-slate-500">Aucun stock sur ce site.</td></tr>
            ) : stocks.map(row => {
              const qte = row.quantite ?? 0;
              const nom = row.article?.designation ?? row.designation ?? 'Inconnu';
              const prix = row.article?.prixVente ?? row.prix ?? 0;
              const isLow = qte < 5;

              return (
                <tr key={row.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4 text-white font-semibold">{nom}</td>
                  <td className="px-6 py-4 text-slate-400">{prix.toLocaleString('fr-FR')} FCFA</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold ${qte <= 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : isLow ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                      {qte <= 0 ? 'RUPTURE' : `${qte} u.`}
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