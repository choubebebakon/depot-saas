import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotif } from '../../../context/NotifContext';
import { supermarcheApi } from '../services/supermarcheApi';

/**
 * Sous-module FACTURE (Supermarché).
 * Une facture = une vente (source de vérité unique : GET /supermarche/ventes/:id).
 * La configuration d'impression provient de la page Paramètres :
 *   1. valeur fraîche en localStorage (écrite par ParametresPage) — toujours prioritaire,
 *   2. cache react-query (GET /supermarche/parametres + /tenant/info),
 *   3. valeurs par défaut.
 */

export const factureConfigKey = (tenantId) => `supermarche_facture_config${tenantId ? `_${tenantId}` : ''}`;

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

export function writeFactureConfigLocal(tenantId, config) {
  try {
    localStorage.setItem(factureConfigKey(tenantId), JSON.stringify(config || {}));
  } catch { /* quota dépassé ou stockage indisponible — non bloquant */ }
}

export function useFactureConfig() {
  const { tenantId } = useAuth();
  return useQuery({
    queryKey: ['supermarche-facture-config', tenantId],
    queryFn: async () => {
      let params = {};
      let tenant = {};
      try { params = (await supermarcheApi.getParametres()).data || {}; } catch { try { params = (await api.get('/depot/parametres')).data || {}; } catch { /* fallback local */ } }
      try { tenant = (await api.get('/tenant/info')).data?.tenant || {}; } catch { /* fallback local */ }
      // Valeurs fraîches écrites par ParametresPage (les plus récentes gagnent).
      const local = readFactureConfigLocal(tenantId);
      const caisse = (params.caisse && typeof params.caisse === 'object') ? params.caisse : {};
      const ticket = (params.ticket && typeof params.ticket === 'object') ? params.ticket : {};
      const facture = (params.facture && typeof params.facture === 'object') ? params.facture : {};
      const infos = (params.infos && typeof params.infos === 'object') ? params.infos : {};
      return {
        ...FACTURE_DEFAULTS,
        nomEntreprise: local.nomEntreprise || tenant.nomEntreprise || infos.nomEntreprise || params?.infos?.nomEntreprise || localStorage.getItem('gestock_nomEntreprise') || 'MON SUPERMARCHÉ',
        adresse: local.adresse || tenant.adresse || infos.adresse || params?.infos?.adresse || '',
        telephone: local.telephone || tenant.telephone || infos.telephone || params?.infos?.telephone || '',
        logo: tenant.logo || local.logo || null,
        devise: local.devise || params?.infos?.devise || 'FCFA',
        // Sections Paramètres → Ticket / Caisse / Facture (ticket 80mm).
        messageAccueil: local.messageAccueil || ticket.messageAccueil || '',
        messageFin: local.messageFin || ticket.messageFin || facture.piedDePage || FACTURE_DEFAULTS.piedDePage,
        nomCaissiere: local.nomCaissiere || caisse.nomCaissiere || '',
        piedDePage: local.piedDePage || facture.piedDePage || FACTURE_DEFAULTS.piedDePage,
        afficherLogo: local.afficherLogo ?? facture.afficherLogo ?? params?.facture?.afficherLogo ?? FACTURE_DEFAULTS.afficherLogo,
        afficherModePaiement: local.afficherModePaiement ?? facture.afficherModePaiement ?? params?.facture?.afficherModePaiement ?? FACTURE_DEFAULTS.afficherModePaiement,
      };
    },
    staleTime: 60_000,
    retry: 1,
  });
}

/** Impression 80mm (thermique) d'une facture de vente. Retourne `print(venteId)` + le nœud à monter. */
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
      const res = await supermarcheApi.getVente(venteId);
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

/**
 * Facture / ticket 80mm — imprimante thermique (norme supermarché).
 * Respecte les réglages de la page Paramètres :
 *   - afficherLogo          → logo N&B en en-tête
 *   - afficherModePaiement  → ligne "MODE DE PAIEMENT"
 *   - piedDePage            → message de fin paramétrable
 * Format : monospace, 80mm de large, coupe automatique (@page size: 80mm auto).
 */
