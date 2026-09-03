import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useDepot } from '../contexts/DepotContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Users, Target, RefreshCcw, AlertTriangle } from 'lucide-react';

const money = (value) => `${Number(value || 0).toLocaleString('fr-FR')} FCFA`;
const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function AnalysesPage() {
  const { user } = useAuth();
  const { depotId } = useDepot();
  const [month, setMonth] = useState(currentMonth);

  const headers = useMemo(() => ({
    ...(depotId ? { 'X-Depot-Id': depotId } : {}),
    'X-Report-Month': month,
  }), [depotId, month]);

  const queryOptions = (key, url) => ({
    queryKey: ['rapports', key, user?.tenantId, depotId, month],
    queryFn: async () => (await axios.get(url, { headers })).data,
    enabled: Boolean(user?.tenantId && month),
    staleTime: 30_000,
  });

  const topQuery = useQuery(queryOptions('top-marge', '/rapports/top-produits-marge'));
  const commercialQuery = useQuery(queryOptions('commerciaux', '/rapports/performance-commerciaux'));
  const pointMortQuery = useQuery(queryOptions('point-mort', '/rapports/point-mort'));

  const topProducts = Array.isArray(topQuery.data) ? topQuery.data : [];
  const commerciaux = Array.isArray(commercialQuery.data) ? commercialQuery.data : [];
  const pointMort = pointMortQuery.data;
  const loading = topQuery.isLoading || commercialQuery.isLoading || pointMortQuery.isLoading;
  const error = topQuery.error || commercialQuery.error || pointMortQuery.error;

  const margeTotale = topProducts.reduce((sum, row) => sum + Number(row.margeBrute || 0), 0);
  const caTopProduits = topProducts.reduce((sum, row) => sum + Number(row.chiffreAffaires || 0), 0);
  const meilleureEquipe = commerciaux[0];

  const refresh = () => {
    topQuery.refetch();
    commercialQuery.refetch();
    pointMortQuery.refetch();
  };

  return (
    <div className="p-6 pb-24 space-y-8 bg-slate-50 min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Analyses Business</h1>
          <p className="text-slate-500 mt-1">Indicateurs calculés à partir des données réelles de votre activité.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white"
            aria-label="Mois analysé"
          />
          <button onClick={refresh} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100" type="button">
            <RefreshCcw size={17} /> Actualiser
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 flex items-start gap-3">
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <div><strong>Impossible de charger les analyses.</strong><p className="text-sm mt-1">Les données affichées restent uniquement celles confirmées par le serveur.</p></div>
        </div>
      )}

      {loading && <div className="rounded-xl bg-white border border-slate-200 p-5 text-slate-500">Calcul des indicateurs en cours...</div>}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-medium">Marge brute — top produits</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{money(margeTotale)}</p>
          <p className="text-xs text-slate-400 mt-2">{topProducts.length} produit(s) remonté(s) par le serveur</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-medium">Chiffre d'affaires — top produits</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{money(caTopProduits)}</p>
          <p className="text-xs text-slate-400 mt-2">Période : {month}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-medium">Point mort mensuel</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{money(pointMort?.pointMortCA)}</p>
          <p className={`text-xs mt-2 ${pointMort?.atteint ? 'text-emerald-600' : 'text-amber-600'}`}>
            {pointMort ? (pointMort.atteint ? 'Point mort atteint' : `${Number(pointMort.progression || 0).toLocaleString('fr-FR')} % de progression`) : 'Données indisponibles'}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6"><TrendingUp size={20} /><h2 className="text-lg font-semibold">Top produits par marge</h2></div>
          <div className="h-80">
            {topProducts.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="designation" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip formatter={(value) => money(value)} />
                  <Bar dataKey="margeBrute" name="Marge brute" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-slate-400">Aucune donnée pour cette période.</div>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6"><Users size={20} /><h2 className="text-lg font-semibold">Performance commerciaux</h2></div>
          <div className="space-y-3 max-h-80 overflow-auto">
            {commerciaux.length ? commerciaux.map((row) => (
              <div key={row.commercialId} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-slate-50">
                <div className="min-w-0"><p className="font-medium truncate">{row.email}</p><p className="text-xs text-slate-500">{row.nbVentes} vente(s) · {row.nbTournees} tournée(s)</p></div>
                <div className="text-right shrink-0"><p className="font-semibold">{money(row.chiffreAffaires)}</p><p className="text-xs text-slate-500">score {Number(row.scorePerformance || 0).toLocaleString('fr-FR')}</p></div>
              </div>
            )) : <div className="h-64 flex items-center justify-center text-slate-400">Aucun commercial concerné.</div>}
          </div>
        </div>
      </section>

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6"><Target size={20} /><h2 className="text-lg font-semibold">Lecture du point mort</h2></div>
        {pointMort ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><p className="text-sm text-slate-500">CA</p><p className="font-semibold">{money(pointMort.chiffreAffaires)}</p></div>
            <div><p className="text-sm text-slate-500">Marge brute</p><p className="font-semibold">{money(pointMort.margeBrute)}</p></div>
            <div><p className="text-sm text-slate-500">Charges</p><p className="font-semibold">{money(pointMort.chargesFixes)}</p></div>
            <div><p className="text-sm text-slate-500">Reste</p><p className="font-semibold">{money(pointMort.restePourPointMort)}</p></div>
          </div>
        ) : <p className="text-slate-400">Aucune donnée disponible.</p>}
      </section>

      {meilleureEquipe && <p className="text-xs text-slate-400">Meilleure performance calculée : {meilleureEquipe.email}.</p>}
    </div>
  );
}
