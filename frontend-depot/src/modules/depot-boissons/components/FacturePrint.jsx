import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotif } from '../../../context/NotifContext';
import { depotApi } from '../services/depotApi';

/**
 * Sous-module FACTURE (Dépôt de boissons).
 * Une facture = une vente (source de vérité unique : GET /depot-boissons/ventes/:id).
 * La configuration d'impression provient de la page Paramètres :
 *   1. valeur fraîche en localStorage (écrite par ParametresPage) — toujours prioritaire,
 *   2. cache react-query (GET /depot/parametres + /tenant/info),
 *   3. valeurs par défaut.
 */

export const factureConfigKey = (tenantId) => `depot_facture_config${tenantId ? `_${tenantId}` : ''}`;

export const FACTURE_DEFAULTS = {
  piedDePage: 'Merci de votre fidélité !',
  afficherLogo: true,
  afficherModePaiement: true,
};

export function readFactureConfigLocal(tenantId) {
  try {
    const raw = localStorage.getItem(factureConfigKey(tenantId));
    const parsed = raw ? JSON.parse(raw) : {};
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function useFactureConfig() {
  const { tenantId } = useAuth();
  return useQuery({
    queryKey: ['depot-facture-config', tenantId],
    queryFn: async () => {
      let params = {};
      let tenant = {};
      try { params = (await api.get('/depot-boissons/parametres')).data || {}; } catch { /* fallback local */ }
      try { tenant = (await api.get('/tenant/info')).data?.tenant || {}; } catch { /* fallback local */ }
      return {
        ...FACTURE_DEFAULTS,
        nomEntreprise: tenant.nomEntreprise || params?.infos?.nomEntreprise || localStorage.getItem('depot_nom') || 'MON DÉPÔT',
        adresse: tenant.adresse || params?.infos?.adresse || localStorage.getItem('depot_adresse') || '',
        telephone: tenant.telephone || params?.infos?.telephone || localStorage.getItem('depot_telephone') || '',
        slogan: tenant.slogan || params?.infos?.slogan || '',
        devise: params?.infos?.devise || 'FCFA',
        nomCaissiere: params?.caisse?.nomCaissiere || localStorage.getItem('depot_caissiere') || '',
        messageAccueil: params?.ticket?.messageAccueil || '',
        messageFin: params?.ticket?.messageFin || tenant.messageFin || params?.facture?.piedDePage || FACTURE_DEFAULTS.piedDePage,
        piedDePage: params?.facture?.piedDePage || FACTURE_DEFAULTS.piedDePage,
        afficherLogo: params?.facture?.afficherLogo ?? FACTURE_DEFAULTS.afficherLogo,
        afficherModePaiement: params?.facture?.afficherModePaiement ?? FACTURE_DEFAULTS.afficherModePaiement,
        logo: tenant.logo || null,
      };
    },
    staleTime: 60_000,
    retry: 1,
  });
}

/** Impression A4 d'une facture de vente. Retourne `print(venteId)` + le nœud à monter. */
export function usePrintFacture() {
  const notif = useNotif();
  const { tenantId } = useAuth();
  const { data: cachedConfig } = useFactureConfig();
  const [printData, setPrintData] = useState(null);
  const [printingId, setPrintingId] = useState(null);

  const print = async (venteId) => {
    if (!venteId || printingId) return;
    setPrintingId(venteId);
    try {
      const res = await depotApi.getVente(venteId);
      const vente = res.data?.data || res.data;
      if (!vente || !vente.reference) throw new Error('Vente introuvable.');
      if (vente.statut === 'ANNULEE' || vente.statut === 'ANNULE') {
        notif.error('Impossible d’imprimer la facture d’une vente annulée.');
        return;
      }
      // Le localStorage reste la source fraîche (ParametresPage écrit dedans).
      const config = { ...(cachedConfig || FACTURE_DEFAULTS), ...readFactureConfigLocal(tenantId) };
      setPrintData({ vente, config });
      setTimeout(() => {
        window.print();
        setTimeout(() => setPrintData(null), 1000);
      }, 400);
    } catch (err) {
      notif.error(err?.response?.data?.message || err?.message || 'Erreur lors de la préparation de la facture.');
    } finally {
      setPrintingId(null);
    }
  };

  const factureNode = <FacturePrint vente={printData?.vente} config={printData?.config} />;
  return { print, printingId, factureNode };
}

export default function FacturePrint({ vente, config }) {
  if (!vente) return null;

  const lignes = Array.isArray(vente.lignes) ? vente.lignes : [];
  const statutAnnulee = vente.statut === 'ANNULEE' || vente.statut === 'ANNULE';
  const statutLabel = statutAnnulee ? 'ANNULÉE' : vente.statut === 'ATTENTE' ? 'EN ATTENTE' : 'PAYÉE';
  const clientNom = vente.client?.nom || 'PASSANT';
  const dateVente = new Date(vente.date || vente.createdAt || new Date());
  const logoSrc = config?.afficherLogo === false ? null : (config?.logo || null);
  const totalRemise = lignes.reduce((acc, l) => acc + (Number(l.remise) || 0), 0);
  const money = (v) => `${Number(v || 0).toLocaleString('fr-FR')} FCFA`;

  return (
    <div id="facture-a4" className="hidden print:block bg-white text-black">
      <div className="p-8 max-w-[210mm] mx-auto">
        {/* En-tête entreprise */}
        <div className="flex items-start justify-between border-b-2 border-black pb-4">
          <div className="flex items-center gap-4">
            {logoSrc && <img src={logoSrc} alt="Logo" className="w-20 h-20 object-contain grayscale" />}
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight">{config?.nomEntreprise || 'GESTOCK'}</h1>
              {config?.adresse && <p className="text-xs mt-0.5">{config.adresse}</p>}
              {config?.telephone && <p className="text-xs">Tél : {config.telephone}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black tracking-tight">FACTURE</p>
            <p className="text-sm font-bold font-mono">N° {vente.reference}</p>
            <p className={`text-[10px] font-black uppercase mt-1 px-2 py-0.5 border ${statutAnnulee ? 'border-red-600 text-red-600' : vente.statut === 'ATTENTE' ? 'border-amber-600 text-amber-700' : 'border-emerald-700 text-emerald-700'}`}>{statutLabel}</p>
          </div>
        </div>

        {/* Infos client + date */}
        <div className="grid grid-cols-2 gap-4 py-4 text-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Facturé à</p>
            <p className="font-black text-base mt-1">{clientNom}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Date</p>
            <p className="font-bold mt-1">{dateVente.toLocaleDateString('fr-FR')} à {dateVente.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-3">Caissier</p>
            <p className="font-bold mt-1">{vente.caissier || config?.nomCaissiere || 'Caissier'}</p>
          </div>
        </div>

        {/* Lignes */}
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-widest">
              <th className="text-left px-3 py-2">Désignation</th>
              <th className="text-center px-3 py-2">Qté</th>
              <th className="text-right px-3 py-2">Prix unitaire</th>
              <th className="text-right px-3 py-2">Montant</th>
            </tr>
          </thead>
          <tbody>
            {lignes.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-6 text-slate-400 text-xs">Aucune ligne détaillée pour cette vente.</td></tr>
            ) : lignes.map((l, idx) => {
                const quantite = Number(l.quantite ?? 0);
                const prixUnitaire = Number(l.prixUnitaire ?? l.prix ?? 0);
                const montant = Number(l.total ?? (quantite * prixUnitaire));
                return (
                  <tr key={l.id || idx} className="border-b border-slate-200">
                    <td className="px-3 py-2 font-medium">{l.designation || l.article?.designation || 'Article'}</td>
                    <td className="px-3 py-2 text-center">{quantite}</td>
                    <td className="px-3 py-2 text-right">{money(prixUnitaire)}</td>
                    <td className="px-3 py-2 text-right font-bold">{money(montant)}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        {/* Totaux */}
        <div className="flex justify-end mt-4">
          <div className="w-64 space-y-1 text-sm">
            {totalRemise > 0 && (
              <div className="flex justify-between">
                <span className="font-bold uppercase text-[10px] tracking-widest text-slate-500">Remise</span>
                <span className="font-bold">-{money(totalRemise)}</span>
              </div>
            )}
            <div className="flex justify-between border-t-2 border-black pt-2 items-baseline">
              <span className="font-black uppercase text-[11px] tracking-widest">Total</span>
              <span className="text-xl font-black">{money(vente.total)}</span>
            </div>
            {config?.afficherModePaiement !== false && (
              <div className="flex justify-between text-xs">
                <span className="uppercase tracking-widest text-slate-500 font-bold">Mode de paiement</span>
                <span className="font-bold">{vente.modePaiement || 'CASH'}</span>
              </div>
            )}
            {Number(vente.montantRecu || 0) > 0 && (
              <div className="flex justify-between text-xs">
                <span className="uppercase tracking-widest text-slate-500 font-bold">Montant reçu</span>
                <span className="font-bold">{money(vente.montantRecu)}</span>
              </div>
            )}
            {Number(vente.monnaie || 0) > 0 && (
              <div className="flex justify-between text-xs">
                <span className="uppercase tracking-widest text-slate-500 font-bold">Monnaie rendue</span>
                <span className="font-bold">{money(vente.monnaie)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Pied de page paramétrable (Paramètres → Factures) */}
        <div className="border-t border-slate-300 mt-8 pt-4 text-center">
          {(config?.piedDePage || FACTURE_DEFAULTS.piedDePage) && (
            <p className="text-xs font-bold uppercase tracking-wide">{config?.piedDePage || FACTURE_DEFAULTS.piedDePage}</p>
          )}
          <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-2">Généré par Gestock SaaS</p>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
          body * { visibility: hidden; }
          #facture-a4, #facture-a4 * { visibility: visible !important; }
          #facture-a4 {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
}