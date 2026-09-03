import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, PackageCheck, RefreshCw, Truck } from 'lucide-react';
import { usePagination } from '../../../hooks/usePagination';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotif } from '../../../context/NotifContext';
import { usePermission } from '../../../shared/hooks/usePermission';
import { useDepot } from '../../../contexts/DepotContext';
import { depotApi } from '../services/depotApi';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('fr-FR');
}

function statusLabel(status) {
  if (status === 'VALIDEE') return 'Validée';
  if (status === 'ANNULEE') return 'Annulée';
  return 'En cours';
}

function statusClass(status) {
  if (status === 'VALIDEE') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20';
  if (status === 'ANNULEE') return 'bg-red-500/15 text-red-300 border-red-500/20';
  return 'bg-amber-500/15 text-amber-300 border-amber-500/20';
}

export default function LivraisonsPage() {
  const { metier } = useAuth();
  const { canWrite } = usePermission('livraisons');
  const { depotId, depotActif } = useDepot();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const notif = useNotif();
  const [filtreStatut, setFiltreStatut] = useState('');

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['depot-livraisons', depotId],
    queryFn: async () => {
      const res = await depotApi.getLivraisons();
      return Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
    },
    enabled: metier === 'DEPOT_BOISSONS' && Boolean(depotId),
    staleTime: 15_000,
  });

  const livraisons = useMemo(() => {
    const rows = Array.isArray(data) ? data : [];
    if (!filtreStatut) return rows;
    return rows.filter((row) => row.statut === filtreStatut);
  }, [data, filtreStatut]);

  const { currentPage, setCurrentPage, nextPage, prevPage, totalPages, totalItems, paginatedData: paginated } = usePagination(livraisons, 10);

  const stats = useMemo(() => {
    const rows = Array.isArray(data) ? data : [];
    return {
      total: rows.length,
      enCours: rows.filter((row) => row.statut === 'EN_COURS').length,
      validees: rows.filter((row) => row.statut === 'VALIDEE').length,
      annulees: rows.filter((row) => row.statut === 'ANNULEE').length,
    };
  }, [data]);

  const handleRefresh = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['depot-livraisons', depotId] });
      await refetch();
    } catch (error) {
      notif.error(error?.response?.data?.message || 'Impossible de rafraîchir les livraisons');
    }
  };

  if (metier !== 'DEPOT_BOISSONS') {
    return <div className="p-8 text-center text-red-400">Accès non autorisé</div>;
  }

  if (!depotId) {
    return <div className="p-6 text-center text-red-400 font-bold">Dépôt non sélectionné</div>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300 border border-blue-500/20">
              <Truck size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Livraisons</h1>
              <p className="text-slate-400 text-sm mt-1">Suivi des réceptions fournisseur du dépôt actif.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canWrite && (
            <button
              type="button"
              onClick={() => navigate('/depot/achats')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm"
            >
              <PackageCheck size={17} />
              Nouvelle réception
            </button>
          )}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isFetching}
            aria-label="Rafraîchir les livraisons"
            className="inline-flex items-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-sm"
          >
            <RefreshCw size={17} className={isFetching ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 px-4 py-3 text-sm text-slate-300">
        Dépôt actif : <strong className="text-white">{depotActif?.nom || depotId}</strong>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-4"><p className="text-xs text-slate-500 uppercase tracking-wider">Total</p><p className="mt-1 text-2xl font-black text-white">{stats.total}</p></div>
        <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-4"><p className="text-xs text-slate-500 uppercase tracking-wider">En cours</p><p className="mt-1 text-2xl font-black text-amber-300">{stats.enCours}</p></div>
        <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-4"><p className="text-xs text-slate-500 uppercase tracking-wider">Validées</p><p className="mt-1 text-2xl font-black text-emerald-300">{stats.validees}</p></div>
        <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-4"><p className="text-xs text-slate-500 uppercase tracking-wider">Annulées</p><p className="mt-1 text-2xl font-black text-red-300">{stats.annulees}</p></div>
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor="livraison-status" className="text-sm text-slate-400">Statut</label>
        <select
          id="livraison-status"
          value={filtreStatut}
          onChange={(event) => { setFiltreStatut(event.target.value); setCurrentPage(1); }}
          className="px-4 py-2.5 bg-slate-800/70 border border-slate-700 rounded-xl text-white text-sm"
        >
          <option value="">Tous</option>
          <option value="EN_COURS">En cours</option>
          <option value="VALIDEE">Validées</option>
          <option value="ANNULEE">Annulées</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-700/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
              <th className="text-left p-4">Référence</th>
              <th className="text-left p-4">Date</th>
              <th className="text-left p-4">Fournisseur</th>
              <th className="text-left p-4">Bordereau</th>
              <th className="text-center p-4">Lignes</th>
              <th className="text-right p-4">Montant</th>
              <th className="text-center p-4">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {isLoading ? (
              [1, 2, 3].map((item) => <tr key={item}><td colSpan="7" className="p-5"><div className="h-5 rounded bg-slate-800 animate-pulse" /></td></tr>)
            ) : totalItems === 0 ? (
              <tr><td colSpan="7" className="p-12 text-center text-slate-500"><ClipboardCheck className="mx-auto mb-3" size={28} /><p>Aucune réception pour ce dépôt.</p></td></tr>
            ) : (
              paginated.map((row) => {
                const lines = Array.isArray(row.lignes) ? row.lignes : [];
                const montant = lines.reduce((sum, line) => sum + ((Number(line.prixAchatUnitaire) || 0) * (Number(line.quantiteLivree) || 0)), 0);
                return (
                  <tr key={row.id} className="hover:bg-slate-800/40">
                    <td className="p-4 font-semibold text-white">{row.reference || row.id}</td>
                    <td className="p-4 text-slate-300">{formatDate(row.createdAt)}</td>
                    <td className="p-4 text-slate-300">{row.fournisseur?.nom || '-'}</td>
                    <td className="p-4 text-slate-400">{row.numBordereau || '-'}</td>
                    <td className="p-4 text-center text-slate-300">{lines.length}</td>
                    <td className="p-4 text-right text-slate-200">{montant.toLocaleString('fr-FR')} FCFA</td>
                    <td className="p-4 text-center"><span className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-bold ${statusClass(row.statut)}`}>{statusLabel(row.statut)}</span></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button type="button" disabled={currentPage <= 1} onClick={prevPage} className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40">Précédent</button>
          <span className="text-slate-400 text-sm">Page {currentPage} / {totalPages}</span>
          <button type="button" disabled={currentPage >= totalPages} onClick={nextPage} className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40">Suivant</button>
        </div>
      )}
    </div>
  );
}
