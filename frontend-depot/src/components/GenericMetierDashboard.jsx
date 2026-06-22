import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { getMetierConfig, getMetierWidgets } from '../config/metier-dashboard.config';

export default function GenericMetierDashboard() {
  const { metier } = useAuth();
  const metierKey = metier || localStorage.getItem('gestock_metier') || 'DEPOT_BOISSONS';
  const config = getMetierConfig(metierKey);
  const widgets = getMetierWidgets(metierKey);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['generic-dashboard-stats', metierKey],
    queryFn: async () => {
      const slug = metierKey.toLowerCase();
      const res = await api.get('/' + slug + '/stats');
      return res.data;
    },
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
            style={{ backgroundColor: config?.couleur ? config.couleur + '20' : '#1e293b' }}
          >
            <span>{config?.icon || '📋'}</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {config?.label || 'Dashboard'}
            </h1>
            <p className="text-slate-400 text-sm">{config?.description || ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/30">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-xs font-bold text-emerald-400">En direct</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {widgets.map((w, i) => (
          <div key={w.id} className="bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700/50">
            <div
              className="h-2 w-full"
              style={{ background: `linear-gradient(90deg, ${w.color || config?.couleur || '#6366f1'} 0%, ${w.color || config?.couleur || '#6366f1'}88 100%)` }}
            />
            <div className="p-5">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">{w.label}</p>
              <p className="text-2xl font-black text-white mt-2">
                {stats && stats[w.id] != null ? stats[w.id] : '---'}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <h2 className="text-lg font-bold text-white mb-4">Menus du module</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {config?.menus?.filter(m => m.path !== '/dashboard').map((menu, i) => (
            <a
              key={i}
              href={menu.path}
              className="flex items-center gap-3 p-4 bg-slate-700/30 hover:bg-slate-700/60 rounded-xl transition-all border border-slate-700/30 hover:border-slate-600/50"
            >
              <span className="text-xl">{menu.icon}</span>
              <span className="text-sm font-medium text-white">{menu.label}</span>
              {menu.badge && (
                <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded-full">
                  {menu.badge}
                </span>
              )}
            </a>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <h2 className="text-lg font-bold text-white mb-4">Actions rapides</h2>
          <div className="grid grid-cols-2 gap-4">
            {config?.menus?.slice(0, 4).map((menu, i) => (
              <a
                key={i}
                href={menu.path}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-700/30 hover:bg-slate-700/60 rounded-xl transition-all border border-slate-700/30"
              >
                <span className="text-2xl">{menu.icon}</span>
                <span className="text-xs font-medium text-white text-center">{menu.label}</span>
              </a>
            ))}
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <h2 className="text-lg font-bold text-white mb-4">Aperçu modules</h2>
          <p className="text-slate-400 text-sm mb-4">
            {config?.menus?.length || 0} modules disponibles pour {config?.label || 'ce métier'}
          </p>
          <div className="space-y-2">
            {config?.menus?.slice(0, 5).map((menu, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-700/30 last:border-0">
                <span className="text-lg">{menu.icon}</span>
                <span className="text-sm text-slate-300">{menu.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}