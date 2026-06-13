import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { depotApi } from '../services/depotApi';

const RAPPORTS = [
  { id: 'ventes', label: 'Ventes par période', icon: '💰', description: 'Chiffre d\'affaires, quantité vendue' },
  { id: 'stock', label: 'État du stock', icon: '📦', description: 'Stock actuel, valeur, rotation' },
  { id: 'clients_debiteurs', label: 'Clients débiteurs', icon: '👥', description: 'Créances clients' },
  { id: 'commissions', label: 'Commissions commerciaux', icon: '💼', description: 'Performance commerciale' },
  { id: 'tournees', label: 'Rapport tournées', icon: '🛺', description: 'Résultats des tournées' },
  { id: 'depenses', label: 'Dépenses', icon: '💸', description: 'Toutes les dépenses par catégorie' },
];

export default function RapportsPage() {
  const { metier } = useAuth();

  const [selectedRapport, setSelectedRapport] = useState(null);
  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [dateFin, setDateFin] = useState(() => new Date().toISOString().split('T')[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  if (metier !== 'DEPOT_BOISSONS') {
    return <div className="p-8 text-center text-red-400">Accès non autorisé</div>;
  }


  async function handleGenerer() {
    if (!selectedRapport) return;
    setLoading(true);
    try {
      const res = await depotApi.getRapport(selectedRapport, { dateDebut, dateFin });
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(format) {
    if (!selectedRapport) return;
    try {
      const res = await depotApi.exporterRapport(selectedRapport, format, { dateDebut, dateFin });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-${selectedRapport}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  }

  function renderData() {
    if (!data) return null;
    if (Array.isArray(data)) {
    if (data.length === 0) {
        return <p className="text-slate-500 text-center py-6">Aucune donnée pour cette période</p>;
      }
      return (
        <div className="overflow-x-auto rounded-xl border border-slate-700/50 mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
                {Object.keys(data[0]).map(k => (
                  <th key={k} className="text-left p-3 font-semibold">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-slate-800/40">
                  {Object.values(row).map((v, j) => (
                    <td key={j} className="p-3 text-white">{v != null ? String(v) : '-'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <pre className="text-slate-300 text-sm mt-4 bg-slate-800/40 rounded-xl p-4 overflow-x-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">📈 Rapports</h1>
        <p className="text-slate-400 text-sm mt-1">Générez et exportez des rapports</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {RAPPORTS.map(r => (
          <button key={r.id} onClick={() => setSelectedRapport(r.id)}
            className={`text-left p-5 rounded-xl border transition-all ${
              selectedRapport === r.id
                ? 'bg-blue-600/20 border-blue-500/50'
                : 'bg-slate-800/60 border-slate-700/50 hover:bg-slate-700/60'
            }`}>
            <p className="text-2xl mb-2">{r.icon}</p>
            <p className="text-white font-bold text-sm">{r.label}</p>
            <p className="text-xs text-slate-500 mt-1">{r.description}</p>
          </button>
        ))}
      </div>

      {selectedRapport && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-bold text-white">Paramètres du rapport</h2>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Date début</label>
              <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)}
                className="px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Date fin</label>
              <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)}
                className="px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleGenerer} disabled={loading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all text-sm">
              {loading ? '⏳ Génération...' : '📅 Générer le rapport'}
            </button>
            {data && (
              <>
                <button onClick={() => handleExport('pdf')}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all text-sm">📄 Exporter PDF</button>
                <button onClick={() => handleExport('xlsx')}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-sm">📊 Exporter Excel</button>
              </>
            )}
          </div>

          {renderData()}
        </div>
      )}
    </div>
  );
}
