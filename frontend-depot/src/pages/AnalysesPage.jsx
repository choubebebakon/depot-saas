import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, Cell, PieChart, Pie
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useDepot } from '../contexts/DepotContext';
import { TrendingUp, BarChart2, PieChart as PieIcon, Calendar, ArrowUpRight } from 'lucide-react';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

const AnalysesPage = () => {
  const { user } = useAuth();
  const { depotId } = useDepot();
  const [periode, setPeriode] = useState('MOIS');

  // 1. Fetch Profitabilité
  const { data: profitData, isLoading: loadingProfit } = useQuery({
    queryKey: ['analyses-profit', user?.tenantId, depotId, periode],
    queryFn: async () => {
      const res = await axios.get('/analyses/profitabilite', {
        params: { tenantId: user.tenantId, depotId, periode },
      });
      return res.data;
    },
    enabled: !!user?.tenantId
  });

  // 2. Fetch Rotation
  const { data: rotationData } = useQuery({
    queryKey: ['analyses-rotation', user?.tenantId, depotId],
    queryFn: async () => {
      const res = await axios.get('/analyses/rotation', {
        params: { tenantId: user.tenantId, depotId },
      });
      return res.data;
    },
    enabled: !!user?.tenantId
  });

  // 3. Fetch Prévisions (Mocké par le backend pour l'instant)
  const { data: prevData } = useQuery({
    queryKey: ['analyses-previsions', user?.tenantId, depotId],
    queryFn: async () => {
      const res = await axios.get('/analyses/previsions', {
        params: { tenantId: user.tenantId, depotId },
      });
      return res.data;
    },
    enabled: !!user?.tenantId
  });

  if (loadingProfit) return <div className="p-8 text-center">Calcul des analyses en cours...</div>;

  return (
    <div className="p-6 pb-24 space-y-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Analyses Business Intelligence</h1>
          <p className="text-slate-500 mt-1">Suivez la performance et prévoyez vos besoins en stock.</p>
        </div>
        <div className="flex items-center space-x-2 bg-white p-1 rounded-lg shadow-sm border border-slate-200">
          {['JOUR', 'MOIS', 'ANNEE'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriode(p)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                periode === p 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p === 'JOUR' ? 'Aujourd\'hui' : p === 'MOIS' ? 'Ce Mois' : 'Cette Année'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Graph 1: Top Profitabilité */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <ArrowUpRight size={20} />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">Top 5 Rentabilité (Marge Brute)</h2>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitData?.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="designation" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${value.toLocaleString()} FCFA`, 'Marge']}
                />
                <Bar dataKey="marge" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40}>
                   {profitData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 2: Rotation des Stocks */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                <TrendingUp size={20} />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">Taux de Rotation (30 derniers jours)</h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">Ventes / Stock Moyen</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rotationData?.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="article" type="category" tick={{fontSize: 10}} width={120} axisLine={false} />
                <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="rotation" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 3: Prévisions vs Réel */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <Calendar size={20} />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Tendances : Prévisions vs Réel</h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={prevData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="labels" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="reel" stroke="#6366f1" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="previsions" stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 rounded-2xl text-white shadow-lg overflow-hidden relative group">
          <div className="flex flex-col">
            <span className="text-indigo-100 text-sm font-medium uppercase tracking-wider">Marge Moyenne</span>
            <span className="text-3xl font-bold mt-2">24.5%</span>
          </div>
          <BarChart2 className="absolute -bottom-4 -right-4 w-24 h-24 opacity-10 group-hover:scale-110 transition-transform" />
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-slate-500 text-sm font-medium">Rotation Globale</p>
            <p className="text-2xl font-bold text-slate-800">4.2 <span className="text-sm font-normal text-slate-400">/ mois</span></p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl">
             <TrendingUp className="text-indigo-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-slate-500 text-sm font-medium">Produits Top-Vente</p>
            <p className="text-2xl font-bold text-slate-800">12 <span className="text-sm font-normal text-slate-400">articles</span></p>
          </div>
          <div className="p-3 bg-pink-50 rounded-xl">
             <PieIcon className="text-pink-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysesPage;




