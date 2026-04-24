import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useDepot } from '../contexts/DepotContext';

export default function StatsCards() {
  const { tenantId } = useAuth();
  const { depotId, DépôtActif } = useDepot();
  const [stats, setStats] = useState({ caJour: 0, nbVentesJour: 0, articleStar: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId || !depotId) return;

    const fetchStats = async () => {
      try {
        const res = await api.get('/ventes/stats', { params: { tenantId, depotId } });
        setStats(res.data);
      } catch (err) {
        console.error('Erreur stats:', err);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchStats();
    window.addEventListener('refresh-stocks', fetchStats);
    return () => window.removeEventListener('refresh-stocks', fetchStats);
  }, [tenantId, depotId]);

  if (!depotId) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-8 text-center text-slate-400 text-sm">
        Sélectionnez un Dépôt pour afficher les statistiques.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-800 rounded-2xl" />)}
      </div>
    );
  }

  const cartes = [
    {
      label: "Chiffre d'Affaires",
      sub: "Aujourd'hui",
      valeur: `${(stats.caJour || 0).toLocaleString('fr-FR')} FCFA`,
      gradient: 'from-yellow-400 to-amber-600',
      shadow: 'shadow-amber-500/20',
      emoji: 'ðŸ’°',
    },
    {
      label: 'Ventes du Jour',
      sub: 'Factures générées',
      valeur: stats.nbVentesJour || 0,
      gradient: 'from-blue-500 to-sky-600',
      shadow: 'shadow-blue-500/20',
      emoji: 'ðŸ§¾',
    },
    {
      label: 'Produit Star',
      sub: stats.articleStar ? `${stats.articleStar.quantite} unités vendues` : '-',
      valeur: stats.articleStar?.designation || 'Aucun mouvement',
      gradient: 'from-indigo-500 to-violet-700',
      shadow: 'shadow-indigo-500/20',
      emoji: 'â­',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {cartes.map((c, i) => (
        <div key={i} className={`bg-gradient-to-br ${c.gradient} rounded-2xl p-6 text-white shadow-xl ${c.shadow} hover:-translate-y-1 transition-all duration-300`}>
          <div className="flex justify-between items-start mb-4">
            <p className="text-white/80 text-xs font-bold uppercase tracking-widest">{c.label}</p>
            <span className="text-2xl">{c.emoji}</span>
          </div>
          <p className="text-3xl font-black tracking-tight truncate">{c.valeur}</p>
          <p className="text-white/70 text-sm mt-1">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}