export default function FacturePrint({ vente, config }) {
  if (!vente) return null;

  const lignes = Array.isArray(vente.lignes) ? vente.lignes : [];
  const statutAnnulee = vente.statut === 'ANNULEE' || vente.statut === 'ANNULE';
  const clientNom = vente.client?.nom || 'PASSANT';
  const dateVente = new Date(vente.date || vente.createdAt || new Date());
  const dateAchat = dateVente.toLocaleDateString('fr-FR');
  const heureAchat = dateVente.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const caissier = config?.nomCaissiere || vente.caissier || vente.createur?.name || vente.createur?.nom || vente.createur?.email || 'Caissier';
  const totalRemise = lignes.reduce((acc, l) => acc + (Number(l.remise) || 0), 0);
  const devise = config?.devise || 'FCFA';
  const money = (v) => `${Number(v || 0).toLocaleString('fr-FR')} ${devise}`;
  const logoSrc = config?.afficherLogo === false ? null : (config?.logo || null);
  const endMessage = config?.messageFin || config?.piedDePage || FACTURE_DEFAULTS.piedDePage;
  const messageAccueil = config?.messageAccueil || '';
  const separator = '------------------------------------------';

  return (
    <div id="facture-80mm" className="hidden print:block bg-white text-black w-[80mm] mx-auto font-mono text-[11px] leading-tight">
      <div className="flex flex-col items-center px-3 py-4 bg-white">
        {/* LOGO (Paramètres → Logo) */}
        {logoSrc && (
          <div className="bg-white p-1 mb-2">
            <img src={logoSrc} alt="Logo" className="w-28 h-auto object-contain grayscale contrast-200" />
          </div>
        )}

        {/* EN-TÊTE ENTREPRISE (Paramètres → Informations) */}
        <h1 className="text-[20px] font-black uppercase text-center leading-none mb-1 tracking-tighter">{config?.nomEntreprise || 'GESTOCK'}</h1>
        {config?.telephone && <p className="text-[10px] font-semibold text-center">TÉL: {config.telephone}</p>}
        {config?.adresse && <p className="text-[10px] font-semibold text-center">{config.adresse}</p>}
        {messageAccueil && <p className="text-[10px] italic text-center font-bold px-2 mt-1">{messageAccueil}</p>}

        <div className="w-full text-center my-2">{separator}</div>

        {/* INFOS FACTURE */}
        <div className="w-full space-y-0.5 mb-2">
          <div className="flex justify-between">
            <span className="font-black">FACTURE N°:</span>
            <span className="font-black">{vente.reference}</span>
          </div>
          <div className="flex justify-between"><span>DATE:</span><span>{dateAchat} à {heureAchat}</span></div>
          <div className="flex justify-between"><span>CAISSIER:</span><span>{caissier}</span></div>
          <div className="flex justify-between border-t border-dotted border-black pt-1 mt-1">
            <span>CLIENT:</span><span className="font-bold">{clientNom}</span>
          </div>
          {statutAnnulee && (
            <p className="text-center font-black text-[13px] mt-1 border-2 border-black py-0.5">*** FACTURE ANNULÉE ***</p>
          )}
        </div>


        {/* LIGNES DE VENTE */}
        <div className="w-full mb-2">
          {lignes.length === 0 ? (
            <p className="text-center text-[10px] italic py-2">Aucune ligne détaillée pour cette vente.</p>
          ) : lignes.map((l, idx) => {
              const quantite = Number(l.quantite ?? 0);
              const prixUnitaire = Number(l.prixUnitaire ?? l.prix ?? 0);
              const montant = Number(l.total ?? (quantite * prixUnitaire));
              return (
                <div key={l.id || idx} className="mb-1.5">
                  <p className="font-bold uppercase truncate">{l.designation || l.article?.designation || l.produit?.designation || 'Article'}</p>
                  <div className="flex justify-between">
                    <span>{quantite} x {prixUnitaire.toLocaleString('fr-FR')}</span>
                    <span className="font-bold">{montant.toLocaleString('fr-FR')}</span>
                  </div>
                </div>
              );
            })}
        </div>

        <div className="w-full text-center mb-2">{separator}</div>

        {/* TOTAUX */}
        <div className="w-full flex flex-col items-end gap-0.5">
          {totalRemise > 0 && (
            <div className="flex justify-between w-full items-baseline border-b border-dotted border-black pb-0.5 mb-0.5">
              <span className="text-[12px] font-bold">REMISE:</span>
              <span className="text-[12px] font-bold">-{money(totalRemise)}</span>
            </div>
          )}
          <div className="flex justify-between w-full items-baseline">
            <span className="text-[12px] font-black">TOTAL NET:</span>
            <span className="text-[19px] font-black">{money(vente.total)}</span>
          </div>
          {config?.afficherModePaiement !== false && (
            <div className="flex justify-between w-full text-[10px] mt-0.5">
              <span className="opacity-70 italic">MODE DE PAIEMENT:</span>
              <span className="font-black">{vente.modePaiement || 'CASH'}</span>
            </div>
          )}
          {(String(vente.modePaiement || '').toUpperCase() === 'CASH') && Number(vente.montantRecu || 0) > 0 && (
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

        {/* PIED DE PAGE PARAMÉTRABLE (Paramètres → Facture) */}
        <div className="w-full mt-5 border-t border-dotted border-black pt-3 flex flex-col items-center">
          <p className="font-black text-center text-[11px] uppercase">{endMessage}</p>
          <p className="text-[8px] uppercase tracking-widest opacity-50 font-bold mt-2">Généré par Gestock SaaS</p>
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
          #facture-80mm, #facture-80mm * { visibility: visible !important; }
          #facture-80mm {
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

