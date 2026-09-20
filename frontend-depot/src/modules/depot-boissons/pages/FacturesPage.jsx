import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Printer, RefreshCw, Search } from 'lucide-react';
import { useDepot } from '../../../contexts/DepotContext';
import { usePermission } from '../../../shared/hooks/usePermission';
import { depotApi } from '../services/depotApi';
import { usePrintFacture } from '../components/FacturePrint';

/**
 * Sous-module FACTURE (Dépôt de boissons) — inspiré du sous-module facture Boutique.
 * Chaque facture correspond à une vente du dépôt actif :
 *   N° Facture = vente.reference · Client · Date · Montant · Statut · Action IMPRIMER (A4).
 * La page est gated par la permission `ventes` (cohérent avec le backend, qui
 * exige `ventes:read` sur les endpoints de vente/impression).
 */

const LIMIT = 200;
const ANNULEE = ['ANNULEE', 'ANNULE'];
const isAnnulee = (statut) => ANNULEE.includes(statut);

const STATUS_META = {
  PAYE: ['Payée', 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'],
  ATTENTE: ['En attente', 'bg-amber-500/15 text-amber-300 border-amber-500/30'],
  ANNULEE: ['Annulée', 'bg-red-500/15 text-red-300 border-red-500/30'],
  ANNULE: ['Annulée', 'bg-red-500/15 text-red-300 border-red-500/30'],
};
const statusMeta = (statut) => STATUS_META[statut] || ['Payée', 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'];
const money = (v) => `${Number(v || 0).toLocaleString('fr-FR')} FCFA`;

export default function FacturesPage() {
  const depot = useDepot();
  const depotId = depot?.depotId ?? depot?.depotActif?.id ?? null;
  const { canRead } = usePermission('ventes');
  const { print, printingId, factureNode } = usePrintFacture();
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('TOUS');

  // Connexion au module Ventes : chaque vente du dépôt actif = une facture.
  const q = useQuery({
    queryKey: ['depot-factures', 'ventes', depotId],
    queryFn: async () => {
      const res = await depotApi.getVentes({ page: 1, limit: LIMIT });
      const rows = res.data?.data ?? res.data ?? [];
      return Array.isArray(rows) ? rows : [];
    },
    enabled: Boolean(depotId) && canRead !== false,
  });

  const ventes = Array.isArray(q.data) ? q.data : [];

  const filtered = useMemo(() => ventes.filter((v) => {
    const annulee = isAnnulee(v.statut);
    const statutOk = statutFilter === 'TOUS'
      || (statutFilter === 'ANNULEE' ? annulee : (!annulee && v.statut === statutFilter));
    if (!statutOk) return false;
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return [v.reference, v.client?.nom, v.modePaiement].filter(Boolean).some((x) => String(x).toLowerCase().includes(needle));
  }), [ventes, search, statutFilter]);

  const totals = useMemo(() => {
    const valides = ventes.filter((v) => !isAnnulee(v.statut));
    return {
      count: ventes.length,
      total: valides.reduce((acc, v) => acc + Number(v.total || 0), 0),
      payees: valides.filter((v) => v.statut !== 'ATTENTE').length,
      attente: valides.filter((v) => v.statut === 'ATTENTE').length,
    };
  }, [ventes]);

  if (!depotId) return <div className="p-8 text-center text-amber-300">Sélectionnez un dépôt actif pour consulter les factures.</div>;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {factureNode}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Factures</h1>
          <p className="text-slate-400 text-sm mt-1">{totals.count} facture{totals.count !== 1 ? 's' : ''} — générées depuis vos ventes</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total facturé</p>
            <p className="font-black text-xl text-blue-400">{money(totals.total)}</p>
          </div>
          <button onClick={() => q.refetch()} disabled={q.isFetching}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all">
            <RefreshCw size={15} className={q.isFetching ? 'animate-spin' : ''} /> Actualiser
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800"><p className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">Total facturé</p><p className="text-white font-black text-xl mt-1">{money(totals.total)}</p></div>
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800"><p className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">Payées</p><p className="text-emerald-300 font-black text-xl mt-1">{totals.payees}</p></div>
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800"><p className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">En attente de paiement</p><p className="text-amber-300 font-black text-xl mt-1">{totals.attente}</p></div>
      </div>

      {/* Recherche + filtre statut */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex flex-1 items-center gap-3 p-3 bg-slate-900/70 border border-slate-800 rounded-2xl">
          <Search size={18} className="text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-white w-full text-sm"
            placeholder="Rechercher n° facture, client ou mode de paiement…" />
        </div>
        <select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)} aria-label="Filtrer par statut"
          className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white">
          <option value="TOUS">Tous les statuts</option>
          <option value="PAYE">Payées</option>
          <option value="ATTENTE">En attente</option>
          <option value="ANNULEE">Annulées</option>
        </select>
      </div>

      {q.isLoading ? (
        <div className="p-16 text-center"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : q.isError ? (
        <div className="p-8 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-200 text-sm">
          Impossible de charger les factures : {q.error?.response?.data?.message || q.error?.message || 'erreur inconnue.'}
          <button onClick={() => q.refetch()} className="underline font-bold ml-2">Réessayer</button>
        </div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/50">
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="text-left px-5 py-4">N° Facture</th>
                <th className="text-left px-5 py-4">Client</th>
                <th className="text-left px-5 py-4">Date</th>
                <th className="text-right px-5 py-4">Montant</th>
                <th className="text-center px-5 py-4">Statut</th>
                <th className="text-center px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-slate-500"><FileText className="w-10 h-10 mx-auto mb-3 text-slate-600" />Aucune facture{search || statutFilter !== 'TOUS' ? ' pour cette recherche' : ''} — les factures sont créées automatiquement à chaque vente.</td></tr>
              ) : filtered.map((v) => {
                const [label, cls] = statusMeta(v.statut);
                const annulee = isAnnulee(v.statut);
                return (
                  <tr key={v.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-5 py-4 text-white font-mono text-sm font-bold">{v.reference}</td>
                    <td className="px-5 py-4 text-slate-300">{v.client?.nom || 'Passant'}</td>
                    <td className="px-5 py-4 text-slate-300 text-sm">{v.date || v.createdAt ? new Date(v.date || v.createdAt).toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="px-5 py-4 text-right text-white font-mono font-bold">{money(v.total)}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full border ${cls}`}>{label}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {annulee ? (
                        <span className="text-[10px] uppercase tracking-widest text-slate-600 font-bold">Indisponible</span>
                      ) : (
                        <button onClick={() => print(v.id)} disabled={printingId === v.id}
                          title="Imprimer la facture A4"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600/20 text-blue-300 hover:bg-blue-600/40 hover:text-blue-200 disabled:opacity-50 transition-all">
                          <Printer size={13} /> {printingId === v.id ? 'Préparation…' : 'Imprimer'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}