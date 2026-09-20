/* eslint-disable react-refresh/only-export-components -- BadgeCanal et canauxClient sont des helpers partagés (précédent du dépôt : AuthContext.jsx). */
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, ChevronDown, Pencil, MessageCircle, AtSign, MessageSquare } from 'lucide-react';
import api from '../api/axios';

/**
 * Fiche client du back-office (Cas A — extension du module Clients existant).
 *
 * Sécurité XSS : tout contenu issu du client final ou de l'agent IA (nom,
 * metaData, référence) est rendu en NŒUDS TEXTE React — jamais via
 * dangerouslySetInnerHTML. React échappe par défaut : aucune donnée non
 * fiable ne peut être interprétée comme HTML/JS.
 */
function flattenMeta(value, prefix = '', out = {}, depth = 0) {
  if (value === null || value === undefined || depth > 4) return out;
  if (Array.isArray(value)) {
    if (prefix) out[prefix] = value.map((item) => String(item)).join(', ');
    return out;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (!entries.length && prefix) out[prefix] = '—';
    for (const [key, val] of entries) {
      flattenMeta(val, prefix ? `${prefix}.${key}` : key, out, depth + 1);
    }
    return out;
  }
  if (prefix) out[prefix] = String(value);
  return out;
}

export function BadgeCanal({ canal }) {
  const styles = {
    WHATSAPP: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    INSTAGRAM: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    MESSENGER: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
  const icons = { WHATSAPP: MessageCircle, INSTAGRAM: AtSign, MESSENGER: MessageSquare };
  if (!canal || !styles[canal]) return null;
  const Icon = icons[canal];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold border px-2 py-0.5 rounded-lg ${styles[canal]}`}>
      <Icon className="w-3 h-3" /> {canal}
    </span>
  );
}

/** Canaux rattachés d'un client (WhatsApp = le téléphone, dans les 3 métiers cibles). */
export function canauxClient(client) {
  return [
    client.telephone ? 'WHATSAPP' : null,
    client.instagramId ? 'INSTAGRAM' : null,
    client.messengerId ? 'MESSENGER' : null,
  ].filter(Boolean);
}

/**
 * Normalise une réponse d'historique « liste simple » (API métier) vers la
 * forme attendue par la fiche : { items, hasMore, nextCursor }.
 */
function normalizeListHistory(payload) {
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return {
    items: rows.map((row) => ({
      id: row.id,
      reference: row.reference || row.id,
      date: row.date,
      statut: row.statut || row.type || 'Vente',
      modePaiement: row.modePaiement || '',
      // Montant affiché : toujours sérialisé en chaîne à 2 décimales.
      total: Number(row.montant ?? row.total ?? 0).toFixed(2),
    })),
    hasMore: false,
    nextCursor: null,
  };
}

export default function ClientFicheModal({
  client,
  onClose,
  onEdit,
  /**
   * Source de l'historique. Par défaut l'API Clients générique
   * (`/clients/:id/historique`, curseur keyset). Les pages métier passent leur
   * propre endpoint — chaîne, ou fonction `(client) => url`.
   */
  historyEndpoint,
  /** 'cursor' (pas de limite serveur) ou 'list' (tableau simple). */
  historyMode = 'cursor',
}) {
  const queryClient = useQueryClient();
  const [pages, setPages] = useState([]);
  const [metaOuvert, setMetaOuvert] = useState(true);
  const meta = flattenMeta(client.metaData || {});
  const metaEntries = Object.entries(meta);

  const resolveEndpoint = () =>
    typeof historyEndpoint === 'function'
      ? historyEndpoint(client)
      : historyEndpoint || `/clients/${client.id}/historique`;

  const fetchHistory = async (cursor) => {
    const endpoint = resolveEndpoint();
    if (historyMode === 'list') {
      const res = await api.get(endpoint, { params: { limit: 20 } });
      return normalizeListHistory(res.data);
    }
    const res = await api.get(endpoint, {
      params: { limit: 10, ...(cursor ? { cursor } : {}) },
    });
    return res.data;
  };

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['client-historique', client.id, historyMode],
    queryFn: () => fetchHistory(null),
    enabled: !!client.id,
  });

  // Concaténation des pages : le curseur keyset garantit l'absence de doublon
  // même si une vente est enregistrée pendant la navigation.
  const historique = pages.length ? pages : data?.items || [];
  const hasMore = data?.hasMore || false;
  const nextCursor = data?.nextCursor || null;

  const chargerPlus = async () => {
    if (!nextCursor || isFetching) return;
    const page = await fetchHistory(nextCursor);
    setPages((current) => [
      ...(current.length ? current : data?.items || []),
      ...page.items,
    ]);
    queryClient.setQueryData(['client-historique', client.id, historyMode], page);
  };

  const canaux = canauxClient(client);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-slate-700 p-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-white font-black text-xl truncate">{client.nom}</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {canaux.map((canal) => <BadgeCanal key={canal} canal={canal} />)}
              {!canaux.length && <span className="text-[10px] font-bold text-slate-500 border border-slate-700 px-2 py-0.5 rounded-lg">AUCUN CANAL</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onEdit && (
              <button onClick={() => onEdit(client)} className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-indigo-400 hover:text-white p-2 rounded-xl transition-all" aria-label="Modifier">
                <Pencil className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-400 hover:text-white p-2 rounded-xl transition-all" aria-label="Fermer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              ['Téléphone', client.telephone || '—'],
              ['Adresse', client.adresse || '—'],
              ['Plafond crédit', `${Number(client.plafondCredit || 0).toLocaleString('fr-FR')} FCFA`],
              ['Ardoise', `${Number(client.soldeCredit || 0).toLocaleString('fr-FR')} FCFA`],
            ].map(([label, valeur]) => (
              <div key={label} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{label}</p>
                <p className="text-white text-sm font-bold break-words">{valeur}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest px-4 py-3 border-b border-slate-700">Historique d'achats</p>
            {isLoading ? (
              <div className="p-6 text-center text-slate-500 text-sm animate-pulse">Chargement...</div>
            ) : isError ? (
              <div className="p-6 text-center text-red-400 text-sm">
                Erreur de chargement.{' '}
                <button onClick={() => refetch()} className="underline font-bold">Réessayer</button>
              </div>
            ) : historique.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">Aucun achat enregistré.</div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {historique.map((vente) => (
                  <div key={vente.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-700/20">
                    <div className="min-w-0">
                      <p className="text-white text-sm font-bold truncate">{vente.reference}</p>
                      <p className="text-slate-500 text-xs">
                        {[
                          new Date(vente.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
                          vente.modePaiement,
                          vente.statut,
                        ].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <p className="text-white text-sm font-black shrink-0">{Number(vente.total).toLocaleString('fr-FR')} FCFA</p>
                  </div>
                ))}
              </div>
            )}
            {hasMore && (
              <button onClick={chargerPlus} disabled={isFetching || !nextCursor}
                className="w-full py-3 text-indigo-400 hover:text-indigo-300 text-xs font-bold uppercase tracking-widest border-t border-slate-700 flex items-center justify-center gap-1 disabled:opacity-40">
                <ChevronDown className="w-4 h-4" /> {isFetching ? 'Chargement...' : "Charger plus d'achats"}
              </button>
            )}
          </div>

          {metaEntries.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
              <button onClick={() => setMetaOuvert((o) => !o)} type="button"
                className="w-full flex items-center justify-between px-4 py-3 text-slate-400 text-xs font-bold uppercase tracking-widest hover:bg-slate-700/30">
                Données CRM (agent IA)
                <ChevronDown className={`w-4 h-4 transition-transform ${metaOuvert ? 'rotate-180' : ''}`} />
              </button>
              {metaOuvert && (
                <div className="divide-y divide-slate-700/50">
                  {metaEntries.map(([chemin, valeur]) => (
                    <div key={chemin} className="px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-slate-500 text-xs font-bold">{chemin}</span>
                      <span className="text-white text-xs break-all">{valeur || '—'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



