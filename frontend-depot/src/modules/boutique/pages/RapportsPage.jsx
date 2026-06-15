import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { boutiqueApi } from '../services/boutiqueApi';

export default function RapportsPage() {
  const [periode, setPeriode] = useState('mois');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const params = { periode };
  if (dateDebut) params.dateDebut = dateDebut;
  if (dateFin) params.dateFin = dateFin;

  const { data: stats, isLoading } = useQuery({
    queryKey: ['boutique-rapports', params],
    queryFn: async () => {
      const res = await boutiqueApi.getRapports(params);
      return res.data;
    },
  });

  if (isLoading) return <div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;

  const cards = stats ? [
    { icon: '💰', label: 'CA', value: (stats.chiffreAffaires || 0).toLocaleString('fr-FR'), unit: 'F', color: 'text-green-400', bg: 'bg-gradient-to-br from-green-500 to-green-600' },
    { icon: '🧾', label: 'Ventes', value: stats.ventes?.length || 0, unit: '', color: 'text-blue-400', bg: 'bg-gradient-to-br from-blue-500 to-blue-600' },
    { icon: '�', label: 'Dépenses', value: (stats.totalDepenses || 0).toLocaleString('fr-FR'), unit: 'F', color: 'text-red-400', bg: 'bg-gradient-to-br from-red-500 to-red-600' },
    { icon: '�', label: 'Bénéfice', value: (stats.benefice || 0).toLocaleString('fr-FR'), unit: 'F', color: 'text-orange-400', bg: 'bg-gradient-to-br from-orange-500 to-orange-600' },
  ] : [];

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">📊 Rapports</h1>
          <p className="text-slate-400 text-sm mt-1">Synthèse de la boutique</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex gap-2">
            {[{k:'jour',l:'Jour'},{k:'semaine',l:'Semaine'},{k:'mois',l:'Mois'},{k:'annee',l:'Année'}].map(p => (
              <button key={p.k} onClick={() => setPeriode(p.k)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${periode === p.k ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p.l}</button>
            ))}
          </div>
          <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs" />
          <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c, i) => (
          <div key={i} className={`${c.bg} p-5 rounded-2xl`}>
            <div className="flex items-start justify-between mb-3"><span className="text-2xl">{c.icon}</span><span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{c.label}</span></div>
            <p className={`font-black text-3xl ${c.color}`}>{c.value} <span className="text-base text-slate-500">{c.unit}</span></p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="text-white font-bold text-lg mb-4">🏆 Top Articles</h3>
          {(!stats.topArticles || stats.topArticles.length === 0) ? <p className="text-slate-500 py-6 text-center">Aucune donnée</p>
          : <div className="space-y-3">{stats.topArticles.slice(0, 5).map((p, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
              <div className="flex items-center gap-3"><span className="text-slate-500 text-sm font-bold w-5">{i + 1}.</span><span className="text-white text-sm font-semibold">Article #{p.articleId}</span></div>
              <div className="text-right">
                <p className="text-cyan-400 font-bold text-sm">{p._sum.quantite || 0} vendus</p>
                <p className="text-slate-400 text-[10px]">{(p._sum.total || 0).toLocaleString('fr-FR')} F</p>
              </div>
            </div>
          ))}</div>}
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="text-white font-bold text-lg mb-4">📝 Dernières Ventes</h3>
          {(!stats.ventes || stats.ventes.length === 0) ? <p className="text-slate-500 py-6 text-center">Aucune donnée</p>
          : <div className="space-y-3">{stats.ventes.slice(0, 5).map((v, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
              <span className="text-white text-sm font-semibold">#{v.reference || v.id}</span>
              <span className="text-green-400 font-bold text-sm">{(v.total || 0).toLocaleString('fr-FR')} F</span>
            </div>
          ))}</div>}
        </div>
      </div>
    </div>
  );
}
