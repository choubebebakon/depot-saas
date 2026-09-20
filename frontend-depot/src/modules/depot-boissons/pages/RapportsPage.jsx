import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermission } from '../../../shared/hooks/usePermission';
import { useNotif } from '../../../context/NotifContext';
import { useDepot } from '../../../contexts/DepotContext';
import { depotApi } from '../services/depotApi';
import { Coins, Package, Users, Briefcase, Car, HandCoins, Download, RefreshCw, Loader2 } from 'lucide-react';

const RAPPORTS = [
  // §10 — chaque onglet est rattaché à son sous-module de permission :
  // 'rapports' (financier), 'rapports_stock' (stock), 'rapports_performance'.
  { id: 'ventes', label: 'Ventes par période', icon: Coins, description: 'Chiffre d\'affaires, quantité vendue', color: '#3b82f6', sousModule: 'rapports' },
  { id: 'stock', label: 'État du stock', icon: Package, description: 'Stock actuel, valeur, rotation', color: '#8b5cf6', sousModule: 'rapports_stock' },
  { id: 'clients_debiteurs', label: 'Clients débiteurs', icon: Users, description: 'Créances clients', color: '#ef4444', sousModule: 'rapports' },
  { id: 'commissions', label: 'Commissions commerciaux', icon: Briefcase, description: 'Performance commerciale', color: '#f59e0b', sousModule: 'rapports_performance' },
  { id: 'tournees', label: 'Rapport tournées', icon: Car, description: 'Résultats des tournées', color: '#10b981', sousModule: 'rapports' },
  { id: 'depenses', label: 'Dépenses', icon: HandCoins, description: 'Toutes les dépenses par catégorie', color: '#ec4899', sousModule: 'rapports' },
];

const money = (v) => `${Number(v || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} FCFA`;
const COLUMN_LABELS = {
  id: 'ID', reference: 'Référence', date: 'Date', createdAt: 'Date', total: 'Total', montant: 'Montant',
  designation: 'Désignation', nom: 'Nom', quantite: 'Quantité', statut: 'Statut', solde: 'Solde',
  plafondCredit: 'Plafond crédit', telephone: 'Téléphone', email: 'Email', prixVente: 'Prix vente',
  prixAchat: 'Prix achat', stock: 'Stock', valeur: 'Valeur', rotation: 'Rotation', depot: 'Dépôt',
  client: 'Client', commercial: 'Commercial', tricycle: 'Tricycle', categorie: 'Catégorie', note: 'Note',
};

const formatCellValue = (key, value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  if (/date|created|updated/i.test(key) && !Number.isNaN(new Date(value).getTime())) {
    return new Date(value).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  }
  if (/(total|montant|prix|valeur|solde|plafond|ca)/i.test(key) && !Number.isNaN(Number(value))) {
    return money(value);
  }
  return String(value);
};

