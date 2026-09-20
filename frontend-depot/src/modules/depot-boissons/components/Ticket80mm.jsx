import { useState } from 'react';
import { useNotif } from '../../../context/NotifContext';
import { useAuth } from '../../../contexts/AuthContext';
import { depotApi } from '../services/depotApi';
import { FACTURE_DEFAULTS, readFactureConfigLocal, useFactureConfig } from './FacturePrint';

/**
 * Ticket de caisse 80mm du sous-module Ventes (Dépôt de boissons).
 *
 * Aligné sur le ticket du métier Boutique (modules/boutique/components/FacturePrint.jsx) :
 * en-tête entreprise + logo, informations de vente (n°, date, caissier, client),
 * lignes détaillées, totaux, mode de paiement, montant reçu / monnaie restituée,
 * messages Paramètres (accueil / fin) et impression thermique 80mm.
 *
 * Particularité dépôt-boissons : la remise d'une ligne est un MONTANT
 * (total ligne = prix * quantité - remise), et la vente porte montantRecu / monnaie.
 */
export default function Ticket80mm({ vente, config }) {
  if (!vente) return null;

  const lignes = Array.isArray(vente.lignes) ? vente.lignes : [];
  const statutAnnulee = vente.statut === 'ANNULEE' || vente.statut === 'ANNULE';
  const clientNom = vente.client?.nom || 'PASSANT';
  const caissier = config?.nomCaissiere || vente.caissier || vente.createur?.nom || vente.createur?.email || 'Caissier';
  const dateVente = new Date(vente.date || vente.createdAt || new Date());
  const logoSrc = config?.afficherLogo === false ? null : (config?.logo || null);
  const money = (v) => `${Number(v || 0).toLocaleString('fr-FR')} FCFA`;
  const endMessage = config?.messageFin || config?.piedDePage || FACTURE_DEFAULTS.piedDePage;
  const messageAccueil = config?.messageAccueil || '';
  const totalRemise = lignes.reduce((acc, l) => acc + Number(l.remise || 0), 0);

  return (
    <div id="ticket-80mm" className="hidden print:block bg-white text-black font-mono text-[11px] leading-tight">
      <div className="px-4 py-3 flex flex-col items-center text-center">
        {logoSrc && <img src={logoSrc} alt="Logo" className="w-24 h-auto object-contain grayscale mb-1" />}
        <h1 className="text-[16px] font-black uppercase tracking-tight">{config?.nomEntreprise || 'MON DÉPÔT'}</h1>
        {config?.telephone && <p className="text-[10px] font-semibold">TÉL: {config.telephone}</p>}
        {config?.adresse && <p className="text-[10px] font-semibold">{config.adresse}</p>}
        {messageAccueil && <p className="text-[10px] italic font-bold mt-1">{messageAccueil}</p>}
        {statutAnnulee && <p className="text-[12px] font-black mt-1">*** TICKET ANNULÉ ***</p>}
        <div className="w-full my-2">--------------------------------</div>

        <div className="w-full space-y-0.5 text-left">
          <div className="flex justify-between"><span className="font-black">TICKET N°:</span><span className="font-black">{vente.reference}</span></div>
          <div className="flex justify-between"><span>DATE:</span><span>{dateVente.toLocaleDateString('fr-FR')} à {dateVente.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span></div>
          <div className="flex justify-between"><span>CAISSIER:</span><span>{caissier}</span></div>
          <div className="flex justify-between border-t border-dotted border-black pt-0.5 mt-0.5"><span>CLIENT:</span><span className="font-bold">{clientNom}</span></div>
        </div>
        <div className="w-full my-2">--------------------------------</div>

        <div className="w-full text-left space-y-1 mb-2">
          {lignes.length === 0 ? (
            <p className="text-center text-[10px] italic py-2">Aucune ligne détaillée pour cette vente.</p>
          ) : lignes.map((l, idx) => {
              const quantite = Number(l.quantite ?? 0);
              const prixUnitaire = Number(l.prixUnitaire ?? l.prix ?? 0);
              // Dépôt boissons : remise en montant (total = prix * qté - remise).
              const montant = Number(l.total ?? (quantite * prixUnitaire - Number(l.remise || 0)));
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
          {Number(vente.montantRecu || 0) > 0 && (
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

/**
 * Impression automatique du ticket 80mm.
 * `printTicket(vente)` accepte directement la vente renvoyée par ENCAISSER
 * (impression instantanée, sans aller-retour réseau), ou un id de vente
 * (impression manuelle depuis la liste : la vente est alors rechargée).
 */
export function usePrintTicket() {
  const notif = useNotif();
  const { tenantId } = useAuth();
  const { data: cachedConfig } = useFactureConfig();
  const [printData, setPrintData] = useState(null);
  const [printing, setPrinting] = useState(false);

  const printTicket = async (venteOrId) => {
    if (!venteOrId || printing) return;
    setPrinting(true);
    try {
      let vente = venteOrId;
      if (typeof venteOrId === 'string') {
        const res = await depotApi.getVente(venteOrId);
        vente = res.data?.data || res.data;
      }
      if (!vente || !vente.reference) throw new Error('Vente introuvable.');
      // Le localStorage reste la source fraîche (écrit par ParametresPage).
      const config = { ...(cachedConfig || FACTURE_DEFAULTS), ...readFactureConfigLocal(tenantId) };
      setPrintData({ vente, config });
      setTimeout(() => {
        window.print();
        setTimeout(() => setPrintData(null), 1000);
      }, 400);
    } catch (err) {
      notif.error(err?.response?.data?.message || err?.message || 'Erreur lors de la préparation du ticket.');
    } finally {
      setPrinting(false);
    }
  };

  const ticketNode = <Ticket80mm vente={printData?.vente} config={printData?.config} />;
  return { printTicket, printing, ticketNode };
}