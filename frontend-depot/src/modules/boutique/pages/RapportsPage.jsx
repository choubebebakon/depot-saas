import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import { boutiqueApi } from '../services/boutiqueApi';
import {
  DollarSign, Receipt, TrendingDown, TrendingUp,
  BarChart3, FileText, Trophy, FileDown, FileSpreadsheet,
} from 'lucide-react';

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

export default function RapportsPage() {
  const notif = useNotif();
  const [periode, setPeriode] = useState('mois');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [exporting, setExporting] = useState(null); // 'pdf' | 'xlsx' | null

  const params = { periode };
  if (dateDebut) params.dateDebut = dateDebut;
  if (dateFin) params.dateFin = dateFin;

  const { data: stats, isLoading } = useQuery({
    queryKey: ['boutique-rapports', params],
    queryFn: async () => {
      const res = await boutiqueApi.getRapports(params);
      return res.data;
    },
    refetchInterval: 30_000,
  });

  // ── Export PDF / Excel ──────────────────────────────────────────────────
  async function handleExport(format) {
    setExporting(format);
    try {
      const res = await boutiqueApi.exportRapport(format, params);
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      const mimeType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const blob = new Blob([res.data], { type: mimeType });
      triggerDownload(blob, `rapport-boutique-${periode}.${ext}`);
      notif.success(`Export ${format.toUpperCase()} téléchargé`);
    } catch (err) {
      // Fallback : si l'endpoint d'export n'est pas encore disponible, générer un CSV côté client
      if (err.response?.status === 404 && stats) {
        const rows = [
          ['Métrique', 'Valeur'],
          ['Chiffre d\'affaires', stats.chiffreAffaires || 0],
          ['Nombre de ventes', stats.ventes?.length || 0],
          ['Total dépenses', stats.totalDepenses || 0],
          ['Bénéfice', stats.benefice || 0],
        ];
        const csv = '\ufeff' + rows.map(r => r.join(';')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        triggerDownload(blob, `rapport-boutique-${periode}.csv`);
        notif.success('Export CSV généré (fallback)');
      } else {
        notif.error(err.response?.data?.message || `Erreur lors de l'export ${format.toUpperCase()}`);
      }
    } finally {
      setExporting(null);
    }
  }

  if (isLoading) return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const cards = stats ? [
    { icon: DollarSign, label: 'CA', value: (stats.chiffreAffaires || 0).toLocaleString('fr-FR'), unit: 'F', color: 'text-green-400', bg: 'bg-gradient-to-br from-green-500 to-green-600' },
    { icon: Receipt, label: 'Ventes', value: stats.ventes?.length || 0, unit: '', color: 'text-blue-400', bg: 'bg-gradient-to-br from-blue-500 to-blue-600' },
    { icon: TrendingDown, label: 'Dépenses', value: (stats.totalDepenses || 0).toLocaleString('fr-FR'), unit: 'F', color: 'text-red-400', bg: 'bg-gradient-to-br from-red-500 to-red-600' },
    { icon: TrendingUp, label: 'Bénéfice', value: (stats.benefice || 0).toLocaleString('fr-FR'), unit: 'F', color: 'text-orange-400', bg: 'bg-gradient-to-br from-orange-500 to-orange-600' },
  ] : [];

  return (
    <div className="p-6">
      {/* ── En-tête ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6" /> Rapports
          </h1>
          <p className="text-slate-400 text-sm mt-1">Synthèse de la boutique</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {/* Filtres période */}
          <div className="flex gap-2">
            {[{ k: 'jour', l: 'Jour' }, { k: 'semaine', l: 'Semaine' }, { k: 'mois', l: 'Mois' }, { k: 'annee', l: 'Année' }].map(p => (
              <button
                key={p.k}
                onClick={() => setPeriode(p.k)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${periode === p.k ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c, i) => (
          <div key={i} className={`${c.bg} p-5 rounded-2xl`}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{c.icon && <c.icon className="w-6 h-6" />}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{c.label}</span>
            </div>
            <p className={`font-black text-3xl ${c.color}`}>
              {c.value} <span className="text-base text-slate-500">{c.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* ── Tableaux ─────────────────────────────────────────────── */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Articles */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5" /> Top Articles
          </h3>
          {(!stats?.topArticles || stats.topArticles.length === 0)
            ? <p className="text-slate-500 py-6 text-center">Aucune donnée</p>
            : (
              <div className="space-y-3">
                {stats.topArticles.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-sm font-bold w-5">{i + 1}.</span>
                      <span className="text-white text-sm font-semibold">Article #{p.articleId}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-cyan-400 font-bold text-sm">{p._sum?.quantite || 0} vendus</p>
                      <p className="text-slate-400 text-[10px]">{(p._sum?.total || 0).toLocaleString('fr-FR')} F</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* Dernières Ventes */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" /> Dernières Ventes
          </h3>
          {(!stats?.ventes || stats.ventes.length === 0)
            ? <p className="text-slate-500 py-6 text-center">Aucune donnée</p>
            : (
              <div className="space-y-3">
                {stats.ventes.slice(0, 5).map((v, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
                    <span className="text-white text-sm font-semibold">#{v.reference || v.id}</span>
                    <span className="text-green-400 font-bold text-sm">{(v.total || 0).toLocaleString('fr-FR')} F</span>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
