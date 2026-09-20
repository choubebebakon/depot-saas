/**
 * §10 — Granularité des rapports (dépôt de boissons).
 * Le type de rapport demandé détermine le sous-module de permission requis :
 *   - 'stock'        → rapports_stock       (MAGASINIER)
 *   - 'commissions'  → rapports_performance (COMMERCIAL)
 *   - tout le reste  → rapports             (financier : GERANT/COMPTABLE/PATRON)
 * Deny-by-default : toute combinaison absente de la table Permission est refusée.
 */
const RAPPORT_SOUS_MODULE_PAR_TYPE: Record<string, string> = {
  stock: 'rapports_stock',
  commissions: 'rapports_performance',
};

export function rapportSousModule(type: string): string {
  return RAPPORT_SOUS_MODULE_PAR_TYPE[type] ?? 'rapports';
}
