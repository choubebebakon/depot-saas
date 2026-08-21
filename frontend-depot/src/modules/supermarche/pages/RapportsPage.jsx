import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotif } from '../../../context/NotifContext';
import api from '../../../api/axios';
import {
  BarChart3, Receipt, DollarSign, TrendingUp,
  Package, Trophy, FileDown, FileSpreadsheet,
} from 'lucide-react';

const cleanParams = (params) => Object.fromEntries(
  Object.entries(params).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
);

// ─── Utilitaire : déclenchement de téléchargement depuis un Blob ───────────
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function MiniBar({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-400 text-xs w-24 truncate">{label}</span>
      <div className="flex-1 bg-slate-700/50 rounded-full h-2">
        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color || '#f59e0b' }} />
      </div>
      <span className="text-white text-xs font-bold w-24 text-right">{(value || 0).toLocaleString('fr-FR')} F</span>
    </div>
  );
}

export default function RapportsPage() {
  const { tenantId } = useAuth();
  const notif = useNotif();
  const [periode, setPeriode] = useState('mois');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [exporting, setExporting] = useState(null); // 'pdf' | 'xlsx' | null

  const params = { periode };
  if (dateDebut) params.dateDebut = dateDebut;
  if (dateFin) params.dateFin = dateFin;

  const { data: stats, isLoading: loading } = useQuery({
    queryKey: ['supermarche-rapports', tenantId, params],
    queryFn: async () => {
      const res = await api.get('/supermarche/rapports', { params: cleanParams(params) });
      return res.data;
    },
    enabled: !!tenantId,
    refetchInterval: 30_000,
  });

  // ── Export PDF / Excel ──────────────────────────────────────────────────
  async function handleExport(format) {
    setExporting(format);
    try {
      const res = await api.get('/supermarche/rapports/export', {
        params: cleanParams({ ...params, format }),
        responseType: 'blob',
      });
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      const mimeType = format === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const blob = new Blob([res.data], { type: mimeType });
      triggerDownload(blob, `rapport-supermarche-${periode}.${ext}`);
      notif.success(`Export ${format.toUpperCase()} téléchargé`);
    } catch (err) {
      // Fallback CSV côté client si l'endpoint d'export n'est pas encore disponible
      if (err.response?.status === 404 && stats) {
        const rows = [
          ['Métrique', 'Valeur'],
          ['CA total', stats.caTotal || 0],
          ['Transactions', stats.transactions || 0],
          ['Dépenses', stats.depenses || 0],
          ['Marge', stats.marge || 0],
        ];
        const csv = '\ufeff' + rows.map(r => r.join(';')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        triggerDownload(blob, `rapport-supermarche-${periode}.csv`);
        notif.success('Export CSV généré (fallback)');
      } else {
        notif.error(err.response?.data?.message || `Erreur lors de l'export ${format.toUpperCase()}`);
      }
    } finally {
      setExporting(null);
    }
  }

  if (loading) return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* ── En-tête ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Rapports</h1>
          <p className="text-slate-400 text-sm">Période : {periode}</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-2">
            {[{ k: 'jour', l: 'Jour' }, { k: 'semaine', l: 'Semaine' }, { k: 'mois', l: 'Mois' }, { k: 'annee', l: 'Année' }].map(p => (
              <button
                key={p.k}
                onClick={() => setPeriode(p.k)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${periode === p.k ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                {p.l}
              </button>
            ))}
          </div>
          <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs" />
          <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs" />

          {/* Boutons export */}
          {stats && (
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('pdf')}
                disabled={!!exporting}
                title="Exporter en PDF"
                className="px-3 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
              >
                <FileDown className="w-3.5 h-3.5" />
                {exporting === 'pdf' ? '...' : 'PDF'}
              </button>
              <button
                onClick={() => handleExport('xlsx')}
                disabled={!!exporting}
                title="Exporter en Excel"
                className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                {exporting === 'xlsx' ? '...' : 'Excel'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: 'CA total', value: `${(stats?.caTotal || 0).toLocaleString('fr-FR')} F`, color: '#10b981' },
          { icon: Receipt, label: 'Transactions', value: stats?.transactions || 0, color: '#3b82f6' },
          { icon: DollarSign, label: 'Dépenses', value: `${(stats?.depenses || 0).toLocaleString('fr-FR')} F`, color: '#ef4444' },
          { icon: TrendingUp, label: 'Marge', value: `${(stats?.marge || 0).toLocaleString('fr-FR')} F`, color: '#f59e0b' },
        ].map((k, i) => (
          <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl mb-3" style={{ backgroundColor: k.color + '22' }}>
              {k.icon && <k.icon className="w-6 h-6" />}
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{k.label}</p>
            <p className="text-white font-black text-2xl leading-none">{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── Graphiques ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventes par rayon */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-white font-black text-sm mb-4 flex items-center gap-2">
            <Package className="w-4 h-4" /> Ventes par rayon
          </h2>
          <div className="space-y-3">
            {stats?.rayons?.map((r, i) => (
              <MiniBar key={i} label={r.nom} value={r.montant} max={Math.max(...(stats?.rayons?.map(x => x.montant) || [1]))} color={r.couleur || '#f59e0b'} />
            ))}
            {(!stats?.rayons || stats.rayons.length === 0) && (
              <p className="text-slate-500 text-sm text-center py-6">Aucune donnée</p>
            )}
          </div>
        </div>

        {/* Top produits */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-white font-black text-sm mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4" /> Top produits
          </h2>
          <div className="space-y-3">
            {stats?.topProduits?.map((p, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-900/50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-xs font-bold">#{i + 1}</span>
                  <span className="text-white font-semibold text-sm">{p.nom}</span>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-xs">{p.qte} vendus</p>
                  <p className="text-slate-400 text-[10px]">{(p.ca || 0).toLocaleString('fr-FR')} F</p>
                </div>
              </div>
            ))}
            {(!stats?.topProduits || stats.topProduits.length === 0) && (
              <p className="text-slate-500 text-sm text-center py-8">Aucune donnée</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
