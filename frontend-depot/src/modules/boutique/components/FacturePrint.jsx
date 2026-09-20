import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api/axios';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotif } from '../../../context/NotifContext';
import { boutiqueApi } from '../services/boutiqueApi';

/**
 * Sous-module FACTURE (Boutique) — miroir du module Dépôt de boissons.
 * Une facture = une vente (source de vérité : GET /boutique/ventes/:id).
 * La configuration d'impression provient de la page Paramètres :
 *   1. valeur fraîche en localStorage (écrite par ParametresPage) — prioritaire,
 *   2. cache react-query (GET /boutique/parametres + /tenants/:id),
 *   3. valeurs par défaut.
 * Particularité boutique : la remise des lignes est un POURCENTAGE.
 */

export const factureConfigKey = (tenantId) => `boutique_facture_config${tenantId ? `_${tenantId}` : ''}`;

export const FACTURE_DEFAULTS = {
  piedDePage: 'Merci de votre visite !',
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
    queryKey: ['boutique-facture-config', tenantId],
    queryFn: async () => {
      let params = {};
      let tenant = {};
      try { params = (await boutiqueApi.getParametres()).data || {}; } catch { /* fallback local */ }
      try { tenant = (await api.get(`/tenant/${tenantId}`)).data || {}; } catch { /* fallback local */ }
      // Valeurs fraîches écrites par ParametresPage (les plus récentes gagnent).
      const local = readFactureConfigLocal(tenantId);
      const caisse = (params.caisse && typeof params.caisse === 'object') ? params.caisse : {};
      const ticket = (params.ticket && typeof params.ticket === 'object') ? params.ticket : {};
      const facture = (params.facture && typeof params.facture === 'object') ? params.facture : {};
      return {
        ...FACTURE_DEFAULTS,
        nomEntreprise: local.nomEntreprise || tenant.nomEntreprise || tenant.name || params?.nom || localStorage.getItem('boutique_nom') || 'MA BOUTIQUE',
        adresse: local.adresse || tenant.adresse || params?.adresse || '',
        telephone: local.telephone || tenant.telephone || params?.telephone || '',
        logo: tenant.logo || local.logo || null,
        devise: local.devise || params?.devise || 'FCFA',
        // Sections Paramètres → Ticket / Caisse / Facture (ticket 80mm).
        nomCaissiere: local.nomCaissiere || params?.nomCaissiere || caisse.nomCaissiere || '',
        messageAccueil: local.messageAccueil || ticket.messageAccueil || '',
        messageFin: local.messageFin || ticket.messageFin || facture.piedDePage || FACTURE_DEFAULTS.piedDePage,
        piedDePage: local.piedDePage || facture.piedDePage || FACTURE_DEFAULTS.piedDePage,
        afficherLogo: local.afficherLogo ?? facture.afficherLogo ?? FACTURE_DEFAULTS.afficherLogo,
        afficherModePaiement: local.afficherModePaiement ?? facture.afficherModePaiement ?? FACTURE_DEFAULTS.afficherModePaiement,
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
      const res = await boutiqueApi.getVente(venteId);
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
  const clientNom = vente.client?.nom || vente.client || 'PASSANT';
  const caissier = config?.nomCaissiere || vente.caissier || vente.createur?.nom || vente.createur?.email || 'Caissier';
  const dateVente = new Date(vente.date || vente.createdAt || new Date());
  const logoSrc = config?.afficherLogo === false ? null : (config?.logo || null);
  const money = (v) => `${Number(v || 0).toLocaleString('fr-FR')} FCFA`;
  const endMessage = config?.messageFin || config?.piedDePage || FACTURE_DEFAULTS.piedDePage;
  const messageAccueil = config?.messageAccueil || '';
  // Remise boutique = POURCENTAGE par ligne (prix * qté * (1 - remise/100)).
  const totalRemise = lignes.reduce((acc, l) => acc + Number(l.remise || 0), 0);

  return (
    <div id="ticket-80mm" className={statutAnnulee ? 'hidden' : 'hidden print:block bg-white text-black font-mono text-[11px] leading-tight'}>
      <div className="px-4 py-3 flex flex-col items-center text-center">
        {/* En-tête entreprise (80mm thermique) */}
        {logoSrc && <img src={logoSrc} alt="Logo" className="w-24 h-auto object-contain grayscale mb-1" />}
        <h1 className="text-[16px] font-black uppercase tracking-tight">{config?.nomEntreprise || 'MA BOUTIQUE'}</h1>
        {config?.telephone && <p className="text-[10px] font-semibold">TÉL: {config.telephone}</p>}
        {config?.adresse && <p className="text-[10px] font-semibold">{config.adresse}</p>}
        {messageAccueil && <p className="text-[10px] italic font-bold mt-1">{messageAccueil}</p>}
        {statutAnnulee && <p className="text-[12px] font-black mt-1">*** TICKET ANNULÉ ***</p>}
        <div className="w-full my-2">--------------------------------</div>

        {/* Infos ticket + client + caissier */}
        <div className="w-full space-y-0.5 text-left">
          <div className="flex justify-between"><span className="font-black">TICKET N°:</span><span className="font-black">{vente.reference}</span></div>
          <div className="flex justify-between"><span>DATE:</span><span>{dateVente.toLocaleDateString('fr-FR')} à {dateVente.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span></div>
          <div className="flex justify-between"><span>CAISSIER:</span><span>{caissier}</span></div>
          <div className="flex justify-between border-t border-dotted border-black pt-0.5 mt-0.5"><span>CLIENT:</span><span className="font-bold">{clientNom}</span></div>
        </div>
        <div className="w-full my-2">--------------------------------</div>

        {/* Lignes de vente */}
        <div className="w-full text-left space-y-1 mb-2">
          {lignes.length === 0 ? (
            <p className="text-center text-[10px] italic py-2">Aucune ligne détaillée pour cette vente.</p>
          ) : lignes.map((l, idx) => {
              const quantite = Number(l.quantite ?? 0);
              const prixUnitaire = Number(l.prixUnitaire ?? l.prix ?? 0);
              const montant = Number(l.total ?? (quantite * prixUnitaire * (1 - Number(l.remise || 0) / 100)));
              return (
                <div key={l.id || idx}>
                  <p className="font-bold uppercase truncate">{l.designation || l.article?.designation || 'Article'}</p>
                  <div className="flex justify-between">
                    <span>{quantite} x {prixUnitaire.toLocaleString('fr-FR')}</span>
                    <span className="font-bold">{montant.toLocaleString('fr-FR')}</span>
                  </div>
                </div>
              );
            })}
        </div>
        <div className="w-full my-2">--------------------------------</div>

        {/* Totaux + paiement (ticket 80mm) */}
        <div className="w-full flex flex-col items-end gap-0.5">
          {totalRemise > 0 && (
            <div className="flex justify-between w-full items-baseline border-b border-dotted border-black pb-0.5 mb-0.5">
              <span className="text-[11px] font-bold">REMISE:</span>
              <span className="text-[11px] font-bold">-{money(totalRemise)}</span>
            </div>
          )}
          <div className="flex justify-between w-full items-baseline">
            <span className="text-[11px] font-black">TOTAL NET:</span>
            <span className="text-[17px] font-black">{money(vente.total ?? vente.montant)}</span>
          </div>
          {config?.afficherModePaiement !== false && (
            <div className="flex justify-between w-full text-[10px] mt-0.5">
              <span className="opacity-70 italic">MODE DE PAIEMENT:</span>
              <span className="font-black">{vente.modePaiement || 'CASH'}</span>
            </div>
          )}
          {String(vente.modePaiement || '').toUpperCase() === 'CASH' && Number(vente.montantRecu || 0) > 0 && (
            <div className="flex justify-between w-full text-[10px] mt-0.5">
              <span className="opacity-70 italic">MONTANT REÇU:</span>
              <span className="font-black">{money(vente.montantRecu)}</span>
            </div>
          )}
          {Number(vente.monnaie || 0) > 0 && (
            <div className="flex justify-between w-full text-[10px] mt-0.5">
              <span className="opacity-70 italic">MONNAIE RENDUE:</span>
              <span className="font-black">{money(vente.monnaie)}</span>
            </div>
          )}
        </div>

        {/* Pied de page paramétrable (Paramètres → Ticket / Factures) */}
        <div className="w-full mt-4 border-t border-dotted border-black pt-2 flex flex-col items-center">
          <p className="font-black text-center text-[10px] uppercase">{endMessage}</p>
          <p className="text-[8px] uppercase tracking-widest opacity-50 font-bold mt-1">Généré par Gestock SaaS</p>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 0mm; }
          html, body {
            height: auto; width: 100%;
            margin: 0 !important; padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * { visibility: hidden; }
          #ticket-80mm, #ticket-80mm * { visibility: visible !important; }
          #ticket-80mm {
            display: block !important;
            position: relative !important;
            width: 80mm !important;
            max-width: 80mm !important;
            padding: 3mm !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border: none !important;
            font-size: 11px !important;
          }
        }
      `}</style>
    </div>
  );
}