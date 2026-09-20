import { Prisma } from '@prisma/client';
import type { CrmCustomerProfile, CrmIdentifier, CrmSaleSummary } from './crm.types';

/**
 * Clé d'unicité composite d'un client dans son tenant.
 *
 * L'isolation multi-tenant est portée par la clé elle-même : la recherche
 * combine toujours `tenantId` et l'identifiant de canal. Une même identité
 * Messenger peut donc exister chez deux commerçants différents sans collision.
 */
export function clientUniqueWhere(
  tenantId: string,
  identifier: CrmIdentifier,
): Prisma.ClientWhereUniqueInput {
  switch (identifier.kind) {
    case 'PHONE':
      return { tenantId_telephone: { tenantId, telephone: identifier.value } };
    case 'INSTAGRAM':
      return {
        tenantId_instagramId: { tenantId, instagramId: identifier.value },
      };
    case 'MESSENGER':
      return {
        tenantId_messengerId: { tenantId, messengerId: identifier.value },
      };
  }
}

/**
 * Conversions de sortie du module CRM.
 *
 * Point clé sur les montants : l'ERP trace aujourd'hui les montants de vente en
 * `Float` (héritage du schéma Vente/LigneVente). Aucune nouvelle colonne
 * monétaire n'est introduite par le module CRM, mais la frontière HTTP ne
 * propage pas d'artefact de flottant : chaque montant est converti via
 * `Prisma.Decimal` puis sérialisé en chaîne à 2 décimales.
 */

/** Ligne Client telle que projetée par les services (typage structurel). */
export interface MappableClientRow {
  readonly id: string;
  readonly nom: string;
  readonly telephone: string | null;
  readonly instagramId: string | null;
  readonly messengerId: string | null;
  readonly depotId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export function toCustomerProfile(row: MappableClientRow): CrmCustomerProfile {
  return {
    id: row.id,
    nom: row.nom,
    telephone: row.telephone,
    instagramId: row.instagramId,
    messengerId: row.messengerId,
    depotId: row.depotId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Formate un montant lu en base sans exposer d'imprécision d'arrondi.
 * Valeur non finie (donnée corrompue en base) → « 0.00 » plutôt qu'un crash.
 */
export function formatAmount(value: number | Prisma.Decimal): string {
  if (typeof value === 'number' && !Number.isFinite(value)) return '0.00';
  return new Prisma.Decimal(value).toFixed(2);
}

/** Ligne Vente projetée pour l'historique d'achats. */
export interface MappableSaleRow {
  readonly id: string;
  readonly reference: string;
  readonly date: Date;
  readonly statut: string;
  readonly modePaiement: string;
  readonly total: number;
}

export function toSaleSummary(row: MappableSaleRow): CrmSaleSummary {
  return {
    id: row.id,
    reference: row.reference,
    date: row.date.toISOString(),
    statut: row.statut,
    modePaiement: row.modePaiement,
    total: formatAmount(row.total),
  };
}