export default function RapportsPage({ preset = null }) {
  const { metier } = useAuth();
  const notif = useNotif();
  const depot = useDepot();
  const depotId = depot?.depotId ?? depot?.depotActif?.id ?? null;

  // §10 — granularité des rapports : chaque onglet n'est visible (et chaque
  // requête n'est lancée) que si le sous-module correspondant est autorisé.
  const { canRead: canRapports } = usePermission('rapports');
  const { canRead: canRapportsStock } = usePermission('rapports_stock');
  const { canRead: canRapportsPerf } = usePermission('rapports_performance');
  const canReadBySousModule = {
    rapports: canRapports,
    rapports_stock: canRapportsStock,
    rapports_performance: canRapportsPerf,
  };
  const visibleRapports = RAPPORTS.filter(
    (r) => canReadBySousModule[r.sousModule],
  );
  const canRead = visibleRapports.length > 0;

  const [selectedRapport, setSelectedRapport] = useState(
    preset && RAPPORTS.some((r) => r.id === preset) ? preset : null,
  );
  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [dateFin, setDateFin] = useState(() => new Date().toISOString().split('T')[0]);

  const params = useMemo(() => ({ dateDebut, dateFin, depotId }), [dateDebut, dateFin, depotId]);

  // §13 — aucune requête si le rapport sélectionné n'est pas autorisé.
  const selectedIsAllowed =
    !!selectedRapport &&
    visibleRapports.some((r) => r.id === selectedRapport);

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['depot-rapports', 'rapports', selectedRapport, params],
    queryFn: async () => {
      const res = await depotApi.getRapport(selectedRapport, params);
      return res.data;
    },
    enabled: Boolean(metier === 'DEPOT_BOISSONS' && depotId && selectedIsAllowed),
    staleTime: 60_000,
    refetchInterval: selectedIsAllowed ? 30_000 : false,
    refetchIntervalInBackground: false,
  });

  // §10 — normalisation de la charge utile + totaux affichés. Ces hooks sont
  // déclarés AVANT les sorties anticipées (react-hooks/rules-of-hooks : l'ordre
  // des hooks doit rester identique à chaque rendu).
  const rowsFlat = useMemo(
    () => (Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])),
    [data],
  );
  const numericTotals = useMemo(() => {
    if (!rowsFlat.length) return null;
    const totals = {};
    rowsFlat.forEach((row) => {
      Object.entries(row).forEach(([key, value]) => {
        if (typeof value === 'number' && /(total|montant|quantite|valeur|solde)/i.test(key)) {
          totals[key] = (totals[key] || 0) + value;
        }
      });
    });
    return Object.keys(totals).length ? totals : null;
  }, [rowsFlat]);

  if (metier !== 'DEPOT_BOISSONS') {
    return <div className="p-8 text-center text-red-400">Accès non autorisé</div>;
  }

  if (!depotId) {
    return <div className="p-6 text-center text-red-400 font-bold">Dépôt non sélectionné</div>;
  }

  if (!canRead) {
    return <div className="p-8 text-center text-red-400">Accès non autorisé</div>;
  }

  async function handleExport(format) {
    if (!selectedIsAllowed) return;
    let url = null;
    try {
      const res = await depotApi.exporterRapport(selectedRapport, format, params);
      const ext = format === 'pdf' ? 'pdf' : 'csv';
      const mimeType = format === 'pdf'
        ? 'application/pdf'
        : 'text/csv';
      const blob = new Blob([res.data], { type: mimeType });
      url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-${selectedRapport}-${dateDebut}-${dateFin}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      notif.success(`Export ${format.toUpperCase()} téléchargé`);
    } catch (err) {
      notif.error(err.response?.data?.message || `Erreur lors de l'export ${format.toUpperCase()}`);
    } finally {
      if (url) URL.revokeObjectURL(url);
    }
  }

  function renderData() {
    if (!data) return null;
    if (!rowsFlat.length) {
      return <p className="text-slate-500 text-center py-10">Aucune donnée pour cette période</p>;
    }
    return (
      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-700/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
              {Object.keys(rowsFlat[0]).map((k) => (
                <th key={k} className="text-left p-3 font-semibold">{COLUMN_LABELS[k] || k}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {rowsFlat.map((row, i) => (
              <tr key={i} className="hover:bg-slate-800/40">
                {Object.entries(row).map(([k, v], j) => (
                  <td key={j} className="p-3 text-white">{formatCellValue(k, v)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Rapports</h1>
          <p className="text-slate-400 text-sm mt-1">Générez, actualisez et exportez vos rapports — dépôt : {depot?.depotActif?.nom || '—'}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className={`inline-flex h-2.5 w-2.5 rounded-full ${isFetching ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
          {isFetching ? 'Actualisation…' : 'Données à jour (30 s)'}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleRapports.map((r) => (
          <button key={r.id} type="button" onClick={() => setSelectedRapport(r.id)}
            className={`text-left p-5 rounded-2xl border transition-all ${selectedRapport === r.id
              ? 'bg-blue-600/20 border-blue-500/50 shadow-lg shadow-blue-600/10'
              : 'bg-slate-800/60 border-slate-700/50 hover:bg-slate-700/60'
            }`}>
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-xl p-2" style={{ backgroundColor: `${r.color}22`, color: r.color }}>
                <r.icon size={22} />
              </div>
              <p className="text-white font-bold text-sm">{r.label}</p>
            </div>
            <p className="text-xs text-slate-500">{r.description}</p>
          </button>
        ))}
      </div>

      {selectedRapport && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-bold text-white">Paramètres du rapport</h2>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Date début</label>
              <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)}
                className="px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Date fin</label>
              <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)}
                className="px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => refetch()} disabled={isFetching}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all text-sm">
              <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} /> Actualiser
            </button>
            <button type="button" onClick={() => handleExport('pdf')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all text-sm">
              <Download size={15} /> PDF
            </button>
            <button type="button" onClick={() => handleExport('csv')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-sm">
              <Download size={15} /> Excel (CSV)
            </button>
          </div>

          {numericTotals && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(numericTotals).map(([key, value]) => (
                <div key={key} className="rounded-2xl bg-slate-900/80 border border-slate-700/60 p-4">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{COLUMN_LABELS[key] || key}</p>
                  <p className="mt-1 text-lg font-black text-white">{money(value)}</p>
                </div>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Génération du rapport…
            </div>
          ) : isError ? (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-center">
              <p className="font-bold text-red-300">
                {error?.response?.status === 403
                  ? 'Accès refusé : votre rôle ne permet pas de consulter ce rapport.'
                  : error?.response?.data?.message || 'Impossible de générer ce rapport. Réessayez.'}
              </p>
              <button type="button" onClick={() => refetch()} className="mt-3 rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700">
                Réessayer
              </button>
            </div>
          ) : renderData()}
        </div>
      )}
    </div>
  );
}
