import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useSite } from '../contexts/SiteContext';

function getCurrentMonth() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${month}`;
}

function StatCard({ title, value, subtitle, tone = 'slate' }) {
  const tones = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    slate: 'bg-slate-800/50 border-slate-700 text-slate-300',
  };

  return (
    <div className={`rounded-2xl border p-5 ${tones[tone] || tones.slate}`}>
      <p className="text-xs font-bold uppercase tracking-widest mb-2 opacity-90">{title}</p>
      <p className="text-3xl font-black text-white">{value}</p>
      {subtitle ? <p className="text-sm mt-1 opacity-80">{subtitle}</p> : null}
    </div>
  );
}

export default function RapportsPage() {
  const { tenantId } = useAuth();
  const { siteId } = useSite();
  const [month, setMonth] = useState(getCurrentMonth());
  const [topProduits, setTopProduits] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [pointMort, setPointMort] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError('');
    try {
      const [resTop, resPerf, resPointMort] = await Promise.all([
        api.get('/rapports/top-produits-marge', { params: { tenantId, siteId, month } }),
        api.get('/rapports/performance-commerciaux', { params: { tenantId, month } }),
        api.get('/rapports/point-mort', { params: { tenantId, siteId, month } }),
      ]);

      setTopProduits(Array.isArray(resTop.data) ? resTop.data : []);
      setPerformance(Array.isArray(resPerf.data) ? resPerf.data : []);
      setPointMort(resPointMort.data || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger les rapports.');
    } finally {
      setLoading(false);
    }
  }, [tenantId, siteId, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const topCommercial = useMemo(() => performance[0] || null, [performance]);

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Rapports & Intelligence</h1>
          <p className="text-slate-400 text-sm mt-1">Marge, performance terrain et point mort mensuel.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-slate-900 border border-slate-600 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={fetchData}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-bold text-white transition-all"
          >
            Actualiser
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 rounded-2xl bg-slate-800" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Point mort"
              value={`${(pointMort?.pointMortCA || 0).toLocaleString('fr-FR')} FCFA`}
              subtitle={pointMort?.atteint ? 'Déjà atteint ce mois' : 'Objectif de CA pour couvrir les charges'}
              tone={pointMort?.atteint ? 'emerald' : 'amber'}
            />
            <StatCard
              title="CA du mois"
              value={`${(pointMort?.chiffreAffaires || 0).toLocaleString('fr-FR')} FCFA`}
              subtitle={`${pointMort?.nbVentes || 0} ventes validées`}
              tone="indigo"
            />
            <StatCard
              title="Marge brute"
              value={`${(pointMort?.margeBrute || 0).toLocaleString('fr-FR')} FCFA`}
              subtitle={`Taux de marge ${pointMort?.tauxMarge || 0}%`}
              tone="emerald"
            />
            <StatCard
              title="Charges du mois"
              value={`${(pointMort?.chargesFixes || 0).toLocaleString('fr-FR')} FCFA`}
              subtitle={`${pointMort?.nbDepenses || 0} dépenses enregistrées`}
              tone="rose"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <section className="xl:col-span-5 rounded-2xl border border-slate-700 bg-slate-800/50 overflow-hidden">
              <div className="border-b border-slate-700 px-6 py-4">
                <h2 className="text-white font-black">Top 5 produits par marge</h2>
                <p className="text-slate-400 text-sm mt-1">Classement des articles qui rapportent le plus en marge brute.</p>
              </div>
              <div className="divide-y divide-slate-700/50">
                {topProduits.length === 0 ? (
                  <div className="px-6 py-10 text-sm text-slate-500">Aucune vente validée sur la période.</div>
                ) : topProduits.map((produit, index) => (
                  <div key={produit.articleId} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-1">#{index + 1}</p>
                        <p className="text-white font-bold">{produit.designation}</p>
                        <p className="text-xs text-slate-500 mt-1">{produit.quantiteVendue} unités · CA {produit.chiffreAffaires.toLocaleString('fr-FR')} FCFA</p>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-black">{produit.margeBrute.toLocaleString('fr-FR')} FCFA</p>
                        <p className="text-xs text-slate-500 mt-1">Taux {produit.tauxMarge}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="xl:col-span-7 rounded-2xl border border-slate-700 bg-slate-800/50 overflow-hidden">
              <div className="border-b border-slate-700 px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-white font-black">Performance commerciaux</h2>
                    <p className="text-slate-400 text-sm mt-1">Volume validé, marge, tournées, écarts et encaissements terrain.</p>
                  </div>
                  {topCommercial && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-right">
                      <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Meilleur score</p>
                      <p className="text-white font-black">{topCommercial.email}</p>
                    </div>
                  )}
                </div>
              </div>
              {performance.length === 0 ? (
                <div className="px-6 py-10 text-sm text-slate-500">Aucun commercial trouvé sur cette période.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-500 text-xs uppercase tracking-widest border-b border-slate-700">
                        <th className="px-6 py-4">Commercial</th>
                        <th className="px-6 py-4">CA</th>
                        <th className="px-6 py-4">Marge</th>
                        <th className="px-6 py-4">Ventes</th>
                        <th className="px-6 py-4">Tournées</th>
                        <th className="px-6 py-4">Écart</th>
                        <th className="px-6 py-4">Casses</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {performance.map((row) => (
                        <tr key={row.commercialId} className="hover:bg-slate-700/30">
                          <td className="px-6 py-4">
                            <p className="text-white font-bold">{row.email}</p>
                            <p className="text-xs text-slate-500 mt-1">Score {row.scorePerformance.toLocaleString('fr-FR')}</p>
                          </td>
                          <td className="px-6 py-4 text-slate-300">{row.chiffreAffaires.toLocaleString('fr-FR')}</td>
                          <td className="px-6 py-4 text-emerald-400 font-bold">{row.margeBrute.toLocaleString('fr-FR')}</td>
                          <td className="px-6 py-4 text-slate-300">
                            {row.nbVentes}
                            <div className="text-xs text-slate-500 mt-1">Ticket moyen {row.moyenneTicket.toLocaleString('fr-FR')}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            {row.nbTournees}
                            <div className="text-xs text-slate-500 mt-1">{row.nbTourneesValidees} validées</div>
                          </td>
                          <td className="px-6 py-4 text-orange-400">{row.ecartStockTotal}</td>
                          <td className="px-6 py-4 text-rose-400">{row.nbCasses}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          {pointMort && (
            <section className="mt-6 rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
              <h2 className="text-white font-black mb-3">Lecture point mort</h2>
              {pointMort.atteint ? (
                <p className="text-emerald-300 text-sm leading-relaxed">
                  Le point mort est atteint pour {pointMort.month}. Le surplus au-dessus du point mort est de{' '}
                  <strong>{pointMort.surplusApresPointMort.toLocaleString('fr-FR')} FCFA</strong>.
                </p>
              ) : (
                <p className="text-amber-300 text-sm leading-relaxed">
                  Le point mort n’est pas encore atteint pour {pointMort.month}. Il reste{' '}
                  <strong>{pointMort.restePourPointMort.toLocaleString('fr-FR')} FCFA</strong> de chiffre d’affaires validé
                  à générer pour couvrir les charges enregistrées.
                </p>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
